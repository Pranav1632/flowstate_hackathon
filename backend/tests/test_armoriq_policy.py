"""
Unit tests for ArmorIQ Governance, Intent Tokens, and Policy Enforcement.
"""

import pytest
from backend.seed_data import seed_database
from backend.armoriq_governance import governor


@pytest.fixture(autouse=True)
def setup_db():
    seed_database()


def test_declare_plan_and_token_generation():
    steps = [
        {"action": "place_shipping_hold", "tool": "place_shipping_hold", "inputs": {"shipment_id": "SHP-101", "lot_id": "LOT-24-A"}},
        {"action": "draft_recall_notice", "tool": "draft_recall_notice", "inputs": {"incident_id": "INC-TEST", "lot_id": "LOT-24-A"}}
    ]
    declaration = governor.declare_plan("INC-TEST", "Containment goal", steps)
    assert declaration["intent_token"].startswith("tok_iq_")
    assert len(declaration["plan_hash"]) == 64
    assert declaration["step_count"] == 2


def test_check_policy_allow_tools():
    # Safe tools
    assert governor.check_policy("get_recall_notice", {})["verdict"] == "ALLOW"
    assert governor.check_policy("lookup_product_lot", {})["verdict"] == "ALLOW"
    assert governor.check_policy("get_inventory_by_lot", {})["verdict"] == "ALLOW"
    assert governor.check_policy("get_affected_shipments", {})["verdict"] == "ALLOW"
    assert governor.check_policy("place_shipping_hold", {})["verdict"] == "ALLOW"
    assert governor.check_policy("draft_recall_notice", {})["verdict"] == "ALLOW"


def test_check_policy_hold_tool():
    # Sensitive broadcast requires Human Review
    res = governor.check_policy("send_recall_notice", {})
    assert res["verdict"] == "HOLD"
    assert "Human-in-the-Loop" in res["reason"]


def test_check_policy_block_prohibited_and_injection():
    # Prompt injection attempted release of quarantined goods
    res_release = governor.check_policy("release_quarantine", {})
    assert res_release["verdict"] == "BLOCK"
    assert "POLICY_DENIAL" in res_release["reason"]

    # Customer exfiltration attempt
    res_exfil = governor.check_policy("export_customer_database", {})
    assert res_exfil["verdict"] == "BLOCK"

    # Arbitrary unauthorized tool
    res_unauth = governor.check_policy("arbitrary_system_call", {})
    assert res_unauth["verdict"] == "BLOCK"


def test_audit_record_action():
    action_id = governor.record_action(
        incident_id="INC-AUDIT-1",
        action_type="release_quarantine",
        target_id="LOT-24-A",
        policy_verdict="BLOCKED",
        execution_status="BLOCKED",
        reason="Blocked by ArmorIQ Policy",
        actor="ArmorIQ-Guard",
        intent_token="tok_iq_test"
    )
    assert action_id.startswith("act_")
