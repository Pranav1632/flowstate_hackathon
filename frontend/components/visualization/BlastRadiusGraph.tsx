"use client";

import React, { useState } from "react";
import { ShieldAlert, Warehouse, Truck, MapPin, AlertCircle, ShieldCheck, X } from "lucide-react";

interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    sublabel: string;
    status: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label: string;
  }>;
  lot_id?: string;
  total_units?: number;
  total_shipments?: number;
  summary?: {
    actionable_hold_count?: number;
    delivered_count?: number;
  };
}

interface Props {
  data: GraphData | null;
  adversarialBlocked?: boolean;
  onSelectSample?: (lotId: string) => void;
}

export default function BlastRadiusGraph({ data, adversarialBlocked, onSelectSample }: Props) {
  const [probeResult, setProbeResult] = useState<any>(null);
  const [isProbing, setIsProbing] = useState<boolean>(false);

  const handleAttemptRelease = async () => {
    setIsProbing(true);
    try {
      const res = await fetch("http://localhost:8000/api/governance/attempt-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot_id: data?.lot_id || "LOT-24-A" })
      });
      if (res.ok) {
        setProbeResult(await res.json());
      }
    } catch (e) {
      console.error("Probe error:", e);
    } finally {
      setIsProbing(false);
    }
  };

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <p className="font-bold text-slate-800 text-sm">No Active Recall Selected</p>
        <p className="text-xs text-slate-500 max-w-md mt-1 mb-4 leading-relaxed">
          Select or run a scenario above to trace the physical blast radius across warehouses and shipments, or click below to inspect the default supply chain topology.
        </p>
        {onSelectSample && (
          <button
            type="button"
            onClick={() => onSelectSample("LOT-24-A")}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Inspect Lot LOT-24-A Topology</span>
          </button>
        )}
      </div>
    );
  }

  const lotNode = data.nodes.find((n) => n.type === "lot");
  const warehouseNodes = data.nodes.filter((n) => n.type === "warehouse");
  const shipmentNodes = data.nodes.filter((n) => n.type === "shipment");
  const destinationNodes = data.nodes.filter((n) => n.type === "destination");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Supply Chain Blast-Radius
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Affected lot tracking: <span className="font-mono font-semibold text-slate-800">{data.lot_id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1 text-rose-700 font-medium">
            {data.summary?.actionable_hold_count ?? 3} Shipments Held
          </span>
          <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-800 font-medium">
            {data.summary?.delivered_count ?? 1} Delivered (Alert Required)
          </span>
          <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-slate-700 font-medium">
            {data.total_units ?? 200} Units in Quarantine
          </span>
        </div>
      </div>

      {/* Visual Multi-Tier Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start min-h-[260px]">
        {/* Tier 1: Recalled Batch */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            1. Recalled Batch
          </span>
          {lotNode && (
            <div className="flex flex-col rounded-lg border-2 border-rose-400 bg-rose-50/40 p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded w-fit mb-2">
                Quarantined
              </span>
              <p className="font-mono text-base font-bold text-slate-900">{lotNode.label}</p>
              <p className="text-xs text-slate-600 mt-1">{lotNode.sublabel}</p>

              {/* Interactive Security Probe Test Button */}
              <button
                type="button"
                onClick={handleAttemptRelease}
                disabled={isProbing}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-rose-300 bg-rose-100 hover:bg-rose-200 text-rose-900 py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50"
                title="Test ArmorIQ policy boundary: attempts manual release to verify cryptographic blockage"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                <span>{isProbing ? "Testing ArmorIQ..." : "Probe Release (Test)"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tier 2: Warehouses */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            2. Warehouses ({warehouseNodes.length})
          </span>
          {warehouseNodes.map((wh) => (
            <div
              key={wh.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
                <Warehouse className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">{wh.label}</p>
                <p className="text-[11px] font-mono text-slate-500">{wh.sublabel}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tier 3: Shipments */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            3. Shipments ({shipmentNodes.length})
          </span>
          {shipmentNodes.map((shp) => {
            const isDelivered = shp.status === "DELIVERED";
            return (
              <div
                key={shp.id}
                className={`flex items-center justify-between rounded-lg border p-2.5 ${
                  isDelivered
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-rose-200 bg-rose-50/40"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                      isDelivered ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-mono text-xs font-bold text-slate-800">{shp.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{shp.sublabel}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                    isDelivered ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {isDelivered ? "DELIVERED" : "HELD"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tier 4: Endpoints */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            4. Destinations ({destinationNodes.length})
          </span>
          {destinationNodes.map((dest) => (
            <div
              key={dest.id}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">{dest.label}</p>
                <p className="text-[10px] text-slate-400 truncate">{dest.sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adversarial Alert Banner */}
      {adversarialBlocked && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Security Notice: Adversarial Release Blocked</p>
              <p className="text-rose-700 mt-0.5">
                Malicious directive to call <span className="font-mono font-semibold">release_quarantine</span> was intercepted and blocked by ArmorIQ.
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-rose-200/70 text-rose-900 px-2 py-1 rounded shrink-0">
            ARMORIQ ENFORCED
          </span>
        </div>
      )}

      {/* Interactive Probe Interception Feedback Card */}
      {probeResult && (
        <div className="mt-4 flex items-start justify-between rounded-xl border-2 border-rose-400 bg-rose-50/90 p-4 shadow-sm text-xs text-rose-950">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-rose-900">
                  ArmorIQ Policy Gate: Manual Release Intercepted & Denied
                </p>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded border border-rose-300">
                  Policy Status: {probeResult.policy_verdict}
                </span>
              </div>
              <p className="text-rose-800 mt-1 leading-normal">
                {probeResult.message}
              </p>
              <div className="mt-2 text-[11px] text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-rose-200 leading-snug">
                <span className="font-bold text-slate-900">Enforcement Reasoning: </span>
                {probeResult.reason}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProbeResult(null)}
            className="text-rose-400 hover:text-rose-800 p-1 rounded-md"
            title="Dismiss security alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
