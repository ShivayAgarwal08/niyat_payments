import { ENV } from '../../config/env.js';
import { ParsedIntent, ParsedIntentSchema } from '../../types/index.js';
import { IAIProvider } from '../types.js';

const SYSTEM_PROMPT = `You are NIYAT's Intent Extraction Engine.
Extract the structured shopping requirements from the user's shopping request.
Respond with pure JSON object only:
{
  "productCategory": string (e.g. Milk, Laptop, Smartphone, Shoes, Groceries),
  "productName": string,
  "preferredBrand": string,
  "variantOrModel": string,
  "quantity": number,
  "unit": string,
  "maxBudgetPaise": number (total budget in paise, e.g. ₹150 is 15000),
  "mandatoryRequirements": string[],
  "optionalPreferences": string[],
  "permittedSubstitutions": string[],
  "confidence": number,
  "ambiguityQuestion": string | null
}`;

export class GroqProvider implements IAIProvider {
  name: 'groq' = 'groq';

  isConfigured(): boolean {
    return Boolean(ENV.GROQ_API_KEY && ENV.GROQ_API_KEY.trim().length > 0);
  }

  async parseIntent(userPrompt: string): Promise<ParsedIntent> {
    if (!this.isConfigured()) {
      throw new Error('Groq API key is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.GROQ_API_KEY}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: ENV.GROQ_MODEL,
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
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Groq API');
      }

      const parsed = JSON.parse(content);
      return ParsedIntentSchema.parse(parsed);
    } finally {
      clearTimeout(timeout);
    }
  }
}
