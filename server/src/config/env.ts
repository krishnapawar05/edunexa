import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from process.cwd() or relative server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().optional().transform((val) => {
    if (!val || !val.trim()) return 'production';
    const lower = val.trim().toLowerCase();
    if (lower === 'development' || lower === 'production' || lower === 'test') {
      return lower as 'development' | 'production' | 'test';
    }
    return 'production';
  }),
  PORT: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (typeof val === 'number') return val;
    if (!val || !val.trim()) return 5000;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 5000 : parsed;
  }),
  CLIENT_ORIGIN: z.string().optional().transform((val) => (!val || !val.trim() ? '*' : val.trim())),
  DATABASE_URL: z.string().optional().transform((val) => {
    if (val && val.trim()) return val.trim();
    return (
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_PUBLIC_URL ||
      'postgresql://postgres:postgres@localhost:5432/edunexa_dev?schema=public'
    );
  }),
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
};
