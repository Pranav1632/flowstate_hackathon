"""
Core Constants Module
Defines enumeration constants used across the governance engine and supply chain agent.
"""

from enum import Enum


class SeverityLevel(str, Enum):
    CLASS_I = "Class I"
    CLASS_II = "Class II"
    CLASS_III = "Class III"


class PolicyVerdict(str, Enum):
    ALLOWED = "ALLOWED"
    HELD = "HELD"
    BLOCKED = "BLOCKED"


class ExecutionStatus(str, Enum):
    EXECUTED = "EXECUTED"
    PENDING_REVIEW = "PENDING_REVIEW"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"


class LotStatus(str, Enum):
    RELEASED = "RELEASED"
    QUARANTINED = "QUARANTINED"
    FLAGGED = "FLAGGED"


class ShipmentStatus(str, Enum):
    PENDING = "PENDING"
    IN_TRANSIT = "IN_TRANSIT"
    HELD = "HELD"
    DELIVERED = "DELIVERED"
    REROUTED = "REROUTED"


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
