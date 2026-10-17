"use client";

import React from "react";
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert, FileText, Lock } from "lucide-react";

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
}

interface Props {
  events: TimelineEvent[];
}

export default function IncidentTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        <Clock className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-700">Audit Log Ready</p>
        <p className="text-xs text-slate-400 mt-1">
          Real-time tool executions and ArmorIQ policy verdicts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Action Timeline & Policy Decisions
        </h3>
        <span className="text-xs font-mono text-slate-500">
          {events.length} records
        </span>
      </div>

      <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1">
        {events.map((event, idx) => {
          const isBlocked = event.type === "ACTION_BLOCKED_POLICY_DENIAL" || event.policy_verdict === "BLOCKED";
          const isHeld = event.type === "ACTION_HELD_FOR_APPROVAL" || event.policy_verdict === "HELD";
          const isAllowed = event.policy_verdict === "ALLOWED";

          return (
            <div
              key={idx}
              className={`rounded-lg border p-3 text-xs ${
                isBlocked
                  ? "border-rose-200 bg-rose-50/50"
                  : isHeld
                  ? "border-amber-200 bg-amber-50/50"
                  : isAllowed
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
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

              {event.reason && (
                <p className="mt-1.5 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200/80">
                  <span className="font-semibold text-slate-600">Reason: </span>
                  {event.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
