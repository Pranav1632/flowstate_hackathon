"""
Incidents API Router
Handles real-time SSE containment streams and pre-loaded incident scenarios.
"""

import json
import asyncio
from typing import Dict, Any, Optional
from fastapi import APIRouter, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.agent.orchestrator import agent
from backend.database.seed import SAMPLE_NOTICES

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
