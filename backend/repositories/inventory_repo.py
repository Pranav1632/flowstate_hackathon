"""
Inventory Repository
Provides direct database operations for products, inventory lots, and shipments.
"""

from typing import List, Dict, Any, Optional
from backend.database.connection import get_db_connection, rows_to_dicts, row_to_dict
from backend.services.cache import redis_service


class InventoryRepository:
    def get_lots_by_id(self, lot_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT l.lot_id, l.warehouse_id, l.quantity, l.status, p.name as product_name
            FROM inventory_lots l
            JOIN products p ON l.product_id = p.id
            WHERE l.lot_id LIKE ? OR l.lot_id = ?
        """, (f"{lot_id}%", lot_id))
        rows = cursor.fetchall()
        conn.close()
        return rows_to_dicts(rows)

    def get_shipments_by_lot(self, lot_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.id as shipment_id, s.destination, s.destination_type, s.status, s.tracking_number, si.quantity
            FROM shipments s
            JOIN shipment_items si ON s.id = si.shipment_id
            WHERE si.lot_id LIKE ? OR si.lot_id = ?
        """, (f"{lot_id}%", lot_id))
        rows = cursor.fetchall()
        conn.close()
        return rows_to_dicts(rows)

    def get_all_inventory(self) -> Dict[str, List[Dict[str, Any]]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT l.lot_id, l.warehouse_id, l.quantity, l.status, l.status as lot_status, p.name as product_name
            FROM inventory_lots l
            JOIN products p ON l.product_id = p.id
            ORDER BY l.lot_id, l.warehouse_id
        """)
        lots = rows_to_dicts(cursor.fetchall())

        cursor.execute("""
            SELECT s.id, s.id as shipment_id, s.destination, s.destination_type,
                   s.status, s.status as shipment_status, s.tracking_number,
                   si.lot_id, si.quantity
            FROM shipments s
            LEFT JOIN shipment_items si ON s.id = si.shipment_id
            ORDER BY s.id
        """)
        shipments = rows_to_dicts(cursor.fetchall())
        conn.close()
        return {"lots": lots, "shipments": shipments}

    def update_lot_status(self, lot_id: str, new_status: str) -> int:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE inventory_lots SET status = ? WHERE lot_id LIKE ? OR lot_id = ?", (new_status, f"{lot_id}%", lot_id))
        count = cursor.rowcount
        conn.commit()
        conn.close()
        redis_service.invalidate_blast_cache(lot_id)
        return count

    def update_shipment_status(self, shipment_id: str, new_status: str) -> int:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE shipments SET status = ? WHERE id = ?", (new_status, shipment_id))
        count = cursor.rowcount
        conn.commit()
        conn.close()
        redis_service.invalidate_blast_cache("LOT-24-A")
        return count


inventory_repo = InventoryRepository()
