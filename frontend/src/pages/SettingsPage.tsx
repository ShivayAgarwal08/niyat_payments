import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { AIProviderStatus, WalletSummary } from '../services/types.js';
import {
  Sliders,
  CheckCircle2,
  RefreshCw,
  User,
  Wallet,
  ArrowRight
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderStatus[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAIStatus = async () => {
    setLoading(true);
    try {
      const [aiData, walletData] = await Promise.all([
        api.getAIStatus(),
        api.getWallet('user_default')
      ]);
      setProviders(aiData);
      setWallet(walletData);
    } catch (err) {
      console.error('Failed to fetch diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIStatus();
  }, []);

  return (
    <div className="px-4 py-6 space-y-5 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Profile & Diagnostics
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Account & Security Settings
          </h1>
        </div>

        <button
          onClick={fetchAIStatus}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shrink-0 touch-target flex items-center justify-center"
          title="Refresh Diagnostics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Demo Account Profile Card */}
      <div className="card p-4 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 text-white flex items-center justify-center font-black text-base shadow-sm">
            U
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900">Demo User Account</div>
            <div className="text-xs text-slate-500 font-mono">user@niyat</div>
          </div>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600 font-medium">Pocket Balance:</span>
            <span className="font-extrabold text-slate-900 font-mono">
              ₹{wallet ? wallet.balanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '5,000.00'}
            </span>
          </div>

          <Link
            to="/wallet"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Manage Wallet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* AI Provider Stack Diagnostics */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>AI Provider Fallback Stack ({providers.length} Tiers)</span>
          </span>
        </div>

        <div className="space-y-2">
          {loading && providers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
              <span>Checking AI provider tiers...</span>
            </div>
          ) : (
            providers.map((p, idx) => (
              <div
                key={idx}
                className="card p-3.5 bg-white border border-slate-200 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-900 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                  </div>

                  {p.isConfigured ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Configured
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Not Configured
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Circuit Breaker</span>
                    <span className={`text-[11px] font-bold ${p.circuitBreakerOpen ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {p.circuitBreakerOpen ? 'TRIPPED (Open)' : 'HEALTHY (Closed)'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Failures</span>
                    <span className="text-[11px] font-bold text-slate-900">
                      {p.consecutiveFailures}
                    </span>
                  </div>
                </div>

                {p.lastError && (
                  <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200 truncate">
                    Status: {p.lastError}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
