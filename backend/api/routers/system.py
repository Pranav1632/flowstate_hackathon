"""
System & Demo Lifecycle Router
"""

from typing import Dict, Any
from fastapi import APIRouter
from backend.core.config import settings
from backend.database.seed import seed_database
from backend.services.cache import redis_service

router = APIRouter(tags=["System"])


@router.get("/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "redis": redis_service.get_status()
    }


@router.get("/api/system/redis")
def get_redis_diagnostics() -> Dict[str, Any]:
    """Returns real-time Redis cache and pub/sub metrics."""
    return redis_service.get_status()


@router.post("/api/reset-demo")
@router.post("/api/reset")
def reset_demo() -> Dict[str, Any]:
    """Resets database to pristine demo state."""
    seed_database()
    redis_service.invalidate_blast_cache("LOT-24-A")
    return {
        "status": "success",
        "message": "RecallGuard database reset and re-seeded to initial demonstration state.",
        "cache_cleared": True
    }

