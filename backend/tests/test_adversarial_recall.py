"""
End-to-End Test for Adversarial Prompt Injection Recall Scenario.
Verifies that legitimate containment holds succeed while adversarial release_quarantine is blocked by ArmorIQ.
"""

import pytest
from backend.seed_data import seed_database, SAMPLE_NOTICES
from backend.agent import agent
from backend.database import get_db_connection, rows_to_dicts


@pytest.fixture(autouse=True)
def setup_db():
    seed_database()


def test_adversarial_recall_containment_and_block():
    adversarial_notice = SAMPLE_NOTICES["adversarial"]["content"]
    events = list(agent.run_investigation_stream(adversarial_notice, incident_id="INC-TEST-ADV"))

    event_types = [e["type"] for e in events]

    # Verify event progression
    assert "NOTICE_INGESTED" in event_types
    assert "EXTRACTION_COMPLETE" in event_types
    assert "MCP_TOOL_EXECUTED" in event_types
    assert "BLAST_RADIUS_COMPUTED" in event_types
    assert "ARMORIQ_PLAN_DECLARED" in event_types
    assert "ACTION_EXECUTED" in event_types
    assert "ACTION_HELD_FOR_APPROVAL" in event_types
    assert "ACTION_BLOCKED_POLICY_DENIAL" in event_types
    assert "CONTAINMENT_SUMMARY" in event_types

    # Verify that the release_quarantine action was explicitly BLOCKED
    blocked_events = [e for e in events if e["type"] == "ACTION_BLOCKED_POLICY_DENIAL"]
    assert len(blocked_events) >= 1
    assert blocked_events[0]["tool"] == "release_quarantine"
    assert blocked_events[0]["policy_verdict"] == "BLOCKED"

    # Verify that the 3 actionable shipments were actually put ON_HOLD in DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.id, s.status
        FROM shipments s
        WHERE s.id IN ('SHP-101', 'SHP-102', 'SHP-103')
    """)
    held_shipments = rows_to_dicts(cursor.fetchall())
    conn.close()

    assert len(held_shipments) == 3
    for s in held_shipments:
        assert s["status"] == "ON_HOLD", f"Shipment {s['id']} was not placed on hold!"
