"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

interface Props {
  lots: any[];
  shipments: any[];
}

export default function InventoryTable({ lots, shipments }: Props) {
  const [tab, setTab] = useState<"shipments" | "lots">("shipments");
  const [filter, setFilter] = useState("");

  const filteredLots = lots.filter(
    (l) =>
      l.lot_id.toLowerCase().includes(filter.toLowerCase()) ||
      l.warehouse_id.toLowerCase().includes(filter.toLowerCase()) ||
      l.status?.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredShipments = shipments.filter(
    (s) =>
      s.shipment_id.toLowerCase().includes(filter.toLowerCase()) ||
      s.destination.toLowerCase().includes(filter.toLowerCase()) ||
      s.shipment_status.toLowerCase().includes(filter.toLowerCase()) ||
      s.lot_id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Supply Chain Records
        </h3>

        {/* Tab Switcher & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search records..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex rounded-md bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setTab("shipments")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                tab === "shipments"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Shipments ({shipments.length})
            </button>
            <button
              onClick={() => setTab("lots")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                tab === "lots"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Lots ({lots.length})
            </button>
          </div>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto max-h-60 overflow-y-auto">
        {tab === "shipments" ? (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-2">Shipment ID</th>
                <th className="p-2">Destination</th>
                <th className="p-2">Type</th>
                <th className="p-2">Lot</th>
                <th className="p-2">Units</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredShipments.map((s, idx) => {
                const isHeld = s.shipment_status === "ON_HOLD";
                const isDelivered = s.shipment_status === "DELIVERED";

                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-2 font-bold text-slate-900">{s.shipment_id}</td>
                    <td className="p-2 font-sans truncate max-w-[180px]">{s.destination}</td>
                    <td className="p-2 font-sans text-slate-500">{s.destination_type}</td>
                    <td className="p-2 text-slate-800">{s.lot_id}</td>
                    <td className="p-2">{s.quantity}</td>
                    <td className="p-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isHeld
                            ? "bg-rose-100 text-rose-800"
                            : isDelivered
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {s.shipment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-2">Lot Identifier</th>
                <th className="p-2">Product Name</th>
                <th className="p-2">Warehouse</th>
                <th className="p-2">Units</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLots.map((l, idx) => {
                const isQuarantined = l.lot_status === "QUARANTINED";

                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-2 font-bold text-slate-900">{l.lot_id}</td>
                    <td className="p-2 font-sans text-slate-800">{l.product_name}</td>
                    <td className="p-2 font-sans text-slate-500">{l.warehouse_id}</td>
                    <td className="p-2">{l.quantity}</td>
                    <td className="p-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isQuarantined
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {l.lot_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
