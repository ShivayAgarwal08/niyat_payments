import { describe, it, expect, vi } from 'vitest';
import dotenv from 'dotenv';
dotenv.config();

import { GeminiProvider } from '../ai/providers/geminiProvider.js';
import { GroqProvider } from '../ai/providers/groqProvider.js';
import { OpenRouterProvider } from '../ai/providers/openRouterProvider.js';
import { LocalDeterministicParser } from '../ai/localParser.js';
import { AIService } from '../ai/aiService.js';

describe('Live AI Providers Connectivity & Complete Fallback Chain', () => {
  const testPrompt = 'Buy 2 litres of Amul Taaza milk under ₹150.';

  describe('1. Individual Provider Configuration & Live Connectivity', () => {
    it('verifies Google Gemini is configured and attempts live intent extraction', async () => {
      const gemini = new GeminiProvider();
      expect(gemini.isConfigured()).toBe(true);

      try {
        const intent = await gemini.parseIntent(testPrompt);
        expect(intent).toBeDefined();
        expect(intent.productCategory).toBeDefined();
        expect(intent.preferredBrand.toLowerCase()).toContain('amul');
        expect(intent.quantity).toBe(2);
        expect(intent.maxBudgetPaise).toBe(15000);
        console.log('✓ Gemini Live Test Passed:', {
          brand: intent.preferredBrand,
          variant: intent.variantOrModel,
          quantity: intent.quantity,
          budgetPaise: intent.maxBudgetPaise
        });
      } catch (err: any) {
        console.warn('Gemini temporary cloud status:', err.message);
        expect(err.message).toMatch(/Gemini API (error \((503|429)\)|request timed out)|aborted/i);
      }
    }, 25000);

    it('verifies Groq is configured and parses intent', async () => {
      const groq = new GroqProvider();
      expect(groq.isConfigured()).toBe(true);

      const intent = await groq.parseIntent(testPrompt);
      expect(intent).toBeDefined();
      expect(intent.productCategory).toBeDefined();
      expect(intent.preferredBrand.toLowerCase()).toContain('amul');
      expect(intent.quantity).toBe(2);
      expect(intent.maxBudgetPaise).toBe(15000);
      console.log('✓ Groq Live Test Passed:', {
        brand: intent.preferredBrand,
        variant: intent.variantOrModel,
        quantity: intent.quantity,
        budgetPaise: intent.maxBudgetPaise
      });
    }, 15000);

    it('verifies OpenRouter is configured and parses intent', async () => {
      const openRouter = new OpenRouterProvider();
      expect(openRouter.isConfigured()).toBe(true);

      try {
        const intent = await openRouter.parseIntent(testPrompt);
        expect(intent).toBeDefined();
        expect(intent.productCategory).toBeDefined();
        expect(intent.preferredBrand.toLowerCase()).toContain('amul');
        expect(intent.quantity).toBe(2);
        expect(intent.maxBudgetPaise).toBe(15000);
        console.log('✓ OpenRouter Live Test Passed:', {
          brand: intent.preferredBrand,
          variant: intent.variantOrModel,
          quantity: intent.quantity,
          budgetPaise: intent.maxBudgetPaise
        });
      } catch (err: any) {
        console.warn('OpenRouter temporary cloud status:', err.message);
        expect(err.message).toMatch(/OpenRouter API (error \((429|503|504)\)|request timed out)/i);
      }
    }, 35000);

    it('verifies Local Deterministic Parser operates with zero external dependencies', () => {
      const local = new LocalDeterministicParser();
      const intent = local.parse(testPrompt);

      expect(intent.productCategory).toBe('Milk');
      expect(intent.preferredBrand).toBe('Amul');
      expect(intent.variantOrModel).toBe('Taaza Toned');
      expect(intent.quantity).toBe(2);
      expect(intent.unit).toBe('Litre');
      expect(intent.maxBudgetPaise).toBe(15000);
      console.log('✓ Local Deterministic Parser Passed');
    });
  });

  describe('2. Automated Fallback Chain Execution', () => {
    it('Level 1: Serves via Gemini as default primary provider (or cascades to Groq on transient 503)', async () => {
      const aiService = new AIService();
      const res = await aiService.parseIntent(testPrompt);

      expect(['gemini', 'groq']).toContain(res.provider);
      expect(res.intent.preferredBrand.toLowerCase()).toContain('amul');
      expect(res.intent.quantity).toBe(2);
      console.log(`✓ Level 1 served by: ${res.provider} (${res.modelUsed}, ${res.latencyMs}ms)`);
    }, 20000);

    it('Level 2: Automatically falls back to Groq when Gemini fails', async () => {
      const aiService = new AIService();
      const geminiSpy = vi.spyOn(GeminiProvider.prototype, 'parseIntent').mockRejectedValue(
        new Error('Simulated Gemini 503 Service Unavailable')
      );

      const res = await aiService.parseIntent(testPrompt);
      expect(res.provider).toBe('groq');
      expect(res.intent.preferredBrand.toLowerCase()).toContain('amul');
      console.log(`✓ Level 2 (Gemini Down -> Groq Fallback) served by: ${res.provider} (${res.modelUsed})`);

      geminiSpy.mockRestore();
    }, 20000);

    it('Level 3: Automatically falls back to OpenRouter (or Local on queue timeout) when Gemini and Groq fail', async () => {
      const aiService = new AIService();
      const geminiSpy = vi.spyOn(GeminiProvider.prototype, 'parseIntent').mockRejectedValue(
        new Error('Simulated Gemini 429 Rate Limit')
      );
      const groqSpy = vi.spyOn(GroqProvider.prototype, 'parseIntent').mockRejectedValue(
        new Error('Simulated Groq 500 Internal Server Error')
      );

      const res = await aiService.parseIntent(testPrompt);
      expect(['openrouter', 'local_fallback']).toContain(res.provider);
      expect(res.intent.preferredBrand.toLowerCase()).toContain('amul');
      console.log(`✓ Level 3 (Gemini+Groq Down -> Cascade) served by: ${res.provider} (${res.modelUsed})`);

      geminiSpy.mockRestore();
      groqSpy.mockRestore();
    }, 35000);

    it('Level 4: Automatically falls back to Local Parser when all remote providers fail', async () => {
      const aiService = new AIService();
      const geminiSpy = vi.spyOn(GeminiProvider.prototype, 'parseIntent').mockRejectedValue(
        new Error('Simulated Gemini Timeout')
      );
      const groqSpy = vi.spyOn(GroqProvider.prototype, 'parseIntent').mockRejectedValue(
        new Error('Simulated Groq Timeout')
      );
      const openRouterSpy = vi.spyOn(OpenRouterProvider.prototype, 'parseIntent').mockRejectedValue(
        new Error('Simulated OpenRouter Timeout')
      );

      const res = await aiService.parseIntent(testPrompt);
      expect(res.provider).toBe('local_fallback');
      expect(res.intent.preferredBrand).toBe('Amul');
      expect(res.intent.quantity).toBe(2);
      expect(res.intent.maxBudgetPaise).toBe(15000);
      console.log(`✓ Level 4 (All Remote Down -> Local Deterministic Fallback) served by: ${res.provider}`);

      geminiSpy.mockRestore();
      groqSpy.mockRestore();
      openRouterSpy.mockRestore();
    });
  });
});
