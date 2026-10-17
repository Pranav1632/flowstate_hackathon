"use client";

import React from "react";
import { UserCheck, Check, X, AlertTriangle } from "lucide-react";

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
}

export default function ApprovalModal({ approvals, onDecide, isDeciding }: Props) {
  if (approvals.length === 0) return null;

  const current = approvals[0];
  let payloadParsed: any = {};
  try {
    payloadParsed = JSON.parse(current.payload);
  } catch (e) {
    payloadParsed = { reason: current.payload };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Human Review & Approval Required
            </h3>
            <p className="text-xs text-slate-500">
              ArmorIQ Policy Gate: High-impact action held for supervisor review
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Proposed Action:</span>
              <span className="font-mono font-semibold text-slate-800">{current.action_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Incident:</span>
              <span className="font-mono text-slate-700">{current.incident_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Scope:</span>
              <span className="text-slate-700 font-medium">Downstream Pediatric Facilities</span>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
            <p className="font-semibold text-amber-900 mb-0.5">Policy Justification:</p>
            <p className="text-amber-800 leading-relaxed">
              {payloadParsed.reason || "External notices carry high regulatory impact. Explicit sign-off required."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onDecide(current.id, "REJECTED")}
            disabled={isDeciding}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
          >
            Reject
          </button>

          <button
            type="button"
            onClick={() => onDecide(current.id, "APPROVED")}
            disabled={isDeciding}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve & Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
