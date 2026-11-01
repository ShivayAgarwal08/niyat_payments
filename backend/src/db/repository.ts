import { PrismaClient } from '@prisma/client';
import {
  ProductItem,
  MarketIntelligenceReport,
  SignedIntentContract,
  MarketAssessmentRecord,
  WalletRecord,
  WalletLedgerRecord,
  WalletSummary
} from '../types/index.js';
import {
  MarketIntelligenceEngine,
  calculateFeeSkewBps
} from '../services/marketIntelligenceService.js';
import {
  SEED_MERCHANTS,
  SEED_PRODUCTS,
  SEED_HISTORICAL_PRICES
} from './marketplaceData.js';

export interface SimulatedTxRecord {
  id: string;
  mode: 'NORMAL' | 'PROTECTED';
  status: 'ALLOW' | 'ASK' | 'BLOCK' | 'UNAUTHORIZED_PURCHASE';
  userRequest: string;
  productId?: string;
  productTitle: string;
  merchantId?: string;
  merchantName: string;
  payeeAddress: string;
  quantity: number;
  itemPricePaise: number;
  deliveryFeePaise: number;
  handlingFeePaise: number;
  discountPaise: number;
  totalAmountPaise: number;
  contractId?: string;
  assessmentId?: string;
  marketDecision?: string;
  marketDecisionReason?: string;
  userAcknowledgedAdvisory?: boolean;
  verifierDecision?: string;
  verifierReasons?: string[];
  maliciousPrompt?: string;
  securityExplanation?: string;
  isDemoData: boolean;
  createdAt: string;
}

export interface SecurityScenarioRecord {
  id: string;
  scenarioId: string;
  scenarioName: string;
  attackCategory: string;
  originalIntent: string;
  maliciousPayload: string;
  normalModeResult: any;
  niyatModeResult: any;
  verifierDecision: 'ALLOW' | 'ASK' | 'BLOCK';
  blocked: boolean;
  reason: string;
  executedAt: string;
}

export interface RepositoryHealth {
  ok: boolean;
  mode: 'postgresql' | 'memory';
  error?: string;
}

export class MarketplaceRepository {
  private prisma: PrismaClient | null = null;
  private usePrisma = false;

  private products: Map<string, ProductItem> = new Map();
  private merchants: Map<string, typeof SEED_MERCHANTS[0]> = new Map();
  private contracts: Map<string, SignedIntentContract> = new Map();
  private assessments: Map<string, MarketAssessmentRecord> = new Map();
  private usedNonces: Set<string> = new Set();
  private transactions: SimulatedTxRecord[] = [];
  private securityRuns: SecurityScenarioRecord[] = [];
  private wallets: Map<string, WalletRecord> = new Map();
  private ledgers: WalletLedgerRecord[] = [];
  private marketEngine = new MarketIntelligenceEngine();

  constructor(options?: { forceMemoryOnly?: boolean; prismaClient?: PrismaClient | null }) {
    this.seedDefaults();
    if (options?.prismaClient !== undefined) {
      this.prisma = options.prismaClient;
      this.usePrisma = options.prismaClient !== null;
    } else if (!options?.forceMemoryOnly) {
      this.initPrisma();
    }
  }

  private initPrisma() {
    const isProd = process.env.NODE_ENV === 'production';
    const dbUrl = process.env.DATABASE_URL?.trim();

    if (isProd && (!dbUrl || dbUrl.length === 0)) {
      throw new Error('CRITICAL: DATABASE_URL is missing in production. PostgreSQL connection is mandatory.');
    }

    if (dbUrl && dbUrl.length > 0) {
      try {
        this.prisma = new PrismaClient();
        this.usePrisma = true;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`CRITICAL: Could not initialize PrismaClient in production: ${err.message}`);
        }
        console.warn('Could not initialize PrismaClient, using in-memory store:', err);
        this.usePrisma = false;
      }
    }
  }

  public isUsingPrisma(): boolean {
    return this.usePrisma && this.prisma !== null;
  }

  public setPrismaClient(client: PrismaClient | null): void {
    this.prisma = client;
    this.usePrisma = client !== null;
  }

  public async checkHealth(): Promise<RepositoryHealth> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        return { ok: true, mode: 'postgresql' };
      } catch (err: any) {
        return {
          ok: false,
          mode: 'postgresql',
          error: err.message || 'PostgreSQL connectivity check failed'
        };
      }
    }

    if (isProd) {
      return {
        ok: false,
        mode: 'memory',
        error: 'PostgreSQL client is not active in production. In-memory mode is forbidden in production.'
      };
    }

    return { ok: true, mode: 'memory' };
  }

  public async verifyConnection(): Promise<void> {
    const health = await this.checkHealth();
    if (!health.ok) {
      throw new Error(`PostgreSQL verification failed: ${health.error}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
      } catch {
        // Safe ignore during shutdown
      }
    }
  }

  private seedDefaults() {
    for (const m of SEED_MERCHANTS) {
      this.merchants.set(m.id, m);
    }

    for (const p of SEED_PRODUCTS) {
      const history = SEED_HISTORICAL_PRICES.filter(h => h.productId === p.id).map(h => ({
        id: `hp_${h.productId}_${h.observedDate}`,
        pricePaise: h.pricePaise,
        observedDate: h.observedDate,
        sourceMerchant: h.sourceMerchant,
        isDemoData: true
      }));

      this.products.set(p.id, {
        ...p,
        marketPrices: history
      });
    }

    // Seed default in-memory demo wallets
    this.wallets.set('user_default', {
      id: 'wallet_user_default',
      ownerId: 'user_default',
      ownerType: 'USER',
      ownerName: 'Primary User',
      upiId: 'user@niyat',
      balancePaise: 500000,
      currency: 'INR',
      isDemoWallet: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.wallets.set('rahul@niyat', {
      id: 'wallet_user_rahul',
      ownerId: 'user_rahul',
      ownerType: 'USER',
      ownerName: 'Rahul Sharma',
      upiId: 'rahul@niyat',
      balancePaise: 150000,
      currency: 'INR',
      isDemoWallet: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.wallets.set('priya@niyat', {
      id: 'wallet_user_priya',
      ownerId: 'user_priya',
      ownerType: 'USER',
      ownerName: 'Priya Patel',
      upiId: 'priya@niyat',
      balancePaise: 200000,
      currency: 'INR',
      isDemoWallet: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    for (const m of SEED_MERCHANTS) {
      this.wallets.set(m.payeeAddress, {
        id: `wallet_${m.id}`,
        ownerId: m.id,
        ownerType: 'MERCHANT',
        ownerName: m.name,
        upiId: m.payeeAddress,
        balancePaise: 2500000,
        currency: 'INR',
        isDemoWallet: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  public async getProducts(filter?: { category?: string; search?: string }): Promise<ProductItem[]> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const where: any = {};
        if (filter?.category && filter.category !== 'all') {
          where.category = { equals: filter.category, mode: 'insensitive' };
        }
        if (filter?.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { brand: { contains: filter.search, mode: 'insensitive' } },
            { variant: { contains: filter.search, mode: 'insensitive' } },
            { category: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        const dbProducts = await this.prisma.product.findMany({
          where,
          include: { merchant: true, marketPrices: true }
        });

        return dbProducts.map(p => ({
          id: p.id,
          title: p.title,
          category: p.category,
          brand: p.brand,
          variant: p.variant,
          unit: p.unit,
          packageSize: p.packageSize,
          basePricePaise: p.basePricePaise,
          discountPaise: p.discountPaise,
          inStock: p.inStock,
          description: p.description,
          maliciousInstruction: p.maliciousInstruction,
          merchantId: p.merchantId,
          merchant: {
            id: p.merchant.id,
            name: p.merchant.name,
            slug: p.merchant.slug,
            rating: p.merchant.rating,
            isVerified: p.merchant.isVerified,
            payeeAddress: p.merchant.payeeAddress,
            deliveryFeePaise: p.merchant.deliveryFeePaise,
            platformFeePaise: p.merchant.platformFeePaise
          },
          marketPrices: p.marketPrices.map(mp => ({
            id: mp.id,
            pricePaise: mp.pricePaise,
            observedDate: mp.observedDate.toISOString().split('T')[0],
            sourceMerchant: mp.sourceMerchant,
            isDemoData: mp.isDemoData
          }))
        }));
      } catch (err: any) {
        if (isProd) {
          throw new Error(`PostgreSQL getProducts query failed in production: ${err.message || 'Unknown error'}`);
        }
        console.warn('Prisma getProducts query failed, using in-memory store:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory store fallback is forbidden in production. Active PostgreSQL connection required.');
    }

    let list = Array.from(this.products.values());

    if (filter?.category && filter.category !== 'all') {
      const catLower = filter.category.toLowerCase();
      list = list.filter(p => p.category.toLowerCase() === catLower);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.variant.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public async getProductById(id: string): Promise<ProductItem | null> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const p = await this.prisma.product.findUnique({
          where: { id },
          include: { merchant: true, marketPrices: true }
        });

        if (!p) return null;

        return {
          id: p.id,
          title: p.title,
          category: p.category,
          brand: p.brand,
          variant: p.variant,
          unit: p.unit,
          packageSize: p.packageSize,
          basePricePaise: p.basePricePaise,
          discountPaise: p.discountPaise,
          inStock: p.inStock,
          description: p.description,
          maliciousInstruction: p.maliciousInstruction,
          merchantId: p.merchantId,
          merchant: {
            id: p.merchant.id,
            name: p.merchant.name,
            slug: p.merchant.slug,
            rating: p.merchant.rating,
            isVerified: p.merchant.isVerified,
            payeeAddress: p.merchant.payeeAddress,
            deliveryFeePaise: p.merchant.deliveryFeePaise,
            platformFeePaise: p.merchant.platformFeePaise
          },
          marketPrices: p.marketPrices.map(mp => ({
            id: mp.id,
            pricePaise: mp.pricePaise,
            observedDate: mp.observedDate.toISOString().split('T')[0],
            sourceMerchant: mp.sourceMerchant,
            isDemoData: mp.isDemoData
          }))
        };
      } catch (err: any) {
        if (isProd) {
          throw new Error(`PostgreSQL getProductById query failed in production: ${err.message || 'Unknown error'}`);
        }
        console.warn('Prisma getProductById failed, using in-memory store:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory store fallback is forbidden in production. Active PostgreSQL connection required.');
    }

    return this.products.get(id) || null;
  }

  public async getMarketIntelligence(productId: string): Promise<MarketIntelligenceReport | null> {
    const product = await this.getProductById(productId);
    if (!product) return null;

    // Retrieve all products in category
    const categoryProducts = (await this.getProducts({ category: product.category }));

    const offers: MarketIntelligenceReport['offers'] = categoryProducts.map(cp => {
      const merchant = cp.merchant;
      const basePrice = cp.basePricePaise;
      const deliveryFee = merchant.deliveryFeePaise;
      const handlingFee = merchant.platformFeePaise;
      const discount = cp.discountPaise;
      const landedPrice = basePrice + deliveryFee + handlingFee - discount;
      const pricePerUnit = Math.round(landedPrice / (cp.packageSize || 1.0));

      return {
        productId: cp.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        merchantRating: merchant.rating,
        payeeAddress: merchant.payeeAddress,
        basePricePaise: basePrice,
        deliveryFeePaise: deliveryFee,
        handlingFeePaise: handlingFee,
        discountPaise: discount,
        landedPricePaise: landedPrice,
        pricePerUnitPaise: pricePerUnit,
        inStock: cp.inStock,
        isRecommended: false
      };
    });

    offers.sort((a, b) => a.landedPricePaise - b.landedPricePaise);

    // Prioritize exact brand & variant matches for recommendation
    const exactMatches = offers.filter(o => {
      const p = categoryProducts.find(cp => cp.id === o.productId);
      return p && p.brand.toLowerCase() === product.brand.toLowerCase() &&
             p.variant.toLowerCase() === product.variant.toLowerCase();
    });

    const candidatePool = exactMatches.length > 0 ? exactMatches : offers;
    const bestOffer = candidatePool.find(o => o.inStock) || candidatePool[0] || offers[0];
    if (bestOffer) {
      bestOffer.isRecommended = true;
      bestOffer.recommendationReason = `Lowest final landed price (₹${(bestOffer.landedPricePaise / 100).toFixed(2)}) for ${product.brand} ${product.variant} including delivery and fees.`;
    }

    const history = product.marketPrices ? product.marketPrices.map(h => ({
      date: h.observedDate,
      pricePaise: h.pricePaise,
      merchantName: h.sourceMerchant,
      isDemoData: true as const
    })) : [];

    const deliveryFee = bestOffer ? bestOffer.deliveryFeePaise : product.merchant.deliveryFeePaise;
    const platformFee = bestOffer ? bestOffer.handlingFeePaise : product.merchant.platformFeePaise;
    const landedPrice = bestOffer ? bestOffer.landedPricePaise : (product.basePricePaise + deliveryFee + platformFee);
    const feeSkewBps = calculateFeeSkewBps(deliveryFee, platformFee, landedPrice);

    const evaluation = this.marketEngine.evaluateMarketWindows({
      currentLandedPricePaise: landedPrice,
      feeSkewBps,
      isSubstituteVariant: false,
      observations: history
    });

    return {
      productId: product.id,
      productTitle: product.title,
      category: product.category,
      brand: product.brand,
      variant: product.variant,
      decision: evaluation.decision,
      decisionReason: evaluation.decisionReason,
      requiresAcknowledgement: evaluation.requiresAcknowledgement,
      offers,
      historicalPriceObservations: history,
      historicalAveragePaise: evaluation.trends.window30Day.averagePaise,
      priceTrendAdvisory: evaluation.decisionReason,
      trends: evaluation.trends,
      provenance: evaluation.provenance,
      isDemoData: true
    };
  }

  // --- Nonce Store Methods (with Neon PostgreSQL atomic constraint) ---
  public async isNonceUsed(nonce: string): Promise<boolean> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const record = await this.prisma.usedNonce.findUnique({
          where: { nonce }
        });
        return record !== null;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`PostgreSQL isNonceUsed query failed in production: ${err.message || 'Unknown error'}`);
        }
        console.warn('Prisma isNonceUsed failed, checking memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory nonce store is forbidden in production. PostgreSQL connection required.');
    }

    return this.usedNonces.has(nonce);
  }

  public async markNonceUsed(nonce: string, contractId: string): Promise<void> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        await this.prisma.usedNonce.upsert({
          where: { nonce },
          update: {},
          create: { nonce, contractId }
        });
        this.usedNonces.add(nonce);
        return;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`PostgreSQL markNonceUsed failed in production: ${err.message || 'Unknown error'}`);
        }
        console.warn('Prisma markNonceUsed failed:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory nonce store is forbidden in production. PostgreSQL connection required.');
    }

    this.usedNonces.add(nonce);
  }

  public async claimNonceAtomic(nonce: string, contractId: string): Promise<boolean> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        await this.prisma.usedNonce.create({
          data: { nonce, contractId }
        });
        this.usedNonces.add(nonce);
        return true;
      } catch (err: any) {
        if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
          this.usedNonces.add(nonce);
          return false; // already claimed in database!
        }
        if (isProd) {
          console.error('CRITICAL: PostgreSQL claimNonceAtomic failed in production:', err);
          throw new Error(`PostgreSQL atomic nonce claim failed in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma claimNonceAtomic unexpected error, using memory fallback:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory nonce store is forbidden in production. PostgreSQL connection required.');
    }

    // In-memory atomic check (development and test only)
    if (this.usedNonces.has(nonce)) {
      return false; // already claimed
    }
    this.usedNonces.add(nonce);
    return true; // successfully claimed
  }

  // --- Market Assessment Methods ---
  public async saveAssessment(assessment: MarketAssessmentRecord): Promise<void> {
    const isProd = process.env.NODE_ENV === 'production';
    this.assessments.set(assessment.assessmentId, assessment);

    if (this.usePrisma && this.prisma) {
      try {
        await this.prisma.marketAssessment.upsert({
          where: { assessmentId: assessment.assessmentId },
          update: {
            isConsumed: assessment.isConsumed,
            consumedAt: assessment.consumedAt ? new Date(assessment.consumedAt) : null
          },
          create: {
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
            feeSkewBps: assessment.feeSkewBps,
            decision: assessment.decision,
            decisionReason: assessment.decisionReason,
            requiresAcknowledgement: assessment.requiresAcknowledgement,
            bindingSignature: assessment.bindingSignature,
            isConsumed: assessment.isConsumed,
            consumedAt: assessment.consumedAt ? new Date(assessment.consumedAt) : null,
            expiresAt: new Date(assessment.expiresAt),
            createdAt: new Date(assessment.createdAt)
          }
        });
        return;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to persist market assessment in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma saveAssessment failed, stored in memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory assessment store is forbidden in production. PostgreSQL connection required.');
    }
  }

  public async getAssessmentById(assessmentId: string): Promise<MarketAssessmentRecord | null> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const a = await this.prisma.marketAssessment.findUnique({
          where: { assessmentId }
        });
        if (a) {
          return {
            id: a.id,
            assessmentId: a.assessmentId,
            contractId: a.contractId,
            productId: a.productId,
            productTitle: a.productTitle,
            brand: a.brand,
            variant: a.variant,
            packageSizeBaseUnits: a.packageSizeBaseUnits,
            baseUnit: a.baseUnit,
            merchantId: a.merchantId,
            merchantName: a.merchantName,
            payeeAddress: a.payeeAddress,
            quantity: a.quantity,
            basePricePaise: a.basePricePaise,
            deliveryFeePaise: a.deliveryFeePaise,
            platformFeePaise: a.platformFeePaise,
            discountPaise: a.discountPaise,
            landedPricePaise: a.landedPricePaise,
            pricePerStandardUnitPaise: a.pricePerStandardUnitPaise,
            feeSkewBps: a.feeSkewBps,
            decision: a.decision as any,
            decisionReason: a.decisionReason,
            requiresAcknowledgement: a.requiresAcknowledgement,
            bindingSignature: a.bindingSignature,
            isConsumed: a.isConsumed,
            consumedAt: a.consumedAt ? a.consumedAt.toISOString() : null,
            expiresAt: a.expiresAt.toISOString(),
            createdAt: a.createdAt.toISOString()
          };
        }
        return null;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to query market assessment in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma getAssessmentById failed, checking memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory assessment store is forbidden in production. PostgreSQL connection required.');
    }

    return this.assessments.get(assessmentId) || null;
  }

  public async settleProtectedPurchaseAtomic(params: {
    assessmentId: string;
    nonce: string;
    contractId: string;
    tx: Omit<SimulatedTxRecord, 'id' | 'createdAt'>;
  }): Promise<{ success: boolean; error?: string; txRecord?: SimulatedTxRecord }> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          // 1. Conditionally consume assessment in PostgreSQL
          const updateCount = await tx.marketAssessment.updateMany({
            where: {
              assessmentId: params.assessmentId,
              isConsumed: false
            },
            data: {
              isConsumed: true,
              consumedAt: new Date()
            }
          });

          if (updateCount.count === 0) {
            throw new Error('ASSESSMENT_ALREADY_CONSUMED');
          }

          // 2. Claim nonce with unique constraint
          await tx.usedNonce.create({
            data: {
              nonce: params.nonce,
              contractId: params.contractId
            }
          });

          // 3. Resolve contract internal ID if applicable
          let dbContractId: string | undefined;
          if (params.tx.contractId) {
            const dbContract = await tx.intentContract.findUnique({
              where: { contractId: params.tx.contractId }
            });
            if (dbContract) dbContractId = dbContract.id;
          }

          // 4. Create SimulatedTransaction record
          const dbTx = await tx.simulatedTransaction.create({
            data: {
              mode: params.tx.mode,
              status: params.tx.status,
              userRequest: params.tx.userRequest,
              productId: params.tx.productId || null,
              productTitle: params.tx.productTitle,
              merchantId: params.tx.merchantId || null,
              merchantName: params.tx.merchantName,
              payeeAddress: params.tx.payeeAddress,
              quantity: params.tx.quantity,
              itemPricePaise: params.tx.itemPricePaise,
              deliveryFeePaise: params.tx.deliveryFeePaise,
              handlingFeePaise: params.tx.handlingFeePaise,
              discountPaise: params.tx.discountPaise,
              totalAmountPaise: params.tx.totalAmountPaise,
              contractId: dbContractId || null,
              assessmentId: params.assessmentId,
              marketDecision: params.tx.marketDecision || null,
              marketDecisionReason: params.tx.marketDecisionReason || null,
              userAcknowledgedAdvisory: params.tx.userAcknowledgedAdvisory ?? null,
              verifierDecision: params.tx.verifierDecision || null,
              verifierReasons: params.tx.verifierReasons ? JSON.stringify(params.tx.verifierReasons) : null,
              maliciousPrompt: params.tx.maliciousPrompt || null,
              securityExplanation: params.tx.securityExplanation || null,
              isDemoData: params.tx.isDemoData
            }
          });

          // 5. Debit user wallet atomically & credit merchant wallet
          const userWallet = await tx.wallet.findUnique({
            where: { ownerId: 'user_default' }
          });
          if (userWallet) {
            if (userWallet.balancePaise < params.tx.totalAmountPaise) {
              throw new Error('INSUFFICIENT_WALLET_BALANCE');
            }
            await tx.wallet.update({
              where: { id: userWallet.id },
              data: { balancePaise: { decrement: params.tx.totalAmountPaise } }
            });

            // Credit merchant wallet if found
            const merchantWallet = await tx.wallet.findFirst({
              where: { upiId: params.tx.payeeAddress }
            });
            if (merchantWallet) {
              await tx.wallet.update({
                where: { id: merchantWallet.id },
                data: { balancePaise: { increment: params.tx.totalAmountPaise } }
              });
            }

            // Record wallet ledger entry
            await tx.walletLedgerEntry.create({
              data: {
                transactionRef: `ref_shop_${dbTx.id}`,
                type: 'PROTECTED_PURCHASE',
                status: 'SUCCESS',
                amountPaise: params.tx.totalAmountPaise,
                feePaise: params.tx.deliveryFeePaise + params.tx.handlingFeePaise,
                note: `NIYAT Verified: ${params.tx.productTitle} (${params.tx.quantity}x)`,
                sourceWalletId: userWallet.id,
                targetWalletId: merchantWallet?.id || null,
                sourceUpiId: userWallet.upiId,
                targetUpiId: params.tx.payeeAddress,
                contractId: params.contractId,
                assessmentId: params.assessmentId,
                verifierDecision: 'ALLOW',
                isDemoData: true
              }
            });
          }

          const txRecord: SimulatedTxRecord = {
            ...params.tx,
            id: dbTx.id,
            createdAt: dbTx.createdAt.toISOString()
          };

          return txRecord;
        });

        // Mirror in memory collections
        this.usedNonces.add(params.nonce);
        const memAss = this.assessments.get(params.assessmentId);
        if (memAss) {
          memAss.isConsumed = true;
          memAss.consumedAt = new Date().toISOString();
        }
        this.transactions.unshift(result);

        return { success: true, txRecord: result };
      } catch (err: any) {
        if (err.message === 'ASSESSMENT_ALREADY_CONSUMED') {
          return { success: false, error: 'ASSESSMENT_ALREADY_CONSUMED' };
        }
        if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
          return { success: false, error: 'NONCE_ALREADY_USED' };
        }
        if (isProd) {
          console.error('CRITICAL: PostgreSQL settleProtectedPurchaseAtomic failed in production:', err);
          throw new Error(`PostgreSQL atomic settlement failed in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma settleProtectedPurchaseAtomic error, falling back to memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory settlement is forbidden in production. Active PostgreSQL connection required.');
    }

    // In-memory atomic check
    if (this.usedNonces.has(params.nonce)) {
      return { success: false, error: 'NONCE_ALREADY_USED' };
    }
    const memAssessment = this.assessments.get(params.assessmentId);
    if (!memAssessment || memAssessment.isConsumed) {
      return { success: false, error: 'ASSESSMENT_ALREADY_CONSUMED' };
    }

    const memUserWallet = this.wallets.get('user_default');
    if (memUserWallet) {
      if (memUserWallet.balancePaise < params.tx.totalAmountPaise) {
        return { success: false, error: 'INSUFFICIENT_WALLET_BALANCE' };
      }
      memUserWallet.balancePaise -= params.tx.totalAmountPaise;

      const memMerchantWallet = this.wallets.get(params.tx.payeeAddress);
      if (memMerchantWallet) {
        memMerchantWallet.balancePaise += params.tx.totalAmountPaise;
      }

      this.ledgers.unshift({
        id: `ledger_${Date.now()}`,
        transactionRef: `ref_shop_mem_${Date.now()}`,
        type: 'PROTECTED_PURCHASE',
        status: 'SUCCESS',
        amountPaise: params.tx.totalAmountPaise,
        feePaise: params.tx.deliveryFeePaise + params.tx.handlingFeePaise,
        note: `NIYAT Verified: ${params.tx.productTitle}`,
        sourceWalletId: memUserWallet.id,
        targetWalletId: memMerchantWallet?.id || null,
        sourceUpiId: memUserWallet.upiId,
        targetUpiId: params.tx.payeeAddress,
        contractId: params.contractId,
        assessmentId: params.assessmentId,
        verifierDecision: 'ALLOW',
        isDemoData: true,
        createdAt: new Date().toISOString()
      });
    }

    memAssessment.isConsumed = true;
    memAssessment.consumedAt = new Date().toISOString();
    this.usedNonces.add(params.nonce);

    const txRecord: SimulatedTxRecord = {
      ...params.tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString()
    };
    this.transactions.unshift(txRecord);

    return { success: true, txRecord };
  }

  // --- Contract Methods ---
  public async saveContract(contract: SignedIntentContract): Promise<void> {
    const isProd = process.env.NODE_ENV === 'production';
    this.contracts.set(contract.contractId, contract);

    if (this.usePrisma && this.prisma) {
      try {
        await this.prisma.intentContract.upsert({
          where: { contractId: contract.contractId },
          update: {},
          create: {
            contractId: contract.contractId,
            userRequest: contract.userRequest,
            category: contract.category,
            productTitle: contract.productName,
            brand: contract.preferredBrand,
            variant: contract.variantOrModel,
            quantity: contract.quantity,
            unit: contract.unit,
            maxBudgetPaise: contract.maxBudgetPaise,
            mandatoryRequirements: JSON.stringify(contract.mandatoryRequirements),
            permittedSubstitutions: JSON.stringify(contract.permittedSubstitutions),
            nonce: contract.nonce,
            signature: contract.signature,
            expiresAt: new Date(contract.expiresAt)
          }
        });
        return;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to persist intent contract in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma saveContract failed, stored in memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory contract storage is forbidden in production.');
    }
  }

  public async getContract(contractId: string): Promise<SignedIntentContract | null> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const c = await this.prisma.intentContract.findUnique({
          where: { contractId }
        });
        if (c) {
          return {
            contractId: c.contractId,
            userRequest: c.userRequest,
            category: c.category,
            productName: c.productTitle,
            preferredBrand: c.brand,
            variantOrModel: c.variant,
            quantity: c.quantity,
            unit: c.unit,
            maxBudgetPaise: c.maxBudgetPaise,
            mandatoryRequirements: JSON.parse(c.mandatoryRequirements),
            permittedSubstitutions: JSON.parse(c.permittedSubstitutions),
            nonce: c.nonce,
            createdAt: c.createdAt.toISOString(),
            expiresAt: c.expiresAt.toISOString(),
            signature: c.signature
          };
        }
        return null;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to query intent contract in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma getContract failed, checking memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory contract store is forbidden in production.');
    }

    return this.contracts.get(contractId) || null;
  }

  // --- Transaction Methods (Persistent in Neon DB) ---
  public async recordTransaction(tx: Omit<SimulatedTxRecord, 'id' | 'createdAt'>): Promise<SimulatedTxRecord> {
    const isProd = process.env.NODE_ENV === 'production';
    let record: SimulatedTxRecord = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString()
    };

    if (this.usePrisma && this.prisma) {
      try {
        // Resolve internal contract UUID if contractId was provided
        let dbContractId: string | undefined;
        if (tx.contractId) {
          const dbContract = await this.prisma.intentContract.findUnique({
            where: { contractId: tx.contractId }
          });
          if (dbContract) dbContractId = dbContract.id;
        }

        const dbTx = await this.prisma.simulatedTransaction.create({
          data: {
            mode: tx.mode,
            status: tx.status,
            userRequest: tx.userRequest,
            productId: tx.productId || null,
            productTitle: tx.productTitle,
            merchantId: tx.merchantId || null,
            merchantName: tx.merchantName,
            payeeAddress: tx.payeeAddress,
            quantity: tx.quantity,
            itemPricePaise: tx.itemPricePaise,
            deliveryFeePaise: tx.deliveryFeePaise,
            handlingFeePaise: tx.handlingFeePaise,
            discountPaise: tx.discountPaise,
            totalAmountPaise: tx.totalAmountPaise,
            contractId: dbContractId || null,
            assessmentId: tx.assessmentId || null,
            marketDecision: tx.marketDecision || null,
            marketDecisionReason: tx.marketDecisionReason || null,
            userAcknowledgedAdvisory: tx.userAcknowledgedAdvisory ?? null,
            verifierDecision: tx.verifierDecision || null,
            verifierReasons: tx.verifierReasons ? JSON.stringify(tx.verifierReasons) : null,
            maliciousPrompt: tx.maliciousPrompt || null,
            securityExplanation: tx.securityExplanation || null,
            isDemoData: tx.isDemoData
          }
        });

        record = {
          ...tx,
          id: dbTx.id,
          createdAt: dbTx.createdAt.toISOString()
        };
        this.transactions.unshift(record);
        return record;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to record transaction in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma recordTransaction failed, stored in memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory transaction storage is forbidden in production.');
    }

    this.transactions.unshift(record);
    return record;
  }

  public async getTransactions(limit = 50): Promise<SimulatedTxRecord[]> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const list = await this.prisma.simulatedTransaction.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit
        });

        return list.map(t => ({
          id: t.id,
          mode: t.mode as any,
          status: t.status as any,
          userRequest: t.userRequest,
          productId: t.productId || undefined,
          productTitle: t.productTitle,
          merchantId: t.merchantId || undefined,
          merchantName: t.merchantName,
          payeeAddress: t.payeeAddress,
          quantity: t.quantity,
          itemPricePaise: t.itemPricePaise,
          deliveryFeePaise: t.deliveryFeePaise,
          handlingFeePaise: t.handlingFeePaise,
          discountPaise: t.discountPaise,
          totalAmountPaise: t.totalAmountPaise,
          contractId: t.contractId || undefined,
          verifierDecision: t.verifierDecision || undefined,
          verifierReasons: t.verifierReasons ? JSON.parse(t.verifierReasons) : undefined,
          maliciousPrompt: t.maliciousPrompt || undefined,
          securityExplanation: t.securityExplanation || undefined,
          isDemoData: t.isDemoData,
          createdAt: t.createdAt.toISOString()
        }));
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to fetch transactions in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma getTransactions failed, using memory store:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory transaction store is forbidden in production.');
    }

    return this.transactions.slice(0, limit);
  }

  // --- Security Scenario Methods ---
  public async recordSecurityRun(run: Omit<SecurityScenarioRecord, 'id' | 'executedAt'>): Promise<SecurityScenarioRecord> {
    const isProd = process.env.NODE_ENV === 'production';
    let record: SecurityScenarioRecord = {
      ...run,
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      executedAt: new Date().toISOString()
    };

    if (this.usePrisma && this.prisma) {
      try {
        const dbRun = await this.prisma.securityTestRun.create({
          data: {
            scenarioId: run.scenarioId,
            scenarioName: run.scenarioName,
            attackCategory: run.attackCategory,
            originalIntent: run.originalIntent,
            maliciousPayload: run.maliciousPayload,
            normalModeResult: JSON.stringify(run.normalModeResult),
            niyatModeResult: JSON.stringify(run.niyatModeResult),
            verifierDecision: run.verifierDecision,
            blocked: run.blocked,
            reason: run.reason
          }
        });
        record = {
          ...run,
          id: dbRun.id,
          executedAt: dbRun.executedAt.toISOString()
        };
        this.securityRuns.unshift(record);
        return record;
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to record security run in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma recordSecurityRun failed, stored in memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory security run store is forbidden in production.');
    }

    this.securityRuns.unshift(record);
    return record;
  }

  public async getSecurityRuns(limit = 20): Promise<SecurityScenarioRecord[]> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const list = await this.prisma.securityTestRun.findMany({
          orderBy: { executedAt: 'desc' },
          take: limit
        });

        return list.map(r => ({
          id: r.id,
          scenarioId: r.scenarioId,
          scenarioName: r.scenarioName,
          attackCategory: r.attackCategory,
          originalIntent: r.originalIntent,
          maliciousPayload: r.maliciousPayload,
          normalModeResult: JSON.parse(r.normalModeResult),
          niyatModeResult: JSON.parse(r.niyatModeResult),
          verifierDecision: r.verifierDecision as any,
          blocked: r.blocked,
          reason: r.reason,
          executedAt: r.executedAt.toISOString()
        }));
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to fetch security runs in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma getSecurityRuns failed, using memory store:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory security run store is forbidden in production.');
    }

    return this.securityRuns.slice(0, limit);
  }

  // --- Pocket UPI Wallet Operations ---
  public async getWallet(ownerId = 'user_default'): Promise<WalletSummary> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        let wallet = await this.prisma.wallet.findUnique({
          where: { ownerId }
        });

        if (!wallet && ownerId === 'user_default') {
          wallet = await this.prisma.wallet.create({
            data: {
              ownerId: 'user_default',
              ownerType: 'USER',
              ownerName: 'Primary User',
              upiId: 'user@niyat',
              balancePaise: 500000,
              currency: 'INR',
              isDemoWallet: true
            }
          });
        }

        if (wallet) {
          const ledgers = await this.prisma.walletLedgerEntry.findMany({
            where: {
              OR: [
                { sourceWalletId: wallet.id },
                { targetWalletId: wallet.id },
                { sourceUpiId: wallet.upiId },
                { targetUpiId: wallet.upiId }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: 25
          });

          return {
            wallet: {
              id: wallet.id,
              ownerId: wallet.ownerId,
              ownerType: wallet.ownerType as any,
              ownerName: wallet.ownerName,
              upiId: wallet.upiId,
              balancePaise: wallet.balancePaise,
              currency: wallet.currency,
              isDemoWallet: wallet.isDemoWallet,
              createdAt: wallet.createdAt.toISOString(),
              updatedAt: wallet.updatedAt.toISOString()
            },
            balanceRupees: wallet.balancePaise / 100,
            recentLedgers: ledgers.map(l => ({
              id: l.id,
              transactionRef: l.transactionRef,
              type: l.type as any,
              status: l.status as any,
              amountPaise: l.amountPaise,
              feePaise: l.feePaise,
              note: l.note,
              sourceWalletId: l.sourceWalletId,
              targetWalletId: l.targetWalletId,
              sourceUpiId: l.sourceUpiId,
              targetUpiId: l.targetUpiId,
              contractId: l.contractId,
              assessmentId: l.assessmentId,
              verifierDecision: l.verifierDecision,
              isDemoData: l.isDemoData,
              createdAt: l.createdAt.toISOString()
            }))
          };
        }
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to query wallet in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma getWallet failed, falling back to memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory wallet store is forbidden in production.');
    }

    const memWallet = this.wallets.get(ownerId) || this.wallets.get('user_default')!;
    const memLedgers = this.ledgers.filter(
      l => l.sourceUpiId === memWallet.upiId || l.targetUpiId === memWallet.upiId
    );

    return {
      wallet: memWallet,
      balanceRupees: memWallet.balancePaise / 100,
      recentLedgers: memLedgers.slice(0, 25)
    };
  }

  public async topUpWallet(amountPaise: number, ownerId = 'user_default'): Promise<WalletSummary> {
    if (amountPaise <= 0 || !Number.isInteger(amountPaise)) {
      throw new Error('Top-up amount must be a positive integer in paise');
    }

    const isProd = process.env.NODE_ENV === 'production';

    if (this.usePrisma && this.prisma) {
      try {
        const txRef = `topup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await this.prisma.$transaction(async (tx) => {
          let wallet = await tx.wallet.findUnique({ where: { ownerId } });
          if (!wallet && ownerId === 'user_default') {
            wallet = await tx.wallet.create({
              data: {
                ownerId: 'user_default',
                ownerType: 'USER',
                ownerName: 'Primary User',
                upiId: 'user@niyat',
                balancePaise: 500000,
                currency: 'INR',
                isDemoWallet: true
              }
            });
          }

          if (!wallet) throw new Error('Wallet not found');

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balancePaise: { increment: amountPaise } }
          });

          await tx.walletLedgerEntry.create({
            data: {
              transactionRef: txRef,
              type: 'TOPUP',
              status: 'SUCCESS',
              amountPaise,
              feePaise: 0,
              note: `Demo Money Added: ₹${(amountPaise / 100).toFixed(2)}`,
              sourceWalletId: null,
              targetWalletId: wallet.id,
              sourceUpiId: 'bank_simulator@rbi',
              targetUpiId: wallet.upiId,
              isDemoData: true
            }
          });
        });

        return this.getWallet(ownerId);
      } catch (err: any) {
        if (isProd) {
          throw new Error(`Failed to top up wallet in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma topUpWallet failed, falling back to memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory top-up is forbidden in production.');
    }

    const memWallet = this.wallets.get(ownerId) || this.wallets.get('user_default')!;
    memWallet.balancePaise += amountPaise;
    memWallet.updatedAt = new Date().toISOString();

    this.ledgers.unshift({
      id: `topup_${Date.now()}`,
      transactionRef: `topup_ref_${Date.now()}`,
      type: 'TOPUP',
      status: 'SUCCESS',
      amountPaise,
      feePaise: 0,
      note: `Demo Money Added: ₹${(amountPaise / 100).toFixed(2)}`,
      sourceWalletId: null,
      targetWalletId: memWallet.id,
      sourceUpiId: 'bank_simulator@rbi',
      targetUpiId: memWallet.upiId,
      isDemoData: true,
      createdAt: new Date().toISOString()
    });

    return this.getWallet(ownerId);
  }

  public async transferP2P(params: {
    senderOwnerId?: string;
    recipientUpiId: string;
    amountPaise: number;
    note?: string;
  }): Promise<{ success: boolean; transactionRef: string; message: string; balanceRupees: number }> {
    const { senderOwnerId = 'user_default', recipientUpiId, amountPaise, note } = params;

    if (amountPaise <= 0 || !Number.isInteger(amountPaise)) {
      throw new Error('Transfer amount must be a positive integer in paise');
    }

    const cleanRecipientUpi = recipientUpiId.trim().toLowerCase();
    const isProd = process.env.NODE_ENV === 'production';
    const txRef = `p2p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (this.usePrisma && this.prisma) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const senderWallet = await tx.wallet.findUnique({
            where: { ownerId: senderOwnerId }
          });

          if (!senderWallet) {
            throw new Error('Sender wallet not found');
          }

          if (senderWallet.balancePaise < amountPaise) {
            throw new Error(`Insufficient wallet balance. Available: ₹${(senderWallet.balancePaise / 100).toFixed(2)}, required: ₹${(amountPaise / 100).toFixed(2)}`);
          }

          if (senderWallet.upiId.toLowerCase() === cleanRecipientUpi) {
            throw new Error('Cannot transfer money to yourself');
          }

          // Check if recipient wallet exists in system, or auto-create demo peer wallet
          let recipientWallet = await tx.wallet.findFirst({
            where: { upiId: cleanRecipientUpi }
          });

          if (!recipientWallet) {
            const peerName = cleanRecipientUpi.split('@')[0] || 'Peer';
            recipientWallet = await tx.wallet.create({
              data: {
                ownerId: `peer_${cleanRecipientUpi.replace(/[^a-zA-Z0-9]/g, '_')}`,
                ownerType: cleanRecipientUpi.includes('upi') || cleanRecipientUpi.includes('bank') ? 'MERCHANT' : 'USER',
                ownerName: peerName.charAt(0).toUpperCase() + peerName.slice(1),
                upiId: cleanRecipientUpi,
                balancePaise: 0,
                currency: 'INR',
                isDemoWallet: true
              }
            });
          }

          // Debit sender
          const updatedSender = await tx.wallet.update({
            where: { id: senderWallet.id },
            data: { balancePaise: { decrement: amountPaise } }
          });

          // Credit recipient
          await tx.wallet.update({
            where: { id: recipientWallet.id },
            data: { balancePaise: { increment: amountPaise } }
          });

          // Create ledger entry
          await tx.walletLedgerEntry.create({
            data: {
              transactionRef: txRef,
              type: 'P2P_TRANSFER',
              status: 'SUCCESS',
              amountPaise,
              feePaise: 0,
              note: note || `P2P Transfer to ${cleanRecipientUpi}`,
              sourceWalletId: senderWallet.id,
              targetWalletId: recipientWallet.id,
              sourceUpiId: senderWallet.upiId,
              targetUpiId: cleanRecipientUpi,
              isDemoData: true
            }
          });

          return {
            balanceRupees: updatedSender.balancePaise / 100
          };
        });

        return {
          success: true,
          transactionRef: txRef,
          message: `Successfully sent ₹${(amountPaise / 100).toFixed(2)} to ${cleanRecipientUpi}`,
          balanceRupees: result.balanceRupees
        };
      } catch (err: any) {
        if (isProd) {
          throw new Error(`P2P transfer failed in production: ${err.message || 'Database error'}`);
        }
        console.warn('Prisma transferP2P failed, falling back to memory:', err);
      }
    }

    if (isProd) {
      throw new Error('CRITICAL: In-memory P2P transfer is forbidden in production.');
    }

    const memSender = this.wallets.get(senderOwnerId) || this.wallets.get('user_default')!;
    if (memSender.balancePaise < amountPaise) {
      throw new Error(`Insufficient wallet balance. Available: ₹${(memSender.balancePaise / 100).toFixed(2)}`);
    }

    if (memSender.upiId.toLowerCase() === cleanRecipientUpi) {
      throw new Error('Cannot transfer money to yourself');
    }

    let memRecipient = this.wallets.get(cleanRecipientUpi);
    if (!memRecipient) {
      memRecipient = {
        id: `wallet_${Date.now()}`,
        ownerId: `peer_${Date.now()}`,
        ownerType: 'USER',
        ownerName: cleanRecipientUpi.split('@')[0],
        upiId: cleanRecipientUpi,
        balancePaise: 0,
        currency: 'INR',
        isDemoWallet: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.wallets.set(cleanRecipientUpi, memRecipient);
    }

    memSender.balancePaise -= amountPaise;
    memRecipient.balancePaise += amountPaise;

    this.ledgers.unshift({
      id: `p2p_${Date.now()}`,
      transactionRef: txRef,
      type: 'P2P_TRANSFER',
      status: 'SUCCESS',
      amountPaise,
      feePaise: 0,
      note: note || `P2P Transfer to ${cleanRecipientUpi}`,
      sourceWalletId: memSender.id,
      targetWalletId: memRecipient.id,
      sourceUpiId: memSender.upiId,
      targetUpiId: cleanRecipientUpi,
      isDemoData: true,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      transactionRef: txRef,
      message: `Successfully sent ₹${(amountPaise / 100).toFixed(2)} to ${cleanRecipientUpi}`,
      balanceRupees: memSender.balancePaise / 100
    };
  }
}

export const repository = new MarketplaceRepository();
