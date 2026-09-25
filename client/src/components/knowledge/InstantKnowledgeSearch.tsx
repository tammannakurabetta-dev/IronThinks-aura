import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Copy,
  Check,
  Globe,
  Tag,
  Loader2,
  X,
  Layers,
  CheckCircle2,
  Cpu,
  Atom,
  Dna,
  Zap,
  Info,
  Compass,
  FileText
} from 'lucide-react';
import { workflowApi } from '../../api/workflowClient';
import { KnowledgeEntity } from '@shared/index';

const SAMPLE_ENTITIES = [
  'CRISPR',
  'Albert Einstein',
  'Quantum Computing',
  'NVIDIA',
  'Solid-State Battery',
  'Photosynthesis',
  'Black Hole',
  'James Webb Space Telescope'
];

interface InstantKnowledgeSearchProps {
  onWorkflowLaunched?: (workflowId: string) => void;
  className?: string;
}

type TabType = 'overview' | 'facts' | 'applications' | 'source';

export const InstantKnowledgeSearch: React.FC<InstantKnowledgeSearchProps> = ({
  onWorkflowLaunched,
  className = ''
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [entity, setEntity] = useState<KnowledgeEntity | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (termToSearch?: string) => {
    const query = (termToSearch || searchTerm).trim();
    if (!query) return;

    setIsSearching(true);
    setErrorMsg(null);
    try {
      const result = await workflowApi.searchKnowledge(query);
      if (result) {
        setEntity(result);
        setActiveTab('overview');
        if (termToSearch) setSearchTerm(termToSearch);
      } else {
        setErrorMsg(`No encyclopedic record found for "${query}". Please check the spelling or try another topic.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to query knowledge tools.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleLaunchDeepResearch = async () => {
    if (!entity) return;
    setIsLaunching(true);
    try {
      const created = await workflowApi.createWorkflow({
        title: `${entity.title}: Executive Intelligence Briefing`,
        topic: `${entity.title} - Strategic Analysis, Benchmarks, and Future Trajectory`,
        category: 'EXECUTIVE_SCAN',
        depthLevel: 'STANDARD',
        recipients: ['exec-intel@researchflow.ai'],
        requireApproval: true,
        immediateExecution: true,
        stylingTemplate: 'Executive Brief',
        accentColor: '#0284c7'
      });

      if (onWorkflowLaunched) {
        onWorkflowLaunched(created.id);
      } else {
        navigate(`/workflows/${created.id}`);
      }
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleCopyStructuredDossier = () => {
    if (!entity) return;

    let text = `# ${entity.title}\n`;
    if (entity.category) text += `*Domain: ${entity.category}*\n`;
    if (entity.description) text += `*Classification: ${entity.description}*\n\n`;

    text += `## Executive Synopsis\n${entity.synopsis || entity.extract}\n\n`;

    if (entity.keyTakeaways && entity.keyTakeaways.length > 0) {
      text += `## Key Takeaways\n`;
      entity.keyTakeaways.forEach(k => {
        text += `* **${k.label}**: ${k.text}\n`;
      });
      text += `\n`;
    }

    if (entity.quickFacts && entity.quickFacts.length > 0) {
      text += `## Quick Facts & Specifications\n`;
      entity.quickFacts.forEach(f => {
        text += `* **${f.label}**: ${f.value}\n`;
      });
      text += `\n`;
    }

    if (entity.applications && entity.applications.length > 0) {
      text += `## Real-World Applications\n`;
      entity.applications.forEach(a => {
        text += `* ${a}\n`;
      });
      text += `\n`;
    }

    text += `Verified Source: ${entity.sourceUrl}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper icon selector based on domain
  const getDomainIcon = (cat?: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('bio') || c.includes('life')) return <Dna className="w-3.5 h-3.5 text-emerald-400" />;
    if (c.includes('physic') || c.includes('astro')) return <Atom className="w-3.5 h-3.5 text-purple-400" />;
    if (c.includes('hardware') || c.includes('semiconductor')) return <Cpu className="w-3.5 h-3.5 text-amber-400" />;
    if (c.includes('ai') || c.includes('computer')) return <Zap className="w-3.5 h-3.5 text-sky-400" />;
    return <Sparkles className="w-3.5 h-3.5 text-sky-400" />;
  };

  return (
    <div className={`p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/40 border border-sky-500/25 shadow-2xl relative overflow-hidden transition-all ${className}`}>
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-inner">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Universal Entity Knowledge Hub</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                WIKIPEDIA & KNOWLEDGE TOOLS CONNECTED
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Insert any person, company, technology, or scientific concept to instantly receive a structured intelligence dossier.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative z-10 mb-4">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search any name or topic (e.g. CRISPR, Albert Einstein, Solid-State Battery, NVIDIA)..."
            className="w-full pl-11 pr-32 py-3.5 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setEntity(null);
                setErrorMsg(null);
              }}
              className="absolute right-28 p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSearching || !searchTerm.trim()}
            className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lookup</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Suggestion Pills */}
      <div className="flex flex-wrap items-center gap-2 relative z-10 text-xs mb-3">
        <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span>Quick Lookup:</span>
        </span>
        {SAMPLE_ENTITIES.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => handleSearch(item)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-all active:scale-95 hover:border-sky-500/40"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Loading Skeleton Simulation */}
      {isSearching && (
        <div className="mt-5 p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-2xl relative z-10 animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-32 h-4 rounded-full bg-slate-800" />
              <div className="w-48 h-6 rounded-lg bg-slate-800" />
              <div className="w-full max-w-md h-3.5 rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-16 rounded-xl bg-slate-850/80 border border-slate-800 p-3" />
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <div className="w-full h-12 rounded-xl bg-slate-800/40" />
            <div className="w-full h-12 rounded-xl bg-slate-800/40" />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STRUCTURED ENTITY DOSSIER CARD */}
      {entity && !isSearching && (
        <div className="mt-5 p-6 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl relative z-10 animate-in fade-in slide-in-from-top-3 duration-300 space-y-6">
          
          {/* Top Hero Section */}
          <div className="flex flex-col sm:flex-row gap-5 items-start justify-between border-b border-slate-800/80 pb-5">
            <div className="flex items-start gap-4">
              {/* Thumbnail Image or Fallback Avatar */}
              {entity.thumbnailUrl ? (
                <div className="shrink-0 relative group">
                  <img
                    src={entity.thumbnailUrl}
                    alt={entity.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-slate-700/80 shadow-lg bg-slate-900 group-hover:scale-105 transition-transform duration-200"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0 shadow-md">
                  <Compass className="w-8 h-8" />
                </div>
              )}

              {/* Title & Core Metadata */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
                    {getDomainIcon(entity.category)}
                    <span>{entity.category || 'General Science & Knowledge'}</span>
                  </span>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-sky-400" />
                    <span>{entity.source === 'wikipedia' ? 'Wikipedia REST API' : 'Knowledge Graph'}</span>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                  {entity.title}
                </h3>

                {entity.description && (
                  <p className="text-xs sm:text-sm text-sky-300 font-medium">
                    {entity.description}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
              <button
                onClick={handleCopyStructuredDossier}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Copy structured briefing as markdown"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied Dossier!' : 'Copy Dossier'}</span>
              </button>

              <a
                href={entity.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Open official encyclopedic entry"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>Wikipedia</span>
              </a>

              <button
                onClick={() => setEntity(null)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center border-b border-slate-800/80 gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'overview'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Structured Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('facts')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'facts'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Key Facts & Specs ({entity.quickFacts?.length || 4})</span>
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'applications'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Real-World Applications</span>
            </button>

            <button
              onClick={() => setActiveTab('source')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'source'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Source Extract</span>
            </button>
          </div>

          {/* TAB 1: STRUCTURED OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Executive Synopsis Callout */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-500/20 shadow-md">
                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Executive Synopsis</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {entity.synopsis || entity.extract}
                </p>
              </div>

              {/* Key Takeaways Section */}
              {entity.keyTakeaways && entity.keyTakeaways.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Structured Key Takeaways</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {entity.keyTakeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/30 transition-all flex items-start gap-3 shadow-sm group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                            {takeaway.label}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {takeaway.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Global Significance Callout */}
              {entity.significance && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 text-xs text-indigo-200 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white mr-1.5">Strategic Impact:</span>
                    <span>{entity.significance}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KEY FACTS & SPECS */}
          {activeTab === 'facts' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {entity.quickFacts && entity.quickFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {fact.label}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {fact.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REAL-WORLD APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <p className="text-xs text-slate-400">
                Core commercial, scientific, and strategic operational vectors associated with <strong className="text-white">{entity.title}</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entity.applications && entity.applications.map((app, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{app}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FULL SOURCE EXTRACT */}
          {activeTab === 'source' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-64 overflow-y-auto">
                {entity.extract}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Verified Wikipedia REST API Snapshot</span>
                <a
                  href={entity.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Read full Wikipedia article</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Related Topics Exploration Bar */}
          {entity.relatedTopics && entity.relatedTopics.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                <Compass className="w-3 h-3 text-sky-400" />
                <span>Related Subjects:</span>
              </span>
              {entity.relatedTopics.map((rel, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSearch(rel.title)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 transition-all hover:border-sky-500/30 active:scale-95 flex items-center gap-1"
                >
                  <span>{rel.title}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {/* Persistent Action Footer: Deep Research Pipeline Trigger */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900/80 to-sky-950/30 -mx-6 -mb-6 p-5 rounded-b-2xl">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-xs font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compile Autonomous Executive Intelligence Briefing</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Run the 6-stage web scraping, Gemini 2.5 synthesis, fact-critique, and responsive email compiler on <strong className="text-slate-200">{entity.title}</strong>.
              </p>
            </div>

            <button
              onClick={handleLaunchDeepResearch}
              disabled={isLaunching}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Launching Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Full Research Briefing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
