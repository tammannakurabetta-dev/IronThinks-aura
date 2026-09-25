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
  X
} from 'lucide-react';
import { workflowApi } from '../../api/workflowClient';
import { KnowledgeEntity } from '@shared/index';

const SAMPLE_ENTITIES = [
  'CRISPR',
  'Albert Einstein',
  'Quantum Computing',
  'NVIDIA',
  'Solid-State Battery',
  'Photosynthesis'
];

interface InstantKnowledgeSearchProps {
  onWorkflowLaunched?: (workflowId: string) => void;
  className?: string;
}

export const InstantKnowledgeSearch: React.FC<InstantKnowledgeSearchProps> = ({
  onWorkflowLaunched,
  className = ''
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [entity, setEntity] = useState<KnowledgeEntity | null>(null);
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
        if (termToSearch) setSearchTerm(termToSearch);
      } else {
        setErrorMsg(`No encyclopedic record found for "${query}".`);
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
        title: `${entity.title}: In-Depth Intelligence Briefing`,
        topic: entity.extract.length > 80 ? entity.extract.slice(0, 300) : `${entity.title} - ${entity.description || 'Comprehensive intelligence briefing and analysis.'}`,
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

  const handleCopySummary = () => {
    if (!entity) return;
    const text = `${entity.title}\n${entity.description ? `(${entity.description})\n\n` : '\n'}${entity.extract}\n\nSource: ${entity.sourceUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 border border-sky-500/20 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Universal Entity Knowledge Hub</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                WIKIPEDIA & KNOWLEDGE TOOLS CONNECTED
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Insert any name or concept to instantly fetch verified information from Wikipedia and web tools.
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
            placeholder="Insert any name or topic (e.g. CRISPR, Albert Einstein, Solid-State Battery, NVIDIA)..."
            className="w-full pl-11 pr-28 py-3 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner"
          />
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
      <div className="flex flex-wrap items-center gap-2 relative z-10 text-xs">
        <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span>Quick Lookup:</span>
        </span>
        {SAMPLE_ENTITIES.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => handleSearch(item)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-all active:scale-95"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Entity Knowledge Card */}
      {entity && (
        <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl relative z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Thumbnail Image */}
            {entity.thumbnailUrl && (
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={entity.thumbnailUrl}
                  alt={entity.title}
                  className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border border-slate-700 shadow-md bg-slate-900"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Entity Content */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">
                      {entity.title}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 font-bold uppercase tracking-wider border border-sky-500/30">
                      {entity.source === 'wikipedia' ? 'Wikipedia Verified' : 'Knowledge Graph'}
                    </span>
                  </div>
                  {entity.description && (
                    <p className="text-xs text-sky-400 font-medium mt-0.5">
                      {entity.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopySummary}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors flex items-center gap-1"
                    title="Copy Summary"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <a
                    href={entity.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors flex items-center gap-1"
                    title="View on Wikipedia"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[11px]">Source</span>
                  </a>

                  <button
                    onClick={() => setEntity(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Extract Paragraph */}
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
                {entity.extract}
              </p>

              {/* Related Topics Pills */}
              {entity.relatedTopics && entity.relatedTopics.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold mr-1">Related:</span>
                  {entity.relatedTopics.map((rel, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(rel.title)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-800 transition-colors"
                    >
                      {rel.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Button: Deep Research Workflow Trigger */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  Ready to compile an executive briefing on <strong className="text-slate-200">{entity.title}</strong>?
                </span>

                <button
                  onClick={handleLaunchDeepResearch}
                  disabled={isLaunching}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLaunching ? 'Launching Pipeline...' : 'Generate Full Research Briefing'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
