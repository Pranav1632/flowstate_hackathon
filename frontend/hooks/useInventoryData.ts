import { useState, useEffect, useCallback } from "react";
import { InventoryState, BlastRadiusData, ApprovalRequest, ScenariosMap } from "@/types";
import { api } from "@/services/api";

export function useInventoryData() {
  const [scenarios, setScenarios] = useState<ScenariosMap>({});
  const [inventory, setInventory] = useState<InventoryState>({ lots: [], shipments: [] });
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAll = useCallback(async () => {
    try {
      const [scenariosRes, invRes, approvalsRes] = await Promise.all([
        api.getScenarios().catch(() => ({})),
        api.getInventory().catch(() => ({ lots: [], shipments: [] })),
        api.getApprovals().catch(() => []),
      ]);
      setScenarios(scenariosRes);
      setInventory(invRes);
      setApprovals(approvalsRes);
    } catch (e) {
      console.error("Error refreshing inventory data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const loadBlastRadius = useCallback(async (lotId: string): Promise<BlastRadiusData | null> => {
    try {
      return await api.getBlastRadius(lotId);
    } catch (e) {
      console.error("Error fetching blast radius for", lotId, e);
      return null;
    }
  }, []);

  return {
    scenarios,
    inventory,
    approvals,
    loading,
    refreshAll,
    loadBlastRadius,
  };
}
