import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { 
  Sprout, 
  MapPin, 
  AlertTriangle, 
  Droplets, 
  Sun, 
  Wind, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: advisories = [], isLoading: loadingAdvisories } = useQuery({
    queryKey: ['advisories'],
    queryFn: () => api.getAllAdvisories(),
  });

  const { data: plots = [], isLoading: loadingPlots } = useQuery({
    queryKey: ['plots'],
    queryFn: () => api.getPlots(),
  });

  // Calculate high-level farm KPIs
  const totalAcreage = plots.reduce((sum, p) => sum + Number(p.acreage || 0), 0);
  const criticalOrHighCount = advisories.filter(
    (a) => a.overall_risk_level === 'CRITICAL' || a.overall_risk_level === 'HIGH'
  ).length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Farm Intelligence System Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight font-display">
            Welcome back, <span className="gradient-heading">{user?.fullName || 'Dr. Vance'}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous microclimate & agronomic monitoring across <strong className="text-slate-200">Verdant Valley Bio-Farm</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/advisory/new"
            className="btn-primary py-2.5 px-4 shadow-emerald-900/40"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>New Advisory Intake</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Land"
          value={`${totalAcreage.toFixed(1)} ac`}
          subtitle="Across 3 productive plots"
          icon={MapPin}
          trend={{ value: '100% mapped', positive: true }}
          color="emerald"
        />
        <StatCard
          title="Active Crop Plots"
          value={plots.length}
          subtitle="Wheat, Tomato, Corn"
          icon={Sprout}
          color="blue"
        />
        <StatCard
          title="Agronomic Risk Level"
          value={criticalOrHighCount > 0 ? `${criticalOrHighCount} Elevated` : 'Low Risk'}
          subtitle="Real-time pathogen & deficit index"
          icon={AlertTriangle}
          trend={{ value: '1 moderate issue', positive: false }}
          color={criticalOrHighCount > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Irrigation Budget"
          value="28.5 mm"
          subtitle="Weekly evapotranspiration"
          icon={Droplets}
          trend={{ value: 'Optimal schedule', positive: true }}
          color="purple"
        />
      </div>

      {/* Weather & Microclimate Widget Banner */}
      <div className="glass-card p-5 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
              <Sun className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-100 font-display">22.5°C</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ideal Growing Window
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                California Central Valley | High solar radiation, 65% RH, 18mm rainfall past 7 days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-xs text-slate-300 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <span className="text-slate-400 block text-[11px]">Humidity</span>
              <span className="font-bold text-slate-200 text-sm">65% RH</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Wind Velocity</span>
              <span className="font-bold text-slate-200 text-sm">11 km/h NW</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Soil Moisture</span>
              <span className="font-bold text-emerald-400 text-sm">74% Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Plots Directory & Recent AI Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Plots (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-display">Active Crop Plots</h2>
              <p className="text-xs text-slate-400">Current growth stages and subsurface health</p>
            </div>
            <Link
              to="/plots"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Plots</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plots.map((plot) => (
              <div
                key={plot.id}
                className="glass-card glass-card-hover p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {plot.soil_type}
                      </span>
                      <h3 className="font-bold text-slate-100 text-base mt-2">{plot.plot_name}</h3>
                      <p className="text-xs text-emerald-400 font-medium">{plot.current_crop || 'Fallow'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-200">{plot.acreage} ac</span>
                      <p className="text-[10px] text-slate-400">Area</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Irrigation:</span>
                      <span className="text-slate-200 font-medium">{plot.irrigation_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sowing Date:</span>
                      <span className="text-slate-200 font-medium">{plot.sowing_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    to={`/advisory/new?plotId=${plot.id}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>Run AI Diagnostics</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent AI Advisories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-display">Recent Advisories</h2>
              <p className="text-xs text-slate-400">Latest Gemini 2.5 recommendations</p>
            </div>
            <Link
              to="/history"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Archive</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {advisories.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-400 text-xs">
                No advisories generated yet. Click "New Advisory Intake" to start.
              </div>
            ) : (
              advisories.slice(0, 4).map((adv) => (
                <Link
                  key={adv.id}
                  to={`/advisory/${adv.id}`}
                  className="glass-card glass-card-hover p-4 block group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <RiskBadge level={adv.overall_risk_level} size="sm" />
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(adv.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 line-clamp-2 transition-colors">
                    {adv.executive_summary}
                  </h4>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="capitalize">{adv.domain.toLowerCase().replace(/_/g, ' ')}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      {adv.confidence_score}% Confidence
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
