import { ENV } from '../../config/env.js';
import { ParsedIntent, ParsedIntentSchema } from '../../types/index.js';
import { IAIProvider } from '../types.js';

const SYSTEM_INSTRUCTION = `You are NIYAT's Intent Extraction Engine.
Extract the structured shopping requirements from the user's shopping request.
Output strictly valid JSON matching this schema:
{
  "productCategory": string (e.g., "Milk", "Laptop", "Smartphone", "Shoes", "Groceries"),
  "productName": string,
  "preferredBrand": string,
  "variantOrModel": string,
  "quantity": number,
  "unit": string (e.g., "Litre", "Unit", "Kg", "Pair"),
  "maxBudgetPaise": number (total budget in integer paise, e.g. ₹150 = 15000),
  "mandatoryRequirements": string[],
  "optionalPreferences": string[],
  "permittedSubstitutions": string[],
  "confidence": number (between 0.0 and 1.0),
  "ambiguityQuestion": string | null
}
Never invent fake brands if user specifies one. Integer paise only for currency (1 Rupee = 100 paise).`;

export class GeminiProvider implements IAIProvider {
  name: 'gemini' = 'gemini';

  isConfigured(): boolean {
    return Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0);
  }

  async parseIntent(userPrompt: string): Promise<ParsedIntent> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${ENV.GEMINI_MODEL}:generateContent?key=${ENV.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nUser request: "${userPrompt}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini API');
      }

      const parsedJson = JSON.parse(rawText);
      return ParsedIntentSchema.parse(parsedJson);
    } finally {
      clearTimeout(timeout);
    }
  }
}
