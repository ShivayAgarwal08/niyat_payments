import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { AIProviderStatus } from '../services/types.js';
import {
  Sliders,
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAIStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getAIStatus();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch AI provider status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIStatus();
  }, []);

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-700" />
              Diagnostics
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            AI Provider Stack
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            4-tier automatic fallback architecture with circuit breakers and 100% offline local parser.
          </p>
        </div>

        <button
          onClick={fetchAIStatus}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shrink-0 touch-target flex items-center justify-center"
          title="Refresh Providers"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Zero-Key Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Deterministic Zero-Key Guarantee
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          NIYAT functions seamlessly even with zero external API keys. If remote cloud providers experience rate limits (HTTP 429), timeouts, or service unavailability, requests automatically cascade to Level 4: the local deterministic parser.
        </p>
      </div>

      {/* Provider List */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
          Active Provider Tiers ({providers.length})
        </span>

        <div className="space-y-2.5">
          {loading && providers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
              <span>Checking AI provider tiers...</span>
            </div>
          ) : (
            providers.map((p, idx) => (
              <div
                key={idx}
                className="fintech-card p-4 space-y-2.5 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-900 flex items-center justify-center text-xs font-bold">
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

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Circuit Breaker</span>
                    <span className={`text-xs font-bold ${p.circuitBreakerOpen ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {p.circuitBreakerOpen ? 'TRIPPED (Open)' : 'HEALTHY (Closed)'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Failures</span>
                    <span className="text-xs font-bold text-slate-900">
                      {p.consecutiveFailures}
                    </span>
                  </div>
                </div>

                {p.lastError && (
                  <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 truncate">
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
