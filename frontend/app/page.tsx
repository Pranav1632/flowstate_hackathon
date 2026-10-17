"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Network,
  Clock,
  Database,
  LayoutGrid,
  Sparkles,
  Search,
  Lock,
  Activity,
  Layers,
  ChevronDown,
  User,
  Sliders,
  ExternalLink,
  ChevronRight,
  Eye,
  FileText
} from "lucide-react";
import BlastRadiusGraph from "@/components/BlastRadiusGraph";
import ArmorIQPolicyHUD from "@/components/ArmorIQPolicyHUD";
import ScenarioSelector from "@/components/ScenarioSelector";
import IncidentTimeline, { TimelineEvent } from "@/components/IncidentTimeline";
import ApprovalModal from "@/components/ApprovalModal";
import InventoryTable from "@/components/InventoryTable";
import LLMReasoningSection from "@/components/LLMReasoningSection";
import ArmorIQPoliciesView from "@/components/ArmorIQPoliciesView";
import LandingPage from "@/components/LandingPage";

const API_BASE = "http://localhost:8000";

export default function Home() {
  const [viewMode, setViewMode] = useState<"console" | "landing">("console");
  const [activeSection, setActiveSection] = useState<
    "overview" | "policies" | "topology" | "reasoning" | "audit" | "records"
  >("overview");

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
  const [llmAnalysis, setLlmAnalysis] = useState<any>(null);

  // Database state
  const [inventory, setInventory] = useState<{ lots: any[]; shipments: any[] }>({ lots: [], shipments: [] });
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isDeciding, setIsDeciding] = useState<boolean>(false);
  const [redisStatus, setRedisStatus] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchScenarios();
    fetchInventory();
    fetchApprovals();
    fetchRedisStatus();
    fetchBlastRadius("LOT-24-A");
  }, []);

  const fetchRedisStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/system/redis`);
      if (res.ok) setRedisStatus(await res.json());
    } catch (e) {
      console.error("Error fetching redis status:", e);
    }
  };

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
      setLlmAnalysis(null);
      await fetchInventory();
      await fetchApprovals();
      await fetchBlastRadius("LOT-24-A");
      await fetchRedisStatus();
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
    setLlmAnalysis(null);
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

              if (event.type === "EXTRACTION_COMPLETE") {
                setLlmAnalysis(event);
              } else if (event.type === "ARMORIQ_PLAN_DECLARED") {
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
    } catch (e) {
      console.error("Scenario execution error:", e);
      setPhase("COMPLETE");
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
        body: JSON.stringify({ decision })
      });

      if (res.ok) {
        setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
        await fetchInventory();
      }
    } catch (e) {
      console.error("Decision failed:", e);
    } finally {
      setIsDeciding(false);
    }
  };

  // Render Landing Page if in landing mode
  if (viewMode === "landing") {
    return (
      <LandingPage
        onEnterConsole={() => setViewMode("console")}
        onSelectScenarioAndEnter={(scenarioId) => {
          setViewMode("console");
          handleRunScenario(scenarioId);
        }}
      />
    );
  }

  // Active section title mapper for top breadcrumb
  const sectionLabels: Record<string, string> = {
    overview: "Mission Control Overview",
    policies: "Policies",
    topology: "Topology Graph",
    reasoning: "AI Reasoning & Safety",
    audit: "Activity & Decisions",
    records: "Inventory & Shipments"
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* 1. LEFT ENTERPRISE ICON SIDEBAR (Matching User's ArmorIQ Screenshot) */}
      <aside className="w-16 flex flex-col items-center justify-between py-4 bg-white border-r border-slate-200 z-30 shrink-0">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Brand Logo (Orange Shield/Flame icon matching screenshot) */}
          <button
            type="button"
            onClick={() => setActiveSection("overview")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 hover:scale-105 transition-transform"
            title="RecallGuard Mission Control"
          >
            <Shield className="w-5 h-5" />
          </button>

          {/* Navigation Icon List with Badges */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {/* Overview */}
            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              className={`relative flex flex-col items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                activeSection === "overview"
                  ? "bg-orange-50 text-orange-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Overview"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5">Overview</span>
            </button>

            {/* Policies (Matching Screenshot badge 14/5) */}
            <button
              type="button"
              onClick={() => setActiveSection("policies")}
              className={`relative flex flex-col items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                activeSection === "policies"
                  ? "bg-orange-50 text-orange-600 font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Policies"
            >
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                5
              </span>
              <Shield className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5">Policies</span>
            </button>

            {/* Topology Graph */}
            <button
              type="button"
              onClick={() => setActiveSection("topology")}
              className={`relative flex flex-col items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                activeSection === "topology"
                  ? "bg-orange-50 text-orange-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Topology Graph"
            >
              <Network className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5">Graph</span>
            </button>

            {/* AI Reasoning (Gemini 3.8 Flash) */}
            <button
              type="button"
              onClick={() => setActiveSection("reasoning")}
              className={`relative flex flex-col items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                activeSection === "reasoning"
                  ? "bg-orange-50 text-orange-600 font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="AI Clinical Reasoning & Safety"
            >
              {llmAnalysis && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-[8px] font-medium mt-0.5">AI</span>
            </button>

            {/* Activity & Decisions (Audit Trail) */}
            <button
              type="button"
              onClick={() => setActiveSection("audit")}
              className={`relative flex flex-col items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                activeSection === "audit"
                  ? "bg-orange-50 text-orange-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Activity & Decisions"
            >
              {events.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-white">
                  {events.length}
                </span>
              )}
              <Clock className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5">Activity</span>
            </button>

            {/* Inventory & Shipments */}
            <button
              type="button"
              onClick={() => setActiveSection("records")}
              className={`relative flex flex-col items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                activeSection === "records"
                  ? "bg-orange-50 text-orange-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Inventory Records"
            >
              <Database className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5">Inventory</span>
            </button>
          </nav>
        </div>

        {/* Bottom User Avatar matching screenshot "SK" */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold text-xs border border-orange-200 shadow-2xs"
            title="User: shivam kumar (RecallGuard Officer)"
          >
            SK
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Enterprise Workspace Header (Matching User's Screenshot) */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-20">
          {/* Breadcrumb matching screenshot */}
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-800">Flowstate</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-800">RecallGuard</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-orange-600">ArmorIQ</span>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200 text-slate-600 font-medium">
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-semibold">shivam kumar&apos;s Workspace</span>
              <span className="text-slate-400">/</span>
              <span className="text-orange-600 font-bold">{sectionLabels[activeSection]}</span>
            </div>
          </div>

          {/* Search bar & Live Badges */}
          <div className="flex items-center gap-3">
            {/* Global Search Input */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-48 lg:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Toggle Landing Page Button */}
            <button
              type="button"
              onClick={() => setViewMode("landing")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              title="View Public Landing Page"
            >
              <Layers className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>

            {/* Runtime Indicator Badges */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 shadow-2xs text-[11px]">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Gemini 3.8 Flash</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800 shadow-2xs text-[11px]">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-semibold">ArmorIQ Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* VIEW: POLICIES (Matching User's Screenshot Exactly) */}
          {activeSection === "policies" && <ArmorIQPoliciesView />}

          {/* VIEW: OVERVIEW (Full Mission Control Hub) */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* Scenario Selector & ArmorIQ HUD */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <ScenarioSelector
                    scenarios={scenarios}
                    onRunScenario={handleRunScenario}
                    onSelectScenario={(id) => {
                      if (id === "unknown_lot") {
                        fetchBlastRadius("UNKNOWN-LOT");
                      } else if (id.startsWith("heparin")) {
                        fetchBlastRadius("LOT-CAR-01");
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

              {/* AI Clinical Reasoning Card Preview (if active) */}
              {llmAnalysis && (
                <LLMReasoningSection data={llmAnalysis} isRunning={isRunning} />
              )}

              {/* Topology Preview */}
              <BlastRadiusGraph
                data={blastData}
                adversarialBlocked={adversarialBlocked}
                onSelectSample={(lotId) => fetchBlastRadius(lotId)}
              />

              {/* Bottom Grid: Activity & Inventory */}
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

          {/* VIEW: TOPOLOGY GRAPH */}
          {activeSection === "topology" && (
            <div className="space-y-4">
              <BlastRadiusGraph
                data={blastData}
                adversarialBlocked={adversarialBlocked}
                onSelectSample={(lotId) => fetchBlastRadius(lotId)}
              />
            </div>
          )}

          {/* VIEW: AI REASONING & SAFETY */}
          {activeSection === "reasoning" && (
            <LLMReasoningSection data={llmAnalysis} isRunning={isRunning} />
          )}

          {/* VIEW: ACTIVITY & AUDIT */}
          {activeSection === "audit" && (
            <div className="space-y-4">
              <IncidentTimeline events={events} />
            </div>
          )}

          {/* VIEW: INVENTORY & SHIPMENTS */}
          {activeSection === "records" && (
            <div className="space-y-4">
              <InventoryTable lots={inventory.lots} shipments={inventory.shipments} />
            </div>
          )}
        </main>
      </div>

      {/* Human-in-the-Loop Review Modal */}
      <ApprovalModal
        approvals={approvals}
        onDecide={handleDecideApproval}
        isDeciding={isDeciding}
      />
    </div>
  );
}
