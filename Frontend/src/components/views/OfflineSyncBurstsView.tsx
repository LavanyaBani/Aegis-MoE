import React from 'react';
import { Zap, Clock, ShieldAlert, CheckCircle, BarChart2 } from 'lucide-react';
import type { TriageTransaction } from '../../types/triage';

interface OfflineSyncBurstsViewProps {
  transactions: TriageTransaction[];
  onTriggerBurst: () => void;
  isSimulating: boolean;
}

export const OfflineSyncBurstsView: React.FC<OfflineSyncBurstsViewProps> = ({
  transactions,
  onTriggerBurst,
  isSimulating
}) => {
  const doubleSpendCount = transactions.filter(t => t.scenario === 'Offline_Nonce_DoubleSpend').length;
  const sybilCount = transactions.filter(t => t.scenario === 'Sybil_Mule_Ring_Burst').length;
  const honestCount = transactions.filter(t => t.scenario === 'Offline_NFC_Honest_Sync').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="sophos-card rounded-2xl p-6 border-l-4 border-l-purple-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span>Offline-Sync Deferred Bursts Telemetry</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Analyzing deferred cryptographic state settlement, temporal drift, and terminal nonce replay buffers.
            </p>
          </div>
          <button
            onClick={onTriggerBurst}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold purple-glow-btn transition-all self-start sm:self-auto cursor-pointer"
          >
            {isSimulating ? 'Processing Burst...' : '⚡ Ingest Offline Burst'}
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sophos-card rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400">Double-Spend Ingestion</div>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-1">{doubleSpendCount} Detected</div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">Nonce Reuse Collision Rate: 99.4%</div>
        </div>
        <div className="sophos-card rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400">Sybil Mule Bursts</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{sybilCount} Clustered</div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">Bipartite Fan-out &gt; 4.0 avg</div>
        </div>
        <div className="sophos-card rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400">Honest NFC Tap &amp; Go</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{honestCount} Cleared</div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">Sub-100ms Fastpath Approval</div>
        </div>
      </div>

      {/* Latency & Drift Profile */}
      <div className="sophos-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-3">Deferred Sync Delay Distribution (Latency Window)</h3>
        <div className="space-y-3 font-mono text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>0 - 5 Minutes (Transit NFC Rapid Reconnect)</span>
              <span className="text-emerald-400 font-bold">42%</span>
            </div>
            <div className="w-full bg-[#131622] h-3 rounded-full overflow-hidden border border-[#1f2638]">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>5 - 60 Minutes (Flight / In-Tunnel POS Sync)</span>
              <span className="text-purple-400 font-bold">28%</span>
            </div>
            <div className="w-full bg-[#131622] h-3 rounded-full overflow-hidden border border-[#1f2638]">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '28%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>1 - 6 Hours (Extended Offline Window - Elevated Triage)</span>
              <span className="text-amber-400 font-bold">20%</span>
            </div>
            <div className="w-full bg-[#131622] h-3 rounded-full overflow-hidden border border-[#1f2638]">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>6+ Hours (High Probability Double-Spend Attack Vector)</span>
              <span className="text-rose-400 font-bold">10%</span>
            </div>
            <div className="w-full bg-[#131622] h-3 rounded-full overflow-hidden border border-[#1f2638]">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
