import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`====================================================`);
  console.log(`EduNexa ERP Core Engine running on port ${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`Health endpoint: http://localhost:${env.port}/api/health`);
  console.log(`Allowed client origin: ${env.clientOrigin}`);
  console.log(`====================================================`);
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
