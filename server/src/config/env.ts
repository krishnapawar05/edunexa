import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from server/.env if present, otherwise fallback to process.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/edunexa_dev?schema=public'),
  JWT_ACCESS_SECRET: z.string().default('edunexa_dev_access_secret_do_not_use_in_prod_12345'),
  JWT_REFRESH_SECRET: z.string().default('edunexa_dev_refresh_secret_do_not_use_in_prod_67890'),
  AI_PROVIDER_API_KEY: z.string().optional().default(''),
  AI_PROVIDER_MODEL: z.string().default('gemini-2.0-flash'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      return (
        !data.JWT_ACCESS_SECRET.includes('do_not_use_in_prod') &&
        data.JWT_ACCESS_SECRET.length >= 32
      );
    }
    return true;
  },
  {
    message: 'FATAL: In production, JWT_ACCESS_SECRET must be at least 32 characters and cannot use default dev secret.',
    path: ['JWT_ACCESS_SECRET'],
  }
);

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
