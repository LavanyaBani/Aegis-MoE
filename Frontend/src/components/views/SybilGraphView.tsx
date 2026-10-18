import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle, Share2, Layers, AlertTriangle } from 'lucide-react';
import type { TriageTransaction } from '../../types/triage';

interface SybilGraphViewProps {
  transactions: TriageTransaction[];
  onQuarantine: (deviceId: string) => void;
}

export const SybilGraphView: React.FC<SybilGraphViewProps> = ({ transactions, onQuarantine }) => {
  const [selectedCluster, setSelectedCluster] = useState<string | null>('DEV-POS-NFC-771');

  // Find unique devices
  const devices = Array.from(new Set(transactions.map(t => t.device_id))).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="sophos-card rounded-2xl p-6 border-l-4 border-l-rose-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Sybil Graph Quarantine &amp; Mule Ring Topology</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visualizes bipartite transaction graphs, rapid cashout rings, and automated s390x enclave isolation.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300">
            Graph Attention Network (GAT) Analysis
          </div>
        </div>
      </div>

      {/* Interactive Graph SVG Canvas */}
      <div className="sophos-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white">Bipartite Sybil Ring Cluster Visualizer</div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Device Hub
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Mule Node
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Honest Terminal
            </span>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="w-full h-80 bg-[#0d0f16] rounded-xl border border-[#1d2332] relative overflow-hidden flex items-center justify-center p-4">
          <svg className="w-full h-full" viewBox="0 0 800 320">
            {/* Background grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161b26" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connecting Links */}
            <line x1="200" y1="160" x2="380" y2="90" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 2" opacity="0.7" />
            <line x1="200" y1="160" x2="380" y2="160" stroke="#ef4444" strokeWidth="2.5" opacity="0.9" />
            <line x1="200" y1="160" x2="380" y2="230" stroke="#ef4444" strokeWidth="2.5" opacity="0.9" />
            <line x1="200" y1="160" x2="100" y2="80" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" />
            <line x1="200" y1="160" x2="100" y2="240" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" />

            <line x1="600" y1="160" x2="500" y2="100" stroke="#10b981" strokeWidth="1.5" opacity="0.7" />
            <line x1="600" y1="160" x2="500" y2="220" stroke="#10b981" strokeWidth="1.5" opacity="0.7" />

            {/* Central Sybil Hub Node */}
            <g className="cursor-pointer" onClick={() => setSelectedCluster('DEV-POS-NFC-771')}>
              <circle cx="200" cy="160" r="28" fill="#2e1065" stroke="#a855f7" strokeWidth="3" />
              <circle cx="200" cy="160" r="38" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" className="animate-spin" />
              <text x="200" y="164" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="bold">DEV-771</text>
            </g>

            {/* Mule Nodes */}
            <g>
              <circle cx="380" cy="90" r="16" fill="#4c0519" stroke="#f43f5e" strokeWidth="2" />
              <text x="380" y="94" textAnchor="middle" fill="#fda4af" fontSize="9" fontFamily="monospace">Mule#1</text>
            </g>
            <g>
              <circle cx="380" cy="160" r="18" fill="#4c0519" stroke="#f43f5e" strokeWidth="2" />
              <text x="380" y="164" textAnchor="middle" fill="#fda4af" fontSize="9" fontFamily="monospace">Mule#2</text>
            </g>
            <g>
              <circle cx="380" cy="230" r="16" fill="#4c0519" stroke="#f43f5e" strokeWidth="2" />
              <text x="380" y="234" textAnchor="middle" fill="#fda4af" fontSize="9" fontFamily="monospace">Mule#3</text>
            </g>
            <g>
              <circle cx="100" cy="80" r="14" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
              <text x="100" y="84" textAnchor="middle" fill="#c7d2fe" fontSize="8" fontFamily="monospace">POS#08</text>
            </g>
            <g>
              <circle cx="100" cy="240" r="14" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
              <text x="100" y="244" textAnchor="middle" fill="#c7d2fe" fontSize="8" fontFamily="monospace">POS#09</text>
            </g>

            {/* Honest Cluster */}
            <g>
              <circle cx="600" cy="160" r="24" fill="#064e3b" stroke="#10b981" strokeWidth="2.5" />
              <text x="600" y="164" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontFamily="monospace">SUBWAY-01</text>
            </g>
            <g>
              <circle cx="500" cy="100" r="14" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
              <text x="500" y="104" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontFamily="monospace">Card#A</text>
            </g>
            <g>
              <circle cx="500" cy="220" r="14" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
              <text x="500" y="224" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontFamily="monospace">Card#B</text>
            </g>
          </svg>
        </div>

        {/* Selected Ring Details */}
        <div className="mt-4 p-4 rounded-xl bg-[#121520] border border-[#202638] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span>Cluster Focus: DEV-POS-NFC-771</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                5 Linked Mule Accounts
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-terminal rapid double-spend pattern detected across 3 distinct merchant devices within 120 seconds.
            </p>
          </div>

          <button
            onClick={() => onQuarantine('DEV-POS-NFC-771')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-rose-950/50 shrink-0 cursor-pointer"
          >
            🛡️ Quarantine Cluster &amp; Mules
          </button>
        </div>
      </div>
    </div>
  );
};
