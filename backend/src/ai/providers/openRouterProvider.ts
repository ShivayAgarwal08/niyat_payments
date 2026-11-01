import { ENV } from '../../config/env.js';
import { ParsedIntent, ParsedIntentSchema } from '../../types/index.js';
import { IAIProvider } from '../types.js';

const SYSTEM_PROMPT = `You are NIYAT's Intent Extraction Engine.
Extract the structured shopping requirements from the user's shopping request.
Respond with pure JSON only:
{
  "productCategory": string,
  "productName": string,
  "preferredBrand": string,
  "variantOrModel": string,
  "quantity": number,
  "unit": string,
  "maxBudgetPaise": number,
  "mandatoryRequirements": string[],
  "optionalPreferences": string[],
  "permittedSubstitutions": string[],
  "confidence": number,
  "ambiguityQuestion": string | null
}`;

export class OpenRouterProvider implements IAIProvider {
  name: 'openrouter' = 'openrouter';

  isConfigured(): boolean {
    return Boolean(ENV.OPENROUTER_API_KEY && ENV.OPENROUTER_API_KEY.trim().length > 0);
  }

  async parseIntent(userPrompt: string): Promise<ParsedIntent> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://niyatpayments.local',
          'X-Title': 'NIYAT Payments'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: ENV.OPENROUTER_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenRouter API');
      }

      const parsed = JSON.parse(content);
      return ParsedIntentSchema.parse(parsed);
    } finally {
      clearTimeout(timeout);
    }
  }
}
