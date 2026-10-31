import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ShieldAlert, ShoppingBag, FlaskConical, History, Settings, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Product Tagline */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-subtle group-hover:bg-blue-700 transition">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[#172033]">NIYAT</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Payments
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal hidden sm:block">
                The Intent Firewall for AI Shopping Agents
              </p>
            </div>
          </Link>

          {/* Center: The Two Primary Shopping Modes (in exact order: Normal Mode -> NIYAT Protected Mode) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            {/* Mode 1: Normal Shopping Mode */}
            <Link
              to="/normal-mode"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive('/normal-mode')
                  ? 'bg-white text-rose-700 shadow-subtle border border-rose-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>1. Normal Mode (Vulnerable)</span>
            </Link>

            {/* Mode 2: NIYAT Protected Mode */}
            <Link
              to="/protected-mode"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive('/protected-mode')
                  ? 'bg-white text-blue-700 shadow-subtle border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>2. NIYAT Protected Mode</span>
            </Link>
          </div>

          {/* Right Navigation: Marketplace, Security Lab, Transactions, Settings */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/catalog"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                isActive('/catalog') ? 'bg-slate-100 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Marketplace
            </Link>

            <Link
              to="/security-lab"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                isActive('/security-lab') ? 'bg-slate-100 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Security Lab
            </Link>

            <Link
              to="/transactions"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                isActive('/transactions') ? 'bg-slate-100 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Log
            </Link>

            <Link
              to="/settings"
              className={`p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition ${
                isActive('/settings') ? 'bg-slate-100 text-blue-600' : ''
              }`}
              title="Settings & AI Status"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-400 px-2 py-1">Primary Shopping Modes</div>
          <Link
            to="/normal-mode"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-700 bg-rose-50/60 border border-rose-100"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            1. Normal Shopping Mode (Vulnerable)
          </Link>
          <Link
            to="/protected-mode"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50/60 border border-blue-100"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            2. NIYAT Protected Shopping Mode
          </Link>

          <div className="border-t border-slate-100 my-2 pt-2">
            <Link
              to="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              Marketplace Catalog
            </Link>
            <Link
              to="/security-lab"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FlaskConical className="w-4 h-4 text-slate-500" />
              Security Lab (10 Scenarios)
            </Link>
            <Link
              to="/transactions"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <History className="w-4 h-4 text-slate-500" />
              Transaction History
            </Link>
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              Settings & AI Provider Status
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
