import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { seedInstitutionalData } from './db/seedData.js';

const HOST = '0.0.0.0';

async function bootstrap() {
  // Check if database needs initial seeding
  try {
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@edunexa.org' },
    });

    if (!superAdmin) {
      console.log('[EduNexa Bootstrap] Fresh or unseeded database detected. Auto-seeding demo accounts and institutional records...');
      await seedInstitutionalData(prisma);
      console.log('[EduNexa Bootstrap] Institutional seeding completed successfully.');
    } else {
      console.log('[EduNexa Bootstrap] Database verified with existing institutional accounts.');
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

