import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Send, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApprovalActionBarProps {
  workflowId: string;
  onApprove: () => Promise<void>;
  onRerun: () => Promise<void>;
  onSaveDraft?: () => Promise<void>;
  isApproving?: boolean;
}

export const ApprovalActionBar: React.FC<ApprovalActionBarProps> = ({
  workflowId,
  onApprove,
  onRerun,
  onSaveDraft,
  isApproving = false
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      // Fire confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.9 },
          colors: ['#0284c7', '#38bdf8', '#10b981', '#6366f1']
        });
      } catch (_) {}

      await onApprove();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sticky bottom-6 z-40 max-w-4xl mx-auto w-full px-4 animate-in slide-in-from-bottom-6 duration-300">
      <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl shadow-amber-950/30 flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Review Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <span>Human-in-the-Loop Sign-off Required</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                GATE ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Inspect the synthesized brief, make edits if needed, then approve to render HTML and dispatch email.
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Reject / Rerun Button */}
          <button
            onClick={onRerun}
            disabled={submitting || isApproving}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Rerun Stage</span>
          </button>

          {/* Save Draft Button */}
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              disabled={submitting || isApproving}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>Save Revisions</span>
            </button>
          )}

          {/* Primary Glow Approve & Send Button */}
          <button
            onClick={handleApprove}
            disabled={submitting || isApproving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 hover:shadow-emerald-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{submitting || isApproving ? 'Approving...' : 'Approve & Send Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
