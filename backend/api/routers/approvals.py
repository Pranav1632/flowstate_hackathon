"""
Human-in-the-Loop Approvals API Router
"""

import time
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.repositories.approval_repo import approval_repo
from backend.services.governance.armoriq_engine import governor
from backend.mcp.server import InventoryRecallMCP

router = APIRouter(prefix="/api", tags=["Approvals"])


class DecisionRequest(BaseModel):
    decision: str  # APPROVED | REJECTED
    reviewer: str
    comments: str = ""


@router.get("/approvals")
def get_approvals() -> List[Dict[str, Any]]:
    """Returns pending Human-in-the-Loop review items."""
    return approval_repo.get_all(status="PENDING")


@router.post("/approvals/{approval_id}/decide")
def decide_approval(approval_id: str, req: DecisionRequest):
    """Human manager approves or rejects a held action."""
    approval = approval_repo.get_by_id(approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    decision = req.decision.upper()
    approval_repo.update_decision(approval_id, decision, req.reviewer)

    # If APPROVED, execute the underlying action
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

    return {
        "status": "success",
        "approval_id": approval_id,
        "decision": decision,
        "execution_result": execution_result
    }
