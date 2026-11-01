import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { MarketplaceRepository } from '../db/repository.js';
import { AIService } from '../ai/aiService.js';
import { ProtectedModeSimulator } from '../simulation/protectedModeSimulator.js';
import {
  normalizePackageToBaseUnits,
  calculateStandardUnitPricePaise,
  calculateFeeSkewBps,
  computeCanonicalAssessmentString,
  createAssessmentBindingSignature,
  verifyAssessmentBindingSignature,
  MarketIntelligenceEngine,
  CanonicalAssessmentBinding
} from '../services/marketIntelligenceService.js';
import {
  SignedIntentContract,
  MarketAssessmentRecord,
  MarketIntelligenceReport
} from '../types/index.js';

import { LocalDeterministicParser } from '../ai/localParser.js';

describe('NIYAT Phase 4 — Market Intelligence Security & Pre-Payment Checkpoint', () => {
  let repository: MarketplaceRepository;
  let aiService: AIService;
  let simulator: ProtectedModeSimulator;
  let engine: MarketIntelligenceEngine;
  const localParser = new LocalDeterministicParser();

  beforeEach(() => {
    // Force in-memory repository for fast, deterministic unit and security testing
    repository = new MarketplaceRepository({ forceMemoryOnly: true });
    aiService = new AIService();
    // Deterministic offline parsing for market intelligence tests
    vi.spyOn(aiService, 'parseIntent').mockImplementation(async (prompt: string) => ({
      intent: localParser.parse(prompt),
      provider: 'local_fallback',
      modelUsed: 'NIYAT-Deterministic-RegexRules-v1',
      latencyMs: 0
    }));
    simulator = new ProtectedModeSimulator(aiService, repository);
    engine = new MarketIntelligenceEngine();
  });

  describe('1. Pure Integer Arithmetic & Unit Normalization', () => {
    it('normalizes millilitres, grams, and discrete units into integer base units', () => {
      expect(normalizePackageToBaseUnits(1, 'Litre')).toEqual({
        packageSizeBaseUnits: 1000,
        baseUnit: 'ml'
      });
      expect(normalizePackageToBaseUnits(0.5, 'Litre')).toEqual({
        packageSizeBaseUnits: 500,
        baseUnit: 'ml'
      });
      expect(normalizePackageToBaseUnits(2, 'Kg')).toEqual({
        packageSizeBaseUnits: 2000,
        baseUnit: 'g'
      });
      expect(normalizePackageToBaseUnits(1, 'Unit')).toEqual({
        packageSizeBaseUnits: 1,
        baseUnit: 'unit'
      });
    });

    it('calculates standard unit price in integer paise per Litre/Kg without float drifts', () => {
      // 500ml for ₹33 (3300 paise) -> 1 Litre is 6600 paise (₹66)
      const unitPrice1 = calculateStandardUnitPricePaise(3300, 500, 'ml');
      expect(unitPrice1).toBe(6600);

      // 1000ml for ₹64 (6400 paise) -> 1 Litre is 6400 paise (₹64)
      const unitPrice2 = calculateStandardUnitPricePaise(6400, 1000, 'ml');
      expect(unitPrice2).toBe(6400);

      // Discrete item: 1 laptop for ₹82,900 (8290000 paise)
      const unitPrice3 = calculateStandardUnitPricePaise(8290000, 1, 'unit');
      expect(unitPrice3).toBe(8290000);
    });

    it('calculates fee skew in integer basis points (bps) accurately', () => {
      // Delivery ₹30 + Platform ₹10 on Landed ₹100 -> 4000 bps (40%)
      const feeSkew1 = calculateFeeSkewBps(3000, 1000, 10000);
      expect(feeSkew1).toBe(4000);

      // Delivery ₹10 on Landed ₹100 -> 1000 bps (10%)
      const feeSkew2 = calculateFeeSkewBps(1000, 0, 10000);
      expect(feeSkew2).toBe(1000);

      // Zero fees
      const feeSkew3 = calculateFeeSkewBps(0, 0, 5000);
      expect(feeSkew3).toBe(0);
    });
  });

  describe('2. Canonical Serialization & Cryptographic HMAC-SHA256 Binding', () => {
    const sampleBinding: CanonicalAssessmentBinding = {
      assessmentId: 'ma_test_123',
      contractId: 'ic_contract_456',
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Toned Milk',
      brand: 'Amul',
      variant: 'Taaza Toned',
      packageSizeBaseUnits: 1000,
      baseUnit: 'ml',
      merchantId: 'merch_dairy_direct',
      merchantName: 'Dairy Direct',
      payeeAddress: 'dairy@upi',
      quantity: 2,
      basePricePaise: 6400,
      deliveryFeePaise: 0,
      platformFeePaise: 0,
      discountPaise: 0,
      landedPricePaise: 6400,
      pricePerStandardUnitPaise: 6400,
      decision: 'BUY_NOW',
      requiresAcknowledgement: false,
      createdAt: '2026-11-01T00:00:00.000Z',
      expiresAt: '2026-11-01T00:15:00.000Z'
    };

    it('signs and verifies valid canonical assessment binding', () => {
      const sig = createAssessmentBindingSignature(sampleBinding, ENV.CONTRACT_SIGNING_SECRET);
      expect(sig).toBeDefined();
      expect(sig.length).toBe(64); // SHA-256 hex length

      const isValid = verifyAssessmentBindingSignature(sampleBinding, sig, ENV.CONTRACT_SIGNING_SECRET);
      expect(isValid).toBe(true);
    });

    it('rejects tampered landed price in canonical binding', () => {
      const sig = createAssessmentBindingSignature(sampleBinding, ENV.CONTRACT_SIGNING_SECRET);
      const tampered = { ...sampleBinding, landedPricePaise: 9999 };

      const isValid = verifyAssessmentBindingSignature(tampered, sig, ENV.CONTRACT_SIGNING_SECRET);
      expect(isValid).toBe(false);
    });

    it('rejects tampered payee address in canonical binding', () => {
      const sig = createAssessmentBindingSignature(sampleBinding, ENV.CONTRACT_SIGNING_SECRET);
      const tampered = { ...sampleBinding, payeeAddress: 'attacker@upi' };

      const isValid = verifyAssessmentBindingSignature(tampered, sig, ENV.CONTRACT_SIGNING_SECRET);
      expect(isValid).toBe(false);
    });

    it('rejects tampered decision state in canonical binding', () => {
      const sig = createAssessmentBindingSignature(sampleBinding, ENV.CONTRACT_SIGNING_SECRET);
      const tampered = { ...sampleBinding, decision: 'BUY_NOW' as const };
      // original was already BUY_NOW, let's tamper to WAIT
      const tamperedToWait = { ...sampleBinding, decision: 'WAIT' as const };

      const isValid = verifyAssessmentBindingSignature(tamperedToWait, sig, ENV.CONTRACT_SIGNING_SECRET);
      expect(isValid).toBe(false);
    });
  });

  describe('3. Deterministic 5-State Precedence Engine', () => {
    it('returns DATA_UNAVAILABLE when zero observations exist', () => {
      const result = engine.evaluateMarketWindows({
        currentLandedPricePaise: 6400,
        feeSkewBps: 0,
        isSubstituteVariant: false,
        observations: []
      });

      expect(result.decision).toBe('DATA_UNAVAILABLE');
      expect(result.requiresAcknowledgement).toBe(true);
    });

    it('returns DATA_UNAVAILABLE when historical observations are older than 14 days (stale data)', () => {
      const now = new Date('2026-11-01T10:00:00Z');
      // Observations from 20 days ago (> 336 hours)
      const staleObservations = [
        { date: '2026-10-10T10:00:00Z', pricePaise: 6500, merchantName: 'M1', isDemoData: true as const },
        { date: '2026-10-09T10:00:00Z', pricePaise: 6500, merchantName: 'M2', isDemoData: true as const }
      ];

      const result = engine.evaluateMarketWindows({
        currentLandedPricePaise: 6500,
        feeSkewBps: 0,
        isSubstituteVariant: false,
        observations: staleObservations,
        now
      });

      expect(result.decision).toBe('DATA_UNAVAILABLE');
      expect(result.requiresAcknowledgement).toBe(true);
      expect(result.decisionReason).toContain('stale');
    });

    it('strictly enforces INSUFFICIENT_DATA over BUY_NOW when sample count < 5', () => {
      // 3 observations (even though current price is below all of them)
      const now = new Date('2026-11-01T10:00:00Z');
      const observations = [
        { date: '2026-10-30T10:00:00Z', pricePaise: 6500, merchantName: 'M1', isDemoData: true as const },
        { date: '2026-10-25T10:00:00Z', pricePaise: 6600, merchantName: 'M2', isDemoData: true as const },
        { date: '2026-10-20T10:00:00Z', pricePaise: 6700, merchantName: 'M3', isDemoData: true as const }
      ];

      const result = engine.evaluateMarketWindows({
        currentLandedPricePaise: 6200, // lower than history
        feeSkewBps: 0,
        isSubstituteVariant: false,
        observations,
        now
      });

      // Must be INSUFFICIENT_DATA, NOT BUY_NOW!
      expect(result.decision).toBe('INSUFFICIENT_DATA');
      expect(result.requiresAcknowledgement).toBe(true);
    });

    it('returns REVIEW when fee skew exceeds 2500 bps (25%)', () => {
      const now = new Date('2026-11-01T10:00:00Z');
      const observations = [
        { date: '2026-10-31T10:00:00Z', pricePaise: 10000, merchantName: 'M1', isDemoData: true as const },
        { date: '2026-10-30T10:00:00Z', pricePaise: 10000, merchantName: 'M2', isDemoData: true as const },
        { date: '2026-10-29T10:00:00Z', pricePaise: 10000, merchantName: 'M3', isDemoData: true as const },
        { date: '2026-10-28T10:00:00Z', pricePaise: 10000, merchantName: 'M4', isDemoData: true as const },
        { date: '2026-10-27T10:00:00Z', pricePaise: 10000, merchantName: 'M5', isDemoData: true as const }
      ];

      const result = engine.evaluateMarketWindows({
        currentLandedPricePaise: 10000,
        feeSkewBps: 3000, // 30% fee skew
        isSubstituteVariant: false,
        observations,
        now
      });

      expect(result.decision).toBe('REVIEW');
      expect(result.requiresAcknowledgement).toBe(true);
      expect(result.decisionReason).toContain('Delivery and platform fees comprise 30%');
    });

    it('returns REVIEW when variant is substitute', () => {
      const now = new Date('2026-11-01T10:00:00Z');
      const observations = [
        { date: '2026-10-31T10:00:00Z', pricePaise: 10000, merchantName: 'M1', isDemoData: true as const },
        { date: '2026-10-30T10:00:00Z', pricePaise: 10000, merchantName: 'M2', isDemoData: true as const },
        { date: '2026-10-29T10:00:00Z', pricePaise: 10000, merchantName: 'M3', isDemoData: true as const },
        { date: '2026-10-28T10:00:00Z', pricePaise: 10000, merchantName: 'M4', isDemoData: true as const },
        { date: '2026-10-27T10:00:00Z', pricePaise: 10000, merchantName: 'M5', isDemoData: true as const }
      ];

      const result = engine.evaluateMarketWindows({
        currentLandedPricePaise: 10000,
        feeSkewBps: 500,
        isSubstituteVariant: true,
        observations,
        now
      });

      expect(result.decision).toBe('REVIEW');
      expect(result.requiresAcknowledgement).toBe(true);
      expect(result.decisionReason).toContain('substitute variant');
    });

    it('returns WAIT when current price is >= +15% above 30d median', () => {
      const now = new Date('2026-11-01T10:00:00Z');
      // 5 observations around 10000 paise (₹100)
      const observations = [
        { date: '2026-10-31T10:00:00Z', pricePaise: 10000, merchantName: 'M1', isDemoData: true as const },
        { date: '2026-10-30T10:00:00Z', pricePaise: 10000, merchantName: 'M2', isDemoData: true as const },
        { date: '2026-10-29T10:00:00Z', pricePaise: 10000, merchantName: 'M3', isDemoData: true as const },
        { date: '2026-10-28T10:00:00Z', pricePaise: 10000, merchantName: 'M4', isDemoData: true as const },
        { date: '2026-10-27T10:00:00Z', pricePaise: 10000, merchantName: 'M5', isDemoData: true as const }
      ];

      // Current price is ₹120 (12000 paise) = +20% elevated
      const result = engine.evaluateMarketWindows({
        currentLandedPricePaise: 12000,
        feeSkewBps: 500,
        isSubstituteVariant: false,
        observations,
        now
      });

      expect(result.decision).toBe('WAIT');
      expect(result.requiresAcknowledgement).toBe(true);
      expect(result.decisionReason).toContain('above the 30-day fair market median');
    });

    it('returns BUY_NOW when price is at or below 30d median and fee skew <= 25%', () => {
      const now = new Date('2026-11-01T10:00:00Z');
      const observations = [
        { date: '2026-10-31T10:00:00Z', pricePaise: 10000, merchantName: 'M1', isDemoData: true as const },
        { date: '2026-10-30T10:00:00Z', pricePaise: 10000, merchantName: 'M2', isDemoData: true as const },
        { date: '2026-10-29T10:00:00Z', pricePaise: 10000, merchantName: 'M3', isDemoData: true as const },
        { date: '2026-10-28T10:00:00Z', pricePaise: 10000, merchantName: 'M4', isDemoData: true as const },
        { date: '2026-10-27T10:00:00Z', pricePaise: 10000, merchantName: 'M5', isDemoData: true as const }
      ];

      const result = engine.evaluateMarketWindows({
        currentLandedPricePaise: 9800, // below median
        feeSkewBps: 500,
        isSubstituteVariant: false,
        observations,
        now
      });

      expect(result.decision).toBe('BUY_NOW');
      expect(result.requiresAcknowledgement).toBe(false);
    });
  });

  describe('4. Mandatory Acknowledgement Ordering & Retry Safety', () => {
    it('blocks execution when acknowledgement is missing WITHOUT consuming assessment or nonce', async () => {
      const prepared = await simulator.prepareProtectedPurchase('Buy 2 litres of Amul Taaza milk under ₹150.');
      const { contract, selectedOffer, assessment } = {
        contract: prepared.contract,
        selectedOffer: prepared.recommendedOffer,
        assessment: prepared.assessment
      };

      // Manually simulate an advisory state requiring acknowledgement
      assessment.requiresAcknowledgement = true;
      assessment.decision = 'REVIEW';
      // Re-sign assessment with updated decision
      const canonical: CanonicalAssessmentBinding = {
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
        decision: 'REVIEW',
        requiresAcknowledgement: true,
        createdAt: assessment.createdAt,
        expiresAt: assessment.expiresAt
      };
      assessment.bindingSignature = createAssessmentBindingSignature(canonical, ENV.CONTRACT_SIGNING_SECRET);
      await repository.saveAssessment(assessment);

      // Attempt 1: Execute WITHOUT acknowledging advisory
      await expect(
        simulator.executeProtectedPurchase({
          contract,
          selectedOffer,
          assessmentId: assessment.assessmentId,
          userApproved: true,
          userAcknowledgedAdvisory: false
        })
      ).rejects.toThrow('ADVISORY_ACKNOWLEDGEMENT_REQUIRED');

      // Verify assessment is STILL UNCONSUMED
      const assessmentAfterFailedAttempt = await repository.getAssessmentById(assessment.assessmentId);
      expect(assessmentAfterFailedAttempt?.isConsumed).toBe(false);

      // Verify contract nonce is STILL UNCLAIMED
      const isNonceUsed = await repository.isNonceUsed(contract.nonce);
      expect(isNonceUsed).toBe(false);

      // Attempt 2: User reviews advisory and provides explicit consent
      const successResult = await simulator.executeProtectedPurchase({
        contract,
        selectedOffer,
        assessmentId: assessment.assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: true
      });

      expect(successResult.simulatedPaymentResult?.status).toBe('PAID');

      // Now verify assessment IS consumed
      const assessmentAfterSuccess = await repository.getAssessmentById(assessment.assessmentId);
      expect(assessmentAfterSuccess?.isConsumed).toBe(true);

      // Verify contract nonce IS claimed
      const isNonceUsedAfterSuccess = await repository.isNonceUsed(contract.nonce);
      expect(isNonceUsedAfterSuccess).toBe(true);
    });
  });

  describe('5. Single-Use Assessment Replay Protection', () => {
    it('prevents reusing an already-consumed assessment', async () => {
      const prepared = await simulator.prepareProtectedPurchase('Buy 2 litres of Amul Taaza milk under ₹150.');
      const { contract, recommendedOffer, assessment } = prepared;

      // Ensure acknowledgement flag is satisfied
      const needsAck = assessment.requiresAcknowledgement;

      // First execution succeeds
      const res1 = await simulator.executeProtectedPurchase({
        contract,
        selectedOffer: recommendedOffer,
        assessmentId: assessment.assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: needsAck ? true : undefined
      });
      expect(res1.simulatedPaymentResult?.status).toBe('PAID');

      // Second execution with same assessment must be blocked
      await expect(
        simulator.executeProtectedPurchase({
          contract,
          selectedOffer: recommendedOffer,
          assessmentId: assessment.assessmentId,
          userApproved: true,
          userAcknowledgedAdvisory: true
        })
      ).rejects.toThrow('ASSESSMENT_ALREADY_CONSUMED');
    });
  });

  describe('6. Assessment Expiry Window (TTL)', () => {
    it('rejects expired market assessments', async () => {
      const prepared = await simulator.prepareProtectedPurchase('Buy 2 litres of Amul Taaza milk under ₹150.');
      const { contract, recommendedOffer, assessment } = prepared;

      // Set expiry to 1 minute in the past
      assessment.expiresAt = new Date(Date.now() - 60000).toISOString();
      await repository.saveAssessment(assessment);

      await expect(
        simulator.executeProtectedPurchase({
          contract,
          selectedOffer: recommendedOffer,
          assessmentId: assessment.assessmentId,
          userApproved: true
        })
      ).rejects.toThrow('ASSESSMENT_EXPIRED');
    });
  });

  describe('7. Concurrency & Double-Spend Prevention', () => {
    it('ensures only one concurrent settlement succeeds when racing the same assessment', async () => {
      const prepared = await simulator.prepareProtectedPurchase('Buy 2 litres of Amul Taaza milk under ₹150.');
      const { contract, recommendedOffer, assessment } = prepared;

      // Fire 2 concurrent execution requests
      const promises = [
        simulator.executeProtectedPurchase({
          contract,
          selectedOffer: recommendedOffer,
          assessmentId: assessment.assessmentId,
          userApproved: true,
          userAcknowledgedAdvisory: true
        }),
        simulator.executeProtectedPurchase({
          contract,
          selectedOffer: recommendedOffer,
          assessmentId: assessment.assessmentId,
          userApproved: true,
          userAcknowledgedAdvisory: true
        })
      ];

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      // Exactly ONE request must succeed; the other must be rejected
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const err = (rejected[0] as PromiseRejectedResult).reason;
      expect(
        err.message === 'ASSESSMENT_ALREADY_CONSUMED' ||
        err.message === 'CONTRACT_NONCE_ALREADY_USED' ||
        err.message === 'NONCE_ALREADY_USED'
      ).toBe(true);
    });
  });

  describe('8. Unauthorized Transaction Rejection & Blind Verifier Independence', () => {
    it('blocks transaction and returns REJECTED status when amount exceeds contract max budget', async () => {
      const prepared = await simulator.prepareProtectedPurchase('Buy 2 litres of Amul Taaza milk under ₹150.');
      const { contract, recommendedOffer, assessment } = prepared;

      // Tamper amount to ₹250 (25000 paise), exceeding the ₹150 (15000 paise) signed limit
      const result = await simulator.executeProtectedPurchase({
        contract,
        selectedOffer: recommendedOffer,
        assessmentId: assessment.assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: true,
        customTotalAmountPaise: 25000
      });

      expect(result.verifierDecision.decision).toBe('BLOCK');
      expect(result.verifierDecision.checks.withinBudget).toBe(false);
      expect(result.simulatedPaymentResult?.status).toBe('REJECTED');

      // Verify assessment was NOT consumed by a blocked transaction
      const storedAssessment = await repository.getAssessmentById(assessment.assessmentId);
      expect(storedAssessment?.isConsumed).toBe(false);
    });

    it('blocks transaction when payee address is diverted to an attacker address', async () => {
      const prepared = await simulator.prepareProtectedPurchase('Buy 2 litres of Amul Taaza milk under ₹150.');
      const { contract, recommendedOffer, assessment } = prepared;

      // Tamper payee address
      const result = await simulator.executeProtectedPurchase({
        contract,
        selectedOffer: recommendedOffer,
        assessmentId: assessment.assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: true,
        customPayeeAddress: 'hacker@upi'
      });

      expect(result.verifierDecision.decision).toBe('BLOCK');
      expect(result.verifierDecision.checks.payeeMatch).toBe(false);
      expect(result.simulatedPaymentResult?.status).toBe('REJECTED');
    });

    it('strictly rejects execution if assessment HMAC binding signature is invalid', async () => {
      const prepared = await simulator.prepareProtectedPurchase('Buy 2 litres of Amul Taaza milk under ₹150.');
      const { contract, recommendedOffer, assessment } = prepared;

      // Corrupt binding signature
      assessment.bindingSignature = 'bad_corrupted_signature_0000000000000000000000000000000000000000';
      await repository.saveAssessment(assessment);

      await expect(
        simulator.executeProtectedPurchase({
          contract,
          selectedOffer: recommendedOffer,
          assessmentId: assessment.assessmentId,
          userApproved: true,
          userAcknowledgedAdvisory: true
        })
      ).rejects.toThrow('BINDING_SIGNATURE_MISMATCH');
    });
  });
});
