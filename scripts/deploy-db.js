const { execSync } = require('child_process');

console.log('[Database Deploy] Starting database migration & schema check...');

function sanitizeDatabaseUrl(url) {
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

const isRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_PROJECT_ID ||
  process.env.RAILWAY_PUBLIC_DOMAIN ||
  process.env.RAILWAY_STATIC_URL
);

// Collect candidates in strict priority order
const candidates = [
  { key: 'DATABASE_URL', val: process.env.DATABASE_URL },
  { key: 'DATABASE_PRIVATE_URL', val: process.env.DATABASE_PRIVATE_URL },
  { key: 'DATABASE_PUBLIC_URL', val: process.env.DATABASE_PUBLIC_URL },
  { key: 'POSTGRES_URL', val: process.env.POSTGRES_URL },
  { key: 'POSTGRESQL_URL', val: process.env.POSTGRESQL_URL },
];

for (const [k, v] of Object.entries(process.env)) {
  if (
    (k.endsWith('_DATABASE_URL') || k.endsWith('_DATABASE_PRIVATE_URL') || k.endsWith('_POSTGRES_URL')) &&
    !candidates.some(c => c.key === k)
  ) {
    candidates.push({ key: k, val: v });
  }
}

if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
  const pass = process.env.PGPASSWORD ? encodeURIComponent(process.env.PGPASSWORD) : '';
  const auth = process.env.PGUSER + (pass ? `:${pass}` : '');
  const port = process.env.PGPORT || '5432';
  candidates.push({
    key: 'PG* variables',
    val: `postgresql://${auth}@${process.env.PGHOST}:${port}/${process.env.PGDATABASE}`,
  });
}

let resolvedDbUrl = '';
let unexpandedCandidate = '';
let localhostCandidate = '';

for (const { key, val } of candidates) {
  if (!val || typeof val !== 'string') continue;
  let clean = val.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  if (!clean) continue;

  if (clean.includes('${{') || clean.startsWith('${')) {
    unexpandedCandidate = clean;
    continue;
  }

  const isLocal = clean.includes('localhost') || clean.includes('127.0.0.1');
  if (isLocal) {
    localhostCandidate = clean;
    if (isRailway) {
      continue;
    }
  }

  if (clean.startsWith('postgresql://') || clean.startsWith('postgres://')) {
    resolvedDbUrl = clean;
    break;
  }
}

if (!resolvedDbUrl && !isRailway) {
  resolvedDbUrl = localhostCandidate || 'postgresql://postgres:root@localhost:5432/edunexa_dev?schema=public';
}

if (!resolvedDbUrl) {
  console.warn('\n======================================================================');
  console.warn('⚠️ [Database Deploy Warning]: PostgreSQL connection string could not be resolved on Railway.');
  if (unexpandedCandidate) {
    console.warn(`Reason: DATABASE_URL contains an UNEXPANDED Railway template: "${unexpandedCandidate}"`);
    console.warn('The service name in ${{...}} likely does not match your PostgreSQL service (e.g. Postgres-fteJ).');
  } else if (localhostCandidate) {
    console.warn('Reason: DATABASE_URL points to "localhost:5432", which is unreachable inside cloud containers.');
  } else {
    console.warn('Reason: DATABASE_URL is missing or empty in Railway service variables.');
  }
  console.warn('');
  console.warn('👉 HOW TO FIX IN RAILWAY (Takes 30 seconds):');
  console.warn('   1. In Railway Canvas, click the "edunexa" service box.');
  console.warn('   2. Click the "Variables" tab.');
  console.warn('   3. If DATABASE_URL exists, click Edit (or delete it).');
  console.warn('   4. Click "+ New Variable" -> Click "Add Reference".');
  console.warn('   5. Select your Postgres service (e.g. "Postgres-fteJ") -> Select "DATABASE_URL".');
  console.warn('      (Reference will look like: ${{Postgres-fteJ.DATABASE_URL}})');
  console.warn('   6. Click Deploy/Save.');
  console.warn('⚠️ Skipping pre-boot migrations to allow HTTP server to boot and serve application.');
  console.warn('======================================================================\n');
  process.exit(0);
}

process.env.DATABASE_URL = resolvedDbUrl;
console.log('[Database Deploy] Target database:', sanitizeDatabaseUrl(resolvedDbUrl));

// Ensure Nix and global binaries are always reachable in PATH
const nixPaths = '/root/.nix-profile/bin:/nix/var/nix/profiles/default/bin';
process.env.PATH = process.env.PATH ? `${nixPaths}:${process.env.PATH}` : nixPaths;

function run(cmd, extraEnv = {}) {
  return execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: resolvedDbUrl, ...extraEnv },
  });
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

// Step 2: ALWAYS synchronize the complete Prisma schema to ensure all models and columns exist safely
try {
  console.log('[Database Deploy] Step 2: Synchronizing complete schema definitions via prisma db push (safe mode)...');
  run('npx prisma db push --schema=server/prisma/schema.prisma --skip-generate');
  console.log('[Database Deploy] Database schema synchronized successfully via prisma db push.');
} catch (pushError) {
  console.error('[Database Deploy] Schema synchronization error:', pushError.message);
}

// Step 3: Seed initial institutional records and demo accounts idempotently
console.log('[Database Deploy] Step 3: Seeding initial institutional records and demo accounts...');
try {
  run('npm run db:seed');
  console.log('[Database Deploy] Database seeding completed successfully.');
} catch (seedError) {
  console.warn('[Database Deploy] Seed notice (proceeding):', seedError.message);
}
