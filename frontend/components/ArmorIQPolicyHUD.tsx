"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Clock, Key, CheckCircle2, Copy, Check } from "lucide-react";

interface Props {
  intentToken?: string;
  planHash?: string;
  allowedCount: number;
  heldCount: number;
  blockedCount: number;
  phase: "IDLE" | "DECLARE" | "CHECK" | "EXECUTE" | "COMPLETE";
  onOpenHITL?: () => void;
}

export default function ArmorIQPolicyHUD({
  intentToken,
  allowedCount,
  heldCount,
  blockedCount,
  phase,
  onOpenHITL
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    if (intentToken) {
      navigator.clipboard.writeText(intentToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              ArmorIQ Policy & Intent Guard
            </h4>
            <p className="text-xs text-slate-500">
              Cryptographic boundary enforcement
            </p>
          </div>
        </div>

        {/* Phase Pill */}
        <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-600">
          <span className="text-slate-400">Status:</span>
          <span className={`font-semibold ${
            phase === "COMPLETE" ? "text-emerald-700" :
            phase === "EXECUTE" ? "text-indigo-700" :
            phase === "CHECK" ? "text-amber-700" :
            phase === "DECLARE" ? "text-blue-700" : "text-slate-500"
          }`}>
            {phase}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex flex-col rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">ALLOWED</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-900 mt-1">{allowedCount}</span>
          <span className="text-[11px] text-emerald-700">Permitted actions</span>
        </div>

        <div
          onClick={onOpenHITL}
          className="flex flex-col rounded-lg border border-amber-200 bg-amber-50/70 p-3 cursor-pointer hover:border-amber-400 hover:shadow-xs transition-all group"
          title="Click to open Human-in-the-Loop Review Gate"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">HELD (HITL)</span>
            <Clock className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-amber-900">{heldCount}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200 group-hover:bg-amber-200 transition-colors">
              Review Gate ↗
            </span>
          </div>
          <span className="text-[11px] text-amber-700">Click to approve</span>
        </div>

        <div className="flex flex-col rounded-lg border border-rose-100 bg-rose-50/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">BLOCKED</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-rose-900 mt-1">{blockedCount}</span>
          <span className="text-[11px] text-rose-700">Attacks intercepted</span>
        </div>
      </div>

      {/* Token Proof Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-hidden text-slate-600">
          <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 shrink-0">Intent Token:</span>
          <span className="text-slate-700 truncate font-medium">
            {intentToken ? `${intentToken.slice(0, 26)}...` : "None generated"}
          </span>
        </div>

        {intentToken && (
          <button
            onClick={copyToken}
            className="flex items-center gap-1 rounded bg-white hover:bg-slate-100 px-2.5 py-1 text-xs font-sans text-slate-700 border border-slate-200 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
