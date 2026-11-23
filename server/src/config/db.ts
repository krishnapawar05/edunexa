import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Ensure environment variables are loaded across workspace contexts
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

export function resolveDatabaseUrl(): { url: string; isConfigured: boolean } {
  let url = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) || '';
  if (!url) {
    url =
      (process.env.DATABASE_PRIVATE_URL && process.env.DATABASE_PRIVATE_URL.trim()) ||
      (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim()) ||
      (process.env.DATABASE_PUBLIC_URL && process.env.DATABASE_PUBLIC_URL.trim()) ||
      (process.env.POSTGRESQL_URL && process.env.POSTGRESQL_URL.trim()) ||
      (process.env.POSTGRES_PRISMA_URL && process.env.POSTGRES_PRISMA_URL.trim()) ||
      (process.env.POSTGRES_URL_NON_POOLING && process.env.POSTGRES_URL_NON_POOLING.trim()) ||
      (process.env.PGHOST &&
        `postgresql://${process.env.PGUSER || 'postgres'}:${encodeURIComponent(process.env.PGPASSWORD || '')}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'railway'}`) ||
      '';
  }

  const isConfigured = Boolean(url && !url.includes('edunexa_unconfigured'));

  if (!url) {
    // Fallback placeholder URL prevents PrismaClient from crashing on initialization
    url = 'postgresql://postgres:root@127.0.0.1:5432/edunexa_unconfigured?schema=public';
  }

  process.env.DATABASE_URL = url;
  return { url, isConfigured };
}

const dbInfo = resolveDatabaseUrl();

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbInfo.url,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

let lastCheck: { connected: boolean; timestamp: number; latencyMs?: number; error?: string } | null = null;
const CACHE_TTL_MS = 5000; // Cache connection status for 5 seconds to prevent stalling requests

export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const currentDbInfo = resolveDatabaseUrl();
  if (!currentDbInfo.isConfigured) {
    return {
      connected: false,
      error: 'DATABASE_URL is not configured in Railway variables. Add reference: DATABASE_URL = ${{Postgres.DATABASE_URL}}',
    };
  }

  const now = Date.now();
  if (lastCheck && now - lastCheck.timestamp < CACHE_TTL_MS) {
    return { connected: lastCheck.connected, latencyMs: lastCheck.latencyMs, error: lastCheck.error };
  }

  const start = Date.now();
  try {
    // 3000ms timeout for reliable connections across cloud containers and cold starts
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
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    const result = { connected: false, error: errorMsg };
    lastCheck = { ...result, timestamp: now };
    return result;
  }
}
