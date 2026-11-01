import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  SignedIntentContract,
  MarketIntelligenceReport,
  BlindVerifierDecision,
  MarketAssessmentRecord
} from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  Check,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export const ProtectedShoppingPage: React.FC = () => {
  const location = useLocation();
  const prefill = (location.state as any)?.prefilledPrompt || 'Buy one pack of Amul Taaza milk under ₹100.';

  const [prompt, setPrompt] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Mode State
  const [contract, setContract] = useState<SignedIntentContract | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligenceReport | null>(null);
  const [assessment, setAssessment] = useState<MarketAssessmentRecord | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<MarketIntelligenceReport['offers'][0] | null>(null);
  const [userAcknowledgedAdvisory, setUserAcknowledgedAdvisory] = useState(false);
  const [verifierDecision, setVerifierDecision] = useState<BlindVerifierDecision | null>(null);
  const [simulatedPaymentResult, setSimulatedPaymentResult] = useState<any>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Priority 1: Interactive Intent Clarification State
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

      // Check if interactive clarification is demanded
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

    // Combine original request with user clarification while preserving extracted intent
    const combined = `${prompt.trim()}, ${clarificationInput.trim()}`;
    setPrompt(combined);
    setClarificationInput('');
    handlePreparePurchase(combined);
  };

  const handleExecutePurchase = async () => {
    if (!contract || !selectedOffer || executing) return;
    const assessmentId = assessment?.assessmentId || marketIntelligence?.assessmentId;
    if (!assessmentId) {
      setError('Market assessment ID missing. Please analyze purchase again.');
      return;
    }

    setExecuting(true);
    setError(null);
    try {
      const data = await api.executeProtected({
        contract,
        selectedOffer,
        assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: userAcknowledgedAdvisory || undefined
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
    setError(null);
  };

  const samplePrompts = [
    'Buy one pack of Amul Taaza milk under ₹100.',
    'Amul Taaza doodh chahiye (Incomplete Hindi - missing budget)',
    'Need one pack of Amul Taaza milk (Incomplete - missing budget)',
    'Buy 1 Apple MacBook Air M2 under ₹85,000.'
  ];

  const requiresAck = Boolean(assessment?.requiresAcknowledgement || marketIntelligence?.requiresAcknowledgement);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 1. Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Protected Shopping
          </span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Intent Firewall Active
          </span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          NIYAT Protected Mode
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every purchase is validated against a cryptographically bound intent agreement and verified by an independent Blind Verifier.
        </p>
      </div>

      {/* 2. STEP 1 — YOUR REQUEST */}
      <div className="fintech-card p-5 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            STEP 1 — YOUR REQUEST
          </span>
          {contract && (
            <button
              onClick={handleReset}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Start New Request
            </button>
          )}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading || contract !== null}
            placeholder="e.g. Buy one pack of Amul Taaza milk under ₹100."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition disabled:bg-slate-50 disabled:text-slate-700"
          />

          {!contract && (
            <>
              <button
                onClick={() => handlePreparePurchase()}
                disabled={loading || !prompt.trim()}
                className="fintech-btn-accent w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-50 touch-target"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Purchase & Market...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Analyze & Secure Purchase</span>
                  </span>
                )}
              </button>

              {/* Sample Chips */}
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

      {/* INTERACTIVE INTENT CLARIFICATION BANNER */}
      {clarification?.required && !contract && (
        <div className="fintech-card p-5 space-y-4 bg-amber-50/70 border-amber-300 shadow-sm animate-fade-in">
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
                  Intent Incomplete — Spending Limit Unspecified
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

          {/* Clarification prompt question */}
          <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 shadow-xs">
            <p className="font-semibold text-[13px] text-amber-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{clarification.question}</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              NIYAT's payment firewall never invents or guesses a budget without your consent. No intent contract will be signed until you confirm your maximum budget and requirements.
            </p>
          </div>

          {/* Recognized fields so far */}
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
                'under ₹100',
                'under ₹150',
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
            <div className="relative">
              <input
                type="text"
                value={clarificationInput}
                onChange={e => setClarificationInput(e.target.value)}
                placeholder="e.g. under ₹100 or 2 packs under ₹150"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white touch-target"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!clarificationInput.trim() || loading}
                className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 touch-target"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Bind Intent</span>
              </button>
            </div>
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

      {/* 3. STEP 2 THROUGH STEP 6 (Rendered when contract prepared) */}
      {contract && selectedOffer && (
        <div className="space-y-4">
          {/* STEP 2 — INTENT CHECK */}
          <div className="fintech-card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                STEP 2 — INTENT CHECK
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Agreement Locked
              </span>
            </div>

            <p className="text-xs text-slate-600">
              NIYAT converted your request into a structured, signed purchase agreement:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Product</span>
                <span className="font-bold text-slate-900">{contract.productName}</span>
                <span className="text-[11px] text-slate-500 block">{contract.preferredBrand} • {contract.variantOrModel}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Quantity</span>
                <span className="font-bold text-slate-900">{contract.quantity} {contract.unit}</span>
                <span className="text-[11px] text-slate-500 block">Single Order</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Authorized Budget Cap</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-extrabold text-sm text-slate-900">
                    <PriceFormatter paise={contract.maxBudgetPaise} />
                  </span>
                  <span className="text-[11px] text-slate-500">Hard limit (cannot be exceeded)</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 — PRICE CHECK (Market Intelligence in plain English) */}
          <div className="fintech-card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                STEP 3 — PRICE CHECK
              </span>
              <StatusBadge status={assessment?.decision || marketIntelligence?.decision || 'INSUFFICIENT_DATA'} size="sm" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Offered Landed Price</span>
                  <div className="font-extrabold text-base text-slate-900">
                    <PriceFormatter paise={selectedOffer.landedPricePaise} />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Item ₹{(selectedOffer.basePricePaise / 100).toFixed(2)} + Delivery ₹{(selectedOffer.deliveryFeePaise / 100).toFixed(2)} + Fees ₹{(selectedOffer.handlingFeePaise / 100).toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Merchant</span>
                  <span className="font-bold text-slate-900 block">{selectedOffer.merchantName}</span>
                  <span className="font-mono text-[10px] text-slate-500">{selectedOffer.payeeAddress}</span>
                </div>
              </div>

              {/* Historical Price Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Historical Reference Price
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    DEMO DATA
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  {marketIntelligence?.priceTrendAdvisory || assessment?.decisionReason || 'Insufficient observation density. Cannot verify fair market median with confidence.'}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 4 — USER ACKNOWLEDGEMENT */}
          <div className="fintech-card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                STEP 4 — USER ACKNOWLEDGEMENT
              </span>
              {requiresAck ? (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Consent Required
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Standard Order
                </span>
              )}
            </div>

            {requiresAck ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-bold block">Advisory notice:</span>
                  <p className="leading-snug">
                    {assessment?.decisionReason || marketIntelligence?.decisionReason || 'Market data for this product is limited. Please confirm you accept this price before proceeding.'}
                  </p>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer touch-target">
                  <input
                    type="checkbox"
                    checked={userAcknowledgedAdvisory}
                    onChange={e => setUserAcknowledgedAdvisory(e.target.checked)}
                    disabled={executing || verifierDecision !== null}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      I have reviewed the price advisory
                    </span>
                    <span className="text-slate-600 leading-snug">
                      I accept the landed price of <PriceFormatter paise={selectedOffer.landedPricePaise} /> and authorize NIYAT to proceed.
                    </span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Price is within verified historical bounds. No special consent required.</span>
              </div>
            )}
          </div>

          {/* STEP 5 — PURCHASE SECURITY CHECK */}
          <div className="fintech-card p-5 space-y-3 bg-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block pb-1 border-b border-slate-100">
              STEP 5 — PURCHASE SECURITY CHECK
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-700">1. Correct product & brand?</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Yes ({contract.preferredBrand})
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-700">2. Correct quantity?</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Yes ({contract.quantity} {contract.unit})
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-700">3. Within budget?</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Yes (₹{(selectedOffer.landedPricePaise / 100).toFixed(2)} &le; ₹{(contract.maxBudgetPaise / 100).toFixed(2)})
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-700">4. Correct merchant & payee?</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Yes ({selectedOffer.payeeAddress})
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-700">5. Valid authorization?</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Bound & Signed
                </span>
              </div>
            </div>
          </div>

          {/* STEP 6 — FINAL DECISION */}
          <div className="fintech-card p-5 space-y-4 bg-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block pb-1 border-b border-slate-100">
              STEP 6 — FINAL DECISION
            </span>

            {!verifierDecision ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Authorize NIYAT's deterministic Blind Verifier to execute atomic authorization.
                </p>

                <button
                  onClick={handleExecutePurchase}
                  disabled={executing || (requiresAck && !userAcknowledgedAdvisory)}
                  className="fintech-btn-primary w-full py-3.5 px-4 text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 active:scale-[0.98] touch-target"
                >
                  {executing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Settling Payment...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-bold">
                      <Lock className="w-4 h-4" />
                      <span>Authorize & Settle Simulated Payment</span>
                    </span>
                  )}
                </button>

                {requiresAck && !userAcknowledgedAdvisory && (
                  <p className="text-[10px] text-center text-amber-700 font-medium">
                    Please acknowledge the price advisory in Step 4 to enable authorization.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Decision Banner */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  verifierDecision.decision === 'ALLOW'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : verifierDecision.decision === 'ASK'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black tracking-wide">
                      DECISION: {verifierDecision.decision}
                    </span>
                    <StatusBadge status={verifierDecision.decision} size="sm" />
                  </div>

                  <p className="text-xs leading-relaxed font-medium">
                    {verifierDecision.decision === 'ALLOW'
                      ? 'Purchase strictly matches your authorised intent. Settlement approved.'
                      : verifierDecision.decision === 'ASK'
                      ? 'User confirmation is required before proceeding.'
                      : 'Purchase violates your authorised intent. Transaction blocked.'}
                  </p>

                  {verifierDecision.reasons?.length > 0 && (
                    <ul className="text-[11px] list-disc list-inside space-y-0.5 pt-1">
                      {verifierDecision.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Simulated Payment Receipt */}
                {simulatedPaymentResult && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Simulated Payment Receipt
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID:</span>
                        <span className="font-mono text-slate-900 font-semibold">{simulatedPaymentResult.txId || 'sim_tx_complete'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount Debited:</span>
                        <span className="font-bold text-slate-900"><PriceFormatter paise={selectedOffer.landedPricePaise} /></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recipient:</span>
                        <span className="font-semibold text-slate-900">{selectedOffer.merchantName} ({selectedOffer.payeeAddress})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-emerald-700">SETTLED (SIMULATED)</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="fintech-btn-secondary w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 touch-target"
                >
                  <span>Start New Protected Purchase</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. OPTIONAL COLLAPSIBLE: "Technical details" (Section 7 Requirement) */}
          <div className="pt-2">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 hover:text-slate-900 flex items-center justify-between touch-target"
            >
              <span className="font-semibold">
                Technical details (HMAC, Nonce & Cryptographic Signatures)
              </span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="p-4 mt-2 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] space-y-2 border border-slate-800 leading-relaxed overflow-x-auto">
                <div>
                  <span className="text-slate-500">Contract ID:</span> {contract.contractId}
                </div>
                <div>
                  <span className="text-slate-500">Replay Nonce:</span> {contract.nonce}
                </div>
                <div>
                  <span className="text-slate-500">Contract HMAC-SHA256:</span>
                  <div className="text-emerald-400 break-all">{contract.signature}</div>
                </div>
                {assessment && (
                  <>
                    <div>
                      <span className="text-slate-500">Assessment ID:</span> {assessment.assessmentId}
                    </div>
                    <div>
                      <span className="text-slate-500">Binding Signature:</span>
                      <div className="text-blue-400 break-all">{assessment.bindingSignature}</div>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-slate-500">Verifier Engine:</span> Deterministic Rule Engine (12 Security Constraints)
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
