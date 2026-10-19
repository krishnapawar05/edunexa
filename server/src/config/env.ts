import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from process.cwd() or relative server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.union([z.string(), z.number()]).default('5000').transform((val) => (typeof val === 'number' ? val : parseInt(val, 10))),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    'postgresql://postgres:postgres@localhost:5432/edunexa_dev?schema=public'
  ),
  JWT_ACCESS_SECRET: z.string().default('edunexa_production_grade_access_secret_1234567890_secure_key'),
  JWT_REFRESH_SECRET: z.string().default('edunexa_production_grade_refresh_secret_1234567890_secure_key'),
  AI_PROVIDER_API_KEY: z.string().optional().default(''),
  AI_PROVIDER_MODEL: z.string().default('gemini-2.0-flash'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
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
