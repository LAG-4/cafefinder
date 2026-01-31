from __future__ import annotations

import re
from typing import Iterable

from .models import Offer


_PERCENT_RE = re.compile(r"(\d{1,2})\s?%")
_FLAT_RE = re.compile(r"(?:flat|save|off)\s+₹?\s*(\d{2,5})", re.IGNORECASE)
_CASHBACK_RE = re.compile(r"cashback\s+₹?\s*(\d{2,5})", re.IGNORECASE)
_COUPON_RE = re.compile(r"code\s+([A-Z0-9]{4,10})", re.IGNORECASE)
_UPTO_RE = re.compile(r"(?:up\s*to|upto)\s+₹?\s*(\d{2,6})", re.IGNORECASE)


def normalize_offer_text(
    raw_text: str,
    provider_key: str,
    source_url: str,
) -> Offer:
    title = raw_text.strip()
    mode = _infer_mode(raw_text)
    offer_type, value = _infer_type_and_value(raw_text)
    coupon_code = _extract_coupon(raw_text)
    max_discount = _extract_max_discount(raw_text)
    currency = "INR" if value or max_discount else None

    return Offer(
        title=title,
        mode=mode,
        type=offer_type,
        value=value,
        currency=currency,
        min_spend=None,
        max_discount=max_discount,
        coupon_code=coupon_code,
        payment_instrument=_extract_payment_instrument(raw_text),
        validity_text=None,
        terms=None,
        source={"providerKey": provider_key, "sourceUrl": source_url},
    )


def extract_offer_texts(lines: Iterable[str], limit: int = 25) -> list[str]:
    seen: set[str] = set()
    results: list[str] = []
    for line in lines:
        candidate = " ".join(line.split())
        if not candidate or len(candidate) < 6:
            continue
        if not _looks_like_offer(candidate):
            continue
        if candidate in seen:
            continue
        seen.add(candidate)
        results.append(candidate)
        if len(results) >= limit:
            break
    return results


def _looks_like_offer(text: str) -> bool:
    lowered = text.lower()
    keywords = ["%", "off", "cashback", "flat", "save", "bank", "offer"]
    return any(keyword in lowered for keyword in keywords)


def _infer_mode(text: str) -> str:
    lowered = text.lower()
    if "pre-book" in lowered or "prebook" in lowered:
        return "prebook"
    if "walk-in" in lowered or "walkin" in lowered:
        return "walkin"
    if "bill" in lowered:
        return "billpay"
    if "bank" in lowered:
        return "bank"
    return "unknown"


def _infer_type_and_value(text: str) -> tuple[str, float | None]:
    percent_match = _PERCENT_RE.search(text)
    if percent_match:
        return "percentage", float(percent_match.group(1))
    cashback_match = _CASHBACK_RE.search(text)
    if cashback_match:
        return "cashback", float(cashback_match.group(1))
    flat_match = _FLAT_RE.search(text)
    if flat_match:
        return "flat", float(flat_match.group(1))
    if "coupon" in text.lower() or "code" in text.lower():
        return "coupon", None
    return "unknown", None


def _extract_coupon(text: str) -> str | None:
    match = _COUPON_RE.search(text)
    if match:
        return match.group(1).upper()
    return None


def _extract_max_discount(text: str) -> float | None:
    match = _UPTO_RE.search(text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return None
    return None


def _extract_payment_instrument(text: str) -> str | None:
    lowered = text.lower()
    for bank in ("hdfc", "icici", "sbi", "axis", "amex", "kotak"):
        if bank in lowered:
            return bank.upper()
    return None
