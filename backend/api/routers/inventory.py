"""
Inventory & Blast Radius API Router
"""

from typing import Dict, Any
from fastapi import APIRouter
from backend.repositories.inventory_repo import inventory_repo
from backend.services.inventory.blast_radius import blast_radius_service

router = APIRouter(prefix="/api", tags=["Inventory"])


@router.get("/inventory")
def get_inventory_footprint() -> Dict[str, Any]:
    """Returns all current inventory lots and active shipment distribution."""
    return inventory_repo.get_all_inventory()


@router.get("/blast-radius/{lot_id}")
def get_blast_radius(lot_id: str) -> Dict[str, Any]:
    """Computes node-link graph data for visual blast radius analysis."""
    return blast_radius_service.calculate_blast_radius(lot_id)
