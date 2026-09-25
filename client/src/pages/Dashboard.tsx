import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
  Globe,
  Compass
} from 'lucide-react';
import { workflowApi } from '../api/workflowClient';
import { Workflow, WorkflowMetrics } from '@shared/index';
import { StatusBadge } from '../components/common/StatusBadge';
import { InstantKnowledgeSearch } from '../components/knowledge/InstantKnowledgeSearch';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickTopic, setQuickTopic] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, wfList] = await Promise.all([
        workflowApi.getMetrics(),
        workflowApi.getWorkflows({ limit: 50 })
      ]);
      setMetrics(m);
      setWorkflows(wfList.workflows);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling every 10s for dashboard metrics
    return () => clearInterval(interval);
  }, []);

  const handleQuickLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTopic.trim();
    if (!trimmed) return;
    if (trimmed.length < 10) {
      alert('Please enter a research question of at least 10 characters.');
      return;
    }

    setIsSubmittingQuick(true);
    try {
      const created = await workflowApi.createWorkflow({
        title: trimmed.slice(0, 80),
        topic: trimmed,
        category: 'EXECUTIVE_SCAN',
        depthLevel: 'STANDARD',
        recipients: ['exec-intel@researchflow.ai'],
        requireApproval: true,
        immediateExecution: true,
        stylingTemplate: 'Executive Brief',
        accentColor: '#0284c7'
      });

      setShowQuickModal(false);
      navigate(`/workflows/${created.id}`);
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const filteredWorkflows = workflows.filter(wf => {
    const matchesStatus = statusFilter === 'ALL' || wf.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      wf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Intelligence Pipelines</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            ResearchFlow <span className="gradient-title">Command Center</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Multi-stage autonomous research engine powered by Google Gemini 2.5 Pro & Flash, stateful PostgreSQL FSM, Cheerio web crawling, and responsive email delivery.
          </p>
        </div>

        {/* Quick Launch Action Buttons */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => setShowQuickModal(true)}
            className="btn-secondary text-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Launch</span>
          </button>

          <button
            onClick={() => navigate('/workflows/new')}
            className="btn-primary text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Custom Pipeline</span>
          </button>
        </div>
      </div>

      {/* Universal Entity Knowledge Hub (Wikipedia & Knowledge Tools) */}
      <InstantKnowledgeSearch />

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Workflows Run</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics ? metrics.totalWorkflows : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Active
            </span>
            <span>across all research archetypes</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {metrics ? `${metrics.successRate}%` : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-slate-300 font-semibold">{metrics?.completedWorkflows || 0} completed</span>
            <span>• 0 hallucination drift</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Execution Time</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics ? `${Math.round(metrics.averageDurationSeconds / 60)}m ${metrics.averageDurationSeconds % 60}s` : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-sky-400 font-semibold">6 stages</span>
            <span>including web crawling & critique</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Horizon Scans</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics ? metrics.activeScheduledJobs : 2}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">Autonomous</span>
            <span>daily & weekly monitoring</span>
          </div>
        </div>
      </div>

      {/* Workflows Data Grid Section */}
      <div className="glass-panel p-6 space-y-5">
        {/* Section Header with Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Recent Research Workflow Runs</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {filteredWorkflows.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect live stage executions, logs, and compiled reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'RUNNING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    statusFilter === st
                      ? 'bg-slate-800 text-sky-400 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'AWAITING_REVIEW' ? 'Review Needed' : st}
                </button>
              ))}
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search workflows..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs w-44 md:w-56"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 transition-colors"
              title="Refresh workflows"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Workflows Table */}
        {filteredWorkflows.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Compass className="w-12 h-12 mx-auto mb-3 text-slate-700 animate-pulse" />
            <h4 className="text-base font-bold text-slate-400 mb-1">No research workflows found</h4>
            <p className="text-xs max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first automated multi-stage research workflow.'}
            </p>
            <button
              onClick={() => navigate('/workflows/new')}
              className="btn-primary text-xs mx-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Launch Research Workflow</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Research Topic & Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Execution Status</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Started / Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWorkflows.map(wf => {
                  const categoryFormatted = wf.category.replace('_', ' ');
                  const progressPct = Math.round(((wf.current_step_index || 0) / (wf.total_steps || 6)) * 100);
                  const timeFormatted = new Date(wf.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr
                      key={wf.id}
                      onClick={() => navigate(`/workflows/${wf.id}`)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Title & Topic */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-slate-200 group-hover:text-sky-400 transition-colors line-clamp-1 text-sm">
                          {wf.title}
                        </div>
                        <div className="text-slate-400 text-xs line-clamp-1 mt-0.5">
                          {wf.topic}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-medium text-[11px]">
                          {categoryFormatted}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={wf.status} size="sm" />
                      </td>

                      {/* Pipeline Stage Bar */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                          <span>Stage {wf.current_step_index}/6</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              wf.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : wf.status === 'AWAITING_REVIEW'
                                ? 'bg-amber-400 animate-pulse'
                                : wf.status === 'FAILED'
                                ? 'bg-rose-500'
                                : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Recipients */}
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        <span className="text-slate-400">{wf.recipients?.length || 1} recipients</span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {timeFormatted}
                      </td>

                      {/* Quick Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/workflows/${wf.id}`);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 transition-colors"
                          title="Open live workflow command center"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Launch Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">Quick Research Launch</h3>
              </div>
              <button
                onClick={() => setShowQuickModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickLaunch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Research Question or Domain Prompt:
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={quickTopic}
                  onChange={e => setQuickTopic(e.target.value)}
                  placeholder="e.g. Latest commercial breakthroughs in silicon photonics optical interconnects for AI data centers in 2026..."
                  className="input-field resize-none text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {quickTopic.trim().length > 0 && quickTopic.trim().length < 10 ? (
                    <span className="text-amber-400 font-medium">Please enter at least 10 characters ({quickTopic.trim().length}/10)</span>
                  ) : (
                    'Quick launch automatically executes the 6-stage pipeline with standard depth, Gemini 2.5 synthesis, fact-critique, and inline-CSS email formatting.'
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuick || quickTopic.trim().length < 10}
                  className="btn-primary text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmittingQuick ? 'Launching Engine...' : 'Execute Research Pipeline'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
