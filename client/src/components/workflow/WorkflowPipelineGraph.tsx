import React, { useState } from 'react';
import { WorkflowStep, StepType } from '@shared/index';
import {
  Compass,
  Globe,
  BrainCircuit,
  ShieldAlert,
  Code2,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

interface WorkflowPipelineGraphProps {
  steps?: WorkflowStep[];
  currentStepIndex: number;
  onSelectStep?: (step: WorkflowStep) => void;
  selectedStepOrder?: number | null;
}

const STEP_DEFINITIONS: Array<{
  type: StepType;
  order: number;
  name: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: 'PLAN_EXPANSION',
    order: 1,
    name: 'Query Planning',
    shortDesc: 'gemini-2.5-flash expansion',
    icon: Compass,
  },
  {
    type: 'WEB_SCRAPE',
    order: 2,
    name: 'Web Ingestion',
    shortDesc: 'SSRF-safe Cheerio crawl',
    icon: Globe,
  },
  {
    type: 'SYNTHESIS',
    order: 3,
    name: 'Deep Synthesis',
    shortDesc: 'gemini-2.5-pro briefing',
    icon: BrainCircuit,
  },
  {
    type: 'CRITIQUE_REVISE',
    order: 4,
    name: 'Fact Critique',
    shortDesc: 'Autonomous editorial review',
    icon: ShieldAlert,
  },
  {
    type: 'HTML_RENDER',
    order: 5,
    name: 'Email Render',
    shortDesc: 'Juice CSS inline compiler',
    icon: Code2,
  },
  {
    type: 'EMAIL_DISPATCH',
    order: 6,
    name: 'Report Delivery',
    shortDesc: 'Transactional dispatch',
    icon: Mail,
  },
];

export const WorkflowPipelineGraph: React.FC<WorkflowPipelineGraphProps> = ({
  steps = [],
  currentStepIndex,
  onSelectStep,
  selectedStepOrder
}) => {
  const [inspectedStep, setInspectedStep] = useState<WorkflowStep | null>(null);

  const getStepState = (order: number) => {
    const existing = steps.find(s => s.step_order === order);
    if (!existing) {
      if (order < currentStepIndex) return { status: 'COMPLETED', duration: null };
      if (order === currentStepIndex + 1) return { status: 'IN_PROGRESS', duration: null };
      return { status: 'PENDING', duration: null };
    }
    return {
      status: existing.status,
      duration: existing.duration_ms ? `${(existing.duration_ms / 1000).toFixed(1)}s` : null,
      raw: existing
    };
  };

  const handleStepClick = (order: number) => {
    const matched = steps.find(s => s.step_order === order);
    if (matched) {
      setInspectedStep(matched);
      if (onSelectStep) onSelectStep(matched);
    }
  };

  return (
    <div className="w-full">
      {/* Node Flow Visualizer */}
      <div className="relative overflow-x-auto pb-4 pt-2">
        <div className="min-w-[760px] flex items-center justify-between relative px-4">
          {/* Background Connector Track */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-5 h-1 bg-slate-800 -z-0 rounded-full" />

          {STEP_DEFINITIONS.map((def, idx) => {
            const state = getStepState(def.order);
            const Icon = def.icon;
            const isCompleted = state.status === 'COMPLETED';
            const isRunning = state.status === 'IN_PROGRESS';
            const isFailed = state.status === 'FAILED';
            const isSelected = selectedStepOrder === def.order;

            return (
              <div
                key={def.type}
                onClick={() => handleStepClick(def.order)}
                className={`relative z-10 flex flex-col items-center cursor-pointer group transition-all duration-300 ${
                  isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                {/* Node Orb */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative shadow-xl ${
                    isCompleted
                      ? 'bg-slate-900 border-2 border-emerald-500/80 text-emerald-400 shadow-emerald-950/40'
                      : isRunning
                      ? 'bg-sky-950 border-2 border-sky-400 text-sky-300 shadow-sky-900/50'
                      : isFailed
                      ? 'bg-rose-950 border-2 border-rose-500 text-rose-400 shadow-rose-950/40'
                      : 'bg-slate-900 border border-slate-700/80 text-slate-500'
                  }`}
                >
                  {/* Active glowing pulse ring */}
                  {isRunning && (
                    <span className="absolute -inset-1 rounded-2xl bg-sky-400/30 animate-pulse pointer-events-none" />
                  )}

                  {/* Step Icon */}
                  <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />

                  {/* Status Overlay Corner Badge */}
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                    {isCompleted && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isRunning && (
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-mono">
                        {def.order}
                      </span>
                    )}
                    {isFailed && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {!isCompleted && !isRunning && !isFailed && (
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-mono">
                        {def.order}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Text Label */}
                <div className="mt-2.5 text-center">
                  <div
                    className={`text-xs font-bold tracking-tight transition-colors ${
                      isCompleted
                        ? 'text-slate-200'
                        : isRunning
                        ? 'text-sky-400 font-extrabold'
                        : isFailed
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {def.name}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-0.5 max-w-[110px] truncate">
                    {state.duration ? (
                      <span className="text-emerald-400 font-mono font-medium flex items-center justify-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {state.duration}
                      </span>
                    ) : isRunning ? (
                      <span className="text-sky-400 font-semibold animate-pulse">Running...</span>
                    ) : (
                      def.shortDesc
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Step Payload Inspector Modal / Popover */}
      {inspectedStep && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-200">
                Step {inspectedStep.step_order} Artifact Inspector: {inspectedStep.step_type}
              </span>
            </div>
            <button
              onClick={() => setInspectedStep(null)}
              className="text-slate-400 hover:text-slate-200 text-xs font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Input Arguments:</span>
              <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40 border border-slate-800/60">
                {JSON.stringify(inspectedStep.input_payload || { status: 'None provided' }, null, 2)}
              </pre>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Output Payload / Metrics:</span>
              <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-sky-300 overflow-x-auto max-h-40 border border-slate-800/60">
                {JSON.stringify(inspectedStep.output_payload || { status: inspectedStep.status }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
