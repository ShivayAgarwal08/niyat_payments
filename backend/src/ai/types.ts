import { ParsedIntent } from '../types/index.js';

export interface AIProviderResponse {
  intent: ParsedIntent;
  provider: 'gemini' | 'groq' | 'openrouter' | 'local_fallback';
  modelUsed: string;
  latencyMs: number;
}

export interface AIProviderStatus {
  name: string;
  isConfigured: boolean;
  isAvailable: boolean;
  circuitBreakerOpen: boolean;
  consecutiveFailures: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  lastError?: string;
}

export interface IAIProvider {
  name: 'gemini' | 'groq' | 'openrouter';
  isConfigured(): boolean;
  parseIntent(userPrompt: string): Promise<ParsedIntent>;
}
