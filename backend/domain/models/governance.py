"""
Domain Models: ArmorIQ Intent Verification & Policy Governance
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class IntentDeclaration(BaseModel):
    intent_token: str
    target_lot: str
    hazard: str
    severity: str
    timestamp: str
    plan_hash: str
    planned_actions: List[Dict[str, Any]] = Field(default_factory=list)


class PolicyCheckResult(BaseModel):
    verdict: str  # ALLOWED | HELD | BLOCKED
    reason: str
    rule_name: str
    intent_token: str
    requires_human_approval: bool = False
    adversarial_indicator: bool = False


class HumanApprovalRequest(BaseModel):
    id: str
    incident_id: str
    action_type: str
    target_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    status: str = "PENDING"
    reviewer: Optional[str] = None
    created_at: str
    decided_at: Optional[str] = None


class GovernanceRuleDefinition(BaseModel):
    name: str
    description: str
    enforcement: str
    status: str = "ACTIVE"
