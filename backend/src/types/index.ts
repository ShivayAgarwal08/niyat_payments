import { z } from 'zod';

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
  ambiguityQuestion: z.string().optional()
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

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
  signature: string;
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
  authorizedAt: string;
}

export interface BlindVerifierInput {
  contract: SignedIntentContract;
  authorization: PurchaseAuthorization;
  merchantPayeeExpected?: string;
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
    isDemoData: boolean;
  }>;
}

export interface MarketIntelligenceReport {
  productId: string;
  productTitle: string;
  category: string;
  brand: string;
  variant: string;
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
    landedPricePaise: number; // base + delivery + handling - discount
    pricePerUnitPaise: number;
    inStock: boolean;
    isRecommended: boolean;
    recommendationReason?: string;
  }>;
  historicalPriceObservations: Array<{
    date: string;
    pricePaise: number;
    merchantName: string;
    isDemoData: true;
  }>;
  historicalAveragePaise?: number;
  priceTrendAdvisory?: string;
  isDemoData: true;
}
