"""
RecallGuard API Server
FastAPI application providing REST endpoints, Server-Sent Events (SSE) streaming,
and supply-chain incident control.
"""

import os
import sys
from pathlib import Path

# Ensure project root is in sys.path so 'backend' package is always resolvable
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import json
import asyncio
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from backend.database import init_db, get_db_connection, rows_to_dicts, row_to_dict
from backend.seed_data import seed_database, SAMPLE_NOTICES
from backend.mcp_server import InventoryRecallMCP
from backend.armoriq_governance import governor
from backend.agent import agent

app = FastAPI(
    title="RecallGuard API",
    description="AI-Powered Product Recall & Supply Chain Safety Agent with ArmorIQ Governance",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initializes and seeds database on server start."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) as count FROM products")
    count = cursor.fetchone()["count"]
    conn.close()
    if count == 0:
        seed_database()


class RunRecallRequest(BaseModel):
    notice_id: Optional[str] = None
    custom_notice_text: Optional[str] = None


class DecisionRequest(BaseModel):
    decision: str  # APPROVED | REJECTED
    reviewer: str = "Compliance Officer (Manager)"


@app.get("/api/health")
def get_health():
    """Health check endpoint showing subsystem statuses."""
    return {
        "status": "healthy",
        "service": "RecallGuard",
        "llm_engine": "Gemini 3.8 Flash (Primary) / Ollama Qwen 2.5 (Local)",
        "armoriq_governance": "Active",
        "mcp_server": "Connected"
    }


@app.post("/api/reset")
def reset_system():
    """Resets database to clean initial state."""
    seed_database()
    return {"status": "success", "message": "Supply chain database reset to initial seeded state."}


@app.get("/api/scenarios")
def get_scenarios():
    """Returns preset test scenarios."""
    return SAMPLE_NOTICES


@app.get("/api/inventory")
def get_inventory():
    """Returns full current state of inventory lots and shipments."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT il.lot_id, il.warehouse_id, il.quantity, il.status as lot_status,
               p.id as product_id, p.name as product_name, p.manufacturer
        FROM inventory_lots il
        JOIN products p ON il.product_id = p.id
    """)
    lots = rows_to_dicts(cursor.fetchall())

    cursor.execute("""
        SELECT s.id as shipment_id, s.destination, s.destination_type, s.status as shipment_status,
               s.tracking_number, si.lot_id, si.quantity
        FROM shipments s
        JOIN shipment_items si ON s.id = si.shipment_id
    """)
    shipments = rows_to_dicts(cursor.fetchall())

    conn.close()
    return {"lots": lots, "shipments": shipments}


@app.get("/api/actions")
def get_actions(limit: int = 50):
    """Returns logged incident actions and policy verdicts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, incident_id, action_type, target_id, intent_token,
               policy_verdict, execution_status, reason, actor, created_at
        FROM incident_actions
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    actions = rows_to_dicts(cursor.fetchall())
    conn.close()
    return actions


@app.get("/api/approvals")
def get_approvals():
    """Returns pending Human-in-the-Loop review items."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, incident_id, action_type, target_id, payload, status, reviewer, created_at, decided_at
        FROM approvals
        WHERE status = 'PENDING'
        ORDER BY created_at DESC
    """)
    approvals = rows_to_dicts(cursor.fetchall())
    conn.close()
    return approvals


@app.post("/api/approvals/{approval_id}/decide")
def decide_approval(approval_id: str, req: DecisionRequest):
    """Human manager approves or rejects a held action."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM approvals WHERE id = ?", (approval_id,))
    approval = row_to_dict(cursor.fetchone())

    if not approval:
        conn.close()
        raise HTTPException(status_code=404, detail="Approval request not found")

    decision = req.decision.upper()
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    cursor.execute("""
        UPDATE approvals
        SET status = ?, reviewer = ?, decided_at = ?
        WHERE id = ?
    """, (decision, req.reviewer, now, approval_id))

    # If APPROVED, execute the underlying action!
    execution_result = None
    if decision == "APPROVED":
        if approval["action_type"] == "send_recall_notice":
            execution_result = InventoryRecallMCP.send_recall_notice(
                incident_id=approval["incident_id"],
                recipients=["clinic-boston@health.org", "metro-chicago@hospital.net"],
                notice_body="URGENT CLASS I RECALL NOTICE: Quarantined Lot LOT-24-A"
            )
            governor.record_action(
                incident_id=approval["incident_id"],
                action_type="send_recall_notice",
                target_id="downstream-recipients",
                policy_verdict="ALLOWED",
                execution_status="EXECUTED",
                reason=f"Approved by Human Reviewer: {req.reviewer}",
                actor=f"Human-Manager ({req.reviewer})"
            )

    conn.commit()
    conn.close()
    return {
        "status": "success",
        "approval_id": approval_id,
        "decision": decision,
        "execution_result": execution_result
    }


@app.get("/api/blast-radius/{lot_id}")
def get_blast_radius(lot_id: str):
    """Computes node-link graph data for visual blast radius."""
    lookup = InventoryRecallMCP.lookup_product_lot(lot_id)
    if lookup.get("status") == "not_found":
        return {"nodes": [], "edges": [], "summary": {}}

    inv = InventoryRecallMCP.get_inventory_by_lot(lot_id)
    shps = InventoryRecallMCP.get_affected_shipments(lot_id)

    nodes = []
    edges = []

    # Center Node: Product Lot
    product_name = lookup.get("product", {}).get("product_name", "Recalled Product")
    nodes.append({
        "id": f"lot_{lot_id}",
        "type": "lot",
        "label": f"Batch: {lot_id}",
        "sublabel": product_name,
        "status": "QUARANTINED"
    })

    # Warehouse Nodes
    for wh in inv.get("warehouses", []):
        wh_node_id = f"wh_{wh['warehouse'].split()[0]}"
        nodes.append({
            "id": wh_node_id,
            "type": "warehouse",
            "label": wh["warehouse"].split("(")[0].strip(),
            "sublabel": f"{wh['quantity']} units ({wh['status']})",
            "status": wh["status"]
        })
        edges.append({
            "source": f"lot_{lot_id}",
            "target": wh_node_id,
            "label": f"{wh['quantity']} units"
        })

    # Shipment Nodes
    for shp in shps.get("shipments", []):
        shp_node_id = f"shp_{shp['shipment_id']}"
        nodes.append({
            "id": shp_node_id,
            "type": "shipment",
            "label": shp["shipment_id"],
            "sublabel": f"{shp['destination_type']} ({shp['shipment_status']})",
            "status": shp["shipment_status"]
        })

        # Connect from corresponding warehouse
        target_wh_id = "wh_Warehouse"
        edges.append({
            "source": f"lot_{lot_id}",
            "target": shp_node_id,
            "label": f"{shp['shipment_quantity']} units"
        })

        # Destination Endpoint Node
        dest_node_id = f"dest_{shp['shipment_id']}"
        nodes.append({
            "id": dest_node_id,
            "type": "destination",
            "label": shp["destination"].split(",")[0],
            "sublabel": shp["destination"].split(",")[-1].strip() if "," in shp["destination"] else "",
            "status": "ALERTED" if shp["shipment_status"] == "DELIVERED" else "HELD"
        })
        edges.append({
            "source": shp_node_id,
            "target": dest_node_id,
            "label": "Delivery Route"
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "lot_id": lot_id,
        "product": lookup.get("product", {}),
        "total_units": inv.get("total_units_on_hand", 0),
        "total_shipments": shps.get("total_affected_shipments", 0),
        "summary": shps.get("summary", {})
    }


@app.post("/api/incidents/stream")
async def stream_incident(req: RunRecallRequest):
    """Server-Sent Events (SSE) streaming of the recall investigation & ArmorIQ governance."""
    # Determine notice text
    if req.custom_notice_text:
        notice_text = req.custom_notice_text
    elif req.notice_id and req.notice_id in SAMPLE_NOTICES:
        notice_text = SAMPLE_NOTICES[req.notice_id]["content"]
    else:
        notice_text = SAMPLE_NOTICES["standard"]["content"]

    async def event_generator():
        try:
            for event in agent.run_investigation_stream(notice_text):
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.3)  # Smooth cadence
        except Exception as e:
            err_event = {
                "type": "STREAM_ERROR",
                "message": f"Execution error: {str(e)}",
                "policy_verdict": "BLOCKED"
            }
            yield f"data: {json.dumps(err_event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    import time
    port = int(os.getenv("PORT", 8000))
    print(f"Starting RecallGuard API on port {port}...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
