import React from 'react';
import { WorkflowStatus, StepStatus } from '@shared/index';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Play, PauseCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: WorkflowStatus | StepStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const normalized = status.toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size];

  switch (normalized) {
    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>Completed</span>
        </span>
      );

    case 'RUNNING':
    case 'IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 ${sizeClasses}`}>
          {showIcon && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          )}
          <span>{normalized === 'RUNNING' ? 'Running' : 'In Progress'}</span>
        </span>
      );

    case 'AWAITING_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse ${sizeClasses}`}>
          {showIcon && <PauseCircle className="w-3.5 h-3.5" />}
          <span>Awaiting Review</span>
        </span>
      );

    case 'QUEUED':
    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 ${sizeClasses}`}>
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-400" />}
          <span>{normalized === 'QUEUED' ? 'Queued' : 'Pending'}</span>
        </span>
      );

    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
          {showIcon && <AlertTriangle className="w-3.5 h-3.5" />}
          <span>Failed</span>
        </span>
      );

    case 'CANCELLED':
    case 'SKIPPED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 ${sizeClasses}`}>
          {showIcon && <XCircle className="w-3.5 h-3.5" />}
          <span>{normalized === 'CANCELLED' ? 'Cancelled' : 'Skipped'}</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
