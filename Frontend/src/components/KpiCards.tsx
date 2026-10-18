import React from 'react';
import { 
  Target, 
  Cpu, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Lock
} from 'lucide-react';

interface KpiCardsProps {
  prAuc: number;
  throughput: number;
  criticalCount: number;
  quarantinedCount: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  prAuc,
  throughput,
  criticalCount,
  quarantinedCount
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: PR-AUC Score */}
      <div className="sophos-card sophos-card-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#1c2230] border border-[#2d3748] flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +10%
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">PR-AUC Score</div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
          {prAuc.toFixed(4)}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
          <span className="text-emerald-400 font-medium">Optimal</span> &bull; Telum II Gating Accuracy
        </div>
      </div>

      {/* CARD 2: Throughput (s390x) */}
      <div className="sophos-card sophos-card-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#1c2230] border border-[#2d3748] flex items-center justify-center text-purple-400 group-hover:border-purple-500/40 transition-colors">
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
            <Zap className="w-3 h-3 text-purple-300" />
            Sub-ms
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">Throughput (s390x)</div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
          {throughput.toLocaleString()} <span className="text-xs font-normal text-slate-400">tx/s</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1">
          <span className="text-purple-400">ONNX Runtime</span> &bull; 0.28ms Telum II NNPA
        </div>
      </div>

      {/* CARD 3: Critical Sync Alerts */}
      <div className="sophos-card sophos-card-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#241a20] border border-[#44232c] flex items-center justify-center text-rose-400 group-hover:border-rose-500/40 transition-colors">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Action required
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">Critical Sync Alerts</div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
          {criticalCount.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1">
          <span className="text-rose-400 font-medium">High Severity</span> &bull; Double-spend &amp; Sybils
        </div>
      </div>

      {/* CARD 4: Quarantined Entities */}
      <div className="sophos-card sophos-card-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#142324] border border-[#1e3c3b] flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <Lock className="w-3 h-3" />
            Enclave Active
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">Quarantined Entities</div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
          {quarantinedCount.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1">
          <span className="text-emerald-400 font-medium">Isolated</span> &bull; HSM Keys Revoked
        </div>
      </div>
    </div>
  );
};
