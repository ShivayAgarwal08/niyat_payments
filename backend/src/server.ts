import { app } from './app.js';
import { ENV } from './config/env.js';
import { repository } from './db/repository.js';

const PORT = ENV.PORT || 3001;
const HOST = '0.0.0.0';

async function bootstrap() {
  // In production, verify PostgreSQL connectivity before listening
  if (ENV.NODE_ENV === 'production') {
    console.log('🛡️  Verifying PostgreSQL database connection for production...');
    const health = await repository.checkHealth();
    if (!health.ok) {
      console.error('❌ FATAL: PostgreSQL connection check failed in production mode.');
      console.error('❌ Error details:', health.error);
      console.error('❌ Startup aborted safely: In-memory fallback is strictly forbidden in production.');
      process.exit(1);
    }
    console.log('✅ PostgreSQL database connection verified successfully.');
  }

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
    server.close(async () => {
      console.log('HTTP server closed.');
      await repository.disconnect();
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
