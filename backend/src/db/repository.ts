import { PrismaClient } from '@prisma/client';
import {
  ProductItem,
  MarketIntelligenceReport,
  SignedIntentContract
} from '../types/index.js';
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
  private usedNonces: Set<string> = new Set();
  private transactions: SimulatedTxRecord[] = [];
  private securityRuns: SecurityScenarioRecord[] = [];

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

    const bestOffer = offers.find(o => o.inStock) || offers[0];
    if (bestOffer) {
      bestOffer.isRecommended = true;
      bestOffer.recommendationReason = `Lowest final landed price (₹${(bestOffer.landedPricePaise / 100).toFixed(2)}) including delivery and fees.`;
    }

    const history = product.marketPrices ? product.marketPrices.map(h => ({
      date: h.observedDate,
      pricePaise: h.pricePaise,
      merchantName: h.sourceMerchant,
      isDemoData: true as const
    })) : [];

    let historicalAveragePaise: number | undefined;
    let priceTrendAdvisory: string | undefined;

    if (history.length >= 3) {
      const sum = history.reduce((acc, h) => acc + h.pricePaise, 0);
      historicalAveragePaise = Math.round(sum / history.length);
      const currentPrice = product.basePricePaise;
      if (currentPrice <= historicalAveragePaise) {
        priceTrendAdvisory = `Current price is at or below the 30-day historical average of ₹${(historicalAveragePaise / 100).toFixed(2)}. DEMO DATA.`;
      } else {
        priceTrendAdvisory = `Advisory signal: Current price (₹${(currentPrice / 100).toFixed(2)}) is slightly above the 30-day synthetic average (₹${(historicalAveragePaise / 100).toFixed(2)}). DEMO DATA.`;
      }
    }

    return {
      productId: product.id,
      productTitle: product.title,
      category: product.category,
      brand: product.brand,
      variant: product.variant,
      offers,
      historicalPriceObservations: history,
      historicalAveragePaise,
      priceTrendAdvisory,
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
}

export const repository = new MarketplaceRepository();
