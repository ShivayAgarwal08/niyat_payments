import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { NormalSimulationResult } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { ShieldAlert, AlertTriangle, Play, ChevronRight } from 'lucide-react';

export const NormalShoppingPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('Buy 2 litres of Amul Taaza milk under ₹150.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NormalSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    'Buy 2 litres of Amul Taaza milk under ₹150.',
    'Buy 1 Apple MacBook Air M2 under ₹85,000.',
    'Buy 1 pair of Nike running shoes under ₹4,000.',
    'Get 1 iPhone 15 below ₹70,000.'
  ];

  const handleSimulate = async (promptToUse?: string) => {
    const text = promptToUse || prompt;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.simulateNormal(text);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Mode Badge */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            PART 1 — NORMAL SHOPPING MODE (VULNERABLE)
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Step 1 of 2: Experience the Problem First
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
          Vulnerable AI Shopping Agent Simulation
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          An ordinary AI shopping agent operates without cryptographic intent boundaries. When it reads product
          pages, malicious instructions embedded in the page can hijack the agent's context and execute unauthorized purchases.
        </p>
      </div>

      {/* Educational Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Educational Simulation Environment:</span> This simulation demonstrates
          real-world prompt injection and confused-deputy attacks on autonomous agents. All transactions are simulated with DEMO DATA. No real funds are ever transferred.
        </div>
      </div>

      {/* Input Form */}
      <div className="niyat-card p-6 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          User Shopping Request
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Buy 2 litres of Amul Taaza milk under ₹150."
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
          />
          <button
            onClick={() => handleSimulate()}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Attack...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                <span>Run Normal Agent</span>
              </span>
            )}
          </button>
        </div>

        {/* Quick Example Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Examples:</span>
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(s);
                handleSimulate(s);
              }}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Simulation Result Breakdown */}
      {result && (
        <div className="space-y-6">
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              Attack Simulation Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Side-by-side comparison of original user intent vs manipulated autonomous purchase
            </p>
          </div>

          {/* Side-by-Side: Original Intent vs Manipulated Purchase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: What the User Actually Asked For */}
            <div className="niyat-card p-5 border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase text-slate-500">Original User Intent</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  Expected Action
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-slate-400">Request Prompt</div>
                  <div className="font-semibold text-slate-800">"{result.originalUserIntent}"</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <div className="text-xs text-slate-400">Target Category</div>
                    <div className="font-medium text-slate-700">{result.extractedGoal.category}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Quantity</div>
                    <div className="font-medium text-slate-700">{result.extractedGoal.quantity} Units</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Budget Ceiling</div>
                    <div className="font-medium text-slate-700">
                      <PriceFormatter paise={result.extractedGoal.budgetPaise} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Inspected Product</div>
                    <div className="font-medium text-slate-700 truncate">{result.productInspected.title}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: What the Manipulated Agent Executed */}
            <div className="niyat-card p-5 border-rose-300 bg-rose-50/20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                <span className="text-xs font-bold uppercase text-rose-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Manipulated Execution
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                  UNAUTHORIZED
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-rose-600">Manipulation Type</div>
                  <div className="font-bold text-rose-900">{result.manipulatedAction.manipulationType}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-xs text-rose-600">Diverted Recipient</div>
                    <div className="font-mono text-xs font-semibold text-rose-900 truncate">
                      {result.manipulatedAction.divertedPayee}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-rose-600">Debited Amount</div>
                    <div className="font-bold text-rose-700 text-base">
                      <PriceFormatter paise={result.manipulatedAction.manipulatedAmountPaise} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-rose-700 bg-rose-100/70 p-2.5 rounded-lg border border-rose-200">
                  <span className="font-semibold">Execution Cause: </span>
                  {result.manipulatedAction.explanation}
                </div>
              </div>
            </div>
          </div>

          {/* Malicious Instruction Inside Product Page */}
          <div className="niyat-card p-5 border-slate-300 bg-slate-900 text-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Malicious Instruction Found Inside Product Page HTML
              </span>
              <span className="text-[11px] text-slate-400">Prompt Injection Payload</span>
            </div>
            <pre className="font-mono text-xs text-slate-200 bg-slate-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap border border-slate-800">
              {result.attackPayloadDetected}
            </pre>
          </div>

          {/* Security Failure Analysis */}
          <div className="niyat-card p-6 border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-[#172033]">
              Security Failure Root Cause Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-500 uppercase">Vulnerability</div>
                <div className="text-slate-800 font-medium">{result.securityFailureAnalysis.vulnerability}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-500 uppercase">Why It Happened</div>
                <div className="text-slate-800 font-medium">{result.securityFailureAnalysis.rootCause}</div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-1">
                <div className="font-bold text-blue-700 uppercase">How NIYAT Solves It</div>
                <div className="text-blue-900 font-medium">{result.securityFailureAnalysis.howNiyatFixesThis}</div>
              </div>
            </div>
          </div>

          {/* Seamless Call to Action to Part 2: NIYAT Protected Mode */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-elevated">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Ready for Step 2?
              </span>
              <h3 className="text-lg font-bold">
                Run the Exact Same Request with NIYAT Protected Mode
              </h3>
              <p className="text-xs text-blue-100 max-w-xl">
                See how NIYAT extracts a signed intent contract, uses Market Intelligence to find verified offers,
                and blocks prompt injection with its deterministic Blind Verifier.
              </p>
            </div>

            <button
              onClick={() => navigate('/protected-mode', { state: { prefilledPrompt: prompt } })}
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition shadow-sm flex items-center gap-2 shrink-0"
            >
              <span>Proceed to Part 2: NIYAT Mode</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
