import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import healthRouter from './routes/health.routes.js';

export function createApp(): express.Application {
  const app = express();

  // Security headers via Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Allows flexible client testing in dev
  }));

  // Cross-Origin Resource Sharing
  app.use(cors({
    origin: [env.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-School-Slug'],
  }));

  // Body Parsing
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Structured Logging
  app.use(requestLogger);

  // Health and Diagnostic Routes
  app.use('/api/health', healthRouter);

  // Catch-all for undefined endpoints
  app.use('*', (req, res, next) => {
    next(new AppError(`Endpoint '${req.originalUrl}' not found on EduNexa Server`, 404, 'NOT_FOUND'));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
