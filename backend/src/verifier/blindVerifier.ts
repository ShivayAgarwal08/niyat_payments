import {
  BlindVerifierInput,
  BlindVerifierDecision,
  SignedIntentContract,
  PurchaseAuthorization
} from '../types/index.js';
import { verifyContractSignature } from '../contract/intentContract.js';

export interface NonceStore {
  isNonceUsed(nonce: string): Promise<boolean>;
  markNonceUsed(nonce: string, contractId: string): Promise<void>;
  claimNonceAtomic?(nonce: string, contractId: string): Promise<boolean>;
}

export class BlindVerifier {
  private nonceStore: NonceStore;

  constructor(nonceStore: NonceStore) {
    this.nonceStore = nonceStore;
  }

  /**
   * Deterministically verifies a purchase authorization against the signed intent contract.
   * Receives ONLY normalized, structured data.
   * NEVER receives raw HTML, untrusted product descriptions, or AI reasoning traces.
   */
  async verify(input: BlindVerifierInput): Promise<BlindVerifierDecision> {
    const { contract, authorization, merchantPayeeExpected } = input;
    const reasons: string[] = [];
    let isBlocked = false;
    let needsConfirmation = false;
    let securityAlert: string | undefined;

    // Check 1: Contract signature validity
    let signatureValid = false;
    try {
      signatureValid = verifyContractSignature(contract);
      if (!signatureValid) {
        reasons.push('CRITICAL: Intent contract signature is invalid or has been tampered with.');
        isBlocked = true;
        securityAlert = 'Contract Tampering Detected: Signature mismatch';
      }
    } catch {
      signatureValid = false;
      reasons.push('CRITICAL: Failed to verify contract cryptographic signature.');
      isBlocked = true;
      securityAlert = 'Malformed Contract Signature';
    }

    // Check 2: Contract expiry
    const now = new Date();
    const expiryDate = new Date(contract.expiresAt);
    const unexpired = now.getTime() <= expiryDate.getTime();
    if (!unexpired) {
      reasons.push(`CRITICAL: Contract expired at ${contract.expiresAt} (current time: ${now.toISOString()}).`);
      isBlocked = true;
      securityAlert = 'Expired Contract Used: Purchase rejected due to stale intent';
    }

    // Check 3: Nonce replay prevention
    const isReplay = await this.nonceStore.isNonceUsed(contract.nonce);
    const nonceFresh = !isReplay;
    if (isReplay) {
      reasons.push(`CRITICAL: Nonce ${contract.nonce} has already been consumed. Replay attack prevented.`);
      isBlocked = true;
      securityAlert = 'Replay Attack Prevented: Contract nonce already spent';
    }

    // Check 4 & 5: Product identity, Brand and Variant
    const normalizedContractBrand = contract.preferredBrand.trim().toLowerCase();
    const normalizedAuthBrand = authorization.brand.trim().toLowerCase();
    const normalizedContractProduct = contract.productName.trim().toLowerCase();
    const normalizedAuthProduct = authorization.productTitle.trim().toLowerCase();

    // Check direct match
    const exactBrandMatch =
      normalizedAuthBrand.includes(normalizedContractBrand) ||
      normalizedContractBrand.includes(normalizedAuthBrand);

    const productWords = normalizedContractProduct.split(/\s+/).filter(w => w.length > 2);
    const productMatch = productWords.some(word => normalizedAuthProduct.includes(word));

    // Check permitted substitutions
    let substitutionStatus: 'VALID' | 'REQUIRES_EXPLICIT_CONFIRMATION' | 'UNAUTHORIZED' = 'VALID';
    if (!exactBrandMatch) {
      const isPermittedSub = contract.permittedSubstitutions.some(
        sub => normalizedAuthBrand.includes(sub.toLowerCase()) || sub.toLowerCase().includes(normalizedAuthBrand)
      );
      if (isPermittedSub) {
        substitutionStatus = 'REQUIRES_EXPLICIT_CONFIRMATION';
        needsConfirmation = true;
        reasons.push(`Substitute brand "${authorization.brand}" permitted by contract but requires explicit user confirmation.`);
      } else {
        substitutionStatus = 'UNAUTHORIZED';
        reasons.push(`UNAUTHORIZED: Selected brand "${authorization.brand}" does not match signed contract brand "${contract.preferredBrand}".`);
        isBlocked = true;
        securityAlert = 'Unauthorized Brand/Product Substitution Blocked';
      }
    }

    if (!productMatch && substitutionStatus !== 'REQUIRES_EXPLICIT_CONFIRMATION') {
      reasons.push(`UNAUTHORIZED: Selected product "${authorization.productTitle}" does not match requested "${contract.productName}".`);
      isBlocked = true;
      securityAlert = 'Product Hijack Blocked: Target item mismatch';
    }

    const brandAndVariantMatch = exactBrandMatch || substitutionStatus === 'REQUIRES_EXPLICIT_CONFIRMATION';

    // Check 6: Quantity and unit
    const quantityMatch = authorization.quantity === contract.quantity;
    if (!quantityMatch) {
      reasons.push(`UNAUTHORIZED: Requested quantity (${contract.quantity} ${contract.unit}) does not match authorized quantity (${authorization.quantity} ${authorization.unit}).`);
      isBlocked = true;
      securityAlert = 'Quantity Inflation Blocked: Attempted order quantity change';
    }

    // Check 7 & 8: Payee and Merchant identity
    let payeeMatch = true;
    if (merchantPayeeExpected && authorization.payeeAddress !== merchantPayeeExpected) {
      payeeMatch = false;
      reasons.push(`UNAUTHORIZED: Payee address "${authorization.payeeAddress}" does not match verified merchant payee "${merchantPayeeExpected}".`);
      isBlocked = true;
      securityAlert = 'Payee Substitution Blocked: Diverted payment destination';
    }

    // Check 9 & 10: Final landed amount and Budget
    const withinBudget = authorization.totalAmountPaise <= contract.maxBudgetPaise;
    if (!withinBudget) {
      const diffPaise = authorization.totalAmountPaise - contract.maxBudgetPaise;
      const diffPct = (diffPaise / contract.maxBudgetPaise) * 100;
      const diffRupees = (diffPaise / 100).toFixed(2);
      const isApproximateBudget =
        contract.userRequest.toLowerCase().includes('around') ||
        contract.userRequest.toLowerCase().includes('approx') ||
        contract.userRequest.toLowerCase().includes('about') ||
        Boolean((contract as any).budgetTolerancePct);

      if (isApproximateBudget && diffPct <= 25) {
        // Slight variance on approximate budget triggers ASK
        needsConfirmation = true;
        reasons.push(
          `Price Variance Alert: Landed price ₹${(authorization.totalAmountPaise / 100).toFixed(2)} exceeds estimated budget ₹${(contract.maxBudgetPaise / 100).toFixed(2)} by ${diffPct.toFixed(1)}% (₹${diffRupees}). User confirmation required (ASK).`
        );
      } else {
        reasons.push(
          `UNAUTHORIZED: Final landed price ₹${(authorization.totalAmountPaise / 100).toFixed(2)} exceeds maximum budget ₹${(contract.maxBudgetPaise / 100).toFixed(2)} by ₹${diffRupees}.`
        );
        isBlocked = true;
        securityAlert = 'Budget Exceeded: Transaction blocked by budget firewall';
      }
    }

    // Check 11 & 12: Purchase authorization validity & user approval
    const authorizationValid = authorization.userApproved === true;
    if (!authorizationValid) {
      reasons.push('UNAUTHORIZED: Autonomous payment attempted without explicit user confirmation.');
      isBlocked = true;
      securityAlert = 'Unapproved Purchase Blocked: User approval required before execution';
    }

    // Determine final verdict
    let decision: 'ALLOW' | 'ASK' | 'BLOCK' = 'ALLOW';
    if (isBlocked) {
      decision = 'BLOCK';
    } else if (needsConfirmation) {
      if (input.userConfirmedVariance || authorization.userConfirmedVariance) {
        decision = 'ALLOW';
        reasons.push('User explicitly reviewed and approved the revised price variance / substitution.');
      } else {
        decision = 'ASK';
      }
    } else {
      if (input.skipNonceClaim) {
        // Nonce freshness was verified in Check 3; actual consumption is deferred to the atomic transaction
        reasons.push('All deterministic security checks passed: Valid signature, fresh nonce, exact product match, verified merchant payee, within budget, and user-approved.');
      } else {
        // Atomic claim to eliminate race conditions / double spends
        const claimed = await (this.nonceStore.claimNonceAtomic
          ? this.nonceStore.claimNonceAtomic(contract.nonce, contract.contractId)
          : (async () => {
              if (await this.nonceStore.isNonceUsed(contract.nonce)) return false;
              await this.nonceStore.markNonceUsed(contract.nonce, contract.contractId);
              return true;
            })());

        if (!claimed) {
          decision = 'BLOCK';
          reasons.push(`CRITICAL: Concurrent replay race condition detected. Nonce ${contract.nonce} was claimed by another thread during verification.`);
          securityAlert = 'Replay Attack Prevented: Concurrent nonce claim detected';
        } else {
          reasons.push('All deterministic security checks passed: Valid signature, fresh nonce, exact product match, verified merchant payee, within budget, and user-approved.');
        }
      }
    }

    return {
      decision,
      reasons,
      checks: {
        signatureValid,
        unexpired,
        nonceFresh,
        productMatch,
        brandAndVariantMatch,
        quantityMatch,
        payeeMatch,
        withinBudget,
        authorizationValid,
        substitutionStatus
      },
      securityAlert
    };
  }
}
