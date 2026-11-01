import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import { WalletSummary } from '../services/types.js';
import {
  Shield,
  ShieldCheck,
  ShoppingBag,
  History,
  Home,
  Compass,
  User,
  Wallet
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);

  useEffect(() => {
    api.getWallet('user_default')
      .then(setWallet)
      .catch(() => {});
  }, [location.pathname]);

  const isActive = (paths: string[]) => {
    return paths.includes(location.pathname);
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
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Wall Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              AI Shopping Payment Firewall
            </p>
          </div>
        </Link>

        {/* Top Right Quick Shortcuts */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/wallet"
            title="Pocket UPI Wallet"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition touch-target text-xs font-mono font-bold"
          >
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
            <span>₹{wallet ? wallet.balanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '5,000'}</span>
          </Link>
          <Link
            to="/profile"
            title="User Profile & Settings"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition touch-target flex items-center justify-center"
          >
            <User className="w-4 h-4 text-slate-700" />
          </Link>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (5 Core Sections: Home, Explore, Shop, Orders, Security) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 max-w-[540px] mx-auto sm:rounded-b-[28px] px-1 py-1.5 shadow-elevated">
        <div className="grid grid-cols-5 items-center">
          {/* Tab 1: Home (Shopping Assistant) */}
          <Link
            to="/home"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive(['/home', '/'])
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className={`w-5 h-5 mb-0.5 ${isActive(['/home', '/']) ? 'stroke-[2.5px] text-blue-600' : ''}`} />
            <span className={`text-[10px] ${isActive(['/home', '/']) ? 'font-bold text-blue-600' : 'font-medium'}`}>
              Home
            </span>
          </Link>

          {/* Tab 2: Explore (Products & Merchants) */}
          <Link
            to="/explore"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive(['/explore', '/catalog'])
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className={`w-5 h-5 mb-0.5 ${isActive(['/explore', '/catalog']) ? 'stroke-[2.5px] text-blue-600' : ''}`} />
            <span className={`text-[10px] ${isActive(['/explore', '/catalog']) ? 'font-bold text-blue-600' : 'font-medium'}`}>
              Explore
            </span>
          </Link>

          {/* Tab 3: Shop & Wall (Active AI Shopping & Payment Interception) */}
          <Link
            to="/shop"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive(['/shop', '/protected-mode'])
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <ShoppingBag className={`w-5 h-5 mb-0.5 ${isActive(['/shop', '/protected-mode']) ? 'stroke-[2.5px] text-blue-600' : ''}`} />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600" />
            </div>
            <span className={`text-[10px] ${isActive(['/shop', '/protected-mode']) ? 'font-bold text-blue-600' : 'font-medium'}`}>
              Shop & Wall
            </span>
          </Link>

          {/* Tab 4: Orders (Shopping & Payment History) */}
          <Link
            to="/orders"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive(['/orders', '/transactions'])
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className={`w-5 h-5 mb-0.5 ${isActive(['/orders', '/transactions']) ? 'stroke-[2.5px] text-blue-600' : ''}`} />
            <span className={`text-[10px] ${isActive(['/orders', '/transactions']) ? 'font-bold text-blue-600' : 'font-medium'}`}>
              Orders
            </span>
          </Link>

          {/* Tab 5: Security (Firewall & Attack Lab) */}
          <Link
            to="/security"
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition touch-target ${
              isActive(['/security', '/security-lab', '/normal-mode'])
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 mb-0.5 ${isActive(['/security', '/security-lab', '/normal-mode']) ? 'stroke-[2.5px] text-emerald-700' : ''}`} />
            <span className={`text-[10px] ${isActive(['/security', '/security-lab', '/normal-mode']) ? 'font-bold text-emerald-700' : 'font-medium'}`}>
              Security
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
};
