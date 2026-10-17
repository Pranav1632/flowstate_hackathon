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
