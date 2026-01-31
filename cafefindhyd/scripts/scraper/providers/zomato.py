from __future__ import annotations

from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ..models import ProviderParseResult
from ..normalization import extract_offer_texts, normalize_offer_text
from .base import build_result


class ZomatoParser:
    key = "zomato"

    def parse(self, html: str, source_url: str) -> ProviderParseResult:
        soup = BeautifulSoup(html, "html.parser")
        raw_texts = _extract_offer_cards(soup)
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


def _extract_offer_cards(soup: BeautifulSoup) -> list[str]:
    raw_texts: list[str] = []
    for card in soup.select(".offer-card"):
        title = _text(card.select_one(".offer-title"))
        subtitle = _text(card.select_one(".offer-sub-title"))
        desc = _text(card.select_one(".offer-sub-desc"))
        combined = " ".join(part for part in (title, subtitle, desc) if part)
        if combined:
            raw_texts.append(combined)
    return raw_texts


def _text(node) -> str:
    if not node:
        return ""
    return " ".join(node.stripped_strings).strip()
