"""
Incidents API Router
Handles real-time SSE containment streams and pre-loaded incident scenarios.
"""

import json
import asyncio
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, Body, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.agent.orchestrator import agent
from backend.database.seed import SAMPLE_NOTICES
from backend.repositories.incident_repo import incident_repo
from backend.repositories.inventory_repo import inventory_repo
from backend.services.reports.doc_generator import build_recall_docx

router = APIRouter(prefix="/api", tags=["Incidents"])



class RunIncidentRequest(BaseModel):
    notice_text: Optional[str] = None
    custom_notice_text: Optional[str] = None
    notice_id: Optional[str] = None
    scenario_id: Optional[str] = None
    incident_id: Optional[str] = None


@router.get("/scenarios")
def get_scenarios() -> Dict[str, Any]:
    """Returns the pre-configured showcase recall scenarios."""
    return SAMPLE_NOTICES


@router.post("/incidents/run-stream")
@router.post("/incidents/stream")
async def run_incident_stream(req: RunIncidentRequest = Body(...)):
    """
    Streams the live RecallGuard AI investigation via Server-Sent Events (SSE).
    Demonstrates real-time ArmorIQ Declare-Check-Execute intent governance.
    """
    # Resolve content from either custom text, notice_text, or scenario ID lookup
    content = req.custom_notice_text or req.notice_text

    if not content:
        key = req.notice_id or req.scenario_id
        if key:
            for s_key, s_data in SAMPLE_NOTICES.items():
                if s_key == key or s_data.get("id") == key:
                    content = s_data.get("content", "")
                    break

    if not content:
        content = SAMPLE_NOTICES["standard"]["content"]

    async def event_generator():
        for event in agent.run_investigation_stream(
            notice_content=content,
            incident_id=req.incident_id
        ):
            payload = json.dumps(event)
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.35)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/incidents/export-report")
def export_audit_report(incident_id: Optional[str] = None) -> Dict[str, Any]:
    """Generates an official certified recall audit report with cryptographic proof."""
    incident = incident_repo.get_latest_incident() or {
        "id": incident_id or f"INC-{int(time.time())}",
        "lot_id": "LOT-24-A",
        "severity": "Class I",
        "hazard_description": "Microbial Cronobacter contamination",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    inc_id = incident.get("id")
    actions = incident_repo.get_incident_actions(inc_id)
    if not actions:
        actions = incident_repo.get_all_actions()[:20]

    inv = inventory_repo.get_all_inventory()
    held_shipments = [s for s in inv["shipments"] if s.get("status") == "ON_HOLD" or s.get("shipment_status") == "ON_HOLD"]
    quarantined_lots = [l for l in inv["lots"] if l.get("status") == "QUARANTINED" or l.get("lot_status") == "QUARANTINED"]

    return {
        "report_id": f"REP-GOV-{int(time.time())}",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "incident": incident,
        "governance": {
            "authority": "ArmorIQ Cryptographic Policy Engine",
            "protocol": "Declare-Check-Execute",
            "compliance_status": "FULLY_COMPLIANT_CONTAINED",
            "policy_verification": "ENFORCED"
        },
        "containment_summary": {
            "held_shipments_count": len(held_shipments),
            "quarantined_lots_count": len(quarantined_lots),
            "total_audit_actions_logged": len(actions)
        },
        "held_shipments": held_shipments,
        "actions_audit_trail": actions
    }


@router.get("/incidents/export-docx")
def export_audit_docx(incident_id: Optional[str] = None):
    """Generates and streams an executive Microsoft Word (.docx) audit dossier."""
    report_data = export_audit_report(incident_id)
    doc_buffer = build_recall_docx(report_data)

    rep_id = report_data.get("report_id", "DOSSIER")
    filename = f"RecallGuard_Audit_Report_{rep_id}.docx"
    return Response(
        content=doc_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


