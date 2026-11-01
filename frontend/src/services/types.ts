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

export interface NormalSimulationResult {
  isEducationalVulnerableSimulation: true;
  originalUserIntent: string;
  extractedGoal: {
    category: string;
    product: string;
    budgetPaise: number;
    quantity: number;
  };
  productInspected: {
    id: string;
    title: string;
    merchantName: string;
    originalPricePaise: number;
    productDescription: string;
  };
  attackPayloadDetected: string;
  manipulatedAction: {
    manipulationType: 'PAYMENT_REDIRECT' | 'AMOUNT_INFLATION' | 'UNAUTHORIZED_SUBSCRIPTION' | 'QUANTITY_INFLATION';
    divertedPayee: string;
    manipulatedAmountPaise: number;
    explanation: string;
  };
  simulatedPaymentExecution: {
    executed: boolean;
    txId: string;
    debitAmountPaise: number;
    recipientPayee: string;
    status: 'UNAUTHORIZED_SIMULATED_PAYMENT';
    timestamp: string;
  };
  securityFailureAnalysis: {
    vulnerability: string;
    rootCause: string;
    impact: string;
    howNiyatFixesThis: string;
  };
}

export interface SecurityScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultPrompt: string;
  attackVector: string;
}

export interface SecurityRunResult {
  id: string;
  scenarioId: string;
  scenarioName: string;
  attackCategory: string;
  originalIntent: string;
  maliciousPayload: string;
  normalModeResult: any;
  niyatModeResult: BlindVerifierDecision;
  verifierDecision: 'ALLOW' | 'ASK' | 'BLOCK';
  blocked: boolean;
  reason: string;
  executedAt: string;
}

export interface TransactionRecord {
  id: string;
  mode: 'NORMAL' | 'PROTECTED';
  status: 'ALLOW' | 'ASK' | 'BLOCK' | 'UNAUTHORIZED_PURCHASE';
  userRequest: string;
  productId?: string;
  productTitle: string;
  merchantName: string;
  payeeAddress: string;
  quantity: number;
  totalAmountPaise: number;
  verifierDecision?: string;
  securityExplanation?: string;
  createdAt: string;
}

export interface AIProviderStatus {
  name: string;
  isConfigured: boolean;
  isAvailable: boolean;
  circuitBreakerOpen: boolean;
  consecutiveFailures: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  lastError?: string;
}
