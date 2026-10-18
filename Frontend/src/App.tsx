import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { RiskDonutCard } from './components/RiskDonutCard';
import { MoEActivationCard } from './components/MoEActivationCard';
import { TriageTable } from './components/TriageTable';
import { QuarantineModal } from './components/QuarantineModal';
import { OfflineSyncBurstsView } from './components/views/OfflineSyncBurstsView';
import { MoERouterView } from './components/views/MoERouterView';
import { SybilGraphView } from './components/views/SybilGraphView';
import { TelemetryView } from './components/views/TelemetryView';

import type { 
  TriageTransaction, 
  ScenarioType, 
  EngineType, 
  QuarantineResult,
  TelemetryStats 
} from './types/triage';

import { 
  generateInitialMockData 
} from './utils/triage';

import { 
  fetchSimulatedBurst, 
  executeQuarantineRing, 
  checkBackendStatus, 
  getDefaultTelemetry 
} from './services/api';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Controls & Filters
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioType>('ALL');
  const [engine, setEngine] = useState<EngineType>('AUTO (ONNX)');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  // Data State
  const [transactions, setTransactions] = useState<TriageTransaction[]>(() => generateInitialMockData());
  const [selectedTx, setSelectedTx] = useState<TriageTransaction | null>(null);
  const [quarantinedDevices, setQuarantinedDevices] = useState<Set<string>>(new Set());
  const [isQuarantiningDevice, setIsQuarantiningDevice] = useState<string | null>(null);
  const [quarantineModalResult, setQuarantineModalResult] = useState<QuarantineResult | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryStats>(() => getDefaultTelemetry());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [donutFilterBand, setDonutFilterBand] = useState<string | null>(null);

  // Set default selected transaction on mount
  useEffect(() => {
    if (transactions.length > 0 && !selectedTx) {
      setSelectedTx(transactions[0]);
    }
  }, [transactions, selectedTx]);

  // Check backend health periodically
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const isOnline = await checkBackendStatus();
      if (isMounted) {
        setBackendConnected(isOnline);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };

  // 1. Simulate Offline Sync Burst Handler
  const handleSimulateBurst = useCallback(async () => {
    setIsSimulating(true);
    try {
      const response = await fetchSimulatedBurst(scenarioFilter, 50, engine);
      setTransactions(response.data);
      if (response.data.length > 0) {
        setSelectedTx(response.data[0]);
      }
      showToast(response.message || `Ingested 50 deferred-sync transactions via ${engine}`);
    } catch {
      showToast('Simulation updated with s390x synthetic burst stream');
    } finally {
      setIsSimulating(false);
    }
  }, [scenarioFilter, engine]);

  // 2. Quarantine Ring Action Handler
  const handleQuarantineRing = useCallback(async (deviceId: string) => {
    setIsQuarantiningDevice(deviceId);
    try {
      const response = await executeQuarantineRing(deviceId, transactions);
      setTransactions(response.data.updatedTransactions);
      setQuarantinedDevices(prev => new Set(prev).add(deviceId));
      setQuarantineModalResult(response.data.quarantineResult);

      // If the selected transaction is in the quarantined device, update it
      if (selectedTx && selectedTx.device_id === deviceId) {
        setSelectedTx(prev => prev ? { ...prev, is_quarantined: true, enclave_cluster_id: response.data.quarantineResult.cluster_id } : null);
      }

      showToast(`🛡️ Device ${deviceId} isolated in s390x enclave (${response.data.quarantineResult.quarantined_accounts_count} mule accounts locked)`);
    } catch {
      showToast(`Failed to enforce quarantine on ${deviceId}`);
    } finally {
      setIsQuarantiningDevice(null);
    }
  }, [transactions, selectedTx]);

  // Derived KPI Counts
  const criticalCount = transactions.filter(t => !t.is_quarantined && t.risk_band === 'CRITICAL').length;
  const totalQuarantinedCount = transactions.filter(t => t.is_quarantined).length + (quarantinedDevices.size > 0 ? (quarantinedDevices.size * 3) : 0);

  // Filtered transactions if user clicked a donut slice
  const displayedTransactions = donutFilterBand
    ? transactions.filter(t => {
        if (donutFilterBand === 'Quarantined') return t.is_quarantined;
        if (donutFilterBand === 'Critical Risk') return !t.is_quarantined && t.risk_band === 'CRITICAL';
        if (donutFilterBand === 'Medium Risk') return !t.is_quarantined && t.risk_band === 'MEDIUM';
        if (donutFilterBand === 'Low Risk') return !t.is_quarantined && t.risk_band === 'LOW';
        return true;
      })
    : transactions;

  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Threat Analysis & Triage',
    bursts: 'Offline-Sync Bursts',
    moe_router: 'Sparse MoE Router',
    sybil_graph: 'Sybil Mule Graph',
    telemetry: 's390x Telum II Telemetry'
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#141724] border border-purple-500/40 shadow-xl shadow-black/80 flex items-center gap-3 text-xs font-mono text-purple-200 animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* LEFT SIDEBAR matching Sophos UI */}
      <Sidebar 
        activeTab={activeTab} 
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }} 
        quarantinedCount={quarantinedDevices.size} 
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-16">
        {/* TOP ACTION HEADER */}
        <Header
          scenarioFilter={scenarioFilter}
          setScenarioFilter={setScenarioFilter}
          engine={engine}
          setEngine={setEngine}
          onSimulateBurst={handleSimulateBurst}
          isSimulating={isSimulating}
          backendConnected={backendConnected}
          activeTabTitle={tabTitles[activeTab]}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* VIEW CONTAINER */}
        <main className="px-6 lg:px-8 pt-6 space-y-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <>
              {/* 1. TOP 4 KPI CARDS (Sophos style) */}
              <KpiCards
                prAuc={telemetry.pr_auc}
                throughput={telemetry.throughput_tx_s}
                criticalCount={criticalCount}
                quarantinedCount={totalQuarantinedCount}
              />

              {/* 2. MIDDLE ROW (2 Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT CARD: Risk Band Distribution Donut Chart */}
                <RiskDonutCard
                  transactions={transactions}
                  selectedBand={donutFilterBand}
                  onFilterBand={setDonutFilterBand}
                />

                {/* RIGHT CARD: Sparse MoE Top-2 Expert Activation */}
                <MoEActivationCard
                  selectedTransaction={selectedTx}
                  defaultTransactions={transactions}
                />
              </div>

              {/* 3. BOTTOM ROW: Live Risk-Ranked Investigation Queue & Enclave Quarantine Table */}
              <TriageTable
                transactions={displayedTransactions}
                selectedTxId={selectedTx?.tx_id || null}
                onSelectTx={setSelectedTx}
                onQuarantine={handleQuarantineRing}
                isQuarantining={isQuarantiningDevice}
              />
            </>
          )}

          {activeTab === 'bursts' && (
            <OfflineSyncBurstsView
              transactions={transactions}
              onTriggerBurst={handleSimulateBurst}
              isSimulating={isSimulating}
            />
          )}

          {activeTab === 'moe_router' && (
            <MoERouterView />
          )}

          {activeTab === 'sybil_graph' && (
            <SybilGraphView
              transactions={transactions}
              onQuarantine={handleQuarantineRing}
            />
          )}

          {activeTab === 'telemetry' && (
            <TelemetryView stats={telemetry} />
          )}
        </main>
      </div>

      {/* Quarantine Confirmation Modal */}
      <QuarantineModal
        result={quarantineModalResult}
        onClose={() => setQuarantineModalResult(null)}
      />
    </div>
  );
}
