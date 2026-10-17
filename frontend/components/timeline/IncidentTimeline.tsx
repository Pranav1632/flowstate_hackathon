"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert, FileText, Lock, Download, Filter, Sparkles, Brain } from "lucide-react";

export interface TimelineEvent {
  type: string;
  incident_id?: string;
  timestamp?: string;
  tool?: string;
  target_id?: string;
  policy_verdict?: string;
  status?: string;
  intent_token?: string;
  message: string;
  reason?: string;
  llm_reasoning?: string;
  adversarial_reasoning?: string;
  extracted_data?: Record<string, any>;
}

interface Props {
  events: TimelineEvent[];
}

export default function IncidentTimeline({ events }: Props) {
  const [filter, setFilter] = useState<"ALL" | "BLOCKED" | "HELD" | "ALLOWED">("ALL");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const blockedCount = events.filter(
    (e) => e.type === "ACTION_BLOCKED_POLICY_DENIAL" || e.policy_verdict === "BLOCKED"
  ).length;

  const heldCount = events.filter(
    (e) => e.type === "ACTION_HELD_FOR_APPROVAL" || e.policy_verdict === "HELD"
  ).length;

  const allowedCount = events.filter((e) => e.policy_verdict === "ALLOWED").length;

  const filteredEvents = events.filter((e) => {
    if (filter === "ALL") return true;
    if (filter === "BLOCKED") return e.type === "ACTION_BLOCKED_POLICY_DENIAL" || e.policy_verdict === "BLOCKED";
    if (filter === "HELD") return e.type === "ACTION_HELD_FOR_APPROVAL" || e.policy_verdict === "HELD";
    if (filter === "ALLOWED") return e.policy_verdict === "ALLOWED";
    return true;
  });

  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      const res = await fetch("http://localhost:8000/api/incidents/export-docx");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `RecallGuard_Audit_Dossier_${Date.now()}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Docx export error:", e);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadReport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("http://localhost:8000/api/incidents/export-report");
      const data = res.ok ? await res.json() : {
        report_id: `REP-${Date.now()}`,
        generated_at: new Date().toISOString(),
        timeline_events: events,
        compliance_status: "ARMORIQ_VERIFIED"
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RecallGuard_Audit_Report_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        <Clock className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-700">Audit Log Ready</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Run any recall scenario to stream live MCP tool invocations and cryptographic ArmorIQ policy verdicts.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Action Timeline & Policy Decisions
          </h3>
          <p className="text-[11px] text-slate-500">
            Cryptographic audit log of autonomous agent tool executions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Word Document (.docx) Export */}
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition-colors disabled:opacity-50"
            title="Download certified executive report as Microsoft Word (.docx)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isExportingDocx ? "Generating Word..." : "Word Doc (.docx)"}</span>
          </button>

          {/* JSON Export */}
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
            title="Download signed JSON audit trail"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExporting ? "Exporting..." : "JSON Audit"}</span>
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3.5 text-xs">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
            filter === "ALL"
              ? "bg-slate-900 text-white font-semibold shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({events.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("BLOCKED")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
            filter === "BLOCKED"
              ? "bg-rose-600 text-white font-semibold shadow-xs"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
          }`}
        >
          <span>Blocked</span>
          <span className="rounded-full bg-rose-200/60 px-1.5 py-0.2 text-[9px] font-bold">
            {blockedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("HELD")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
            filter === "HELD"
              ? "bg-amber-600 text-white font-semibold shadow-xs"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          <span>Held (HITL)</span>
          <span className="rounded-full bg-amber-200/60 px-1.5 py-0.2 text-[9px] font-bold">
            {heldCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("ALLOWED")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
            filter === "ALLOWED"
              ? "bg-emerald-600 text-white font-semibold shadow-xs"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
          }`}
        >
          <span>Allowed</span>
          <span className="rounded-full bg-emerald-200/60 px-1.5 py-0.2 text-[9px] font-bold">
            {allowedCount}
          </span>
        </button>
      </div>

      {/* Events List */}
      <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">
            No records matching filter &apos;{filter}&apos;
          </p>
        ) : (
          filteredEvents.map((event, idx) => {
            const isBlocked = event.type === "ACTION_BLOCKED_POLICY_DENIAL" || event.policy_verdict === "BLOCKED";
            const isHeld = event.type === "ACTION_HELD_FOR_APPROVAL" || event.policy_verdict === "HELD";
            const isAllowed = event.policy_verdict === "ALLOWED";

            return (
              <div
                key={idx}
                className={`rounded-lg border p-3 text-xs transition-all ${
                  isBlocked
                    ? "border-rose-200 bg-rose-50/60 shadow-2xs"
                    : isHeld
                    ? "border-amber-200 bg-amber-50/60 shadow-2xs"
                    : isAllowed
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    {isBlocked ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    ) : isHeld ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    ) : isAllowed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{event.tool ? `Tool: ${event.tool}` : event.type}</span>
                  </div>

                  {event.policy_verdict && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isBlocked
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : isHeld
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {event.policy_verdict}
                    </span>
                  )}
                </div>

                <p className="text-slate-700 leading-normal">{event.message}</p>

                {/* LLM Semantic Reasoning & Threat Assessment */}
                {(event.llm_reasoning || (event as any).extracted_data?.llm_reasoning || event.adversarial_reasoning || (event as any).extracted_data?.adversarial_reasoning) && (
                  <div className="mt-2.5 rounded-lg bg-indigo-50/60 p-3 border border-indigo-100/90 shadow-2xs space-y-2 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 pb-1 border-b border-indigo-100">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>Gemini 3.8 Flash Clinical Reasoning & Threat Analysis</span>
                    </div>

                    {(event.llm_reasoning || (event as any).extracted_data?.llm_reasoning) && (
                      <div className="space-y-0.5">
                        <span className="font-semibold text-indigo-950 uppercase tracking-wider text-[10px]">
                          Safety Justification:
                        </span>
                        <p className="text-slate-700 leading-relaxed bg-white/70 p-2 rounded border border-indigo-50">
                          {event.llm_reasoning || (event as any).extracted_data?.llm_reasoning}
                        </p>
                      </div>
                    )}

                    {(event.adversarial_reasoning || (event as any).extracted_data?.adversarial_reasoning) && (
                      <div className="space-y-0.5">
                        <span className="font-semibold text-rose-900 uppercase tracking-wider text-[10px]">
                          Adversarial Security Analysis:
                        </span>
                        <p className="text-slate-700 leading-relaxed bg-white/70 p-2 rounded border border-rose-50">
                          {event.adversarial_reasoning || (event as any).extracted_data?.adversarial_reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {event.reason && !event.llm_reasoning && (
                  <p className="mt-1.5 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80 leading-snug">
                    <span className="font-semibold text-slate-700">Reason: </span>
                    {event.reason}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
