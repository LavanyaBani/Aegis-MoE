import React from 'react';
import { ShieldCheck, Lock, X, CheckCircle, Cpu, AlertTriangle, Key } from 'lucide-react';
import type { QuarantineResult } from '../types/triage';

interface QuarantineModalProps {
  result: QuarantineResult | null;
  onClose: () => void;
}

export const QuarantineModal: React.FC<QuarantineModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="sophos-card rounded-2xl max-w-lg w-full p-6 border border-rose-500/40 shadow-2xl shadow-rose-950/60 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#141724] border border-[#23293c]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Enclave Shield */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-900/40">
            <ShieldCheck className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Enclave Quarantine Enforced</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              s390x Secure Execution Hardware Isolation &bull; Telum II Gating Alert
            </p>
          </div>
        </div>

        {/* Quarantine Details */}
        <div className="space-y-3 font-mono text-xs my-4 bg-[#0d1017] p-4 rounded-xl border border-[#1b2130]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2130]">
            <span className="text-slate-400">Target Device ID:</span>
            <span className="font-bold text-white">{result.device_id}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#1b2130]">
            <span className="text-slate-400">Enclave Cluster ID:</span>
            <span className="font-semibold text-purple-300">{result.cluster_id}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#1b2130]">
            <span className="text-slate-400">Isolated Sybil Mule Accounts:</span>
            <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {result.quarantined_accounts_count} Accounts Locked
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#1b2130]">
            <span className="text-slate-400">s390x HSM Revocation Hash:</span>
            <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" />
              {result.hsm_revocation_id}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Action Timestamp:</span>
            <span className="text-slate-300">{new Date(result.action_timestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Hardware Status Note */}
        <div className="bg-[#121622] border border-purple-500/20 p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
          <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-300">
            All offline authorization keys for this device and connected mule cluster have been revoked at the IBM Z17 CPACF cryptographic coprocessor level. Double-spend transactions from this ring are barred from ledger settlement.
          </p>
        </div>

        {/* Footer Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
          >
            Acknowledge &amp; Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
