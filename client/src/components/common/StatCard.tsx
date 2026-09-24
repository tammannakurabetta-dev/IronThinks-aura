import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'emerald' | 'amber' | 'blue' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
}) => {
  const colorMap = {
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:text-emerald-400',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'group-hover:text-amber-400',
    },
    blue: {
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      glow: 'group-hover:text-blue-400',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'group-hover:text-purple-400',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className={`glass-card p-5 group transition-all duration-300 ${scheme.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 text-slate-100 ${scheme.glow} transition-colors`}>
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span className={trend.positive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-400">vs historical baseline</span>
        </div>
      )}
    </div>
  );
};
