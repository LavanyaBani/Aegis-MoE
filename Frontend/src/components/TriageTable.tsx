import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  ShieldCheck, 
  Lock, 
  Clock, 
  ArrowUpDown, 
  Eye, 
  Check, 
  AlertOctagon,
  Sparkles,
  Link2
} from 'lucide-react';
import type { TriageTransaction, ExpertName } from '../types/triage';

interface TriageTableProps {
  transactions: TriageTransaction[];
  selectedTxId: string | null;
  onSelectTx: (tx: TriageTransaction) => void;
  onQuarantine: (deviceId: string) => void;
  isQuarantining: string | null; // deviceId currently undergoing quarantine
}

export const TriageTable: React.FC<TriageTableProps> = ({
  transactions,
  selectedTxId,
  onSelectTx,
  onQuarantine,
  isQuarantining
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScenario, setFilterScenario] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'amount' | 'delay'>('risk');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter & Search
  const filteredTransactions = transactions.filter(tx => {
    if (filterScenario !== 'ALL' && tx.scenario !== filterScenario) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.tx_id.toLowerCase().includes(q) ||
      tx.device_id.toLowerCase().includes(q) ||
      tx.scenario.toLowerCase().includes(q) ||
      tx.reason_signals.some(s => s.toLowerCase().includes(q))
    );
  });

  // Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'risk') {
      comparison = b.risk_score - a.risk_score;
    } else if (sortBy === 'amount') {
      comparison = b.amount - a.amount;
    } else if (sortBy === 'delay') {
      comparison = b.sync_delay_seconds - a.sync_delay_seconds;
    }
    return sortAsc ? -comparison : comparison;
  });

  const toggleSort = (type: 'risk' | 'amount' | 'delay') => {
    if (sortBy === type) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(type);
      setSortAsc(false);
    }
  };

  const getScenarioBadgeClass = (scenario: string) => {
    switch (scenario) {
      case 'Offline_Nonce_DoubleSpend':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/30';
      case 'Sybil_Mule_Ring_Burst':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/30';
      case 'Offline_NFC_Honest_Sync':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 0.75) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (score >= 0.40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="sophos-card rounded-2xl p-6 overflow-hidden">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1b202c]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Live Risk-Ranked Investigation Queue &amp; Enclave Quarantine
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#1b2130] text-purple-300 border border-[#2b354e]">
              {sortedTransactions.length} items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time inference stream &bull; Click row to inspect sparse MoE gating breakdown
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search TX, Device, Signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#12151e] border border-[#232938] text-xs text-white pl-8 pr-3 py-1.5 rounded-xl font-mono focus:outline-none focus:border-purple-500/50 w-56 sm:w-64 placeholder:text-slate-600"
            />
          </div>

          {/* Quick Scenario Filter */}
          <select
            value={filterScenario}
            onChange={(e) => setFilterScenario(e.target.value)}
            className="bg-[#12151e] border border-[#232938] text-xs text-slate-300 px-3 py-1.5 rounded-xl font-mono focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Scenarios</option>
            <option value="Offline_Nonce_DoubleSpend">Double-Spend</option>
            <option value="Sybil_Mule_Ring_Burst">Sybil Mule Ring</option>
            <option value="Offline_NFC_Honest_Sync">Honest Sync</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4 -mx-6 px-6">
        <table className="w-full min-w-[1020px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1c2230] text-[11px] font-mono uppercase tracking-wider text-slate-400 select-none">
              <th className="py-3 px-3">TX_ID</th>
              <th className="py-3 px-3">Scenario</th>
              <th className="py-3 px-3">Device_ID</th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('amount')}>
                <div className="flex items-center gap-1">
                  <span>Amount ($)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('delay')}>
                <div className="flex items-center gap-1">
                  <span>Sync Delay (s)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Top-2 Active Experts</th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('risk')}>
                <div className="flex items-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Reason Signals</th>
              <th className="py-3 px-3 text-right">Containment Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#151924] text-xs font-mono">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                  No deferred-sync transactions found matching filter criteria.
                </td>
              </tr>
            ) : (
              sortedTransactions.map((tx) => {
                const isSelected = selectedTxId === tx.tx_id;
                const isItemQuarantined = tx.is_quarantined;
                const isProcessingThis = isQuarantining === tx.device_id;

                return (
                  <tr
                    key={tx.tx_id}
                    onClick={() => onSelectTx(tx)}
                    className={`group transition-colors cursor-pointer ${
                      isItemQuarantined 
                        ? 'bg-rose-950/20 hover:bg-rose-950/30' 
                        : isSelected 
                        ? 'bg-purple-950/25 hover:bg-purple-950/35' 
                        : 'hover:bg-[#121622]'
                    }`}
                  >
                    {/* TX_ID */}
                    <td className="py-3.5 px-3 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <span className={isSelected ? 'text-purple-300' : 'text-slate-200'}>
                          {tx.tx_id}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                        )}
                      </div>
                    </td>

                    {/* Scenario */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getScenarioBadgeClass(tx.scenario)}`}>
                        {tx.scenario}
                      </span>
                    </td>

                    {/* Device_ID */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Link2 className="w-3 h-3 text-slate-500" />
                        <span>{tx.device_id}</span>
                        {tx.linked_mule_count > 1 && (
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1 rounded border border-rose-500/20" title={`${tx.linked_mule_count} linked mule accounts`}>
                            {tx.linked_mule_count} mules
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 text-slate-200 font-bold">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Sync Delay */}
                    <td className="py-3.5 px-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{tx.sync_delay_seconds.toLocaleString()}s</span>
                        {tx.sync_delay_seconds > 3600 && (
                          <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded">
                            {'>'}{Math.round(tx.sync_delay_seconds / 3600)}h
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Top-2 Active Experts */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {tx.top_experts.map((exp: ExpertName) => (
                          <span 
                            key={exp}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#181d2c] border border-purple-500/20 text-purple-300 whitespace-nowrap"
                          >
                            {exp.replace('_Expert', '')}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getRiskScoreColor(tx.risk_score)}`}>
                          {tx.risk_score.toFixed(3)}
                        </span>
                      </div>
                    </td>

                    {/* Reason Signals */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="flex flex-col gap-0.5">
                        {tx.reason_signals.slice(0, 2).map((sig, idx) => (
                          <span key={idx} className="text-[11px] text-slate-400 truncate font-sans">
                            &bull; {sig}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Containment Action */}
                    <td className="py-3.5 px-3 text-right">
                      {isItemQuarantined ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <Lock className="w-3 h-3 text-rose-400" />
                          QUARANTINED
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuarantine(tx.device_id);
                          }}
                          disabled={isProcessingThis}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all shadow-sm ${
                            isProcessingThis
                              ? 'bg-rose-950 text-rose-400 cursor-wait'
                              : 'bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-400/30 hover:shadow-rose-900/50 hover:shadow-md cursor-pointer active:scale-95'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{isProcessingThis ? 'Enforcing...' : '🛡️ Quarantine Ring'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
