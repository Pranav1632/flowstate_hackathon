"""
Blast Radius Service
Calculates downstream supply-chain node-link graph data for visual impact analysis.
"""

from typing import Dict, Any, List
from backend.repositories.inventory_repo import inventory_repo
from backend.services.cache import redis_service


class BlastRadiusService:
    def calculate_blast_radius(self, lot_id: str) -> Dict[str, Any]:
        """Computes node-link graph representation of affected warehouses, shipments, and destinations."""
        cached = redis_service.get_cached_blast_radius(lot_id)
        if cached:
            return cached

        lots = inventory_repo.get_lots_by_id(lot_id)
        if not lots:
            return {"nodes": [], "edges": [], "summary": {}}

        shipments = inventory_repo.get_shipments_by_lot(lot_id)
        product_name = lots[0].get("product_name", "Recalled Product")
        total_units = sum(l.get("quantity", 0) for l in lots)

        nodes = []
        edges = []

        # Central Root: Recalled Lot
        nodes.append({
            "id": f"lot_{lot_id}",
            "type": "lot",
            "label": f"Batch: {lot_id}",
            "sublabel": product_name,
            "status": lots[0].get("status", "QUARANTINED")
        })

        # Warehouses
        for idx, l in enumerate(lots):
            wh_node_id = f"wh_{idx}_{l['warehouse_id'][:15].replace(' ', '_').replace('-', '_')}"
            nodes.append({
                "id": wh_node_id,
                "type": "warehouse",
                "label": l["warehouse_id"].replace("Warehouse-", ""),
                "sublabel": f"{l['quantity']} units ({l['status']})",
                "status": l["status"]
            })
            edges.append({
                "source": f"lot_{lot_id}",
                "target": wh_node_id,
                "label": f"{l['quantity']} units"
            })

        # Shipments and End Destinations
        for s in shipments:
            shp_node_id = f"shp_{s['shipment_id']}"
            nodes.append({
                "id": shp_node_id,
                "type": "shipment",
                "label": s["shipment_id"],
                "sublabel": f"{s['destination_type']} ({s['status']})",
                "status": s["status"]
            })
            edges.append({
                "source": f"lot_{lot_id}",
                "target": shp_node_id,
                "label": f"{s['quantity']} units"
            })

            # Destination Node
            dest_node_id = f"dest_{s['shipment_id']}"
            dest_parts = s["destination"].split(",")
            dest_label = dest_parts[0]
            dest_sub = dest_parts[-1].strip() if len(dest_parts) > 1 else ""

            nodes.append({
                "id": dest_node_id,
                "type": "destination",
                "label": dest_label,
                "sublabel": dest_sub,
                "status": "ALERTED" if s["status"] == "DELIVERED" else "HELD"
            })
            edges.append({
                "source": shp_node_id,
                "target": dest_node_id,
                "label": "Route"
            })

        result = {
            "nodes": nodes,
            "edges": edges,
            "lot_id": lot_id,
            "product": {"product_name": product_name},
            "total_units": total_units,
            "shipments_count": len(shipments)
        }
        redis_service.set_cached_blast_radius(lot_id, result)
        return result


blast_radius_service = BlastRadiusService()
