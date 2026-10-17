"""
Redis Client & Fast Cache Service
Provides distributed caching for ArmorIQ Intent Tokens, Pub/Sub event broadcasting,
and blast-radius query caching with transparent in-memory fallback.
"""

import json
import time
import logging
from typing import Dict, Any, Optional, List
from threading import Lock

from backend.core.config import settings

logger = logging.getLogger("recallguard.redis")


class InMemoryFallbackStore:
    """Thread-safe in-memory key-value store with TTL emulation for local fallback."""

    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self._lock = Lock()
        self._subscribers: List[Any] = []

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        with self._lock:
            self._store[key] = value
            if ex:
                self._expiry[key] = time.time() + ex
            elif key in self._expiry:
                del self._expiry[key]
        return True

    def get(self, key: str) -> Optional[str]:
        with self._lock:
            if key in self._expiry and time.time() > self._expiry[key]:
                del self._store[key]
                del self._expiry[key]
                return None
            return self._store.get(key)

    def delete(self, *keys: str) -> int:
        count = 0
        with self._lock:
            for k in keys:
                if k in self._store:
                    del self._store[k]
                    count += 1
                if k in self._expiry:
                    del self._expiry[k]
        return count

    def keys(self, pattern: str = "*") -> List[str]:
        with self._lock:
            now = time.time()
            valid_keys = []
            for k, val in list(self._store.items()):
                if k in self._expiry and now > self._expiry[k]:
                    del self._store[k]
                    del self._expiry[k]
                else:
                    valid_keys.append(k)
            return valid_keys


class RedisService:
    """Enterprise Redis service managing tokens, graph caching, and SSE pub/sub."""

    def __init__(self):
        self.is_connected = False
        self.client = None
        self.fallback = InMemoryFallbackStore()
        self._init_connection()

    def _init_connection(self):
        if not settings.REDIS_ENABLED:
            logger.info("[Redis] Redis disabled via settings. Running in-memory cache mode.")
            return

        try:
            import redis
            client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.5
            )
            client.ping()
            self.client = client
            self.is_connected = True
            logger.info(f"[Redis] Connected successfully to Redis at {settings.REDIS_URL}")
        except Exception as e:
            self.is_connected = False
            self.client = None
            logger.info(f"[Redis] Live Redis unavailable ({e}). Gracefully active with in-memory fallback.")

    # -------------------------------------------------------------
    # 1. ArmorIQ Intent Token & Plan Caching
    # -------------------------------------------------------------
    def set_intent_token(self, token: str, plan_data: Dict[str, Any], ttl_seconds: int = 3600) -> bool:
        """Stores a cryptographically declared intent plan in Redis with TTL."""
        key = f"recallguard:intent:{token}"
        serialized = json.dumps(plan_data)
        if self.is_connected and self.client:
            try:
                return bool(self.client.set(key, serialized, ex=ttl_seconds))
            except Exception:
                pass
        return self.fallback.set(key, serialized, ex=ttl_seconds)

    def get_intent_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Retrieves and verifies a declared intent token."""
        key = f"recallguard:intent:{token}"
        raw = None
        if self.is_connected and self.client:
            try:
                raw = self.client.get(key)
            except Exception:
                pass
        if not raw:
            raw = self.fallback.get(key)

        if raw:
            try:
                return json.loads(raw)
            except Exception:
                return None
        return None

    # -------------------------------------------------------------
    # 2. Blast Radius & Inventory Query Caching
    # -------------------------------------------------------------
    def get_cached_blast_radius(self, lot_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached blast-radius calculation for fast repeated loads."""
        key = f"recallguard:blast:{lot_id.upper()}"
        raw = None
        if self.is_connected and self.client:
            try:
                raw = self.client.get(key)
            except Exception:
                pass
        if not raw:
            raw = self.fallback.get(key)

        if raw:
            try:
                return json.loads(raw)
            except Exception:
                return None
        return None

    def set_cached_blast_radius(self, lot_id: str, data: Dict[str, Any], ttl_seconds: int = 300) -> bool:
        """Caches pre-computed blast-radius topology in Redis (5 min TTL)."""
        key = f"recallguard:blast:{lot_id.upper()}"
        serialized = json.dumps(data)
        if self.is_connected and self.client:
            try:
                return bool(self.client.set(key, serialized, ex=ttl_seconds))
            except Exception:
                pass
        return self.fallback.set(key, serialized, ex=ttl_seconds)

    def invalidate_blast_cache(self, lot_id: Optional[str] = None) -> int:
        """Invalidates cached graph data after status transitions."""
        if lot_id:
            key = f"recallguard:blast:{lot_id.upper()}"
            if self.is_connected and self.client:
                try:
                    return self.client.delete(key)
                except Exception:
                    pass
            return self.fallback.delete(key)
        return 0

    # -------------------------------------------------------------
    # 3. Real-Time Event Pub/Sub
    # -------------------------------------------------------------
    def publish_incident_event(self, incident_id: str, event_data: Dict[str, Any]) -> int:
        """Publishes real-time recall lifecycle events to Redis channels."""
        channel = f"recallguard:events:{incident_id}"
        message = json.dumps(event_data)
        count = 0
        if self.is_connected and self.client:
            try:
                count = self.client.publish(channel, message)
                self.client.publish("recallguard:events:all", message)
            except Exception:
                pass
        return count

    # -------------------------------------------------------------
    # 4. Status & Diagnostic Metadata
    # -------------------------------------------------------------
    def get_status(self) -> Dict[str, Any]:
        """Returns live connection health, active mode, and cached keys count."""
        key_count = 0
        if self.is_connected and self.client:
            try:
                key_count = len(self.client.keys("recallguard:*"))
            except Exception:
                pass
        else:
            key_count = len(self.fallback.keys())

        return {
            "enabled": settings.REDIS_ENABLED,
            "connected": self.is_connected,
            "mode": "standalone_redis" if self.is_connected else "in_memory_fallback",
            "url": settings.REDIS_URL if self.is_connected else "in-memory://local",
            "cached_keys_count": key_count,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }


redis_service = RedisService()
