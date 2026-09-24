import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Sprout, 
  ChevronDown, 
  Shield, 
  Sparkles, 
  Cpu, 
  LogOut, 
  User, 
  Database,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, signOut, switchDemoRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 h-16 flex items-center px-4 sm:px-6 justify-between">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800"
        >
          <Layers className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg tracking-tight text-slate-100">
                AGRI-GENOME <span className="text-emerald-400 font-extrabold text-sm px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">OS</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium hidden sm:block">
              AI Crop Advisory Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Center status badges */}
      <div className="hidden md:flex items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Gemini 2.5 Pro Active</span>
        </div>

        <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-300">PostgreSQL RLS Multi-Tenant</span>
        </div>
      </div>

      {/* Right User & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize font-medium">{user?.role || 'Farmer'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Switch Role Context
              </div>
              <button
                onClick={() => {
                  switchDemoRole('farmer');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  user?.role === 'farmer' ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>🌾 Farmer</span>
              </button>
              <button
                onClick={() => {
                  switchDemoRole('agronomist');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  user?.role === 'agronomist' ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>🔬 Agronomist Consultant</span>
              </button>
              <button
                onClick={() => {
                  switchDemoRole('admin');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  user?.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>⚙️ Enterprise Admin</span>
              </button>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">
              {user?.fullName || 'Farmer'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="font-semibold text-slate-200 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile & Settings</span>
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
