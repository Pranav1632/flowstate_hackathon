"use client";

import React, { useState } from "react";
import { UserCheck, Check, X, AlertTriangle, Mail, Send, Eye, EyeOff, ShieldCheck, Hospital } from "lucide-react";

interface ApprovalItem {
  id: string;
  incident_id: string;
  action_type: string;
  target_id: string;
  payload: string;
  status: string;
  created_at: string;
}

interface Props {
  approvals: ApprovalItem[];
  onDecide: (approvalId: string, decision: "APPROVED" | "REJECTED") => void;
  isDeciding?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const SAMPLE_APPROVAL: ApprovalItem = {
  id: "app-sample-01",
  incident_id: "INC-RECALL-982",
  action_type: "send_recall_notice",
  target_id: "LOT-24-A",
  payload: JSON.stringify({
    lot_id: "LOT-24-A",
    affected_count: 4,
    reason: "External recall broadcast carries legal & clinical impact; requires compliance officer authorization."
  }),
  status: "PENDING_REVIEW",
  created_at: new Date().toISOString()
};

export default function ApprovalModal({ approvals, onDecide, isDeciding, isOpen, onClose }: Props) {
  const [showPreview, setShowPreview] = useState<boolean>(true);

  const shouldShow = isOpen !== undefined ? isOpen : approvals.length > 0;
  if (!shouldShow) return null;

  const current = approvals.length > 0 ? approvals[0] : SAMPLE_APPROVAL;
  let payloadParsed: any = {};
  try {
    payloadParsed = JSON.parse(current.payload);
  } catch (e) {
    payloadParsed = { reason: current.payload };
  }

  const lotId = payloadParsed.lot_id || current.target_id || "LOT-24-A";
  const affectedCount = payloadParsed.affected_count || 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8 relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Human-in-the-Loop Policy Gate
                </h3>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 tracking-wider">
                  HELD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ArmorIQ Rule: High-impact external broadcasts require explicit supervisor sign-off
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Metadata info */}
        <div className="space-y-3 mb-5">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Proposed Action:</span>
              <span className="font-mono font-semibold text-slate-800">{current.action_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Identifier:</span>
              <span className="font-mono font-bold text-indigo-700">{lotId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Recipients:</span>
              <span className="text-slate-700 font-medium">
                {affectedCount} Pediatric Clinics, Hospitals & Pharmacy Hubs
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
            <p className="font-semibold text-amber-900 mb-0.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Policy Justification:
            </p>
            <p className="text-amber-800 leading-relaxed">
              {payloadParsed.reason || "External notification broadcast carries high reputational and legal impact; requires Human-in-the-Loop manager approval."}
            </p>
          </div>

          {/* Email / Advisory Preview Accordion */}
          <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-between bg-slate-100/70 px-3.5 py-2 text-left font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Clinical & Hospital Advisory Email Preview</span>
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPreview ? "Collapse" : "Preview Email"}
              </span>
            </button>

            {showPreview && (
              <div className="p-3.5 bg-slate-50/50 space-y-2.5 font-sans border-t border-slate-200">
                <div className="space-y-1 pb-2 border-b border-slate-200 text-[11px]">
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-16">To:</span>
                    <span className="text-slate-700 font-medium truncate">
                      St. Jude Pediatric Clinic, Metro General Hospital, City Care Hub
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-16">Subject:</span>
                    <span className="text-slate-900 font-bold">
                      [URGENT CLASS I RECALL] Immediate Quarantine Directive: BioPure Pediatric ({lotId})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-16">Gateway:</span>
                    <span className="font-mono text-indigo-600">EDI 856 / HL7 Hospital Alerts / TLS SMTP</span>
                  </div>
                </div>

                <div className="rounded bg-white p-3 border border-slate-200 text-slate-700 text-[11px] leading-relaxed space-y-2">
                  <p className="font-semibold text-rose-800">
                    ATTENTION: CHIEF MEDICAL OFFICER / PHARMACY DIRECTORS
                  </p>
                  <p>
                    NutriLife BioTech in coordination with the FDA has initiated an immediate Class I voluntary recall on 
                    <strong> BioPure Pediatric Infant Formula 400g (Lot {lotId})</strong> due to potential <em>Cronobacter sakazakii</em> contamination.
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li>Immediately locate and remove Lot {lotId} from clinical wards & dispensing carts.</li>
                    <li>Move all in-transit or receiving inventory into secure Physical Quarantine.</li>
                    <li>Notify any outpatients issued this batch within the last 72 hours.</li>
                  </ul>
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Cryptographically Authenticated by ArmorIQ Policy Gate</span>
                    <span className="font-mono">DIGITAL_SIG: 0x9f32b... verified</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audited & Signed by ArmorIQ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDecide(current.id, "REJECTED")}
              disabled={isDeciding}
              className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
            >
              Reject
            </button>

            <button
              type="button"
              onClick={() => onDecide(current.id, "APPROVED")}
              disabled={isDeciding}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Approve & Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
