import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../ai/aiService.js';
import { GeminiProvider } from '../ai/providers/geminiProvider.js';
import { GroqProvider } from '../ai/providers/groqProvider.js';
import { OpenRouterProvider } from '../ai/providers/openRouterProvider.js';
import { ParsedIntent } from '../types/index.js';

describe('AI Provider Fallback & Resilience', () => {
  const sampleIntent: ParsedIntent = {
    productCategory: 'Milk',
    productName: 'Amul Taaza Toned Milk',
    preferredBrand: 'Amul',
    variantOrModel: 'Taaza Toned',
    quantity: 2,
    unit: 'Litre',
    maxBudgetPaise: 15000,
    mandatoryRequirements: ['Toned'],
    optionalPreferences: [],
    permittedSubstitutions: ['Mother Dairy'],
    confidence: 0.95
  };

  it('successfully returns Gemini response when Gemini is configured and healthy', async () => {
    const aiService = new AIService();

    const configSpy = vi.spyOn(GeminiProvider.prototype, 'isConfigured').mockReturnValue(true);
    const parseSpy = vi.spyOn(GeminiProvider.prototype, 'parseIntent').mockResolvedValue(sampleIntent);

    const result = await aiService.parseIntent('Buy 2 litres of Amul Taaza milk under ₹150.');
    expect(result.provider).toBe('gemini');
    expect(result.intent.preferredBrand).toBe('Amul');
    expect(result.intent.maxBudgetPaise).toBe(15000);

    configSpy.mockRestore();
    parseSpy.mockRestore();
  });

  it('falls back to Groq when Gemini times out', async () => {
    const aiService = new AIService();

    const geminiConfig = vi.spyOn(GeminiProvider.prototype, 'isConfigured').mockReturnValue(true);
    const geminiParse = vi.spyOn(GeminiProvider.prototype, 'parseIntent').mockRejectedValue(
      new Error('Gemini request timed out after 8000ms')
    );

    const groqConfig = vi.spyOn(GroqProvider.prototype, 'isConfigured').mockReturnValue(true);
    const groqParse = vi.spyOn(GroqProvider.prototype, 'parseIntent').mockResolvedValue({
      ...sampleIntent,
      productName: 'Groq Parsed Amul Milk'
    });

    const result = await aiService.parseIntent('Buy 2 litres of Amul Taaza milk under ₹150.');
    expect(result.provider).toBe('groq');
    expect(result.intent.productName).toBe('Groq Parsed Amul Milk');

    geminiConfig.mockRestore();
    geminiParse.mockRestore();
    groqConfig.mockRestore();
    groqParse.mockRestore();
  });

  it('falls back to OpenRouter when both Gemini and Groq fail with HTTP 429', async () => {
    const aiService = new AIService();

    const geminiConfig = vi.spyOn(GeminiProvider.prototype, 'isConfigured').mockReturnValue(true);
    const geminiParse = vi.spyOn(GeminiProvider.prototype, 'parseIntent').mockRejectedValue(
      new Error('Gemini API error (429): Rate limit exceeded')
    );

    const groqConfig = vi.spyOn(GroqProvider.prototype, 'isConfigured').mockReturnValue(true);
    const groqParse = vi.spyOn(GroqProvider.prototype, 'parseIntent').mockRejectedValue(
      new Error('Groq API error (429): Rate limit exceeded')
    );

    const openRouterConfig = vi.spyOn(OpenRouterProvider.prototype, 'isConfigured').mockReturnValue(true);
    const openRouterParse = vi.spyOn(OpenRouterProvider.prototype, 'parseIntent').mockResolvedValue({
      ...sampleIntent,
      productName: 'OpenRouter Parsed Milk'
    });

    const result = await aiService.parseIntent('Buy 2 litres of Amul Taaza milk under ₹150.');
    expect(result.provider).toBe('openrouter');
    expect(result.intent.productName).toBe('OpenRouter Parsed Milk');

    geminiConfig.mockRestore();
    geminiParse.mockRestore();
    groqConfig.mockRestore();
    groqParse.mockRestore();
    openRouterConfig.mockRestore();
    openRouterParse.mockRestore();
  });

  it('handles malformed AI response gracefully and cascades to next provider', async () => {
    const aiService = new AIService();

    const geminiConfig = vi.spyOn(GeminiProvider.prototype, 'isConfigured').mockReturnValue(true);
    const geminiParse = vi.spyOn(GeminiProvider.prototype, 'parseIntent').mockRejectedValue(
      new Error('JSON Parse error: Unexpected token < in JSON at position 0')
    );
    const groqConfig = vi.spyOn(GroqProvider.prototype, 'isConfigured').mockReturnValue(false);
    const openRouterConfig = vi.spyOn(OpenRouterProvider.prototype, 'isConfigured').mockReturnValue(false);

    const result = await aiService.parseIntent('Buy 1 pair of Nike running shoes under ₹4,500');
    expect(result.provider).toBe('local_fallback');
    expect(result.intent.productCategory).toBe('Shoes');

    geminiConfig.mockRestore();
    geminiParse.mockRestore();
    groqConfig.mockRestore();
    openRouterConfig.mockRestore();
  });

  it('falls back to local deterministic parser when all remote providers fail or are unconfigured', async () => {
    const geminiConfig = vi.spyOn(GeminiProvider.prototype, 'isConfigured').mockReturnValue(false);
    const groqConfig = vi.spyOn(GroqProvider.prototype, 'isConfigured').mockReturnValue(false);
    const openRouterConfig = vi.spyOn(OpenRouterProvider.prototype, 'isConfigured').mockReturnValue(false);

    const aiService = new AIService();
    const result = await aiService.parseIntent('Buy 2 litres of Amul Taaza milk under ₹150.');

    expect(result.provider).toBe('local_fallback');
    expect(result.intent.preferredBrand).toBe('Amul');
    expect(result.intent.quantity).toBe(2);
    expect(result.intent.maxBudgetPaise).toBe(15000);

    geminiConfig.mockRestore();
    groqConfig.mockRestore();
    openRouterConfig.mockRestore();
  });

  it('reports provider status and circuit breaker telemetry correctly', () => {
    const aiService = new AIService();
    const statuses = aiService.getStatus();

    expect(statuses).toHaveLength(4);
    expect(statuses[0].name).toContain('Gemini');
    expect(statuses[1].name).toContain('Groq');
    expect(statuses[2].name).toContain('OpenRouter');
    expect(statuses[3].name).toContain('Local Deterministic Parser');
    expect(statuses[3].isAvailable).toBe(true);
    expect(statuses[3].circuitBreakerOpen).toBe(false);
  });
});
