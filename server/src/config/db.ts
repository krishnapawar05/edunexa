import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

let lastCheck: { connected: boolean; timestamp: number; latencyMs?: number; error?: string } | null = null;
const CACHE_TTL_MS = 5000; // Cache connection status for 5 seconds to prevent stalling requests

export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const now = Date.now();
  if (lastCheck && now - lastCheck.timestamp < CACHE_TTL_MS) {
    return { connected: lastCheck.connected, latencyMs: lastCheck.latencyMs, error: lastCheck.error };
  }

  const start = Date.now();
  try {
    // 4000ms timeout for reliable connections across cloud containers and cold starts
    const timeoutPromise = new Promise<{ connected: false; error: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Database connection check timed out (4000ms)')), 4000)
    );

    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeoutPromise,
    ]);

    const result = { connected: true, latencyMs: Date.now() - start };
    lastCheck = { ...result, timestamp: now };
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    const result = { connected: false, error: errorMsg };
    lastCheck = { ...result, timestamp: now };
    return result;
  }
}
