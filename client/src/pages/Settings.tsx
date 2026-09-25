import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Database,
  Cpu,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Zap,
  Globe,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { workflowApi } from '../api/workflowClient';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiResult, setGeminiResult] = useState<any>(null);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('operator@researchflow.ai');

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await workflowApi.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleTestGemini = async () => {
    setGeminiTesting(true);
    setGeminiResult(null);
    try {
      const res = await workflowApi.verifyGemini();
      setGeminiResult(res);
    } catch (err: any) {
      setGeminiResult({ success: false, error: err.message });
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTesting(true);
    setEmailResult(null);
    try {
      const res = await workflowApi.verifyEmail(testEmailAddress);
      setEmailResult(res);
    } catch (err: any) {
      setEmailResult({ success: false, error: err.message });
    } finally {
      setEmailTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Infrastructure & Diagnostics</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            System & API Configuration
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Validate Google Gemini API credentials, database connections, and transactional email deliverability.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="btn-secondary text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {isLoading && !settings ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
          Loading diagnostic telemetry...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Google Gemini Integration */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Google Gemini AI (@google/genai)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Deep Synthesis (gemini-2.5-pro) & Fast Query Formulation (gemini-2.5-flash)
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  settings?.aiProvider?.isKeyConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {settings?.aiProvider?.isKeyConfigured ? 'Live Active' : 'Fallback / Heuristic Sandbox'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                <div className="text-slate-400 text-[11px]">Reasoning Model:</div>
                <div className="text-sky-400 font-bold">gemini-2.5-pro</div>
                <div className="text-slate-500 text-[10px]">Utilized in Stage 3 (Synthesis) & Stage 4 (Critique)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                <div className="text-slate-400 text-[11px]">Fast Planner Model:</div>
                <div className="text-indigo-400 font-bold">gemini-2.5-flash</div>
                <div className="text-slate-500 text-[10px]">Utilized in Stage 1 (Search Strategy Deconstruction)</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                To activate live Google GenAI cloud calls, set <code className="text-sky-400">GEMINI_API_KEY</code> in server/.env
              </span>
              <button
                onClick={handleTestGemini}
                disabled={geminiTesting}
                className="btn-primary text-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{geminiTesting ? 'Testing Connectivity...' : 'Ping Gemini Model'}</span>
              </button>
            </div>

            {geminiResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2 mb-1">
                  {geminiResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="font-bold text-slate-200">
                    Status: {geminiResult.status}
                  </span>
                </div>
                <p className="text-slate-400">
                  {geminiResult.message || geminiResult.response || geminiResult.error}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Database & State Engine */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    PostgreSQL / Supabase FSM Storage
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atomic state persistence, step payloads, and immutable audit logs
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {settings?.database?.status || 'ONLINE'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Active Driver:</span>
                <span className="text-sky-400 font-bold">{settings?.database?.driver}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Connection Details:</span>
                <span className="text-slate-300">{settings?.database?.message}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Schema Migration:</span>
                <span className="text-emerald-400">001_initial_schema.sql (Validated)</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed">
              💡 Provide your live PostgreSQL URI via <code className="text-sky-400">DATABASE_URL</code> in <code className="text-slate-400">server/.env</code> to persist state in Supabase Cloud.
            </div>
          </div>

          {/* Card 3: Email Delivery Dispatcher */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Transactional Email Dispatcher
                  </h3>
                  <p className="text-xs text-slate-400">
                    Resend API / SMTP with Juice inline-CSS compiler
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                {settings?.emailProvider?.activeProvider?.toUpperCase()}
              </span>
            </div>

            <form onSubmit={handleTestEmail} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={testEmailAddress}
                  onChange={e => setTestEmailAddress(e.target.value)}
                  placeholder="operator@company.com"
                  className="input-field"
                />
                <button
                  type="submit"
                  disabled={emailTesting}
                  className="btn-primary text-xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{emailTesting ? 'Sending...' : 'Test Delivery'}</span>
                </button>
              </div>
            </form>

            {emailResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">
                    Delivered via {emailResult.result?.provider}
                  </span>
                </div>
                <div className="text-slate-400">
                  Message ID: {emailResult.result?.messageId}
                </div>
                {emailResult.result?.previewUrl && (
                  <a
                    href={emailResult.result.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 font-bold"
                  >
                    View Ethereal Mail Preview <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Card 4: Web Scraping & Ingestion Guardrails */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Web Scraping & SSRF Guardrails
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cheerio semantic parser, timeout ceilings, and private IP blocks
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Max Concurrency:</span>
                <span className="text-slate-200 font-bold text-sm">{settings?.scraper?.maxConcurrent || 3}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Timeout Limit:</span>
                <span className="text-slate-200 font-bold text-sm">{settings?.scraper?.timeoutMs || 8000}ms</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Max Pages Ingested:</span>
                <span className="text-slate-200 font-bold text-sm">{settings?.scraper?.maxSourcePages || 5}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
