"""
Domain Models: Inventory & Logistics
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class Product(BaseModel):
    id: str
    name: str
    manufacturer: str
    category: str


class InventoryLot(BaseModel):
    lot_id: str
    product_id: str
    warehouse_id: str
    quantity: int = Field(ge=0)
    status: str
    product_name: Optional[str] = None


class Shipment(BaseModel):
    id: str
    destination: str
    destination_type: str
    status: str
    tracking_number: str
    lot_id: Optional[str] = None
    quantity: Optional[int] = None


class BlastRadiusNode(BaseModel):
    id: str
    label: str
    type: str  # "lot", "warehouse", "shipment", "destination"
    status: str
    details: Optional[str] = None
    affected: bool = False
