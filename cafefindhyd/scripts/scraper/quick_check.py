from __future__ import annotations

import argparse
import sys

import requests

from .config import REQUEST_TIMEOUT_SECONDS, USER_AGENT
from .providers import get_parser


DEFAULT_PAIRS = [
    "zomato=https://www.zomato.com/hyderabad/hard-rock-cafe-banjara-hills",
    "swiggy_dineout=https://www.swiggy.com/restaurants/hard-rock-cafe-hitech-city-hyderabad-hitech-city-madhapur-467233/dineout",
    "eazydiner=https://www.eazydiner.com/hyderabad/hard-rock-cafe-hitech-city-hyderabad-674068",
]


def main() -> None:
    args = parse_args()
    pairs = args.pair or DEFAULT_PAIRS
    for pair in pairs:
        provider_key, url = split_pair(pair)
        parser = get_parser(provider_key)
        if not parser:
            print(f"[{provider_key}] No parser registered")
            continue
        try:
            html = fetch_html(url)
        except requests.RequestException as exc:
            print(f"[{provider_key}] Fetch failed: {exc}")
            continue
        result = parser.parse(html, url)
        print(f"\n[{provider_key}] status={result.status}")
        if result.error_message:
            print(f"error: {result.error_message}")
        if not result.offers:
            print("offers: none")
        else:
            print("offers:")
            for offer in result.offers:
                print(f"- {offer.title}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Quick check for offer parsing")
    parser.add_argument(
        "--pair",
        action="append",
        help="provider=url (repeatable)",
    )
    return parser.parse_args()


def split_pair(pair: str) -> tuple[str, str]:
    if "=" not in pair:
        print(f"Invalid pair: {pair}")
        sys.exit(1)
    provider_key, url = pair.split("=", 1)
    return provider_key.strip(), url.strip()


def fetch_html(url: str) -> str:
    response = requests.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.text


if __name__ == "__main__":
    main()
