import { app } from './app.js';
import { env } from './config/env.js';
import { prisma, checkDatabaseConnection } from './config/db.js';
import { seedInstitutionalData } from './db/seedData.js';
import { initSocketIO } from './socket.js';

const HOST = '0.0.0.0';

async function bootstrap() {
  // Ensure institutional records and demo accounts are up-to-date
  try {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      console.log('[EduNexa Bootstrap] Database connected. Verifying institutional database records and demo accounts...');
      await seedInstitutionalData(prisma);
      console.log('[EduNexa Bootstrap] Institutional verification and seeding completed successfully.');
    } else {
      console.warn(`[EduNexa Bootstrap] Database notice: ${dbCheck.error}. Operating in synthetic resilience mode.`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[EduNexa Bootstrap] Auto-seed check notice: ${message}. Continuing server startup.`);
  }

  const server = app.listen(env.port, HOST, () => {
    console.log(`====================================================`);
    console.log(`EduNexa ERP Core Engine running on http://${HOST}:${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
    console.log(`Health endpoint: http://${HOST}:${env.port}/api/health`);
    console.log(`Allowed client origin: ${env.clientOrigin}`);
    console.log(`====================================================`);
  });

  // Attach Socket.IO Real-time Engine
  initSocketIO(server);

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[EduNexa Server Error]: Port ${env.port} is already in use by another process.`);
      console.error(`To free port ${env.port} on Windows, run:\n  Get-NetTCPConnection -LocalPort ${env.port} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
      process.exit(1);
    } else {
      console.error('[EduNexa Server Error]:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[EduNexa Bootstrap Fatal]:', err);
  process.exit(1);
});

