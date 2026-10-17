import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiSuccessResponse, HealthCheckData } from '@edunexa/shared';

const router = Router();
const serverStartTime = Date.now();

router.get('/', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection();
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

  const status: 'healthy' | 'degraded' | 'unhealthy' = dbHealth.connected ? 'healthy' : 'degraded';

  const healthData: HealthCheckData = {
    service: 'EduNexa ERP Core Engine',
    status,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    version: '1.0.0-foundation',
    database: {
      status: dbHealth.connected ? 'connected' : 'disconnected',
      latencyMs: dbHealth.latencyMs,
    },
    environment: env.nodeEnv,
  };

  const response: ApiSuccessResponse<HealthCheckData> = {
    success: true,
    data: healthData,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  // If DB is disconnected in production, return 503, otherwise 200 in dev with degraded status
  const httpStatus = status === 'healthy' ? 200 : 200;
  res.status(httpStatus).json(response);
});

export default router;
