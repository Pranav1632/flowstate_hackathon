"""
MCP Recall Notification Tools
"""

from typing import Dict, Any, List
from backend.database.connection import get_db_connection


def draft_recall_notice(incident_id: str, lot_id: str, message_template: str) -> Dict[str, Any]:
    """Prepare official notification for review."""
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


def send_recall_notice(incident_id: str, recipients: List[str], notice_body: str) -> Dict[str, Any]:
    """Sensitive action governed by ArmorIQ (requires Human Review approval)."""
    return {
        "status": "dispatched",
        "incident_id": incident_id,
        "recipients_notified": recipients,
        "delivery_timestamp": "2026-10-17T17:40:00Z",
        "message": f"Recall notice officially transmitted to {len(recipients)} downstream facilities."
    }


def release_quarantine(lot_id: str, reason: str = "") -> Dict[str, Any]:
    """Tool: release_quarantine - Restricted by default."""
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
