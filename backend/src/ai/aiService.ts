import { ParsedIntent } from '../types/index.js';
import { AIProviderResponse, AIProviderStatus, IAIProvider } from './types.js';
import { GeminiProvider } from './providers/geminiProvider.js';
import { GroqProvider } from './providers/groqProvider.js';
import { OpenRouterProvider } from './providers/openRouterProvider.js';
import { LocalDeterministicParser } from './localParser.js';

interface ProviderState {
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
  circuitBreakerResetAt?: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  lastError?: string;
}

export class AIService {
  private gemini: GeminiProvider;
  private groq: GroqProvider;
  private openRouter: OpenRouterProvider;
  private localParser: LocalDeterministicParser;

  private states: Record<string, ProviderState> = {
    gemini: { consecutiveFailures: 0, circuitBreakerOpen: false },
    groq: { consecutiveFailures: 0, circuitBreakerOpen: false },
    openrouter: { consecutiveFailures: 0, circuitBreakerOpen: false },
    local_fallback: { consecutiveFailures: 0, circuitBreakerOpen: false }
  };

  private readonly FAILURE_THRESHOLD = 3;
  private readonly CIRCUIT_TIMEOUT_MS = 60000; // 1 minute

  constructor() {
    this.gemini = new GeminiProvider();
    this.groq = new GroqProvider();
    this.openRouter = new OpenRouterProvider();
    this.localParser = new LocalDeterministicParser();
  }

  private isCircuitOpen(providerName: string): boolean {
    const state = this.states[providerName];
    if (!state.circuitBreakerOpen) return false;
    if (state.circuitBreakerResetAt && Date.now() > state.circuitBreakerResetAt) {
      // Half-open / reset
      state.circuitBreakerOpen = false;
      state.consecutiveFailures = 0;
      state.circuitBreakerResetAt = undefined;
      return false;
    }
    return true;
  }

  private recordSuccess(providerName: string) {
    const state = this.states[providerName];
    state.consecutiveFailures = 0;
    state.circuitBreakerOpen = false;
    state.lastSuccessTime = new Date().toISOString();
    state.lastError = undefined;
  }

  private recordFailure(providerName: string, error: unknown) {
    const state = this.states[providerName];
    state.consecutiveFailures += 1;
    state.lastFailureTime = new Date().toISOString();
    state.lastError = error instanceof Error ? error.message : String(error);

    if (state.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      state.circuitBreakerOpen = true;
      state.circuitBreakerResetAt = Date.now() + this.CIRCUIT_TIMEOUT_MS;
    }
  }

  /**
   * Parses shopping request with automatic tiered fallback:
   * Level 1: Gemini -> Level 2: Groq -> Level 3: OpenRouter -> Level 4: Local Deterministic Parser
   */
  async parseIntent(userPrompt: string): Promise<AIProviderResponse> {
    const providers: Array<{ name: 'gemini' | 'groq' | 'openrouter'; instance: IAIProvider; model: string }> = [
      { name: 'gemini', instance: this.gemini, model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' },
      { name: 'groq', instance: this.groq, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' },
      { name: 'openrouter', instance: this.openRouter, model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct' }
    ];

    // Attempt remote providers in order
    for (const p of providers) {
      if (p.instance.isConfigured() && !this.isCircuitOpen(p.name)) {
        const start = Date.now();
        try {
          const intent = await p.instance.parseIntent(userPrompt);
          this.recordSuccess(p.name);
          return {
            intent,
            provider: p.name,
            modelUsed: p.model,
            latencyMs: Date.now() - start
          };
        } catch (err) {
          this.recordFailure(p.name, err);
          // Fall through to next provider in chain
        }
      }
    }

    // Final Level 4 Fallback: Deterministic Local Parser
    const start = Date.now();
    try {
      const intent = this.localParser.parse(userPrompt);
      this.recordSuccess('local_fallback');
      return {
        intent,
        provider: 'local_fallback',
        modelUsed: 'NIYAT-Deterministic-RegexRules-v1',
        latencyMs: Date.now() - start
      };
    } catch (err) {
      this.recordFailure('local_fallback', err);
      throw err;
    }
  }

  getStatus(): AIProviderStatus[] {
    return [
      {
        name: 'Google Gemini (Level 1)',
        isConfigured: this.gemini.isConfigured(),
        isAvailable: this.gemini.isConfigured() && !this.isCircuitOpen('gemini'),
        circuitBreakerOpen: this.isCircuitOpen('gemini'),
        consecutiveFailures: this.states.gemini.consecutiveFailures,
        lastFailureTime: this.states.gemini.lastFailureTime,
        lastSuccessTime: this.states.gemini.lastSuccessTime,
        lastError: this.states.gemini.lastError
      },
      {
        name: 'Groq (Level 2)',
        isConfigured: this.groq.isConfigured(),
        isAvailable: this.groq.isConfigured() && !this.isCircuitOpen('groq'),
        circuitBreakerOpen: this.isCircuitOpen('groq'),
        consecutiveFailures: this.states.groq.consecutiveFailures,
        lastFailureTime: this.states.groq.lastFailureTime,
        lastSuccessTime: this.states.groq.lastSuccessTime,
        lastError: this.states.groq.lastError
      },
      {
        name: 'OpenRouter (Level 3)',
        isConfigured: this.openRouter.isConfigured(),
        isAvailable: this.openRouter.isConfigured() && !this.isCircuitOpen('openrouter'),
        circuitBreakerOpen: this.isCircuitOpen('openrouter'),
        consecutiveFailures: this.states.openrouter.consecutiveFailures,
        lastFailureTime: this.states.openrouter.lastFailureTime,
        lastSuccessTime: this.states.openrouter.lastSuccessTime,
        lastError: this.states.openrouter.lastError
      },
      {
        name: 'Local Deterministic Parser (Level 4 Fallback)',
        isConfigured: true,
        isAvailable: true,
        circuitBreakerOpen: false,
        consecutiveFailures: 0,
        lastSuccessTime: this.states.local_fallback.lastSuccessTime
      }
    ];
  }
}
