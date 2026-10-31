import { describe, it, expect } from 'vitest';
import { SecurityLabService, SECURITY_SCENARIOS } from '../services/securityLabService.js';
import { MarketplaceRepository } from '../db/repository.js';
import { AIService } from '../ai/aiService.js';

describe('Security Lab All 10 Attack Scenarios', () => {
  const repo = new MarketplaceRepository();
  const aiService = new AIService();
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
