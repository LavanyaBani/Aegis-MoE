import React from 'react';
import { 
  ChevronRight, 
  Home, 
  Bell, 
  User, 
  Sparkles, 
  Cpu, 
  Filter, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ScenarioType, EngineType } from '../types/triage';

interface HeaderProps {
  scenarioFilter: ScenarioType;
  setScenarioFilter: (filter: ScenarioType) => void;
  engine: EngineType;
  setEngine: (engine: EngineType) => void;
  onSimulateBurst: () => void;
  isSimulating: boolean;
  backendConnected: boolean;
  activeTabTitle: string;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarioFilter,
  setScenarioFilter,
  engine,
  setEngine,
  onSimulateBurst,
  isSimulating,
  backendConnected,
  activeTabTitle,
  onToggleMobileMenu
}) => {
  return (
    <header className="border-b border-[#1a1e28] bg-[#0c0e14]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4">
      {/* Top Breadcrumb & User Bar matching Sophos style */}
      <div className="flex items-center justify-between pb-3 border-b border-[#161a24] text-xs">
        {/* Breadcrumb + Hamburger */}
        <div className="flex items-center gap-2 text-slate-400 font-mono">
          <button 
            onClick={onToggleMobileMenu}
            className="md:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#1c2230]"
            aria-label="Toggle Menu"
          >
            <Filter className="w-4 h-4" />
          </button>
          <Home className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 cursor-pointer hidden sm:inline" />
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
          <span className="text-slate-400 hidden sm:inline">Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
          <span className="text-purple-400 font-semibold">{activeTabTitle}</span>
        </div>

        {/* Right Status & Profile Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend link indicator */}
          <div 
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-mono border ${
              backendConnected 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-purple-950/30 border-purple-500/20 text-purple-300'
            }`}
            title={backendConnected ? "Connected to FastAPI at localhost:8000" : "Using realistic zero-downtime mock engine"}
          >
            {backendConnected ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 text-purple-400 shrink-0" />
            )}
            <span className="hidden sm:inline">{backendConnected ? 'FastAPI :8000 Online' : 's390x Engine Fallback Active'}</span>
            <span className="sm:hidden">{backendConnected ? ':8000' : 's390x Engine'}</span>
          </div>

          {/* Notification Bell */}
          <button 
            className="p-1.5 rounded-lg bg-[#141722] hover:bg-[#1c2130] text-slate-400 hover:text-slate-200 transition-colors border border-[#202636] relative"
            aria-label="Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[#141722] border border-[#202636] text-slate-300">
            <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <span className="text-xs font-mono font-medium">s390x_admin</span>
          </div>
        </div>
      </div>

      {/* Main Title & Action Row matching Sophos "Threat Analysis Center Dashboard" */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Threat Analysis &amp; Deferred-Sync Center</span>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
              v2.4-MoE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sparse MoE Top-2 Expert Gating &bull; Sub-millisecond Offline Double-Spend &amp; Sybil Ring Quarantine
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-[#141722] px-3 py-1.5 rounded-xl border border-[#232938]">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="scenario-select" className="text-[11px] text-slate-400 font-mono">Scenario:</label>
            <select
              id="scenario-select"
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value as ScenarioType)}
              className="bg-transparent text-xs text-white font-mono focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#12151d] text-white">ALL Scenarios</option>
              <option value="Offline_Nonce_DoubleSpend" className="bg-[#12151d] text-white">Offline_Nonce_DoubleSpend</option>
              <option value="Sybil_Mule_Ring_Burst" className="bg-[#12151d] text-white">Sybil_Mule_Ring_Burst</option>
              <option value="Offline_NFC_Honest_Sync" className="bg-[#12151d] text-white">Offline_NFC_Honest_Sync</option>
            </select>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center gap-1.5 bg-[#141722] px-3 py-1.5 rounded-xl border border-[#232938]">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <label htmlFor="engine-select" className="text-[11px] text-slate-400 font-mono">Engine:</label>
            <select
              id="engine-select"
              value={engine}
              onChange={(e) => setEngine(e.target.value as EngineType)}
              className="bg-transparent text-xs text-purple-300 font-mono font-medium focus:outline-none cursor-pointer"
            >
              <option value="AUTO (ONNX)" className="bg-[#12151d] text-white">AUTO (ONNX)</option>
              <option value="PYTORCH" className="bg-[#12151d] text-white">PYTORCH</option>
            </select>
          </div>

          {/* Primary Action Button: Glowing Purple Button */}
          <button
            onClick={onSimulateBurst}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer font-mono shadow-lg ${
              isSimulating
                ? 'bg-purple-900/60 opacity-80 cursor-wait'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-purple-900/40 purple-glow-btn hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-purple-300' : 'text-purple-200'}`} />
            <span>⚡ Simulate Offline Sync Burst</span>
          </button>
        </div>
      </div>
    </header>
  );
};
