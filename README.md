# EduNexa — Multi-Tenant School Management & AI-Powered ERP System

EduNexa is a production-grade, multi-tenant school operations platform and AI-powered educational ERP system engineered for modern educational institutions, multi-academy trusts, and school districts.

---

## 🏛️ Architectural Overview

```
                                      ┌────────────────────────────────────────┐
                                      │   Web Client (React 19 + TypeScript)   │
                                      │  Tailwind-Free / Custom Design Tokens  │
                                      └──────────────────┬─────────────────────┘
                                                         │ HTTPS / WSS
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │    Express Backend API Gateway         │
                                      │  (Zod, JWT Access/Refresh, Multi-Role) │
                                      └──────┬───────────────────────┬─────────┘
                                             │                       │
                       ┌─────────────────────┴───────┐       ┌───────┴───────────────────────┐
                       ▼                             ▼       ▼                               ▼
            ┌──────────────────────┐      ┌──────────────────────┐               ┌───────────────────────┐
            │ PostgreSQL (Prisma)  │      │ Auditing & Isolation │               │ Google Gemini AI SDK  │
            │ Schema (Multi-Tenant)│      │ Row-Level Security   │               │ RAG School Assistant  │
            │ 20+ Normalized Models│      │ Cryptographic Tokens │               │ Validated Quiz Gen    │
            └──────────────────────┘      └──────────────────────┘               └───────────────────────┘
```

- **Monorepo Architecture**:
  - `shared/`: TypeScript contracts, DTOs, Zod validation schemas, domain types, and security roles.
  - `server/`: Express 4, Prisma ORM, PostgreSQL, Helmet, JWT auth, RBAC middleware, and AI service layer.
  - `client/`: React 19, Vite, responsive vanilla CSS tokens (no Tailwind), Lucide icons, role-specific portals.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v20+ LTS
- **npm**: v10+
- **PostgreSQL**: v15+ (Local Windows Service, Docker, or Hosted Railway)

### 1. Installation
Clone the repository and install dependencies from the root directory:
```bash
git clone <repository-url>
cd EduNexa
npm install
```

### 2. Environment Configuration
Copy `.env.example` in both root and `server/`:
```bash
# In server/
copy .env.example .env
```
Ensure your database credentials and API key are configured:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://postgres:root@localhost:5432/edunexa_dev?schema=public"
JWT_ACCESS_SECRET="edunexa_super_secure_production_access_secret_key_32_chars_min"
JWT_REFRESH_SECRET="edunexa_super_secure_production_refresh_secret_key_32_chars_min"
AI_PROVIDER_API_KEY="your-gemini-api-key"
AI_PROVIDER_MODEL="gemini-3.8-flash"
LOG_LEVEL="info"
```

### 3. Database Initialization & Seeding
Push the Prisma database schema and seed the baseline institutional records:
```bash
cd server
npx prisma db push
npm run prisma:seed
```

### 4. Running the Application
From the repository root, start both the API server and Vite frontend concurrently:
```bash
npm run dev:all
```
- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Database Studio**: `npm run db:studio` ➔ [http://localhost:5555](http://localhost:5555)

---

## 👥 Seeded Test Accounts

The seeder initializes **Apex Academy of Sciences & Arts** (`apex-academy`) with realistic institutional roles.

| Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@edunexa.org` | `DemoPass2026!` | Global tenancy, school onboarding, cross-tenant auditing |
| **School Admin** | `admin@apexacademy.edu` | `DemoPass2026!` / `Password@123` | Admissions, students/staff rosters, timetable, fee config |
| **Teacher** | `julian.thorne@apexacademy.edu` | `DemoPass2026!` / `Password@123` | Attendance, quizzes, grading, AI quiz generator, resources |
| **Accounts** | `accounts@apexacademy.edu` | `DemoPass2026!` / `Password@123` | Fee structures, invoice generation, concessions, refunds |
| **Student** | `aarav.sharma@apexacademy.edu` | `DemoPass2026!` / `Password@123` | Homework submission, timed quizzes, report cards, ID card |
| **Parent** | `vikram.sharma@gmail.com` | `DemoPass2026!` / `Password@123` | Linked ward results, attendance tracking, fee receipts |

---

## 🗄️ Database Schema & Entity Relationships

The relational data model enforces institutional isolation, referential integrity, and cascading behaviors across 20+ models:

```mermaid
erDiagram
    School ||--o{ UserMembership : has
    School ||--o{ AcademicSession : operates
    School ||--o{ Class : organizes
    School ||--o{ Department : employs
    School ||--o{ SchoolEvent : schedules
    School ||--o{ FeeStructure : defines
    School ||--o{ Notice : publishes
    School ||--o{ Subscription : licenses
    School ||--o{ AuditLog : tracks

    User ||--o{ UserMembership : holds
    User ||--o{ AuditLog : triggers

    UserMembership ||--o| StudentProfile : "profile (student)"
    UserMembership ||--o| StaffProfile : "profile (staff)"
    UserMembership ||--o{ ParentStudentLink : "wards (parent)"

    Class ||--o{ Section : partitions
    Class ||--o{ Subject : offers
    Class ||--o{ StudentEnrollment : enrolls

    Section ||--o{ StudentEnrollment : contains
    Section ||--o{ TimetableSlot : hosts
    Section ||--o{ AttendanceRecord : tracks
    Section ||--o{ Quiz : administers
    Section ||--o{ Assignment : assigns

    Quiz ||--o{ QuizQuestion : includes
    Quiz ||--o{ QuizAttempt : records

    ExamSchedule ||--o{ ExamResult : grades
    FeeStructure ||--o{ FeeInvoice : bills
    FeeInvoice ||--o{ FeePayment : receipts
```

---

## 🛡️ Security & Multi-Tenant Enforcement

1. **Namespace Isolation**:
   - Every multi-tenant request must supply an authorized JWT containing `schoolId` or header `X-School-Slug`.
   - Cross-tenant data leaks are strictly prevented at both the middleware layer and query boundaries.
2. **Role-Based Access Control (RBAC)**:
   - 9 granular platform roles: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER`, `STUDENT`, `PARENT`, `HR_STAFF`, `ACCOUNTS`, `EXAM_COORDINATOR`.
   - Privilege escalation and unauthorized role mutations are blocked and logged.
3. **Super Admin Break-Glass Auditing**:
   - Super admins inspecting sensitive student marks or financial records must provide an explicit `x-audit-reason` header.
4. **Input Sanitization & Attack Mitigation**:
   - Zero-trust request validation via Zod schemas.
   - File upload defense: type whitelisting (PDF, JPG, PNG) and 10 MB maximum payload cap.
   - Helmet HTTP security headers and strictly configured CORS origins.

---

## 🤖 Integrated AI Capabilities (Stage 7)

### 1. Grounded School Information Assistant
- **Endpoint**: `POST /api/v1/ai/assistant/ask`
- **Model**: `gemini-3.8-flash`
- **Behavior**: Answers queries regarding admission procedures, attendance thresholds, assessment weightages, and schedules using verified institutional documents. Refuses hallucination when policy data is unavailable.

### 2. AI-Assisted Quiz Generation & Review Workflow
- **Endpoint**: `POST /api/v1/ai/quiz/generate`
- **Strict Invariants**:
  - Requires `TEACHER`, `PRINCIPAL`, or `SCHOOL_ADMIN` permissions.
  - Automatically flags questions with `isAiGenerated: true` and `reviewStatus: PENDING_REVIEW`.
  - Questions are **never published automatically**; they require teacher editorial approval via `PATCH /api/v1/ai/quiz/drafts/:id/review`.

---

## 🧪 Automated Test Suite

Run the full end-to-end integration and security test suite:
```bash
cd server
npm test
```

### Test Suite Execution Output
```
 Test Files  6 passed (6)
      Tests  102 passed (102)
   Duration  3.29s

✓ src/app.test.ts (4 tests) - Health envelope, error formats, CORS headers
✓ src/modules/auth/auth.security.test.ts (21 tests) - Tenant isolation, RBAC, JWT validation, Super Admin audit
✓ src/modules/core/core.test.ts (16 tests) - Academic structure, student/staff dossiers, ID cards & QR verification
✓ src/modules/academic/academic.test.ts (21 tests) - Attendance, quizzes, automated grading, exams, report cards
✓ src/modules/operations/operations.test.ts (26 tests) - Timetables, collision detection, assignments, fees, notices
✓ src/modules/ai/ai.test.ts (14 tests) - Grounded assistant, structured quiz generation, schema defense, isolation
```

---

## 🚢 Production Deployment

EduNexa is deployment-ready for **Railway**, **Docker**, or any standard cloud VM.

### Railway Deployment (Single-Service Fullstack)
1. Fork or push repository to your Git provider.
2. Link your repository in Railway.
3. Add a **PostgreSQL** plugin.
4. Set environment variables in Railway:
   - `NODE_ENV=production`
   - `JWT_ACCESS_SECRET=<generate-random-32-chars>`
   - `JWT_REFRESH_SECRET=<generate-random-32-chars>`
   - `AI_PROVIDER_API_KEY=<gemini-api-key>`
   - `AI_PROVIDER_MODEL=gemini-3.8-flash`
5. Railway executes `nixpacks.toml` to build `@edunexa/shared`, run database migrations, build the client bundle, and launch Express serving static assets and API routes.

See [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) for step-by-step instructions.
