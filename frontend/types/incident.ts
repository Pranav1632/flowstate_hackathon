export type ContainmentPhase = "IDLE" | "DECLARE" | "CHECK" | "EXECUTE" | "COMPLETE";

export interface TimelineEvent {
  type: string;
  message: string;
  timestamp?: string;
  incident_id?: string;
  tool?: string;
  target_id?: string;
  policy_verdict?: "ALLOWED" | "HELD" | "BLOCKED";
  status?: string;
  result?: any;
  intent_token?: string;
  plan_hash?: string;
  steps?: any[];
  blast_radius?: any;
  summary?: any;
  reason?: string;
}

export interface RunIncidentRequest {
  notice_text: string;
  scenario_id?: string;
  incident_id?: string;
}
