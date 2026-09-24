import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Bell, 
  Globe, 
  Key, 
  Save, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { isSupabaseClientConfigured } from '../api/client';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [riskSms, setRiskSms] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>System & Farm Configuration</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-display">Farm Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure measurement units, notification thresholds, and inspect backend AI/Database integrations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Farm & Agronomist Profile */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-bold text-slate-100 text-base">User & Operational Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.fullName || 'Dr. Sarah Vance'}
                className="input-field bg-slate-950/60 text-slate-300 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Operational Role</label>
              <input
                type="text"
                disabled
                value={user?.role?.toUpperCase() || 'FARMER'}
                className="input-field bg-slate-950/60 text-emerald-400 font-semibold cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Measurement Units */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Measurement & Unit Standardization
              </h2>
              <p className="text-xs text-slate-400">Controls fertilizer dosage and irrigation metrics</p>
            </div>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  unitSystem === 'metric'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Metric (kg/ha, mm, °C)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  unitSystem === 'imperial'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Imperial (lbs/ac, in, °F)
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Agronomic Risk Alert Protocols
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <div>
                <p className="font-semibold text-slate-200">Critical Pathogen & Blight Alerts</p>
                <p className="text-slate-400 text-[11px]">Instant dispatch when disease risk reaches HIGH or CRITICAL</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <div>
                <p className="font-semibold text-slate-200">Thermal Drought Evapotranspiration Warnings</p>
                <p className="text-slate-400 text-[11px]">SMS alert when daily ET exceeds 6.0 mm with rain deficiency</p>
              </div>
              <input
                type="checkbox"
                checked={riskSms}
                onChange={(e) => setRiskSms(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* Backend & AI Integration Diagnostics */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            AI Engine & Database Architecture Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Google Gen AI SDK
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  gemini-2.5-pro
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Rigid responseSchema enforcement preventing hallucinated fertilizer formulas.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-400" />
                  Supabase PostgreSQL
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  isSupabaseClientConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {isSupabaseClientConfigured ? 'Live Cloud Connected' : 'Sandbox Ready'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Multi-tenant Row Level Security (RLS) isolating farm plot telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          {savedToast && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="w-4 h-4" /> Preferences saved!
            </span>
          )}
          <button type="submit" className="btn-primary">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
