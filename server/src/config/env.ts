import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppConfig {
  nodeEnv: string;
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
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/edunexa_dev?schema=public',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'edunexa_dev_access_secret_do_not_use_in_prod_12345',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'edunexa_dev_refresh_secret_do_not_use_in_prod_67890',
  aiProviderApiKey: process.env.AI_PROVIDER_API_KEY || '',
  aiProviderModel: process.env.AI_PROVIDER_MODEL || 'gemini-2.0-flash',
  logLevel: process.env.LOG_LEVEL || 'debug',
};

// Validate that in production, secrets are non-trivial
if (env.nodeEnv === 'production') {
  if (env.jwtAccessSecret.includes('do_not_use_in_prod')) {
    throw new Error('FATAL: JWT_ACCESS_SECRET must be set to a secure key in production!');
  }
}
