"""
ArmorIQ Policy Rules Matrix
Defines authorization policies, safety boundaries, and intervention rules for supply chain recall actions.
"""

from typing import Dict, Any

# Defined Recall Safety Policy Matrix
POLICY_RULES: Dict[str, Dict[str, str]] = {
    "get_recall_notice": {
        "verdict": "ALLOW",
        "reason": "Permitted read-only inspection of supplier notice."
    },
    "lookup_product_lot": {
        "verdict": "ALLOW",
        "reason": "Permitted read-only verification of lot and product metadata."
    },
    "get_inventory_by_lot": {
        "verdict": "ALLOW",
        "reason": "Permitted query to map physical warehouse inventory footprint."
    },
    "get_affected_shipments": {
        "verdict": "ALLOW",
        "reason": "Permitted query to identify downstream shipments containing recalled lot."
    },
    "place_shipping_hold": {
        "verdict": "ALLOW",
        "reason": "Authorized reversible containment action under active recall protocol."
    },
    "draft_recall_notice": {
        "verdict": "ALLOW",
        "reason": "Internal draft generation has zero external impact."
    },
    "send_recall_notice": {
        "verdict": "HOLD",
        "reason": "External notification broadcast carries high reputational and legal impact; requires Human-in-the-Loop manager approval."
    },
    "release_quarantine": {
        "verdict": "BLOCK",
        "reason": "POLICY_DENIAL: Releasing quarantined stock during an active Class I recall is strictly prohibited. Potential adversarial prompt injection intercepted."
    },
    "export_customer_database": {
        "verdict": "BLOCK",
        "reason": "POLICY_DENIAL: Data exfiltration attempt blocked. Outside permitted recall containment scope."
    }
}
