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
  FileText,
  UserCheck
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
  const [isHITLModalOpen, setIsHITLModalOpen] = useState<boolean>(false);
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
    if (approvalId === "app-sample-01") {
      setTimeout(() => {
        setIsDeciding(false);
        setIsHITLModalOpen(false);
        setHeldCount((c) => Math.max(0, c - 1));
        if (decision === "APPROVED") setAllowedCount((c) => c + 1);
        else setBlockedCount((c) => c + 1);
      }, 400);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/approvals/${approvalId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      });

      if (res.ok) {
        setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
        await fetchInventory();
        setIsHITLModalOpen(false);
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
      {/* 1. MAIN CONTAINER (Full-Width, Expanding across all columns on left/center) */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Enterprise Header (Original RecallGuard Branding, No Copied Workspace) */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-20">
          {/* Authentic RecallGuard Breadcrumb */}
          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-extrabold text-slate-900 tracking-tight text-sm">RecallGuard</span>
            <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200">
              Mission Control
            </span>
            <span className="text-slate-300">/</span>
            <span className="hidden sm:inline text-slate-500 font-medium">Incident Governance</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-bold text-violet-700">{sectionLabels[activeSection]}</span>
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
                className="w-48 lg:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Human-in-the-Loop Review Gate Button */}
            <button
              type="button"
              onClick={() => setIsHITLModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                approvals.length > 0 || heldCount > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse shadow-md shadow-amber-500/20"
                  : "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900"
              }`}
              title="Open Human-in-the-Loop Policy Review Gate"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Human Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                approvals.length > 0 || heldCount > 0
                  ? "bg-white text-amber-900"
                  : "bg-amber-200 text-amber-900"
              }`}>
                {approvals.length > 0 ? `${approvals.length} HELD` : heldCount > 0 ? `${heldCount} HELD` : "HITL"}
              </span>
            </button>

            {/* Toggle Landing Page Button */}
            <button
              type="button"
              onClick={() => setViewMode("landing")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 hover:bg-violet-100 text-xs font-semibold text-violet-700 transition-colors"
              title="View Public Landing Page"
            >
              <Layers className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>

            {/* Runtime Indicator Badges */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 shadow-2xs text-[11px]">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Gemini 3.8 Flash</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-800 shadow-2xs text-[11px]">
                <span className="flex h-2 w-2 rounded-full bg-violet-600" />
                <span className="font-semibold">ArmorIQ Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace View (FULL WIDTH, BIG IN SIZE, FILLS ALL COLUMNS) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-none">
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
                    onOpenHITL={() => setIsHITLModalOpen(true)}
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

      {/* 2. RIGHT ENTERPRISE NAVIGATION PANEL (Big in size with Large Logo) */}
      <aside className="w-28 sm:w-32 flex flex-col items-center justify-between py-5 bg-white border-l border-slate-200 z-30 shrink-0 shadow-sm">
        <div className="flex flex-col items-center gap-6 w-full px-2">
          {/* Large Brand Logo Header */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all duration-200 group"
              title="RecallGuard Mission Control"
            >
              <Shield className="w-7 h-7 text-white stroke-[2.2] group-hover:rotate-6 transition-transform" />
            </button>
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] font-black tracking-tight text-slate-900 leading-tight">
                RecallGuard
              </span>
              <span className="text-[9px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/80 mt-0.5">
                ArmorIQ
              </span>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200/80" />

          {/* Large Navigation Buttons */}
          <nav className="flex flex-col items-center gap-2.5 w-full">
            {/* Overview */}
            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              className={`relative flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl transition-all duration-150 group ${
                activeSection === "overview"
                  ? "bg-violet-100 text-violet-800 font-bold shadow-xs border border-violet-300/80"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
              title="Mission Control Overview"
            >
              <LayoutGrid className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${activeSection === "overview" ? "text-violet-700" : "text-slate-500"}`} />
              <span className="text-[11px] font-semibold tracking-tight">Overview</span>
            </button>

            {/* Policies (with 5 badge) */}
            <button
              type="button"
              onClick={() => setActiveSection("policies")}
              className={`relative flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl transition-all duration-150 group ${
                activeSection === "policies"
                  ? "bg-violet-100 text-violet-800 font-bold shadow-xs border border-violet-300/80"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
              title="ArmorIQ Policy Studio (5 Active Rules)"
            >
              <span className="absolute top-1.5 right-2 flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-black text-white shadow-xs ring-2 ring-white">
                5
              </span>
              <Shield className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${activeSection === "policies" ? "text-violet-700" : "text-slate-500"}`} />
              <span className="text-[11px] font-semibold tracking-tight">Policies</span>
            </button>

            {/* Graph */}
            <button
              type="button"
              onClick={() => setActiveSection("topology")}
              className={`relative flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl transition-all duration-150 group ${
                activeSection === "topology"
                  ? "bg-violet-100 text-violet-800 font-bold shadow-xs border border-violet-300/80"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
              title="Supply Chain Topology Graph"
            >
              <Network className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${activeSection === "topology" ? "text-violet-700" : "text-slate-500"}`} />
              <span className="text-[11px] font-semibold tracking-tight">Graph</span>
            </button>

            {/* AI */}
            <button
              type="button"
              onClick={() => setActiveSection("reasoning")}
              className={`relative flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl transition-all duration-150 group ${
                activeSection === "reasoning"
                  ? "bg-violet-100 text-violet-800 font-bold shadow-xs border border-violet-300/80"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
              title="Gemini 3.8 Flash Clinical Reasoning & Threat Analysis"
            >
              {llmAnalysis && (
                <span className="absolute top-1.5 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-600" />
                </span>
              )}
              <Sparkles className="w-5 h-5 mb-1 text-violet-600 transition-transform group-hover:scale-110" />
              <span className="text-[11px] font-semibold tracking-tight">AI</span>
            </button>

            {/* Activity */}
            <button
              type="button"
              onClick={() => setActiveSection("audit")}
              className={`relative flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl transition-all duration-150 group ${
                activeSection === "audit"
                  ? "bg-violet-100 text-violet-800 font-bold shadow-xs border border-violet-300/80"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
              title="Activity & Live Decision Timeline"
            >
              {events.length > 0 && (
                <span className="absolute top-1.5 right-2 flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-white shadow-xs ring-2 ring-white">
                  {events.length}
                </span>
              )}
              <Clock className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${activeSection === "audit" ? "text-violet-700" : "text-slate-500"}`} />
              <span className="text-[11px] font-semibold tracking-tight">Activity</span>
            </button>

            {/* Inventory */}
            <button
              type="button"
              onClick={() => setActiveSection("records")}
              className={`relative flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl transition-all duration-150 group ${
                activeSection === "records"
                  ? "bg-violet-100 text-violet-800 font-bold shadow-xs border border-violet-300/80"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
              title="Downstream Inventory & Shipments"
            >
              <Database className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${activeSection === "records" ? "text-violet-700" : "text-slate-500"}`} />
              <span className="text-[11px] font-semibold tracking-tight">Inventory</span>
            </button>
          </nav>
        </div>

        {/* Bottom Officer Status Badge */}
        <div className="flex flex-col items-center gap-1.5 px-2">
          <div className="relative">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-800 font-black text-xs border border-violet-200 shadow-2xs"
              title="RecallGuard Officer (Active Session)"
            >
              RG
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            Officer
          </span>
        </div>
      </aside>

      {/* Human-in-the-Loop Review Modal */}
      <ApprovalModal
        approvals={approvals}
        onDecide={handleDecideApproval}
        isDeciding={isDeciding}
        isOpen={isHITLModalOpen}
        onClose={() => setIsHITLModalOpen(false)}
      />
    </div>
  );
}
