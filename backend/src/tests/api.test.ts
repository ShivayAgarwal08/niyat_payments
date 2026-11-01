import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('NIYAT Backend API Endpoints', () => {
  it('GET /api/health returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('NIYAT');
  });

  it('GET /api/products returns catalog items', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it('GET /api/market/:productId returns landed prices and historical trend', async () => {
    const res = await request(app).get('/api/market/prod_amul_taaza_quickmart');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report.offers.length).toBeGreaterThan(0);
    expect(res.body.report.isDemoData).toBe(true);
  });

  it('POST /api/intent/parse parses prompt into structured intent', async () => {
    const res = await request(app)
      .post('/api/intent/parse')
      .send({ prompt: 'Buy 2 litres of Amul Taaza milk under ₹150.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.intent.preferredBrand).toBe('Amul');
    expect(res.body.intent.maxBudgetPaise).toBe(15000);
  }, 15000);

  it('POST /api/simulation/normal runs vulnerable educational simulation', async () => {
    const res = await request(app)
      .post('/api/simulation/normal')
      .send({ prompt: 'Buy 2 litres of Amul Taaza milk under ₹150.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.simulation.isEducationalVulnerableSimulation).toBe(true);
    expect(res.body.simulation.attackPayloadDetected).toBeDefined();
    expect(res.body.simulation.simulatedPaymentExecution.status).toBe('UNAUTHORIZED_SIMULATED_PAYMENT');
  }, 15000);

  it('POST /api/simulation/protected/prepare generates contract and market intelligence', async () => {
    const res = await request(app)
      .post('/api/simulation/protected/prepare')
      .send({ prompt: 'Buy 2 litres of Amul Taaza milk under ₹150.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.contract.signature).toBeDefined();
    expect(res.body.marketIntelligence).toBeDefined();
    expect(res.body.recommendedOffer).toBeDefined();
  }, 15000);

  it('GET /api/security/scenarios returns all 10 scenarios', async () => {
    const res = await request(app).get('/api/security/scenarios');
    expect(res.status).toBe(200);
    expect(res.body.scenarios).toHaveLength(10);
  });

  it('POST /api/security/run executes a scenario and blocks it', async () => {
    const res = await request(app)
      .post('/api/security/run')
      .send({ scenarioId: 'attack_amount_manipulation' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.blocked).toBe(true);
  }, 15000);

  it('GET /api/ai/status returns provider tiers', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(res.body.providers.length).toBe(4);
  });
});
