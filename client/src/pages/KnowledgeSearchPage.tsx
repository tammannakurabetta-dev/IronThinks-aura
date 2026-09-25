import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Dna,
  Atom,
  Cpu,
  Zap,
  BatteryCharging,
  Globe2
} from 'lucide-react';
import { InstantKnowledgeSearch } from '../components/knowledge/InstantKnowledgeSearch';

const CURATED_CATEGORIES = [
  {
    name: 'Biotechnology & Genomics',
    icon: Dna,
    color: 'emerald',
    samples: ['CRISPR', 'Photosynthesis', 'mRNA Vaccine', 'Human Genome Project']
  },
  {
    name: 'Physics & Astrophysics',
    icon: Atom,
    color: 'purple',
    samples: ['Albert Einstein', 'Quantum Computing', 'Black Hole', 'James Webb Space Telescope']
  },
  {
    name: 'AI & Advanced Hardware',
    icon: Cpu,
    color: 'sky',
    samples: ['NVIDIA', 'Artificial Neural Network', 'Silicon Photonics', 'Transformer (machine learning model)']
  },
  {
    name: 'Clean Energy & Materials',
    icon: BatteryCharging,
    color: 'amber',
    samples: ['Solid-State Battery', 'Perovskite Solar Cell', 'Nuclear Fusion', 'Graphene']
  }
];

export const KnowledgeSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Structured Intelligence Explorer</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Universal <span className="gradient-title">Knowledge Engine</span>
          </h1>

          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Search for any person, company, scientific mechanism, or global event. ResearchFlow transforms raw encyclopedic data into structured executive dossiers with key takeaways, quick specs, and 1-click autonomous research pipeline triggers.
          </p>
        </div>
      </div>

      {/* Main Search Component */}
      <InstantKnowledgeSearch />

      {/* Curated Exploration Matrix */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Explore Curated Scientific & Strategic Domains
            </h3>
          </div>
          <span className="text-xs text-slate-500">Instant encyclopedic indexing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {CURATED_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/30 transition-all space-y-3 group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-sky-500/20 text-sky-400 border border-slate-700/80 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                    {cat.name}
                  </h4>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cat.samples.map(sample => (
                    <button
                      key={sample}
                      onClick={() => {
                        // Scroll to top and trigger search
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (input) {
                          input.value = sample;
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          const form = input.closest('form');
                          if (form) form.requestSubmit();
                        }
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>{sample}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
