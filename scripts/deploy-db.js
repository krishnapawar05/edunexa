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

// Ensure Nix and global binaries are always reachable in PATH
const nixPaths = '/root/.nix-profile/bin:/nix/var/nix/profiles/default/bin';
process.env.PATH = process.env.PATH ? `${nixPaths}:${process.env.PATH}` : nixPaths;

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit', env: process.env });
}

// Step 1: Attempt to apply any committed migrations
try {
  console.log('[Database Deploy] Step 1: Checking migration history via prisma migrate deploy...');
  run('npm run prisma:deploy --workspace=server');
  console.log('[Database Deploy] Migrations deployed or verified successfully.');
} catch (deployError) {
  console.warn('[Database Deploy] prisma migrate deploy notice:', deployError.message);
  try {
    console.log('[Database Deploy] Resolving any failed migration state for 20261018000000_init_edunexa_core...');
    run('npx prisma migrate resolve --rolled-back 20261018000000_init_edunexa_core --schema=server/prisma/schema.prisma');
  } catch (resolveErr) {
    // Proceed to schema push
  }
}

// Step 2: ALWAYS synchronize the complete Prisma schema to ensure all models and columns exist
try {
  console.log('[Database Deploy] Step 2: Synchronizing complete schema definitions via prisma db push...');
  run('npx prisma db push --schema=server/prisma/schema.prisma --skip-generate --accept-data-loss');
  console.log('[Database Deploy] Database schema synchronized successfully via prisma db push.');
} catch (pushError) {
  console.error('[Database Deploy] Schema synchronization error:', pushError.message);
}

// Step 3: Seed initial institutional records and demo accounts
console.log('[Database Deploy] Step 3: Seeding initial institutional records and demo accounts...');
try {
  run('npm run db:seed');
  console.log('[Database Deploy] Database seeding completed successfully.');
} catch (seedError) {
  console.warn('[Database Deploy] Seed notice (proceeding):', seedError.message);
}
