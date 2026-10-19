# Railway Deployment Guide: EduNexa Multi-Tenant ERP

This guide walks you through deploying **EduNexa** (Frontend + Backend + PostgreSQL Database) to [Railway](https://railway.app/) in minutes.

---

## Architecture & Deployment Options

EduNexa is built as an enterprise monorepo using npm workspaces (`client`, `server`, `shared`). It is optimized for Railway in two deployment modes:

* **Mode 1: Unified Full-Stack Service (Recommended)**
  * A single Railway service compiles the React frontend and serves it directly through Express alongside the `/api/...` endpoints.
  * **Benefits:** Zero CORS configuration, single unified domain (e.g. `https://edunexa.up.railway.app`), automatic SPA fallback routing, and only 1 service charge.
* **Mode 2: Split Services**
  * Deploy the backend Express server on Railway and the Vite frontend separately (on Vercel, Netlify, or a second Railway service).
  * Supported by providing `VITE_API_BASE_URL=https://your-backend.up.railway.app` to the client.

---

## Step-by-Step Deployment (Unified Full-Stack)

### 1. Create a New Project on Railway
1. Go to **[Railway.app](https://railway.app/)** and sign in with GitHub.
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"**.
4. Choose `krishnapawar05/edunexa`.

### 2. Add a PostgreSQL Database Service
1. In your Railway project canvas, click **"+ New"** -> **"Database"** -> **"PostgreSQL"**.
2. Railway will automatically provision a managed PostgreSQL database with internal and external connection URLs.

### 3. Connect the App Service to the Database
1. Click on your `edunexa` web service in the Railway canvas.
2. Go to the **Variables** tab.
3. Click **"New Variable"** -> **"Add Reference"** (or type):
   * `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
     *(Railway will automatically link the database connection string!)*

### 4. Configure Required Environment Variables

In your `edunexa` service **Variables** tab, ensure the following are configured:

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations and caching |
| `PORT` | *(Auto-assigned)* | Railway automatically supplies this; server binds to `0.0.0.0` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Injected from your Railway PostgreSQL service |
| `JWT_ACCESS_SECRET` | *(Generate a 32+ character random string)* | Used for signing auth tokens |
| `JWT_REFRESH_SECRET` | *(Generate a 32+ character random string)* | Used for refresh token rotation |
| `LOG_LEVEL` | `info` | Logging verbosity |

> [!TIP]
> You can generate strong 64-character secrets in your terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 5. Configure Build & Deploy Settings
EduNexa includes a pre-configured `railway.json` and `nixpacks.toml`:
* **Builder:** `NIXPACKS` (installs Node 20 and `openssl` for Prisma engines)
* **Build Command:** `npm run build`
* **Start Command:** `npm start` *(or `npm run start:migrate` to automatically apply migrations on boot)*
* **Healthcheck Path:** `/api/health`
* **Healthcheck Timeout:** `120s`

### 6. Apply Database Migrations
Once your PostgreSQL service is running, apply the database schema:

**Option A (Automatic via Start Command):**
In Railway service settings -> **Deploy** -> set Custom Start Command to:
```bash
npm run start:migrate
```

**Option B (Via Railway CLI):**
```bash
railway run npm run db:deploy
```

### 7. Generate a Public Domain
1. In your `edunexa` web service, navigate to **Settings** -> **Networking**.
2. Click **"Generate Domain"** (e.g. `edunexa-production.up.railway.app`).
3. Open the URL in your browser to access the live running system!

---

## Verifying the Deployment

Once deployed, you can verify your service health:
* **Public Landing & Web App:** `https://your-domain.up.railway.app/`
* **Health Probe:** `https://your-domain.up.railway.app/api/health`
  * Expected response:
    ```json
    {
      "success": true,
      "data": {
        "status": "healthy",
        "database": {
          "connected": true,
          "latencyMs": 8
        }
      }
    }
    ```
* **Public QR Card Verification:** `https://your-domain.up.railway.app/api/v1/core/id-cards/verify/v-tok-8f2c-49a1-9b7e-e214`

---

## Troubleshooting

### 1. `Can't reach database server at localhost:5432`
* **Cause:** The `DATABASE_URL` variable is still pointing to local dev instead of the Railway PostgreSQL service.
* **Fix:** In the Railway dashboard under service variables, set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.

### 2. `Healthcheck timeout`
* **Cause:** Prisma initial connection or build exceeded default 30s.
* **Fix:** The provided `railway.json` sets `healthcheckTimeout: 120`. Ensure `/api/health` is the healthcheck path.

### 3. SPA 404 on Page Refresh
* **Cause:** Deep linking to non-root routes (e.g., `/students`) not falling back to `index.html`.
* **Fix:** Handled automatically in `server/src/app.ts`, which sends `client/dist/index.html` for all non-API GET requests.
