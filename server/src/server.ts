import { app } from './app.js';
import { env } from './config/env.js';

const HOST = '0.0.0.0';

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
