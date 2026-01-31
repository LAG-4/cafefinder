from __future__ import annotations

from datetime import datetime, timezone
import json

from bs4 import BeautifulSoup

from ..models import ProviderParseResult
from ..normalization import extract_offer_texts, normalize_offer_text
from .base import build_result


class SwiggyDineoutParser:
    key = "swiggy_dineout"

    def parse(self, html: str, source_url: str) -> ProviderParseResult:
        soup = BeautifulSoup(html, "html.parser")
        raw_texts = _extract_offer_texts_from_next_data(soup)
        if not raw_texts:
            texts = [text for text in soup.stripped_strings]
            raw_texts = extract_offer_texts(texts)
        offers = [
            normalize_offer_text(text, self.key, source_url) for text in raw_texts
        ]
        fetched_at = datetime.now(timezone.utc)

        if not offers:
            return build_result(
                self.key,
                source_url,
                fetched_at,
                offers=[],
                raw_offer_texts=raw_texts,
                status="parse_error",
                error_message="No offer-like text found",
            )

        return build_result(
            self.key,
            source_url,
            fetched_at,
            offers=offers,
            raw_offer_texts=raw_texts,
        )


def _extract_offer_texts_from_next_data(soup: BeautifulSoup) -> list[str]:
    next_data = soup.find("script", id="__NEXT_DATA__")
    if not next_data or not next_data.string:
        return []
    try:
        data = json.loads(next_data.string)
    except json.JSONDecodeError:
        return []

    cards = (
        data.get("props", {})
        .get("pageProps", {})
        .get("widgetResponse", {})
        .get("success", {})
        .get("cards", [])
    )
    raw_texts: list[str] = []
    for card in cards:
        offers_block = card.get("card", {}).get("card", {}).get("offers")
        if not offers_block:
            continue
        if isinstance(offers_block, dict):
            items = []
            if offers_block.get("dealOffer"):
                items.append(offers_block.get("dealOffer"))
            items.extend(offers_block.get("dealOffers", []))
        elif isinstance(offers_block, list):
            items = offers_block
        else:
            continue

        for item in items:
            if not isinstance(item, dict):
                continue
            combined = _combine_offer_item(item)
            if combined:
                raw_texts.append(combined)

    deduped: list[str] = []
    seen: set[str] = set()
    for text in raw_texts:
        if text in seen:
            continue
        seen.add(text)
        deduped.append(text)
    return deduped


def _combine_offer_item(item: dict) -> str:
    parts: list[str] = []
    for key in ("title", "subtitle"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value.strip())
    details = item.get("offerDetails", {})
    if isinstance(details, dict):
        for key in ("title", "subtitle"):
            value = details.get(key)
            if isinstance(value, str) and value.strip():
                parts.append(value.strip())
    return " ".join(parts)
