import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  History,
  Sliders,
  Home
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Sleek Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-subtle">
        <Link to="/home" className="flex items-center gap-2.5 touch-target">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">NIYAT</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Firewall
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              AI Shopping Agent Defense
            </p>
          </div>
        </Link>

        {/* Top Right Quick Shortcuts */}
        <div className="flex items-center gap-1">
          <Link
            to="/transactions"
            title="Audit Trail"
            className={`p-2 rounded-xl text-xs font-medium transition touch-target flex items-center justify-center ${
              isActive('/transactions')
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
          </Link>

          <Link
            to="/settings"
            title="AI Diagnostics"
            className={`p-2 rounded-xl text-xs font-medium transition touch-target flex items-center justify-center ${
              isActive('/settings')
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 max-w-[540px] mx-auto sm:rounded-b-[28px] px-2 py-1.5 shadow-elevated">
        <div className="grid grid-cols-4 items-center">
          {/* Tab 1: Home */}
          <Link
            to="/home"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition touch-target ${
              isActive('/home')
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className={`w-5 h-5 mb-0.5 ${isActive('/home') ? 'stroke-[2.5px] text-slate-900' : ''}`} />
            <span className={`text-[10px] ${isActive('/home') ? 'font-bold text-slate-900' : 'font-medium'}`}>
              Home
            </span>
          </Link>

          {/* Tab 2: Normal Mode (Vulnerable) */}
          <Link
            to="/normal-mode"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition touch-target ${
              isActive('/normal-mode')
                ? 'text-rose-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 mb-0.5 ${isActive('/normal-mode') ? 'stroke-[2.5px] text-rose-600' : ''}`} />
            <span className={`text-[10px] ${isActive('/normal-mode') ? 'font-bold text-rose-600' : 'font-medium'}`}>
              Normal
            </span>
          </Link>

          {/* Tab 3: Protected Mode (The Main Product) */}
          <Link
            to="/protected-mode"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition touch-target ${
              isActive('/protected-mode')
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 mb-0.5 ${isActive('/protected-mode') ? 'stroke-[2.5px] text-blue-600' : ''}`} />
            <span className={`text-[10px] ${isActive('/protected-mode') ? 'font-bold text-blue-600' : 'font-medium'}`}>
              Protected
            </span>
          </Link>

          {/* Tab 4: Audit Trail */}
          <Link
            to="/transactions"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition touch-target ${
              isActive('/transactions')
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className={`w-5 h-5 mb-0.5 ${isActive('/transactions') ? 'stroke-[2.5px] text-slate-900' : ''}`} />
            <span className={`text-[10px] ${isActive('/transactions') ? 'font-bold text-slate-900' : 'font-medium'}`}>
              Audit
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
};
