# EduNexa: Railway to Vercel Migration Audit Report (Phase 1)

**Date**: November 2026  
**System**: EduNexa Multi-Tenant Advanced School Management Website & AI-Powered ERP  
**Status**: Comprehensive Pre-Migration Architecture Audit Complete  

---

## 1. Executive Summary & Monorepo Structure

EduNexa is an enterprise-grade, multi-tenant school ERP and institutional website system supporting 9 core PRD roles (*Super Admin, School Admin, Principal, Teacher, Student, Parent, HR Staff, Accounts, Exam Coordinator*).

The project is structured as an npm-workspace TypeScript monorepo:
* **Root (`/`)**: Orchestrates monorepo workspaces (`shared`, `server`, `client`), cross-package builds, and database deployment commands.
* **`client/`**: React 19 + Vite 6 + TypeScript single-page application (SPA) with role-guarded routes, dynamic PDF generators (`jspdf`), QR renderers (`qrcode`), and token-driven CSS themes.
* **`server/`**: Express 4 + TypeScript Node.js REST API with Prisma ORM 6.4, JWT auth, tenant isolation middleware, Razorpay payment integrations, and modular controllers.
* **`shared/`**: Shared TypeScript contracts, DTOs, interfaces, and role enums compiled to CommonJS and ESM declarations.
* **`uploads/`**: Local disk directory partitioned into `uploads/public/` and `uploads/secure/<schoolId>/`.
* **`docs/`**: Comprehensive PRD compliance, architecture reports, and setup manuals.

---

## 2. Existing Railway Dependencies & Deployment Configuration

The current deployment relies on Railway container hosting via Nixpacks:

1. **`railway.json`**:
   * Uses `NIXPACKS` builder with `npm run build`.
   * Start command: `npm run start:migrate` (runs `node scripts/deploy-db.js && node server/dist/server.js`).
   * Health check path: `/api/health`.
2. **`nixpacks.toml`**:
   * Configures `nodejs_20` and `openssl` Nix packages.
   * Modifies container shell paths (`/root/.nix-profile/bin`, `/etc/profile`) to ensure `npx` and `node` resolve globally.
3. **`scripts/deploy-db.js`**:
   * Inspects Railway database environment variables (`DATABASE_URL`, `DATABASE_PRIVATE_URL`, `POSTGRES_URL`, `DATABASE_PUBLIC_URL`, `PGHOST`).
   * Executes `prisma migrate deploy`, followed by `prisma migrate resolve` and `prisma db push --accept-data-loss`.
   * Runs `npm run db:seed`.
4. **Hardcoded Railway URLs in Code**:
   * `server/src/app.ts`: CORS origin whitelist explicitly matches `*.railway.app` and `*.up.railway.app`.
   * `client/src/components/idcard/VirtualIdCardView.tsx`: Verification QR link falls back to `https://edunexa.up.railway.app/verify-id/...`.
   * `client/src/utils/idCardPdf.ts`: PDF watermark and QR verification code link to `https://edunexa.up.railway.app/verify-id/...`.
   * `client/src/utils/admitCardPdf.ts`: Admit card PDF QR codes link to `https://edunexa.up.railway.app/verify-admit-card/...`.
   * `README.md` & `docs/`: Extensive references to Railway deployment workflows.

---

## 3. Database Configuration & Record Audit

### 3.1 Current Database State
* **ORM**: Prisma ORM `^6.4.1` with `@prisma/client`.
* **Provider**: PostgreSQL (`provider = "postgresql"`).
* **Database Connection**: Currently resolves from `DATABASE_URL` via `server/src/config/env.ts` and `server/src/config/db.ts`.
* **Local Database Connectivity**: Verified operational on `localhost:5432/edunexa_dev`.
* **Existing Live Data Record Counts**:
  * `schools`: **56**
  * `users`: **355**
  * `students`: **38**
  * `staff`: **72**
  * `admissionApplications`: **36**
  * `virtualIdCards`: **19**
  * `admitCards`: **62**
  * `feeInvoices`: **33**
  * `meetings`: **34**
* **Migrations**:
  * `20261018000000_init_edunexa_core`
  * `20261029000000_add_account_invitations`
  * `20261104000000_add_password_recovery_and_username`
  * `20261104100000_add_user_password_reset_and_locking`

### 3.2 Prisma Postgres Migration Risks & Requirements
1. **Connection Pooling vs Direct Connection**:
   * Serverless execution (Vercel Functions) rapidly opens multiple stateless instances. Without connection pooling, Postgres exhausts maximum connections (`max_connections` exceeded).
   * **Rule**: Runtime queries must use `DATABASE_URL_POOLED` / pooled connection URL.
   * **Rule**: Schema migrations (`prisma migrate deploy`) and CLI commands require direct unpooled connections (`DIRECT_URL`).
2. **Prisma Client Singleton in Serverless**:
   * `server/src/config/db.ts` already implements a global singleton (`global.prisma`), which avoids redundant PrismaClient instantiations across hot-reloaded lambdas.
3. **Data Preservation**:
   * Prior to repointing to Prisma Postgres, a full pg_dump snapshot (`.sql`) must be generated and verified.

---

## 4. Local File Storage Dependencies (`uploads/`)

### 4.1 Identified Storage Usages
* Centralized storage is managed in `server/src/modules/storage/storage.service.ts`.
* Currently writes to local disk: `path.resolve(process.cwd(), 'uploads')`.
  * Public assets: `uploads/public/` (served via `express.static('/uploads/public')` in `server/src/app.ts`).
  * Secure documents: `uploads/secure/<schoolId>/<category>/` (streamed via `GET /api/v1/storage/files/:id` with tenant authorization).
* Dependent modules:
  * Student Profile Photos (`idcards.service.ts`)
  * Faculty / Employee Photos (`idcards.service.ts`)
  * Student Admission Documents & Proofs (`admissions.service.ts`)
  * School Logos & Watermarks (`storage.service.ts`)
  * Admit Card PDF Assets & Signatures (`admitcards.service.ts`)
  * Institutional Certificates & Prospectus Files

### 4.2 Serverless Storage Incompatibility
* Vercel Serverless Functions have a read-only filesystem (except temporary `/tmp`, which is ephemeral and wiped upon function termination).
* Permanent files stored on local disk will disappear on Vercel redeploys or across function instances.
* **Migration Target**: Vercel Blob (`@vercel/blob`).
  * Cloud storage token: `BLOB_READ_WRITE_TOKEN`.
  * Storage Service must support dual-mode: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is present, falling back to local filesystem for offline development.

---

## 5. Backend Serverless Compatibility (Express on Vercel)

1. **HTTP Server Separation**:
   * In `server/src/server.ts`, `app.listen(env.port, ...)` binds a long-lived TCP port.
   * In Vercel, functions run on-demand without binding a port.
   * **Solution**: Keep `server/src/app.ts` as the pure Express application factory. Export a Vercel serverless entry point (`api/index.ts`) that exports `app`.
2. **Request Body Size**:
   * Vercel Functions have a 4.5MB request payload limit on Serverless Functions.
   * `express.json({ limit: '5mb' })` in `app.ts` should align with 4.5MB to avoid Vercel edge truncations, and client-side photo compression should be utilized.
3. **Cold Starts & Execution Limits**:
   * Database queries during health checks must have fast timeouts (`timeoutPromise` in `db.ts` is already tuned to 4000ms).

---

## 6. Real-Time Communication Architecture (Socket.IO vs Serverless)

* **Current Implementation**:
  * `server/src/socket.ts` binds `SocketIOServer` to the HTTP server in `server.ts`.
  * Rooms: `user:<userId>`, `school:<schoolId>`, `conversation:<conversationId>`.
  * Features: Real-time typing indicators, read receipts, instant chat message broadcasts, meeting notifications.
* **Serverless Limitation**:
  * Vercel Serverless Functions cannot maintain open, persistent WebSocket connections.
* **Fail-Safe Mechanism Already in Code**:
  * In `socket.ts`, every broadcast function begins with `if (!io) return;`.
  * In `communication.service.ts`, messages and meetings are always committed to PostgreSQL via Prisma before Socket.IO emits.
  * In `client/src/services/socket.ts`, connection failures trigger a warning without breaking the UI.
* **Recommended Architecture**:
  * Primary: All communication operations continue to function via robust REST API endpoints.
  * Secondary / Optional Real-Time Gateway: If real-time instant push without refreshing is required on Vercel, an external WebSocket gateway (e.g., Pusher Channels, Ably, or a dedicated lightweight WebSocket relay) can be plugged in.

---

## 7. Required Vercel Configuration Architecture

To host both the Vite React SPA and the Express backend in the same unified repository on Vercel:

1. **`vercel.json`**:
   * `buildCommand`: `npm run build`
   * `outputDirectory`: `client/dist`
   * `rewrites`:
     * Routes starting with `/api/(.*)` route to `/api` (the serverless function in `api/index.ts`).
     * All remaining routes route to `/index.html` for React SPA client-side routing.
2. **`api/index.ts`**:
   * Reusable entry point importing `app` from `../server/src/app.js`.
   * Automatically executes Express routes inside Vercel's Node.js runtime.

---

## 8. Summary of Migration Plan

| Phase | Target Area | Primary Action |
|---|---|---|
| **Phase 2** | Database | Backup local/Railway PostgreSQL, configure Prisma Postgres, verify pooled & direct connection strings, execute migrations, verify record counts. |
| **Phase 3** | Express Backend | Create `api/index.ts` Vercel function export, decouple `server.listen`, preserve all routes and middleware. |
| **Phase 4** | File Storage | Install `@vercel/blob`, refactor `StorageService` for Vercel Blob persistence with local fallback. |
| **Phase 5** | Frontend | Remove hardcoded Railway verification URLs, configure dynamic base URLs, verify SPA routing. |
| **Phase 6** | Cleanup | Remove `railway.json`, `nixpacks.toml`, update `scripts/` and documentation. |
| **Phase 7** | Environment | Formulate complete production, preview, and development `.env` matrices. |
| **Phase 8 & 9** | Validation | Run builds, tests, typechecks, verify all 9 roles and modules. |
| **Phase 10** | Documentation | Author migration manuals and guides in `docs/`. |
