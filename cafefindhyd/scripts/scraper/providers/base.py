from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from ..models import Offer, ProviderParseResult


class ProviderParser(Protocol):
    key: str

    def parse(self, html: str, source_url: str) -> ProviderParseResult: ...


@dataclass
class ParserContext:
    fetched_at: datetime


def build_result(
    provider_key: str,
    source_url: str,
    fetched_at: datetime,
    offers: list[Offer],
    raw_offer_texts: list[str],
    error_message: str | None = None,
    status: str = "ok",
) -> ProviderParseResult:
    return ProviderParseResult(
        provider_key=provider_key,
        source_url=source_url,
        status=status,
        fetched_at=fetched_at,
        offers=offers,
        raw_offer_texts=raw_offer_texts,
        error_message=error_message,
    )
