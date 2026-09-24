import React, { useState } from 'react';
import { AdvisoryActionItemRecord } from '@shared/types';
import { api } from '../../api/client';
import { CheckCircle2, Clock, Calendar, CheckSquare, Square, Tag } from 'lucide-react';

interface ActionItemTrackerProps {
  actionItems: AdvisoryActionItemRecord[];
  onStatusChange?: (id: string, newStatus: 'PENDING' | 'DONE') => void;
}

export const ActionItemTracker: React.FC<ActionItemTrackerProps> = ({
  actionItems,
  onStatusChange,
}) => {
  const [items, setItems] = useState<AdvisoryActionItemRecord[]>(actionItems);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleStatus = async (item: AdvisoryActionItemRecord) => {
    const newStatus = item.status === 'DONE' ? 'PENDING' : 'DONE';
    setUpdatingId(item.id);

    // Optimistic update
    setItems(prev =>
      prev.map(i => (i.id === item.id ? { ...i, status: newStatus } : i))
    );

    try {
      await api.updateActionItem(item.id, newStatus);
      if (onStatusChange) onStatusChange(item.id, newStatus);
    } catch (err) {
      console.error('Failed to update action item status:', err);
      // Revert if error
      setItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, status: item.status } : i))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const completedCount = items.filter(i => i.status === 'DONE').length;
  const totalCount = items.length;
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Field Action Items & Interventions
          </h3>
          <p className="text-xs text-slate-400">Execution checklist prioritized by agronomic urgency</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Progress</span>
            <p className="text-sm font-bold text-emerald-400">
              {completedCount} / {totalCount} completed ({percentCompleted}%)
            </p>
          </div>
          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800/60 mt-2">
        {items.map(item => {
          const isDone = item.status === 'DONE';
          const isPending = updatingId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => toggleStatus(item)}
              className={`py-3.5 px-3 -mx-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 hover:bg-slate-800/40 ${
                isDone ? 'opacity-60 bg-slate-900/30' : ''
              }`}
            >
              <button
                disabled={isPending}
                className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
              >
                {isDone ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 hover:border-emerald-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    {item.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      item.urgency_days <= 2
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : item.urgency_days <= 5
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Within {item.urgency_days} day{item.urgency_days > 1 ? 's' : ''}
                  </span>
                </div>
                <p className={`text-sm text-slate-200 leading-snug ${isDone ? 'line-through text-slate-400' : ''}`}>
                  {item.action_text}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isDone
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? 'DONE' : 'PENDING'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
