import React from 'react';
import { Cpu, Sparkles, Network, Layers, Shield, Zap } from 'lucide-react';

export const MoERouterView: React.FC = () => {
  const experts = [
    {
      name: 'Transaction_Expert',
      type: 'Dense Feature Projection MLP',
      parameters: '12.4M',
      purpose: 'Amount spikes, velocity bursts, cashout thresholds, currency smurfing',
      activeRate: '68%',
      latency: '0.07 ms',
      color: '#38bdf8'
    },
    {
      name: 'Graph_Expert',
      type: 'Graph Attention Network (GAT)',
      parameters: '24.8M',
      purpose: 'Bipartite mule clustering, Sybil topology fan-out, circular transfers',
      activeRate: '54%',
      latency: '0.12 ms',
      color: '#8b5cf6'
    },
    {
      name: 'Temporal_Expert',
      type: 'Bidirectional Temporal Transformer',
      parameters: '18.1M',
      purpose: 'Offline timestamp skew, delayed sync clock drift, commute cadence',
      activeRate: '46%',
      latency: '0.09 ms',
      color: '#10b981'
    },
    {
      name: 'Offline_Anomaly_Expert',
      type: 'Variational Nonce Attestation Autoencoder',
      parameters: '16.5M',
      purpose: 'Cryptographic counter rollover, hardware HSM signature replay, nonce reuse',
      activeRate: '72%',
      latency: '0.08 ms',
      color: '#f43f5e'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="sophos-card rounded-2xl p-6 border-l-4 border-l-purple-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              <span>Sparse Mixture-of-Experts Router &amp; Telum II NNPA</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Top-2 Routing Gating mechanism running at 473,998 tx/s with 50% parameter sparsity on IBM Z17.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300">
            Router Softmax: Top-k = 2
          </div>
        </div>
      </div>

      {/* Sparsity Formula & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sophos-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Gating Sparsity Efficiency</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">50.0% FLOPs Saved</div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            By dynamically evaluating only the Top-2 of 4 specialized neural expert networks per transaction vector, the s390x Telum II coprocessor achieves sub-millisecond inference while retaining a 0.9999 PR-AUC detection rate.
          </p>
        </div>

        <div className="sophos-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
            <Zap className="w-4 h-4" />
            <span>Telum II NNPA Offload</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">0.28 ms Latency</div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Zero-overhead on-chip neural network processing assist (NNPA) executes tensor matrix operations directly in the LPAR memory bus without PCIe host-to-device transfer penalties.
          </p>
        </div>
      </div>

      {/* 4 Expert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experts.map(expert => (
          <div key={expert.name} className="sophos-card sophos-card-hover rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-white" style={{ color: expert.color }}>
                {expert.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2230] text-slate-300 border border-[#2b354c]">
                {expert.parameters} params
              </span>
            </div>

            <div className="text-xs font-mono text-purple-300 bg-[#121520] px-3 py-1.5 rounded-lg border border-[#1e2538]">
              {expert.type}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {expert.purpose}
            </p>

            <div className="pt-2 border-t border-[#1a1e28] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Selection Rate: <strong className="text-white">{expert.activeRate}</strong></span>
              <span className="text-slate-500">Inference: <strong className="text-emerald-400">{expert.latency}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
