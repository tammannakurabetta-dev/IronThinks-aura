import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { RiskBadge } from '../components/common/RiskBadge';
import { NPKGaugeChart } from '../components/charts/NPKGaugeChart';
import { MoistureTimeline } from '../components/charts/MoistureTimeline';
import { ActionItemTracker } from '../components/common/ActionItemTracker';
import { AdvisoryPdfExportButton } from '../components/common/AdvisoryPdfExportButton';
import { 
  ArrowLeft, 
  Sprout, 
  ShieldCheck, 
  Bug, 
  Droplets, 
  Calendar, 
  AlertTriangle, 
  FlaskConical, 
  FileCheck, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  Activity,
  Trees
} from 'lucide-react';

export const AdvisoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: advisory, isLoading, isError } = useQuery({
    queryKey: ['advisory', id],
    queryFn: () => api.getAdvisoryById(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading agronomic dossier & structured diagnosis...</p>
      </div>
    );
  }

  if (isError || !advisory) {
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">Advisory Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested agronomic record could not be found or has restricted access under multi-tenant isolation.
        </p>
        <Link to="/" className="btn-primary inline-flex text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const ai = advisory.ai_raw_response;
  const input = advisory.input_parameters;

  return (
    <div className="space-y-8 print:p-0 print:space-y-4">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Advisory Dossier #{advisory.id.slice(0, 8)}
              </span>
              <RiskBadge level={advisory.overall_risk_level} size="sm" />
            </div>
            <h1 className="text-2xl font-black text-slate-100 font-display">
              {input?.cropType || 'Crop'} Agronomic Intelligence Report
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <AdvisoryPdfExportButton advisory={advisory} />
          <Link
            to={`/advisory/new?plotId=${advisory.plot_id}`}
            className="btn-primary text-xs sm:text-sm py-2 px-3.5"
          >
            <Sprout className="w-4 h-4" />
            <span>Generate New Run</span>
          </Link>
        </div>
      </div>

      {/* Printable Agronomic Header (Visible in print/PDF export) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-950 font-display">AGRI-GENOME OS</h1>
            <p className="text-xs text-slate-600 font-semibold tracking-wider">
              OFFICIAL CERTIFIED AGRONOMIC ADVISORY DOSSIER
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p><strong>Dossier ID:</strong> {advisory.id}</p>
            <p><strong>Certified Date:</strong> {new Date(advisory.created_at).toLocaleString()}</p>
            <p><strong>Inference Engine:</strong> Google Gemini 2.5 Pro (Schema Guaranteed)</p>
          </div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="glass-card p-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/20 border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-slate-100 text-lg">Executive Agronomic Synthesis</h2>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {ai.executiveSummary}
            </p>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Confidence Score</span>
              <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-2xl font-display">
                <Activity className="w-5 h-5" />
                <span>{advisory.confidence_score}%</span>
              </div>
            </div>
            <RiskBadge level={advisory.overall_risk_level} size="lg" />
          </div>
        </div>

        {/* Plot Context Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Cultivar / Stage:</span>
            <span className="font-bold text-slate-200">{input?.cropType} ({input?.growthStage})</span>
          </div>
          <div>
            <span className="text-slate-400 block">Soil / Area:</span>
            <span className="font-bold text-slate-200">{input?.soilType} | {input?.acreage} ac</span>
          </div>
          <div>
            <span className="text-slate-400 block">Irrigation Delivery:</span>
            <span className="font-bold text-slate-200">{input?.irrigationType}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Diagnosed On:</span>
            <span className="font-bold text-slate-200">{new Date(advisory.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Grid: NPK Subsurface Gauge + Irrigation Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NPKGaugeChart
          actual={input?.soilMetrics || {}}
          regimen={ai.soilAndNutrientAnalysis?.npkAdjustmentRegimen}
        />

        <MoistureTimeline
          schedule={ai.irrigationSchedule}
          irrigationType={input?.irrigationType || 'Drip'}
        />
      </div>

      {/* Integrated Pest Management (IPM) & Visual Pathology Triage */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Integrated Pest & Pathogen Defense (IPM)</h3>
              <p className="text-xs text-slate-400">
                Hierarchical defense: Prioritizing Biological & Cultural controls before Chemical Escalation
              </p>
            </div>
          </div>
        </div>

        {/* Diagnosed Issues */}
        {ai.pestAndPathogenDiagnosis?.diagnosedIssues && ai.pestAndPathogenDiagnosis.diagnosedIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Diagnosed Pathogens / Stressors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ai.pestAndPathogenDiagnosis.diagnosedIssues.map((issue, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-100 text-sm">{issue.name}</h5>
                    <RiskBadge level={issue.severity} size="sm" />
                  </div>
                  {issue.scientificName && (
                    <p className="text-xs italic text-slate-400">{issue.scientificName}</p>
                  )}
                  {issue.causalAgent && (
                    <p className="text-xs text-slate-300">
                      <strong className="text-slate-400 font-medium">Causal Agent: </strong>
                      {issue.causalAgent}
                    </p>
                  )}
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Symptoms: </span>
                    {issue.symptomsObserved?.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-Tier IPM Strategy: Cultural, Biological, Chemical */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          {/* Cultural Controls */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>1. Cultural Practices</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              {ai.pestAndPathogenDiagnosis?.integratedPestManagement?.culturalControls?.map((ctrl, i) => (
                <li key={i} className="leading-relaxed">{ctrl}</li>
              ))}
            </ul>
          </div>

          {/* Biological Controls */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>2. Bio-Protection</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              {ai.pestAndPathogenDiagnosis?.integratedPestManagement?.biologicalControls?.map((ctrl, i) => (
                <li key={i} className="leading-relaxed">{ctrl}</li>
              ))}
            </ul>
          </div>

          {/* Chemical Interventions */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>3. Chemical Interventions</span>
            </div>
            <div className="space-y-3">
              {ai.pestAndPathogenDiagnosis?.integratedPestManagement?.chemicalInterventions?.map((chem, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <p className="font-bold text-rose-300">{chem.activeIngredient}</p>
                  {chem.commercialFormulation && (
                    <p className="text-[11px] text-slate-400">Brand: {chem.commercialFormulation}</p>
                  )}
                  <p className="text-slate-200">Dosage: <strong className="text-emerald-400">{chem.dosagePerAcre}</strong></p>
                  <p className="text-amber-400 text-[11px]">PHI: {chem.preHarvestIntervalDays} days before harvest</p>
                  <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
                    <strong className="text-slate-300">PPE: </strong> {chem.safetyPrecautions}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Action Items Checklist */}
      <ActionItemTracker
        actionItems={advisory.advisory_action_items || []}
      />
    </div>
  );
};
