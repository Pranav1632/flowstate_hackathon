"""
System & Demo Lifecycle Router
"""

from typing import Dict, Any
from fastapi import APIRouter
from backend.core.config import settings
from backend.database.seed import seed_database

router = APIRouter(tags=["System"])


@router.get("/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@router.post("/api/reset-demo")
@router.post("/api/reset")
def reset_demo() -> Dict[str, Any]:
    """Resets database to pristine demo state."""
    seed_database()
    return {
        "status": "success",
        "message": "RecallGuard database reset and re-seeded to initial demonstration state."
    }
