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

export interface DatabaseResolutionResult {
  url: string;
  source: string;
  isValid: boolean;
  diagnosticReason: 'valid' | 'missing' | 'empty' | 'unexpanded_template' | 'localhost';
  rawCandidate?: string;
}

/**
 * Robust PostgreSQL Connection String Resolver for Railway and Local Environments
 */
export function resolveDatabaseUrl(envVars: Record<string, string | undefined> = process.env): DatabaseResolutionResult {
  const isCloud = Boolean(
    envVars.RAILWAY_ENVIRONMENT ||
    envVars.RAILWAY_PROJECT_ID ||
    envVars.RAILWAY_PUBLIC_DOMAIN ||
    envVars.RAILWAY_STATIC_URL
  );

  // Check candidate variables in strict priority order
  const candidates: { key: string; val: string | undefined }[] = [
    { key: 'DATABASE_URL', val: envVars.DATABASE_URL },
    { key: 'DATABASE_PRIVATE_URL', val: envVars.DATABASE_PRIVATE_URL },
    { key: 'DATABASE_PUBLIC_URL', val: envVars.DATABASE_PUBLIC_URL },
    { key: 'POSTGRES_URL', val: envVars.POSTGRES_URL },
    { key: 'POSTGRESQL_URL', val: envVars.POSTGRESQL_URL },
  ];

  // Also check if any key ends with DATABASE_URL or POSTGRES_URL (e.g. POSTGRES_FTEJ_DATABASE_URL)
  for (const [k, v] of Object.entries(envVars)) {
    if (
      (k.endsWith('_DATABASE_URL') || k.endsWith('_DATABASE_PRIVATE_URL') || k.endsWith('_POSTGRES_URL')) &&
      !candidates.some(c => c.key === k)
    ) {
      candidates.push({ key: k, val: v });
    }
  }

  // Construct from PG* variables if available
  if (envVars.PGHOST && envVars.PGUSER && envVars.PGDATABASE) {
    const pass = envVars.PGPASSWORD ? encodeURIComponent(envVars.PGPASSWORD) : '';
    const auth = envVars.PGUSER + (pass ? `:${pass}` : '');
    const port = envVars.PGPORT || '5432';
    candidates.push({
      key: 'PG* variables',
      val: `postgresql://${auth}@${envVars.PGHOST}:${port}/${envVars.PGDATABASE}`,
    });
  }

  let unexpandedCandidate: string | undefined;
  let localhostCandidate: string | undefined;

  for (const { key, val } of candidates) {
    if (!val || typeof val !== 'string') continue;
    let clean = val.trim();
    // Strip wrapping quotes e.g. "..." or '...'
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1).trim();
    }
    if (!clean) continue;

    // Check if unexpanded Railway template syntax: ${{...}}
    if (clean.includes('${{') || clean.startsWith('${')) {
      unexpandedCandidate = clean;
      continue;
    }

    // Check if points to localhost / 127.0.0.1
    const isLocal = clean.includes('localhost') || clean.includes('127.0.0.1');
    if (isLocal) {
      localhostCandidate = clean;
      if (isCloud) {
        // In cloud, skip localhost unless no cloud URL exists
        continue;
      }
    }

    // Must start with postgresql:// or postgres://
    if (clean.startsWith('postgresql://') || clean.startsWith('postgres://')) {
      return {
        url: clean,
        source: key,
        isValid: true,
        diagnosticReason: 'valid',
      };
    }
  }

  // If in local development and found a localhost URL:
  if (!isCloud && localhostCandidate) {
    return {
      url: localhostCandidate,
      source: 'localhost_env',
      isValid: true,
      diagnosticReason: 'localhost',
    };
  }

  // In local development with no DB URL at all, default to local dev DB
  if (!isCloud) {
    return {
      url: 'postgresql://postgres:root@localhost:5432/edunexa_dev?schema=public',
      source: 'local_default_fallback',
      isValid: true,
      diagnosticReason: 'localhost',
    };
  }

  // Cloud failure diagnostic reasons
  let diagnosticReason: 'missing' | 'empty' | 'unexpanded_template' | 'localhost' = 'missing';
  let rawCandidate = '';

  if (unexpandedCandidate) {
    diagnosticReason = 'unexpanded_template';
    rawCandidate = unexpandedCandidate;
  } else if (localhostCandidate) {
    diagnosticReason = 'localhost';
    rawCandidate = localhostCandidate;
  } else if (envVars.DATABASE_URL !== undefined && envVars.DATABASE_URL.trim() === '') {
    diagnosticReason = 'empty';
    rawCandidate = '""';
  }

  return {
    url: '',
    source: 'none',
    isValid: false,
    diagnosticReason,
    rawCandidate,
  };
}

export const dbResolution = resolveDatabaseUrl(process.env);

// Prominent diagnostics when running on Railway with database configuration issues
if (isRailway && !dbResolution.isValid) {
  console.error('\n======================================================================');
  console.error('❌ [DATABASE CONFIGURATION ERROR ON RAILWAY]');
  if (dbResolution.diagnosticReason === 'unexpanded_template') {
    console.error(`Reason: DATABASE_URL is an UNEXPANDED Railway template: "${dbResolution.rawCandidate}"`);
    console.error('This happens if the service name in ${{...}} does not match your PostgreSQL service name (e.g. Postgres-fteJ).');
  } else if (dbResolution.diagnosticReason === 'localhost') {
    console.error('Reason: DATABASE_URL points to "localhost:5432", which cannot be reached inside a cloud container.');
  } else if (dbResolution.diagnosticReason === 'empty') {
    console.error('Reason: DATABASE_URL is set as an EMPTY string in Railway Variables.');
  } else {
    console.error('Reason: DATABASE_URL is MISSING from Railway service variables.');
  }
  console.error('');
  console.error('👉 HOW TO FIX IN RAILWAY (Takes 30 seconds):');
  console.error('   1. In Railway Canvas, click the "edunexa" service box.');
  console.error('   2. Click the "Variables" tab.');
  console.error('   3. If DATABASE_URL exists, click Edit (or delete it).');
  console.error('   4. Click "+ New Variable" -> Click "Add Reference".');
  console.error('   5. Select your Postgres service (e.g. "Postgres-fteJ") -> Select "DATABASE_URL".');
  console.error('      (It will look like: ${{Postgres-fteJ.DATABASE_URL}})');
  console.error('   6. Click Deploy/Save.');
  console.error('======================================================================\n');
}

// Explicitly set process.env.DATABASE_URL for PrismaClient runtime engine if valid
if (dbResolution.isValid) {
  process.env.DATABASE_URL = dbResolution.url;
} else if (isRailway) {
  // Clear process.env.DATABASE_URL on Railway if invalid so Prisma does not default to localhost:5432
  process.env.DATABASE_URL = '';
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
  DATABASE_URL: z.string().optional().transform(() => dbResolution.url),
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
