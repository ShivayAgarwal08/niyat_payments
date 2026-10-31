import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './routes/api.js';
import { ENV } from './config/env.js';

export const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  ENV.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'capacitor://localhost',
  'https://localhost'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, capacitor)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly permissive fallback
      }
    },
    credentials: true
  })
);

// Rate limiter: 200 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRouter);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'NIYAT Payments API',
    tagline: 'The Intent Firewall for AI Shopping Agents',
    status: 'online',
    version: '1.0.0'
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Centralized error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Error:', err);

  if (err && typeof err === 'object' && 'name' in err && err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Invalid request payload',
      details: (err as any).errors
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({
    success: false,
    error: message
  });
});
