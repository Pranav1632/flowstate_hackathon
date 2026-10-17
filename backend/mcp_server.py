"""
Inventory & Recall MCP Server
Implements functional Model Context Protocol tools for supply-chain investigation,
containment holds, and notification drafting.
"""

from typing import Dict, Any, List, Optional
from backend.database import get_db_connection, rows_to_dicts, row_to_dict
from backend.seed_data import SAMPLE_NOTICES


class InventoryRecallMCP:
    """Core MCP Tool implementation for RecallGuard."""

    @staticmethod
    def get_recall_notice(notice_id: str) -> Dict[str, Any]:
        """Tool: get_recall_notice - Retrieve registered recall notice text."""
        for key, notice in SAMPLE_NOTICES.items():
            if notice["id"] == notice_id or key == notice_id:
                return {"status": "success", "notice": notice}
        return {
            "status": "error",
            "message": f"Notice {notice_id} not found."
        }

    @staticmethod
    def lookup_product_lot(lot_id: str) -> Dict[str, Any]:
        """Tool: lookup_product_lot - Find a product and its lot details."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Matches base lot e.g. 'LOT-24-A' against 'LOT-24-A-WHA', 'LOT-24-A-WHB'
        cursor.execute("""
            SELECT il.lot_id, il.warehouse_id, il.quantity, il.status,
                   p.id as product_id, p.name as product_name, p.manufacturer, p.category
            FROM inventory_lots il
            JOIN products p ON il.product_id = p.id
            WHERE il.lot_id LIKE ? OR il.lot_id = ?
        """, (f"{lot_id}%", lot_id))
        
        rows = rows_to_dicts(cursor.fetchall())
        conn.close()

        if not rows:
            return {
                "status": "not_found",
                "lot_id": lot_id,
                "message": f"Lot '{lot_id}' does not match any registered product lot in inventory."
            }

        product = {
            "product_id": rows[0]["product_id"],
            "product_name": rows[0]["product_name"],
            "manufacturer": rows[0]["manufacturer"],
            "category": rows[0]["category"]
        }

        return {
            "status": "found",
            "lot_id": lot_id,
            "product": product,
            "lot_records": rows,
            "total_records": len(rows)
        }

    @staticmethod
    def get_inventory_by_lot(lot_id: str) -> Dict[str, Any]:
        """Tool: get_inventory_by_lot - Query stock across warehouses."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT lot_id, warehouse_id, quantity, status
            FROM inventory_lots
            WHERE lot_id LIKE ? OR lot_id = ?
        """, (f"{lot_id}%", lot_id))
        rows = rows_to_dicts(cursor.fetchall())
        conn.close()

        total_units = sum(r["quantity"] for r in rows)
        warehouses = [
            {"warehouse": r["warehouse_id"], "lot_id": r["lot_id"], "quantity": r["quantity"], "status": r["status"]}
            for r in rows
        ]

        return {
            "status": "success",
            "lot_id": lot_id,
            "total_units_on_hand": total_units,
            "warehouses": warehouses
        }

    @staticmethod
    def get_affected_shipments(lot_id: str) -> Dict[str, Any]:
        """Tool: get_affected_shipments - Identify downstream shipments."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.id as shipment_id, s.destination, s.destination_type, s.status as shipment_status,
                   s.tracking_number, si.quantity as shipment_quantity, si.lot_id
            FROM shipments s
            JOIN shipment_items si ON s.id = si.shipment_id
            WHERE si.lot_id LIKE ? OR si.lot_id = ?
        """, (f"{lot_id}%", lot_id))
        rows = rows_to_dicts(cursor.fetchall())
        conn.close()

        in_transit = [r for r in rows if r["shipment_status"] == "IN_TRANSIT"]
        pending = [r for r in rows if r["shipment_status"] == "PENDING"]
        delivered = [r for r in rows if r["shipment_status"] == "DELIVERED"]
        on_hold = [r for r in rows if r["shipment_status"] == "ON_HOLD"]

        return {
            "status": "success",
            "lot_id": lot_id,
            "total_affected_shipments": len(rows),
            "shipments": rows,
            "summary": {
                "in_transit_count": len(in_transit),
                "pending_count": len(pending),
                "delivered_count": len(delivered),
                "already_on_hold_count": len(on_hold),
                "actionable_hold_count": len(in_transit) + len(pending)
            }
        }

    @staticmethod
    def place_shipping_hold(shipment_id: str, lot_id: str, reason: str = "Recall safety containment") -> Dict[str, Any]:
        """
        Tool: place_shipping_hold - Stop shipment from leaving or continuing.
        Enforces domain invariants: validates shipment actually contains the lot.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        # Invariant 1: Does shipment contain the lot?
        cursor.execute("""
            SELECT s.id, s.destination, s.status, si.lot_id, si.quantity
            FROM shipments s
            JOIN shipment_items si ON s.id = si.shipment_id
            WHERE s.id = ? AND (si.lot_id LIKE ? OR si.lot_id = ?)
        """, (shipment_id, f"{lot_id}%", lot_id))
        record = row_to_dict(cursor.fetchone())

        if not record:
            conn.close()
            return {
                "status": "rejected",
                "error": "DOMAIN_INVARIANT_VIOLATION",
                "message": f"Shipment '{shipment_id}' does not contain lot '{lot_id}'. Hold cannot be applied."
            }

        prev_status = record["status"]
        if prev_status == "DELIVERED":
            conn.close()
            return {
                "status": "warning",
                "shipment_id": shipment_id,
                "lot_id": lot_id,
                "message": f"Shipment {shipment_id} has already been DELIVERED to {record['destination']}. Cannot place physical transit hold; downstream recall notice required.",
                "previous_status": prev_status,
                "new_status": "DELIVERED"
            }

        # Apply hold
        cursor.execute("""
            UPDATE shipments SET status = 'ON_HOLD' WHERE id = ?
        """, (shipment_id,))

        # Quarantine corresponding lot status in inventory
        cursor.execute("""
            UPDATE inventory_lots SET status = 'QUARANTINED' WHERE lot_id LIKE ? OR lot_id = ?
        """, (f"{lot_id}%", lot_id))

        conn.commit()
        conn.close()

        return {
            "status": "success",
            "shipment_id": shipment_id,
            "lot_id": lot_id,
            "destination": record["destination"],
            "previous_status": prev_status,
            "new_status": "ON_HOLD",
            "reason": reason
        }

    @staticmethod
    def draft_recall_notice(incident_id: str, lot_id: str, message_template: str) -> Dict[str, Any]:
        """Tool: draft_recall_notice - Prepare official notification for review."""
        draft = {
            "incident_id": incident_id,
            "lot_id": lot_id,
            "urgency": "HIGH",
            "header": f"URGENT HEALTH HAZARD NOTICE: RECALL OF LOT {lot_id}",
            "body": message_template,
            "action_items": [
                "Immediately cease dispensing or distributing lot units",
                "Quarantine all inventory in sealed storage",
                "Acknowledge receipt and report remaining count"
            ]
        }
        return {
            "status": "draft_created",
            "draft": draft
        }

    @staticmethod
    def send_recall_notice(incident_id: str, recipients: List[str], notice_body: str) -> Dict[str, Any]:
        """
        Tool: send_recall_notice - Send external notification.
        Sensitive action governed by ArmorIQ (requires Human Review approval).
        """
        return {
            "status": "dispatched",
            "incident_id": incident_id,
            "recipients_notified": recipients,
            "delivery_timestamp": "2026-10-17T17:40:00Z",
            "message": f"Recall notice officially transmitted to {len(recipients)} downstream facilities."
        }

    @staticmethod
    def release_quarantine(lot_id: str, reason: str = "") -> Dict[str, Any]:
        """
        Tool: release_quarantine - Release restricted stock.
        Restricted by default. ArmorIQ intercepts and blocks this during active recalls.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE inventory_lots SET status = 'RELEASED' WHERE lot_id LIKE ? OR lot_id = ?
        """, (f"{lot_id}%", lot_id))
        cursor.execute("""
            UPDATE shipments SET status = 'IN_TRANSIT'
            WHERE id IN (
                SELECT shipment_id FROM shipment_items WHERE lot_id LIKE ? OR lot_id = ?
            ) AND status = 'ON_HOLD'
        """, (f"{lot_id}%", lot_id))
        conn.commit()
        conn.close()

        return {
            "status": "released",
            "lot_id": lot_id,
            "reason": reason,
            "warning": "CRITICAL: Quarantined lots have been released to active supply chain!"
        }
