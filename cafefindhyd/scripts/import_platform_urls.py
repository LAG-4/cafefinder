from __future__ import annotations

import argparse
import csv
import logging
from typing import Any
from urllib.parse import urlparse

from scripts.scraper.config import DEFAULT_PROVIDERS
from scripts.scraper.firestore_client import get_firestore_client


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def main() -> None:
    args = parse_args()
    firestore = get_firestore_client(args.credentials)
    seen_urls: dict[str, str] = {}

    with open(args.csv_path, "r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row_index, row in enumerate(reader, start=2):
            normalized = normalize_row(row)
            place_id = normalized.get("placeid") or normalized.get("place_id") or ""
            slug = normalized.get("slug") or ""
            name = normalized.get("name") or ""
            location = normalized.get("location") or normalized.get("area") or ""

            if not place_id and not slug and not name:
                logging.warning("Row %s missing placeId/slug/name", row_index)
                continue

            if not place_id:
                if slug:
                    place_id = resolve_place_id(firestore, slug) or ""
                if not place_id and name:
                    place_id = (
                        resolve_place_id_from_name(firestore, name, location) or ""
                    )

            if not place_id:
                logging.warning(
                    "Row %s place not found for name=%s slug=%s", row_index, name, slug
                )
                continue

            provider_updates: dict[str, Any] = {}
            url_count = 0
            for provider_key, config in DEFAULT_PROVIDERS.items():
                raw_url = get_provider_url(normalized, provider_key)
                if not raw_url:
                    continue
                if not is_valid_url(raw_url, config.expected_domains):
                    logging.warning(
                        "Row %s invalid %s url: %s", row_index, provider_key, raw_url
                    )
                    continue
                if raw_url in seen_urls and seen_urls[raw_url] != place_id:
                    logging.warning(
                        "Row %s duplicate url already used by %s: %s",
                        row_index,
                        seen_urls[raw_url],
                        raw_url,
                    )
                    continue
                seen_urls[raw_url] = place_id
                provider_updates[f"platforms.{provider_key}.url"] = raw_url
                url_count += 1

            if not provider_updates:
                continue

            provider_updates["platformCoverageIncomplete"] = url_count < 3
            firestore.collection("places").document(place_id).update(provider_updates)
            logging.info("Updated %s with %s urls", place_id, url_count)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import provider URLs into places")
    parser.add_argument("csv_path", help="Path to CSV export")
    parser.add_argument(
        "--credentials",
        help="Path to Firebase service account JSON",
        default=None,
    )
    return parser.parse_args()


def resolve_place_id(firestore, slug: str) -> str | None:
    if not slug:
        return None
    query = firestore.collection("places").where("slug", "==", slug).limit(2).stream()
    docs = list(query)
    if len(docs) != 1:
        return None
    return docs[0].id


def resolve_place_id_from_name(firestore, name: str, location: str) -> str | None:
    if not name:
        return None
    query = firestore.collection("places").where("name", "==", name).stream()
    docs = list(query)
    if not docs:
        return None
    if location:
        filtered = [
            doc for doc in docs if (doc.to_dict() or {}).get("area") == location
        ]
        if len(filtered) == 1:
            return filtered[0].id
    if len(docs) == 1:
        return docs[0].id
    return None


def normalize_row(row: dict[str, Any]) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for key, value in row.items():
        if key is None:
            continue
        normalized_key = key.strip().lower()
        normalized[normalized_key] = (value or "").strip()
    return normalized


def get_provider_url(normalized: dict[str, str], provider_key: str) -> str:
    for alias in PROVIDER_COLUMN_ALIASES.get(provider_key, (provider_key,)):
        value = normalized.get(alias, "")
        if value:
            return value
    return ""


def is_valid_url(url: str, expected_domains: tuple[str, ...]) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        return False
    domain = parsed.netloc.lower()
    return any(domain.endswith(expected) for expected in expected_domains)


PROVIDER_COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "zomato": ("zomato",),
    "swiggy_dineout": ("swiggy_dineout", "swiggy"),
    "eazydiner": ("eazydiner", "eazydiner.com"),
    "dineout": ("dineout",),
}


if __name__ == "__main__":
    main()
