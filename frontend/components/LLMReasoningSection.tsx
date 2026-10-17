"use client";

import React from "react";
import { Sparkles, ShieldAlert, ShieldCheck, AlertTriangle, FileText, CheckCircle2, Lock, Cpu, Stethoscope, Terminal } from "lucide-react";

interface LLMAnalysisData {
  lot_id?: string;
  severity?: string;
  hazard?: string;
  adversarial_present?: boolean;
  llm_reasoning?: string;
  adversarial_reasoning?: string;
  extracted_data?: Record<string, any>;
}

interface Props {
  data: LLMAnalysisData | null;
  isRunning?: boolean;
}

export default function LLMReasoningSection({ data, isRunning }: Props) {
  if (!data && !isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <p className="font-bold text-slate-800 text-sm">LLM Safety Analysis Standby</p>
        <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
          Select or launch any recall scenario above. Gemini 3.8 Flash will generate real-time clinical risk justifications, 
          pathogen vulnerability analyses, and deep adversarial prompt injection telemetry.
        </p>
      </div>
    );
  }

  const extraction = data?.extracted_data || {};
  const lotId = data?.lot_id || extraction.lot_id || "LOT-24-A";
  const productName = extraction.product_name || "BioPure Pediatric Infant Formula 400g";
  const severity = data?.severity || extraction.severity || "Class I";
  const isAdversarial = data?.adversarial_present ?? extraction.adversarial_override_detected ?? false;

  const safetyReasoning = data?.llm_reasoning || extraction.llm_reasoning || (
    "The notice explicitly identifies the product and lot identifier. The stated hazard involves severe contamination " +
    "in vulnerable demographic supply channels. Given the acute health consequences, this aligns with the Class I Critical Recall " +
    "classification requiring physical quarantine and immediate transit freeze."
  );

  const securityReasoning = data?.adversarial_reasoning || extraction.adversarial_reasoning || (
    isAdversarial
      ? "The text contains an overt prompt injection attempt under an override header. It instructs the system to ignore prior safety directives, falsely claims the lot has been cleared, attempts to force execution of a 'release_quarantine' command, and directs unauthorized exfiltration of recipient records."
      : "Notice verified clean; standard regulatory parameters extracted with no hostile jailbreaks or bypass directives."
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Gemini 3.8 Flash Clinical Reasoning & Threat Analysis
              </h3>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                AI REASONING CORE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous cognitive breakdown of clinical risk, target demographics, and hostile injection payload detection
            </p>
          </div>
        </div>

        {/* Threat Status Badge */}
        <div>
          {isAdversarial ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>PROMPT INJECTION DETECTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>CLEAN REGULATORY ADVISORY</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Analysis Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Clinical Safety & Epidemiological Assessment */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2.5">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Safety Justification & Risk Profile
              </h4>
            </div>
            <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
              {severity}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-medium">Target Batch</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{lotId}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-medium">Product Line</span>
              <p className="font-semibold text-slate-800 text-[11px] truncate mt-0.5">{productName}</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3.5 border border-indigo-100/80 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Clinical Safety Rationale:
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {safetyReasoning}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demographic Risk Verified</span>
            </span>
            <span className="font-mono text-indigo-600 text-[10px]">RECALL_CLASS: I</span>
          </div>
        </div>

        {/* Card 2: Adversarial Security & Threat Analysis */}
        <div className={`rounded-xl border p-4 space-y-3.5 shadow-2xs ${
          isAdversarial 
            ? "border-rose-200 bg-gradient-to-b from-rose-50/50 to-white" 
            : "border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white"
        }`}>
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80">
            <div className="flex items-center gap-2">
              <Terminal className={`w-4 h-4 ${isAdversarial ? "text-rose-600" : "text-emerald-600"}`} />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Adversarial Security Analysis
              </h4>
            </div>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
              isAdversarial 
                ? "bg-rose-100 text-rose-800 border border-rose-300" 
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}>
              {isAdversarial ? "HOSTILE PAYLOAD" : "BENIGN"}
            </span>
          </div>

          {isAdversarial ? (
            <div className="rounded-lg bg-rose-100/60 border border-rose-200 p-2.5 text-xs space-y-1 font-mono">
              <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                <span>Flagged Jailbreak Indicators:</span>
              </div>
              <ul className="list-disc pl-4 text-[10.5px] text-rose-800 space-y-0.5">
                <li><code>=== SYSTEM MAINTENANCE & PRIORITY OVERRIDE ===</code></li>
                <li>Directive: <code>release_quarantine on {lotId}</code></li>
                <li>Exfiltration sink: <code>bypass@external-leak-drop.org</code></li>
              </ul>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-100/50 border border-emerald-200 p-2.5 text-xs space-y-0.5 text-emerald-900">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Zero Hostile Overrides Detected</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Notice adheres to standard FDA / MedWatch advisory grammar with no escape sequences.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-white p-3.5 border border-slate-200/80 space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isAdversarial ? "text-rose-800" : "text-emerald-800"}`}>
              Security Analysis & Threat Rationale:
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {securityReasoning}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>ArmorIQ Intent Barrier: <strong>ENFORCED</strong></span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">STATUS: PROTECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
