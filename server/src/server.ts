import { app } from './app.js';
import { env, sanitizeDatabaseUrl, isRailway, dbResolution } from './config/env.js';
import { prisma, checkDatabaseConnection } from './config/db.js';
import { seedInstitutionalData } from './db/seedData.js';
import { initSocketIO } from './socket.js';

const HOST = '0.0.0.0';

async function bootstrap() {
  // 1. Bind and start HTTP server IMMEDIATELY so Railway detects port binding within milliseconds
  const server = app.listen(env.port, HOST, () => {
    console.log(`====================================================`);
    console.log(`EduNexa ERP Core Engine running on http://${HOST}:${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
    console.log(`Health endpoint: http://${HOST}:${env.port}/api/health`);
    console.log(`Allowed client origin: ${env.clientOrigin}`);
    console.log(`Database target: ${sanitizeDatabaseUrl(env.databaseUrl)}`);
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

  // 2. Non-blocking background database verification & idempotent seeding
  (async () => {
    // If on Railway and database configuration is invalid or missing, do NOT run Prisma queries
    if (isRailway && !dbResolution.isValid) {
      console.log('[EduNexa Bootstrap] Resilient server running. Waiting for Railway PostgreSQL service configuration.');
      return;
    }

    // Wait for database readiness (up to 5 attempts, 3s backoff)
    let ready = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const dbCheck = await checkDatabaseConnection();
        if (dbCheck.connected) {
          ready = true;
          break;
        }
      } catch {
        // continue
      }
      if (attempt < 5) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    if (!ready) {
      console.warn('[EduNexa Bootstrap] Database not ready after startup retry window. Serving in resilient mode.');
      return;
    }

    try {
      const superAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@edunexa.org' },
      });

      if (!superAdmin) {
        console.log('[EduNexa Bootstrap] Fresh or unseeded database detected. Auto-seeding 9 PRD demo accounts and institutional records...');
        await seedInstitutionalData(prisma);
        console.log('[EduNexa Bootstrap] ✅ Institutional seeding completed successfully.');
      } else {
        console.log('[EduNexa Bootstrap] ✅ Database connected and verified with existing institutional accounts.');
      }
    } catch (err: unknown) {
      const rawError = err instanceof Error ? err.message : String(err);
      const cleanError = rawError.split('\n')[0].replace(/Invalid\s+`.*?`\s+invocation:?/, '').trim();
      console.warn(`[EduNexa Bootstrap] Background verification notice: ${cleanError}. Server operating.`);
    }
  })();

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
