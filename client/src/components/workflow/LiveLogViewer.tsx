import React, { useState, useEffect, useRef } from 'react';
import { WorkflowLog } from '@shared/index';
import {
  Terminal,
  Copy,
  Check,
  Search,
  Filter,
  ArrowDownCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface LiveLogViewerProps {
  logs?: WorkflowLog[];
  isStreaming?: boolean;
}

export const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ logs = [], isStreaming = false }) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'ALL' || log.log_level === filterLevel;
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.step_type && log.step_type.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs
      .map(
        l =>
          `[${new Date(l.created_at).toLocaleTimeString()}] [${l.log_level}] ${
            l.step_type ? `[${l.step_type}] ` : ''
          }${l.message}`
      )
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[520px] rounded-2xl bg-slate-950 border border-slate-800/80 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>

          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200">Execution Telemetry Feed</span>

          {isStreaming && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              SSE STREAMING
            </span>
          )}
        </div>

        {/* Filter Controls & Search */}
        <div className="flex items-center gap-2">
          {/* Level Filter Tabs */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterLevel === lvl
                    ? 'bg-slate-800 text-sky-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="pl-7 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-[11px] w-28 md:w-36"
            />
          </div>

          {/* Auto-scroll button */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border transition-colors ${
              autoScroll
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={autoScroll ? 'Auto-scroll Enabled' : 'Auto-scroll Paused'}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 text-[11px] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 selection:bg-sky-900 selection:text-white">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <Clock className="w-8 h-8 text-slate-700 animate-pulse" />
            <p>Awaiting pipeline execution events...</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const time = new Date(log.created_at).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const levelColor = {
              INFO: 'text-sky-400 bg-sky-950/30 border-sky-800/40',
              WARN: 'text-amber-300 bg-amber-950/30 border-amber-800/40',
              ERROR: 'text-rose-400 bg-rose-950/30 border-rose-800/40',
              DEBUG: 'text-slate-400 bg-slate-900 border-slate-800'
            }[log.log_level] || 'text-slate-400';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/40 p-1 rounded-md transition-colors"
              >
                {/* Timestamp */}
                <span className="text-slate-600 select-none shrink-0 text-[11px]">{time}</span>

                {/* Level Tag */}
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border ${levelColor}`}
                >
                  {log.log_level}
                </span>

                {/* Step Tag */}
                {log.step_type && (
                  <span className="text-indigo-400 text-[11px] shrink-0 font-semibold">
                    [{log.step_type}]
                  </span>
                )}

                {/* Structured Message & Metadata */}
                <div className="flex-1 space-y-1">
                  <span className="text-slate-300 break-all">{log.message}</span>

                  {/* Structured Metadata Rendering */}
                  {log.metadata && (
                    <div className="pt-1">
                      {/* Search Queries List */}
                      {log.metadata.queries && Array.isArray(log.metadata.queries) && (
                        <div className="space-y-1 mt-1 bg-slate-900/80 p-2.5 rounded-xl border border-sky-500/20 max-w-2xl">
                          <div className="text-[10px] font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            <span>Formulated Search Angles ({log.metadata.queries.length})</span>
                          </div>
                          <div className="space-y-1 pt-0.5">
                            {log.metadata.queries.map((q: string, idx: number) => (
                              <div
                                key={idx}
                                className="text-[11px] text-slate-300 font-mono pl-2 border-l-2 border-sky-500/50 py-0.5"
                              >
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scrape Stats Badge */}
                      {log.metadata.totalTokens !== undefined && (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium mt-1">
                          <span>Verified {log.metadata.count || 4} Authoritative Sources</span>
                          <span>•</span>
                          <span className="font-mono text-indigo-200">~{Math.round(log.metadata.totalTokens / 1000)}k tokens ingested</span>
                        </div>
                      )}

                      {/* Critique Score & Editorial Notes */}
                      {log.metadata.score !== undefined && (
                        <div className="space-y-1.5 mt-1 bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/20 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 text-[10px]">
                              Grounding Score: {log.metadata.score}/100
                            </span>
                            <span className="text-[11px] text-slate-400">Autonomous Critique Agent Verified</span>
                          </div>
                          {log.metadata.notes && Array.isArray(log.metadata.notes) && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {log.metadata.notes.map((note: string, nIdx: number) => (
                                <span
                                  key={nIdx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1"
                                >
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>{note}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Bar */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <div>
          Total Logs: <span className="text-slate-300 font-bold">{logs.length}</span>
          {filterLevel !== 'ALL' && (
            <span className="ml-2">
              (Filtered: <span className="text-sky-400">{filteredLogs.length}</span>)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Encoding: UTF-8</span>
          <span>Protocol: SSE Real-time</span>
        </div>
      </div>
    </div>
  );
};
