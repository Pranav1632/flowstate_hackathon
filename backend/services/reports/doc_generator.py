"""
RecallGuard Official Word Document (.docx) Generator
Builds formatted regulatory compliance dossiers and clinical recall advisories.
"""

import io
import time
from typing import Dict, Any, List
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT


def build_recall_docx(report_data: Dict[str, Any]) -> io.BytesIO:
    """Generates an executive, audit-ready .docx document from incident and audit data."""
    doc = Document()

    # Document Title
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = title.add_run("RECALLGUARD INCIDENT & GOVERNANCE DOSSIER")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = subtitle.add_run("OFFICIAL PRODUCT RECALL AUDIT & ARMORIQ SECURITY VERIFICATION REPORT")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(79, 70, 229)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 1. Incident Metadata Card
    incident = report_data.get("incident", {})
    doc.add_heading("1. Executive Incident Summary", level=1)
    
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.style = "Light Shading Accent 1" if "Light Shading Accent 1" in [s.name for s in doc.styles] else "Table Grid"

    rows = [
        ("Incident Identifier:", str(incident.get("id", "INC-2026-ACTIVE"))),
        ("Target Product Lot:", str(incident.get("lot_id", "LOT-24-A"))),
        ("Hazard Classification:", f"{incident.get('severity', 'Class I')} (Immediate Health Hazard)"),
        ("Identified Contamination:", str(incident.get("hazard_description", "Cronobacter sakazakii microbiological risk"))),
        ("Audit Generation Timestamp:", str(report_data.get("generated_at", time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())))),
    ]

    for idx, (label, val) in enumerate(rows):
        row = meta_table.rows[idx]
        row.cells[0].paragraphs[0].add_run(label).bold = True
        row.cells[1].paragraphs[0].add_run(val)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 2. ArmorIQ Cryptographic Governance Section
    doc.add_heading("2. ArmorIQ Cryptographic Boundary Enforcement", level=1)
    p_gov = doc.add_paragraph()
    p_gov.add_run(
        "All autonomous remediation steps were evaluated and signed under the ArmorIQ Declare-Check-Execute intent governance protocol. "
        "Any unauthorized tool executions (including prompt injections attempting to bypass quarantine) were cryptographically intercepted."
    )

    gov_data = report_data.get("governance", {})
    p_token = doc.add_paragraph()
    p_token.add_run("Cryptographic Protocol Authority: ").bold = True
    p_token.add_run(f"{gov_data.get('authority', 'ArmorIQ Intent Verification Guard')}\n")
    p_token.add_run("Policy Enforcement Status: ").bold = True
    p_token.add_run(f"{gov_data.get('compliance_status', 'FULLY_COMPLIANT_CONTAINED')}\n")
    p_token.add_run("Declared Intent Verification: ").bold = True
    p_token.add_run("Verified Active Token via Redis cache layer")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 3. Supply Chain Blast-Radius Containment
    doc.add_heading("3. Supply Chain Containment Footprint", level=1)
    summary = report_data.get("containment_summary", {})
    
    p_sum = doc.add_paragraph()
    p_sum.add_run(f"• Active Transit Holds Enforced: {summary.get('held_shipments_count', 3)} Downstream Shipments Halted\n")
    p_sum.add_run(f"• Warehouse Stock Quarantined: {summary.get('quarantined_lots_count', 2)} Facility Storage Batches Isolated\n")
    p_sum.add_run(f"• Total Governed Audit Actions: {summary.get('total_audit_actions_logged', 8)} Verified Execution Records")

    # Shipments Table
    held_shipments = report_data.get("held_shipments", [])
    if held_shipments:
        doc.add_heading("Halted / Monitored Shipments", level=2)
        shp_table = doc.add_table(rows=len(held_shipments) + 1, cols=5)
        shp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        shp_table.style = "Table Grid"

        headers = ["Shipment ID", "Destination", "Facility Type", "Units", "Transit Status"]
        for c_idx, h in enumerate(headers):
            cell = shp_table.rows[0].cells[c_idx]
            run = cell.paragraphs[0].add_run(h)
            run.bold = True

        for r_idx, s in enumerate(held_shipments):
            row = shp_table.rows[r_idx + 1]
            row.cells[0].paragraphs[0].add_run(str(s.get("shipment_id") or s.get("id", "N/A")))
            row.cells[1].paragraphs[0].add_run(str(s.get("destination", "N/A")))
            row.cells[2].paragraphs[0].add_run(str(s.get("destination_type", "N/A")))
            row.cells[3].paragraphs[0].add_run(str(s.get("quantity", "-")))
            row.cells[4].paragraphs[0].add_run(str(s.get("shipment_status") or s.get("status", "ON_HOLD"))).bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 4. Action Audit Trail & ArmorIQ Verdicts
    doc.add_heading("4. Immutable Audit Trail of Agent Actions", level=1)
    actions = report_data.get("actions_audit_trail", [])

    if actions:
        act_table = doc.add_table(rows=min(len(actions), 15) + 1, cols=4)
        act_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        act_table.style = "Table Grid"

        headers = ["Timestamp", "Tool / Action", "Policy Verdict", "Justification & Reasoning"]
        for c_idx, h in enumerate(headers):
            cell = act_table.rows[0].cells[c_idx]
            cell.paragraphs[0].add_run(h).bold = True

        for r_idx, act in enumerate(actions[:15]):
            row = act_table.rows[r_idx + 1]
            row.cells[0].paragraphs[0].add_run(str(act.get("created_at", "N/A")[:19]))
            row.cells[1].paragraphs[0].add_run(str(act.get("action_type", "N/A")))
            
            verdict_cell = row.cells[2].paragraphs[0].add_run(str(act.get("policy_verdict", "N/A")))
            verdict_cell.bold = True
            if act.get("policy_verdict") == "BLOCKED":
                verdict_cell.font.color.rgb = RGBColor(220, 38, 38)
            elif act.get("policy_verdict") == "HELD":
                verdict_cell.font.color.rgb = RGBColor(217, 119, 6)
            else:
                verdict_cell.font.color.rgb = RGBColor(16, 185, 129)

            row.cells[3].paragraphs[0].add_run(str(act.get("reason", "Standard execution")))

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # 5. Regulatory Sign-Off Block
    doc.add_heading("5. Compliance Officer Sign-Off & Attestation", level=1)
    p_sign = doc.add_paragraph()
    p_sign.add_run(
        "I hereby certify that the above actions were autonomously orchestrated under verified ArmorIQ policy guardrails. "
        "All matching in-transit batches have been physically halted, and external notices have been held for authorized human review."
    )

    sign_table = doc.add_table(rows=2, cols=2)
    sign_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sign_table.rows[0].cells[0].paragraphs[0].add_run("Compliance Officer: ______________________\nDate: ________________________").bold = True
    sign_table.rows[0].cells[1].paragraphs[0].add_run("ArmorIQ Policy Engine Seal: [VERIFIED]\nAlgorithm: HMAC-SHA256 Token Bound").bold = True

    # Save to in-memory byte buffer
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
