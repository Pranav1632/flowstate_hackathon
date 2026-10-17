"""API Routers package."""
from backend.api.routers.incidents import router as incidents_router
from backend.api.routers.inventory import router as inventory_router
from backend.api.routers.approvals import router as approvals_router
from backend.api.routers.governance import router as governance_router
from backend.api.routers.system import router as system_router

__all__ = [
    "incidents_router",
    "inventory_router",
    "approvals_router",
    "governance_router",
    "system_router",
]
