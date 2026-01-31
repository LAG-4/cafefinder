from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class Offer:
    title: str
    mode: str
    type: str
    value: float | None
    currency: str | None
    min_spend: float | None
    max_discount: float | None
    coupon_code: str | None
    payment_instrument: str | None
    validity_text: str | None
    terms: str | None
    source: dict[str, str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "mode": self.mode,
            "type": self.type,
            "value": self.value,
            "currency": self.currency,
            "minSpend": self.min_spend,
            "maxDiscount": self.max_discount,
            "couponCode": self.coupon_code,
            "paymentInstrument": self.payment_instrument,
            "validityText": self.validity_text,
            "terms": self.terms,
            "source": self.source,
        }


@dataclass
class ProviderParseResult:
    provider_key: str
    source_url: str
    status: str
    fetched_at: datetime
    offers: list[Offer]
    raw_offer_texts: list[str]
    error_message: str | None = None
    http_status: int | None = None

    def to_firestore(self) -> dict[str, Any]:
        return {
            "sourceUrl": self.source_url,
            "fetchedAt": self.fetched_at,
            "status": self.status,
            "stale": self.status != "ok",
            "parserVersion": "0.1.0",
            "offers": [offer.to_dict() for offer in self.offers],
            "rawOfferTexts": self.raw_offer_texts,
            "errorMessage": self.error_message,
        }
