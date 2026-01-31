from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderConfig:
    key: str
    expected_domains: tuple[str, ...]
    refresh_hours: int = 24


DEFAULT_PROVIDERS: dict[str, ProviderConfig] = {
    "zomato": ProviderConfig(
        key="zomato",
        expected_domains=("zomato.com",),
        refresh_hours=24,
    ),
    "swiggy_dineout": ProviderConfig(
        key="swiggy_dineout",
        expected_domains=("swiggy.com",),
        refresh_hours=24,
    ),
    "eazydiner": ProviderConfig(
        key="eazydiner",
        expected_domains=("eazydiner.com",),
        refresh_hours=24,
    ),
    "dineout": ProviderConfig(
        key="dineout",
        expected_domains=("dineout.co.in", "dineout.com"),
        refresh_hours=24,
    ),
}

GLOBAL_CONCURRENCY = 4
DOMAIN_JITTER_SECONDS = (5, 20)
BLOCK_BACKOFF_HOURS = 6
REQUEST_TIMEOUT_SECONDS = 20
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
