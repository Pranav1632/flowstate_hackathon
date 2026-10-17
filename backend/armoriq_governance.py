"""
ArmorIQ Governance Facade (Backward Compatibility)
Re-exports from backend.services.governance
"""

from backend.services.governance.armoriq_engine import (
    ArmorIQGovernor,
    governor,
    HAS_ARMORIQ_SDK,
    ARMORIQ_API_KEY,
)
from backend.services.governance.policy_rules import POLICY_RULES

__all__ = [
    "ArmorIQGovernor",
    "governor",
    "POLICY_RULES",
    "HAS_ARMORIQ_SDK",
    "ARMORIQ_API_KEY",
]
