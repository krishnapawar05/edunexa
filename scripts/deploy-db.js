const { execSync } = require('child_process');

console.log('[Database Deploy] Starting database migration & schema check...');

// Auto-detect and resolve direct connection URL for Prisma migrations
let resolvedDirectUrl =
  (process.env.DIRECT_URL && process.env.DIRECT_URL.trim()) ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) ||
  (process.env.POSTGRES_URL_NON_POOLING && process.env.POSTGRES_URL_NON_POOLING.trim()) ||
  (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim()) ||
  '';

if (!resolvedDirectUrl) {
  console.warn('⚠️ [Database Deploy Warning]: DATABASE_URL / DIRECT_URL is empty or not set in environment variables.');
  console.warn('⚠️ Please configure DATABASE_URL in your Vercel project environment settings.');
  console.warn('⚠️ Skipping pre-flight migrations.');
  process.exit(0);
}

// Set DIRECT_URL and DATABASE_URL if not present
process.env.DIRECT_URL = resolvedDirectUrl;
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDirectUrl;
}

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit', env: process.env });
}

// Step 1: Attempt to apply committed Prisma migrations
try {
  console.log('[Database Deploy] Step 1: Checking migration history via prisma migrate deploy...');
  run('npm run prisma:deploy --workspace=server');
  console.log('[Database Deploy] Migrations deployed or verified successfully.');
} catch (deployError) {
  console.warn('[Database Deploy] Notice on prisma migrate deploy:', deployError.message);
}

// Step 2: Seed initial institutional records and demo accounts if database is unseeded
console.log('[Database Deploy] Step 2: Verifying institutional records and seeding if needed...');
try {
  run('npm run db:seed');
  console.log('[Database Deploy] Database verification completed successfully.');
} catch (seedError) {
  console.warn('[Database Deploy] Seed notice (proceeding):', seedError.message);
}
