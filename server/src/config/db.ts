import { PrismaClient } from '@prisma/client';
import { env, isRailway } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: env.databaseUrl ? { db: { url: env.databaseUrl } } : undefined,
    log: env.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.nodeEnv !== 'production') {
  global.prisma = prisma;
}

let lastCheck: { connected: boolean; timestamp: number; latencyMs?: number; error?: string } | null = null;
let lastLogTimestamp = 0;
const CACHE_TTL_MS = 10000; // Cache connection status for 10 seconds to prevent query spam
const LOG_RATE_LIMIT_MS = 60000; // Rate limit disconnect log to once every 60 seconds

export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  // If no database URL is configured, or running on Railway with a localhost address, return immediately without querying!
  if (!env.databaseUrl || (isRailway && (env.databaseUrl.includes('localhost') || env.databaseUrl.includes('127.0.0.1')))) {
    return {
      connected: false,
      error: 'PostgreSQL database not configured in Railway service variables',
    };
  }

  const now = Date.now();
  if (lastCheck && now - lastCheck.timestamp < CACHE_TTL_MS) {
    return { connected: lastCheck.connected, latencyMs: lastCheck.latencyMs, error: lastCheck.error };
  }

  const start = Date.now();
  try {
    const timeoutPromise = new Promise<{ connected: false; error: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Database connection check timed out (3000ms)')), 3000)
    );

    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeoutPromise,
    ]);

    const result = { connected: true, latencyMs: Date.now() - start };
    lastCheck = { ...result, timestamp: now };
    return result;
  } catch (err: unknown) {
    const rawError = err instanceof Error ? err.message : 'Database connection error';
    // Clean single-line summary without stack trace
    const errorMsg = rawError.split('\n')[0].replace(/Invalid\s+`.*?`\s+invocation:?/, '').trim() || 'Database connection error';
    const result = { connected: false, error: errorMsg };
    lastCheck = { ...result, timestamp: now };

    // Rate-limit console warnings to at most once per minute
    if (now - lastLogTimestamp > LOG_RATE_LIMIT_MS) {
      lastLogTimestamp = now;
      console.warn(`[Database Health Check]: Database disconnected (${errorMsg}). Rate-limiting notice to 1/min.`);
    }

    return result;
  }
}
