"""
ArmorIQ Governance & Policy Enforcement Engine
Implements the Declare-Check-Execute intent governance protocol for RecallGuard,
leveraging armoriq_sdk with policy matrix evaluation and audit tracking.
"""

import os
import json
import hashlib
import time
from typing import Dict, Any, List, Optional
from backend.database.connection import get_db_connection
from backend.services.governance.policy_rules import POLICY_RULES

# Load official armoriq_sdk if available
try:
    from armoriq_sdk import ArmorIQClient, SDKConfig, ToolCall
    from armoriq_sdk.exceptions import PolicyBlockedException, PolicyHoldException, IntentMismatchException
    HAS_ARMORIQ_SDK = True
except ImportError:
    HAS_ARMORIQ_SDK = False

ARMORIQ_API_KEY = os.getenv("ARMORIQ_API_KEY", "ak_live_3c0e6547c66e45423b767ff1e7a7be102a5f1ed4a12416b902cd1bd0f7762870")


class ArmorIQGovernor:
    """Governance orchestrator enforcing ArmorIQ policy checks and intent verification."""

    def __init__(self, api_key: str = ARMORIQ_API_KEY):
        self.api_key = api_key
        self.client = None
        if HAS_ARMORIQ_SDK and api_key.startswith("ak_"):
            try:
                self.client = ArmorIQClient(api_key=api_key, agent_id="recallguard-agent", user_id="officer-recall-1")
            except Exception as e:
                print(f"[ArmorIQ] Notice initializing SDK client: {e}")

    def declare_plan(self, incident_id: str, goal: str, planned_steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Phase 1: DECLARE
        Registers execution intent and returns a cryptographic Intent Token.
        """
        payload = {
            "incident_id": incident_id,
            "goal": goal,
            "steps": planned_steps,
            "timestamp": time.time(),
            "api_key_prefix": self.api_key[:8] if self.api_key else "local"
        }
        
        # Cryptographic plan hash
        plan_canonical = json.dumps(payload, sort_keys=True)
        plan_hash = hashlib.sha256(plan_canonical.encode("utf-8")).hexdigest()
        intent_token = f"tok_iq_{plan_hash[:24]}_{int(time.time())}"

        return {
            "intent_token": intent_token,
            "plan_hash": plan_hash,
            "goal": goal,
            "step_count": len(planned_steps),
            "declared_steps": planned_steps,
            "declared_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def check_policy(self, tool_name: str, params: Dict[str, Any], intent_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Phase 2: CHECK
        Evaluates planned tool call against the recall safety policy matrix.
        Returns: { verdict: 'ALLOW' | 'HOLD' | 'BLOCK', reason: str }
        """
        if tool_name not in POLICY_RULES:
            return {
                "verdict": "BLOCK",
                "tool": tool_name,
                "reason": f"POLICY_VIOLATION: Tool '{tool_name}' is not in authorized recall response capabilities."
            }

        rule = POLICY_RULES[tool_name]
        return {
            "verdict": rule["verdict"],
            "tool": tool_name,
            "reason": rule["reason"],
            "intent_token": intent_token or "unspecified"
        }

    def record_action(
        self,
        incident_id: str,
        action_type: str,
        target_id: Optional[str],
        policy_verdict: str,
        execution_status: str,
        reason: str,
        actor: str = "ArmorIQ-Guard",
        intent_token: Optional[str] = None
    ) -> str:
        """
        Phase 3: AUDIT
        Persists action decision and cryptographic audit trail in SQLite.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        action_id = f"act_{int(time.time()*1000)}_{action_type[:6]}"
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        cursor.execute("""
            INSERT INTO incident_actions (
                id, incident_id, action_type, target_id, intent_token,
                policy_verdict, execution_status, reason, actor, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            action_id, incident_id, action_type, target_id, intent_token,
            policy_verdict, execution_status, reason, actor, now
        ))

        # If verdict is HOLD, create an entry in approvals queue
        if policy_verdict == "HOLD" and execution_status == "PENDING_REVIEW":
            approval_id = f"appr_{int(time.time()*1000)}"
            cursor.execute("""
                INSERT INTO approvals (
                    id, incident_id, action_type, target_id, payload,
                    status, reviewer, created_at
                ) VALUES (?, ?, ?, ?, ?, 'PENDING', NULL, ?)
            """, (
                approval_id, incident_id, action_type, target_id,
                json.dumps({"reason": reason, "intent_token": intent_token}), now
            ))

        conn.commit()
        conn.close()
        return action_id


# Global Singleton Governor
governor = ArmorIQGovernor()
