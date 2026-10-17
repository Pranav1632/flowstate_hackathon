"use client";

import React, { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Lock, Sliders, Check, FileCode, CheckCircle2, AlertTriangle, ArrowUpDown } from "lucide-react";

interface PolicyItem {
  id: string;
  name: string;
  target: string;
  tool: string;
  status: "Active" | "Inactive" | "Shadow";
  verdict: "ALLOW" | "HOLD" | "BLOCK";
  enforces: string;
  description: string;
}

const POLICIES_DATA: PolicyItem[] = [
  {
    id: "pol-001",
    name: "cli-recallguard-shipping-holds-live",
    target: "mcp-logistics-live",
    tool: "place_shipping_hold",
    status: "Active",
    verdict: "ALLOW",
    enforces: "1 allow",
    description: "Permits autonomous transit holds on downstream shipments matching confirmed recall lot."
  },
  {
    id: "pol-002",
    name: "cli-recallguard-warehouse-quarantine-live",
    target: "mcp-warehouse-live",
    tool: "quarantine_lot",
    status: "Active",
    verdict: "ALLOW",
    enforces: "1 allow",
    description: "Permits moving active warehouse inventory lots to QUARANTINED state."
  },
  {
    id: "pol-003",
    name: "cli-recallguard-hospital-broadcast-live",
    target: "mcp-advisory-live",
    tool: "send_recall_notice",
    status: "Active",
    verdict: "HOLD",
    enforces: "1 hold (HITL)",
    description: "Halts external notification broadcast for mandatory Human-in-the-Loop compliance approval."
  },
  {
    id: "pol-004",
    name: "cli-recallguard-quarantine-release-denial",
    target: "mcp-warehouse-live",
    tool: "release_quarantine",
    status: "Active",
    verdict: "BLOCK",
    enforces: "1 block",
    description: "Strictly denies releasing quarantined inventory during active Class I recalls (Anti-Injection Defense)."
  },
  {
    id: "pol-005",
    name: "cli-recallguard-data-exfiltration-denial",
    target: "mcp-security-live",
    tool: "dump_database",
    status: "Active",
    verdict: "BLOCK",
    enforces: "1 block",
    description: "Intercepts and denies unauthorized recipient shipping database exports to unverified sinks."
  }
];

export default function ArmorIQPoliciesView() {
  const [filter, setFilter] = useState<"All" | "Active" | "Draft" | "Shadow" | "Inactive">("All");

  return (
    <div className="space-y-5">
      {/* Header matching user's screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Policies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Govern what each agent and MCP server can do. Pick a target, see its real tools, govern each.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Import YAML</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs matching user's screenshot */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => setFilter("All")}
          className={`pb-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            filter === "All"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>All</span>
          <span className="text-[11px] text-slate-400">5</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("Active")}
          className={`pb-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            filter === "Active"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Active</span>
          <span className="text-[11px] text-emerald-600 font-bold">5</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("Draft")}
          className="pb-2.5 font-medium flex items-center gap-1.5 border-b-2 border-transparent text-slate-400 hover:text-slate-600"
        >
          <span>Draft</span>
          <span className="text-[11px] text-slate-400">0</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("Shadow")}
          className="pb-2.5 font-medium flex items-center gap-1.5 border-b-2 border-transparent text-slate-400 hover:text-slate-600"
        >
          <span>Shadow</span>
          <span className="text-[11px] text-slate-400">0</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("Inactive")}
          className="pb-2.5 font-medium flex items-center gap-1.5 border-b-2 border-transparent text-slate-400 hover:text-slate-600"
        >
          <span>Inactive</span>
          <span className="text-[11px] text-slate-400">0</span>
        </button>
      </div>

      {/* Policies Table matching screenshot */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Policy</th>
                <th className="py-3 px-4">Target MCP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Enforces</th>
                <th className="py-3 px-4">Safety Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {POLICIES_DATA.map((pol) => {
                const isAllow = pol.verdict === "ALLOW";
                const isHold = pol.verdict === "HOLD";
                const isBlock = pol.verdict === "BLOCK";

                return (
                  <tr key={pol.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Policy Name & Icon */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-orange-600">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-slate-900">{pol.name}</p>
                          <p className="text-[10px] text-slate-400">Tool: {pol.tool}</p>
                        </div>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <span>📦</span>
                        <span>{pol.target}</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    </td>

                    {/* Enforces Column */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                        isAllow
                          ? "text-emerald-700 bg-emerald-50"
                          : isHold
                          ? "text-amber-800 bg-amber-50"
                          : "text-rose-700 bg-rose-50"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isAllow ? "bg-emerald-500" : isHold ? "bg-amber-500" : "bg-rose-500"
                        }`} />
                        <span>{pol.enforces}</span>
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {pol.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
