import type { 
  TriageTransaction, 
  ExpertName, 
  ScenarioType, 
  QuarantineResult,
  MoEContribution
} from '../types/triage.ts';

export const EXPERT_KEYS: ExpertName[] = [
  'Transaction_Expert',
  'Graph_Expert',
  'Temporal_Expert',
  'Offline_Anomaly_Expert'
];

export const EXPERT_DISPLAY_NAMES: Record<ExpertName, string> = {
  Transaction_Expert: 'Transaction_Expert',
  Graph_Expert: 'Graph_Expert',
  Temporal_Expert: 'Temporal_Expert',
  Offline_Anomaly_Expert: 'Offline_Anomaly_Expert'
};

export function categorizeRisk(score: number): 'CRITICAL' | 'MEDIUM' | 'LOW' {
  if (score >= 0.75) return 'CRITICAL';
  if (score >= 0.40) return 'MEDIUM';
  return 'LOW';
}

export function determineTop2Experts(contributions: Record<ExpertName, number>): ExpertName[] {
  return (Object.entries(contributions) as [ExpertName, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(entry => entry[0]);
}

export function getExpertBreakdown(contributions: Record<ExpertName, number>): MoEContribution[] {
  const top2 = new Set(determineTop2Experts(contributions));
  return EXPERT_KEYS.map(key => ({
    expert: key,
    displayName: EXPERT_DISPLAY_NAMES[key],
    weight: contributions[key] ?? 0,
    isTop2: top2.has(key)
  }));
}

export function calculateRiskBandDistribution(transactions: TriageTransaction[]) {
  let critical = 0;
  let medium = 0;
  let low = 0;
  let quarantined = 0;

  for (const tx of transactions) {
    if (tx.is_quarantined) {
      quarantined++;
    } else if (tx.risk_band === 'CRITICAL') {
      critical++;
    } else if (tx.risk_band === 'MEDIUM') {
      medium++;
    } else {
      low++;
    }
  }

  return [
    { name: 'Critical Risk', count: critical, color: '#8b5cf6', fill: '#8b5cf6' },
    { name: 'Medium Risk', count: medium, color: '#10b981', fill: '#10b981' },
    { name: 'Low Risk', count: low, color: '#475569', fill: '#475569' },
    { name: 'Quarantined', count: quarantined, color: '#ef4444', fill: '#ef4444' }
  ];
}

export function quarantineDevice(
  deviceId: string,
  transactions: TriageTransaction[]
): { updatedList: TriageTransaction[]; result: QuarantineResult } {
  const affectedTxIds: string[] = [];
  let linkedAccountsCount = 0;
  const clusterId = `ENC-Z17-${deviceId.slice(-4).toUpperCase()}`;

  const updatedList = transactions.map(tx => {
    if (tx.device_id === deviceId) {
      affectedTxIds.push(tx.tx_id);
      linkedAccountsCount = Math.max(linkedAccountsCount, tx.linked_mule_count || 3);
      return {
        ...tx,
        is_quarantined: true,
        enclave_cluster_id: clusterId
      };
    }
    return tx;
  });

  const result: QuarantineResult = {
    status: affectedTxIds.length > 0 ? 'SUCCESS' : 'ALREADY_QUARANTINED',
    device_id: deviceId,
    quarantined_accounts_count: linkedAccountsCount || 4,
    cluster_id: clusterId,
    hsm_revocation_id: `HSM-REV-0x${Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}`,
    action_timestamp: new Date().toISOString(),
    affected_tx_ids: affectedTxIds
  };

  return { updatedList, result };
}

// Deterministic seed transactions matching real s390x Telum II telemetry
export function generateInitialMockData(): TriageTransaction[] {
  return [
    {
      tx_id: 'TX-984210-Z17',
      scenario: 'Offline_Nonce_DoubleSpend',
      device_id: 'DEV-POS-NFC-771',
      linked_mule_count: 5,
      amount: 4850.00,
      sync_delay_seconds: 4320,
      risk_score: 0.982,
      risk_band: 'CRITICAL',
      top_experts: ['Offline_Anomaly_Expert', 'Temporal_Expert'],
      expert_contributions: {
        Offline_Anomaly_Expert: 0.58,
        Temporal_Expert: 0.29,
        Transaction_Expert: 0.09,
        Graph_Expert: 0.04
      },
      reason_signals: ['Nonce reuse detected', 'Sync skew > 1.2 hrs', 'Replay signature mismatch'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:01:14Z'
    },
    {
      tx_id: 'TX-984211-Z17',
      scenario: 'Sybil_Mule_Ring_Burst',
      device_id: 'DEV-EMV-TERM-402',
      linked_mule_count: 8,
      amount: 12400.00,
      sync_delay_seconds: 1850,
      risk_score: 0.945,
      risk_band: 'CRITICAL',
      top_experts: ['Graph_Expert', 'Transaction_Expert'],
      expert_contributions: {
        Graph_Expert: 0.62,
        Transaction_Expert: 0.24,
        Offline_Anomaly_Expert: 0.09,
        Temporal_Expert: 0.05
      },
      reason_signals: ['Sybil fan-out 8 nodes', 'Smurfing velocity threshold', 'Bipartite cluster match'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:02:40Z'
    },
    {
      tx_id: 'TX-984212-Z17',
      scenario: 'Offline_Nonce_DoubleSpend',
      device_id: 'DEV-OFFLINE-WALLET-119',
      linked_mule_count: 3,
      amount: 2950.50,
      sync_delay_seconds: 7200,
      risk_score: 0.891,
      risk_band: 'CRITICAL',
      top_experts: ['Offline_Anomaly_Expert', 'Transaction_Expert'],
      expert_contributions: {
        Offline_Anomaly_Expert: 0.51,
        Transaction_Expert: 0.32,
        Temporal_Expert: 0.12,
        Graph_Expert: 0.05
      },
      reason_signals: ['Offline counter rolled backward', 'Dual-terminal broadcast', 'Enclave key flagged'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:04:12Z'
    },
    {
      tx_id: 'TX-984213-Z17',
      scenario: 'Sybil_Mule_Ring_Burst',
      device_id: 'DEV-POS-NFC-771',
      linked_mule_count: 5,
      amount: 1400.00,
      sync_delay_seconds: 640,
      risk_score: 0.835,
      risk_band: 'CRITICAL',
      top_experts: ['Graph_Expert', 'Temporal_Expert'],
      expert_contributions: {
        Graph_Expert: 0.48,
        Temporal_Expert: 0.35,
        Offline_Anomaly_Expert: 0.11,
        Transaction_Expert: 0.06
      },
      reason_signals: ['Associated with DEV-POS-NFC-771 cluster', 'Burst sync within 200ms'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:05:01Z'
    },
    {
      tx_id: 'TX-984214-Z17',
      scenario: 'Offline_NFC_Honest_Sync',
      device_id: 'DEV-SUBWAY-GATE-091',
      linked_mule_count: 1,
      amount: 4.50,
      sync_delay_seconds: 120,
      risk_score: 0.082,
      risk_band: 'LOW',
      top_experts: ['Transaction_Expert', 'Temporal_Expert'],
      expert_contributions: {
        Transaction_Expert: 0.45,
        Temporal_Expert: 0.38,
        Offline_Anomaly_Expert: 0.12,
        Graph_Expert: 0.05
      },
      reason_signals: ['Valid monotonic transit nonce', 'Verified public key', 'Standard commute delay'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:06:22Z'
    },
    {
      tx_id: 'TX-984215-Z17',
      scenario: 'Offline_NFC_Honest_Sync',
      device_id: 'DEV-AEROPORT-KIOSK-33',
      linked_mule_count: 1,
      amount: 28.90,
      sync_delay_seconds: 450,
      risk_score: 0.120,
      risk_band: 'LOW',
      top_experts: ['Transaction_Expert', 'Offline_Anomaly_Expert'],
      expert_contributions: {
        Transaction_Expert: 0.52,
        Offline_Anomaly_Expert: 0.28,
        Temporal_Expert: 0.14,
        Graph_Expert: 0.06
      },
      reason_signals: ['Flight batch deferred sync', 'Signed secure element token'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:06:55Z'
    },
    {
      tx_id: 'TX-984216-Z17',
      scenario: 'Sybil_Mule_Ring_Burst',
      device_id: 'DEV-MULE-HUB-883',
      linked_mule_count: 12,
      amount: 7800.00,
      sync_delay_seconds: 3100,
      risk_score: 0.912,
      risk_band: 'CRITICAL',
      top_experts: ['Graph_Expert', 'Offline_Anomaly_Expert'],
      expert_contributions: {
        Graph_Expert: 0.56,
        Offline_Anomaly_Expert: 0.27,
        Transaction_Expert: 0.11,
        Temporal_Expert: 0.06
      },
      reason_signals: ['12 linked rapid-drain cards', 'Cross-border geolocation hop', 'Telum II NNPA flagged'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:07:18Z'
    },
    {
      tx_id: 'TX-984217-Z17',
      scenario: 'Offline_Nonce_DoubleSpend',
      device_id: 'DEV-TERMINAL-RURAL-04',
      linked_mule_count: 2,
      amount: 890.00,
      sync_delay_seconds: 14200,
      risk_score: 0.620,
      risk_band: 'MEDIUM',
      top_experts: ['Temporal_Expert', 'Offline_Anomaly_Expert'],
      expert_contributions: {
        Temporal_Expert: 0.44,
        Offline_Anomaly_Expert: 0.36,
        Transaction_Expert: 0.12,
        Graph_Expert: 0.08
      },
      reason_signals: ['Extended offline storage window', 'Clock drift anomaly'],
      is_quarantined: false,
      timestamp: '2026-10-17T23:07:50Z'
    }
  ];
}

export function generateSimulatedBurst(
  scenarioFilter: ScenarioType,
  batchSize: number = 50,
  _engine: string = 'AUTO (ONNX)'
): TriageTransaction[] {
  const result: TriageTransaction[] = [];
  const scenarios = scenarioFilter === 'ALL' 
    ? (['Offline_Nonce_DoubleSpend', 'Sybil_Mule_Ring_Burst', 'Offline_NFC_Honest_Sync'] as const)
    : [scenarioFilter as 'Offline_Nonce_DoubleSpend' | 'Sybil_Mule_Ring_Burst' | 'Offline_NFC_Honest_Sync'];

  const now = Date.now();

  for (let i = 0; i < batchSize; i++) {
    const scenario = scenarios[i % scenarios.length];
    const txIndex = 984300 + i;
    const txId = `TX-${txIndex}-Z17`;
    
    let riskScore = 0;
    let deviceId = '';
    let linkedMules = 1;
    let amount = 0;
    let syncDelay = 0;
    let signals: string[] = [];
    let contributions: Record<ExpertName, number>;

    if (scenario === 'Offline_Nonce_DoubleSpend') {
      riskScore = 0.78 + (Math.random() * 0.21); // 0.78 - 0.99
      deviceId = `DEV-OFFLINE-POS-${(100 + (i % 8))}`;
      linkedMules = 2 + (i % 4);
      amount = parseFloat((1200 + Math.random() * 8000).toFixed(2));
      syncDelay = Math.floor(1800 + Math.random() * 12000);
      signals = [
        'Nonce reuse detected',
        'State tree diverged from Z17 ledger',
        'Offline signature collision'
      ];
      contributions = {
        Offline_Anomaly_Expert: 0.50 + Math.random() * 0.20,
        Temporal_Expert: 0.20 + Math.random() * 0.15,
        Transaction_Expert: 0.10 + Math.random() * 0.10,
        Graph_Expert: 0.05 + Math.random() * 0.05
      };
    } else if (scenario === 'Sybil_Mule_Ring_Burst') {
      riskScore = 0.82 + (Math.random() * 0.17); // 0.82 - 0.99
      deviceId = `DEV-MULE-HUB-${(800 + (i % 5))}`;
      linkedMules = 4 + (i % 9);
      amount = parseFloat((3500 + Math.random() * 14000).toFixed(2));
      syncDelay = Math.floor(600 + Math.random() * 4500);
      signals = [
        `High-degree Sybil cluster (${linkedMules} connected mules)`,
        'Synchronized burst flush',
        'Rapid layer-2 cashout pattern'
      ];
      contributions = {
        Graph_Expert: 0.55 + Math.random() * 0.20,
        Transaction_Expert: 0.20 + Math.random() * 0.15,
        Offline_Anomaly_Expert: 0.10 + Math.random() * 0.10,
        Temporal_Expert: 0.05 + Math.random() * 0.05
      };
    } else {
      // Offline_NFC_Honest_Sync
      riskScore = 0.02 + (Math.random() * 0.22); // 0.02 - 0.24
      deviceId = `DEV-TRANSIT-VALIDATOR-${(200 + (i % 12))}`;
      linkedMules = 1;
      amount = parseFloat((2.50 + Math.random() * 65.0).toFixed(2));
      syncDelay = Math.floor(30 + Math.random() * 600);
      signals = [
        'Monotonic sequence valid',
        's390x hardware attestation OK',
        'Standard tap-and-go profile'
      ];
      contributions = {
        Transaction_Expert: 0.45 + Math.random() * 0.20,
        Temporal_Expert: 0.30 + Math.random() * 0.15,
        Offline_Anomaly_Expert: 0.12 + Math.random() * 0.08,
        Graph_Expert: 0.05 + Math.random() * 0.05
      };
    }

    // Normalize contributions
    const sum = Object.values(contributions).reduce((a, b) => a + b, 0);
    for (const key of EXPERT_KEYS) {
      contributions[key] = parseFloat((contributions[key] / sum).toFixed(3));
    }

    const topExperts = determineTop2Experts(contributions);
    const riskBand = categorizeRisk(riskScore);
    const txTime = new Date(now - (i * 12000)).toISOString();

    result.push({
      tx_id: txId,
      scenario,
      device_id: deviceId,
      linked_mule_count: linkedMules,
      amount,
      sync_delay_seconds: syncDelay,
      risk_score: parseFloat(riskScore.toFixed(3)),
      risk_band: riskBand,
      top_experts: topExperts,
      expert_contributions: contributions,
      reason_signals: signals,
      is_quarantined: false,
      timestamp: txTime
    });
  }

  // Sort descending by risk score
  return result.sort((a, b) => b.risk_score - a.risk_score);
}
