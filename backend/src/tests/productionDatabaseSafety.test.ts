import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { validateEnv } from '../config/env.js';
import { MarketplaceRepository, repository } from '../db/repository.js';
import { app } from '../app.js';

describe('Production Database Safety & Replay Protection Audit', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Production Environment Configuration Validation', () => {
    it('rejects production startup if DATABASE_URL is missing', () => {
      expect(() => {
        validateEnv({
          NODE_ENV: 'production',
          CONTRACT_SIGNING_SECRET: 'a'.repeat(32),
          DATABASE_URL: '',
          DIRECT_URL: 'postgresql://user:pass@ep-sun.neon.tech/neondb?sslmode=require'
        });
      }).toThrow(/DATABASE_URL is required in production mode/);
    });

    it('rejects production startup if DIRECT_URL is missing', () => {
      expect(() => {
        validateEnv({
          NODE_ENV: 'production',
          CONTRACT_SIGNING_SECRET: 'a'.repeat(32),
          DATABASE_URL: 'postgresql://user:pass@ep-sun-pooler.neon.tech/neondb?sslmode=require',
          DIRECT_URL: ''
        });
      }).toThrow(/DIRECT_URL is required in production mode/);
    });

    it('rejects production startup if CONTRACT_SIGNING_SECRET is less than 32 characters', () => {
      expect(() => {
        validateEnv({
          NODE_ENV: 'production',
          CONTRACT_SIGNING_SECRET: 'short_secret',
          DATABASE_URL: 'postgresql://user:pass@ep-sun-pooler.neon.tech/neondb?sslmode=require',
          DIRECT_URL: 'postgresql://user:pass@ep-sun.neon.tech/neondb?sslmode=require'
        });
      }).toThrow(/CONTRACT_SIGNING_SECRET must be explicitly set and at least 32 characters/);
    });

    it('accepts production configuration when all required secrets and URLs are present', () => {
      const valid = validateEnv({
        NODE_ENV: 'production',
        CONTRACT_SIGNING_SECRET: 'secure_production_secret_at_least_32_chars_long',
        DATABASE_URL: 'postgresql://user:pass@ep-sun-pooler.neon.tech/neondb?sslmode=require',
        DIRECT_URL: 'postgresql://user:pass@ep-sun.neon.tech/neondb?sslmode=require'
      });

      expect(valid.NODE_ENV).toBe('production');
      expect(valid.DATABASE_URL).toBe('postgresql://user:pass@ep-sun-pooler.neon.tech/neondb?sslmode=require');
      expect(valid.DIRECT_URL).toBe('postgresql://user:pass@ep-sun.neon.tech/neondb?sslmode=require');
    });

    it('preserves optional database URLs in test and development modes', () => {
      const devEnv = validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL: '',
        DIRECT_URL: ''
      });
      expect(devEnv.NODE_ENV).toBe('development');
      expect(devEnv.DATABASE_URL).toBe('');

      const testEnv = validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: '',
        DIRECT_URL: ''
      });
      expect(testEnv.NODE_ENV).toBe('test');
      expect(testEnv.DATABASE_URL).toBe('');
    });
  });

  describe('2. Safe Startup & Health Check Enforcement', () => {
    it('fails startup safely if DATABASE_URL is missing in production repository', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      expect(() => {
        new MarketplaceRepository();
      }).toThrow(/DATABASE_URL is missing in production/);
    });

    it('reports unhealthy status when PostgreSQL ping fails in production', async () => {
      process.env.NODE_ENV = 'production';

      const mockFailingPrisma: any = {
        $queryRaw: vi.fn().mockRejectedValue(new Error('Connection to Neon PgBouncer failed: ETIMEDOUT'))
      };

      const prodRepo = new MarketplaceRepository({ prismaClient: mockFailingPrisma });
      const health = await prodRepo.checkHealth();

      expect(health.ok).toBe(false);
      expect(health.mode).toBe('postgresql');
      expect(health.error).toContain('Connection to Neon PgBouncer failed');

      await expect(prodRepo.verifyConnection()).rejects.toThrow(/PostgreSQL verification failed/);
    });

    it('reports healthy status when PostgreSQL ping succeeds', async () => {
      const mockHealthyPrisma: any = {
        $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }])
      };

      const repo = new MarketplaceRepository({ prismaClient: mockHealthyPrisma });
      const health = await repo.checkHealth();

      expect(health.ok).toBe(true);
      expect(health.mode).toBe('postgresql');
      expect(health.error).toBeUndefined();
    });

    it('returns HTTP 503 on /api/health when database is unhealthy in production', async () => {
      process.env.NODE_ENV = 'production';

      vi.spyOn(repository, 'checkHealth').mockResolvedValue({
        ok: false,
        mode: 'postgresql',
        error: 'Database connection dropped'
      });

      const res = await request(app).get('/api/health');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.error).toContain('PostgreSQL database connectivity check failed');
      expect(res.body.database.ok).toBe(false);
    });

    it('returns HTTP 200 on /api/health in test/dev with in-memory health', async () => {
      process.env.NODE_ENV = 'test';

      vi.spyOn(repository, 'checkHealth').mockResolvedValue({
        ok: true,
        mode: 'memory'
      });

      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('3. Production Rejection of Silent In-Memory Fallback', () => {
    it('throws error in production if query fails rather than silently returning mock memory products', async () => {
      process.env.NODE_ENV = 'production';

      const mockFailingPrisma: any = {
        product: {
          findMany: vi.fn().mockRejectedValue(new Error('Neon socket connection closed unexpectedly'))
        }
      };

      const prodRepo = new MarketplaceRepository({ prismaClient: mockFailingPrisma });

      await expect(prodRepo.getProducts()).rejects.toThrow(
        /PostgreSQL getProducts query failed in production/
      );
    });

    it('throws error in production if saveContract database insert fails', async () => {
      process.env.NODE_ENV = 'production';

      const mockFailingPrisma: any = {
        intentContract: {
          upsert: vi.fn().mockRejectedValue(new Error('Neon write transaction aborted'))
        }
      };

      const prodRepo = new MarketplaceRepository({ prismaClient: mockFailingPrisma });

      await expect(
        prodRepo.saveContract({
          contractId: 'cnt_test_prod',
          userRequest: 'Buy milk',
          category: 'dairy',
          productName: 'Amul Taaza',
          preferredBrand: 'Amul',
          variantOrModel: 'Taaza',
          quantity: 2,
          unit: 'litre',
          maxBudgetPaise: 15000,
          mandatoryRequirements: [],
          permittedSubstitutions: [],
          nonce: 'test_nonce_123',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          signature: 'sig_test'
        })
      ).rejects.toThrow(/Failed to persist intent contract in production/);
    });

    it('preserves in-memory fallback in development/test when database query fails', async () => {
      process.env.NODE_ENV = 'test';

      const mockFailingPrisma: any = {
        product: {
          findMany: vi.fn().mockRejectedValue(new Error('Dev connection failed'))
        }
      };

      const devRepo = new MarketplaceRepository({ prismaClient: mockFailingPrisma });
      const products = await devRepo.getProducts();

      // In test/dev, it warns and falls back to seed products gracefully
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('4. PostgreSQL Atomic Nonce Replay Protection', () => {
    it('correctly handles PostgreSQL P2002 unique constraint to prevent replay attacks', async () => {
      let callCount = 0;
      const mockPrisma: any = {
        usedNonce: {
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            callCount++;
            if (callCount === 1) {
              return { id: 'nonce_row_1', nonce: data.nonce, contractId: data.contractId };
            }
            // Second simultaneous attempt generates Prisma P2002 unique constraint violation
            const p2002Error: any = new Error('Unique constraint failed on the fields: (`nonce`)');
            p2002Error.code = 'P2002';
            throw p2002Error;
          })
        }
      };

      const repo = new MarketplaceRepository({ prismaClient: mockPrisma });

      const firstClaim = await repo.claimNonceAtomic('nonce_unique_1', 'contract_1');
      expect(firstClaim).toBe(true);

      // Replay attempt with exact same nonce
      const replayClaim = await repo.claimNonceAtomic('nonce_unique_1', 'contract_2');
      expect(replayClaim).toBe(false);
    });

    it('throws in production if claimNonceAtomic encounters an unexpected database error', async () => {
      process.env.NODE_ENV = 'production';

      const mockPrisma: any = {
        usedNonce: {
          create: vi.fn().mockRejectedValue(new Error('Fatal Neon connection reset by peer'))
        }
      };

      const prodRepo = new MarketplaceRepository({ prismaClient: mockPrisma });

      await expect(
        prodRepo.claimNonceAtomic('nonce_fatal_test', 'contract_x')
      ).rejects.toThrow(/PostgreSQL atomic nonce claim failed in production/);
    });

    it('preserves in-memory atomic replay prevention in test/dev mode without database', async () => {
      process.env.NODE_ENV = 'test';
      const memoryRepo = new MarketplaceRepository({ forceMemoryOnly: true });

      const firstClaim = await memoryRepo.claimNonceAtomic('memory_nonce_1', 'contract_m1');
      expect(firstClaim).toBe(true);

      const replayClaim = await memoryRepo.claimNonceAtomic('memory_nonce_1', 'contract_m2');
      expect(replayClaim).toBe(false);
    });
  });
});
