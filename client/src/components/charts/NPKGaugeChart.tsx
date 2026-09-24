import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { NpkAdjustmentRegimen } from '@shared/types';
import { Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NPKGaugeChartProps {
  actual: {
    nitrogenPpm?: number | null;
    phosphorusPpm?: number | null;
    potassiumPpm?: number | null;
  };
  regimen: NpkAdjustmentRegimen;
}

export const NPKGaugeChart: React.FC<NPKGaugeChartProps> = ({ actual, regimen }) => {
  // Agronomic optimal benchmark PPM levels for reference
  const targetN = 45;
  const targetP = 30;
  const targetK = 180;

  const currentN = actual.nitrogenPpm ?? 20;
  const currentP = actual.phosphorusPpm ?? 22;
  const currentK = actual.potassiumPpm ?? 135;

  const chartData = [
    {
      nutrient: 'Nitrogen (N)',
      code: 'N',
      currentPpm: currentN,
      targetPpm: targetN,
      deficitKgHa: regimen.nitrogenKgPerHa,
      color: '#38bdf8', // Sky blue
      targetColor: '#0284c7',
      status: currentN < targetN ? 'Deficit' : 'Optimal',
    },
    {
      nutrient: 'Phosphorus (P)',
      code: 'P',
      currentPpm: currentP,
      targetPpm: targetP,
      deficitKgHa: regimen.phosphorusKgPerHa,
      color: '#f59e0b', // Amber
      targetColor: '#d97706',
      status: currentP < targetP ? 'Deficit' : 'Optimal',
    },
    {
      nutrient: 'Potassium (K)',
      code: 'K',
      currentPpm: currentK,
      targetPpm: targetK,
      deficitKgHa: regimen.potassiumKgPerHa,
      color: '#10b981', // Emerald
      targetColor: '#059669',
      status: currentK < targetK ? 'Deficit' : 'Optimal',
    },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-lg">Subsurface N-P-K Macro Profile</h3>
            <p className="text-xs text-slate-400">Target vs Measured PPM with Prescribed Compensation (kg/ha)</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
            <span className="text-slate-300">Measured (ppm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-600 inline-block border border-dashed border-slate-400" />
            <span className="text-slate-300">Target Baseline</span>
          </div>
        </div>
      </div>

      <div className="h-64 mt-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="code" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 13 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                      <p className="font-bold text-slate-100 text-sm">{data.nutrient}</p>
                      <p className="text-sky-300">Measured: <span className="font-semibold">{data.currentPpm} ppm</span></p>
                      <p className="text-slate-400">Target Optimal: <span className="font-semibold">{data.targetPpm} ppm</span></p>
                      <div className="mt-2 pt-1 border-t border-slate-800 text-emerald-400 font-semibold">
                        Prescribed Addition: +{data.deficitKgHa} kg/ha
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="currentPpm" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="targetPpm" fill="#334155" opacity={0.35} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Regimen Dosage Pill Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-400 font-medium">Nitrogen (N)</span>
            {currentN < targetN ? (
              <span className="text-xs text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Deficit</span>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Optimal</span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-100">{regimen.nitrogenKgPerHa}</span>
            <span className="text-xs text-slate-400">kg/ha Urea eq.</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Phosphorus (P)</span>
            {currentP < targetP ? (
              <span className="text-xs text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Deficit</span>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Optimal</span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-100">{regimen.phosphorusKgPerHa}</span>
            <span className="text-xs text-slate-400">kg/ha DAP/SSP eq.</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">Potassium (K)</span>
            {currentK < targetK ? (
              <span className="text-xs text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Deficit</span>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Optimal</span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-100">{regimen.potassiumKgPerHa}</span>
            <span className="text-xs text-slate-400">kg/ha MOP eq.</span>
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-emerald-200">Timing: </span>
          <span>{regimen.applicationTiming}</span>
        </div>
        <div>
          <span className="font-semibold text-emerald-200">Method: </span>
          <span>{regimen.applicationMethod}</span>
        </div>
      </div>
    </div>
  );
};
