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
  const [activeTab, setActiveTab] = useState<"matrix" | "studio">("matrix");

  return (
    <div className="space-y-5">
      {/* Workspace Banner matching user's real console */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-white shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white font-black text-sm shadow-sm">
            PG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Pranav Gaikwad&apos;s Workspace
              </h2>
              <span className="rounded bg-gradient-to-r from-violet-600 to-purple-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                PRO
              </span>
              <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                v1 Published
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ArmorTools Policy Studio &bull; Server publication active &bull; Intent governance enforced
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://tools.armoriq.ai/policy-studio"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white hover:bg-violet-50 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-2xs transition-colors"
          >
            <span>Open tools.armoriq.ai</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* Header and Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`pb-1 text-sm font-bold border-b-2 transition-all ${
              activeTab === "matrix"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Supply Chain Governance Matrix (5)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`pb-1 text-sm font-bold border-b-2 transition-all ${
              activeTab === "studio"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ArmorTools Policy Studio (6 Rules)
          </button>
        </div>
      </div>

      {activeTab === "matrix" && (
        <>
          {/* Filter Tabs matching user's screenshot with Violet styling */}
          <div className="flex items-center gap-6 border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilter("All")}
              className={`pb-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                filter === "All"
                  ? "border-violet-600 text-violet-700"
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
                  ? "border-violet-600 text-violet-700"
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

          {/* Policies Table with Violet theme */}
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
                        {/* Policy Name & Violet Icon */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600">
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
        </>
      )}

      {/* VIEW: ArmorTools Policy Studio (Pranav Gaikwad's Live Published Rules) */}
      {activeTab === "studio" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Published Workspace Policy Profile (Version 1)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published from tools.armoriq.ai/policy-studio for agent intent governance and local enforcement.
                </p>
              </div>
              <span className="rounded bg-violet-100 text-violet-800 border border-violet-200 text-xs font-bold px-2.5 py-1">
                6 Active Rules Preserved
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Rule 1 */}
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-800">forbid-destructive-bash</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">BLOCK</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">Forbids destructive shell commands: rm, sudo, chmod.</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-rose-100">
                  tool: Bash | op: in [&quot;rm&quot;, &quot;sudo&quot;, &quot;chmod&quot;]
                </div>
              </div>

              {/* Rule 2 */}
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-800">forbid-force-push</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">BLOCK</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">Forbids force-pushing to git repositories.</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-rose-100">
                  tool: Bash | pattern: git push.*--force
                </div>
              </div>

              {/* Rule 3 */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-800">hold-all-bash</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded">HOLD</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">Requires explicit human approval before executing any shell commands.</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-amber-100">
                  tool: Bash | effect: require_approval
                </div>
              </div>

              {/* Rule 4 */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-800">hold-all-writes</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded">HOLD</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">Requires approval before writing or editing code files.</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-amber-100">
                  tools: [Write, Edit, MultiEdit] | effect: require_approval
                </div>
              </div>

              {/* Rule 5 */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800">allow-read-tools</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">ALLOW</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">Permits read-only inspection tools without blocking workflow.</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-emerald-100">
                  tools: [Read, Grep, Glob, WebSearch] | effect: permit
                </div>
              </div>

              {/* Rule 6 */}
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-800">forbid-read-env</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">BLOCK</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">Blocks direct inspection or exfiltration of .env secret files.</p>
                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-rose-100">
                  tool: Read | match: \\.env | effect: forbid
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
