import { z } from 'zod';

export type ShoppingMode = 'NORMAL' | 'PROTECTED';

export const ParsedIntentSchema = z.object({
  productCategory: z.string(), // Milk, Laptop, Smartphone, Shoes, Groceries, etc.
  productName: z.string(),
  preferredBrand: z.string(),
  variantOrModel: z.string(),
  quantity: z.number().positive(),
  unit: z.string(), // Litre, Unit, Kg, Pair, Pack
  maxBudgetPaise: z.number().int().nonnegative(),
  mandatoryRequirements: z.array(z.string()).default([]),
  optionalPreferences: z.array(z.string()).default([]),
  permittedSubstitutions: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(1),
  ambiguityQuestion: z.string().nullable().optional()
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

export interface StructuredPurchaseIntent {
  productCategory: string; // e.g. "Milk", "Laptop", "Smartphone"
  productName: string;     // e.g. "Amul Taaza Milk", "MacBook Air"
  preferredBrand: string;  // e.g. "Amul", "Apple"
  variantOrModel: string;  // e.g. "Taaza Toned", "M2 8GB 256GB"
  quantity: number;
  unit: string;            // e.g. "Litre", "Unit", "Kg"
  maxBudgetPaise: number;  // in integer paise (₹1 = 100 paise)
  mandatoryRequirements: string[];
  optionalPreferences: string[];
  permittedSubstitutions: string[];
  confidence?: number;
}

export interface SignedIntentContract {
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
  signature: string; // HMAC-SHA256 signature
}

export interface PurchaseAuthorization {
  contractId: string;
  productId: string;
  productTitle: string;
  brand: string;
  variant: string;
  merchantId: string;
  merchantName: string;
  payeeAddress: string;
  quantity: number;
  unit: string;
  itemPricePaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  totalAmountPaise: number;
  userApproved: boolean;
  userConfirmedVariance?: boolean;
  authorizedAt: string;
}

export interface BlindVerifierInput {
  contract: SignedIntentContract;
  authorization: PurchaseAuthorization;
  merchantPayeeExpected?: string;
  skipNonceClaim?: boolean;
  userConfirmedVariance?: boolean;
}

export interface BlindVerifierDecision {
  decision: 'ALLOW' | 'ASK' | 'BLOCK';
  reasons: string[];
  checks: {
    signatureValid: boolean;
    unexpired: boolean;
    nonceFresh: boolean;
    productMatch: boolean;
    brandAndVariantMatch: boolean;
    quantityMatch: boolean;
    payeeMatch: boolean;
    withinBudget: boolean;
    authorizationValid: boolean;
    substitutionStatus: 'VALID' | 'REQUIRES_EXPLICIT_CONFIRMATION' | 'UNAUTHORIZED';
  };
  securityAlert?: string;
}

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  brand: string;
  variant: string;
  unit: string;
  packageSize: number;
  basePricePaise: number;
  discountPaise: number;
  inStock: boolean;
  description: string;
  maliciousInstruction?: string | null;
  merchantId: string;
  merchant: {
    id: string;
    name: string;
    slug: string;
    rating: number;
    isVerified: boolean;
    payeeAddress: string;
    deliveryFeePaise: number;
    platformFeePaise: number;
  };
  marketPrices?: Array<{
    id: string;
    pricePaise: number;
    observedDate: string;
    sourceMerchant: string;
    sourceType?: string;
    isDemoData: boolean;
  }>;
}

export type MarketDecision =
  | 'BUY_NOW'
  | 'WAIT'
  | 'REVIEW'
  | 'INSUFFICIENT_DATA'
  | 'DATA_UNAVAILABLE';

export interface MarketAssessmentRecord {
  id: string;
  assessmentId: string;
  contractId: string;
  productId: string;
  productTitle: string;
  brand: string;
  variant: string;
  packageSizeBaseUnits: number;
  baseUnit: string;
  merchantId: string;
  merchantName: string;
  payeeAddress: string;
  quantity: number;
  basePricePaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  landedPricePaise: number;
  pricePerStandardUnitPaise: number;
  feeSkewBps: number;
  decision: MarketDecision;
  decisionReason: string;
  requiresAcknowledgement: boolean;
  bindingSignature: string;
  isConsumed: boolean;
  consumedAt?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface MarketIntelligenceReport {
  productId: string;
  productTitle: string;
  category: string;
  brand: string;
  variant: string;
  assessmentId?: string;
  decision?: MarketDecision;
  decisionReason?: string;
  requiresAcknowledgement?: boolean;
  offers: Array<{
    productId: string;
    merchantId: string;
    merchantName: string;
    merchantRating: number;
    payeeAddress: string;
    basePricePaise: number;
    deliveryFeePaise: number;
    handlingFeePaise: number;
    discountPaise: number;
    landedPricePaise: number;
    pricePerUnitPaise: number;
    inStock: boolean;
    isRecommended: boolean;
    recommendationReason?: string;
  }>;
  historicalPriceObservations: Array<{
    date: string;
    pricePaise: number;
    merchantName: string;
    sourceType?: string;
    isDemoData: true;
  }>;
  historicalAveragePaise?: number;
  priceTrendAdvisory?: string;
  isDemoData: true;
  trends?: {
    window7Day?: {
      available: boolean;
      sampleCount: number;
      averagePaise?: number;
      trendDirection: 'RISING' | 'FALLING' | 'STABLE' | 'UNKNOWN';
    };
    window30Day?: {
      available: boolean;
      sampleCount: number;
      averagePaise?: number;
      medianPaise?: number;
      diffFromMedianPercent?: number;
    };
    window90Day?: {
      available: boolean;
      sampleCount: number;
      averagePaise?: number;
    };
  };
  provenance?: {
    isDemoData: true;
    sourceType: string;
    observationCount: number;
    lastObservedDate: string;
    freshnessHours: number;
    disclaimer: string;
  };
}

export interface WalletRecord {
  id: string;
  ownerId: string;
  ownerType: 'USER' | 'MERCHANT';
  ownerName: string;
  upiId: string;
  balancePaise: number;
  currency: string;
  isDemoWallet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletLedgerRecord {
  id: string;
  transactionRef: string;
  type: 'TOPUP' | 'P2P_TRANSFER' | 'PROTECTED_PURCHASE';
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  amountPaise: number;
  feePaise: number;
  note?: string | null;
  sourceWalletId?: string | null;
  targetWalletId?: string | null;
  sourceUpiId: string;
  targetUpiId: string;
  contractId?: string | null;
  assessmentId?: string | null;
  verifierDecision?: string | null;
  isDemoData: boolean;
  createdAt: string;
}

export interface WalletSummary {
  wallet: WalletRecord;
  balanceRupees: number;
  recentLedgers: WalletLedgerRecord[];
}
