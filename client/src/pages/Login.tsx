import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, LogIn, Key, Mail, Shield, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'farmer' | 'agronomist' | 'admin') => {
    await signIn(
      role === 'farmer' 
        ? 'demo.farmer@agrigenome.io' 
        : role === 'agronomist' 
        ? 'consultant@agrigenome.io' 
        : 'admin@agrigenome.io'
    );
    switchDemoRole(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sprout className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-100 font-display">
            AGRI-GENOME <span className="text-emerald-400">OS</span>
          </h1>
          <p className="text-xs text-slate-400">
            AI-Powered Crop Advisory Intelligence & Multi-Tenant Farm Telemetry
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8 space-y-6 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Sign In to Farm Workspace</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
              RLS Secured
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@farmcollective.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 mt-2 font-bold"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Instant One-Click Sandbox Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-emerald-300 font-medium transition-colors text-center"
              >
                🌾 Farmer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('agronomist')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-emerald-300 font-medium transition-colors text-center"
              >
                🔬 Agronomist
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-emerald-300 font-medium transition-colors text-center"
              >
                ⚙️ Admin
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:underline font-semibold">
              Register Farm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
