from collections import deque
from dataclasses import dataclass, field
from threading import Lock
from time import time


@dataclass
class WindowCounter:
    hits: deque[float] = field(default_factory=deque)


class InMemoryRateLimiter:
    """
    Lightweight in-memory limiter for single-instance deployments.
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._counters: dict[str, WindowCounter] = {}

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time()
        cutoff = now - window_seconds
        with self._lock:
            counter = self._counters.setdefault(key, WindowCounter())
            while counter.hits and counter.hits[0] < cutoff:
                counter.hits.popleft()
            if len(counter.hits) >= limit:
                return False
            counter.hits.append(now)
            return True


rate_limiter = InMemoryRateLimiter()
