import { useState, useCallback } from "react";
import { TimelineEvent, ContainmentPhase, BlastRadiusData } from "@/types";
import { streamIncidentContainment } from "@/services/sse";

export function useRecallIncident() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [blastData, setBlastData] = useState<BlastRadiusData | null>(null);
  const [intentToken, setIntentToken] = useState<string>("");
  const [planHash, setPlanHash] = useState<string>("");
  const [allowedCount, setAllowedCount] = useState<number>(0);
  const [heldCount, setHeldCount] = useState<number>(0);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [phase, setPhase] = useState<ContainmentPhase>("IDLE");
  const [adversarialBlocked, setAdversarialBlocked] = useState<boolean>(false);

  const resetState = useCallback(() => {
    setEvents([]);
    setIntentToken("");
    setPlanHash("");
    setAllowedCount(0);
    setHeldCount(0);
    setBlockedCount(0);
    setPhase("IDLE");
    setAdversarialBlocked(false);
  }, []);

  const runContainment = useCallback(
    async (noticeText: string, scenarioId: string, onComplete?: () => void) => {
      resetState();
      setIsRunning(true);
      setPhase("DECLARE");

      await streamIncidentContainment(
        { notice_text: noticeText, scenario_id: scenarioId },
        (event: TimelineEvent) => {
          setEvents((prev) => [...prev, event]);

          if (event.type === "ARMORIQ_PLAN_DECLARED") {
            setIntentToken(event.intent_token || "");
            setPlanHash(event.plan_hash || "");
            setPhase("CHECK");
          } else if (event.type === "ACTION_EXECUTED") {
            setAllowedCount((c) => c + 1);
            setPhase("EXECUTE");
          } else if (event.type === "ACTION_HELD_FOR_APPROVAL") {
            setHeldCount((c) => c + 1);
          } else if (event.type === "ACTION_BLOCKED_POLICY_DENIAL") {
            setBlockedCount((c) => c + 1);
            setAdversarialBlocked(true);
          } else if (event.type === "BLAST_RADIUS_COMPUTED") {
            if (event.blast_radius) {
              setBlastData(event.blast_radius);
            }
          } else if (event.type === "CONTAINMENT_SUMMARY") {
            setPhase("COMPLETE");
            setIsRunning(false);
            if (onComplete) onComplete();
          }
        },
        (err) => {
          console.error("Containment stream failed:", err);
          setIsRunning(false);
          setPhase("IDLE");
        }
      );
    },
    [resetState]
  );

  return {
    isRunning,
    events,
    blastData,
    setBlastData,
    intentToken,
    planHash,
    allowedCount,
    heldCount,
    blockedCount,
    phase,
    adversarialBlocked,
    runContainment,
    resetState,
  };
}
