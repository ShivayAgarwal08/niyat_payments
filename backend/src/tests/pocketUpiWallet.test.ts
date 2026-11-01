import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { repository } from '../db/repository.js';

describe('NIYAT Pocket UPI Integration Tests', () => {
  let initialBalancePaise: number;

  beforeAll(async () => {
    const summary = await repository.getWallet('user_default');
    initialBalancePaise = summary.wallet.balancePaise;
  });

  it('1. GET /api/wallet retrieves current simulated user wallet', async () => {
    const res = await request(app).get('/api/wallet');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.wallet.upiId).toBe('user@niyat');
    expect(res.body.wallet.currency).toBe('INR');
    expect(res.body.wallet.isDemoWallet).toBe(true);
    expect(typeof res.body.balanceRupees).toBe('number');
    expect(Array.isArray(res.body.recentLedgers)).toBe(true);
  });

  it('2. POST /api/wallet/topup adds simulated demo money in integer paise', async () => {
    const topUpAmountPaise = 200000; // ₹2,000.00
    const res = await request(app)
      .post('/api/wallet/topup')
      .send({ amountPaise: topUpAmountPaise });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.wallet.balancePaise).toBeGreaterThanOrEqual(topUpAmountPaise);
    expect(res.body.message).toContain('Added ₹2000.00');

    // Confirm in recent ledgers
    const ledger = res.body.recentLedgers[0];
    expect(ledger.type).toBe('TOPUP');
    expect(ledger.amountPaise).toBe(topUpAmountPaise);
  });

  it('3. POST /api/wallet/transfer performs valid P2P simulated transfer', async () => {
    const transferPaise = 50000; // ₹500.00
    const res = await request(app)
      .post('/api/wallet/transfer')
      .send({
        recipientUpiId: 'rahul@niyat',
        amountPaise: transferPaise,
        note: 'Dinner split'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transactionRef).toMatch(/^p2p_/);
    expect(res.body.message).toContain('Successfully sent ₹500.00 to rahul@niyat');
  });

  it('4. POST /api/wallet/transfer rejects self-transfer', async () => {
    const res = await request(app)
      .post('/api/wallet/transfer')
      .send({
        recipientUpiId: 'user@niyat',
        amountPaise: 10000
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SELF_TRANSFER_FORBIDDEN');
  });

  it('5. POST /api/wallet/transfer rejects transfer exceeding available balance', async () => {
    const res = await request(app)
      .post('/api/wallet/transfer')
      .send({
        recipientUpiId: 'rahul@niyat',
        amountPaise: 999999999 // ₹9,999,999.99
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('6. Protected shopping ALLOW decision atomically deducts simulated wallet balance', async () => {
    // Top up to ensure ample balance
    await repository.topUpWallet(500000, 'user_default');
    const beforeWallet = await repository.getWallet('user_default');

    // Prepare purchase for milk
    const prep = await request(app)
      .post('/api/simulation/protected/prepare')
      .send({ prompt: 'Buy 1 litre Amul Taaza milk under 100 rupees' });

    expect(prep.status).toBe(200);
    const { contract, recommendedOffer, assessment } = prep.body;

    // Execute authorized purchase
    const exec = await request(app)
      .post('/api/simulation/protected/execute')
      .send({
        contract,
        selectedOffer: recommendedOffer,
        assessmentId: assessment.assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: true
      });

    expect(exec.status).toBe(200);
    expect(exec.body.verifierDecision.decision).toBe('ALLOW');
    expect(exec.body.simulatedPaymentResult.status).toBe('PAID');

    // Verify wallet deduction
    const afterWallet = await repository.getWallet('user_default');
    expect(afterWallet.wallet.balancePaise).toBe(
      beforeWallet.wallet.balancePaise - exec.body.simulatedPaymentResult.amountPaise
    );
  }, 30000);

  it('7. Protected shopping price-manipulation BLOCK leaves wallet balance untouched', async () => {
    const beforeWallet = await repository.getWallet('user_default');

    // Prepare purchase
    const prep = await request(app)
      .post('/api/simulation/protected/prepare')
      .send({ prompt: 'Buy 1 litre Amul Taaza milk under 100 rupees' });

    expect(prep.status).toBe(200);
    const { contract, recommendedOffer, assessment } = prep.body;

    // Attacker inflates price to ₹250 (25000 paise), exceeding the contract maximum budget
    const exec = await request(app)
      .post('/api/simulation/protected/execute')
      .send({
        contract,
        selectedOffer: recommendedOffer,
        assessmentId: assessment.assessmentId,
        userApproved: true,
        userAcknowledgedAdvisory: true,
        customTotalAmountPaise: 25000
      });

    expect(exec.status).toBe(200);
    expect(exec.body.verifierDecision.decision).toBe('BLOCK');
    expect(exec.body.simulatedPaymentResult.status).toBe('REJECTED');

    // Wallet balance MUST remain strictly unchanged!
    const afterWallet = await repository.getWallet('user_default');
    expect(afterWallet.wallet.balancePaise).toBe(beforeWallet.wallet.balancePaise);
  }, 30000);
});
