export type ScenarioType = 
  | 'ALL' 
  | 'Offline_Nonce_DoubleSpend' 
  | 'Sybil_Mule_Ring_Burst' 
  | 'Offline_NFC_Honest_Sync';

export type EngineType = 'AUTO (ONNX)' | 'PYTORCH';

export type ExpertName = 
  | 'Transaction_Expert' 
  | 'Graph_Expert' 
  | 'Temporal_Expert' 
  | 'Offline_Anomaly_Expert';

export interface MoEContribution {
  expert: ExpertName;
  displayName: string;
  weight: number; // 0 to 1
  isTop2: boolean;
}

export interface TriageTransaction {
  tx_id: string;
  scenario: 'Offline_Nonce_DoubleSpend' | 'Sybil_Mule_Ring_Burst' | 'Offline_NFC_Honest_Sync';
  device_id: string;
  linked_mule_count: number;
  amount: number;
  sync_delay_seconds: number;
  risk_score: number; // 0.00 to 1.00
  risk_band: 'CRITICAL' | 'MEDIUM' | 'LOW';
  top_experts: ExpertName[];
  expert_contributions: Record<ExpertName, number>;
  reason_signals: string[];
  is_quarantined: boolean;
  timestamp: string;
  enclave_cluster_id?: string;
}

export interface QuarantineResult {
  status: 'SUCCESS' | 'ALREADY_QUARANTINED';
  device_id: string;
  quarantined_accounts_count: number;
  cluster_id: string;
  hsm_revocation_id: string;
  action_timestamp: string;
  affected_tx_ids: string[];
}

export interface TelemetryStats {
  arch: string;
  processor: string;
  nnpa_status: string;
  pr_auc: number;
  throughput_tx_s: number;
  inference_latency_ms: number;
  active_enclaves: number;
  total_bursts_processed: number;
  memory_bandwidth_gbs: number;
}
