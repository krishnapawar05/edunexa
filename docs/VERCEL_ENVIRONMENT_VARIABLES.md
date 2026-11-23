# EduNexa: Vercel Environment Variables Reference

This document provides the complete reference for every environment variable used by EduNexa on Vercel.

---

## 1. Environment Variable Matrix

| Variable Name | Required | Target Environment | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Production, Preview, Dev | Connection-pooled PostgreSQL connection URL used for runtime queries. |
| `DATABASE_URL_POOLED` | Optional | Production, Preview | Alternative pooled connection variable provided by Prisma integration. |
| `DIRECT_URL` | **Yes** | Production, Preview, Dev | Direct unpooled PostgreSQL connection string used for database migrations. |
| `BLOB_READ_WRITE_TOKEN` | **Yes** (Prod) | Production, Preview | Access token for Vercel Blob persistent file storage. |
| `JWT_ACCESS_SECRET` | **Yes** | Production, Preview, Dev | Cryptographic secret for signing JWT access tokens (minimum 32 characters). |
| `JWT_REFRESH_SECRET` | **Yes** | Production, Preview, Dev | Cryptographic secret for signing JWT refresh tokens (minimum 32 characters). |
| `CLIENT_ORIGIN` | **Yes** | Production, Preview, Dev | Base URL of frontend for CORS allowlist (e.g. `https://edunexa.vercel.app`). |
| `VITE_APP_URL` | Optional | Production, Preview, Dev | Public URL used for generating verification QR codes and links. |
| `NODE_ENV` | **Yes** | Production, Preview, Dev | Application runtime mode (`production` on Vercel). |
| `AI_PROVIDER_API_KEY` | Optional | Production, Preview | Google Gemini API key for AI tutoring and question generation. |
| `AI_PROVIDER_MODEL` | Optional | Production, Preview | Gemini model identifier (defaults to `gemini-2.0-flash`). |
| `RAZORPAY_KEY_ID` | Optional | Production, Preview | Razorpay key identifier for fee collection gateway. |
| `RAZORPAY_KEY_SECRET` | Optional | Production, Preview | Razorpay secret key for fee collection gateway. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Production, Preview | Webhook signature verification secret for Razorpay callbacks. |
| `RAZORPAY_MODE` | Optional | Production, Preview | Mode for fee payments (`test` or `live`). |
| `LOG_LEVEL` | Optional | Production, Preview, Dev | Logging verbosity (`info`, `debug`, `warn`, `error`). |

---

## 2. Setting Variables in the Vercel Dashboard

1. In your Vercel project, go to **Settings** -> **Environment Variables**.
2. Add each variable and choose whether it applies to **Production**, **Preview**, or **Development**.
3. For sensitive credentials (`DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BLOB_READ_WRITE_TOKEN`), select **Sensitive** to prevent display in deployment logs.
4. Redeploy the project after setting the variables to take effect.
