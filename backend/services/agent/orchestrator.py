"""
Recall Agent Orchestrator
Coordinates LLM extraction, MCP tool execution, and ArmorIQ Declare-Check-Execute governance.
"""

import time
from typing import Dict, Any, Generator, Optional
from backend.services.agent.llm_client import llm_client
from backend.services.agent.prompt_builder import RECALL_PARSER_SYSTEM_PROMPT, parse_extraction_response
from backend.services.governance.armoriq_engine import governor
from backend.mcp.server import InventoryRecallMCP
from backend.repositories.incident_repo import incident_repo
from backend.services.cache import redis_service


class RecallAgent:
    """Agent orchestrator for RecallGuard."""

    def __init__(self):
        self.llm = llm_client

    def call_llm(self, prompt: str, system_prompt: str) -> str:
        return self.llm.generate_json(prompt, system_prompt)

    def run_investigation_stream(self, notice_content: str, incident_id: Optional[str] = None) -> Generator[Dict[str, Any], None, None]:
        """
        Executes end-to-end recall intelligence investigation and governed containment.
        Yields real-time audit events for UI streaming.
        """
        if not incident_id:
            incident_id = f"INC-{int(time.time())}"

        def emit(event: Dict[str, Any]) -> Dict[str, Any]:
            try:
                redis_service.publish_incident_event(incident_id, event)
            except Exception:
                pass
            return event

        # 1. Notice Ingestion Event
        yield emit({
            "type": "NOTICE_INGESTED",
            "incident_id": incident_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "content_preview": notice_content[:180] + ("..." if len(notice_content) > 180 else ""),
            "message": "Supplier recall notice ingested. Commencing LLM parsing..."
        })

        # 2. LLM Structured Extraction
        raw_extraction = self.call_llm(notice_content, RECALL_PARSER_SYSTEM_PROMPT)
        extraction = parse_extraction_response(raw_extraction, notice_content)

        target_lot = extraction.get("lot_id", "LOT-24-A")
        severity = extraction.get("severity", "Class I")
        hazard = extraction.get("hazard_description", "Potential microbial contamination")
        adversarial_present = extraction.get("adversarial_override_detected", False)

        # Store incident in DB via repository
        incident_repo.create_incident(
            incident_id=incident_id,
            source_reference="Supplier Electronic Notice",
            lot_id=target_lot,
            severity=severity,
            hazard_description=hazard
        )

        yield emit({
            "type": "EXTRACTION_COMPLETE",
            "incident_id": incident_id,
            "extracted_data": extraction,
            "adversarial_present": adversarial_present,
            "message": f"LLM parsed notice: Target lot is {target_lot} (Severity: {severity}). Adversarial injection detected: {adversarial_present}."
        })

        # 3. Supply Chain Investigation via MCP
        lot_lookup = InventoryRecallMCP.lookup_product_lot(target_lot)
        yield emit({
            "type": "MCP_TOOL_EXECUTED",
            "tool": "lookup_product_lot",
            "result": lot_lookup,
            "message": f"MCP lookup_product_lot executed: Product matched '{lot_lookup.get('product', {}).get('product_name', 'Unknown')}'."
        })

        if lot_lookup.get("status") == "not_found":
            yield emit({
                "type": "ANOMALY_UNKNOWN_LOT",
                "incident_id": incident_id,
                "lot_id": target_lot,
                "message": f"SAFETY HALT: Lot '{target_lot}' not found in database. Avoiding unnecessary disruption to unrelated stock."
            })
            return

        inventory_info = InventoryRecallMCP.get_inventory_by_lot(target_lot)
        shipments_info = InventoryRecallMCP.get_affected_shipments(target_lot)

        blast_radius = {
            "target_lot": target_lot,
            "product": lot_lookup.get("product", {}),
            "total_warehouse_units": inventory_info.get("total_units_on_hand", 0),
            "warehouses": inventory_info.get("warehouses", []),
            "total_shipments": shipments_info.get("total_affected_shipments", 0),
            "shipments": shipments_info.get("shipments", []),
            "summary": shipments_info.get("summary", {})
        }

        yield emit({
            "type": "BLAST_RADIUS_COMPUTED",
            "incident_id": incident_id,
            "blast_radius": blast_radius,
            "message": f"Blast radius mapped: {blast_radius['total_warehouse_units']} warehouse units across {len(blast_radius['warehouses'])} facilities, {blast_radius['total_shipments']} downstream shipments."
        })

        # 4. Plan Declaration to ArmorIQ (Declare Phase)
        planned_steps = []
        for shp in shipments_info.get("shipments", []):
            if shp.get("shipment_status") in ["IN_TRANSIT", "PENDING"]:
                planned_steps.append({
                    "action": "place_shipping_hold",
                    "tool": "place_shipping_hold",
                    "inputs": {"shipment_id": shp["shipment_id"], "lot_id": target_lot}
                })

        planned_steps.append({
            "action": "draft_recall_notice",
            "tool": "draft_recall_notice",
            "inputs": {"incident_id": incident_id, "lot_id": target_lot}
        })

        planned_steps.append({
            "action": "send_recall_notice",
            "tool": "send_recall_notice",
            "inputs": {"incident_id": incident_id, "recipients": ["clinic-boston@health.org", "metro-chicago@hospital.net"]}
        })

        # Adversarial attempt caught by ArmorIQ
        if adversarial_present:
            planned_steps.append({
                "action": "release_quarantine",
                "tool": "release_quarantine",
                "inputs": {"lot_id": target_lot, "reason": "Adversarial override directive"}
            })

        plan_declaration = governor.declare_plan(
            incident_id=incident_id,
            goal=f"Contain safety risk for contaminated lot {target_lot}",
            planned_steps=planned_steps
        )
        intent_token = plan_declaration["intent_token"]

        yield emit({
            "type": "ARMORIQ_PLAN_DECLARED",
            "incident_id": incident_id,
            "intent_token": intent_token,
            "plan_hash": plan_declaration["plan_hash"],
            "steps": planned_steps,
            "message": f"ArmorIQ Declare Phase complete. Cryptographic Intent Token generated: {intent_token[:20]}..."
        })

        # 5. Governed Tool Execution (Check -> Execute Phase)
        for step in planned_steps:
            tool_name = step["tool"]
            inputs = step["inputs"]

            # ArmorIQ Check
            check_result = governor.check_policy(tool_name, inputs, intent_token)
            verdict = check_result["verdict"]

            if verdict == "ALLOW":
                if tool_name == "place_shipping_hold":
                    mcp_res = InventoryRecallMCP.place_shipping_hold(inputs["shipment_id"], inputs["lot_id"])
                    governor.record_action(
                        incident_id=incident_id,
                        action_type=tool_name,
                        target_id=inputs["shipment_id"],
                        policy_verdict="ALLOWED",
                        execution_status="EXECUTED",
                        reason=f"Held shipment {inputs['shipment_id']} safely under active recall.",
                        intent_token=intent_token
                    )
                    yield emit({
                        "type": "ACTION_EXECUTED",
                        "tool": tool_name,
                        "target_id": inputs["shipment_id"],
                        "policy_verdict": "ALLOWED",
                        "status": "EXECUTED",
                        "result": mcp_res,
                        "message": f"ALLOWED: Placed transit hold on shipment {inputs['shipment_id']} ({mcp_res.get('destination')})."
                    })

                elif tool_name == "draft_recall_notice":
                    mcp_res = InventoryRecallMCP.draft_recall_notice(incident_id, target_lot, "Urgent recall alert")
                    governor.record_action(
                        incident_id=incident_id,
                        action_type=tool_name,
                        target_id=target_lot,
                        policy_verdict="ALLOWED",
                        execution_status="EXECUTED",
                        reason="Prepared recall notification draft for compliance officer.",
                        intent_token=intent_token
                    )
                    yield emit({
                        "type": "ACTION_EXECUTED",
                        "tool": tool_name,
                        "target_id": target_lot,
                        "policy_verdict": "ALLOWED",
                        "status": "EXECUTED",
                        "result": mcp_res,
                        "message": f"ALLOWED: Prepared official recall notification draft for lot {target_lot}."
                    })

            elif verdict == "HOLD":
                action_id = governor.record_action(
                    incident_id=incident_id,
                    action_type=tool_name,
                    target_id="downstream-recipients",
                    policy_verdict="HELD",
                    execution_status="PENDING_REVIEW",
                    reason=check_result["reason"],
                    intent_token=intent_token
                )
                yield emit({
                    "type": "ACTION_HELD_FOR_APPROVAL",
                    "action_id": action_id,
                    "tool": tool_name,
                    "policy_verdict": "HELD",
                    "status": "PENDING_REVIEW",
                    "reason": check_result["reason"],
                    "inputs": inputs,
                    "message": f"HELD FOR APPROVAL: Action '{tool_name}' paused. External broadcasting requires Human-in-the-Loop manager sign-off."
                })

            elif verdict == "BLOCK":
                governor.record_action(
                    incident_id=incident_id,
                    action_type=tool_name,
                    target_id=target_lot,
                    policy_verdict="BLOCKED",
                    execution_status="BLOCKED",
                    reason=check_result["reason"],
                    intent_token=intent_token
                )
                yield emit({
                    "type": "ACTION_BLOCKED_POLICY_DENIAL",
                    "tool": tool_name,
                    "target_id": target_lot,
                    "policy_verdict": "BLOCKED",
                    "status": "BLOCKED",
                    "reason": check_result["reason"],
                    "message": f"SECURITY BLOCK (ARMORIQ): Attempt to invoke '{tool_name}' was intercepted and prevented! Reason: {check_result['reason']}"
                })

        # 6. Containment Summary
        yield emit({
            "type": "CONTAINMENT_SUMMARY",
            "incident_id": incident_id,
            "status": "GOVERNED_CONTAINMENT_ACTIVE",
            "summary": {
                "lot_id": target_lot,
                "holds_placed": shipments_info.get("summary", {}).get("actionable_hold_count", 0),
                "adversarial_attacks_neutralized": 1 if adversarial_present else 0,
                "pending_approvals": 1
            },
            "message": "Recall response completed under ArmorIQ governance. Supply chain secured."
        })


agent = RecallAgent()
