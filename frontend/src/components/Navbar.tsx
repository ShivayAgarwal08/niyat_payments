import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  FlaskConical,
  History,
  Settings,
  Home
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Sleek Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E2EF] px-4 py-2.5 flex items-center justify-between shadow-subtle">
        <Link to="/home" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#351B4D] to-[#663A91] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#261633]">NIYAT</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF]">
                Firewall
              </span>
            </div>
            <p className="text-[10px] text-[#766B82] font-medium leading-none">
              AI Shopping Agent Defense
            </p>
          </div>
        </Link>

        {/* Top Right Quick Shortcuts */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/transactions"
            title="Audit Trail"
            className={`p-2 rounded-xl text-xs font-medium transition ${
              isActive('/transactions')
                ? 'bg-[#F3EDF9] text-[#663A91] font-semibold'
                : 'text-[#766B82] hover:text-[#261633] hover:bg-[#F3F1F8]'
            }`}
          >
            <History className="w-4 h-4" />
          </Link>

          <Link
            to="/settings"
            title="AI Provider Tiers"
            className={`p-2 rounded-xl text-xs font-medium transition ${
              isActive('/settings')
                ? 'bg-[#F3EDF9] text-[#663A91] font-semibold'
                : 'text-[#766B82] hover:text-[#261633] hover:bg-[#F3F1F8]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Mode Switcher Pill Banner (Sub-header) */}
      <div className="bg-[#FFFFFF] border-b border-[#E8E2EF] px-3 py-1.5 flex items-center justify-center gap-2">
        <button
          onClick={() => navigate('/normal-mode')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
            isActive('/normal-mode')
              ? 'bg-[#FBEDED] text-[#D64C55] border border-[#F7D2D5] shadow-xs'
              : 'text-[#766B82] hover:bg-[#F3F1F8]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#D64C55]" />
          <span>1. Normal (Vulnerable)</span>
        </button>

        <button
          onClick={() => navigate('/protected-mode')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
            isActive('/protected-mode')
              ? 'bg-[#663A91] text-white shadow-xs'
              : 'text-[#766B82] hover:bg-[#F3F1F8]'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isActive('/protected-mode') ? 'text-white' : 'text-[#663A91]'}`} />
          <span>2. NIYAT Protected</span>
        </button>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (SwitchPay-inspired) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E8E2EF] max-w-[540px] mx-auto sm:rounded-b-[32px] px-2 py-1.5 shadow-elevated">
        <div className="flex items-center justify-around">
          {/* Tab 1: Home */}
          <Link
            to="/home"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              isActive('/home')
                ? 'text-[#663A91]'
                : 'text-[#766B82] hover:text-[#261633]'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className={`text-[10px] ${isActive('/home') ? 'font-bold text-[#663A91]' : 'font-medium'}`}>
              Home
            </span>
          </Link>

          {/* Tab 2: Normal Shopping */}
          <Link
            to="/normal-mode"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              isActive('/normal-mode')
                ? 'text-[#D64C55]'
                : 'text-[#766B82] hover:text-[#261633]'
            }`}
          >
            <ShieldAlert className="w-5 h-5 mb-0.5" />
            <span className={`text-[10px] ${isActive('/normal-mode') ? 'font-bold text-[#D64C55]' : 'font-medium'}`}>
              Normal
            </span>
          </Link>

          {/* Tab 3: Protected Shopping (Centerpiece Action) */}
          <Link
            to="/protected-mode"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
              isActive('/protected-mode')
                ? 'bg-[#663A91] text-white shadow-md -translate-y-1'
                : 'text-[#663A91] hover:bg-[#F3EDF9]'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className={`text-[10px] ${isActive('/protected-mode') ? 'font-bold text-white' : 'font-semibold text-[#663A91]'}`}>
              Protected
            </span>
          </Link>

          {/* Tab 4: Marketplace */}
          <Link
            to="/catalog"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              isActive('/catalog')
                ? 'text-[#663A91]'
                : 'text-[#766B82] hover:text-[#261633]'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className={`text-[10px] ${isActive('/catalog') ? 'font-bold text-[#663A91]' : 'font-medium'}`}>
              Market
            </span>
          </Link>

          {/* Tab 5: Security Lab */}
          <Link
            to="/security-lab"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              isActive('/security-lab')
                ? 'text-[#663A91]'
                : 'text-[#766B82] hover:text-[#261633]'
            }`}
          >
            <FlaskConical className="w-5 h-5 mb-0.5" />
            <span className={`text-[10px] ${isActive('/security-lab') ? 'font-bold text-[#663A91]' : 'font-medium'}`}>
              Lab
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
};
