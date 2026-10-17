"""
Inventory & Recall MCP Server
Assembles tool methods into the Model Context Protocol unified interface.
"""

from typing import Dict, Any, List
from backend.mcp.tools import inventory_tools, recall_tools


class InventoryRecallMCP:
    """Core MCP Tool implementation for RecallGuard."""

    @staticmethod
    def get_recall_notice(notice_id: str) -> Dict[str, Any]:
        return inventory_tools.get_recall_notice(notice_id)

    @staticmethod
    def lookup_product_lot(lot_id: str) -> Dict[str, Any]:
        return inventory_tools.lookup_product_lot(lot_id)

    @staticmethod
    def get_inventory_by_lot(lot_id: str) -> Dict[str, Any]:
        return inventory_tools.get_inventory_by_lot(lot_id)

    @staticmethod
    def get_affected_shipments(lot_id: str) -> Dict[str, Any]:
        return inventory_tools.get_affected_shipments(lot_id)

    @staticmethod
    def place_shipping_hold(shipment_id: str, lot_id: str, reason: str = "Recall safety containment") -> Dict[str, Any]:
        return inventory_tools.place_shipping_hold(shipment_id, lot_id, reason)

    @staticmethod
    def draft_recall_notice(incident_id: str, lot_id: str, message_template: str) -> Dict[str, Any]:
        return recall_tools.draft_recall_notice(incident_id, lot_id, message_template)

    @staticmethod
    def send_recall_notice(incident_id: str, recipients: List[str], notice_body: str) -> Dict[str, Any]:
        return recall_tools.send_recall_notice(incident_id, recipients, notice_body)

    @staticmethod
    def release_quarantine(lot_id: str, reason: str = "") -> Dict[str, Any]:
        return recall_tools.release_quarantine(lot_id, reason)
