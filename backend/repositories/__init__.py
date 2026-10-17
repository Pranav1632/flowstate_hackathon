"""Repositories package."""
from backend.repositories.inventory_repo import inventory_repo, InventoryRepository
from backend.repositories.approval_repo import approval_repo, ApprovalRepository
from backend.repositories.incident_repo import incident_repo, IncidentRepository

__all__ = [
    "inventory_repo",
    "approval_repo",
    "incident_repo",
    "InventoryRepository",
    "ApprovalRepository",
    "IncidentRepository",
]
