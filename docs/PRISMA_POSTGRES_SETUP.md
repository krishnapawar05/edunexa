# EduNexa: Prisma Postgres Setup & Configuration

This guide details how Prisma Postgres is configured, provisioned, and connected for EduNexa.

---

## 1. What is Prisma Postgres?

Prisma Postgres is a fully managed PostgreSQL database provided directly by Prisma, featuring built-in connection pooling, edge caching, and serverless compatibility.

---

## 2. Provisioning Prisma Postgres via Vercel Integration

1. Go to the [Vercel Marketplace -> Prisma Postgres](https://vercel.com/integrations/prisma-postgres) or use the [Prisma Data Platform Console](https://console.prisma.io/).
2. Select your Vercel team and choose the `edunexa` project.
3. Choose the geographic region closest to your Vercel deployment (e.g. `iad1` Washington D.C., `bom1` Mumbai, `fra1` Frankfurt).
4. Once created, the integration automatically provisions two connection strings:
   * **`DATABASE_URL` / `DATABASE_URL_POOLED`**: Connection-pooled endpoint with pgbouncer/accelerate enabled.
   * **`DIRECT_URL` / `POSTGRES_URL_NON_POOLING`**: Direct unpooled connection to port 5432.

---

## 3. Schema Configuration (`schema.prisma`)

In `server/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

* **`url`**: Used by `PrismaClient` in application code (`server/src/config/db.ts`). Connects via pooled connection, allowing hundreds of concurrent serverless lambda instances without exhausting database connections.
* **`directUrl`**: Used exclusively by Prisma CLI migration commands (`prisma migrate dev`, `prisma migrate deploy`, `prisma db push`). Direct connection is required because PostgreSQL migrations require advisory locks and DDL statements that pooled connections cannot handle.

---

## 4. Connection Rules for Development & Production

### Development (`server/.env`)
In local offline development, both `DATABASE_URL` and `DIRECT_URL` point to your local PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/edunexa_dev?schema=public"
DIRECT_URL="postgresql://postgres:root@localhost:5432/edunexa_dev?schema=public"
```

### Production (Vercel Project Settings)
In production on Vercel:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB]?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require"
```

---

## 5. Serverless Client Singleton

Serverless platforms instantiate function handlers on demand. In `server/src/config/db.ts`:

```ts
import { PrismaClient } from '@prisma/client';

export const prisma: PrismaClient =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalThis.prisma = prisma;
```

This guarantees that within the lifecycle of a warmed lambda instance, database connections are reused rather than re-instantiated on every HTTP request.
