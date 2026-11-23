# EduNexa: Railway to Vercel Migration Overview

**Version**: 1.0.0  
**Target Platform**: Vercel (Frontend & Serverless Functions)  
**Database**: Prisma Postgres (Connection-pooled PostgreSQL)  
**File Storage**: Vercel Blob (`@vercel/blob`)  
**ORM**: Prisma ORM 6.4+  

---

## 1. Architectural Changes

The EduNexa ERP has been migrated from a single-container Railway Nixpacks deployment to a unified Vercel monorepo architecture:

1. **Frontend Hosting**:
   * React 19 + Vite 6 SPA compiled to `client/dist`.
   * Vercel serves the static assets at the global edge network with automatic client-side SPA routing (`/index.html` fallback).
2. **Backend API (Vercel Functions)**:
   * Express 4 application exposed as a Vercel Serverless Function via `api/index.ts`.
   * Server startup (`server.listen()`) is completely decoupled from the Express app instance (`app.ts`), preventing port binding errors in serverless execution.
   * All REST endpoints (`/api/v1/*`), health checks (`/api/health`), and dynamic robots/sitemap routes are preserved with zero route changes.
3. **Database (Prisma Postgres)**:
   * Replaced Railway PostgreSQL assumptions with standard managed Prisma Postgres.
   * `server/prisma/schema.prisma` now configures both `url` (pooled runtime queries via `DATABASE_URL` / `DATABASE_URL_POOLED`) and `directUrl` (direct connection for `prisma migrate deploy` via `DIRECT_URL`).
   * `server/src/config/db.ts` enforces the serverless singleton pattern (`globalThis.prisma`) to reuse client connections across hot-reloaded lambdas.
4. **File Storage (Vercel Blob)**:
   * Migrated from ephemeral local disk storage (`uploads/`) to Vercel Blob (`@vercel/blob`).
   * `server/src/modules/storage/storage.service.ts` provides dual-mode operation:
     * When `BLOB_READ_WRITE_TOKEN` is present: uploaded files (profile photos, certificates, admission docs) are streamed directly to Vercel Blob, and permanent cloud URLs are recorded in PostgreSQL.
     * When `BLOB_READ_WRITE_TOKEN` is absent (offline local development): seamlessly falls back to local disk storage in `uploads/`.

---

## 2. Modified & Added Files Summary

| File | Change Description |
|---|---|
| `vercel.json` | Configured Vercel build command, output directory (`client/dist`), and path rewrites for `/api/(.*)` and SPA fallback. |
| `api/index.ts` | Created Vercel serverless function entry point exporting the Express application. |
| `package.json` | Added `"vercel-build": "npm run build"` to root scripts. |
| `server/prisma/schema.prisma` | Added `directUrl = env("DIRECT_URL")` to `datasource db`. |
| `server/src/config/db.ts` | Enforced `globalThis.prisma` singleton pattern for serverless warm instance reuse. |
| `server/src/config/env.ts` | Added resolution for `DATABASE_URL_POOLED`, `DIRECT_URL`, and `BLOB_READ_WRITE_TOKEN`. |
| `server/src/modules/storage/storage.service.ts` | Integrated `@vercel/blob` for persistent cloud file uploads with local disk fallback. |
| `server/src/modules/storage/storage.controller.ts` | Added support for redirecting to Vercel Blob URLs while enforcing tenant authorization. |
| `client/src/components/idcard/VirtualIdCardView.tsx` | Replaced hardcoded Railway verification URLs with dynamic origin resolution. |
| `client/src/utils/idCardPdf.ts` | Replaced hardcoded Railway URLs in PDF watermark and QR generator. |
| `client/src/utils/admitCardPdf.ts` | Replaced hardcoded Railway URLs in admit card QR generator. |
| `server/src/app.ts` | Updated CORS configuration to accept `*.vercel.app` preview and production domains. |
| `scripts/deploy-db.js` | Removed Railway-specific variables and updated to support Prisma Postgres direct migrations. |
| `.env.example` & `server/.env.example` | Formulated comprehensive environment variable templates for Vercel. |
| `railway.json` | **Removed** (Railway specific). |
| `nixpacks.toml` | **Removed** (Railway specific). |

---

## 3. Real-Time Communication & WebSockets Note

Vercel Functions are serverless and do not hold persistent TCP WebSocket connections open.
* **REST Fail-Safe**: In EduNexa, all chat messages, meetings, and notifications are committed to PostgreSQL before any Socket.IO emit. In serverless mode where WebSockets are unavailable, all CRUD and communication operations continue without failure.
* **Real-Time Push Option**: If real-time instant push notifications (without user refresh) are required in production, connect an external managed WebSocket service (e.g., Pusher Channels or Ably) by configuring the real-time adapter in `server/src/socket.ts`.
