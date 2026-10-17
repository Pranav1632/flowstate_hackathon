"use client";

import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, AlertCircle, Network, Clock, Database, LayoutGrid } from "lucide-react";
import BlastRadiusGraph from "@/components/BlastRadiusGraph";
import ArmorIQPolicyHUD from "@/components/ArmorIQPolicyHUD";
import ScenarioSelector from "@/components/ScenarioSelector";
import IncidentTimeline, { TimelineEvent } from "@/components/IncidentTimeline";
import ApprovalModal from "@/components/ApprovalModal";
import InventoryTable from "@/components/InventoryTable";

const API_BASE = "http://localhost:8000";

export default function Home() {
  const [scenarios, setScenarios] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [blastData, setBlastData] = useState<any>(null);
  const [intentToken, setIntentToken] = useState<string>("");
  const [planHash, setPlanHash] = useState<string>("");
  const [allowedCount, setAllowedCount] = useState<number>(0);
  const [heldCount, setHeldCount] = useState<number>(0);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [phase, setPhase] = useState<"IDLE" | "DECLARE" | "CHECK" | "EXECUTE" | "COMPLETE">("IDLE");
  const [adversarialBlocked, setAdversarialBlocked] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<"topology" | "audit" | "records" | "all">("topology");

  // Database state
  const [inventory, setInventory] = useState<{ lots: any[]; shipments: any[] }>({ lots: [], shipments: [] });
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isDeciding, setIsDeciding] = useState<boolean>(false);

  useEffect(() => {
    fetchScenarios();
    fetchInventory();
    fetchApprovals();
    fetchBlastRadius("LOT-24-A");
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scenarios`);
      if (res.ok) setScenarios(await res.json());
    } catch (e) {
      console.error("Error fetching scenarios:", e);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      if (res.ok) setInventory(await res.json());
    } catch (e) {
      console.error("Error fetching inventory:", e);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/approvals`);
      if (res.ok) setApprovals(await res.json());
    } catch (e) {
      console.error("Error fetching approvals:", e);
    }
  };

  const fetchBlastRadius = async (lotId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/blast-radius/${lotId}`);
      if (res.ok) setBlastData(await res.json());
    } catch (e) {
      console.error("Error fetching blast radius:", e);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_BASE}/api/reset`, { method: "POST" });
      setEvents([]);
      setAllowedCount(0);
      setHeldCount(0);
      setBlockedCount(0);
      setIntentToken("");
      setPlanHash("");
      setPhase("IDLE");
      setAdversarialBlocked(false);
      await fetchInventory();
      await fetchApprovals();
      await fetchBlastRadius("LOT-24-A");
    } catch (e) {
      console.error("Reset failed:", e);
    }
  };

  const handleRunScenario = async (scenarioId: string, customText?: string) => {
    setIsRunning(true);
    setEvents([]);
    setAllowedCount(0);
    setHeldCount(0);
    setBlockedCount(0);
    setAdversarialBlocked(false);
    setPhase("DECLARE");

    try {
      const response = await fetch(`${API_BASE}/api/incidents/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notice_id: scenarioId,
          custom_notice_text: customText
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const event: TimelineEvent = JSON.parse(jsonStr);
              setEvents((prev) => [event, ...prev]);

              if (event.type === "ARMORIQ_PLAN_DECLARED") {
                setIntentToken(event.intent_token || "");
                setPlanHash((event as any).plan_hash || "");
                setPhase("CHECK");
              } else if (event.type === "ACTION_EXECUTED") {
                setAllowedCount((c) => c + 1);
                setPhase("EXECUTE");
              } else if (event.type === "ACTION_HELD_FOR_APPROVAL") {
                setHeldCount((c) => c + 1);
                fetchApprovals();
              } else if (event.type === "ACTION_BLOCKED_POLICY_DENIAL") {
                setBlockedCount((c) => c + 1);
                setAdversarialBlocked(true);
              } else if (event.type === "BLAST_RADIUS_COMPUTED") {
                const targetLot = (event as any).blast_radius?.target_lot || "LOT-24-A";
                fetchBlastRadius(targetLot);
              }
            } catch (err) {
              console.error("Failed to parse SSE event:", err);
            }
          }
        }
      }

      setPhase("COMPLETE");
      await fetchInventory();
      await fetchApprovals();
      await fetchBlastRadius("LOT-24-A");
    } catch (e) {
      console.error("Stream run error:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDecideApproval = async (approvalId: string, decision: "APPROVED" | "REJECTED") => {
    setIsDeciding(true);
    try {
      const res = await fetch(`${API_BASE}/api/approvals/${approvalId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewer: "Safety Compliance Officer" })
      });
      if (res.ok) {
        await fetchApprovals();
        await fetchInventory();
        setEvents((prev) => [
          {
            type: "ACTION_EXECUTED",
            message: `Supervisor ${decision}: send_recall_notice officially transmitted to downstream hospitals.`,
            policy_verdict: "ALLOWED",
            status: "EXECUTED"
          },
          ...prev
        ]);
      }
    } catch (e) {
      console.error("Decision failed:", e);
    } finally {
      setIsDeciding(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                RecallGuard
              </h1>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                AI Agent Security
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Governed Supply Chain Recall Response & ArmorIQ Intent Enforcement
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Gemini 3.8 Flash</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
            <span className="font-semibold">ArmorIQ Protection Active</span>
          </div>
        </div>
      </header>

      {/* Top Grid: Scenario Selector & ArmorIQ HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ScenarioSelector
            scenarios={scenarios}
            onRunScenario={handleRunScenario}
            onSelectScenario={(id) => {
              if (id === "unknown_lot") {
                fetchBlastRadius("UNKNOWN-LOT");
              } else {
                fetchBlastRadius("LOT-24-A");
              }
            }}
            isRunning={isRunning}
            onReset={handleReset}
          />
        </div>

        <div className="lg:col-span-5">
          <ArmorIQPolicyHUD
            intentToken={intentToken}
            planHash={planHash}
            allowedCount={allowedCount}
            heldCount={heldCount}
            blockedCount={blockedCount}
            phase={phase}
          />
        </div>
      </div>

      {/* Investigation Operations & Intelligence Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveSection("topology")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeSection === "topology"
                  ? "bg-white text-indigo-700 shadow-xs font-semibold ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Blast-Radius Topology</span>
              {blastData?.nodes?.length ? (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                  {blastData.nodes.length} nodes
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("audit")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeSection === "audit"
                  ? "bg-white text-indigo-700 shadow-xs font-semibold ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Action Audit & Decisions</span>
              {events.length > 0 && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  {events.length} records
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("records")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeSection === "records"
                  ? "bg-white text-indigo-700 shadow-xs font-semibold ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supply Chain Records</span>
              {inventory?.shipments?.length ? (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  {inventory.shipments.length} shipments
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("all")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeSection === "all"
                  ? "bg-white text-indigo-700 shadow-xs font-semibold ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Overview (All-in-One)</span>
            </button>
          </div>

          {/* Quick status indicator */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span className="font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
              Active Batch: <span className="font-bold text-slate-900">{blastData?.lot_id || "LOT-24-A"}</span>
            </span>
            {isRunning && (
              <span className="flex items-center gap-1.5 font-semibold text-indigo-600 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                Investigation in Progress...
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Section Rendering */}
        {activeSection === "topology" && (
          <BlastRadiusGraph
            data={blastData}
            adversarialBlocked={adversarialBlocked}
            onSelectSample={(lotId) => fetchBlastRadius(lotId)}
          />
        )}

        {activeSection === "audit" && (
          <div className="w-full">
            <IncidentTimeline events={events} />
          </div>
        )}

        {activeSection === "records" && (
          <div className="w-full">
            <InventoryTable lots={inventory.lots} shipments={inventory.shipments} />
          </div>
        )}

        {activeSection === "all" && (
          <div className="space-y-6">
            <BlastRadiusGraph
              data={blastData}
              adversarialBlocked={adversarialBlocked}
              onSelectSample={(lotId) => fetchBlastRadius(lotId)}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <IncidentTimeline events={events} />
              </div>
              <div className="lg:col-span-6">
                <InventoryTable lots={inventory.lots} shipments={inventory.shipments} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Human-in-the-Loop Review Modal */}
      <ApprovalModal
        approvals={approvals}
        onDecide={handleDecideApproval}
        isDeciding={isDeciding}
      />
    </main>
  );
}
