import crypto from 'crypto';
import {
  ProductItem,
  MarketDecision,
  MarketAssessmentRecord,
  MarketIntelligenceReport
} from '../types/index.js';

export interface CanonicalAssessmentBinding {
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
  decision: MarketDecision;
  requiresAcknowledgement: boolean;
  createdAt: string;
  expiresAt: string;
}

/**
 * Normalizes package specifications into integer base units (ml, g, unit)
 * to strictly prevent any floating-point arithmetic.
 */
export function normalizePackageToBaseUnits(
  packageSize: number,
  unit: string
): { packageSizeBaseUnits: number; baseUnit: string } {
  const u = unit.trim().toLowerCase();
  if (u.includes('litre') || u === 'l' || u.includes('liter')) {
    return {
      packageSizeBaseUnits: Math.max(1, Math.round(packageSize * 1000)),
      baseUnit: 'ml'
    };
  }
  if (u.includes('kg') || u.includes('kilo')) {
    return {
      packageSizeBaseUnits: Math.max(1, Math.round(packageSize * 1000)),
      baseUnit: 'g'
    };
  }
  return {
    packageSizeBaseUnits: Math.max(1, Math.round(packageSize)),
    baseUnit: 'unit'
  };
}

/**
 * Calculates landed unit price in integer paise per standard unit (1 Litre, 1 Kg, or 1 item).
 */
export function calculateStandardUnitPricePaise(
  landedPricePaise: number,
  packageSizeBaseUnits: number,
  baseUnit: string
): number {
  if (packageSizeBaseUnits <= 0) return landedPricePaise;

  if (baseUnit === 'ml') {
    // Standard unit: 1 Litre = 1000 ml
    return Math.round((landedPricePaise * 1000) / packageSizeBaseUnits);
  }
  if (baseUnit === 'g') {
    // Standard unit: 1 Kg = 1000 g
    return Math.round((landedPricePaise * 1000) / packageSizeBaseUnits);
  }
  // Discrete unit: 1 item
  return Math.round(landedPricePaise / packageSizeBaseUnits);
}

/**
 * Calculates fee skew in integer basis points (1% = 100 bps, 25% = 2500 bps).
 */
export function calculateFeeSkewBps(
  deliveryFeePaise: number,
  platformFeePaise: number,
  landedPricePaise: number
): number {
  if (landedPricePaise <= 0) return 0;
  return Math.floor(((deliveryFeePaise + platformFeePaise) * 10000) / landedPricePaise);
}

/**
 * Computes canonical deterministic string serialization for HMAC-SHA256 binding.
 */
export function computeCanonicalAssessmentString(data: CanonicalAssessmentBinding): string {
  return [
    'NIYAT_ASSESSMENT_V1',
    data.assessmentId,
    data.contractId,
    data.productId,
    data.productTitle.trim(),
    data.brand.trim(),
    data.variant.trim(),
    data.packageSizeBaseUnits.toString(),
    data.baseUnit.trim().toLowerCase(),
    data.merchantId,
    data.merchantName.trim(),
    data.payeeAddress.trim().toLowerCase(),
    Math.round(data.quantity).toString(),
    data.basePricePaise.toString(),
    data.deliveryFeePaise.toString(),
    data.platformFeePaise.toString(),
    data.discountPaise.toString(),
    data.landedPricePaise.toString(),
    data.pricePerStandardUnitPaise.toString(),
    data.decision,
    data.requiresAcknowledgement ? 'TRUE' : 'FALSE',
    data.createdAt,
    data.expiresAt
  ].join('|');
}

/**
 * Signs the canonical assessment binding using HMAC-SHA256.
 */
export function createAssessmentBindingSignature(
  data: CanonicalAssessmentBinding,
  secret: string
): string {
  const canonical = computeCanonicalAssessmentString(data);
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

/**
 * Validates the canonical assessment binding using timing-safe comparison.
 */
export function verifyAssessmentBindingSignature(
  data: CanonicalAssessmentBinding,
  signature: string,
  secret: string
): boolean {
  if (!signature || typeof signature !== 'string') return false;
  const expected = createAssessmentBindingSignature(data, secret);
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export interface HistoricalObservation {
  date: string;
  pricePaise: number;
  merchantName: string;
  sourceType?: string;
  isDemoData: boolean;
}

export interface MultiWindowAnalysis {
  decision: MarketDecision;
  decisionReason: string;
  requiresAcknowledgement: boolean;
  diffFromMedianBps?: number;
  trends: {
    window7Day: {
      available: boolean;
      sampleCount: number;
      averagePaise?: number;
      trendDirection: 'RISING' | 'FALLING' | 'STABLE' | 'UNKNOWN';
    };
    window30Day: {
      available: boolean;
      sampleCount: number;
      averagePaise?: number;
      medianPaise?: number;
      diffFromMedianPercent?: number;
    };
    window90Day: {
      available: boolean;
      sampleCount: number;
      averagePaise?: number;
    };
  };
  provenance: {
    isDemoData: true;
    sourceType: string;
    observationCount: number;
    lastObservedDate: string;
    freshnessHours: number;
    disclaimer: string;
  };
}

export class MarketIntelligenceEngine {
  /**
   * Deterministically evaluates market price history for an exact product variant.
   * Compares current landed unit price ONLY against historical observations
   * with exact variant and unit equivalence.
   */
  public evaluateMarketWindows(params: {
    currentLandedPricePaise: number;
    feeSkewBps: number;
    isSubstituteVariant: boolean;
    observations: HistoricalObservation[];
    now?: Date;
  }): MultiWindowAnalysis {
    const {
      currentLandedPricePaise,
      feeSkewBps,
      isSubstituteVariant,
      observations,
      now = new Date()
    } = params;

    // Filter strictly for comparable observations (exclude category-only benchmarks from exact median)
    const exactObservations = observations.filter(
      o => o.sourceType !== 'CATEGORY_BENCHMARK_INDEX'
    );

    // Provenance default
    const provenanceDisclaimer =
      'SYNTHETIC DEMO DATA — Generated for NIYAT security architecture testing. Not live commercial exchange prices.';

    if (!exactObservations || exactObservations.length === 0) {
      return {
        decision: 'DATA_UNAVAILABLE',
        decisionReason:
          'No historical market observations found for this exact variant. Manual price verification recommended.',
        requiresAcknowledgement: true,
        trends: {
          window7Day: { available: false, sampleCount: 0, trendDirection: 'UNKNOWN' },
          window30Day: { available: false, sampleCount: 0 },
          window90Day: { available: false, sampleCount: 0 }
        },
        provenance: {
          isDemoData: true,
          sourceType: 'SYNTHETIC_DEMO',
          observationCount: 0,
          lastObservedDate: 'N/A',
          freshnessHours: 9999,
          disclaimer: provenanceDisclaimer
        }
      };
    }

    // Sort observations descending by date
    const sorted = [...exactObservations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const newestDate = new Date(sorted[0].date);
    const freshnessHours = Math.max(
      0,
      Math.floor((now.getTime() - newestDate.getTime()) / (1000 * 60 * 60))
    );

    // Stale data check: observations older than 14 days (336 hours) are invalid
    if (freshnessHours > 336) {
      return {
        decision: 'DATA_UNAVAILABLE',
        decisionReason: `Historical market observations are stale (${Math.floor(freshnessHours / 24)} days old, max permitted 14 days). Live market baseline is unavailable.`,
        requiresAcknowledgement: true,
        trends: {
          window7Day: { available: false, sampleCount: 0, trendDirection: 'UNKNOWN' },
          window30Day: { available: false, sampleCount: 0 },
          window90Day: { available: false, sampleCount: 0 }
        },
        provenance: {
          isDemoData: true,
          sourceType: 'SYNTHETIC_DEMO',
          observationCount: sorted.length,
          lastObservedDate: sorted[0].date,
          freshnessHours,
          disclaimer: provenanceDisclaimer
        }
      };
    }

    // Date boundary cutoffs (in integer milliseconds)
    const ms7d = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const ms30d = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const ms90d = now.getTime() - 90 * 24 * 60 * 60 * 1000;

    const obs7d = sorted.filter(o => new Date(o.date).getTime() >= ms7d);
    const obs30d = sorted.filter(o => new Date(o.date).getTime() >= ms30d);
    const obs90d = sorted.filter(o => new Date(o.date).getTime() >= ms90d);

    // 7-day window simple moving average
    let sma7: number | undefined;
    let trendDir: 'RISING' | 'FALLING' | 'STABLE' | 'UNKNOWN' = 'UNKNOWN';
    if (obs7d.length >= 3) {
      const sum7 = obs7d.reduce((acc, o) => acc + o.pricePaise, 0);
      sma7 = Math.floor(sum7 / obs7d.length);
      const diffBps7 = Math.floor(((currentLandedPricePaise - sma7) * 10000) / sma7);
      if (diffBps7 >= 300) trendDir = 'RISING';
      else if (diffBps7 <= -300) trendDir = 'FALLING';
      else trendDir = 'STABLE';
    }

    // 30-day window average & median
    let avg30: number | undefined;
    let med30: number | undefined;
    let diffBps30: number | undefined;

    if (obs30d.length >= 5) {
      const sum30 = obs30d.reduce((acc, o) => acc + o.pricePaise, 0);
      avg30 = Math.floor(sum30 / obs30d.length);

      const pricesAsc = obs30d.map(o => o.pricePaise).sort((a, b) => a - b);
      const mid = Math.floor(pricesAsc.length / 2);
      if (pricesAsc.length % 2 === 1) {
        med30 = pricesAsc[mid];
      } else {
        med30 = Math.floor((pricesAsc[mid - 1] + pricesAsc[mid]) / 2);
      }
      diffBps30 = Math.floor(((currentLandedPricePaise - med30) * 10000) / med30);
    }

    // 90-day window baseline average
    let avg90: number | undefined;
    if (obs90d.length >= 12) {
      const sum90 = obs90d.reduce((acc, o) => acc + o.pricePaise, 0);
      avg90 = Math.floor(sum90 / obs90d.length);
    }

    // Build trend stats
    const trends: MultiWindowAnalysis['trends'] = {
      window7Day: {
        available: obs7d.length >= 3,
        sampleCount: obs7d.length,
        averagePaise: sma7,
        trendDirection: trendDir
      },
      window30Day: {
        available: obs30d.length >= 5,
        sampleCount: obs30d.length,
        averagePaise: avg30,
        medianPaise: med30,
        diffFromMedianPercent: diffBps30 !== undefined ? diffBps30 / 100 : undefined
      },
      window90Day: {
        available: obs90d.length >= 12,
        sampleCount: obs90d.length,
        averagePaise: avg90
      }
    };

    const provenance: MultiWindowAnalysis['provenance'] = {
      isDemoData: true,
      sourceType: 'SYNTHETIC_DEMO',
      observationCount: sorted.length,
      lastObservedDate: sorted[0].date,
      freshnessHours,
      disclaimer: provenanceDisclaimer
    };

    // --- Deterministic Decision Precedence ---

    // Priority 2: INSUFFICIENT_DATA (strictly takes precedence over BUY_NOW or WAIT)
    if (obs30d.length < 5 || obs7d.length < 3 || med30 === undefined || diffBps30 === undefined) {
      return {
        decision: 'INSUFFICIENT_DATA',
        decisionReason: `Insufficient observation density (n=${obs30d.length} in 30 days, minimum 5 required). Cannot verify fair market median with confidence.`,
        requiresAcknowledgement: true,
        diffFromMedianBps: undefined,
        trends,
        provenance
      };
    }

    // Priority 3: REVIEW for fee skew or product substitution
    if (isSubstituteVariant) {
      return {
        decision: 'REVIEW',
        decisionReason:
          'Selected offer is a permitted substitute variant, not the exact requested variant. User review required.',
        requiresAcknowledgement: true,
        diffFromMedianBps: diffBps30,
        trends,
        provenance
      };
    }

    if (feeSkewBps > 2500) {
      const skewPct = Math.round(feeSkewBps / 100);
      return {
        decision: 'REVIEW',
        decisionReason: `Delivery and platform fees comprise ${skewPct}% of the total landed cost (threshold: 25%). Review fee breakdown before approving.`,
        requiresAcknowledgement: true,
        diffFromMedianBps: diffBps30,
        trends,
        provenance
      };
    }

    // Priority 4: WAIT for significantly elevated price (>= +15.0% above 30d median)
    if (diffBps30 >= 1500) {
      const pct = (diffBps30 / 100).toFixed(1);
      return {
        decision: 'WAIT',
        decisionReason: `Current landed price (₹${(currentLandedPricePaise / 100).toFixed(2)}) is ${pct}% above the 30-day fair market median (₹${(med30 / 100).toFixed(2)}). Consider waiting for price normalization.`,
        requiresAcknowledgement: true,
        diffFromMedianBps: diffBps30,
        trends,
        provenance
      };
    }

    // Priority 5: BUY_NOW (at or below 30d median)
    if (diffBps30 <= 0 && feeSkewBps <= 2500) {
      return {
        decision: 'BUY_NOW',
        decisionReason: `Landed price is at or below the 30-day fair market median (₹${(med30 / 100).toFixed(2)}) with standard fee distribution.`,
        requiresAcknowledgement: false,
        diffFromMedianBps: diffBps30,
        trends,
        provenance
      };
    }

    // Default: REVIEW (moderately elevated: 0% < diff < 15%)
    const pctElev = (diffBps30 / 100).toFixed(1);
    return {
      decision: 'REVIEW',
      decisionReason: `Current landed price is slightly elevated (+${pctElev}%) compared to the 30-day market median (₹${(med30 / 100).toFixed(2)}).`,
      requiresAcknowledgement: true,
      diffFromMedianBps: diffBps30,
      trends,
      provenance
    };
  }
}

export const marketIntelligenceEngine = new MarketIntelligenceEngine();
