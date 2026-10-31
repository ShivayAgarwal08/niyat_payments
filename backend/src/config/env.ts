import dotenv from 'dotenv';
import { z } from 'zod';
import crypto from 'crypto';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3001'),
  DATABASE_URL: z.string().optional().default(''),
  DIRECT_URL: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct'),
  CONTRACT_SIGNING_SECRET: z.string().optional().default(''),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.CONTRACT_SIGNING_SECRET || data.CONTRACT_SIGNING_SECRET.trim().length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CRITICAL SECURITY: CONTRACT_SIGNING_SECRET must be explicitly set and at least 32 characters long in production mode.',
        path: ['CONTRACT_SIGNING_SECRET']
      });
    }
  }
});

const parsed = envSchema.parse(process.env);

// In non-production, generate a secure random 32-byte hex if empty
const signingSecret = parsed.CONTRACT_SIGNING_SECRET && parsed.CONTRACT_SIGNING_SECRET.trim().length >= 32
  ? parsed.CONTRACT_SIGNING_SECRET.trim()
  : crypto.randomBytes(32).toString('hex');

export const ENV = {
  ...parsed,
  CONTRACT_SIGNING_SECRET: signingSecret
};
