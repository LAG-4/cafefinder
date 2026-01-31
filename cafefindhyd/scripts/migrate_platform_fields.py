from __future__ import annotations

import argparse
import logging
from typing import Any

from scripts.scraper.config import DEFAULT_PROVIDERS
from scripts.scraper.firestore_client import get_firestore_client
from scripts.import_platform_urls import is_valid_url


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "zomato": ("zomato", "Zomato", "zomato_url", "Zomato URL"),
    "swiggy_dineout": ("swiggy", "Swiggy", "swiggy_dineout", "Swiggy Dineout"),
    "eazydiner": ("eazydiner", "Eazydiner", "EazyDiner"),
    "dineout": ("dineout", "Dineout"),
}


def main() -> None:
    args = parse_args()
    firestore = get_firestore_client(args.credentials)

    docs = firestore.collection("places").stream()
    updated = 0
    skipped = 0
    for doc in docs:
        data = doc.to_dict() or {}
        updates = build_updates(data)
        if not updates:
            skipped += 1
            continue
        if args.dry_run:
            logging.info("[dry-run] %s -> %s", doc.id, updates)
        else:
            firestore.collection("places").document(doc.id).set(updates, merge=True)
            updated += 1

    logging.info("Done. Updated: %s, Skipped: %s", updated, skipped)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill places.platforms.*.url from existing fields"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Firebase service account JSON",
        default=None,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Log updates without writing",
    )
    return parser.parse_args()


def build_updates(data: dict[str, Any]) -> dict[str, Any] | None:
    updates: dict[str, Any] = {}
    platforms = data.get("platforms") or {}
    url_count = 0

    for provider_key, config in DEFAULT_PROVIDERS.items():
        existing_url = _get_existing_url(platforms, provider_key)
        if existing_url:
            url_count += 1
            continue

        url = _find_alias_url(data, FIELD_ALIASES.get(provider_key, ()))
        if not url:
            continue
        if not is_valid_url(url, config.expected_domains):
            logging.warning("Invalid %s url: %s", provider_key, url)
            continue

        updates[f"platforms.{provider_key}.url"] = url
        url_count += 1

    if updates:
        updates["platformCoverageIncomplete"] = url_count < 3
        return updates
    return None


def _get_existing_url(platforms: dict[str, Any], provider_key: str) -> str | None:
    existing = platforms.get(provider_key) or {}
    if isinstance(existing, dict):
        url = existing.get("url")
        if isinstance(url, str) and url.strip():
            return url.strip()
    return None


def _find_alias_url(data: dict[str, Any], aliases: tuple[str, ...]) -> str | None:
    for key in aliases:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


if __name__ == "__main__":
    main()
