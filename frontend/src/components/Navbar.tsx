import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShoppingBag,
  Send,
  History,
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
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Pocket UPI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Intent-Secured Simulated Payments
            </p>
          </div>
        </Link>

        {/* Top Right Quick Shortcuts */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/security-lab"
            title="Firewall Simulations"
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition touch-target flex items-center gap-1 ${
              isActive('/security-lab') || isActive('/normal-mode')
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px]">Lab</span>
          </Link>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (5 Core Sections: Home, Shop, Pay, Activity, Security) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 max-w-[540px] mx-auto sm:rounded-b-[28px] px-1 py-1.5 shadow-elevated">
        <div className="grid grid-cols-5 items-center">
          {/* Tab 1: Home */}
          <Link
            to="/home"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
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

          {/* Tab 2: Shop (Smart Shopping + Protected Mode) */}
          <Link
            to="/protected-mode"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive('/protected-mode') || isActive('/catalog')
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className={`w-5 h-5 mb-0.5 ${isActive('/protected-mode') || isActive('/catalog') ? 'stroke-[2.5px] text-blue-600' : ''}`} />
            <span className={`text-[10px] ${isActive('/protected-mode') || isActive('/catalog') ? 'font-bold text-blue-600' : 'font-medium'}`}>
              Shop
            </span>
          </Link>

          {/* Tab 3: Pay (Pocket UPI Wallet & P2P) */}
          <Link
            to="/pocket-pay"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive('/pocket-pay')
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Send className={`w-5 h-5 mb-0.5 ${isActive('/pocket-pay') ? 'stroke-[2.5px] text-indigo-600' : ''}`} />
            <span className={`text-[10px] ${isActive('/pocket-pay') ? 'font-bold text-indigo-600' : 'font-medium'}`}>
              Pay
            </span>
          </Link>

          {/* Tab 4: Activity (Ledger & Audit Trail) */}
          <Link
            to="/transactions"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive('/transactions')
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className={`w-5 h-5 mb-0.5 ${isActive('/transactions') ? 'stroke-[2.5px] text-slate-900' : ''}`} />
            <span className={`text-[10px] ${isActive('/transactions') ? 'font-bold text-slate-900' : 'font-medium'}`}>
              Activity
            </span>
          </Link>

          {/* Tab 5: Security (Firewall & Attack Lab) */}
          <Link
            to="/security-lab"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive('/security-lab') || isActive('/normal-mode')
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 mb-0.5 ${isActive('/security-lab') || isActive('/normal-mode') ? 'stroke-[2.5px] text-emerald-700' : ''}`} />
            <span className={`text-[10px] ${isActive('/security-lab') || isActive('/normal-mode') ? 'font-bold text-emerald-700' : 'font-medium'}`}>
              Security
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
};
