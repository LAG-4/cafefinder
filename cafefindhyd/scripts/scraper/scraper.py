from __future__ import annotations

import argparse
import logging
import re
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from .config import (
    DEFAULT_PROVIDERS,
    GLOBAL_CONCURRENCY,
    REQUEST_TIMEOUT_SECONDS,
    USER_AGENT,
)
from .firestore_client import get_firestore_client, server_timestamp
from .models import ProviderParseResult
from .providers import get_parser
from .throttling import DomainThrottle
from .utils import get_domain, hash_offers, now_utc


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def main() -> None:
    args = parse_args()
    firestore = get_firestore_client(args.credentials)
    throttle = DomainThrottle()
    run_id = uuid.uuid4().hex
    run_ref = firestore.collection("scrapeRuns").document(run_id)
    run_ref.set(
        {
            "startedAt": server_timestamp(),
            "status": "running",
            "counts": {"ok": 0, "blocked": 0, "error": 0, "parse_error": 0},
            "providers": {},
        }
    )

    places = load_places(firestore)
    if args.place_id:
        allowed = {place_id.strip() for place_id in args.place_id if place_id.strip()}
        places = [place for place in places if place.get("id") in allowed]
        missing = allowed - {place.get("id") for place in places}
        if missing:
            logging.warning("Place IDs not found: %s", ", ".join(sorted(missing)))
    logging.info("Loaded %s places", len(places))

    tasks: list[dict[str, Any]] = []
    for place in places:
        platforms = resolve_platforms(place)
        place_offers = load_place_offers(firestore, place["id"])
        for provider_key, config in DEFAULT_PROVIDERS.items():
            provider_entry = platforms.get(provider_key) or {}
            url = provider_entry.get("url")
            if not url:
                continue

            if provider_key == "swiggy_dineout":
                normalized = normalize_swiggy_dineout_url(url)
                if not normalized:
                    continue
                url = normalized
            existing_provider = (
                (place_offers.get("providers") or {}).get(provider_key)
                if place_offers
                else None
            )
            if not should_scrape(
                existing_provider, provider_entry, config.refresh_hours, args.force
            ):
                continue
            tasks.append(
                {
                    "place_id": place["id"],
                    "provider_key": provider_key,
                    "url": url,
                    "existing_provider": existing_provider,
                }
            )

    logging.info("Queued %s scrape tasks", len(tasks))

    counts = {"ok": 0, "blocked": 0, "error": 0, "parse_error": 0}
    provider_counts: dict[str, dict[str, int]] = {}

    with ThreadPoolExecutor(max_workers=GLOBAL_CONCURRENCY) as executor:
        futures = [
            executor.submit(
                run_task,
                firestore,
                throttle,
                task["place_id"],
                task["provider_key"],
                task["url"],
                task["existing_provider"],
            )
            for task in tasks
        ]
        for future in as_completed(futures):
            result = future.result()
            counts[result.status] = counts.get(result.status, 0) + 1
            provider_stats = provider_counts.setdefault(result.provider_key, {})
            provider_stats[result.status] = provider_stats.get(result.status, 0) + 1

    run_ref.set(
        {
            "finishedAt": server_timestamp(),
            "status": "done",
            "counts": counts,
            "providers": provider_counts,
        },
        merge=True,
    )

    logging.info("Run complete: %s", counts)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape dining offers for places")
    parser.add_argument(
        "--credentials",
        help="Path to Firebase service account JSON",
        default=None,
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force refresh even if not due",
    )
    parser.add_argument(
        "--place-id",
        action="append",
        help="Restrict run to a specific placeId (repeatable)",
    )
    return parser.parse_args()


def load_places(firestore) -> list[dict[str, Any]]:
    docs = firestore.collection("places").stream()
    places = []
    for doc in docs:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        places.append(data)
    return places


def resolve_platforms(place: dict[str, Any]) -> dict[str, Any]:
    platforms = place.get("platforms")
    if not isinstance(platforms, dict):
        platforms = {}
    for key, value in place.items():
        if not isinstance(key, str):
            continue
        if not key.startswith("platforms.") or not key.endswith(".url"):
            continue
        parts = key.split(".")
        if len(parts) < 3:
            continue
        provider_key = parts[1]
        if provider_key in platforms:
            continue
        if isinstance(value, str) and value.strip():
            platforms[provider_key] = {"url": value.strip()}
    return platforms


def load_place_offers(firestore, place_id: str) -> dict[str, Any] | None:
    doc = firestore.collection("placeOffers").document(place_id).get()
    if not doc.exists:
        return None
    return doc.to_dict() or None


def should_scrape(
    existing_provider: dict[str, Any] | None,
    provider_entry: dict[str, Any],
    refresh_hours: int,
    force: bool,
) -> bool:
    if force or provider_entry.get("forceRefresh"):
        return True
    if not existing_provider:
        return True
    fetched_at = existing_provider.get("fetchedAt")
    if not fetched_at:
        return True
    if isinstance(fetched_at, datetime):
        fetched_at = (
            fetched_at.replace(tzinfo=timezone.utc)
            if fetched_at.tzinfo is None
            else fetched_at
        )
    return now_utc() - fetched_at > timedelta(hours=refresh_hours)


def run_task(
    firestore,
    throttle: DomainThrottle,
    place_id: str,
    provider_key: str,
    url: str,
    existing_provider: dict[str, Any] | None,
) -> ProviderParseResult:
    domain = get_domain(url)
    if not domain:
        result = ProviderParseResult(
            provider_key=provider_key,
            source_url=url,
            status="error",
            fetched_at=now_utc(),
            offers=[],
            raw_offer_texts=[],
            error_message="Invalid URL",
        )
        write_provider_result(
            firestore, place_id, provider_key, result, existing_provider
        )
        return result

    if throttle.is_blocked(domain):
        result = ProviderParseResult(
            provider_key=provider_key,
            source_url=url,
            status="blocked",
            fetched_at=now_utc(),
            offers=[],
            raw_offer_texts=[],
            error_message="Domain temporarily blocked",
        )
        write_provider_result(
            firestore, place_id, provider_key, result, existing_provider
        )
        return result

    semaphore = throttle.acquire(domain)
    try:
        throttle.jitter_sleep()
        response = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        result = ProviderParseResult(
            provider_key=provider_key,
            source_url=url,
            status="error",
            fetched_at=now_utc(),
            offers=[],
            raw_offer_texts=[],
            error_message=str(exc),
        )
        write_provider_result(
            firestore, place_id, provider_key, result, existing_provider
        )
        return result
    finally:
        throttle.release(semaphore)

    if response.status_code in (403, 429):
        throttle.block_domain(domain)
        result = ProviderParseResult(
            provider_key=provider_key,
            source_url=url,
            status="blocked",
            fetched_at=now_utc(),
            offers=[],
            raw_offer_texts=[],
            error_message=f"HTTP {response.status_code}",
            http_status=response.status_code,
        )
        write_provider_result(
            firestore, place_id, provider_key, result, existing_provider
        )
        return result

    if response.status_code >= 400:
        result = ProviderParseResult(
            provider_key=provider_key,
            source_url=url,
            status="error",
            fetched_at=now_utc(),
            offers=[],
            raw_offer_texts=[],
            error_message=f"HTTP {response.status_code}",
            http_status=response.status_code,
        )
        write_provider_result(
            firestore, place_id, provider_key, result, existing_provider
        )
        return result

    parser = get_parser(provider_key)
    if not parser:
        result = ProviderParseResult(
            provider_key=provider_key,
            source_url=url,
            status="parse_error",
            fetched_at=now_utc(),
            offers=[],
            raw_offer_texts=[],
            error_message="Parser not implemented",
        )
        write_provider_result(
            firestore, place_id, provider_key, result, existing_provider
        )
        return result

    result = parser.parse(response.text, url)
    write_provider_result(firestore, place_id, provider_key, result, existing_provider)
    return result


def write_provider_result(
    firestore,
    place_id: str,
    provider_key: str,
    result: ProviderParseResult,
    existing_provider: dict[str, Any] | None,
) -> None:
    provider_update: dict[str, Any] = {
        "sourceUrl": result.source_url,
        "fetchedAt": result.fetched_at,
        "status": result.status,
        "stale": result.status != "ok",
        "parserVersion": "0.1.0",
    }

    if result.status == "ok" and result.offers:
        offer_dicts = [offer.to_dict() for offer in result.offers]
        offer_hash = hash_offers(offer_dicts)
        existing_hash = existing_provider.get("hash") if existing_provider else None
        provider_update["hash"] = offer_hash
        provider_update["errorMessage"] = None
        if offer_hash != existing_hash:
            provider_update["offers"] = offer_dicts
            if result.raw_offer_texts:
                provider_update["rawOfferTexts"] = result.raw_offer_texts
    else:
        provider_update["errorMessage"] = result.error_message
        if result.raw_offer_texts:
            provider_update["rawOfferTexts"] = result.raw_offer_texts

    firestore.collection("placeOffers").document(place_id).set(
        {
            "updatedAt": server_timestamp(),
            "providers": {provider_key: provider_update},
        },
        merge=True,
    )


_SWIGGY_REST_ID_RE = re.compile(r"(?:-|/)(\d{4,})(?:/|$)")
_SWIGGY_REST_TOKEN_RE = re.compile(r"rest(\d{4,})", re.IGNORECASE)


def normalize_swiggy_dineout_url(url: str) -> str | None:
    if "/dineout" in url:
        return url

    match = _SWIGGY_REST_TOKEN_RE.search(url)
    if match:
        rest_id = match.group(1)
        return f"https://www.swiggy.com/restaurants/{rest_id}/dineout"

    match = _SWIGGY_REST_ID_RE.search(url)
    if match:
        rest_id = match.group(1)
        return f"https://www.swiggy.com/restaurants/{rest_id}/dineout"

    return None


if __name__ == "__main__":
    main()
