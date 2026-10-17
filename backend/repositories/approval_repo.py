"""
Approval Repository
Handles human-in-the-loop pending approval requests and decisions.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.database.connection import get_db_connection, rows_to_dicts, row_to_dict


class ApprovalRepository:
    def get_all(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        if status:
            cursor.execute("SELECT * FROM approvals WHERE status = ? ORDER BY created_at DESC", (status,))
        else:
            cursor.execute("SELECT * FROM approvals ORDER BY created_at DESC")
        rows = rows_to_dicts(cursor.fetchall())
        conn.close()

        for r in rows:
            if isinstance(r.get("payload"), str):
                try:
                    r["payload"] = json.loads(r["payload"])
                except Exception:
                    pass
        return rows

    def get_by_id(self, approval_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM approvals WHERE id = ?", (approval_id,))
        row = row_to_dict(cursor.fetchone())
        conn.close()
        if row and isinstance(row.get("payload"), str):
            try:
                row["payload"] = json.loads(row["payload"])
            except Exception:
                pass
        return row

    def create(self, approval_id: str, incident_id: str, action_type: str, target_id: Optional[str], payload: Dict[str, Any]) -> None:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO approvals (id, incident_id, action_type, target_id, payload, status, reviewer, created_at)
            VALUES (?, ?, ?, ?, ?, 'PENDING', NULL, ?)
        """, (
            approval_id,
            incident_id,
            action_type,
            target_id,
            json.dumps(payload),
            datetime.now(timezone.utc).isoformat()
        ))
        conn.commit()
        conn.close()

    def update_decision(self, approval_id: str, decision: str, reviewer: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE approvals
            SET status = ?, reviewer = ?, decided_at = ?
            WHERE id = ?
        """, (
            decision,
            reviewer,
            datetime.now(timezone.utc).isoformat(),
            approval_id
        ))
        updated = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return updated


approval_repo = ApprovalRepository()
