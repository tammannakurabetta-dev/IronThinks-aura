import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Terminal,
  Globe,
  FileEdit,
  Mail,
  RotateCcw,
  StopCircle,
  Send,
  Sparkles,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';
import { workflowApi, useWorkflowSSE } from '../api/workflowClient';
import { Workflow, WorkflowStep, WorkflowLog, WorkflowSource, SSEMessagePayload } from '@shared/index';
import { StatusBadge } from '../components/common/StatusBadge';
import { WorkflowPipelineGraph } from '../components/workflow/WorkflowPipelineGraph';
import { LiveLogViewer } from '../components/workflow/LiveLogViewer';
import { SourcesGrid } from '../components/workflow/SourcesGrid';
import { MarkdownEditorPanel } from '../components/preview/MarkdownEditorPanel';
import { EmailIframePreview } from '../components/preview/EmailIframePreview';
import { ApprovalActionBar } from '../components/workflow/ApprovalActionBar';

export const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'sources' | 'editor' | 'email'>('logs');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Load initial detail
  const loadWorkflow = useCallback(async () => {
    if (!id) return;
    try {
      const data = await workflowApi.getWorkflowById(id);
      setWorkflow(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Workflow could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  // Handle Real-time SSE Events
  const handleSSEEvent = useCallback((event: SSEMessagePayload) => {
    console.log('[SSE Event Received]:', event.type, event.data);

    setWorkflow(prev => {
      if (!prev) return prev;

      switch (event.type) {
        case 'STATUS_CHANGE':
          return {
            ...prev,
            status: event.data.status,
            current_step_index: event.data.currentStepIndex ?? prev.current_step_index
          };

        case 'STEP_START': {
          const updatedSteps = (prev.steps || []).map(s =>
            s.step_order === event.data.stepOrder
              ? { ...s, status: 'IN_PROGRESS' as const, started_at: new Date().toISOString() }
              : s
          );
          return { ...prev, steps: updatedSteps };
        }

        case 'STEP_COMPLETE': {
          const updatedSteps = (prev.steps || []).map(s =>
            s.step_order === event.data.stepOrder
              ? {
                  ...s,
                  status: 'COMPLETED' as const,
                  output_payload: event.data.output || event.data.plan || event.data.critique || s.output_payload,
                  completed_at: new Date().toISOString()
                }
              : s
          );
          return {
            ...prev,
            steps: updatedSteps,
            current_step_index: Math.max(prev.current_step_index, event.data.stepOrder)
          };
        }

        case 'LOG_APPEND': {
          const newLog: WorkflowLog = event.data.log || {
            id: Date.now(),
            workflow_id: prev.id,
            log_level: 'INFO',
            message: event.data.message || 'Pipeline update',
            created_at: new Date().toISOString()
          };
          return {
            ...prev,
            logs: [...(prev.logs || []), newLog]
          };
        }

        case 'DRAFT_UPDATED':
          return {
            ...prev,
            revised_synthesis_markdown: event.data.draft,
            raw_synthesis_markdown: prev.raw_synthesis_markdown || event.data.draft,
            ...(event.data.htmlReport ? { final_html_report: event.data.htmlReport } : {})
          };

        case 'REPORT_RENDERED':
          return {
            ...prev,
            final_html_report: event.data.htmlReport || prev.final_html_report
          };

        case 'WORKFLOW_COMPLETE':
          return {
            ...prev,
            status: 'COMPLETED',
            completed_at: event.data.completedAt || new Date().toISOString()
          };

        case 'WORKFLOW_FAILED':
          return {
            ...prev,
            status: 'FAILED',
            error_message: event.data.error
          };

        case 'WORKFLOW_CANCELLED':
          return {
            ...prev,
            status: 'CANCELLED'
          };

        default:
          return prev;
      }
    });

    // Also re-fetch sources or full detail if step 2 or step 5 completed
    if (event.type === 'STEP_COMPLETE' && (event.data.stepOrder === 2 || event.data.stepOrder === 4 || event.data.stepOrder === 5)) {
      loadWorkflow();
    }
  }, [loadWorkflow]);

  useWorkflowSSE(id, handleSSEEvent);

  // Approval handler
  const handleApprove = async () => {
    if (!id) return;
    setIsApproving(true);
    try {
      await workflowApi.approveWorkflow(id);
      await loadWorkflow();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Rerun step handler
  const handleRerun = async () => {
    if (!id) return;
    if (window.confirm('Rerun research pipeline from Stage 3 (Synthesis)?')) {
      try {
        await workflowApi.retryWorkflow(id, 3);
        await loadWorkflow();
      } catch (err: any) {
        alert(`Retry error: ${err.message}`);
      }
    }
  };

  // Cancel handler
  const handleCancel = async () => {
    if (!id) return;
    if (window.confirm('Abort this running workflow?')) {
      try {
        await workflowApi.cancelWorkflow(id);
        await loadWorkflow();
      } catch (err: any) {
        alert(`Cancel error: ${err.message}`);
      }
    }
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      await workflowApi.startWorkflow(id);
      await loadWorkflow();
    } catch (err: any) {
      alert(`Start error: ${err.message}`);
    }
  };

  // Draft Save Handler
  const handleSaveDraft = async (revisedMarkdown: string) => {
    if (!id) return;
    await workflowApi.updateDraft(id, { revisedMarkdown });
    await loadWorkflow();
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500 space-y-3">
        <Sparkles className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm font-medium">Connecting to ResearchFlow State Engine...</p>
      </div>
    );
  }

  if (errorMsg || !workflow) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-lg mx-auto text-center space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-400" />
        <h3 className="font-bold text-base">Workflow Not Found</h3>
        <p className="text-xs">{errorMsg || 'The requested workflow does not exist.'}</p>
        <button onClick={() => navigate('/')} className="btn-secondary text-xs mx-auto">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isAwaitingReview = workflow.status === 'AWAITING_REVIEW';
  const isRunning = workflow.status === 'RUNNING' || workflow.status === 'QUEUED';
  const isCompleted = workflow.status === 'COMPLETED';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Back Navigation & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Workflow Operational Action Buttons */}
        <div className="flex items-center gap-2.5">
          {workflow.status === 'DRAFT' && (
            <button
              onClick={handleStart}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Execution</span>
            </button>
          )}

          {isRunning && (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel Run</span>
            </button>
          )}

          {(workflow.status === 'FAILED' || workflow.status === 'CANCELLED') && (
            <button
              onClick={() => handleRerun()}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Pipeline</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workflow Header Card */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {workflow.category.replace('_', ' ')}
              </span>
              <StatusBadge status={workflow.status} />
              <span className="text-xs text-slate-400 font-mono">
                Scope: {workflow.depth_level}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              {workflow.title}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed">
              {workflow.topic}
            </p>
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-col sm:items-end gap-1.5 text-[11px] text-slate-400 font-mono shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Started: {new Date(workflow.created_at).toLocaleTimeString()}</span>
            </div>
            <div>
              Recipients: <span className="text-slate-200 font-bold">{workflow.recipients?.length || 1}</span>
            </div>
            <div>
              ID: <span className="text-slate-400">{workflow.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Visual Pipeline Graph Track */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <WorkflowPipelineGraph
            steps={workflow.steps}
            currentStepIndex={workflow.current_step_index}
          />
        </div>
      </div>

      {/* Content Inspection Tabs */}
      <div className="space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: 'logs', label: 'Live Telemetry & Logs', icon: Terminal, count: workflow.logs?.length },
              { id: 'sources', label: 'Ingested Sources', icon: Globe, count: workflow.sources?.length },
              { id: 'editor', label: 'Draft Briefing Editor', icon: FileEdit, badge: 'HITL' },
              { id: 'email', label: 'Email Preview (Inlined)', icon: Mail, badge: workflow.final_html_report ? 'Ready' : undefined },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'logs' && (
            <LiveLogViewer logs={workflow.logs} isStreaming={isRunning} />
          )}

          {activeTab === 'sources' && (
            <SourcesGrid sources={workflow.sources} />
          )}

          {activeTab === 'editor' && (
            <MarkdownEditorPanel
              initialMarkdown={workflow.revised_synthesis_markdown || workflow.raw_synthesis_markdown || ''}
              onSaveDraft={handleSaveDraft}
              isReadOnly={isCompleted}
            />
          )}

          {activeTab === 'email' && (
            <EmailIframePreview
              workflowId={workflow.id}
              htmlReport={workflow.final_html_report}
              recipients={workflow.recipients}
            />
          )}
        </div>
      </div>

      {/* Floating Human-in-the-Loop Sign-off Bar */}
      {isAwaitingReview && (
        <ApprovalActionBar
          workflowId={workflow.id}
          onApprove={handleApprove}
          onRerun={handleRerun}
          isApproving={isApproving}
        />
      )}
    </div>
  );
};
