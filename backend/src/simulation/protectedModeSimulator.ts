import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { AIService } from '../ai/aiService.js';
import { MarketplaceRepository } from '../db/repository.js';
import {
  createSignedIntentContract,
  verifyContractSignature
} from '../contract/intentContract.js';
import { BlindVerifier } from '../verifier/blindVerifier.js';
import {
  SignedIntentContract,
  PurchaseAuthorization,
  BlindVerifierDecision,
  MarketIntelligenceReport,
  MarketAssessmentRecord
} from '../types/index.js';
import {
  MarketIntelligenceEngine,
  normalizePackageToBaseUnits,
  calculateStandardUnitPricePaise,
  calculateFeeSkewBps,
  createAssessmentBindingSignature,
  verifyAssessmentBindingSignature,
  CanonicalAssessmentBinding
} from '../services/marketIntelligenceService.js';

export interface ProtectedModeResult {
  step: 'INTENT_SIGNED' | 'MARKET_ANALYZED' | 'VERIFIED';
  contract: SignedIntentContract;
  marketIntelligence: MarketIntelligenceReport;
  recommendedOffer: MarketIntelligenceReport['offers'][0];
  assessment?: MarketAssessmentRecord;
  authorization?: PurchaseAuthorization;
  verifierDecision?: BlindVerifierDecision;
  simulatedPaymentResult?: {
    txId: string;
    status: 'PAID' | 'REJECTED' | 'CONFIRMATION_REQUIRED';
    amountPaise: number;
    payeeAddress: string;
    timestamp: string;
  };
}

export class ProtectedModeSimulator {
  private verifier: BlindVerifier;
  private marketEngine: MarketIntelligenceEngine;

  constructor(
    private aiService: AIService,
    private repository: MarketplaceRepository
  ) {
    this.verifier = new BlindVerifier(this.repository);
    this.marketEngine = new MarketIntelligenceEngine();
  }

  /**
   * Prepares protected purchase by creating signed intent contract, evaluating
   * market windows, calculating integer landed price, and generating signed MarketAssessment.
   */
  async prepareProtectedPurchase(userPrompt: string): Promise<{
    requiresClarification?: boolean;
    clarificationQuestion?: string;
    parsedIntent?: any;
    contract?: SignedIntentContract;
    marketIntelligence?: MarketIntelligenceReport;
    recommendedOffer?: MarketIntelligenceReport['offers'][0];
    assessment?: MarketAssessmentRecord;
  }> {
    // 1 & 2. Structured intent extraction via AI service (with local fallback)
    const { intent } = await this.aiService.parseIntent(userPrompt);

    // If budget is unstated or zero, NEVER silently invent one or bind a zero-budget contract!
    // Demand explicit interactive user clarification.
    if (!intent.maxBudgetPaise || intent.maxBudgetPaise <= 0 || intent.ambiguityQuestion) {
      const question = intent.ambiguityQuestion ||
        `What is your maximum spending limit for ${intent.quantity} ${intent.unit} of ${intent.productName || intent.preferredBrand}? (e.g. "Budget: ₹150")`;
      return {
        requiresClarification: true,
        clarificationQuestion: question,
        parsedIntent: intent
      };
    }

    // 3. Cryptographically sign intent contract only when all required parameters are confirmed
    const contract = createSignedIntentContract(userPrompt, intent);
    await this.repository.saveContract(contract);

    // 4 & 5. Find matching product in catalog
    const category = intent.productCategory !== 'Unknown' ? intent.productCategory : 'Milk';
    const products = await this.repository.getProducts({
      category,
      search: intent.preferredBrand !== 'Unknown' ? intent.preferredBrand : undefined
    });

    const targetProduct = products[0] || (await this.repository.getProducts())[0];

    // Market Intelligence analysis (inside NIYAT Protected Mode)
    const marketReport = await this.repository.getMarketIntelligence(targetProduct.id);
    if (!marketReport) {
      throw new Error('Unable to generate market intelligence report for product');
    }

    const recommendedOffer = marketReport.offers.find(o => o.isRecommended) || marketReport.offers[0];

    // Offer product details
    const offerProduct = (await this.repository.getProductById(recommendedOffer.productId)) || targetProduct;

    // Integer base unit normalization
    const { packageSizeBaseUnits, baseUnit } = normalizePackageToBaseUnits(
      offerProduct.packageSize,
      offerProduct.unit
    );

    const pricePerStandardUnitPaise = calculateStandardUnitPricePaise(
      recommendedOffer.landedPricePaise,
      packageSizeBaseUnits,
      baseUnit
    );

    const feeSkewBps = calculateFeeSkewBps(
      recommendedOffer.deliveryFeePaise,
      recommendedOffer.handlingFeePaise,
      recommendedOffer.landedPricePaise
    );

    const isSubstituteVariant =
      contract.variantOrModel.trim().toLowerCase() !== offerProduct.variant.trim().toLowerCase();

    // Multi-window evaluation
    const evaluation = this.marketEngine.evaluateMarketWindows({
      currentLandedPricePaise: recommendedOffer.landedPricePaise,
      feeSkewBps,
      isSubstituteVariant,
      observations: marketReport.historicalPriceObservations
    });

    // Unique assessment ID and expiry
    const assessmentId = `ma_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute TTL

    const integerQuantity = Math.max(1, Math.round(contract.quantity));

    const canonicalBinding: CanonicalAssessmentBinding = {
      assessmentId,
      contractId: contract.contractId,
      productId: offerProduct.id,
      productTitle: offerProduct.title,
      brand: offerProduct.brand,
      variant: offerProduct.variant,
      packageSizeBaseUnits,
      baseUnit,
      merchantId: recommendedOffer.merchantId,
      merchantName: recommendedOffer.merchantName,
      payeeAddress: recommendedOffer.payeeAddress,
      quantity: integerQuantity,
      basePricePaise: recommendedOffer.basePricePaise,
      deliveryFeePaise: recommendedOffer.deliveryFeePaise,
      platformFeePaise: recommendedOffer.handlingFeePaise,
      discountPaise: recommendedOffer.discountPaise,
      landedPricePaise: recommendedOffer.landedPricePaise,
      pricePerStandardUnitPaise,
      decision: evaluation.decision,
      requiresAcknowledgement: evaluation.requiresAcknowledgement,
      createdAt,
      expiresAt
    };

    const bindingSignature = createAssessmentBindingSignature(
      canonicalBinding,
      ENV.CONTRACT_SIGNING_SECRET
    );

    const assessmentRecord: MarketAssessmentRecord = {
      id: assessmentId,
      assessmentId,
      contractId: contract.contractId,
      productId: offerProduct.id,
      productTitle: offerProduct.title,
      brand: offerProduct.brand,
      variant: offerProduct.variant,
      packageSizeBaseUnits,
      baseUnit,
      merchantId: recommendedOffer.merchantId,
      merchantName: recommendedOffer.merchantName,
      payeeAddress: recommendedOffer.payeeAddress,
      quantity: integerQuantity,
      basePricePaise: recommendedOffer.basePricePaise,
      deliveryFeePaise: recommendedOffer.deliveryFeePaise,
      platformFeePaise: recommendedOffer.handlingFeePaise,
      discountPaise: recommendedOffer.discountPaise,
      landedPricePaise: recommendedOffer.landedPricePaise,
      pricePerStandardUnitPaise,
      feeSkewBps,
      decision: evaluation.decision,
      decisionReason: evaluation.decisionReason,
      requiresAcknowledgement: evaluation.requiresAcknowledgement,
      bindingSignature,
      isConsumed: false,
      consumedAt: null,
      createdAt,
      expiresAt
    };

    await this.repository.saveAssessment(assessmentRecord);

    marketReport.assessmentId = assessmentId;
    marketReport.decision = evaluation.decision;
    marketReport.decisionReason = evaluation.decisionReason;
    marketReport.requiresAcknowledgement = evaluation.requiresAcknowledgement;
    marketReport.trends = evaluation.trends;
    marketReport.provenance = evaluation.provenance;

    return {
      contract,
      marketIntelligence: marketReport,
      recommendedOffer,
      assessment: assessmentRecord
    };
  }

  /**
   * Enforces the 7-step mandatory security verification gate:
   * 1. Validate Intent Contract signature and expiry
   * 2. Load Assessment, check unconsumed and unexpired
   * 3. Verify Canonical Assessment Binding HMAC and parameter parity
   * 4. Enforce user advisory acknowledgement gate (NO STATE MUTATION ON FAILURE)
   * 5. Construct PurchaseAuthorization and run Blind Verifier
   * 6. Settle atomic transaction (assessment consumption + nonce claim + transaction log)
   * 7. Record transaction if ASK or BLOCK
   */
  async executeProtectedPurchase(params: {
    contract: SignedIntentContract;
    selectedOffer: MarketIntelligenceReport['offers'][0];
    assessmentId: string;
    userApproved: boolean;
    userAcknowledgedAdvisory?: boolean;
    userConfirmedVariance?: boolean;
    customTotalAmountPaise?: number; // for testing tamper scenarios
    customPayeeAddress?: string;     // for testing attack scenarios
    customQuantity?: number;         // for testing quantity inflation
  }): Promise<ProtectedModeResult> {
    const {
      contract,
      selectedOffer,
      assessmentId,
      userApproved,
      userAcknowledgedAdvisory,
      userConfirmedVariance
    } = params;

    // 1. Contract verification
    const isContractSigValid = verifyContractSignature(contract);
    if (!isContractSigValid) {
      throw new Error('CONTRACT_SIGNATURE_INVALID');
    }

    if (new Date() > new Date(contract.expiresAt)) {
      throw new Error('CONTRACT_EXPIRED');
    }

    // 2. Load Assessment
    const assessment = await this.repository.getAssessmentById(assessmentId);
    if (!assessment) {
      throw new Error('ASSESSMENT_NOT_FOUND');
    }

    if (assessment.isConsumed) {
      throw new Error('ASSESSMENT_ALREADY_CONSUMED');
    }

    if (new Date() > new Date(assessment.expiresAt)) {
      throw new Error('ASSESSMENT_EXPIRED');
    }

    // 3. Contract nonce freshness check
    const isNonceClaimed = await this.repository.isNonceUsed(contract.nonce);
    if (isNonceClaimed) {
      throw new Error('CONTRACT_NONCE_ALREADY_USED');
    }

    // 3. Verify Canonical Assessment Binding HMAC & Field Alignment
    const canonicalBinding: CanonicalAssessmentBinding = {
      assessmentId: assessment.assessmentId,
      contractId: assessment.contractId,
      productId: assessment.productId,
      productTitle: assessment.productTitle,
      brand: assessment.brand,
      variant: assessment.variant,
      packageSizeBaseUnits: assessment.packageSizeBaseUnits,
      baseUnit: assessment.baseUnit,
      merchantId: assessment.merchantId,
      merchantName: assessment.merchantName,
      payeeAddress: assessment.payeeAddress,
      quantity: assessment.quantity,
      basePricePaise: assessment.basePricePaise,
      deliveryFeePaise: assessment.deliveryFeePaise,
      platformFeePaise: assessment.platformFeePaise,
      discountPaise: assessment.discountPaise,
      landedPricePaise: assessment.landedPricePaise,
      pricePerStandardUnitPaise: assessment.pricePerStandardUnitPaise,
      decision: assessment.decision,
      requiresAcknowledgement: assessment.requiresAcknowledgement,
      createdAt: assessment.createdAt,
      expiresAt: assessment.expiresAt
    };

    const isBindingValid = verifyAssessmentBindingSignature(
      canonicalBinding,
      assessment.bindingSignature,
      ENV.CONTRACT_SIGNING_SECRET
    );

    if (!isBindingValid) {
      throw new Error('BINDING_SIGNATURE_MISMATCH');
    }

    // Match contract & selected offer with assessment
    if (assessment.contractId !== contract.contractId) {
      throw new Error('BINDING_MISMATCH: Contract does not match assessment');
    }
    if (assessment.productId !== selectedOffer.productId) {
      throw new Error('BINDING_MISMATCH: Product does not match assessment');
    }
    if (
      assessment.merchantId !== selectedOffer.merchantId ||
      assessment.payeeAddress.toLowerCase() !== selectedOffer.payeeAddress.toLowerCase()
    ) {
      throw new Error('BINDING_MISMATCH: Merchant or Payee does not match assessment');
    }
    if (
      assessment.basePricePaise !== selectedOffer.basePricePaise ||
      assessment.deliveryFeePaise !== selectedOffer.deliveryFeePaise ||
      assessment.platformFeePaise !== selectedOffer.handlingFeePaise ||
      assessment.discountPaise !== selectedOffer.discountPaise ||
      assessment.landedPricePaise !== selectedOffer.landedPricePaise
    ) {
      throw new Error('BINDING_MISMATCH: Price schedule does not match assessment');
    }

    const quantity = Math.max(1, Math.round(params.customQuantity ?? contract.quantity));
    if (params.customQuantity === undefined && assessment.quantity !== quantity) {
      throw new Error('BINDING_MISMATCH: Quantity does not match assessment');
    }

    // 4. Acknowledgement ordering check (DO NOT CONSUME IF ACKNOWLEDGEMENT MISSING)
    if (assessment.requiresAcknowledgement && userAcknowledgedAdvisory !== true) {
      throw new Error('ADVISORY_ACKNOWLEDGEMENT_REQUIRED');
    }

    // 5. Construct PurchaseAuthorization and Execute Blind Verifier
    const product = await this.repository.getProductById(selectedOffer.productId);
    if (!product) {
      throw new Error(`Product ${selectedOffer.productId} not found`);
    }

    const finalAmountPaise = params.customTotalAmountPaise ?? (selectedOffer.landedPricePaise * quantity);
    const payee = params.customPayeeAddress ?? selectedOffer.payeeAddress;

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: product.id,
      productTitle: product.title,
      brand: product.brand,
      variant: product.variant,
      merchantId: selectedOffer.merchantId,
      merchantName: selectedOffer.merchantName,
      payeeAddress: payee,
      quantity,
      unit: contract.unit,
      itemPricePaise: selectedOffer.basePricePaise * quantity,
      deliveryFeePaise: selectedOffer.deliveryFeePaise,
      platformFeePaise: selectedOffer.handlingFeePaise,
      discountPaise: selectedOffer.discountPaise,
      totalAmountPaise: finalAmountPaise,
      userApproved,
      userConfirmedVariance,
      authorizedAt: new Date().toISOString()
    };

    const verifierDecision = await this.verifier.verify({
      contract,
      authorization,
      merchantPayeeExpected: selectedOffer.payeeAddress,
      skipNonceClaim: true,
      userConfirmedVariance
    });

    const marketIntelligence = (await this.repository.getMarketIntelligence(product.id))!;
    marketIntelligence.assessmentId = assessment.assessmentId;
    marketIntelligence.decision = assessment.decision;
    marketIntelligence.decisionReason = assessment.decisionReason;
    marketIntelligence.requiresAcknowledgement = assessment.requiresAcknowledgement;

    let simulatedPaymentResult: ProtectedModeResult['simulatedPaymentResult'];

    // 6. If ALLOW, perform atomic settlement
    if (verifierDecision.decision === 'ALLOW') {
      const settlement = await this.repository.settleProtectedPurchaseAtomic({
        assessmentId: assessment.assessmentId,
        nonce: contract.nonce,
        contractId: contract.contractId,
        tx: {
          mode: 'PROTECTED',
          status: 'ALLOW',
          userRequest: contract.userRequest,
          productId: product.id,
          productTitle: product.title,
          merchantId: selectedOffer.merchantId,
          merchantName: selectedOffer.merchantName,
          payeeAddress: payee,
          quantity,
          itemPricePaise: selectedOffer.basePricePaise * quantity,
          deliveryFeePaise: selectedOffer.deliveryFeePaise,
          handlingFeePaise: selectedOffer.handlingFeePaise,
          discountPaise: selectedOffer.discountPaise,
          totalAmountPaise: finalAmountPaise,
          contractId: contract.contractId,
          assessmentId: assessment.assessmentId,
          marketDecision: assessment.decision,
          marketDecisionReason: assessment.decisionReason,
          userAcknowledgedAdvisory: userAcknowledgedAdvisory ?? false,
          verifierDecision: 'ALLOW',
          verifierReasons: verifierDecision.reasons,
          isDemoData: true
        }
      });

      if (!settlement.success) {
        throw new Error(settlement.error || 'ATOMIC_SETTLEMENT_FAILED');
      }

      simulatedPaymentResult = {
        txId: settlement.txRecord!.id,
        status: 'PAID',
        amountPaise: finalAmountPaise,
        payeeAddress: payee,
        timestamp: settlement.txRecord!.createdAt
      };
    } else {
      // Verifier decision is ASK or BLOCK
      const txId = `niyat_block_${Date.now()}`;
      simulatedPaymentResult = {
        txId,
        status: verifierDecision.decision === 'ASK' ? 'CONFIRMATION_REQUIRED' : 'REJECTED',
        amountPaise: finalAmountPaise,
        payeeAddress: payee,
        timestamp: new Date().toISOString()
      };

      await this.repository.recordTransaction({
        mode: 'PROTECTED',
        status: verifierDecision.decision === 'ASK' ? 'ASK' : 'BLOCK',
        userRequest: contract.userRequest,
        productId: product.id,
        productTitle: product.title,
        merchantId: selectedOffer.merchantId,
        merchantName: selectedOffer.merchantName,
        payeeAddress: payee,
        quantity,
        itemPricePaise: selectedOffer.basePricePaise * quantity,
        deliveryFeePaise: selectedOffer.deliveryFeePaise,
        handlingFeePaise: selectedOffer.handlingFeePaise,
        discountPaise: selectedOffer.discountPaise,
        totalAmountPaise: finalAmountPaise,
        contractId: contract.contractId,
        assessmentId: assessment.assessmentId,
        marketDecision: assessment.decision,
        marketDecisionReason: assessment.decisionReason,
        userAcknowledgedAdvisory: userAcknowledgedAdvisory ?? false,
        verifierDecision: verifierDecision.decision,
        verifierReasons: verifierDecision.reasons,
        securityExplanation: verifierDecision.securityAlert,
        isDemoData: true
      });
    }

    return {
      step: 'VERIFIED',
      contract,
      marketIntelligence,
      recommendedOffer: selectedOffer,
      assessment,
      authorization,
      verifierDecision,
      simulatedPaymentResult
    };
  }
}
