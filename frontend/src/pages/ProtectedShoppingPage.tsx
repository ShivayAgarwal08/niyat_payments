import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  SignedIntentContract,
  MarketIntelligenceReport,
  BlindVerifierDecision,
  MarketAssessmentRecord
} from '../services/types.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
  Check,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ShieldAlert
} from 'lucide-react';

export const ProtectedShoppingPage: React.FC = () => {
  const location = useLocation();
  const prefill = (location.state as any)?.prefilledPrompt || 'Find me 1 litre of Amul Taaza milk for around ₹150.';

  const [prompt, setPrompt] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intent & Shopping Agent State
  const [contract, setContract] = useState<SignedIntentContract | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligenceReport | null>(null);
  const [assessment, setAssessment] = useState<MarketAssessmentRecord | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<MarketIntelligenceReport['offers'][0] | null>(null);
  const [userAcknowledgedAdvisory, setUserAcknowledgedAdvisory] = useState(false);

  // Security Verification & NIYAT Wall State
  const [verifierDecision, setVerifierDecision] = useState<BlindVerifierDecision | null>(null);
  const [simulatedPaymentResult, setSimulatedPaymentResult] = useState<any>(null);
  const [testScenario, setTestScenario] = useState<'NORMAL' | 'INFLATED_2000' | 'EXTREME_5000' | 'SLIGHT_VARIANCE_180' | 'DIVERTED_PAYEE'>('NORMAL');

  // Interactive Clarification State (Priority 1)
  const [clarification, setClarification] = useState<{
    required: boolean;
    question: string;
    parsedIntent?: any;
  } | null>(null);
  const [clarificationInput, setClarificationInput] = useState('');

  useEffect(() => {
    if ((location.state as any)?.prefilledPrompt) {
      setPrompt((location.state as any).prefilledPrompt);
    }
  }, [location.state]);

  const handlePreparePurchase = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setVerifierDecision(null);
    setSimulatedPaymentResult(null);
    try {
      const data = await api.prepareProtected(activePrompt);

      if (data.requiresClarification) {
        setClarification({
          required: true,
          question: data.clarificationQuestion || 'Please clarify your spending limit or requirements.',
          parsedIntent: data.parsedIntent
        });
        setLoading(false);
        return;
      }

      setClarification(null);
      setContract(data.contract);
      setMarketIntelligence(data.marketIntelligence);
      setAssessment(data.assessment || null);
      setSelectedOffer(data.recommendedOffer);
      setUserAcknowledgedAdvisory(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to prepare purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationInput.trim()) return;

    const combined = `${prompt.trim()}, ${clarificationInput.trim()}`;
    setPrompt(combined);
    setClarificationInput('');
    handlePreparePurchase(combined);
  };

  const handleExecutePurchase = async (userConfirmedVariance = false) => {
    if (!contract || !selectedOffer || executing) return;
    const assessmentId = assessment?.assessmentId || marketIntelligence?.assessmentId;
    if (!assessmentId) {
      setError('Market assessment ID missing. Please analyze purchase again.');
      return;
    }

    setExecuting(true);
    setError(null);

    // Apply test manipulation parameters based on selected evaluation scenario
    let customTotalAmountPaise: number | undefined;
    let customPayeeAddress: string | undefined;

    if (!userConfirmedVariance) {
      if (testScenario === 'INFLATED_2000') {
        customTotalAmountPaise = 200000; // ₹2,000.00 (Test B)
      } else if (testScenario === 'EXTREME_5000') {
        customTotalAmountPaise = 500000; // ₹5,000.00 (Test C)
      } else if (testScenario === 'SLIGHT_VARIANCE_180') {
        customTotalAmountPaise = 18000; // ₹180.00 (+20%) (Test D)
      } else if (testScenario === 'DIVERTED_PAYEE') {
        customPayeeAddress = 'diverted_attacker@upi'; // (Test F)
      }
    } else {
      // User is approving the revised amount for Test D
      customTotalAmountPaise = 18000;
    }

    try {
      const data = await api.executeProtected({
        contract,
        selectedOffer,
        assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: userAcknowledgedAdvisory || undefined,
        userConfirmedVariance: userConfirmedVariance || undefined,
        customTotalAmountPaise,
        customPayeeAddress
      });
      setVerifierDecision(data.verifierDecision);
      setSimulatedPaymentResult(data.simulatedPaymentResult);
    } catch (err: any) {
      const serverCode = err?.response?.data?.code;
      const serverMsg = err?.response?.data?.error || err.message || 'Verification execution failed';
      if (serverCode === 'ADVISORY_ACKNOWLEDGEMENT_REQUIRED') {
        setError('Market advisory requires your explicit acknowledgement before payment.');
      } else if (serverCode === 'ASSESSMENT_ALREADY_CONSUMED') {
        setError('This market assessment has already been consumed. Please start a fresh purchase.');
      } else {
        setError(serverMsg);
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleRejectRevisedAmount = () => {
    if (!verifierDecision || !selectedOffer) return;
    setVerifierDecision({
      ...verifierDecision,
      decision: 'BLOCK',
      reasons: ['User rejected price variance of ₹180.00. Payment cancelled by user.'],
      securityAlert: 'Payment Cancelled: User rejected price variance'
    });
    setSimulatedPaymentResult({
      txId: `niyat_cancelled_${Date.now()}`,
      status: 'BLOCKED',
      amountPaise: 18000,
      payeeAddress: selectedOffer.payeeAddress,
      timestamp: new Date().toISOString()
    });
  };

  const handleReset = () => {
    setContract(null);
    setMarketIntelligence(null);
    setAssessment(null);
    setSelectedOffer(null);
    setUserAcknowledgedAdvisory(false);
    setVerifierDecision(null);
    setSimulatedPaymentResult(null);
    setClarification(null);
    setClarificationInput('');
    setTestScenario('NORMAL');
    setError(null);
  };

  const samplePrompts = [
    'Find me 1 litre of Amul Taaza milk for around ₹150.',
    'Buy 1 Apple MacBook Air M2 under ₹85,000.',
    'Buy 2 packs of Amul butter under ₹200.',
    'Ek litre Amul Taaza doodh chahiye 150 rupaye me',
    'Amul Taaza doodh chahiye' // Incomplete (Clarification test)
  ];

  const requiresAck = Boolean(assessment?.requiresAcknowledgement || marketIntelligence?.requiresAcknowledgement);

  // Calculate Landed Price for selected offer
  const quantity = contract ? Math.max(1, Math.round(contract.quantity)) : 1;
  const basePricePaise = selectedOffer ? selectedOffer.basePricePaise * quantity : 0;
  const deliveryFeePaise = selectedOffer ? selectedOffer.deliveryFeePaise : 0;
  const platformFeePaise = selectedOffer ? selectedOffer.handlingFeePaise : 0;
  const totalLandedPaise = selectedOffer ? (selectedOffer.landedPricePaise * quantity) : 0;

  // Requested price under test scenario
  let displayRequestedPaise = totalLandedPaise;
  if (testScenario === 'INFLATED_2000') displayRequestedPaise = 200000;
  if (testScenario === 'EXTREME_5000') displayRequestedPaise = 500000;
  if (testScenario === 'SLIGHT_VARIANCE_180') displayRequestedPaise = 18000;

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in pb-20">
      {/* 1. Header & Identity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              The NIYAT Wall
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Independent Security Layer
            </span>
          </div>
          {contract && (
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Reset Session
            </button>
          )}
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          AI Shopping & Payment Firewall
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your AI shopping agent can search, compare, and propose orders, but cannot spend your money without passing independent NIYAT Wall verification.
        </p>
      </div>

      {/* STEP 1 — NATURAL LANGUAGE REQUEST */}
      <div className="card p-5 space-y-3 bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>STEP 1 — WHAT DO YOU WANT TO BUY?</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-400">English • Hindi • Hinglish</span>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading || contract !== null}
            placeholder="e.g. Find me 1 litre of Amul Taaza milk for around ₹150."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition disabled:bg-slate-50 disabled:text-slate-700"
          />

          {!contract && (
            <>
              <button
                onClick={() => handlePreparePurchase()}
                disabled={loading || !prompt.trim()}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition touch-target"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Shopping Agent Searching & Comparing...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Shopping Agent</span>
                  </span>
                )}
              </button>

              {/* Sample Prompts */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Examples:
                </span>
                <div className="flex flex-col gap-1.5">
                  {samplePrompts.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(s)}
                      className="text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* INTERACTIVE INTENT CLARIFICATION BANNER (Priority 1) */}
      {clarification?.required && !contract && (
        <div className="card p-5 space-y-4 bg-amber-50/70 border-amber-300 shadow-sm animate-fade-in">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Interactive Clarification Required
                </span>
                <h2 className="text-sm font-bold text-amber-950 mt-0.5">
                  Missing Budget — Spending Limit Unspecified
                </h2>
              </div>
            </div>
            <button
              onClick={() => setClarification(null)}
              className="text-xs text-amber-700 hover:text-amber-900 font-semibold touch-target"
            >
              Dismiss
            </button>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 shadow-2xs">
            <p className="font-semibold text-[13px] text-amber-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{clarification.question}</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              NIYAT's payment firewall never invents or guesses a budget without your consent. No intent contract will be signed until you confirm your maximum budget and requirements.
            </p>
          </div>

          {clarification.parsedIntent && (
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-100/40 p-2.5 rounded-lg border border-amber-200/60">
              <div>
                <span className="text-slate-500 font-medium">Recognized Item:</span>{' '}
                <span className="font-bold text-slate-800">{clarification.parsedIntent.productName || 'Any'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Quantity:</span>{' '}
                <span className="font-bold text-slate-800">{clarification.parsedIntent.quantity || 1} {clarification.parsedIntent.unit || 'unit'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Brand:</span>{' '}
                <span className="font-bold text-slate-800">{clarification.parsedIntent.preferredBrand || 'Any'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Budget:</span>{' '}
                <span className="font-bold text-rose-600">Pending Clarification</span>
              </div>
            </div>
          )}

          {/* Quick budget chip helpers */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Quick Budget Options:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'around ₹150',
                'under ₹100',
                'under ₹200',
                'under ₹500',
                'under ₹1,000',
                'under ₹85,000'
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    const combined = `${prompt.trim()}, ${chip}`;
                    setPrompt(combined);
                    handlePreparePurchase(combined);
                  }}
                  className="text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg transition active:scale-95 shadow-2xs touch-target"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleClarificationSubmit} className="space-y-2 pt-1">
            <input
              type="text"
              value={clarificationInput}
              onChange={e => setClarificationInput(e.target.value)}
              placeholder="e.g. around ₹150 or 2 packs under ₹200"
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white touch-target"
            />
            <button
              type="submit"
              disabled={!clarificationInput.trim() || loading}
              className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 touch-target"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Confirm Budget & Bind Intent Contract</span>
            </button>
          </form>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 2 THROUGH 6 — RENDERED WHEN INTENT IS PREPARED */}
      {contract && selectedOffer && (
        <div className="space-y-5">
          {/* STEP 2 — AI UNDERSTANDS THE REQUEST */}
          <div className="card p-5 space-y-3 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>STEP 2 — EXTRACTED INTENT & CONTRACT</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                HMAC-SHA256 Signed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Product</span>
                <span className="font-bold text-slate-900">{contract.productName}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Brand & Variant</span>
                <span className="font-bold text-slate-900">{contract.preferredBrand} ({contract.variantOrModel})</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Quantity</span>
                <span className="font-bold text-slate-900">{contract.quantity} {contract.unit}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Max Authorized Budget</span>
                <span className="font-extrabold text-blue-700 font-mono">
                  ₹{(contract.maxBudgetPaise / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100/60 border border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-1.5 truncate">
                <Lock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span className="truncate">Nonce: {contract.nonce}</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold shrink-0">Fresh • Unspent</span>
            </div>
          </div>

          {/* STEP 3 — SHOPPING AGENT (Browse, Compare, Select) */}
          <div className="card p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>STEP 3 — SHOPPING AGENT MERCHANT COMPARISON</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                SYNTHETIC_DEMO DATA
              </span>
            </div>

            <p className="text-xs text-slate-600">
              The AI agent searched the catalogue and retrieved multiple merchant offers. Select your merchant:
            </p>

            {/* Merchant Offer Cards Side-by-Side */}
            <div className="space-y-2">
              {marketIntelligence?.offers.map((offer) => {
                const isSelected = selectedOffer.merchantId === offer.merchantId;
                const totalPaise = offer.landedPricePaise * quantity;

                return (
                  <div
                    key={offer.merchantId}
                    onClick={() => setSelectedOffer(offer)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{offer.merchantName}</span>
                        {offer.isRecommended && (
                          <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                            Recommended
                          </span>
                        )}
                        {(offer as any).isVerified && (
                          <span className="text-[9px] font-semibold text-emerald-700">✓ Verified</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Base: ₹{(offer.basePricePaise / 100).toFixed(2)} • Delivery: ₹{(offer.deliveryFeePaise / 100).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Payee: {offer.payeeAddress}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        ₹{(totalPaise / 100).toFixed(2)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Landed Price</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Market Intelligence Corridors & Advisory */}
            {marketIntelligence && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Market Intelligence Benchmark</span>
                  </span>
                  <StatusBadge status={marketIntelligence.decision as any} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">7-Day</span>
                    <span className="font-extrabold text-slate-900">
                      ₹{marketIntelligence.trends?.window7Day?.averagePaise ? (marketIntelligence.trends.window7Day.averagePaise / 100).toFixed(2) : '53.75'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">30-Day Median</span>
                    <span className="font-extrabold text-slate-900">
                      ₹{marketIntelligence.trends?.window30Day?.averagePaise ? (marketIntelligence.trends.window30Day.averagePaise / 100).toFixed(2) : '54.00'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">90-Day Trend</span>
                    <span className="font-extrabold text-slate-900">
                      ₹{marketIntelligence.trends?.window90Day?.averagePaise ? (marketIntelligence.trends.window90Day.averagePaise / 100).toFixed(2) : '53.33'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  {marketIntelligence.decisionReason || 'Market benchmark calculated from dense historical synthetic observations. Provenance: SYNTHETIC_DEMO.'}
                </p>

                {requiresAck && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="ackAdvisory"
                      checked={userAcknowledgedAdvisory}
                      onChange={e => setUserAcknowledgedAdvisory(e.target.checked)}
                      className="mt-0.5 rounded border-amber-400"
                    />
                    <label htmlFor="ackAdvisory" className="text-[11px] font-semibold cursor-pointer">
                      I acknowledge the market pricing advisory and confirm proceeding.
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 4 — CHECKOUT & ATTACK SIMULATION TESTING */}
          <div className="card p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>STEP 4 — CHECKOUT ORDER SUMMARY</span>
              </span>
              <span className="text-[10px] font-semibold text-blue-600">Ready to Submit</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Product Item ({quantity} {contract.unit}):</span>
                <span className="font-bold text-slate-900">₹{(basePricePaise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Delivery Fee ({selectedOffer.merchantName}):</span>
                <span className="font-bold text-slate-900">₹{(deliveryFeePaise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Platform Handling Fee:</span>
                <span className="font-bold text-slate-900">₹{(platformFeePaise / 100).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold">
                <span className="text-slate-900">Final Landed Payable:</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  ₹{(totalLandedPaise / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Test Attack / Scenario Selector for Evaluators */}
            <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
                  <span>Security Test Scenario:</span>
                </span>
                <span className="text-[10px] text-blue-600 font-bold">Try Attacks</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTestScenario('NORMAL')}
                  className={`p-2 rounded-lg font-bold text-left border transition ${
                    testScenario === 'NORMAL'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px]">Normal (₹{(totalLandedPaise / 100).toFixed(2)})</div>
                  <div className="text-[9px] opacity-80 font-normal">Expected: ALLOW</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('SLIGHT_VARIANCE_180')}
                  className={`p-2 rounded-lg font-bold text-left border transition ${
                    testScenario === 'SLIGHT_VARIANCE_180'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px]">Variance to ₹180 (+20%)</div>
                  <div className="text-[9px] opacity-80 font-normal">Expected: ASK</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('INFLATED_2000')}
                  className={`p-2 rounded-lg font-bold text-left border transition ${
                    testScenario === 'INFLATED_2000'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px]">Inflate to ₹2,000</div>
                  <div className="text-[9px] opacity-80 font-normal">Expected: BLOCK</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('EXTREME_5000')}
                  className={`p-2 rounded-lg font-bold text-left border transition ${
                    testScenario === 'EXTREME_5000'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px]">Inflate to ₹5,000</div>
                  <div className="text-[9px] opacity-80 font-normal">Expected: BLOCK</div>
                </button>
              </div>

              {testScenario !== 'NORMAL' && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium">
                  Attack simulation configured: The AI shopping agent will request <strong>₹{(displayRequestedPaise / 100).toFixed(2)}</strong>. The NIYAT Wall will intercept this payment request.
                </div>
              )}
            </div>

            {/* Submission Action */}
            <div className="space-y-2">
              <button
                onClick={() => handleExecutePurchase(false)}
                disabled={executing || (requiresAck && !userAcknowledgedAdvisory)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition touch-target"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>NIYAT Wall Intercepting & Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Submit Payment Request to NIYAT Wall</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400 font-medium">
                The shopping agent creates the payment request. It cannot execute payment without passing NIYAT verification.
              </p>
            </div>
          </div>

          {/* STEP 5 & 6 — THE NIYAT WALL VERIFICATION SCREEN */}
          {verifierDecision && (
            <div className="card p-5 space-y-4 border-2 shadow-elevated animate-fade-in bg-white border-slate-900">
              {/* Wall Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      STEP 5 & 6 — THE NIYAT WALL
                    </span>
                    <h2 className="text-sm font-black text-slate-900 mt-0.5">
                      Independent Payment Verification
                    </h2>
                  </div>
                </div>
                <StatusBadge status={verifierDecision.decision as any} />
              </div>

              {/* 7 Verification Security Checks */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  7 Mandatory Verification Gates:
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">1. Intent Cryptography (HMAC & TTL)</span>
                    <span className={verifierDecision.checks.signatureValid && verifierDecision.checks.unexpired ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {verifierDecision.checks.signatureValid && verifierDecision.checks.unexpired ? '✓ Valid' : '✗ Tampered'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">2. Nonce Replay Prevention (Single-Use)</span>
                    <span className={verifierDecision.checks.nonceFresh ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {verifierDecision.checks.nonceFresh ? '✓ Fresh' : '✗ Replayed'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">3. Product & Brand Parity ({contract.productName})</span>
                    <span className={verifierDecision.checks.productMatch && verifierDecision.checks.brandAndVariantMatch ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {verifierDecision.checks.productMatch && verifierDecision.checks.brandAndVariantMatch ? '✓ Verified' : '✗ Mismatch'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">4. Quantity & Unit Integrity ({contract.quantity} {contract.unit})</span>
                    <span className={verifierDecision.checks.quantityMatch ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {verifierDecision.checks.quantityMatch ? '✓ Exact' : '✗ Manipulated'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">5. Merchant Payee Recipient ({selectedOffer.payeeAddress})</span>
                    <span className={verifierDecision.checks.payeeMatch ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {verifierDecision.checks.payeeMatch ? '✓ Authorized' : '✗ Diverted'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">6. Budget Firewall (Intended: ₹{(contract.maxBudgetPaise / 100).toFixed(2)})</span>
                    <span className={verifierDecision.checks.withinBudget ? 'text-emerald-700 font-bold' : (verifierDecision.decision === 'ASK' ? 'text-amber-700 font-bold' : 'text-rose-600 font-bold')}>
                      {verifierDecision.checks.withinBudget ? '✓ In Budget' : (verifierDecision.decision === 'ASK' ? '⚠ +20% Variance' : '✗ Over Budget')}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">7. User Authorization & Consent</span>
                    <span className={verifierDecision.checks.authorizationValid ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {verifierDecision.checks.authorizationValid ? '✓ Approved' : '✗ Autonomous Denied'}
                    </span>
                  </div>
                </div>
              </div>

              {/* THREE POSSIBLE DECISION RESULTS */}

              {/* DECISION 1: ALLOW */}
              {verifierDecision.decision === 'ALLOW' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <h3 className="font-black text-sm text-emerald-900 uppercase tracking-wide">
                      NIYAT VERIFIED — PAYMENT APPROVED
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-800 leading-normal">
                    All 7 independent security gates passed. The proposed payment matches your cryptographically signed intent. Simulated atomic settlement executed.
                  </p>
                  {simulatedPaymentResult && (
                    <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200 text-xs font-mono space-y-0.5">
                      <div>Tx ID: {simulatedPaymentResult.txId}</div>
                      <div>Amount: ₹{(simulatedPaymentResult.amountPaise / 100).toFixed(2)}</div>
                      <div>Status: <span className="font-bold text-emerald-700">SETTLED</span></div>
                    </div>
                  )}
                </div>
              )}

              {/* DECISION 2: ASK (Slight Price Variance e.g. ₹180 vs ₹150) */}
              {verifierDecision.decision === 'ASK' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h3 className="font-black text-sm text-amber-900 uppercase tracking-wide">
                      NIYAT REVIEW REQUIRED — PRICE VARIANCE DETECTED
                    </h3>
                  </div>
                  <div className="text-xs text-amber-900 space-y-1">
                    <p>
                      The shopping agent is requesting <strong>₹180.00</strong>, which exceeds your estimated budget of <strong>₹150.00</strong> by +20.0% (+₹30.00).
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Payment is paused by the NIYAT Wall. Money will not move without your explicit approval of the revised amount.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleExecutePurchase(true)}
                      disabled={executing}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition touch-target"
                    >
                      {executing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Approve Revised Amount (₹180)</span>
                    </button>
                    <button
                      onClick={handleRejectRevisedAmount}
                      className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition touch-target"
                    >
                      Reject Payment
                    </button>
                  </div>
                </div>
              )}

              {/* DECISION 3: BLOCK (Inflation ₹2,000 / ₹5,000 or Payee Diversion) */}
              {verifierDecision.decision === 'BLOCK' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <h3 className="font-black text-sm text-rose-900 uppercase tracking-wide">
                      NIYAT BLOCKED THIS PAYMENT
                    </h3>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-rose-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expected Intended Budget:</span>
                      <span className="font-bold text-slate-800">₹{(contract.maxBudgetPaise / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-600 font-semibold">Agent Requested Price:</span>
                      <span className="font-black text-rose-700">₹{(displayRequestedPaise / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discrepancy / Surcharge:</span>
                      <span className="font-extrabold text-rose-800">
                        +₹{((displayRequestedPaise - contract.maxBudgetPaise) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-rose-900 space-y-1">
                    <p className="font-semibold">Reason for Interception:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {verifierDecision.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">
                      Wallet Protection Verified: Zero funds debited. Your simulated wallet balance is 100% untouched.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
