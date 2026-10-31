import { describe, it, expect, beforeEach } from 'vitest';
import { createSignedIntentContract, verifyContractSignature } from '../contract/intentContract.js';
import { BlindVerifier, NonceStore } from '../verifier/blindVerifier.js';
import { PurchaseAuthorization } from '../types/index.js';

class MockNonceStore implements NonceStore {
  private used = new Set<string>();

  async isNonceUsed(nonce: string): Promise<boolean> {
    return this.used.has(nonce);
  }

  async markNonceUsed(nonce: string, _contractId: string): Promise<void> {
    this.used.add(nonce);
  }

  async claimNonceAtomic(nonce: string, _contractId: string): Promise<boolean> {
    if (this.used.has(nonce)) return false;
    this.used.add(nonce);
    return true;
  }
}

describe('Intent Contract & Blind Verifier', () => {
  let nonceStore: MockNonceStore;
  let verifier: BlindVerifier;

  beforeEach(() => {
    nonceStore = new MockNonceStore();
    verifier = new BlindVerifier(nonceStore);
  });

  const validIntent = {
    productCategory: 'Milk',
    productName: 'Amul Taaza Toned Milk',
    preferredBrand: 'Amul',
    variantOrModel: 'Taaza Toned',
    quantity: 2,
    unit: 'Litre',
    maxBudgetPaise: 15000, // ₹150
    mandatoryRequirements: ['Toned milk pasteurized'],
    optionalPreferences: [],
    permittedSubstitutions: ['Mother Dairy'],
    confidence: 1.0
  };

  it('generates a cryptographically valid signed contract', () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);
    expect(contract.signature).toBeDefined();
    expect(contract.nonce).toBeDefined();
    expect(verifyContractSignature(contract)).toBe(true);
  });

  it('detects signature tampering on the contract', () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);
    const tampered = { ...contract, maxBudgetPaise: 999999 };
    expect(verifyContractSignature(tampered)).toBe(false);
  });

  it('ALLOWs a fully valid purchase authorization', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800, // ₹128 <= ₹150 budget
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({
      contract,
      authorization,
      merchantPayeeExpected: 'quickmart@upi'
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.checks.signatureValid).toBe(true);
    expect(result.checks.unexpired).toBe(true);
    expect(result.checks.nonceFresh).toBe(true);
    expect(result.checks.withinBudget).toBe(true);
    expect(result.checks.productMatch).toBe(true);
  });

  it('BLOCKs when amount exceeds maximum signed budget', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 5000,
      platformFeePaise: 1000,
      discountPaise: 0,
      totalAmountPaise: 16800, // ₹168.00 > ₹150.00
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(result.decision).toBe('BLOCK');
    expect(result.checks.withinBudget).toBe(false);
    expect(result.securityAlert).toContain('Budget Exceeded');
  });

  it('BLOCKs when payee is substituted with attacker address', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'diverted_attacker@upi', // ATTACK!
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(result.decision).toBe('BLOCK');
    expect(result.checks.payeeMatch).toBe(false);
    expect(result.securityAlert).toContain('Payee Substitution');
  });

  it('BLOCKs expired contract', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent, {
      ttlMinutes: -10 // already expired in past
    });

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(result.decision).toBe('BLOCK');
    expect(result.checks.unexpired).toBe(false);
    expect(result.securityAlert).toContain('Expired Contract');
  });

  it('BLOCKs replayed nonce', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    // First execution passes and consumes nonce
    const firstRes = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(firstRes.decision).toBe('ALLOW');

    // Second execution with identical nonce must be BLOCKED
    const secondRes = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(secondRes.decision).toBe('BLOCK');
    expect(secondRes.checks.nonceFresh).toBe(false);
    expect(secondRes.securityAlert).toContain('Replay Attack');
  });

  it('BLOCKs quantity inflation', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 5, // Inflated from 2 to 5!
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(result.decision).toBe('BLOCK');
    expect(result.checks.quantityMatch).toBe(false);
  });

  it('BLOCKs unauthorized product mismatch', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_mystery_gift',
      productTitle: 'Luxury Gold Watch',
      brand: 'RogueBrand',
      variant: 'Gold',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 2,
      unit: 'Unit',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(result.decision).toBe('BLOCK');
    expect(result.checks.productMatch).toBe(false);
  });

  it('returns ASK when a permitted substitution requires user confirmation', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    // Substitute Mother Dairy (which is in permittedSubstitutions list)
    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_motherdairy_toned',
      productTitle: 'Mother Dairy Toned Milk 1L',
      brand: 'Mother Dairy',
      variant: 'Toned',
      merchantId: 'm_freshbazaar',
      merchantName: 'FreshBazaar Direct',
      payeeAddress: 'freshbazaar@upi',
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'freshbazaar@upi' });
    expect(result.decision).toBe('ASK');
    expect(result.checks.substitutionStatus).toBe('REQUIRES_EXPLICIT_CONFIRMATION');
  });

  it('BLOCKs autonomous payment when user did not explicitly approve', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: false, // NOT approved by user!
      authorizedAt: new Date().toISOString()
    };

    const result = await verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' });
    expect(result.decision).toBe('BLOCK');
    expect(result.checks.authorizationValid).toBe(false);
  });

  it('prevents concurrent double-spend attempts with the exact same nonce', async () => {
    const contract = createSignedIntentContract('Buy 2 litres of Amul Taaza milk under ₹150.', validIntent);

    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: 'prod_amul_taaza',
      productTitle: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul',
      variant: 'Taaza Toned',
      merchantId: 'm_quickmart',
      merchantName: 'QuickMart Express',
      payeeAddress: 'quickmart@upi',
      quantity: 2,
      unit: 'Litre',
      itemPricePaise: 10800,
      deliveryFeePaise: 1500,
      platformFeePaise: 500,
      discountPaise: 0,
      totalAmountPaise: 12800,
      userApproved: true,
      authorizedAt: new Date().toISOString()
    };

    // Run two simultaneous verify calls concurrently
    const [resA, resB] = await Promise.all([
      verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' }),
      verifier.verify({ contract, authorization, merchantPayeeExpected: 'quickmart@upi' })
    ]);

    // Exactly one must succeed with ALLOW and the other MUST be BLOCKED
    const decisions = [resA.decision, resB.decision].sort();
    expect(decisions).toEqual(['ALLOW', 'BLOCK']);
  });
});
