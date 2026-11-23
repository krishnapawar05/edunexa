# EduNexa: Vercel Deployment Step-by-Step Guide

Follow these steps to deploy the EduNexa monorepo on Vercel.

---

## 1. Prerequisites

1. A [Vercel account](https://vercel.com).
2. GitHub repository containing the latest EduNexa source code.
3. A provisioned **Prisma Postgres** database instance.

---

## 2. Import Repository into Vercel

1. Log in to the **Vercel Dashboard**.
2. Click **"Add New..."** -> **"Project"**.
3. Select your `edunexa` GitHub repository.
4. In the **Configure Project** screen:
   * **Framework Preset**: Select **Vite** (or **Other**).
   * **Root Directory**: `./` (leave default root).
   * **Build Command**: `npm run build` (or leave default, as defined in `vercel.json`).
   * **Output Directory**: `client/dist` (as defined in `vercel.json`).
   * **Install Command**: `npm install`.

---

## 3. Configure Environment Variables in Vercel

Under **Project Settings -> Environment Variables**, add the following variables for **Production**, **Preview**, and **Development**:

| Variable | Description | Example / Source |
|---|---|---|
| `DATABASE_URL` | Pooled connection string | Provided by Prisma Postgres |
| `DATABASE_URL_POOLED` | Connection-pooled runtime URL | Provided by Prisma Postgres |
| `DIRECT_URL` | Direct unpooled connection URL | Provided by Prisma Postgres (direct port 5432) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token | Created under Vercel Storage tab |
| `JWT_ACCESS_SECRET` | 32+ character access secret | e.g. `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | 32+ character refresh secret | e.g. `openssl rand -hex 32` |
| `CLIENT_ORIGIN` | Allowed client origin | `https://your-project.vercel.app` |
| `AI_PROVIDER_API_KEY` | Google Gemini API key | Google AI Studio |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Razorpay Dashboard |
| `NODE_ENV` | Environment mode | `production` |

---

## 4. Deploying Database Migrations to Prisma Postgres

Before or immediately after the initial deployment, deploy the database schema to your Prisma Postgres database:

```bash
# In your local terminal or CI pipeline with DIRECT_URL set:
DIRECT_URL="postgres://..." DATABASE_URL="postgres://..." npm run db:deploy
```

This runs `prisma migrate deploy` over the direct connection, applying all migration history (`20261018000000_init_edunexa_core` through `20261104100000_add_user_password_reset_and_locking`) and seeds the initial institutional demo records.

---

## 5. Enable Vercel Blob Storage

1. Navigate to the **Storage** tab in your Vercel Dashboard.
2. Click **"Create Database"** / **"Create Store"** -> Select **Blob**.
3. Choose a store name (e.g. `edunexa-blob-storage`).
4. Link the store to your EduNexa Vercel project.
5. Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into your project environment variables.
6. Trigger a redeployment. All photo uploads, student documents, and certificates will now be stored in Vercel Blob.

---

## 6. Verification Checklist

* [ ] Visit `https://your-project.vercel.app/api/health` -> Verify `{ "status": "UP", "database": { "connected": true } }`.
* [ ] Visit `https://your-project.vercel.app/login` -> Verify split-screen login page renders with full campus background.
* [ ] Sign in with any of the 9 PRD roles (`superadmin@edunexa.org`, `admin@apexacademy.edu`, `teacher.thorne@apexacademy.edu`, `student.aarav@apexacademy.edu`, password `Password@123`).
* [ ] Test PDF ID Card generation and QR scanning.
* [ ] Test profile photo upload and verify the URL points to Vercel Blob.
