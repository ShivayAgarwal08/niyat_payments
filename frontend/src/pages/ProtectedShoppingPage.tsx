import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  SignedIntentContract,
  MarketIntelligenceReport,
  BlindVerifierDecision
} from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  TrendingDown,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const ProtectedShoppingPage: React.FC = () => {
  const location = useLocation();
  const prefill = (location.state as any)?.prefilledPrompt || 'Buy 2 litres of Amul Taaza milk under ₹150.';

  const [prompt, setPrompt] = useState(prefill);
  const [step, setStep] = useState<'INPUT' | 'ANALYSIS' | 'CONFIRMATION' | 'RESULT'>('INPUT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Mode State
  const [contract, setContract] = useState<SignedIntentContract | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligenceReport | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<MarketIntelligenceReport['offers'][0] | null>(null);
  const [userApproved, setUserApproved] = useState(false);
  const [verifierDecision, setVerifierDecision] = useState<BlindVerifierDecision | null>(null);
  const [simulatedPaymentResult, setSimulatedPaymentResult] = useState<any>(null);

  useEffect(() => {
    if ((location.state as any)?.prefilledPrompt) {
      setPrompt((location.state as any).prefilledPrompt);
    }
  }, [location.state]);

  const handlePreparePurchase = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.prepareProtected(prompt);
      setContract(data.contract);
      setMarketIntelligence(data.marketIntelligence);
      setSelectedOffer(data.recommendedOffer);
      setStep('ANALYSIS');
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to prepare purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePurchase = async () => {
    if (!contract || !selectedOffer) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.executeProtected({
        contract,
        selectedOffer,
        userApproved: true
      });
      setVerifierDecision(data.verifierDecision);
      setSimulatedPaymentResult(data.simulatedPaymentResult);
      setStep('RESULT');
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Verification execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('INPUT');
    setContract(null);
    setMarketIntelligence(null);
    setSelectedOffer(null);
    setUserApproved(false);
    setVerifierDecision(null);
    setSimulatedPaymentResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              PART 2 — NIYAT PROTECTED MODE (SECURE)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Step 2 of 2: The Intent Firewall Solution
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Protected AI Shopping & Deterministic Verification
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            NIYAT creates a cryptographically signed contract before exploring the marketplace.
            The AI agent recommends options, but payment authorization is independently validated by a deterministic Blind Verifier.
          </p>
        </div>

        {step !== 'INPUT' && (
          <button
            onClick={handleReset}
            className="niyat-btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>New Intent Request</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* STEP 1: INPUT INTENT REQUEST */}
      {step === 'INPUT' && (
        <div className="niyat-card p-6 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Shopping Intent Request
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Buy 2 litres of Amul Taaza milk under ₹150."
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            <button
              onClick={handlePreparePurchase}
              disabled={loading}
              className="niyat-btn-primary px-6 py-2.5 text-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing Intent & Analyzing...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Create Signed Contract & Analyze</span>
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Try common categories:</span>
            <button
              onClick={() => setPrompt('Buy 2 litres of Amul Taaza milk under ₹150.')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition"
            >
              Milk (Amul Taaza)
            </button>
            <button
              onClick={() => setPrompt('Buy 1 Apple MacBook Air M2 under ₹85,000.')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition"
            >
              Laptop (MacBook M2)
            </button>
            <button
              onClick={() => setPrompt('Buy 1 pair of Nike running shoes under ₹4,000.')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition"
            >
              Shoes (Nike)
            </button>
            <button
              onClick={() => setPrompt('Get 1 iPhone 15 below ₹70,000.')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition"
            >
              Smartphone (iPhone 15)
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 & 3: ANALYSIS & MARKET INTELLIGENCE INSIDE NIYAT MODE */}
      {(step === 'ANALYSIS' || step === 'CONFIRMATION') && contract && marketIntelligence && (
        <div className="space-y-6">
          {/* Cryptographically Signed Intent Contract Card */}
          <div className="niyat-card p-5 border-blue-200 bg-blue-50/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Signed Intent Contract #{contract.contractId}
                </span>
              </div>
              <span className="text-xs font-mono text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full truncate max-w-xs">
                Nonce: {contract.nonce}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Target Product</span>
                <p className="font-semibold text-slate-800">{contract.productName}</p>
              </div>
              <div>
                <span className="text-slate-400">Brand & Variant</span>
                <p className="font-semibold text-slate-800">{contract.preferredBrand} ({contract.variantOrModel})</p>
              </div>
              <div>
                <span className="text-slate-400">Quantity</span>
                <p className="font-semibold text-slate-800">{contract.quantity} {contract.unit}</p>
              </div>
              <div>
                <span className="text-slate-400">Budget Ceiling</span>
                <p className="font-semibold text-slate-800">
                  <PriceFormatter paise={contract.maxBudgetPaise} />
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 bg-white/80 p-2.5 rounded border border-blue-100 truncate">
              <span className="font-semibold text-blue-800">HMAC-SHA256 Signature: </span>
              {contract.signature}
            </div>
          </div>

          {/* Integrated Market Intelligence: Product & Merchant Comparison */}
          <div className="niyat-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-blue-600" />
                  Integrated Market Intelligence & Merchant Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Calculates true landed prices (Item + Delivery + Handling - Discounts) across verified sellers
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start">
                DEMO DATA
              </span>
            </div>

            {/* Offer Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {marketIntelligence.offers.map((offer, idx) => {
                const isSelected = selectedOffer?.merchantId === offer.merchantId;
                const totalForOrder = offer.landedPricePaise * contract.quantity;
                const isOverBudget = totalForOrder > contract.maxBudgetPaise;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedOffer(offer)}
                    className={`cursor-pointer rounded-xl p-4 border transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#172033]">{offer.merchantName}</span>
                        {offer.isRecommended && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Best Match
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Rating: ★ {offer.merchantRating}</span>
                        <span>•</span>
                        <span className="font-mono truncate">{offer.payeeAddress}</span>
                      </div>

                      {/* Landed Price Breakdown */}
                      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Base item:</span>
                          <PriceFormatter paise={offer.basePricePaise} />
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Delivery fee:</span>
                          <span>{offer.deliveryFeePaise === 0 ? 'FREE' : <PriceFormatter paise={offer.deliveryFeePaise} />}</span>
                        </div>
                        {offer.discountPaise > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Promo discount:</span>
                            <span>-<PriceFormatter paise={offer.discountPaise} /></span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 text-sm">
                          <span>Total ({contract.quantity} {contract.unit}):</span>
                          <span className={isOverBudget ? 'text-rose-600' : 'text-blue-700'}>
                            <PriceFormatter paise={totalForOrder} />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className={isSelected ? 'text-blue-700 font-semibold flex items-center gap-1' : 'text-slate-400'}>
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        {isSelected ? 'Selected Offer' : 'Click to Select'}
                      </span>
                      {isOverBudget && (
                        <span className="text-rose-600 font-medium text-[11px]">Above Budget</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Historical Price Trend Context */}
            {marketIntelligence.priceTrendAdvisory && (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{marketIntelligence.priceTrendAdvisory}</span>
              </div>
            )}
          </div>

          {/* User Review & Purchase Approval Section */}
          {selectedOffer && (
            <div className="niyat-card p-6 border-slate-200 space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  User Review & Purchase Authorization
                </h3>
                <p className="text-xs text-slate-500">
                  NIYAT enforces human-in-the-loop authorization. Autonomous agents cannot silently trigger payments.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Selected Merchant:</span>
                  <span className="text-slate-900 font-bold">{selectedOffer.merchantName}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Verified Payee Address:</span>
                  <span className="font-mono text-slate-900 font-semibold">{selectedOffer.payeeAddress}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Total Purchase Amount:</span>
                  <span className="text-blue-700 font-bold text-sm">
                    <PriceFormatter paise={selectedOffer.landedPricePaise * contract.quantity} />
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Signed Contract Budget:</span>
                  <span className="text-slate-900">
                    <PriceFormatter paise={contract.maxBudgetPaise} />
                  </span>
                </div>
              </div>

              {/* Checkbox for user confirmation */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="userAuthCheck"
                  checked={userApproved}
                  onChange={e => setUserApproved(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="userAuthCheck" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  I explicitly authorize this purchase of {contract.quantity} {contract.unit} from {selectedOffer.merchantName} for <PriceFormatter paise={selectedOffer.landedPricePaise * contract.quantity} showDecimals={true} />.
                </label>
              </div>

              <button
                onClick={handleExecutePurchase}
                disabled={!userApproved || loading}
                className="niyat-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing Blind Verifier...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run Blind Verifier & Execute Protected Payment</span>
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: VERIFICATION RESULT & COMPARISON OUTCOME */}
      {step === 'RESULT' && verifierDecision && contract && selectedOffer && (
        <div className="space-y-6">
          <div className="niyat-card p-6 border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Deterministic Blind Verifier Outcome
                </span>
                <h3 className="text-xl font-bold text-[#172033]">
                  Transaction Verdict: <StatusBadge status={verifierDecision.decision} size="lg" />
                </h3>
              </div>

              {simulatedPaymentResult && (
                <div className="text-right text-xs">
                  <span className="text-slate-400">Simulated Tx ID:</span>
                  <p className="font-mono text-slate-700 font-semibold">{simulatedPaymentResult.txId}</p>
                </div>
              )}
            </div>

            {/* Verifier Independent Checks Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                12 Independent Verification Checks
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>1. Contract Cryptographic Signature</span>
                  {verifierDecision.checks.signatureValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>2. Intent Expiry Window</span>
                  {verifierDecision.checks.unexpired ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>3. Nonce Replay Prevention</span>
                  {verifierDecision.checks.nonceFresh ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>4. Product Identity Match</span>
                  {verifierDecision.checks.productMatch ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>5. Brand & Variant Match</span>
                  {verifierDecision.checks.brandAndVariantMatch ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>6. Quantity & Unit Match</span>
                  {verifierDecision.checks.quantityMatch ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>7 & 8. Verified Payee Identifier</span>
                  {verifierDecision.checks.payeeMatch ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>9 & 10. Within Maximum Budget</span>
                  {verifierDecision.checks.withinBudget ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span>11 & 12. Explicit User Authorization</span>
                  {verifierDecision.checks.authorizationValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Reasons output */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verifier Decision Reasons
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {verifierDecision.reasons.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Why Prompt Injection Failed Here */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Why Hidden Product Page Instructions Could Not Exploit NIYAT:
              </span>
              <p>
                The Blind Verifier never received the raw webpage HTML, user prompts, or AI chain-of-thought traces.
                It validated strictly against the cryptographically signed contract created in Step 2.
                Even if a malicious seller placed hidden prompts demanding extra money or a diverted payee,
                the Blind Verifier would deterministically return BLOCK.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
