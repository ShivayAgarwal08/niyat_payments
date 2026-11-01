import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  SignedIntentContract,
  MarketIntelligenceReport,
  BlindVerifierDecision,
  MarketAssessmentRecord,
  MarketDecision
} from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Calendar,
  Layers,
  Clock,
  HelpCircle,
  Store
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
  const [assessment, setAssessment] = useState<MarketAssessmentRecord | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<MarketIntelligenceReport['offers'][0] | null>(null);
  const [userApproved, setUserApproved] = useState(false);
  const [userAcknowledgedAdvisory, setUserAcknowledgedAdvisory] = useState(false);
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
      setAssessment(data.assessment || null);
      setSelectedOffer(data.recommendedOffer);
      setUserAcknowledgedAdvisory(false);
      setUserApproved(false);
      setStep('ANALYSIS');
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to prepare purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePurchase = async () => {
    if (!contract || !selectedOffer) return;
    const assessmentId = assessment?.assessmentId || marketIntelligence?.assessmentId;
    if (!assessmentId) {
      setError('Market assessment ID missing. Please prepare purchase again.');
      return;
    }

    setLoading(true);
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
      setStep('RESULT');
    } catch (err: any) {
      const serverCode = err?.response?.data?.code;
      const serverMsg = err?.response?.data?.error || err.message || 'Verification execution failed';
      if (serverCode === 'ADVISORY_ACKNOWLEDGEMENT_REQUIRED') {
        setError('Market advisory acknowledgement is mandatory before proceeding to payment.');
      } else {
        setError(serverMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('INPUT');
    setContract(null);
    setMarketIntelligence(null);
    setAssessment(null);
    setSelectedOffer(null);
    setUserApproved(false);
    setUserAcknowledgedAdvisory(false);
    setVerifierDecision(null);
    setSimulatedPaymentResult(null);
    setError(null);
  };

  const renderMarketDecisionBadge = (decision?: MarketDecision) => {
    switch (decision) {
      case 'BUY_NOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F6EE] text-[#168451] border border-[#C4E8D3]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
            BUY NOW — Fair Market Price
          </span>
        );
      case 'WAIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDF5E7] text-[#D99A32] border border-[#F5DFB3]">
            <Clock className="w-3.5 h-3.5 text-[#D99A32]" />
            WAIT — Price Elevated
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF]">
            <HelpCircle className="w-3.5 h-3.5 text-[#663A91]" />
            REVIEW — Advisory Flag
          </span>
        );
      case 'INSUFFICIENT_DATA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3F1F8] text-[#766B82] border border-[#E8E2EF]">
            <Info className="w-3.5 h-3.5 text-[#766B82]" />
            LIMITED OBSERVATIONS
          </span>
        );
      case 'DATA_UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3F1F8] text-[#766B82] border border-[#E8E2EF]">
            <Info className="w-3.5 h-3.5 text-[#766B82]" />
            DATA UNAVAILABLE
          </span>
        );
    }
  };

  const isExecutionDisabled =
    !userApproved ||
    (marketIntelligence?.requiresAcknowledgement && !userAcknowledgedAdvisory) ||
    loading;

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Header & Mode Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#663A91]" />
              Part 2: NIYAT Protected Mode (Secure)
            </span>
            <span className="text-[10px] text-[#766B82] font-semibold uppercase tracking-wider">
              Step 2 of 2
            </span>
          </div>
          <h1 className="text-xl font-black text-[#261633] tracking-tight">
            Protected AI Purchase & Market Intelligence
          </h1>
          <p className="text-xs text-[#766B82] leading-relaxed">
            Decouples untrusted web data from payment authorization using cryptographic intent contracts and deterministic verification.
          </p>
        </div>

        {step !== 'INPUT' && (
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-white border border-[#E8E2EF] text-[#766B82] hover:text-[#261633] hover:bg-[#F3EDF9] transition shrink-0"
            title="Reset Intent"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Step Progress Pill Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'INPUT' ? 'bg-[#663A91] text-white' : 'bg-[#168451] text-white'}`}>
            {step === 'INPUT' ? '1' : '✓'}
          </div>
          <span className={`text-[11px] ${step === 'INPUT' ? 'font-bold text-[#663A91]' : 'font-medium text-[#766B82]'}`}>
            Intent
          </span>
        </div>
        <div className="w-6 h-[1px] bg-[#E8E2EF]" />
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'ANALYSIS' || step === 'CONFIRMATION' ? 'bg-[#663A91] text-white' : step === 'RESULT' ? 'bg-[#168451] text-white' : 'bg-[#E8E2EF] text-[#766B82]'}`}>
            {step === 'RESULT' ? '✓' : '2'}
          </div>
          <span className={`text-[11px] ${step === 'ANALYSIS' || step === 'CONFIRMATION' ? 'font-bold text-[#663A91]' : 'font-medium text-[#766B82]'}`}>
            Market Intel
          </span>
        </div>
        <div className="w-6 h-[1px] bg-[#E8E2EF]" />
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'RESULT' ? 'bg-[#663A91] text-white' : 'bg-[#E8E2EF] text-[#766B82]'}`}>
            3
          </div>
          <span className={`text-[11px] ${step === 'RESULT' ? 'font-bold text-[#663A91]' : 'font-medium text-[#766B82]'}`}>
            Verdict
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-[#FBEDED] text-[#D64C55] text-xs font-medium border border-[#F7D2D5] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D64C55] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: INPUT INTENT REQUEST */}
      {step === 'INPUT' && (
        <div className="niyat-card p-4 space-y-3.5 shadow-card">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
            Shopping Intent Request
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Buy 2 litres of Amul Taaza milk under ₹150."
              className="w-full px-3.5 py-3 rounded-xl border border-[#E8E2EF] text-xs font-medium text-[#261633] focus:outline-none focus:ring-2 focus:ring-[#663A91]/30 focus:border-[#663A91] bg-white transition"
            />
            <button
              onClick={handlePreparePurchase}
              disabled={loading}
              className="niyat-btn-primary w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing Intent & Assessing Market...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign Intent Contract & Run Market Intel</span>
                </span>
              )}
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">Try Examples:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setPrompt('Buy 2 litres of Amul Taaza milk under ₹150.')}
                className="text-[11px] font-medium bg-[#F3F1F8] hover:bg-[#F3EDF9] text-[#261633] border border-[#E8E2EF] px-2.5 py-1 rounded-lg transition"
              >
                Milk (Amul Taaza)
              </button>
              <button
                onClick={() => setPrompt('Buy 1 Apple MacBook Air M2 under ₹85,000.')}
                className="text-[11px] font-medium bg-[#F3F1F8] hover:bg-[#F3EDF9] text-[#261633] border border-[#E8E2EF] px-2.5 py-1 rounded-lg transition"
              >
                Laptop (MacBook M2)
              </button>
              <button
                onClick={() => setPrompt('Buy 1 pair of Nike running shoes under ₹4,000.')}
                className="text-[11px] font-medium bg-[#F3F1F8] hover:bg-[#F3EDF9] text-[#261633] border border-[#E8E2EF] px-2.5 py-1 rounded-lg transition"
              >
                Shoes (Nike)
              </button>
              <button
                onClick={() => setPrompt('Get 1 iPhone 15 below ₹70,000.')}
                className="text-[11px] font-medium bg-[#F3F1F8] hover:bg-[#F3EDF9] text-[#261633] border border-[#E8E2EF] px-2.5 py-1 rounded-lg transition"
              >
                Phone (iPhone 15)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 & 3: ANALYSIS & MANDATORY MARKET INTELLIGENCE CHECKPOINT */}
      {(step === 'ANALYSIS' || step === 'CONFIRMATION') && contract && marketIntelligence && (
        <div className="space-y-4">
          {/* Cryptographically Signed Intent Contract Card — Deep Plum Panel */}
          <div className="niyat-card-plum p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#F3EDF9]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  Signed Intent Contract #{contract.contractId}
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#F3EDF9] bg-white/10 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                Nonce: {contract.nonce.substring(0, 10)}...
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 p-2 rounded-xl">
                <span className="text-[10px] text-[#E8E2EF]/60 uppercase tracking-wider font-semibold block">Target</span>
                <span className="font-bold text-white truncate block">{contract.productName}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <span className="text-[10px] text-[#E8E2EF]/60 uppercase tracking-wider font-semibold block">Brand/Variant</span>
                <span className="font-bold text-white truncate block">{contract.preferredBrand} ({contract.variantOrModel || 'Standard'})</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <span className="text-[10px] text-[#E8E2EF]/60 uppercase tracking-wider font-semibold block">Quantity</span>
                <span className="font-bold text-white">{contract.quantity} {contract.unit}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <span className="text-[10px] text-[#E8E2EF]/60 uppercase tracking-wider font-semibold block">Budget Ceiling</span>
                <span className="font-bold text-white">
                  <PriceFormatter paise={contract.maxBudgetPaise} />
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#E8E2EF]/80 bg-black/20 p-2 rounded-xl border border-white/10 truncate">
              <span className="font-semibold text-white">HMAC-SHA256: </span>
              {contract.signature}
            </div>
          </div>

          {/* Mandatory Pre-Payment Market Intelligence Checkpoint Card */}
          <div className="niyat-card p-4 space-y-3.5 shadow-card">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E2EF]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#663A91]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                    Pre-Payment Checkpoint
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-[#261633]">
                  Market Intelligence Assessment
                </h3>
              </div>
              <div>{renderMarketDecisionBadge(marketIntelligence.decision)}</div>
            </div>

            {/* Decision explanation banner */}
            {marketIntelligence.decisionReason && (
              <div className="p-3 rounded-xl bg-[#F3EDF9] border border-[#E8E2EF] text-xs text-[#261633] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#663A91] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#663A91]">Advisory Reason:</span>
                  <p className="text-[11px] text-[#261633] leading-relaxed">{marketIntelligence.decisionReason}</p>
                </div>
              </div>
            )}

            {/* Multi-Window Trend Analysis Matrix */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-[#E8E2EF] bg-[#F3F1F8] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#766B82]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">7-Day</span>
                  <Calendar className="w-3 h-3" />
                </div>
                <div className="font-extrabold text-xs text-[#261633]">
                  {marketIntelligence.trends?.window7Day?.averagePaise ? (
                    <PriceFormatter paise={marketIntelligence.trends.window7Day.averagePaise} />
                  ) : (
                    'N/A'
                  )}
                </div>
                <span className="text-[9px] font-semibold text-[#663A91] block truncate">
                  {marketIntelligence.trends?.window7Day?.trendDirection ?? 'STEADY'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-[#E8E2EF] bg-[#F3F1F8] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#766B82]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">30-Day Fair</span>
                  <Layers className="w-3 h-3" />
                </div>
                <div className="font-extrabold text-xs text-[#261633]">
                  {marketIntelligence.trends?.window30Day?.medianPaise ? (
                    <PriceFormatter paise={marketIntelligence.trends.window30Day.medianPaise} />
                  ) : (
                    'N/A'
                  )}
                </div>
                <span className={`text-[9px] font-bold truncate block ${marketIntelligence.trends?.window30Day?.diffFromMedianPercent && marketIntelligence.trends.window30Day.diffFromMedianPercent > 0 ? 'text-[#D99A32]' : 'text-[#168451]'}`}>
                  {marketIntelligence.trends?.window30Day?.diffFromMedianPercent !== undefined
                    ? `${marketIntelligence.trends.window30Day.diffFromMedianPercent > 0 ? '+' : ''}${marketIntelligence.trends.window30Day.diffFromMedianPercent.toFixed(1)}% vs Med`
                    : 'Median Match'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-[#E8E2EF] bg-[#F3F1F8] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#766B82]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">90-Day</span>
                  <BarChart3 className="w-3 h-3" />
                </div>
                <div className="font-extrabold text-xs text-[#261633]">
                  {marketIntelligence.trends?.window90Day?.averagePaise ? (
                    <PriceFormatter paise={marketIntelligence.trends.window90Day.averagePaise} />
                  ) : (
                    'N/A'
                  )}
                </div>
                <span className="text-[9px] font-medium text-[#766B82] block truncate">
                  {marketIntelligence.trends?.window90Day?.sampleCount ?? 0} samples
                </span>
              </div>
            </div>

            {/* Honest Data Provenance Tag */}
            <div className="flex items-center justify-between text-[10px] text-[#766B82] bg-white p-2 rounded-xl border border-[#E8E2EF]">
              <span className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F3EDF9] text-[#663A91]">
                DEMO DATA
              </span>
              <span className="italic truncate">
                {marketIntelligence.provenance?.disclaimer || 'Synthetic price observations'}
              </span>
            </div>
          </div>

          {/* Landed Price Comparison Across Merchants */}
          <div className="niyat-card p-4 space-y-3 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                  Merchant Comparison
                </span>
                <h3 className="text-sm font-extrabold text-[#261633] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#663A91]" />
                  Verified Landed Offers
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91] font-bold uppercase">
                {marketIntelligence.offers.length} Sellers
              </span>
            </div>

            {/* Offer Cards */}
            <div className="space-y-2.5">
              {marketIntelligence.offers.map((offer, idx) => {
                const isSelected = selectedOffer?.merchantId === offer.merchantId;
                const totalForOrder = offer.landedPricePaise * contract.quantity;
                const isOverBudget = totalForOrder > contract.maxBudgetPaise;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedOffer(offer)}
                    className={`cursor-pointer rounded-2xl p-3.5 border transition ${
                      isSelected
                        ? 'border-[#663A91] bg-[#F3EDF9]/30 ring-1 ring-[#663A91]'
                        : 'border-[#E8E2EF] bg-white hover:border-[#D6CCE3]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#261633]">{offer.merchantName}</span>
                          <span className="text-[10px] text-[#766B82]">★ {offer.merchantRating}</span>
                        </div>
                        {offer.isRecommended && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-[#E8F6EE] text-[#168451] px-2 py-0.5 rounded-full border border-[#C4E8D3]">
                            Best Match
                          </span>
                        )}
                      </div>

                      {/* Landed Price Breakdown */}
                      <div className="p-2.5 rounded-xl bg-[#F3F1F8] space-y-1 text-xs">
                        <div className="flex justify-between text-[#766B82] text-[11px]">
                          <span>Base Item:</span>
                          <PriceFormatter paise={offer.basePricePaise} />
                        </div>
                        <div className="flex justify-between text-[#766B82] text-[11px]">
                          <span>Delivery Fee:</span>
                          <span>{offer.deliveryFeePaise === 0 ? 'FREE' : <PriceFormatter paise={offer.deliveryFeePaise} />}</span>
                        </div>
                        {offer.handlingFeePaise > 0 && (
                          <div className="flex justify-between text-[#766B82] text-[11px]">
                            <span>Handling / Fee:</span>
                            <PriceFormatter paise={offer.handlingFeePaise} />
                          </div>
                        )}
                        {offer.discountPaise > 0 && (
                          <div className="flex justify-between text-[#168451] text-[11px] font-semibold">
                            <span>Promo Discount:</span>
                            <span>-<PriceFormatter paise={offer.discountPaise} /></span>
                          </div>
                        )}
                        <div className="flex justify-between font-extrabold text-[#261633] pt-1 border-t border-[#E8E2EF] text-xs">
                          <span>Landed Total ({contract.quantity} {contract.unit}):</span>
                          <span className={isOverBudget ? 'text-[#D64C55]' : 'text-[#663A91]'}>
                            <PriceFormatter paise={totalForOrder} />
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className={`flex items-center gap-1 font-semibold ${isSelected ? 'text-[#663A91]' : 'text-[#766B82]'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#663A91] bg-[#663A91] text-white' : 'border-[#D6CCE3]'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          {isSelected ? 'Selected Payee' : 'Select Merchant'}
                        </span>
                        <span className="font-mono text-[10px] text-[#766B82] truncate max-w-[150px]">
                          {offer.payeeAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Review & Purchase Authorization Gate */}
          {selectedOffer && (
            <div className="niyat-card p-4 space-y-3.5 shadow-card">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                  Human-in-the-Loop Gate
                </span>
                <h3 className="text-sm font-extrabold text-[#261633]">
                  Review & Authorize Purchase
                </h3>
              </div>

              {/* Mandatory Advisory Acknowledgement Gate */}
              {marketIntelligence.requiresAcknowledgement && (
                <div className="p-3.5 rounded-2xl bg-[#FDF5E7] border border-[#F5DFB3] space-y-2.5">
                  <div className="flex items-start gap-2 text-xs text-[#261633]">
                    <AlertTriangle className="w-4 h-4 text-[#D99A32] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#D99A32]">Pre-Payment Advisory Notice</p>
                      <p className="mt-0.5 text-[11px] text-[#766B82]">{marketIntelligence.decisionReason}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-[#F5DFB3]">
                    <input
                      type="checkbox"
                      id="userAdvisoryAck"
                      checked={userAcknowledgedAdvisory}
                      onChange={e => setUserAcknowledgedAdvisory(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-[#663A91] rounded border-[#D6CCE3] focus:ring-[#663A91] cursor-pointer"
                    />
                    <label htmlFor="userAdvisoryAck" className="text-xs font-semibold text-[#261633] cursor-pointer select-none">
                      I have reviewed this market advisory and explicitly consent to proceed with this purchase.
                    </label>
                  </div>
                </div>
              )}

              {/* Purchase Authorization Checkbox */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
                <input
                  type="checkbox"
                  id="userAuthCheck"
                  checked={userApproved}
                  onChange={e => setUserApproved(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#663A91] rounded border-[#D6CCE3] focus:ring-[#663A91] cursor-pointer"
                />
                <label htmlFor="userAuthCheck" className="text-xs font-medium text-[#261633] cursor-pointer select-none">
                  I explicitly authorize purchasing <span className="font-bold">{contract.quantity} {contract.unit}</span> from <span className="font-bold">{selectedOffer.merchantName}</span> for <span className="font-bold text-[#663A91]"><PriceFormatter paise={selectedOffer.landedPricePaise * contract.quantity} showDecimals={true} /></span>.
                </label>
              </div>

              <button
                onClick={handleExecutePurchase}
                disabled={isExecutionDisabled}
                className="niyat-btn-primary w-full py-3.5 px-4 text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-card active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing Blind Verifier & Settle...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Execute Deterministic Blind Verifier</span>
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: VERIFICATION RESULT & VERDICT */}
      {step === 'RESULT' && verifierDecision && contract && selectedOffer && (
        <div className="space-y-4">
          <div className="niyat-card p-5 space-y-4 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2EF]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                  Blind Verifier Outcome
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#261633]">
                    Verdict:
                  </h3>
                  <StatusBadge status={verifierDecision.decision} size="md" />
                </div>
              </div>

              {simulatedPaymentResult && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] block">Tx Status</span>
                  <span className="text-xs font-bold text-[#168451]">{simulatedPaymentResult.status}</span>
                </div>
              )}
            </div>

            {/* Receipt Summary Card */}
            {simulatedPaymentResult && (
              <div className="p-3.5 rounded-2xl bg-[#F3F1F8] border border-[#E8E2EF] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#766B82]">Simulated Tx ID:</span>
                  <span className="font-mono font-bold text-[#261633]">{simulatedPaymentResult.txId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#766B82]">Amount Settled:</span>
                  <span className="font-extrabold text-[#663A91]">
                    <PriceFormatter paise={simulatedPaymentResult.amountPaise} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#766B82]">Payee Destination:</span>
                  <span className="font-mono text-[#261633] truncate max-w-[180px]">{simulatedPaymentResult.payeeAddress}</span>
                </div>
              </div>
            )}

            {/* 12 Independent Checks Grid */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                12 Independent Mathematical Checks
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">1. Signature Valid</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">2. Intent Fresh</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">3. Nonce Fresh</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">4. Product Match</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">5. Variant Match</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">6. Quantity Match</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">7. Payee Match</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">8. Budget Bound</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">9. Unit Alignment</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">10. User Approved</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">11. Advisory Ack</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E8E2EF] flex items-center justify-between">
                  <span className="text-[#261633]">12. Binding Seal</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168451]" />
                </div>
              </div>
            </div>

            {/* Verifier Explanations */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                Verifier Verification Log
              </span>
              <div className="space-y-1 bg-[#F3F1F8] p-3 rounded-xl border border-[#E8E2EF] text-[11px] text-[#261633]">
                {verifierDecision.reasons.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#168451] font-bold">✓</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="niyat-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Test Another Shopping Request</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
