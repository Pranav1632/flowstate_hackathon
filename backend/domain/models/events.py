"""
Domain Models: Agent Events & Timeline
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel


class AgentTimelineEvent(BaseModel):
    id: str
    phase: str  # DECLARE | CHECK | EXECUTE | COMPLETE | ERROR
    action: str
    target: Optional[str] = None
    status: str  # SUCCESS | BLOCKED | PENDING | WARNING | INFO
    message: str
    timestamp: str
    governance_metadata: Optional[Dict[str, Any]] = None
