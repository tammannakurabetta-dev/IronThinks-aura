import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Compass,
  Globe,
  Sliders,
  Mail,
  Plus,
  X,
  ShieldCheck,
  Zap,
  Layers,
  Palette,
  Clock
} from 'lucide-react';
import { workflowApi } from '../api/workflowClient';
import { ResearchCategory, DepthLevel } from '@shared/index';

export const CreateWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<ResearchCategory>('EXECUTIVE_SCAN');
  const [depthLevel, setDepthLevel] = useState<DepthLevel>('STANDARD');

  // Source selection state
  const [queryInput, setQueryInput] = useState('');
  const [customQueries, setCustomQueries] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [excludedDomains, setExcludedDomains] = useState<string[]>(['pinterest.com', 'quora.com']);

  // Styling state
  const [stylingTemplate, setStylingTemplate] = useState('Executive Brief');
  const [accentColor, setAccentColor] = useState('#0284c7');

  // Dispatch state
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>(['research-briefs@company.com']);
  const [requireApproval, setRequireApproval] = useState(true);
  const [immediateExecution, setImmediateExecution] = useState(true);

  // Quick preset loader
  const handleLoadSample = (sampleType: string) => {
    if (sampleType === 'solid-state') {
      setTitle('Next-Gen Solid-State Battery Commercialization Roadmap 2026');
      setTopic('Commercial manufacturing milestones, energy density breakthroughs, and automotive OEM adoption timelines for all-solid-state lithium batteries in 2026.');
      setCategory('MARKET_INTEL');
      setDepthLevel('STANDARD');
      setStylingTemplate('Executive Brief');
      setAccentColor('#0284c7');
    } else if (sampleType === 'agents') {
      setTitle('Agentic AI Orchestration Frameworks Comparative Benchmark');
      setTopic('Comparative technical evaluation of AutoGen, LangGraph, and CrewAI for multi-agent enterprise automation in production environments.');
      setCategory('TECH_FEASIBILITY');
      setDepthLevel('COMPREHENSIVE');
      setStylingTemplate('Technical Deep-Dive');
      setAccentColor('#10b981');
    } else if (sampleType === 'regulatory') {
      setTitle('EU AI Act High-Risk Systems Compliance & Governance Matrix');
      setTopic('Statutory requirements, technical documentation standards, and enforcement deadlines for biometric and financial high-risk AI deployments under the EU AI Act in 2026.');
      setCategory('REGULATORY');
      setDepthLevel('STANDARD');
      setStylingTemplate('Regulatory & Compliance Sentinel');
      setAccentColor('#f59e0b');
    }
  };

  const handleAddQuery = () => {
    if (queryInput.trim() && !customQueries.includes(queryInput.trim())) {
      setCustomQueries([...customQueries, queryInput.trim()]);
      setQueryInput('');
    }
  };

  const handleRemoveQuery = (q: string) => {
    setCustomQueries(customQueries.filter(item => item !== q));
  };

  const handleAddDomain = () => {
    if (domainInput.trim() && !excludedDomains.includes(domainInput.trim())) {
      setExcludedDomains([...excludedDomains, domainInput.trim().toLowerCase()]);
      setDomainInput('');
    }
  };

  const handleRemoveDomain = (d: string) => {
    setExcludedDomains(excludedDomains.filter(item => item !== d));
  };

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !recipients.includes(recipientInput.trim())) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput.trim())) {
        setRecipients([...recipients, recipientInput.trim()]);
        setRecipientInput('');
      } else {
        alert('Please enter a valid email address.');
      }
    }
  };

  const handleRemoveRecipient = (r: string) => {
    if (recipients.length <= 1) {
      alert('At least one recipient email address is required.');
      return;
    }
    setRecipients(recipients.filter(item => item !== r));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!title.trim() || title.length < 3) {
      setErrorMsg('Please specify a title of at least 3 characters.');
      setCurrentStep(1);
      return;
    }
    if (!topic.trim() || topic.length < 10) {
      setErrorMsg('Please describe your research objective in at least 10 characters.');
      setCurrentStep(1);
      return;
    }
    if (recipients.length === 0) {
      setErrorMsg('At least one recipient email address is required.');
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await workflowApi.createWorkflow({
        title,
        topic,
        category,
        depthLevel,
        recipients,
        requireApproval,
        customSearchQueries: customQueries,
        excludedDomains,
        stylingTemplate,
        accentColor,
        immediateExecution
      });

      navigate(`/workflows/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize workflow.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CATEGORY_CARDS = [
    {
      id: 'EXECUTIVE_SCAN',
      label: 'Executive Horizon Scan',
      desc: 'C-suite summary, strategic macro implications, capital allocation shifts, and 30-60-90 day horizon items.',
      icon: Compass,
      color: 'from-sky-500/20 to-blue-500/10 border-sky-500/40 text-sky-400'
    },
    {
      id: 'TECH_FEASIBILITY',
      label: 'Technical & Engineering Feasibility',
      desc: 'Architecture tradeoffs, benchmark throughput, codebase reviews, protocol specs, and implementation risks.',
      icon: Layers,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400'
    },
    {
      id: 'MARKET_INTEL',
      label: 'Market & Competitive Intelligence',
      desc: 'Competitor benchmarking matrices, pricing shifts, market sizing, strategic partnerships, and SWOT profiles.',
      icon: Globe,
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400'
    },
    {
      id: 'REGULATORY',
      label: 'Regulatory & Compliance Radar',
      desc: 'Statutory changes, jurisdiction filings, legal liability disclosures, and compliance audit frameworks.',
      icon: ShieldCheck,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Wizard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Pipeline Builder</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Configure Research Pipeline
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Define research objectives, crawling parameters, analytical depth, and dispatch preferences.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Load Preset:</span>
          <button
            onClick={() => handleLoadSample('solid-state')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
          >
            Solid-State
          </button>
          <button
            onClick={() => handleLoadSample('agents')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
          >
            AI Agents
          </button>
          <button
            onClick={() => handleLoadSample('regulatory')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
          >
            EU AI Act
          </button>
        </div>
      </div>

      {/* Stepped Progress Tabs */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {[
          { step: 1, label: 'Objectives', icon: Compass },
          { step: 2, label: 'Sources', icon: Globe },
          { step: 3, label: 'Styling', icon: Palette },
          { step: 4, label: 'Dispatch', icon: Mail }
        ].map(item => {
          const Icon = item.icon;
          const isDone = currentStep > item.step;
          const isCurrent = currentStep === item.step;

          return (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                isCurrent
                  ? 'bg-slate-900 border-sky-500/80 shadow-lg shadow-sky-950/30'
                  : isDone
                  ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-sky-500 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : item.step}
              </div>
              <div className="hidden sm:block">
                <div className="text-[10px] uppercase font-bold text-slate-500">Step {item.step}</div>
                <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                  {item.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Step Content Container */}
      <div className="glass-panel p-6 md:p-8 space-y-6">
        {/* =================================================================== */}
        {/* STEP 1: TOPIC & OBJECTIVES */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Research Pipeline Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Solid-State Battery Commercialization Q1 2026"
                className="input-field"
                maxLength={120}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Human-readable label for dashboard indexing (3 to 120 characters).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Core Research Hypothesis or Prompt:
              </label>
              <textarea
                rows={4}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Describe your fundamental inquiry in detail: key questions, target commercial horizons, technological bottlenecks, or competitor scope..."
                className="input-field resize-none text-xs"
                maxLength={1000}
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>The Gemini 2.5 Flash query planner will deconstruct this topic into orthogonal search queries.</span>
                <span>{topic.length}/1000 chars</span>
              </div>
            </div>

            {/* Research Category Archetypes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Research Archetype & Prompt Strategy:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATEGORY_CARDS.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setCategory(cat.id as ResearchCategory)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? `bg-slate-900 border-2 ${cat.color} shadow-lg shadow-sky-950/20`
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-bold text-xs text-white">{cat.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{cat.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Depth Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Analytical Depth & Scope:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'BRIEF', label: 'Brief', words: '~500 words', desc: 'Fast, high-impact bulleted summary' },
                  { id: 'STANDARD', label: 'Standard', words: '~1200 words', desc: 'Comprehensive executive briefing' },
                  { id: 'COMPREHENSIVE', label: 'Comprehensive', words: '~2500 words', desc: 'Deep-dive architectural report' }
                ].map(depth => (
                  <div
                    key={depth.id}
                    onClick={() => setDepthLevel(depth.id as DepthLevel)}
                    className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                      depthLevel === depth.id
                        ? 'bg-sky-500/10 border-2 border-sky-400 text-sky-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{depth.label}</div>
                    <div className="text-[11px] font-mono text-sky-400 mt-0.5">{depth.words}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{depth.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: SOURCE SELECTION & EXTRACTION */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Explicit User-Directed Queries (Optional):
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={e => setQueryInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddQuery())}
                  placeholder="e.g. QuantumScape Volkswagen PowerCo validation data"
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={handleAddQuery}
                  className="btn-secondary text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Query</span>
                </button>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-2 min-h-8">
                {customQueries.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic">
                    No custom queries added. The planner will autonomously formulate 3–5 vectors.
                  </span>
                ) : (
                  customQueries.map(q => (
                    <span
                      key={q}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs"
                    >
                      <span>{q}</span>
                      <button
                        onClick={() => handleRemoveQuery(q)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Excluded Domains from Web Ingestion:
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                  placeholder="e.g. reddit.com, pinterest.com, facebook.com"
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="btn-secondary text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Exclude Domain</span>
                </button>
              </div>

              {/* Excluded Domains Pills */}
              <div className="flex flex-wrap gap-2">
                {excludedDomains.map(d => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono"
                  >
                    <span>{d}</span>
                    <button
                      onClick={() => handleRemoveDomain(d)}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                SSRF-Safe Web Extraction Guardrails Active
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The crawler enforces strict SSRF rejection of private/local IP addresses (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, cloud metadata), enforces an 8-second request timeout, caps responses at 2MB per page, and extracts clean semantic body text using Cheerio.
              </p>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: OUTPUT & STYLING */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Report Layout Template:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Executive Brief', desc: 'Clean, authoritative layout tailored for c-level decision makers with high-contrast bulleted takeaways.' },
                  { name: 'Technical Deep-Dive', desc: 'Structured comparative tables, code snippets, architectural trade-offs, and throughput metrics.' },
                  { name: 'Competitive Matrix', desc: 'Focuses on competitor comparison grids, pricing breakdowns, and market positioning.' },
                  { name: 'Regulatory & Compliance Sentinel', desc: 'Statutory citations, compliance checklists, and jurisdiction-specific legal notes.' }
                ].map(tmpl => (
                  <div
                    key={tmpl.name}
                    onClick={() => setStylingTemplate(tmpl.name)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      stylingTemplate === tmpl.name
                        ? 'bg-sky-500/10 border-2 border-sky-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white mb-1">{tmpl.name}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">{tmpl.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Brand Header Accent Color:
              </label>
              <div className="flex items-center gap-3">
                {[
                  { color: '#0284c7', name: 'Sky Blue' },
                  { color: '#10b981', name: 'Emerald' },
                  { color: '#8b5cf6', name: 'Purple' },
                  { color: '#f59e0b', name: 'Amber' },
                  { color: '#ef4444', name: 'Rose' }
                ].map(c => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setAccentColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-9 h-9 rounded-xl transition-transform flex items-center justify-center ${
                      accentColor === c.color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.name}
                  >
                    {accentColor === c.color && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
                <span className="text-xs font-mono text-slate-400 ml-2">{accentColor}</span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 4: DISPATCH CONFIGURATION */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Recipient Email Addresses:
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={recipientInput}
                  onChange={e => setRecipientInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
                  placeholder="analyst@enterprise.com"
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="btn-secondary text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Recipient</span>
                </button>
              </div>

              {/* Recipient Pills */}
              <div className="flex flex-wrap gap-2">
                {recipients.map(r => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sky-300 text-xs font-mono"
                  >
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{r}</span>
                    <button
                      onClick={() => handleRemoveRecipient(r)}
                      className="hover:text-rose-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Approval Gate Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-4">
              <input
                type="checkbox"
                id="requireApprovalToggle"
                checked={requireApproval}
                onChange={e => setRequireApproval(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
              />
              <div>
                <label htmlFor="requireApprovalToggle" className="font-bold text-sm text-slate-200 cursor-pointer">
                  Require Manual Human Sign-Off Before Sending (HITL Gate)
                </label>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  When enabled, the pipeline automatically pauses at Stage 4 (CRITIQUE_REVISE). You can inspect the synthesized draft, edit text directly in the browser, review the inlined HTML preview, and click "Approve & Send".
                </p>
              </div>
            </div>

            {/* Immediate vs Scheduled Execution */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-4">
              <input
                type="checkbox"
                id="immediateExecutionToggle"
                checked={immediateExecution}
                onChange={e => setImmediateExecution(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
              />
              <div>
                <label htmlFor="immediateExecutionToggle" className="font-bold text-sm text-slate-200 cursor-pointer">
                  Execute Immediately Upon Creation
                </label>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Immediately claims the workflow into the FSM orchestrator and streams real-time execution telemetry to your browser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="btn-secondary text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
              className="btn-primary text-xs"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-500/20 text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Initializing Engine...' : 'Launch Research Pipeline'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
