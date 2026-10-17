export type PolicyVerdict = "ALLOWED" | "HELD" | "BLOCKED";

export interface ApprovalRequest {
  id: string;
  incident_id: string;
  action_type: string;
  target_id?: string;
  payload: any;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewer?: string;
  created_at: string;
  decided_at?: string;
}

export interface GovernanceStatus {
  armoriq_sdk_installed: boolean;
  api_key_configured: boolean;
  api_key_masked: string;
  active_policies_count: number;
  protocol: string;
}
