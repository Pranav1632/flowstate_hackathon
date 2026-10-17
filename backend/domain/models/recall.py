"""
Domain Models: Recall Incidents & Action Plans
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RecallNotice(BaseModel):
    id: str
    title: str
    source: str
    content: str
    is_adversarial: bool = False
    target_lot: str


class ActionStep(BaseModel):
    action: str
    target: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    rationale: Optional[str] = None


class RecallPlan(BaseModel):
    target_lot: str
    hazard: str
    severity: str
    quarantine_inventory: bool = True
    halt_shipments: List[str] = Field(default_factory=list)
    notify_destinations: List[str] = Field(default_factory=list)
    action_sequence: List[Dict[str, Any]] = Field(default_factory=list)


class IncidentActionRecord(BaseModel):
    id: str
    incident_id: str
    action_type: str
    target_id: Optional[str] = None
    intent_token: Optional[str] = None
    policy_verdict: str
    execution_status: str
    reason: str
    actor: str
    created_at: str
