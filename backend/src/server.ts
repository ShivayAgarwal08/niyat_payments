import { app } from './app.js';
import { ENV } from './config/env.js';

const PORT = ENV.PORT || 3001;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`=========================================`);
  console.log(`🛡️  NIYAT Payments Engine Server`);
  console.log(`🛡️  Tagline: The Intent Firewall for AI Shopping Agents`);
  console.log(`🛡️  Listening on http://${HOST}:${PORT}`);
  console.log(`🛡️  Environment: ${ENV.NODE_ENV}`);
  console.log(`=========================================`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
