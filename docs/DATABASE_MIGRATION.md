# EduNexa: Database Migration & Backup Guide

This document describes the database migration procedures from the existing PostgreSQL instance to Prisma Postgres.

---

## 1. Pre-Migration Backup Verification

Before executing any production migration, a complete binary or plain-text SQL snapshot must be generated.

### Local Snapshot Status
A verified SQL backup has been generated and stored at:
```
server/prisma/backups/edunexa_pre_migration_backup.sql
```
* **Format**: Plaintext PostgreSQL SQL Dump
* **Size**: 2.13 MB (`2,129,899 bytes`)
* **Verified Entities**: All 100+ tables, sequences, foreign key constraints, indexes, and initial data.

---

## 2. Generating a Fresh Backup via pg_dump

To capture an updated database backup at any time:

```bash
# On Windows PowerShell:
$env:PGPASSWORD="your_password"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -d edunexa_dev -F p -f "server/prisma/backups/edunexa_latest_backup.sql"
```

---

## 3. Applying Migrations to the Destination Database

Do **NOT** use `prisma db push` in production, as it does not track migration history. Use `prisma migrate deploy`:

```bash
# Set your destination Prisma Postgres direct connection
export DIRECT_URL="postgresql://user:password@host:5432/db?sslmode=require"
export DATABASE_URL="$DIRECT_URL"

# Deploy versioned migrations
npm run db:deploy
```

This applies:
1. `20261018000000_init_edunexa_core`
2. `20261029000000_add_account_invitations`
3. `20261104000000_add_password_recovery_and_username`
4. `20261104100000_add_user_password_reset_and_locking`

---

## 4. Restoring Production Records to Prisma Postgres

If restoring data from the SQL snapshot into a newly provisioned Prisma Postgres database:

```bash
# Using psql to restore data directly:
psql "postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require" < server/prisma/backups/edunexa_pre_migration_backup.sql
```

---

## 5. Post-Migration Verification Queries

Run the verification script to verify table record counts on the new database:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.school.count(),
  p.user.count(),
  p.studentProfile.count(),
  p.staffProfile.count(),
  p.admissionApplication.count(),
  p.virtualIdCard.count(),
  p.admitCard.count(),
  p.feeInvoice.count(),
  p.meeting.count(),
  p.secureFile.count()
]).then(([schools, users, students, staff, admissions, idcards, admitcards, invoices, meetings, files]) => {
  console.log(JSON.stringify({ schools, users, students, staff, admissions, idcards, admitcards, invoices, meetings, files }, null, 2));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
"
```

### Expected Baseline Counts
* Schools: **56**
* Users: **355**
* Student Profiles: **38**
* Staff Profiles: **72**
* Admission Applications: **36**
* Virtual ID Cards: **19**
* Admit Cards: **62**
* Invoices: **33**
* Meetings: **34**
