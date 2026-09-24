import React from 'react';
import { RiskLevel } from '@shared/types';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showIcon = true }) => {
  const getStyles = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500 animate-pulse',
          icon: AlertOctagon,
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
          icon: ShieldAlert,
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
          dot: 'bg-yellow-400',
          icon: AlertTriangle,
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
        };
    }
  };

  const { bg, dot, icon: Icon } = getStyles();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses[size]} tracking-wide uppercase transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{level} RISK</span>
    </span>
  );
};
