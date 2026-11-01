import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { NormalSimulationResult } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import {
  ShieldAlert,
  Play,
  ArrowRight,
  RefreshCw,
  Repeat,
  DollarSign,
  ArrowRightLeft,
  HelpCircle
} from 'lucide-react';

interface ScenarioConfig {
  id: 'UNAUTHORIZED_PURCHASE' | 'ACCIDENTAL_SUBSCRIPTION' | 'PAYMENT_REDIRECT';
  title: string;
  shortDesc: string;
  defaultPrompt: string;
  badgeText: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'UNAUTHORIZED_PURCHASE',
    title: 'Scenario A: Unauthorized Purchase',
    shortDesc: 'Product page persuades agent to upgrade to an expensive bundle, exceeding the budget cap.',
    defaultPrompt: 'Buy one pack of Amul Taaza milk under ₹100.',
    badgeText: 'Budget Override'
  },
  {
    id: 'ACCIDENTAL_SUBSCRIPTION',
    title: 'Scenario B: Accidental Subscription',
    shortDesc: 'Checkout page preselects an auto-renewing subscription instead of a one-time purchase.',
    defaultPrompt: 'Buy this product once.',
    badgeText: 'Recurring Trap'
  },
  {
    id: 'PAYMENT_REDIRECT',
    title: 'Scenario C: Payment Diversion',
    shortDesc: 'Malicious page instruction diverts payment to an attacker VPA instead of the merchant.',
    defaultPrompt: 'Buy Amul Butter under ₹100 from QuickMart Express.',
    badgeText: 'Payee Hijack'
  }
];

export const NormalShoppingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioConfig['id']>('UNAUTHORIZED_PURCHASE');
  const [prompt, setPrompt] = useState(SCENARIOS[0].defaultPrompt);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NormalSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectScenario = (sc: ScenarioConfig) => {
    setSelectedScenarioId(sc.id);
    setPrompt(sc.defaultPrompt);
    setResult(null);
    setError(null);
  };

  const handleSimulate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.simulateNormal(prompt, selectedScenarioId);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 1. Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Vulnerable Demonstration
          </span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Simulated Demo
          </span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Normal Shopping Mode
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          See what happens when an autonomous AI shopping agent has payment authority but no intent firewall.
        </p>
      </div>

      {/* 2. Scenario Selection Cards */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Select Attack Scenario
        </label>
        <div className="grid grid-cols-1 gap-2">
          {SCENARIOS.map(sc => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                disabled={loading}
                className={`p-3.5 rounded-xl border text-left transition touch-target ${
                  isSelected
                    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {sc.title}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {sc.badgeText}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {sc.shortDesc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Input & Execution */}
      <div className="fintech-card p-4 space-y-3 bg-white">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            User Shopping Request
          </label>
          <p className="text-[11px] text-slate-600 mb-2">
            The instructions given to the autonomous agent:
          </p>
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white transition"
          />
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading || !prompt.trim()}
          className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm active:scale-[0.98] touch-target"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Simulating Autonomous Agent...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Normal Agent (Without Firewall)</span>
            </span>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-500">
          Simulated demonstration • No real payments or actual subscriptions created
        </p>
      </div>

      {/* 4. Error Notice */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {error}
        </div>
      )}

      {/* 5. Simulation Outcome */}
      {result && (
        <div className="space-y-4 pt-1">
          {/* Main Threat Outcome Box */}
          {result.scenarioId === 'ACCIDENTAL_SUBSCRIPTION' ? (
            /* SCENARIO B: ACCIDENTAL SUBSCRIPTION OUTCOME */
            <div className="fintech-card p-5 border-rose-300 bg-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-rose-600" />
                  UNINTENDED SUBSCRIPTION
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Simulated
                </span>
              </div>

              {/* Specific breakdown required by prompt */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">User wanted:</span>
                    <span className="font-bold text-slate-900">One-time purchase</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-700 font-medium">Agent selected:</span>
                    <span className="font-bold text-rose-700">Monthly auto-debit subscription</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-rose-200/60">
                    <span className="text-slate-900 font-bold">Recurring charge:</span>
                    <span className="font-black text-rose-700 text-sm">₹499/month (simulated)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">User authorised:</span>
                    <span className="font-semibold text-slate-800">One-time purchase only</span>
                  </div>
                </div>

                {/* Subscription Confirmation Simulation Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Simulated Subscription Confirmation
                  </span>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan:</span>
                      <span className="font-semibold text-slate-900">VIP Dairy Auto-Ship Plan</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Billing Cycle:</span>
                      <span className="font-semibold text-slate-900">1st of every month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-rose-600">Active (Simulated)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : result.scenarioId === 'PAYMENT_REDIRECT' ? (
            /* SCENARIO C: PAYMENT DIVERSION OUTCOME */
            <div className="fintech-card p-5 border-rose-300 bg-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-rose-600" />
                  PAYMENT DIVERSION
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Simulated
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Intended Merchant
                    </span>
                    <p className="font-bold text-slate-900">{result.diversionDetails?.intendedMerchant || 'QuickMart Express'}</p>
                    <p className="font-mono text-[11px] text-slate-600">{result.diversionDetails?.intendedPayee || 'quickmart@upi'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                      Diverted Payee
                    </span>
                    <p className="font-bold text-rose-900">{result.diversionDetails?.divertedMerchant || 'Attacker Account'}</p>
                    <p className="font-mono text-[11px] font-bold text-rose-700">{result.diversionDetails?.divertedPayee || 'rogue_syndicate@upi'}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900">
                  <span className="font-bold">Result: </span>
                  Payment of <PriceFormatter paise={result.manipulatedAction.manipulatedAmountPaise} /> was redirected to an unauthorized recipient address.
                </div>
              </div>
            </div>
          ) : (
            /* SCENARIO A: UNAUTHORIZED PURCHASE / BUDGET OVERRIDE OUTCOME */
            <div className="fintech-card p-5 border-rose-300 bg-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  UNAUTHORIZED PURCHASE
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Simulated
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">User Intent:</span>
                    <span className="font-bold text-slate-900">1 pack under ₹100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-700 font-medium">Agent Selected:</span>
                    <span className="font-bold text-rose-700">Artisanal Reserve 10-Pack</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-rose-200/60">
                    <span className="text-slate-900 font-bold">Total Debited:</span>
                    <span className="font-black text-rose-700 text-sm">₹2,499.00 (simulated)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-700 font-medium">Budget Exceeded By:</span>
                    <span className="font-bold text-rose-700">+₹2,399.00 (+2,399%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. "What went wrong?" Section (Mandatory from prompt) */}
          <div className="fintech-card p-5 space-y-3 bg-white">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                What went wrong?
              </h3>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {result.whatWentWrong || 'The agent followed instructions from the product page instead of strictly following the user\'s original request.'}
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  What you requested:
                </span>
                <p className="text-slate-900 font-medium">
                  {result.simpleComparison?.userRequested || result.originalUserIntent}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                  What the agent actually did:
                </span>
                <p className="text-rose-900 font-medium">
                  {result.simpleComparison?.agentDid || result.manipulatedAction.explanation}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Why this is dangerous:
                </span>
                <p className="text-amber-900 leading-snug">
                  {result.simpleComparison?.whyDangerous || 'When AI agents hold payment authority without intent verification, untrusted websites can manipulate their purchases.'}
                </p>
              </div>
            </div>
          </div>

          {/* 7. Call To Action: Transition to NIYAT Protected Mode */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                The Solution
              </span>
              <h3 className="text-sm font-bold text-white">
                See How NIYAT Protects This Same Purchase
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test this exact request in NIYAT Protected Mode to see how intent binding and independent verification stop prompt injection attacks.
              </p>
            </div>

            <button
              onClick={() => navigate('/protected-mode', { state: { prefilledPrompt: prompt } })}
              className="fintech-btn-accent w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] touch-target"
            >
              <span>Test in NIYAT Protected Mode</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
