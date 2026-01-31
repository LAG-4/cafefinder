from __future__ import annotations

import re
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests

from ..config import REQUEST_TIMEOUT_SECONDS, USER_AGENT
from ..models import ProviderParseResult
from ..normalization import normalize_offer_text
from .base import build_result


_BUILD_ID_RE = re.compile(r"/_next/static/([^/]+)/_buildManifest\.js")


class EazydinerParser:
    key = "eazydiner"

    def parse(self, html: str, source_url: str) -> ProviderParseResult:
        fetched_at = datetime.now(timezone.utc)
        build_id = _extract_build_id(html)
        if not build_id:
            return build_result(
                self.key,
                source_url,
                fetched_at,
                offers=[],
                raw_offer_texts=[],
                status="parse_error",
                error_message="Build ID not found",
            )

        data_url = _build_data_url(source_url, build_id)
        if not data_url:
            return build_result(
                self.key,
                source_url,
                fetched_at,
                offers=[],
                raw_offer_texts=[],
                status="parse_error",
                error_message="Data URL not resolved",
            )

        try:
            response = requests.get(
                data_url,
                headers={"User-Agent": USER_AGENT},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            return build_result(
                self.key,
                source_url,
                fetched_at,
                offers=[],
                raw_offer_texts=[],
                status="error",
                error_message=str(exc),
            )

        if response.status_code >= 400:
            return build_result(
                self.key,
                source_url,
                fetched_at,
                offers=[],
                raw_offer_texts=[],
                status="error",
                error_message=f"HTTP {response.status_code}",
            )

        try:
            data = response.json()
        except ValueError:
            return build_result(
                self.key,
                source_url,
                fetched_at,
                offers=[],
                raw_offer_texts=[],
                status="parse_error",
                error_message="Invalid JSON response",
            )

        raw_texts = _extract_offer_texts_from_json(data)
        offers = [
            normalize_offer_text(text, self.key, source_url) for text in raw_texts
        ]

        if not offers:
            return build_result(
                self.key,
                source_url,
                fetched_at,
                offers=[],
                raw_offer_texts=raw_texts,
                status="parse_error",
                error_message="No offers found in data",
            )

        return build_result(
            self.key,
            source_url,
            fetched_at,
            offers=offers,
            raw_offer_texts=raw_texts,
        )


def _extract_build_id(html: str) -> str | None:
    match = _BUILD_ID_RE.search(html)
    if match:
        return match.group(1)
    return None


def _build_data_url(source_url: str, build_id: str) -> str | None:
    parsed = urlparse(source_url)
    if not parsed.scheme or not parsed.netloc:
        return None
    path = parsed.path.lstrip("/")
    if not path:
        return None
    return f"{parsed.scheme}://{parsed.netloc}/_next/data/{build_id}/{path}.json"


def _extract_offer_texts_from_json(data: dict) -> list[str]:
    raw_texts: list[str] = []
    detail_page = data.get("pageProps", {}).get("detailPage", {})
    detail_data = detail_page.get("data", {})
    eazypay_details = detail_data.get("eazypay_details", {})
    if isinstance(eazypay_details, dict):
        text = eazypay_details.get("text") or eazypay_details.get("summary_text")
        if isinstance(text, str) and text.strip():
            raw_texts.append(text.strip())

    meta = detail_page.get("meta", {})
    json_schema = (
        meta.get("jsonSchema", {}).get("json_schema", {})
        if isinstance(meta, dict)
        else {}
    )
    for item in json_schema.get("@graph", []) if isinstance(json_schema, dict) else []:
        if not isinstance(item, dict):
            continue
        if item.get("@type") != "FAQPage":
            continue
        for q in item.get("mainEntity", []):
            if not isinstance(q, dict):
                continue
            name = q.get("name", "")
            if not isinstance(name, str):
                continue
            if "deal" in name.lower() or "offer" in name.lower():
                answer = q.get("acceptedAnswer", {}).get("text")
                if isinstance(answer, str) and answer.strip():
                    raw_texts.append(answer.strip())

    deduped: list[str] = []
    seen: set[str] = set()
    for text in raw_texts:
        if text in seen:
            continue
        seen.add(text)
        deduped.append(text)
    return deduped
