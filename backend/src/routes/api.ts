import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AIService } from '../ai/aiService.js';
import { repository } from '../db/repository.js';
import { NormalModeSimulator } from '../simulation/normalModeSimulator.js';
import { ProtectedModeSimulator } from '../simulation/protectedModeSimulator.js';
import { SecurityLabService } from '../services/securityLabService.js';
import { BlindVerifier } from '../verifier/blindVerifier.js';
import { createSignedIntentContract } from '../contract/intentContract.js';

export const apiRouter = Router();

// Shared instances
const aiService = new AIService();
const normalSimulator = new NormalModeSimulator(aiService, repository);
const protectedSimulator = new ProtectedModeSimulator(aiService, repository);
const securityLab = new SecurityLabService(repository, aiService);
const blindVerifier = new BlindVerifier(repository);

// --- Validation Schemas ---
const ParseIntentSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty')
});

const CreateContractSchema = z.object({
  userRequest: z.string().min(1),
  intent: z.object({
    productCategory: z.string(),
    productName: z.string(),
    preferredBrand: z.string(),
    variantOrModel: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    maxBudgetPaise: z.number().int().nonnegative(),
    mandatoryRequirements: z.array(z.string()).default([]),
    optionalPreferences: z.array(z.string()).default([]),
    permittedSubstitutions: z.array(z.string()).default([]),
    confidence: z.number().optional()
  }),
  ttlMinutes: z.number().optional()
});

const VerifySchema = z.object({
  contract: z.any(),
  authorization: z.any(),
  merchantPayeeExpected: z.string().optional()
});

const NormalSimulationSchema = z.object({
  prompt: z.string().min(1)
});

const ProtectedPrepareSchema = z.object({
  prompt: z.string().min(1)
});

const ProtectedExecuteSchema = z.object({
  contract: z.record(z.any()),
  selectedOffer: z.record(z.any()),
  userApproved: z.boolean(),
  customTotalAmountPaise: z.number().optional(),
  customPayeeAddress: z.string().optional(),
  customQuantity: z.number().optional()
});

const SecurityRunSchema = z.object({
  scenarioId: z.string(),
  customPrompt: z.string().optional()
});

// --- Routes ---

// Health Check (verifies database connectivity in production)
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const dbHealth = await repository.checkHealth();

  if (isProd && !dbHealth.ok) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'NIYAT Payments Engine',
      error: 'PostgreSQL database connectivity check failed',
      database: dbHealth,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    status: 'ok',
    service: 'NIYAT Payments Engine',
    database: dbHealth,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Marketplace Products
apiRouter.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const products = await repository.getProducts({ category, search });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const product = await repository.getProductById(id);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// Market Intelligence & Price Analysis
apiRouter.get('/market/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    const report = await repository.getMarketIntelligence(productId);
    if (!report) {
      res.status(404).json({ success: false, error: 'Market report not available for this product' });
      return;
    }
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

// Intent Extraction (Gemini -> Groq -> OpenRouter -> Local Deterministic Fallback)
apiRouter.post('/intent/parse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = ParseIntentSchema.parse(req.body);
    const result = await aiService.parseIntent(prompt);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Create Signed Intent Contract
apiRouter.post('/intent/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userRequest, intent, ttlMinutes } = CreateContractSchema.parse(req.body);
    const contract = createSignedIntentContract(userRequest, intent as any, { ttlMinutes });
    await repository.saveContract(contract);
    res.json({ success: true, contract });
  } catch (err) {
    next(err);
  }
});

// Independent Blind Verifier Endpoint
apiRouter.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contract, authorization, merchantPayeeExpected } = VerifySchema.parse(req.body);
    const decision = await blindVerifier.verify({
      contract,
      authorization,
      merchantPayeeExpected
    });
    res.json({ success: true, decision });
  } catch (err) {
    next(err);
  }
});

// Normal Shopping Mode Simulation (VULNERABLE EDUCATIONAL SIMULATION)
apiRouter.post('/simulation/normal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = NormalSimulationSchema.parse(req.body);
    const result = await normalSimulator.simulate(prompt);
    res.json({ success: true, simulation: result });
  } catch (err) {
    next(err);
  }
});

// NIYAT Protected Mode Simulation
apiRouter.post('/simulation/protected/prepare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = ProtectedPrepareSchema.parse(req.body);
    const result = await protectedSimulator.prepareProtectedPurchase(prompt);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/simulation/protected/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = ProtectedExecuteSchema.parse(req.body);
    const result = await protectedSimulator.executeProtectedPurchase(body as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Transaction History
apiRouter.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
    const transactions = await repository.getTransactions(limit);
    res.json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    next(err);
  }
});

// Security Lab
apiRouter.get('/security/scenarios', (_req: Request, res: Response) => {
  const scenarios = securityLab.getScenarios();
  res.json({ success: true, scenarios });
});

apiRouter.post('/security/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId, customPrompt } = SecurityRunSchema.parse(req.body);
    const result = await securityLab.runScenario(scenarioId, customPrompt);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

// AI Provider Status
apiRouter.get('/ai/status', (_req: Request, res: Response) => {
  const providers = aiService.getStatus();
  res.json({ success: true, providers });
});
