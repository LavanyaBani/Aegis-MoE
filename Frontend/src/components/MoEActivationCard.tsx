import React from 'react';
import { Cpu, Sparkles, Zap, Info } from 'lucide-react';
import type { TriageTransaction, ExpertName } from '../types/triage';
import { getExpertBreakdown } from '../utils/triage';

interface MoEActivationCardProps {
  selectedTransaction: TriageTransaction | null;
  defaultTransactions: TriageTransaction[];
}

export const MoEActivationCard: React.FC<MoEActivationCardProps> = ({
  selectedTransaction,
  defaultTransactions
}) => {
  // If a transaction is selected, show its exact activations.
  // Otherwise, compute the average activation across the latest batch.
  const activeTx = selectedTransaction || defaultTransactions[0] || null;

  const contributions: Record<ExpertName, number> = activeTx
    ? activeTx.expert_contributions
    : {
        Transaction_Expert: 0.28,
        Graph_Expert: 0.35,
        Temporal_Expert: 0.22,
        Offline_Anomaly_Expert: 0.15
      };

  const expertBreakdown = getExpertBreakdown(contributions);

  // Expert description metadata
  const expertMeta: Record<ExpertName, { role: string; color: string; bgGlow: string }> = {
    Transaction_Expert: {
      role: 'Amount Velocity & Currency Smurfing',
      color: '#38bdf8', // sky
      bgGlow: 'rgba(56, 189, 248, 0.4)'
    },
    Graph_Expert: {
      role: 'Sybil Ring & Bipartite Mule Topology',
      color: '#8b5cf6', // purple
      bgGlow: 'rgba(139, 92, 246, 0.4)'
    },
    Temporal_Expert: {
      role: 'Offline Sync Lag & Drift Attestation',
      color: '#10b981', // emerald
      bgGlow: 'rgba(16, 185, 129, 0.4)'
    },
    Offline_Anomaly_Expert: {
      role: 'Hardware Enclave Nonce Replay & Counter Tamper',
      color: '#f43f5e', // rose/crimson
      bgGlow: 'rgba(244, 63, 94, 0.4)'
    }
  };

  return (
    <div className="sophos-card rounded-2xl p-6 flex flex-col justify-between">
      {/* Header matching Sophos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white tracking-tight">
              Sparse MoE Top-2 Expert Activation
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-purple-300" />
              Telum II NNPA
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {activeTx ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span>Inspecting TX:</span>
                <span className="text-purple-300 font-mono font-bold">{activeTx.tx_id}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1c2230] text-slate-300 border border-[#2b3548]">
                  {activeTx.scenario}
                </span>
              </span>
            ) : (
              <span>Aggregate Batch Softmax Gating Distribution</span>
            )}
          </div>
        </div>

        {/* Dropdown like Sophos screenshot "All Products" */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <span className="text-[10px] font-mono uppercase text-slate-500">Mode:</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-[#161a25] border border-[#232a3c] text-slate-300">
            Top-2 (50% Sparse)
          </span>
        </div>
      </div>

      {/* Horizontal Pill Bars styled after Sophos "Top alert categories" */}
      <div className="space-y-3.5 my-2">
        {expertBreakdown.map((item) => {
          const meta = expertMeta[item.expert];
          const percentage = Math.round(item.weight * 100);

          return (
            <div key={item.expert} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-200 truncate">{item.displayName}</span>
                  {item.isTop2 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-300" />
                      Top-2
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-400 font-sans hidden xl:inline truncate max-w-[160px]">{meta.role}</span>
                  <span className="font-bold text-white font-mono">{percentage}%</span>
                </div>
              </div>

              {/* Sophos Pill Glass Container */}
              <div className="h-7 w-full bg-[#131620] border border-[#1f2638] rounded-xl p-0.5 relative flex items-center overflow-hidden">
                <div 
                  className="h-full rounded-lg transition-all duration-500 relative flex items-center justify-end pr-2"
                  style={{ 
                    width: `${Math.max(percentage, 5)}%`,
                    backgroundColor: item.isTop2 ? meta.color : '#2d3748',
                    opacity: item.isTop2 ? 0.9 : 0.45,
                    boxShadow: item.isTop2 ? `0 0 12px ${meta.bgGlow}` : 'none'
                  }}
                >
                  {/* Subtle glass reflection highlight */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20 rounded-lg pointer-events-none" />
                </div>
                {/* Embedded Pill Badge at right edge like Sophos screenshot */}
                <div className="absolute right-2 text-[10px] font-mono font-bold text-slate-300 bg-[#1c2233] px-2 py-0.5 rounded-md border border-[#2d3852]">
                  {percentage}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis ruler matching Sophos chart footer */}
      <div className="pt-2 border-t border-[#1a1e28]">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
