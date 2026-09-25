import React, { useState } from 'react';
import { WorkflowSource } from '@shared/index';
import { Globe, ExternalLink, FileText, CheckCircle2, AlertCircle, X, Hash } from 'lucide-react';

interface SourcesGridProps {
  sources?: WorkflowSource[];
}

export const SourcesGrid: React.FC<SourcesGridProps> = ({ sources = [] }) => {
  const [selectedSource, setSelectedSource] = useState<WorkflowSource | null>(null);

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          Ingested Target Documents ({sources.length})
        </span>
        <span>SSRF Sanitized & Stripped</span>
      </div>

      {sources.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500">
          <Globe className="w-10 h-10 mx-auto mb-2 text-slate-700 animate-pulse" />
          <p className="text-sm">Web crawling in progress. Ingested sources will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sources.map(source => {
            const domain = getDomain(source.url);
            const isSuccess = source.status === 'FETCHED' || (source.http_status_code && source.http_status_code >= 200 && source.http_status_code < 300);

            return (
              <div
                key={source.id}
                onClick={() => setSelectedSource(source)}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{domain}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {source.http_status_code || 200} OK
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-sky-300 transition-colors line-clamp-2 mb-1.5">
                    {source.title || source.url}
                  </h4>

                  {/* Snippet */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
                    {source.snippet || 'No snippet preview available.'}
                  </p>
                </div>

                {/* Bottom Footer Info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-600" />
                    ~{source.tokens_estimate?.toLocaleString() || 1200} tokens
                  </span>

                  <span className="text-sky-400 flex items-center gap-1 group-hover:underline">
                    Inspect Clean Text
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Extracted Content Modal */}
      {selectedSource && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex-1 pr-4">
                <div className="text-xs text-sky-400 font-mono mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{selectedSource.url}</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 line-clamp-1">
                  {selectedSource.title || selectedSource.url}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedSource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Open live URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 font-sans text-sm text-slate-300 leading-relaxed selection:bg-sky-500 selection:text-white">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>HTTP Status: {selectedSource.http_status_code || 200}</span>
                <span>Tokens Extracted: ~{selectedSource.tokens_estimate || 1200}</span>
                <span>Status: {selectedSource.status}</span>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Clean Extracted Text (Noise Stripped):
                </h5>
                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                  {selectedSource.extracted_text || selectedSource.snippet || 'No text extracted.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
