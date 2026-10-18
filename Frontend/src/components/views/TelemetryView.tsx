import React from 'react';
import { Activity, Server, Cpu, Zap, HardDrive, ShieldCheck, Database } from 'lucide-react';
import type { TelemetryStats } from '../../types/triage';

interface TelemetryViewProps {
  stats: TelemetryStats;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="sophos-card rounded-2xl p-6 border-l-4 border-l-emerald-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>IBM Z17 s390x &amp; Telum II Hardware Diagnostics</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Low-level coprocessor telemetry, CPACF crypto execution, and memory throughput monitoring.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            LPAR: SYSPLEX-Z17-PRD
          </div>
        </div>
      </div>

      {/* Main Spec Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sophos-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Mainframe Architecture</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono mt-2">IBM Z17 s390x</div>
          <div className="text-xs text-purple-400 font-mono mt-1">Dual Telum II @ 4.6 GHz</div>
        </div>

        <div className="sophos-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>NNPA Co-Processor</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-2">32.0 TFLOPS</div>
          <div className="text-xs text-slate-400 font-mono mt-1">On-die Matrix Accelerator</div>
        </div>

        <div className="sophos-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Inference Latency</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono mt-2">{stats.inference_latency_ms} ms</div>
          <div className="text-xs text-emerald-400 font-mono mt-1">Sub-millisecond SLA Pass</div>
        </div>

        <div className="sophos-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Memory Bandwidth</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono mt-2">{stats.memory_bandwidth_gbs} GB/s</div>
          <div className="text-xs text-slate-400 font-mono mt-1">Direct LPAR Bus Ingestion</div>
        </div>
      </div>

      {/* Hardware Execution Breakdown */}
      <div className="sophos-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">s390x Execution Pipeline Timeline (Per Batch Inference)</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#121520] border border-[#1e2538]">
            <div className="text-slate-400 text-[11px]">1. CPACF Decrypt</div>
            <div className="text-white font-bold mt-1">0.04 ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Hardware AES-256-GCM</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121520] border border-[#1e2538]">
            <div className="text-slate-400 text-[11px]">2. Sparse Router</div>
            <div className="text-purple-300 font-bold mt-1">0.06 ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Top-2 Gate Softmax</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121520] border border-[#1e2538]">
            <div className="text-slate-400 text-[11px]">3. NNPA Matrix Ops</div>
            <div className="text-emerald-300 font-bold mt-1">0.14 ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">ONNX Runtime / SIMD</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121520] border border-[#1e2538]">
            <div className="text-slate-400 text-[11px]">4. Enclave Attest</div>
            <div className="text-blue-300 font-bold mt-1">0.04 ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Secure Execution Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
