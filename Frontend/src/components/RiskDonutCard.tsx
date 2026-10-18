import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TriageTransaction } from '../types/triage';
import { calculateRiskBandDistribution } from '../utils/triage';

interface RiskDonutCardProps {
  transactions: TriageTransaction[];
  onFilterBand?: (band: string | null) => void;
  selectedBand?: string | null;
}

export const RiskDonutCard: React.FC<RiskDonutCardProps> = ({
  transactions,
  onFilterBand,
  selectedBand
}) => {
  const distributionData = calculateRiskBandDistribution(transactions);
  const total = transactions.length;

  return (
    <div className="sophos-card rounded-2xl p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Risk Band Distribution</h3>
          <p className="text-xs text-slate-400">Offline-sync threat triage breakdown</p>
        </div>
        <button 
          onClick={() => onFilterBand && onFilterBand(null)}
          className="text-xs text-purple-400 hover:text-purple-300 font-mono transition-colors"
        >
          View All ({total})
        </button>
      </div>

      {/* Donut Chart & Legend layout matching Sophos "Account Health Summary" */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
        {/* Donut Chart with glowing center */}
        <div className="w-48 h-48 relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#10131b] border border-[#232938] px-3 py-1.5 rounded-lg text-xs shadow-xl font-mono">
                        <span className="font-semibold text-white">{data.name}:</span>{' '}
                        <span style={{ color: data.color }}>{data.count} tx</span>{' '}
                        <span className="text-slate-400">({total > 0 ? ((data.count / total) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={distributionData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={76}
                paddingAngle={4}
                stroke="#12141a"
                strokeWidth={3}
              >
                {distributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="transition-all hover:opacity-80 cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{total}</span>
            <span className="text-[10px] uppercase font-mono text-slate-400">Total TX</span>
          </div>
        </div>

        {/* Legend List matching Sophos dot style */}
        <div className="space-y-3 w-full sm:w-auto">
          {distributionData.map((item) => {
            const isSelected = selectedBand === item.name;
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <button
                key={item.name}
                onClick={() => onFilterBand && onFilterBand(isSelected ? null : item.name)}
                className={`flex items-center justify-between sm:justify-start gap-3 w-full px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isSelected ? 'bg-[#1e2333] border border-purple-500/40' : 'hover:bg-[#151824]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ 
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}80` 
                    }}
                  />
                  <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-white">{item.count}</span>
                  <span className="text-slate-400 text-[11px]">({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1a1e28] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>s390x Partition Enclave: <span className="text-emerald-400">ENC-01</span></span>
        <span>Replay Filter: <span className="text-purple-400">Strict Nonce</span></span>
      </div>
    </div>
  );
};
