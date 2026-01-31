from __future__ import annotations

import random
import threading
import time
from datetime import datetime, timedelta, timezone

from .config import BLOCK_BACKOFF_HOURS, DOMAIN_JITTER_SECONDS


class DomainThrottle:
    def __init__(self) -> None:
        self._locks: dict[str, threading.Semaphore] = {}
        self._blocked_until: dict[str, datetime] = {}
        self._lock = threading.Lock()

    def acquire(self, domain: str) -> threading.Semaphore:
        with self._lock:
            semaphore = self._locks.setdefault(domain, threading.Semaphore(1))
        semaphore.acquire()
        return semaphore

    def release(self, semaphore: threading.Semaphore) -> None:
        semaphore.release()

    def is_blocked(self, domain: str) -> bool:
        with self._lock:
            blocked_until = self._blocked_until.get(domain)
        if not blocked_until:
            return False
        return datetime.now(timezone.utc) < blocked_until

    def block_domain(self, domain: str, hours: int = BLOCK_BACKOFF_HOURS) -> None:
        with self._lock:
            self._blocked_until[domain] = datetime.now(timezone.utc) + timedelta(
                hours=hours
            )

    def jitter_sleep(self) -> None:
        min_seconds, max_seconds = DOMAIN_JITTER_SECONDS
        time.sleep(random.uniform(min_seconds, max_seconds))
