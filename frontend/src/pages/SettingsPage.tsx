import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { AIProviderStatus } from '../services/types.js';
import { Cpu, ShieldCheck, RefreshCw, Key, CheckCircle2 } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
          System Settings & AI Provider Tiers
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          NIYAT features a 4-tier automatic fallback architecture with circuit breakers and a 100% offline local parser.
        </p>
      </div>

      {/* AI Providers Grid */}
      <div className="niyat-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            AI Provider Stack Status
          </h2>
          <button
            onClick={fetchAIStatus}
            disabled={loading}
            className="niyat-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Providers</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#172033]">{p.name}</span>
                {p.isConfigured ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    CONFIGURED
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    OPTIONAL (Not set)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                <div>
                  <span className="text-[10px] uppercase text-slate-400">Available:</span>
                  <p className="font-semibold text-slate-700">{p.isAvailable ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400">Circuit Breaker:</span>
                  <p className="font-semibold text-slate-700">{p.circuitBreakerOpen ? 'OPEN (Tripped)' : 'CLOSED (Healthy)'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400">Failures:</span>
                  <p className="font-semibold text-slate-700">{p.consecutiveFailures}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400">Last Success:</span>
                  <p className="font-semibold text-slate-700 truncate">
                    {p.lastSuccessTime ? new Date(p.lastSuccessTime).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>

              {p.lastError && (
                <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 truncate">
                  Error: {p.lastError}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Deterministic Zero-Key Guarantee:
          </span>
          <p>
            NIYAT does not require any external AI API keys to function. If no keys are provided, or if remote providers
            encounter rate limits (HTTP 429), timeouts, or server errors, the system automatically falls back to Level 4:
            the built-in local deterministic regex and rules parser.
          </p>
        </div>
      </div>

      {/* Backend Environment Guidance */}
      <div className="niyat-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-600" />
          <h2 className="text-base font-bold text-[#172033]">
            Configuring Remote AI Keys (Optional)
          </h2>
        </div>

        <p className="text-xs text-slate-600">
          To enable remote LLM providers, add your keys to <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">backend/.env</code>:
        </p>

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
{`# Google Gemini (Level 1)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Groq (Level 2)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# OpenRouter (Level 3)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

# Neon PostgreSQL Database (Optional - local in-memory fallback included)
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/niyat_db?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xyz.neon.tech/niyat_db`}
        </pre>
      </div>
    </div>
  );
};
