import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { NormalSimulationResult } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import {
  ShieldAlert,
  AlertTriangle,
  Play,
  ChevronRight
} from 'lucide-react';

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
    <div className="px-4 py-5 space-y-5">
      {/* Header & Mode Badge */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FBEDED] text-[#D64C55] border border-[#F7D2D5] flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D64C55]" />
            Part 1: Normal Shopping (Vulnerable)
          </span>
          <span className="text-[10px] text-[#766B82] font-semibold uppercase tracking-wider">
            Step 1 of 2
          </span>
        </div>
        <h1 className="text-xl font-black text-[#261633] tracking-tight">
          Vulnerable AI Agent Simulation
        </h1>
        <p className="text-xs text-[#766B82] leading-relaxed">
          Standard shopping agents ingest raw web pages without intent boundaries. Malicious instructions inside product pages can hijack the agent into unauthorized purchases.
        </p>
      </div>

      {/* Educational Notice Banner */}
      <div className="bg-[#FDF5E7] border border-[#F5DFB3] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#261633]">
        <AlertTriangle className="w-4 h-4 text-[#D99A32] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[#D99A32]">Educational Demonstration:</span>
          <p className="text-[11px] text-[#766B82] leading-snug">
            All merchant listings, prices, and payments are synthetic DEMO DATA. Demonstrates prompt injection attacks with zero real fund exposure.
          </p>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="niyat-card p-4 space-y-3.5 shadow-card">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
          User Shopping Request
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Buy 2 litres of Amul Taaza milk under ₹150."
            className="w-full px-3.5 py-3 rounded-xl border border-[#E8E2EF] text-xs font-medium text-[#261633] focus:outline-none focus:ring-2 focus:ring-[#D64C55]/30 focus:border-[#D64C55] bg-white transition"
          />
          <button
            onClick={() => handleSimulate()}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#D64C55] hover:bg-[#C03942] text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Attack...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Normal Agent (Vulnerable)</span>
              </span>
            )}
          </button>
        </div>

        {/* Quick Example Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">Try Examples:</span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(s);
                  handleSimulate(s);
                }}
                className="text-[11px] font-medium bg-[#F3F1F8] hover:bg-[#F3EDF9] text-[#261633] border border-[#E8E2EF] px-2.5 py-1 rounded-lg transition text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-[#FBEDED] text-[#D64C55] text-xs font-medium border border-[#F7D2D5]">
          {error}
        </div>
      )}

      {/* Simulation Result Breakdown */}
      {result && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D64C55] animate-ping" />
            <h2 className="text-sm font-extrabold text-[#261633]">
              Attack Simulation Breakdown
            </h2>
          </div>

          {/* Side-by-Side / Stack: What User Asked vs What Agent Executed */}
          <div className="space-y-3">
            {/* Card 1: What User Intended */}
            <div className="niyat-card p-4 space-y-2.5 border-[#E8E2EF]">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2EF]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                  Original User Intent
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F3F1F8] text-[#261633]">
                  Expected Goal
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold">Prompt</span>
                  <p className="font-semibold text-[#261633]">"{result.originalUserIntent}"</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-[#F3F1F8] p-2 rounded-xl">
                    <span className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold block">Category</span>
                    <span className="font-semibold text-[#261633]">{result.extractedGoal.category}</span>
                  </div>
                  <div className="bg-[#F3F1F8] p-2 rounded-xl">
                    <span className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold block">Quantity</span>
                    <span className="font-semibold text-[#261633]">{result.extractedGoal.quantity} Units</span>
                  </div>
                  <div className="bg-[#F3F1F8] p-2 rounded-xl">
                    <span className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold block">Max Budget</span>
                    <span className="font-semibold text-[#261633]">
                      <PriceFormatter paise={result.extractedGoal.budgetPaise} />
                    </span>
                  </div>
                  <div className="bg-[#F3F1F8] p-2 rounded-xl">
                    <span className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold block">Product</span>
                    <span className="font-semibold text-[#261633] truncate block">{result.productInspected.title}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: What the Manipulated Agent Executed */}
            <div className="niyat-card p-4 space-y-2.5 border-[#F7D2D5] bg-[#FBEDED]/25">
              <div className="flex items-center justify-between pb-2 border-b border-[#F7D2D5]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D64C55] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Manipulated Execution
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FBEDED] text-[#D64C55] border border-[#F7D2D5]">
                  UNAUTHORIZED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#D64C55] uppercase tracking-wider font-semibold">Attack Vector</span>
                  <p className="font-bold text-[#261633]">{result.manipulatedAction.manipulationType}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2 rounded-xl border border-[#F7D2D5]">
                    <span className="text-[10px] text-[#D64C55] uppercase tracking-wider font-semibold block">Diverted Payee</span>
                    <span className="font-mono text-[11px] font-bold text-[#D64C55] truncate block">
                      {result.manipulatedAction.divertedPayee}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#F7D2D5]">
                    <span className="text-[10px] text-[#D64C55] uppercase tracking-wider font-semibold block">Debited Amount</span>
                    <span className="font-extrabold text-[#D64C55] text-sm block">
                      <PriceFormatter paise={result.manipulatedAction.manipulatedAmountPaise} />
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#F7D2D5] text-[11px] text-[#261633] leading-relaxed">
                  <span className="font-bold text-[#D64C55]">Execution Cause: </span>
                  {result.manipulatedAction.explanation}
                </div>
              </div>
            </div>
          </div>

          {/* Malicious Prompt Injection Payload in HTML — Deep Plum Card */}
          <div className="niyat-card-plum p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FDF5E7] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D99A32]" />
                Hidden Instruction Found in Page HTML
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                Prompt Injection
              </span>
            </div>
            <pre className="font-mono text-[11px] text-[#E8E2EF] bg-black/30 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap border border-white/10 leading-relaxed">
              {result.attackPayloadDetected}
            </pre>
          </div>

          {/* Root Cause Analysis Cards */}
          <div className="niyat-card p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
              Security Failure Analysis
            </span>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF] space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] block">Vulnerability</span>
                <p className="font-semibold text-[#261633]">{result.securityFailureAnalysis.vulnerability}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF] space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] block">Root Cause</span>
                <p className="font-medium text-[#766B82] leading-snug">{result.securityFailureAnalysis.rootCause}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F3EDF9] border border-[#E8E2EF] space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#663A91] block">How NIYAT Solves It</span>
                <p className="font-medium text-[#261633] leading-snug">{result.securityFailureAnalysis.howNiyatFixesThis}</p>
              </div>
            </div>
          </div>

          {/* SwitchPay CTA: Transition to Part 2 NIYAT Protected Mode */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#351B4D] via-[#482568] to-[#663A91] text-white space-y-3 shadow-plum">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3EDF9] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                Step 2 of 2
              </span>
              <h3 className="text-sm font-extrabold text-white">
                Test the Exact Same Request in NIYAT Protected Mode
              </h3>
              <p className="text-xs text-[#E8E2EF]/80 leading-relaxed">
                See how NIYAT extracts a signed intent contract, uses Market Intelligence to assess landed prices, and deterministic Blind Verifier blocks the prompt injection.
              </p>
            </div>

            <button
              onClick={() => navigate('/protected-mode', { state: { prefilledPrompt: prompt } })}
              className="w-full py-3 px-4 rounded-xl bg-white text-[#663A91] hover:bg-[#F3EDF9] font-bold text-xs flex items-center justify-center gap-2 transition shadow-card active:scale-[0.98]"
            >
              <span>Proceed to Part 2: NIYAT Mode</span>
              <ChevronRight className="w-4 h-4 text-[#663A91]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
