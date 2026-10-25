const { execSync } = require('child_process');

console.log('[Database Deploy] Starting database migration & schema check...');

// Auto-detect and resolve DATABASE_URL if empty or missing
let resolvedDbUrl = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) || '';

if (!resolvedDbUrl) {
  resolvedDbUrl =
    (process.env.DATABASE_PRIVATE_URL && process.env.DATABASE_PRIVATE_URL.trim()) ||
    (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim()) ||
    (process.env.DATABASE_PUBLIC_URL && process.env.DATABASE_PUBLIC_URL.trim()) ||
    (process.env.PGHOST &&
      `postgresql://${process.env.PGUSER || 'postgres'}:${encodeURIComponent(process.env.PGPASSWORD || '')}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'railway'}`) ||
    '';
}

if (!resolvedDbUrl) {
  console.warn('⚠️ [Database Deploy Warning]: DATABASE_URL is empty or not set in Railway service variables.');
  console.warn('⚠️ Please add DATABASE_URL in the edunexa Variables tab (e.g. ${{Postgres.DATABASE_URL}}).');
  console.warn('⚠️ Skipping pre-boot migrations to prevent fatal container restart loop.');
  process.exit(0);
}

process.env.DATABASE_URL = resolvedDbUrl;

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit', env: process.env });
}

try {
  console.log('[Database Deploy] Executing prisma migrate deploy...');
  run('npm run prisma:deploy --workspace=server');
  console.log('[Database Deploy] Migrations deployed successfully.');
} catch (deployError) {
  console.warn('[Database Deploy] prisma migrate deploy encountered an error. Attempting automated recovery...');

  try {
    console.log('[Database Deploy] Resolving any failed migration state for 20261018000000_init_edunexa_core...');
    run('npx prisma migrate resolve --rolled-back 20261018000000_init_edunexa_core --schema=server/prisma/schema.prisma');
    console.log('[Database Deploy] Re-running prisma migrate deploy with clean UTF-8 migration...');
    run('npm run prisma:deploy --workspace=server');
    console.log('[Database Deploy] Migrations applied successfully after recovery.');
  } catch (recoveryError) {
    console.warn('[Database Deploy] Migration deploy recovery failed. Falling back to prisma db push to ensure schema synchronization...');
    try {
      run('npx prisma db push --schema=server/prisma/schema.prisma --skip-generate');
      console.log('[Database Deploy] Schema synchronized successfully via prisma db push.');
    } catch (pushError) {
      console.error('[Database Deploy] Schema synchronization error:', pushError.message);
      // Exit gracefully so the web container still boots
      process.exit(0);
    }
  }
}

// Seed demo users and initial institutional records if needed
console.log('[Database Deploy] Seeding initial institutional records and demo accounts...');
try {
  run('npm run db:seed');
  console.log('[Database Deploy] Database seeding completed successfully.');
} catch (seedError) {
  console.warn('[Database Deploy] Seed notice (proceeding):', seedError.message);
}
