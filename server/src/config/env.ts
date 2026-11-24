import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Detect whether running in Railway cloud container environment
export const isRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_PUBLIC_DOMAIN ||
  process.env.RAILWAY_STATIC_URL ||
  process.env.RAILWAY_PROJECT_ID
);

// Helper to safely redact database credentials for logging
export function sanitizeDatabaseUrl(url?: string): string {
  if (!url) return 'none (unconfigured)';
  try {
    const parsed = new URL(url);
    const host = parsed.host || 'unknown-host';
    const db = parsed.pathname.replace(/^\//, '') || 'default';
    return `${parsed.protocol}//***:***@${host}/${db}`;
  } catch {
    return 'configured (redacted)';
  }
}

// Environment Loading Strategy:
// In local development: Load local .env files without overriding existing environment variables
// In Railway / Cloud: NEVER load local server/.env (which contains local development defaults)
if (!isRailway) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config();
} else {
  // In cloud containers, only read root .env if provisioned, never overriding platform env
  dotenv.config();
}

// Auto-detect and resolve DATABASE_URL from Railway's PostgreSQL service variables
let resolvedDbUrl = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) || '';

if (!resolvedDbUrl || resolvedDbUrl.includes('localhost') || resolvedDbUrl.includes('127.0.0.1')) {
  const cloudUrl =
    (process.env.DATABASE_PRIVATE_URL && process.env.DATABASE_PRIVATE_URL.trim()) ||
    (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim()) ||
    (process.env.DATABASE_PUBLIC_URL && process.env.DATABASE_PUBLIC_URL.trim()) ||
    (process.env.POSTGRESQL_URL && process.env.POSTGRESQL_URL.trim()) ||
    (process.env.PGHOST &&
      `postgresql://${process.env.PGUSER || 'postgres'}:${encodeURIComponent(process.env.PGPASSWORD || '')}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'railway'}`);
  
  if (cloudUrl) {
    resolvedDbUrl = cloudUrl;
  }
}

// In Railway, if database URL is missing or points to localhost, log actionable instructions
if (isRailway && (!resolvedDbUrl || resolvedDbUrl.includes('localhost') || resolvedDbUrl.includes('127.0.0.1'))) {
  console.error('\n⚠️ [DATABASE CONFIG ERROR]: Running on Railway but DATABASE_URL is missing or points to localhost/127.0.0.1.');
  console.error('👉 Action required: Open Railway Canvas -> click "edunexa" -> "Variables" -> add variable:');
  console.error('   DATABASE_URL = ${{Postgres.DATABASE_URL}} (or ${{Postgres-fteJ.DATABASE_URL}})\n');
}

if (!resolvedDbUrl && !isRailway) {
  resolvedDbUrl = 'postgresql://postgres:root@localhost:5432/edunexa_dev?schema=public';
}

// Explicitly set process.env.DATABASE_URL for PrismaClient runtime engine
if (resolvedDbUrl) {
  process.env.DATABASE_URL = resolvedDbUrl;
}

const envSchema = z.object({
  NODE_ENV: z.string().optional().transform((val) => {
    if (isRailway) return 'production';
    if (!val || !val.trim()) return 'production';
    const lower = val.trim().toLowerCase();
    if (lower === 'development' || lower === 'production' || lower === 'test') {
      return lower as 'development' | 'production' | 'test';
    }
    return 'production';
  }),
  PORT: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (typeof val === 'number') return val;
    const directEnv = process.env.PORT || process.env.SERVER_PORT;
    if (directEnv && !isNaN(parseInt(String(directEnv), 10))) {
      return parseInt(String(directEnv), 10);
    }
    if (val && !isNaN(parseInt(String(val), 10))) {
      return parseInt(String(val), 10);
    }
    return 5000;
  }),
  CLIENT_ORIGIN: z.string().optional().transform((val) => {
    if (val && val.trim() && val.trim() !== 'http://localhost:5173') return val.trim();
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    if (isRailway) return '*';
    return val && val.trim() ? val.trim() : 'http://localhost:5173';
  }),
  DATABASE_URL: z.string().optional().transform(() => resolvedDbUrl),
  JWT_ACCESS_SECRET: z.string().optional().transform((val) => {
    if (val && val.trim() && val.trim().length >= 32) return val.trim();
    return 'edunexa_production_grade_access_secret_1234567890_secure_key';
  }),
  JWT_REFRESH_SECRET: z.string().optional().transform((val) => {
    if (val && val.trim() && val.trim().length >= 32) return val.trim();
    return 'edunexa_production_grade_refresh_secret_1234567890_secure_key';
  }),
  AI_PROVIDER_API_KEY: z.string().optional().transform((val) => (val ? val.trim() : '')),
  AI_PROVIDER_MODEL: z.string().optional().transform((val) => (val && val.trim() ? val.trim() : 'gemini-2.0-flash')),
  LOG_LEVEL: z.string().optional().transform((val) => {
    if (!val || !val.trim()) return 'info';
    const lower = val.trim().toLowerCase();
    if (['debug', 'info', 'warn', 'error'].includes(lower)) {
      return lower as 'debug' | 'info' | 'warn' | 'error';
    }
    return 'info';
  }),
  RAZORPAY_KEY_ID: z.string().optional().transform((val) => (val && val.trim() ? val.trim() : 'rzp_test_placeholder')),
  RAZORPAY_KEY_SECRET: z.string().optional().transform((val) => (val && val.trim() ? val.trim() : 'rzp_test_secret_placeholder')),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().transform((val) => (val && val.trim() ? val.trim() : 'rzp_webhook_secret_placeholder')),
  RAZORPAY_MODE: z.string().optional().transform((val) => {
    if (val && val.trim().toLowerCase() === 'live') return 'live';
    return 'test';
  }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Environment variable validation failed:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Environment variable configuration error. Halting server boot.');
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  clientOrigin: string;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  aiProviderApiKey: string;
  aiProviderModel: string;
  logLevel: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  razorpayMode: 'test' | 'live';
}

export const env: AppConfig = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  clientOrigin: parsedEnv.data.CLIENT_ORIGIN,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  jwtAccessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
  aiProviderApiKey: parsedEnv.data.AI_PROVIDER_API_KEY,
  aiProviderModel: parsedEnv.data.AI_PROVIDER_MODEL,
  logLevel: parsedEnv.data.LOG_LEVEL,
  razorpayKeyId: parsedEnv.data.RAZORPAY_KEY_ID,
  razorpayKeySecret: parsedEnv.data.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: parsedEnv.data.RAZORPAY_WEBHOOK_SECRET,
  razorpayMode: parsedEnv.data.RAZORPAY_MODE,
};
