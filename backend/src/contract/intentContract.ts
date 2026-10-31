import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { ParsedIntent, SignedIntentContract } from '../types/index.js';

/**
 * Computes canonical string representation of intent contract fields for signing.
 */
export function getContractCanonicalString(data: {
  contractId: string;
  userRequest: string;
  category: string;
  productName: string;
  preferredBrand: string;
  variantOrModel: string;
  quantity: number;
  unit: string;
  maxBudgetPaise: number;
  mandatoryRequirements: string[];
  permittedSubstitutions: string[];
  nonce: string;
  createdAt: string;
  expiresAt: string;
}): string {
  return [
    `id:${data.contractId}`,
    `req:${data.userRequest.trim()}`,
    `cat:${data.category.trim().toLowerCase()}`,
    `prod:${data.productName.trim().toLowerCase()}`,
    `brand:${data.preferredBrand.trim().toLowerCase()}`,
    `variant:${data.variantOrModel.trim().toLowerCase()}`,
    `qty:${data.quantity}`,
    `unit:${data.unit.trim().toLowerCase()}`,
    `budget:${data.maxBudgetPaise}`,
    `mandatory:${[...data.mandatoryRequirements].sort().join('|')}`,
    `substitutions:${[...data.permittedSubstitutions].sort().join('|')}`,
    `nonce:${data.nonce}`,
    `created:${data.createdAt}`,
    `expires:${data.expiresAt}`
  ].join('::');
}

/**
 * Signs the contract using HMAC-SHA256 with the secret key.
 */
export function signContract(canonicalString: string, secret: string = ENV.CONTRACT_SIGNING_SECRET): string {
  return crypto.createHmac('sha256', secret).update(canonicalString).digest('hex');
}

/**
 * Verifies a contract signature against the canonical string.
 */
export function verifyContractSignature(
  contract: SignedIntentContract,
  secret: string = ENV.CONTRACT_SIGNING_SECRET
): boolean {
  const canonical = getContractCanonicalString({
    contractId: contract.contractId,
    userRequest: contract.userRequest,
    category: contract.category,
    productName: contract.productName,
    preferredBrand: contract.preferredBrand,
    variantOrModel: contract.variantOrModel,
    quantity: contract.quantity,
    unit: contract.unit,
    maxBudgetPaise: contract.maxBudgetPaise,
    mandatoryRequirements: contract.mandatoryRequirements,
    permittedSubstitutions: contract.permittedSubstitutions,
    nonce: contract.nonce,
    createdAt: contract.createdAt,
    expiresAt: contract.expiresAt
  });

  const expectedSignature = signContract(canonical, secret);
  return crypto.timingSafeEqual(
    Buffer.from(contract.signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Creates and signs a new Intent Contract from parsed intent.
 */
export function createSignedIntentContract(
  userRequest: string,
  intent: ParsedIntent,
  options?: {
    ttlMinutes?: number;
    customNonce?: string;
    signingSecret?: string;
  }
): SignedIntentContract {
  const contractId = `ct_${crypto.randomUUID().slice(0, 12)}`;
  const nonce = options?.customNonce || `nonce_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date();
  const ttl = options?.ttlMinutes ?? 15; // default 15 minutes validity
  const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);

  const contractData = {
    contractId,
    userRequest,
    category: intent.productCategory,
    productName: intent.productName,
    preferredBrand: intent.preferredBrand,
    variantOrModel: intent.variantOrModel,
    quantity: intent.quantity,
    unit: intent.unit,
    maxBudgetPaise: intent.maxBudgetPaise,
    mandatoryRequirements: intent.mandatoryRequirements || [],
    permittedSubstitutions: intent.permittedSubstitutions || [],
    nonce,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  const canonical = getContractCanonicalString(contractData);
  const signature = signContract(canonical, options?.signingSecret);

  return {
    ...contractData,
    signature
  };
}
