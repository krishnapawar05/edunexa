import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import superAdminRouter from './modules/superadmin/tenant.routes.js';
import securityTestRouter from './modules/test-fixtures/security-test.routes.js';
import coreRouter from './modules/core/core.routes.js';

export function createApp(): express.Application {
  const app = express();

  // Security headers via Helmet
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  // Dynamic Cross-Origin Resource Sharing (Permissive for Railway domains and custom frontends)
  app.use(cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);

      const allowed = [
        env.clientOrigin,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:3000',
      ];

      if (
        allowed.includes(requestOrigin) ||
        requestOrigin.endsWith('.railway.app') ||
        requestOrigin.endsWith('.up.railway.app') ||
        env.clientOrigin === '*'
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-School-Slug', 'x-audit-reason'],
  }));

  // Body Parsing
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Structured Logging
  app.use(requestLogger);

  // Health and Diagnostic Routes
  app.use('/api/health', healthRouter);

  // Modular API Endpoints (v1)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/superadmin', superAdminRouter);
  app.use('/api/v1/core', coreRouter);
  app.use('/api/v1/security-test', securityTestRouter);

  // Full-Stack Monolith Serving: Serve compiled frontend SPA if client/dist exists
  const clientDistPath = path.resolve(process.cwd(), 'client/dist');
  const fallbackDistPath = path.resolve(__dirname, '../../client/dist');
  const activeDistPath = fs.existsSync(clientDistPath) ? clientDistPath : (fs.existsSync(fallbackDistPath) ? fallbackDistPath : null);

  if (activeDistPath) {
    app.use(express.static(activeDistPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(activeDistPath, 'index.html'));
    });
  }

  // Catch-all for undefined API endpoints
  app.all('/api/*', (req, res, next) => {
    next(new AppError(`API endpoint '${req.originalUrl}' not found on EduNexa Server`, 404, 'NOT_FOUND'));
  });

  // Catch-all for undefined non-API routes (when client/dist is not present)
  app.use('*', (req, res, next) => {
    next(new AppError(`Endpoint '${req.originalUrl}' not found on EduNexa Server`, 404, 'NOT_FOUND'));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
