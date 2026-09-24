import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { RiskBadge } from '../components/common/RiskBadge';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  ArrowUpRight, 
  Sprout, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADVISORY_DOMAINS, RISK_LEVELS } from '@shared/constants';

export const History: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const { data: advisories = [], isLoading } = useQuery({
    queryKey: ['advisories'],
    queryFn: () => api.getAllAdvisories(),
  });

  const filteredAdvisories = advisories.filter((adv) => {
    const matchesSearch = 
      adv.executive_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.input_parameters?.cropType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = domainFilter === 'ALL' || adv.domain === domainFilter;
    const matchesRisk = riskFilter === 'ALL' || adv.overall_risk_level === riskFilter;

    return matchesSearch && matchesDomain && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Time-Series Audit Log</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 font-display">Historical Advisories</h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit trail of past agronomic diagnoses, fertilizer adjustments, and soil recovery trends.
          </p>
        </div>

        <Link to="/advisory/new" className="btn-primary text-xs sm:text-sm">
          <Sprout className="w-4 h-4" />
          <span>New Advisory Run</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by crop, summary or diagnosed pathogen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="select-field text-xs py-2 w-auto"
          >
            <option value="ALL">All Domains</option>
            {ADVISORY_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="select-field text-xs py-2 w-auto"
          >
            <option value="ALL">All Risk Levels</option>
            {RISK_LEVELS.map((level) => (
              <option key={level} value={level}>{level} RISK</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advisories Table / Timeline List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading records...</div>
        ) : filteredAdvisories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No historical advisories match your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredAdvisories.map((adv) => (
              <div
                key={adv.id}
                className="p-5 hover:bg-slate-900/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <RiskBadge level={adv.overall_risk_level} size="sm" />
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {adv.domain.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(adv.created_at).toLocaleDateString()} at {new Date(adv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {adv.input_parameters?.cropType || 'Crop'} Evaluation: {adv.executive_summary}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>Stage: <strong className="text-slate-300">{adv.input_parameters?.growthStage}</strong></span>
                    <span>Confidence: <strong className="text-emerald-400">{adv.confidence_score}%</strong></span>
                    <span>Soil: <strong className="text-slate-300">{adv.input_parameters?.soilType}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={`/advisory/${adv.id}`}
                    className="btn-secondary text-xs py-2 px-3 group-hover:border-emerald-500/40 group-hover:text-emerald-300"
                  >
                    <span>View Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
