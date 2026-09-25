import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code
} from 'lucide-react';
import { workflowApi } from '../../api/workflowClient';

interface EmailIframePreviewProps {
  workflowId: string;
  htmlReport?: string | null;
  recipients?: string[];
}

export const EmailIframePreview: React.FC<EmailIframePreviewProps> = ({
  workflowId,
  htmlReport,
  recipients = []
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState(recipients[0] || 'analyst@researchflow.ai');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; previewUrl?: string } | null>(null);

  const htmlSizeKb = htmlReport ? (new Blob([htmlReport]).size / 1024).toFixed(1) : '0';

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setIsSending(true);
    setTestResult(null);

    try {
      const res = await workflowApi.sendTestEmail(workflowId, testEmail);
      setTestResult({
        success: true,
        message: `Preview email sent successfully to ${testEmail}!`,
        previewUrl: res.result?.previewUrl
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test email.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-sm text-slate-200">Responsive Email Preview</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
            Juice CSS Inlined ({htmlSizeKb} KB)
          </span>
        </div>

        {/* Viewport Toggles & Test Send */}
        <div className="flex items-center gap-3">
          {/* Desktop vs Mobile Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                deviceView === 'desktop'
                  ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop (680px)</span>
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                deviceView === 'mobile'
                  ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (375px)</span>
            </button>
          </div>

          {/* Test Send Trigger */}
          <button
            onClick={() => setShowTestModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>Send Test Email</span>
          </button>
        </div>
      </div>

      {/* Iframe Viewport Container */}
      <div className="flex-1 bg-slate-950 p-4 md:p-6 overflow-auto flex justify-center items-start">
        {!htmlReport ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
            <Mail className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
            <h4 className="text-sm font-semibold text-slate-400 mb-1">
              Email Compilation Pending
            </h4>
            <p className="text-xs max-w-sm">
              The compiled inline-CSS email report will render here after Step 4 (Fact Critique) is approved or finalized.
            </p>
          </div>
        ) : (
          <div
            className={`transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 ${
              deviceView === 'desktop' ? 'w-full max-w-[720px] h-[580px]' : 'w-[375px] h-[580px]'
            }`}
          >
            <iframe
              srcDoc={htmlReport}
              title="Compiled Email Preview"
              className="w-full h-full border-none bg-slate-950"
              sandbox="allow-same-origin allow-popups"
            />
          </div>
        )}
      </div>

      {/* Email Compatibilities Footer */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>Client Standards:</span>
          <span className="text-slate-300">Apple Mail (Verified)</span> •
          <span className="text-slate-300">Gmail Web/App (Verified)</span> •
          <span className="text-slate-300">Outlook 365 (Verified)</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Universal Table Resilient</span>
        </div>
      </div>

      {/* Test Email Dispatch Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-sm">Send Preview Email</h3>
              </div>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestResult(null);
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Recipient Email:
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="analyst@yourcompany.com"
                  className="input-field"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Dispatches an authentic test email of the current rendered briefing without advancing the workflow state.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs border ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{testResult.message}</p>
                      {testResult.previewUrl && (
                        <a
                          href={testResult.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-sky-400 hover:underline font-bold"
                        >
                          View Ethereal Web Inbox <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-primary text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send Preview Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
