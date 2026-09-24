import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, UserPlus, Mail, Key, User, Shield, MapPin } from 'lucide-react';
import { USER_ROLES } from '@shared/constants';
import { UserRole } from '@shared/types';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'farmer' as UserRole,
    farmName: 'Verdant Prairie Farm',
    stateProvince: 'California',
    country: 'United States',
    totalAcreage: 100,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUp(formData.email, formData.password, formData.fullName, formData.role);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sprout className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-100 font-display">
            Register Farm Profile
          </h1>
          <p className="text-xs text-slate-400">
            Join the Agri-Genome OS network for deterministic agronomic intelligence
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-6 bg-slate-900/90 border-slate-800">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Sarah Vance"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operational Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="select-field"
                >
                  <option value="farmer">🌾 Farmer / Operator</option>
                  <option value="agronomist">🔬 Agronomist Consultant</option>
                  <option value="admin">⚙️ Enterprise Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@farm.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Initial Farm Entity Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Farm Name</label>
                  <input
                    type="text"
                    required
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Acreage</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalAcreage}
                    onChange={(e) => setFormData({ ...formData, totalAcreage: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 mt-2 font-bold"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Initializing Profile...' : 'Complete Farm Registration'}</span>
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
