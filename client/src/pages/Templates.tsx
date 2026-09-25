import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Plus,
  Compass,
  Layers,
  Globe,
  ShieldCheck,
  Palette,
  Check,
  ArrowRight,
  Code
} from 'lucide-react';
import { workflowApi } from '../api/workflowClient';
import { WorkflowTemplate } from '@shared/index';

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const list = await workflowApi.getTemplates();
        setTemplates(list);
        if (list.length > 0) setSelectedTemplate(list[0]);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'TECH_FEASIBILITY':
        return <Layers className="w-5 h-5 text-emerald-400" />;
      case 'MARKET_INTEL':
        return <Globe className="w-5 h-5 text-purple-400" />;
      case 'REGULATORY':
        return <ShieldCheck className="w-5 h-5 text-amber-400" />;
      default:
        return <Compass className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Report Architectures</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Report & Prompt Templates
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage executive briefing layout structures, AI prompt engineering overrides, and styling tokens.
          </p>
        </div>

        <button
          onClick={() => navigate('/workflows/new')}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Launch With Template</span>
        </button>
      </div>

      {/* Main Grid: Template Cards + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Template Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tmpl => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              const accent = tmpl.styling_config?.accentColor || '#0284c7';

              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-2 border-sky-400 shadow-xl shadow-sky-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        {getCategoryIcon(tmpl.category)}
                      </div>

                      <div className="flex items-center gap-2">
                        {tmpl.is_default && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            DEFAULT
                          </span>
                        )}
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: accent }}
                        />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 mb-1.5">
                      {tmpl.name}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-500">
                      {tmpl.category.replace('_', ' ')}
                    </span>
                    <span className="text-sky-400 font-medium flex items-center gap-1 group-hover:underline">
                      Inspect Rules <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Template Inspector */}
        <div className="glass-panel p-6 space-y-5 flex flex-col justify-between">
          {selectedTemplate ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-slate-200">
                  {selectedTemplate.name} Specifications
                </h3>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Domain Category:
                </span>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 font-mono text-xs">
                  {selectedTemplate.category}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  AI Prompt Engineering Mandate:
                </span>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                  {selectedTemplate.prompt_override || 'Standard rigorous objectivity and structured citation verification.'}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Styling Configuration:
                </span>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                  {JSON.stringify(selectedTemplate.styling_config || {}, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => navigate('/workflows/new')}
                className="btn-primary w-full text-xs mt-4"
              >
                <span>Use Template for Research Run</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select a template to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
