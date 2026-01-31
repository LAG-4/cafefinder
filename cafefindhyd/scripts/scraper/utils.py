from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from urllib.parse import urlparse


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def get_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except ValueError:
        return ""


def hash_offers(offers: list[dict]) -> str:
    payload = json.dumps(offers, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
