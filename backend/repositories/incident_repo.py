"""
Incident Action & Governance Audit Repository
Tracks incident lifecycles and every governed action taken.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.database.connection import get_db_connection, rows_to_dicts, row_to_dict


class IncidentRepository:
    def create_incident(self, incident_id: str, source_reference: str, lot_id: str, severity: str, hazard_description: str) -> None:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO recall_incidents (id, source_reference, lot_id, severity, hazard_description, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
        """, (
            incident_id,
            source_reference,
            lot_id,
            severity,
            hazard_description,
            datetime.now(timezone.utc).isoformat()
        ))
        conn.commit()
        conn.close()

    def log_action(
        self,
        action_id: str,
        incident_id: str,
        action_type: str,
        target_id: Optional[str],
        intent_token: Optional[str],
        policy_verdict: str,
        execution_status: str,
        reason: str,
        actor: str = "RecallGuard-Agent"
    ) -> None:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO incident_actions (id, incident_id, action_type, target_id, intent_token, policy_verdict, execution_status, reason, actor, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            action_id,
            incident_id,
            action_type,
            target_id,
            intent_token,
            policy_verdict,
            execution_status,
            reason,
            actor,
            datetime.now(timezone.utc).isoformat()
        ))
        conn.commit()
        conn.close()

    def get_incident_actions(self, incident_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incident_actions WHERE incident_id = ? ORDER BY created_at ASC", (incident_id,))
        rows = rows_to_dicts(cursor.fetchall())
        conn.close()
        return rows


incident_repo = IncidentRepository()
