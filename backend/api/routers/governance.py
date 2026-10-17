"""
ArmorIQ Governance HUD & Policy Verification Router
"""

from typing import Dict, Any
from fastapi import APIRouter
from backend.services.governance.policy_rules import POLICY_RULES
from backend.services.governance.armoriq_engine import governor, HAS_ARMORIQ_SDK, ARMORIQ_API_KEY

router = APIRouter(prefix="/api/governance", tags=["Governance"])


@router.get("/status")
def get_governance_status() -> Dict[str, Any]:
    """Returns active ArmorIQ governance configuration and status."""
    return {
        "armoriq_sdk_installed": HAS_ARMORIQ_SDK,
        "api_key_configured": bool(ARMORIQ_API_KEY and ARMORIQ_API_KEY.startswith("ak_")),
        "api_key_masked": f"{ARMORIQ_API_KEY[:8]}...{ARMORIQ_API_KEY[-4:]}" if ARMORIQ_API_KEY else "Not Set",
        "active_policies_count": len(POLICY_RULES),
        "protocol": "Declare-Check-Execute"
    }


@router.get("/rules")
def get_policy_rules() -> Dict[str, Any]:
    """Returns the registered safety policy matrix rules."""
    return POLICY_RULES


@router.post("/attempt-release")
def attempt_quarantine_release(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Interactive test endpoint: attempts manual quarantine release.
    ArmorIQ intercepts this tool call and returns a deterministic BLOCKED verdict.
    """
    if payload is None:
        payload = {}
    lot_id = payload.get("lot_id", "LOT-24-A")
    reason = payload.get("reason", "Manual operator release probe")

    # 1. Run through ArmorIQ policy gate
    check_result = governor.check_policy("release_quarantine", {"lot_id": lot_id, "reason": reason})
    verdict = check_result["verdict"]

    # 2. Record audit trail
    action_id = governor.record_action(
        incident_id=f"INC-MANUAL-{int(governor.record_action.__hash__() % 10000)}",
        action_type="release_quarantine",
        target_id=lot_id,
        policy_verdict="BLOCKED",
        execution_status="BLOCKED",
        reason=check_result["reason"],
        actor="Manual-Supervisor-Probe"
    )

    return {
        "status": "BLOCKED",
        "action_id": action_id,
        "lot_id": lot_id,
        "policy_verdict": verdict,
        "reason": check_result["reason"],
        "message": f"SECURITY DENIAL: ArmorIQ blocked release of {lot_id}. Active recall policy strictly prohibits quarantine release without multi-party compliance sign-off.",
        "enforcement": "ArmorIQ Intent Verification Guard"
    }

