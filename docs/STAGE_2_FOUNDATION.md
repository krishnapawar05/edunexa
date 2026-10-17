# EduNexa — Application Foundation Specification (Stage 2)

**Platform:** EduNexa — Multi-Tenant School Management & AI-Powered ERP  
**Document Status:** Stage 2 Foundation & Architecture Implementation  
**Revision:** 1.0  

---

## 1. Architectural Workspace Structure

EduNexa is architected as a modular monolith monorepo organized via npm workspaces:

```
EduNexa/
├── .env.example                       # Root environment variable template
├── package.json                       # Monorepo root workspace configuration
│
├── shared/                            # Shared Domain Contracts & Validation
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                   # Export root
│       ├── types/
│       │   ├── api.types.ts           # Standardized API response envelopes
│       │   ├── auth.types.ts          # Roles, permissions, and JWT payloads
│       │   └── health.types.ts        # Telemetry & service status types
│       └── schemas/                   # Shared Zod validation schemas
│
├── server/                            # Node.js + Express + TypeScript Backend
│   ├── .env.example                   # Backend-specific environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma              # 20+ entity relational schema
│   │   └── migrations/                # Version-controlled SQL migrations
│   └── src/
│       ├── server.ts                  # HTTP listener entrypoint
│       ├── app.ts                     # Express application factory & middleware pipeline
│       ├── app.test.ts                # Foundation & health check automated tests
│       ├── config/
│       │   ├── env.ts                 # Zod-validated environment configuration
│       │   └── db.ts                  # Prisma Client singleton with connection pooling & status cache
│       ├── middleware/
│       │   ├── auth.middleware.ts     # RBAC, tenant isolation & student privilege guard
│       │   ├── errorHandler.ts        # Centralized AppError and Zod error handling
│       │   ├── logger.ts              # Structured request logging
│       │   ├── rateLimiter.ts         # Rate limiting for sensitive routes
│       │   └── validation.ts          # Generic request schema validation
│       ├── modules/
│       │   ├── auth/                  # Authentication, token generation, login
│       │   ├── superadmin/            # Tenant onboarding & audit logs
│       │   └── test-fixtures/         # Security test routes
│       ├── routes/
│       │   └── health.routes.ts       # GET /api/health
│       └── utils/
│           ├── crypto.ts              # Bcrypt hashing & JWT signing/verification
│           └── logger.ts              # Winston-style structured logger
│
└── client/                            # React 19 + TypeScript + Vite Frontend
    ├── package.json
    ├── vite.config.ts                 # Reverse proxy configuration to :5000
    ├── index.html
    └── src/
        ├── main.tsx                   # React root with SchoolBrandingProvider
        ├── App.tsx                    # Shell router supporting all 8 PRD roles
        ├── components/
        │   ├── Header.tsx             # Top bar, live Core API badge, brand customizer, role switcher
        │   ├── Sidebar.tsx            # Left dark sidebar with mobile drawer support
        │   ├── Breadcrumbs.tsx        # Contextual breadcrumbs
        │   ├── Toast.tsx              # User feedback alerts
        │   ├── SchoolIdentityModal.tsx # Dynamic branding configuration modal
        │   └── ui/                    # Reusable component library (Badge, Button, Modal, Tabs, Pagination, EmptyState)
        ├── context/
        │   └── SchoolBrandingContext.tsx # Reactive school identity engine
        ├── modules/                   # 8 dedicated role workspaces & public website
        ├── services/
        │   └── api.ts                 # Typed fetch client with auth token interceptors
        └── styles/
            ├── tokens.css             # Architectural CSS custom properties
            └── index.css              # Reset, typography, grids, responsive rules
```

---

## 2. PostgreSQL Connection & Initial Prisma Migration

- **Prisma Schema**: Defined in [`server/prisma/schema.prisma`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/prisma/schema.prisma) modeling 20+ core entities:
  `School`, `User`, `Membership`, `Role`, `Permission`, `AcademicSession`, `Department`, `Class`, `Section`, `Subject`, `StudentProfile`, `StaffProfile`, `GuardianRelationship`, `AttendanceRecord`, `ExamSchedule`, `ExamMark`, `VirtualIdCard`, `Invoice`, `PaymentReceipt`, `AuditLog`.
- **Initial Migration**: SQL migration saved in [`server/prisma/migrations/20261018000000_init_edunexa_core/migration.sql`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/prisma/migrations/20261018000000_init_edunexa_core/migration.sql).
- **Resilient Connection Handling**: Implemented in [`server/src/config/db.ts`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/config/db.ts) using a non-blocking timeout race (`Promise.race([..., 500ms])`) and 5-second status caching (`CACHE_TTL_MS = 5000`) so the system reports health status gracefully without blocking request threads when local PostgreSQL is connecting.

---

## 3. Environment Variable Validation (Zod Schema)

All server configuration is strictly validated on boot in [`server/src/config/env.ts`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/config/env.ts) using Zod:

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/edunexa_dev?schema=public'),
  JWT_ACCESS_SECRET: z.string().default('edunexa_dev_access_secret_do_not_use_in_prod_12345'),
  JWT_REFRESH_SECRET: z.string().default('edunexa_dev_refresh_secret_do_not_use_in_prod_67890'),
  AI_PROVIDER_API_KEY: z.string().optional().default(''),
  AI_PROVIDER_MODEL: z.string().default('gemini-2.0-flash'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      return !data.JWT_ACCESS_SECRET.includes('do_not_use_in_prod') && data.JWT_ACCESS_SECRET.length >= 32;
    }
    return true;
  },
  { message: 'In production, JWT secrets must be at least 32 characters and cannot use dev default.' }
);
```

---

## 4. Centralized Error Handling & Structured Logging

- **AppError**: Custom domain error class capturing HTTP status code, machine-readable error code (`UNAUTHORIZED`, `FORBIDDEN_ROLE`, `CROSS_TENANT_FORBIDDEN`, `VALIDATION_ERROR`, `RECORD_NOT_FOUND`), and optional array of validation details.
- **Centralized Middleware**: [`server/src/middleware/errorHandler.ts`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/middleware/errorHandler.ts) catches all unhandled rejections, Zod validation errors, and domain errors, returning the standard JSON error envelope:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request data provided.",
      "details": [{ "field": "email", "message": "Required" }]
    }
  }
  ```
- **Structured Request Logging**: [`server/src/middleware/logger.ts`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/middleware/logger.ts) logs incoming method, path, response status, duration (ms), and client IP address.

---

## 5. Standardized Health Endpoint & Frontend-to-Backend Connectivity

- **Endpoint**: `GET /api/health`
- **Response Format**:
  ```json
  {
    "success": true,
    "data": {
      "service": "EduNexa ERP Core Engine",
      "status": "healthy",
      "uptimeSeconds": 1420,
      "timestamp": "2026-10-18T01:34:10.000Z",
      "version": "1.0.0-foundation",
      "database": {
        "status": "connected",
        "latencyMs": 1.2
      },
      "environment": "development"
    },
    "meta": {
      "timestamp": "2026-10-18T01:34:10.000Z"
    }
  }
  ```
- **Frontend Connectivity Badge**: Displayed in [`Header.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/Header.tsx). Polls `/api/health` every 15 seconds. Displays green badge `Core API: Online` when connected, or warning badge if connecting/offline, with instant click-to-refresh.

---

## 6. Reproducible Setup & Verification Commands

| Command | Purpose |
|---|---|
| `npm run build` | Builds `shared`, `server`, and `client` workspaces |
| `npm run lint` | Runs `tsc --noEmit` across all 3 workspaces |
| `npm run typecheck` | Validates strict TypeScript compilation across all workspaces |
| `npm run test` | Executes the Vitest test suite (18 automated tests) |
| `npm run dev:server` | Starts Express backend server with hot-reload via `tsx` on port `5000` |
| `npm run dev` | Starts Vite frontend dev server with hot-reload on port `5173` |
| `npm run dev:all` | Concurrently starts both server and client dev servers |
| `npm run db:generate` | Generates Prisma Client types from `schema.prisma` |
| `npm run db:migrate` | Applies pending PostgreSQL migrations |
