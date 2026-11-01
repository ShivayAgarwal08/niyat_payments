import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { AIProviderStatus } from '../services/types.js';
import {
  Cpu,
  ShieldCheck,
  RefreshCw,
  Key,
  CheckCircle2
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
    <div className="px-4 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF] flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-[#663A91]" />
              Diagnostics & Settings
            </span>
          </div>
          <h1 className="text-xl font-black text-[#261633] tracking-tight">
            AI Provider Stack Status
          </h1>
          <p className="text-xs text-[#766B82] leading-relaxed">
            4-tier automatic fallback architecture with circuit breakers and 100% offline local parser.
          </p>
        </div>

        <button
          onClick={fetchAIStatus}
          disabled={loading}
          className="p-2 rounded-xl bg-white border border-[#E8E2EF] text-[#766B82] hover:text-[#261633] hover:bg-[#F3EDF9] transition shrink-0"
          title="Refresh Provider Tiers"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* AI Providers Grid */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] px-1">
          Active Provider Tiers ({providers.length})
        </span>

        <div className="space-y-2.5">
          {providers.map((p, idx) => (
            <div
              key={idx}
              className="niyat-card p-4 space-y-2.5 shadow-card hover:border-[#663A91] transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#F3EDF9] text-[#663A91] flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="font-extrabold text-xs text-[#261633]">{p.name}</span>
                </div>

                {p.isConfigured ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#168451] bg-[#E8F6EE] px-2 py-0.5 rounded-full border border-[#C4E8D3] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    CONFIGURED
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-[#766B82] bg-[#F3F1F8] px-2 py-0.5 rounded-full border border-[#E8E2EF]">
                    OPTIONAL (Not set)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-[#F3F1F8] p-2 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-[#766B82] font-semibold block">Circuit Breaker</span>
                  <span className={`text-[11px] font-bold ${p.circuitBreakerOpen ? 'text-[#D64C55]' : 'text-[#168451]'}`}>
                    {p.circuitBreakerOpen ? 'TRIPPED (Open)' : 'HEALTHY (Closed)'}
                  </span>
                </div>

                <div className="bg-[#F3F1F8] p-2 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-[#766B82] font-semibold block">Failures</span>
                  <span className="text-[11px] font-bold text-[#261633]">{p.consecutiveFailures}</span>
                </div>
              </div>

              {p.lastError && (
                <div className="text-[10px] text-[#D64C55] bg-[#FBEDED] p-2 rounded-xl border border-[#F7D2D5] truncate">
                  Status: {p.lastError}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Zero-Key Guarantee — Deep Plum Card */}
      <div className="niyat-card-plum p-4 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3EDF9] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#C4E8D3]" />
          Deterministic Zero-Key Guarantee
        </span>
        <p className="text-xs text-[#E8E2EF]/80 leading-relaxed">
          NIYAT functions seamlessly even with zero external API keys. If remote providers experience rate limits (HTTP 429), timeouts, or service unavailability, requests automatically cascade to Level 4: the local deterministic regex parser.
        </p>
      </div>

      {/* Backend Environment Guidance */}
      <div className="niyat-card p-4 space-y-3 shadow-card">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-[#663A91]" />
          <h2 className="text-xs font-extrabold text-[#261633]">
            Active Configuration Keys
          </h2>
        </div>

        <p className="text-[11px] text-[#766B82] leading-relaxed">
          Configured in <code className="bg-[#F3F1F8] px-1.5 py-0.5 rounded text-[#261633] font-mono border border-[#E8E2EF]">backend/.env</code>:
        </p>

        <pre className="p-3 rounded-xl bg-[#261633] text-[#E8E2EF] font-mono text-[10px] overflow-x-auto leading-relaxed border border-white/10">
{`# 4-Tier Provider Cascade
GEMINI_MODEL=gemini-3.1-flash-lite
GROQ_MODEL=qwen/qwen3.8-27b
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free
LOCAL_FALLBACK=NIYAT-Deterministic-RegexRules-v1`}
        </pre>
      </div>
    </div>
  );
};
