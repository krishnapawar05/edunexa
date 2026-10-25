const { execSync } = require('child_process');

console.log('[Database Deploy] Starting database migration & schema check...');

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
      console.error('[Database Deploy] Fatal: Unable to synchronize database schema:', pushError);
      process.exit(1);
    }
  }
}

// Seed demo users and initial institutional records if needed
console.log('[Database Deploy] Seeding initial institutional records and demo accounts...');
try {
  run('npm run db:seed');
  console.log('[Database Deploy] Database seeding completed successfully.');
} catch (seedError) {
  console.warn('[Database Deploy] Seed warning (proceeding):', seedError.message);
}
