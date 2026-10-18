import React from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Cpu, 
  ShieldAlert, 
  Activity, 
  HelpCircle, 
  Settings, 
  ShieldCheck,
  Radio,
  Server
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'bursts' 
  | 'moe_router' 
  | 'sybil_graph' 
  | 'telemetry';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  quarantinedCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onSelectTab, 
  quarantinedCount,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bursts', label: 'Offline-Sync Bursts', icon: Zap },
    { id: 'moe_router', label: 'MoE Expert Router', icon: Cpu },
    { id: 'sybil_graph', label: 'Sybil Graph Quarantine', icon: ShieldAlert, badge: quarantinedCount > 0 ? `${quarantinedCount}` : undefined },
    { id: 'telemetry', label: 's390x Telemetry', icon: Activity }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside className={`fixed md:sticky top-0 left-0 z-40 w-64 bg-[#0a0b0e] border-r border-[#1a1e28] flex flex-col justify-between shrink-0 h-screen select-none transition-transform duration-300 md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      {/* Brand Header */}
      <div>
        <div className="px-6 pt-6 pb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-purple-900/30 ring-1 ring-white/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white font-mono">AEGIS<span className="text-purple-400">-MoE</span></span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              IBM Z17 s390x Enclave
            </div>
          </div>
        </div>

        {/* Live Architecture Status Badge */}
        <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-[#12151d] border border-purple-900/40 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-purple-300 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ARCH: s390x
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              Telum II
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>NNPA Co-Processor Active</span>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="px-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2 font-mono">
            Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#202535] to-[#161a25] text-white shadow-md border border-purple-500/30 shadow-purple-950/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#12151e]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {item.badge}
                    </span>
                  )}
                  {isActive && !item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="px-4 mt-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2 font-mono">
            Platform Nodes
          </div>
          <div className="space-y-1 text-xs">
            <div className="px-3.5 py-2 rounded-lg bg-[#0e1017] border border-[#1a1e28] flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-[11px]">z17-sys01.dfw</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Preferences */}
      <div className="p-4 border-t border-[#1a1e28] space-y-1">
        <button 
          onClick={() => alert("AEGIS-MoE v2.4 (IBM s390x Telum II Accelerator Architecture)\n\nSimulates high-throughput sparse mixture-of-experts for offline-sync triage and deferred nonce double-spend validation.")}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#12151e] transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Documentation & Guide</span>
        </button>
        <div className="px-3 py-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Telum II NNPA</span>
          <span className="text-emerald-400 font-semibold">Sub-ms Ready</span>
        </div>
      </div>
    </aside>
    </>
  );
};
