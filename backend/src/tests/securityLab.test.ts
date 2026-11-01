import { describe, it, expect, vi } from 'vitest';
import { SecurityLabService, SECURITY_SCENARIOS } from '../services/securityLabService.js';
import { MarketplaceRepository } from '../db/repository.js';
import { AIService } from '../ai/aiService.js';
import { LocalDeterministicParser } from '../ai/localParser.js';

describe('Security Lab All 10 Attack Scenarios', () => {
  const repo = new MarketplaceRepository({ forceMemoryOnly: true });
  const aiService = new AIService();
  const localParser = new LocalDeterministicParser();

  // Mock aiService for fast, deterministic, offline attack scenario testing
  vi.spyOn(aiService, 'parseIntent').mockImplementation(async (prompt: string) => ({
    intent: localParser.parse(prompt),
    provider: 'local_fallback',
    modelUsed: 'NIYAT-Deterministic-RegexRules-v1',
    latencyMs: 0
  }));

  const securityLab = new SecurityLabService(repo, aiService);

  it('contains exactly 10 distinct attack scenarios', () => {
    const scenarios = securityLab.getScenarios();
    expect(scenarios).toHaveLength(10);
  });

  for (const scenario of SECURITY_SCENARIOS) {
    it(`executes and correctly blocks attack scenario: ${scenario.name} (${scenario.id})`, async () => {
      const result = await securityLab.runScenario(scenario.id);

      expect(result.scenarioId).toBe(scenario.id);
      expect(result.blocked).toBe(true);
      expect(['BLOCK', 'ASK']).toContain(result.verifierDecision);
      expect(result.reason.length).toBeGreaterThan(5);
      expect(result.normalModeResult.explanation).toBeDefined();
    });
  }
});
