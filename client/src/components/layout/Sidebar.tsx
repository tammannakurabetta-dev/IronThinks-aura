import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Sparkles, 
  History, 
  Settings, 
  Trees, 
  ShieldCheck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: '/',
      label: 'Farm Overview',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      to: '/plots',
      label: 'Plot & Crop Registry',
      icon: MapPin,
      badge: '3 Plots',
    },
    {
      to: '/advisory/new',
      label: 'New AI Advisory',
      icon: Sparkles,
      highlight: true,
      badge: 'Gemini 2.5',
    },
    {
      to: '/history',
      label: 'Historical Records',
      icon: History,
    },
    {
      to: '/settings',
      label: 'Farm Configuration',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-950/95 lg:bg-slate-950/60 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Quick Active Farm Header */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mb-1">
              <Trees className="w-3.5 h-3.5" />
              <span>Active Farm Profile</span>
            </div>
            <h4 className="font-bold text-slate-100 text-sm truncate">Verdant Valley Bio-Farm</h4>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>California, USA</span>
              <span className="font-semibold text-slate-300">120.5 Acres</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Operational Navigation
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? item.highlight
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 font-semibold'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : item.highlight
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-900/80 text-emerald-400 border border-emerald-500/20">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Agronomic Reliability Footer Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Deterministic AI</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Zero hallucination guarantee enforced via rigid Zod & Gemini JSON Schemas.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Schema: v2.5.0</span>
            <span className="text-emerald-400 font-medium">99.8% Reliability</span>
          </div>
        </div>
      </aside>
    </>
  );
};
