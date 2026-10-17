"use client";

import React, { useState } from "react";
import { Play, RotateCcw, ShieldAlert, AlertTriangle, FileText } from "lucide-react";

interface Props {
  scenarios: Record<string, any>;
  onRunScenario: (scenarioId: string, customText?: string) => void;
  onSelectScenario?: (scenarioId: string) => void;
  isRunning: boolean;
  onReset: () => void;
}

export default function ScenarioSelector({
  scenarios,
  onRunScenario,
  onSelectScenario,
  isRunning,
  onReset
}: Props) {
  const [selectedScenario, setSelectedScenario] = useState<string>("adversarial");
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>("");

  const handleLaunch = () => {
    if (customMode) {
      onRunScenario("custom", customText);
    } else {
      onRunScenario(selectedScenario);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Recall Scenarios
        </h3>

        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs text-slate-600 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Inventory</span>
        </button>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Scenario 2 (Adversarial) */}
        <button
          type="button"
          onClick={() => {
            setSelectedScenario("adversarial");
            setCustomMode(false);
            onSelectScenario?.("adversarial");
          }}
          className={`flex flex-col text-left rounded-lg p-3.5 border transition-all ${
            !customMode && selectedScenario === "adversarial"
              ? "border-rose-400 bg-rose-50/50 ring-2 ring-rose-200"
              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
              Recommended Demo
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">Prompt Injection Attack</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Notice contains hidden payload ordering quarantine release. ArmorIQ stops the action.
          </p>
        </button>

        {/* Scenario 1 (Standard) */}
        <button
          type="button"
          onClick={() => {
            setSelectedScenario("standard");
            setCustomMode(false);
            onSelectScenario?.("standard");
          }}
          className={`flex flex-col text-left rounded-lg p-3.5 border transition-all ${
            !customMode && selectedScenario === "standard"
              ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200"
              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              Standard
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">Legitimate Recall Notice</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Standard contamination notice for LOT-24-A. Holds 3 in-transit shipments cleanly.
          </p>
        </button>

        {/* Scenario 3 (Unknown Lot) */}
        <button
          type="button"
          onClick={() => {
            setSelectedScenario("unknown_lot");
            setCustomMode(false);
            onSelectScenario?.("unknown_lot");
          }}
          className={`flex flex-col text-left rounded-lg p-3.5 border transition-all ${
            !customMode && selectedScenario === "unknown_lot"
              ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-200"
              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Safety Check
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">Unknown Lot Notice</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Notice with non-existent lot identifier. Validates no false-positive shipment holds.
          </p>
        </button>
      </div>

      {/* Notice Content Preview & Launch */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{customMode ? "Custom Notice Editor" : scenarios[selectedScenario]?.title || "Notice Preview"}</span>
          </div>
          <button
            type="button"
            onClick={() => setCustomMode(!customMode)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {customMode ? "Select Preset" : "Edit Custom Text"}
          </button>
        </div>

        {customMode ? (
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type or paste custom recall notice text..."
            rows={4}
            className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <div className="max-h-24 overflow-y-auto rounded-md bg-white p-2.5 text-xs font-mono text-slate-700 border border-slate-200 leading-relaxed">
            {scenarios[selectedScenario]?.content || "Loading scenario text..."}
          </div>
        )}

        <div className="mt-3.5 flex items-center justify-end">
          <button
            type="button"
            onClick={handleLaunch}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <span className="flex h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Running Agent & Policy Check...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Governed Response</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
