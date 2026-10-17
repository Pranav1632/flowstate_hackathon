import { ScenariosMap, InventoryState, BlastRadiusData, ApprovalRequest } from "@/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async getScenarios(): Promise<ScenariosMap> {
    const res = await fetch(`${API_BASE}/api/scenarios`);
    if (!res.ok) throw new Error("Failed to fetch scenarios");
    return res.json();
  },

  async getInventory(): Promise<InventoryState> {
    const res = await fetch(`${API_BASE}/api/inventory`);
    if (!res.ok) throw new Error("Failed to fetch inventory");
    return res.json();
  },

  async getApprovals(): Promise<ApprovalRequest[]> {
    const res = await fetch(`${API_BASE}/api/approvals`);
    if (!res.ok) throw new Error("Failed to fetch approvals");
    return res.json();
  },

  async getBlastRadius(lotId: string): Promise<BlastRadiusData> {
    const res = await fetch(`${API_BASE}/api/blast-radius/${lotId}`);
    if (!res.ok) throw new Error("Failed to fetch blast radius");
    return res.json();
  },

  async decideApproval(approvalId: string, decision: "APPROVED" | "REJECTED", reviewer: string, comments: string = "") {
    const res = await fetch(`${API_BASE}/api/approvals/${approvalId}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reviewer, comments }),
    });
    if (!res.ok) throw new Error("Failed to submit approval decision");
    return res.json();
  },

  async resetDemo(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/reset-demo`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to reset demo state");
    return res.json();
  },
};
