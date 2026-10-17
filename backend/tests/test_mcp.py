"""
Unit tests for Inventory & Recall MCP Tools and Domain Invariants.
"""

import pytest
from backend.seed_data import seed_database
from backend.mcp_server import InventoryRecallMCP


@pytest.fixture(autouse=True)
def setup_db():
    seed_database()


def test_lookup_product_lot_found():
    res = InventoryRecallMCP.lookup_product_lot("LOT-24-A")
    assert res["status"] == "found"
    assert res["product"]["product_name"] == "BioPure Pediatric Infant Formula 400g"
    assert res["total_records"] >= 2


def test_lookup_product_lot_unknown():
    res = InventoryRecallMCP.lookup_product_lot("LOT-NONEXISTENT-99")
    assert res["status"] == "not_found"


def test_get_inventory_by_lot():
    res = InventoryRecallMCP.get_inventory_by_lot("LOT-24-A")
    assert res["status"] == "success"
    # 120 in Warehouse A + 80 in Warehouse B = 200 units
    assert res["total_units_on_hand"] == 200
    assert len(res["warehouses"]) == 2


def test_get_affected_shipments():
    res = InventoryRecallMCP.get_affected_shipments("LOT-24-A")
    assert res["status"] == "success"
    # 4 shipments carrying LOT-24-A (SHP-101, SHP-102, SHP-103, SHP-099)
    assert res["total_affected_shipments"] == 4
    assert res["summary"]["actionable_hold_count"] == 3  # 2 in transit, 1 pending
    assert res["summary"]["delivered_count"] == 1        # 1 delivered


def test_place_shipping_hold_valid():
    res = InventoryRecallMCP.place_shipping_hold("SHP-101", "LOT-24-A")
    assert res["status"] == "success"
    assert res["new_status"] == "ON_HOLD"


def test_place_shipping_hold_delivered_warning():
    # SHP-099 is already delivered
    res = InventoryRecallMCP.place_shipping_hold("SHP-099", "LOT-24-A")
    assert res["status"] == "warning"
    assert "DELIVERED" in res["message"]


def test_place_shipping_hold_invariant_rejection():
    # SHP-088 carries LOT-24-B, NOT LOT-24-A
    res = InventoryRecallMCP.place_shipping_hold("SHP-088", "LOT-24-A")
    assert res["status"] == "rejected"
    assert res["error"] == "DOMAIN_INVARIANT_VIOLATION"
