import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  categorizeRisk, 
  determineTop2Experts, 
  calculateRiskBandDistribution,
  quarantineDevice,
  generateSimulatedBurst,
  generateInitialMockData
} from './triage.ts';
import type { ExpertName, TriageTransaction } from '../types/triage.ts';

test('categorizeRisk classifies scores correctly', () => {
  assert.equal(categorizeRisk(0.95), 'CRITICAL');
  assert.equal(categorizeRisk(0.75), 'CRITICAL');
  assert.equal(categorizeRisk(0.74), 'MEDIUM');
  assert.equal(categorizeRisk(0.40), 'MEDIUM');
  assert.equal(categorizeRisk(0.39), 'LOW');
  assert.equal(categorizeRisk(0.05), 'LOW');
});

test('determineTop2Experts selects the highest 2 contributions', () => {
  const contributions: Record<ExpertName, number> = {
    Offline_Anomaly_Expert: 0.55,
    Temporal_Expert: 0.25,
    Transaction_Expert: 0.15,
    Graph_Expert: 0.05
  };

  const top2 = determineTop2Experts(contributions);
  assert.equal(top2.length, 2);
  assert.equal(top2[0], 'Offline_Anomaly_Expert');
  assert.equal(top2[1], 'Temporal_Expert');
});

test('calculateRiskBandDistribution counts bands accurately', () => {
  const mockTransactions = generateInitialMockData();
  const distribution = calculateRiskBandDistribution(mockTransactions);
  
  const totalCount = distribution.reduce((sum, item) => sum + item.count, 0);
  assert.equal(totalCount, mockTransactions.length);

  const criticalCategory = distribution.find(d => d.name === 'Critical Risk');
  assert.ok(criticalCategory);
  assert.ok(criticalCategory.count > 0);
});

test('quarantineDevice isolates all matching transactions and generates HSM revocation proof', () => {
  const mockTransactions = generateInitialMockData();
  const targetDevice = 'DEV-POS-NFC-771';
  
  const { updatedList, result } = quarantineDevice(targetDevice, mockTransactions);
  
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.device_id, targetDevice);
  assert.ok(result.cluster_id.startsWith('ENC-Z17-'));
  assert.ok(result.hsm_revocation_id.startsWith('HSM-REV-'));
  assert.ok(result.affected_tx_ids.length >= 2);

  const quarantinedItems = updatedList.filter(tx => tx.device_id === targetDevice);
  for (const item of quarantinedItems) {
    assert.equal(item.is_quarantined, true);
    assert.equal(item.enclave_cluster_id, result.cluster_id);
  }
});

test('generateSimulatedBurst creates requested batch size and respects scenario filter', () => {
  const doubleSpendBurst = generateSimulatedBurst('Offline_Nonce_DoubleSpend', 15);
  assert.equal(doubleSpendBurst.length, 15);
  for (const tx of doubleSpendBurst) {
    assert.equal(tx.scenario, 'Offline_Nonce_DoubleSpend');
    assert.equal(tx.is_quarantined, false);
    assert.equal(tx.top_experts.length, 2);
  }

  const allBurst = generateSimulatedBurst('ALL', 25);
  assert.equal(allBurst.length, 25);
});
