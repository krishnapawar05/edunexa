# EduNexa — Multi-Tenant School Management ERP & AI-Powered Educational Platform

EduNexa is a production-grade, multi-tenant school operations platform and AI-assisted educational ERP system engineered for K-12 schools, academic institutions, and multi-school districts. Built with **TypeScript**, **Node.js/Express**, **Prisma ORM**, **PostgreSQL**, and **React 19**, the platform unifies administrative governance, student information, automated attendance tracking, conflict-free timetable scheduling, examination lifecycles with continuous grading schemes, fee billing with atomic payment ledger processing, ISO CR80 digital ID card issuance, and pedagogical AI capabilities powered by Google Gemini.

---

## 📑 Table of Contents

1. [Executive Overview & Problem Statement](#-executive-overview--problem-statement)
2. [Verified Feature Matrix](#-verified-feature-matrix)
3. [Actual Technology Stack](#-actual-technology-stack)
4. [System Architecture](#-system-architecture)
5. [Repository Structure](#-repository-structure)
6. [Frontend Architecture](#-frontend-architecture)
7. [Backend Architecture & Request Lifecycle](#-backend-architecture--request-lifecycle)
8. [Database Schema Design & ER Diagrams](#-database-schema-design--er-diagrams)
9. [Authentication, Authorization & Multi-Tenancy](#-authentication-authorization--multi-tenancy)
10. [API Reference](#-api-reference)
11. [Core Business Workflows](#-core-business-workflows)
12. [AI Integrations & Safety Architecture](#-ai-integrations--safety-architecture)
13. [Email & Notification Infrastructure](#-email--notification-infrastructure)
14. [Environment Variables Reference](#-environment-variables-reference)
15. [Installation & Local Development](#-installation--local-development)
16. [Database Migrations & Seed Data Management](#-database-migrations--seed-data-management)
17. [Automated Testing & Verification Suite](#-automated-testing--verification-suite)
18. [Production Deployment Architecture](#-production-deployment-architecture)
19. [Security Considerations & Controls](#-security-considerations--controls)
20. [Known Limitations & Technical Roadmap](#-known-limitations--technical-roadmap)
21. [License & Contribution Guidelines](#-license--contribution-guidelines)

---

## 🏛️ Executive Overview & Problem Statement

Modern educational institutions often grapple with fragmented, disjointed software tools: one system for attendance, another for finance, standalone spreadsheets for examination schedules, manual paper ID cards, and isolated communication channels. This fragmentation leads to data desynchronization, security vulnerabilities, lack of audit trails, and high administrative overhead.

**EduNexa** resolves these challenges by providing a single, coherent, multi-tenant platform with:
- **Strict Multi-Tenant Isolation**: Complete logical and relational partitioning across institutional tenants (`School`).
- **Granular Role-Based Access Control**: 9 distinct institutional roles with strict vertical and horizontal permission boundaries.
- **Audited Financial Ledger**: Atomic transaction processing for fee invoices, payments, partial settlements, and bank reconciliation.
- **Examinations & Continuous Grading**: Gapless 0–100% boundary validation, preset scales (`A+` to `E` letter scale, CBSE 9-point scale), batch mark entry, and immutable audit logs.
- **Digital Identity Infrastructure**: ISO CR80 compliant student and staff ID card generation with zero-PII cryptographic QR verification.
- **Pedagogical AI Layer**: Anti-hallucination institutional information assistant, teacher-moderated quiz draft generation, and interactive student concept tutor backed by Google Gemini.

### Canonical Demo School
The repository is pre-configured and seeded with **Apex Academy of Sciences & Arts** (`apex-academy`, code: `APEX-2026`), featuring a balanced dataset of 5 canonical students, 5 linked parents, 6 faculty/administrative profiles, 5 fee invoices, 4 settled receipts, 4 exams, 5 quizzes, 5 notices, and 4 school events.

---

## 📊 Verified Feature Matrix

Every feature listed below has been verified against the local source code, database migrations, backend routes, and frontend views:

| Module | Purpose | Actual Implementation Details | Implementation Status |
| :--- | :--- | :--- | :---: |
| **Super Admin Platform** | Global multi-tenant institution onboarding, telemetry, and auditing. | Cross-school telemetry endpoint, tenant status toggle (`ACTIVE`, `SUSPENDED`), subscription management, and break-glass audit logs (`x-audit-reason` header). | **Implemented** |
| **School Administration** | Central institutional governance and roster management. | Student/faculty dossiers, admissions approval queue, class/section/subject creation, academic sessions, and institutional overview KPI stats. | **Implemented** |
| **Authentication & RBAC** | Cryptographic token handling and role protection. | JWT access/refresh token generation, bcrypt password hashing (10 rounds), Express rate limiting (30 req/15 min), and 9 role guards. | **Implemented** |
| **Student Management** | Student lifecycle and profile tracking. | Auto-generated admission numbers (`ADM-2026-XXXX`), blood group, emergency contact, class-section enrollments, and status tracking (`ACTIVE`, `GRADUATED`). | **Implemented** |
| **Faculty & Staff HR** | Employee records, department mapping, and leave workflows. | Employee IDs (`EMP-2026-XXXX`), department linkage, attendance check-in/out, leave requests with admin approval, and compliance quizzes. | **Implemented** |
| **Parent Portal** | Ward academic, attendance, and financial tracking. | Parent-to-student relationship mapping (`ParentStudentLink`), horizontal isolation enforcing parents only view registered wards, fees ledger, and report cards. | **Implemented** |
| **Attendance Register** | Daily roll-call and biometric logging. | Teacher batch roll-call with `PRESENT`, `ABSENT`, `LATE`, `APPROVED_LEAVE` statuses, attendance rate analytics, and date-range reporting. | **Implemented** |
| **Timetable Management** | Conflict-free weekly class schedule orchestration. | Timetable slot scheduler with **automated collision validation** preventing room double-booking and teacher double-booking. | **Implemented** |
| **Examinations & Grading** | Formal assessments, marks entry, and result publishing. | Mid-term/final schedules, batch marks entry, grade auto-computation, audited marks correction, and coordinator result publication toggle. | **Implemented** |
| **Grading Scheme Repair** | Continuous grade scale definition and validation. | 7-band `A+` through `E` letter scale, CBSE 9-point scale preset, continuous 0–100% gapless boundary validation, and PostgreSQL persistence. | **Implemented** |
| **Fee Billing & Accounts** | Institutional billing, collection, and reconciliation. | Class-based fee structures, automated student invoices, atomic payment recording, overpayment defense, receipts, concessions, and bank reconciliation. | **Implemented** |
| **PDF Document Generation** | High-resolution downloadable PDF documents. | Client-side `jspdf` engine generating `fee-receipt-<number>.pdf`, `fee-invoice-<number>.pdf`, `report-card-<admissionNo>.pdf`, and `id-card-<number>.pdf`. | **Implemented** |
| **Digital Virtual ID Cards** | Institutional identity card issuance and verification. | ISO CR80 standard layout (85.6 mm × 53.98 mm), photo avatar fallback, status pill (`ACTIVE`), and cryptographic QR verification token (`v-tok-<UUID>`). | **Implemented** |
| **Public QR Verification** | Zero-PII public card validation. | Public endpoint `GET /api/v1/core/id-cards/verify/:token` returning only holder name, institution, category, and status without exposing private PII. | **Implemented** |
| **Audience Notices & Events** | Scoped institutional announcements and calendar. | Notice broadcast with audience scoping (`ALL`, `STUDENTS_ONLY`, `PARENTS_ONLY`, `STAFF_ONLY`), urgency flag, and school event calendar. | **Implemented** |
| **AI School Assistant** | Grounded institutional question-answering. | Google Gemini model grounded in approved institutional policy documents (`APPROVED_SCHOOL_DOCUMENTS`), anti-hallucination guard (`isMissingInformation`). | **Implemented** |
| **AI Quiz Generator** | Teacher-moderated automated quiz draft generation. | Generates structured JSON questions via Gemini; drafts are strictly held in `PENDING_REVIEW` until teacher editorial approval. | **Implemented** |
| **AI Student Concept Tutor** | Interactive pedagogical study assistant. | Pedagogical concept explanations, step-by-step guidance, practice questions, and revision tips for students across grades. | **Implemented** |
| **Email Invitations & SMTP** | Outbound transactional email delivery. | Account provisioning and notifications operate via in-app feeds and database records. Real external SMTP/email delivery (SendGrid/Nodemailer) is not hooked. | **Planned / Unimplemented** |

---

## 🛠️ Actual Technology Stack

The technology stack is verified directly from `package.json`, lockfiles, and active imports across the three npm workspaces:

### Core Architecture & Monorepo
- **Workspace Manager**: npm workspaces (`shared`, `server`, `client`)
- **Process Orchestration**: `concurrently` v9.1.2 (for local concurrent server + client execution)
- **TypeScript**: v5.7.3 across all workspaces

### Backend (`server/`)
- **Runtime**: Node.js v20+ LTS
- **Framework**: Express v4.21.2
- **Database & ORM**: PostgreSQL with Prisma ORM v6.4.1 (Prisma Client & Prisma CLI)
- **Security & Headers**: `helmet` v8.0.0, `cors` v2.8.5
- **Rate Limiting**: `express-rate-limit` v8.7.1
- **Authentication**: `jsonwebtoken` v9.0.3, `bcryptjs` v3.0.3
- **Schema Validation**: `zod` v3.24.2
- **Execution & Hot-Reload**: `tsx` v4.19.3
- **Testing Framework**: `vitest` v3.0.5, `supertest` v7.0.0

### Frontend (`client/`)
- **Framework**: React v19.0.0, `react-dom` v19.0.0
- **Build Tool & Dev Server**: Vite v6.1.0 with `@vitejs/plugin-react` v4.3.4
- **Routing**: `react-router-dom` v7.18.4
- **Iconography**: `lucide-react` v1.16.0
- **Document Generation**: `jspdf` v4.2.1 (certified client-side PDF rendering)
- **Styling**: Pure CSS design tokens (`client/src/styles/index.css`) with light/dark theme variables (no Tailwind dependency)

### Shared Contracts (`shared/`)
- **Validation**: `zod` v3.24.2
- **Types**: Shared TypeScript interfaces, DTOs, enums, API request/response envelopes, and role definitions

---

## 🏗️ System Architecture

The following diagram illustrates the verified end-to-end request lifecycle and component boundaries:

```mermaid
graph TD
    subgraph Client ["Client Browser (React 19 + Vite)"]
        UI[Role Dashboard & Pages]
        AuthCtx[Auth & Session Storage]
        PdfGen[jsPDF Document Engine]
        ApiClient[Typed Fetch API Client]
    end

    subgraph Gateway ["Express API Gateway (:5000)"]
        HelmetCors[Helmet & Dynamic CORS]
        RateLimiter[Auth Rate Limiter]
        ReqLogger[Request Logger Middleware]
        JwtAuth[JWT Auth Middleware]
        RbacGuard[requireRole Guard]
        TenantGuard[requireTenantScope Guard]
        IsoGuard[Student/Parent Isolation Guard]
    end

    subgraph Controllers ["Modular Route Controllers"]
        AuthCtrl[Auth Controller]
        SuperCtrl[SuperAdmin Controller]
        CoreCtrl[Core School Controller]
        AcadCtrl[Academic Controller]
        OpsCtrl[Operations Controller]
        AiCtrl[AI Controller]
    end

    subgraph DataAccess ["Data Access & External Services"]
        Prisma[Prisma ORM Client]
        Postgres[(PostgreSQL Database)]
        Gemini[Google Gemini API v1beta]
    end

    UI -->|User Interactions| ApiClient
    UI -->|Download Action| PdfGen
    ApiClient -->|HTTP Bearer Requests| HelmetCors
    HelmetCors --> RateLimiter
    RateLimiter --> ReqLogger
    ReqLogger --> JwtAuth
    JwtAuth --> RbacGuard
    RbacGuard --> TenantGuard
    TenantGuard --> IsoGuard

    IsoGuard --> AuthCtrl
    IsoGuard --> SuperCtrl
    IsoGuard --> CoreCtrl
    IsoGuard --> AcadCtrl
    IsoGuard --> OpsCtrl
    IsoGuard --> AiCtrl

    AuthCtrl --> Prisma
    SuperCtrl --> Prisma
    CoreCtrl --> Prisma
    AcadCtrl --> Prisma
    OpsCtrl --> Prisma
    AiCtrl --> Gemini
    AiCtrl --> Prisma

    Prisma --> Postgres
```

---

## 📁 Repository Structure

```
EduNexa/
├── .env.example                      # Root environment variable template
├── nixpacks.toml                     # Railway full-stack production build definition
├── package.json                      # Monorepo root workspace configuration
├── README.md                         # This source-code verified documentation
├── docs/                             # Engineering specifications & audit reports
│   ├── demo-data-and-quality-audit.md # Bloat audit, clean counts & PDF verification
│   ├── PRD_COMPLIANCE_AUDIT.md       # Complete requirements traceability audit
│   └── RAILWAY_DEPLOYMENT.md         # Step-by-step Railway cloud deployment guide
├── shared/                           # Shared library workspace (@edunexa/shared)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts                  # DTOs, Zod schemas, role enums, API envelopes
├── server/                           # Backend Express API workspace (@edunexa/server)
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma             # 38 PostgreSQL models, 11 enums, indexes
│   │   ├── seed.ts                   # Deterministic idempotent institutional seeder
│   │   └── clean-dev-data.ts         # Safe development database pruning utility
│   └── src/
│       ├── app.ts                    # Express application factory & middleware stack
│       ├── server.ts                 # HTTP server bootstrap & graceful shutdown
│       ├── config/
│       │   ├── db.ts                 # Prisma Client singleton
│       │   └── env.ts                # Zod-validated environment configuration
│       ├── middleware/
│       │   ├── auth.middleware.ts    # JWT verification, RBAC, tenant isolation
│       │   ├── errorHandler.ts       # Global RFC 7807 compliant error handler
│       │   ├── logger.ts             # Structured request logger
│       │   └── validate.ts           # Zod request payload validation middleware
│       ├── modules/
│       │   ├── auth/                 # Login, session verification, tokens
│       │   ├── superadmin/           # Multi-tenant onboarding, subscriptions
│       │   ├── core/                 # Students, staff, departments, ID cards
│       │   ├── academic/             # Attendance, quizzes, exams, grading
│       │   ├── operations/           # Timetable, assignments, fees, notices
│       │   └── ai/                   # Grounded assistant, quiz gen, concept tutor
│       └── utils/
│           └── crypto.ts             # JWT signing/verification, bcrypt hashing
└── client/                           # Frontend React SPA workspace (@edunexa/client)
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx                  # React entry point with theme providers
        ├── App.tsx                   # Master router, layouts, protected routes
        ├── components/
        │   ├── ErpLayout.tsx         # Responsive sidebar & header shell
        │   ├── ProtectedRoute.tsx    # Client-side RBAC navigation guard
        │   ├── Header.tsx            # Institution selector, role badge, profile
        │   ├── Sidebar.tsx           # Role-specific navigation items
        │   └── Breadcrumbs.tsx       # Standardized navigation breadcrumb
        ├── services/
        │   ├── api.ts                # Typed API client with auto-bearer injection
        │   └── pdfGenerator.ts       # jsPDF engine for receipts, invoices, cards
        ├── styles/
        │   └── index.css             # Enterprise navy design tokens & theme vars
        └── modules/                  # 10 role-specific page directories
            ├── accounts/             # Invoices, fee structures, bank reconciliation
            ├── auth/                 # Login & registration forms
            ├── examinations/         # Schedules, marks entry, grading schemes
            ├── hr/                   # Staff directory, leave requests, training
            ├── parent/               # Ward attendance, results, fees, notices
            ├── public/               # School landing pages, inquiry, QR verify
            ├── schooladmin/          # Rosters, timetable, virtual ID cards
            ├── student/              # Overview, timetable, quizzes, results, tutor
            ├── superadmin/           # Telemetry, school management, audit logs
            └── teacher/              # Roll-call, quizzes, marks, resources
```

---

## 💻 Frontend Architecture

### 1. Entry Point & Routing
- Entry: [client/src/main.tsx](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/main.tsx) initializes React 19 within `ThemeContext` and `SchoolBrandingContext`.
- Router: [client/src/App.tsx](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/App.tsx) defines a flat, role-segmented route hierarchy using `react-router-dom` v7.

### 2. Layouts & Security Guards
- **`PublicLayout`**: Outer container for public school website pages (Academics, Admissions, Faculty, News, About).
- **`ErpLayout`**: Authenticated container providing a responsive sidebar, sticky topbar with institutional branding, profile dropdown, unread notification counter, and theme switcher.
- **`ProtectedRoute`**: Inspects local session storage (`edunexa_user`, `edunexa_access_token`). Redirects unauthenticated requests to `/login` and verifies user role against `allowedRoles`.

### 3. State Management & API Client
- **Authentication State**: Persisted in `localStorage` under `edunexa_access_token` and `edunexa_user`.
- **API Client**: [client/src/services/api.ts](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/services/api.ts) provides a centralized, typed wrapper around native `fetch`. It automatically attaches Bearer tokens, handles JSON serialization, unwraps `{ success: true, data }` envelopes, and formats error messages.

### 4. Client-Side Document PDF Generation
Implemented in [client/src/services/pdfGenerator.ts](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/services/pdfGenerator.ts) using `jspdf`:
- **`downloadFeeReceiptPdf`**: Institutional header, student details, paid amount in INR, emerald paid stamp, and digital signature block (`fee-receipt-<number>.pdf`).
- **`downloadFeeInvoicePdf`**: Due date, fee component breakdown, payment status badge, and outstanding balance (`fee-invoice-<number>.pdf`).
- **`downloadReportCardPdf`**: Academic session crest, student dossier, subject-wise marks, calculated percentage, letter grade, and triple signature blocks (`report-card-<admissionNo>.pdf`).
- **`downloadIdCardPdf`**: ISO CR80 standard dimensions (85.6 mm × 53.98 mm), photo avatar box, blood group, emergency contact, and QR code token (`id-card-<identifierNo>.pdf`).

---

## ⚙️ Backend Architecture & Request Lifecycle

### Middleware Order & Pipeline
Requests flowing through Express in [server/src/app.ts](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/app.ts) follow this strict sequence:

1. **Helmet Security**: Disables dangerous headers and mitigates clickjacking.
2. **CORS Handling**: Evaluates request origin against allowed hostnames and `.railway.app` wildcards.
3. **Body Parsers**: `express.json({ limit: '5mb' })` and `express.urlencoded`.
4. **Structured Logger**: Logs timestamp, method, URL, status code, IP address, and response latency.
5. **Health Router**: Exposes `/api/health` for monitoring without requiring auth.
6. **Authentication (`authenticateUser`)**: Extracts and verifies Bearer JWT token from `Authorization` header.
7. **Role Guard (`requireRole`)**: Checks `req.user.role` against required permissions.
8. **Tenant Scope Guard (`requireTenantScope`)**: Validates that non-superadmin requests operate only within their assigned `req.user.schoolId`.
9. **Horizontal Isolation (`enforceStudentIsolation`)**: Verifies student/parent profile IDs match the authenticated caller.
10. **Super Admin Break-Glass Audit (`auditSuperAdminSensitiveAccess`)**: Requires `x-audit-reason` header (min 10 characters) when inspecting sensitive student/payment records.
11. **Route Controller & Service**: Executes transactional Prisma queries against PostgreSQL.
12. **Centralized Error Handler (`errorHandler`)**: Catches AppError, Prisma exceptions, and Zod validation errors, returning structured RFC 7807 error responses.

### Sequence Diagram: Student Registration Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as School Administrator
    participant Client as Web Client (React 19)
    participant Auth as Auth & Tenant Middleware
    participant CoreRoutes as Core Router (/api/v1/core/students)
    participant CoreService as Core Service
    participant Prisma as Prisma Client
    participant DB as PostgreSQL Database

    Admin->>Client: Fills Student Form & Clicks "Register Student"
    Client->>Auth: POST /api/v1/core/students (Bearer JWT)
    Auth->>Auth: verifyAccessToken(token) -> req.user
    Auth->>Auth: requireRole('SCHOOL_ADMIN', 'PRINCIPAL') -> OK
    Auth->>Auth: requireTenantScope() -> req.schoolId matches tenant
    Auth->>CoreRoutes: Forward sanitized request
    CoreRoutes->>CoreService: createStudent(schoolId, studentData)
    CoreService->>Prisma: prisma.$transaction()
    Prisma->>DB: INSERT INTO "User" (email, passwordHash, firstName, lastName)
    Prisma->>DB: INSERT INTO "UserMembership" (userId, schoolId, role=STUDENT)
    Prisma->>DB: INSERT INTO "StudentProfile" (admissionNumber, bloodGroup, emergencyPhone)
    Prisma->>DB: INSERT INTO "StudentEnrollment" (classId, sectionId, academicSessionId)
    Prisma->>DB: INSERT INTO "VirtualIdCard" (cardNumber, verificationToken, status=ACTIVE)
    DB-->>Prisma: Transaction Committed Successfully
    Prisma-->>CoreService: Hydrated Student Record
    CoreService-->>CoreRoutes: Return Student Dossier
    CoreRoutes-->>Client: HTTP 201 { success: true, data: { ... } }
    Client-->>Admin: Displays success toast and updates Student Directory
```

---

## 🗄️ Database Schema Design & ER Diagrams

The database schema is defined in [server/prisma/schema.prisma](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/prisma/schema.prisma) and managed through Prisma migrations targeting **PostgreSQL**. It encompasses **38 relational models** and **11 enumerations**.

### Entity Relationship Diagram: Identity, Tenancy & Academic Structure

```mermaid
erDiagram
    School ||--o{ UserMembership : "has members"
    School ||--o{ AcademicSession : "operates"
    School ||--o{ Department : "employs"
    School ||--o{ Class : "organizes"
    School ||--o{ FeeStructure : "defines"
    School ||--o{ Notice : "publishes"
    School ||--o{ SchoolEvent : "schedules"
    School ||--o{ Subscription : "licensed under"
    School ||--o{ AuditLog : "audited by"

    User ||--o{ UserMembership : "holds memberships"
    User ||--o{ AuditLog : "triggers"
    User ||--o{ Notification : "receives"

    UserMembership ||--o| StudentProfile : "profile (student)"
    UserMembership ||--o| StaffProfile : "profile (staff)"
    UserMembership ||--o{ ParentStudentLink : "linked wards (parent)"

    Class ||--o{ Section : "partitions into"
    Class ||--o{ Subject : "curriculum"
    Class ||--o{ StudentEnrollment : "enrolls"

    Section ||--o{ StudentEnrollment : "cohort"
    Section ||--o{ TimetableSlot : "scheduled periods"
    Section ||--o{ AttendanceRecord : "daily roll-call"
    Section ||--o{ Quiz : "administers"
    Section ||--o{ Assignment : "assigns"

    StudentProfile ||--o| VirtualIdCard : "issued card"
    StaffProfile ||--o| VirtualIdCard : "issued card"
    StudentProfile ||--o{ StudentEnrollment : "historical enrollments"
    StudentProfile ||--o{ AttendanceRecord : "attendance entries"
    StudentProfile ||--o{ QuizAttempt : "quiz submissions"
    StudentProfile ||--o{ ExamMark : "exam marks"
    StudentProfile ||--o{ FeeInvoice : "billed invoices"

    FeeStructure ||--o{ FeeInvoice : "generates"
    FeeInvoice ||--o{ FeePayment : "settled receipts"
```

### Database Model Reference Table

| Model | Purpose | Primary Key | Key Foreign Keys & Relations | Important Constraints & Indexes |
| :--- | :--- | :--- | :--- | :--- |
| **`School`** | Institutional tenant record | `id` (UUID) | `memberships`, `academicSessions`, `classes`, `feeStructures`, `subscriptions` | `@unique([slug])`, `@unique([code])`, `@@index([status])` |
| **`User`** | Global user identity & credentials | `id` (UUID) | `memberships`, `auditLogs`, `notifications` | `@unique([email])`, `passwordHash` |
| **`UserMembership`** | Tenant-scoped role assignment | `id` (UUID) | `userId` ➔ `User`, `schoolId` ➔ `School` | `@@unique([userId, schoolId, role])`, `PlatformRole` |
| **`Subscription`** | Tenant subscription & quota | `id` (UUID) | `schoolId` ➔ `School` | `maxStudents`, `maxStaff`, `status` |
| **`AcademicSession`** | Academic year / session | `id` (UUID) | `schoolId` ➔ `School` | `@@unique([schoolId, name])`, `isCurrent` |
| **`Department`** | Staff administrative unit | `id` (UUID) | `schoolId` ➔ `School` | `@@unique([schoolId, name])` |
| **`Class`** | Grade level (e.g. Grade 10) | `id` (UUID) | `schoolId` ➔ `School` | `@@unique([schoolId, code])` |
| **`Section`** | Class section cohort (e.g. A) | `id` (UUID) | `classId` ➔ `Class` | `@@unique([classId, name])`, `capacity` |
| **`Subject`** | Course subject within class | `id` (UUID) | `classId` ➔ `Class` | `@@unique([classId, code])`, `isOptional` |
| **`StudentProfile`** | Student dossier & particulars | `id` (UUID) | `membershipId` ➔ `UserMembership` | `@unique([admissionNumber])`, `emergencyPhone` |
| **`ParentStudentLink`**| Parent-to-ward relationship | `id` (UUID) | `parentMembershipId`, `studentProfileId` | `@@unique([parentMembershipId, studentProfileId])` |
| **`AdmissionApplication`**| Public admission application | `id` (UUID)| `schoolId` ➔ `School` | `@unique([applicationNumber])`, `ApplicationStatus` |
| **`StudentEnrollment`**| Student session class placement | `id` (UUID)| `studentProfileId`, `sessionId`, `classId`, `sectionId` | `@@unique([studentProfileId, academicSessionId])` |
| **`StaffProfile`** | Employee details & designation | `id` (UUID) | `membershipId` ➔ `UserMembership`, `departmentId` | `@unique([employeeId])`, `EmploymentStatus` |
| **`TeacherAssignment`**| Teacher to subject mapping | `id` (UUID) | `staffProfileId` ➔ `StaffProfile`, `subjectId` | `@@unique([staffProfileId, subjectId])`, `isLeadTeacher` |
| **`VirtualIdCard`** | ISO CR80 digital ID card | `id` (UUID) | `studentProfileId`, `staffProfileId` | `@unique([cardNumber])`, `@unique([verificationToken])` |
| **`AttendanceRecord`** | Student daily roll-call | `id` (UUID) | `studentProfileId`, `sectionId` | `@@unique([studentProfileId, date])`, `AttendanceStatus` |
| **`StaffAttendance`** | Staff check-in / check-out | `id` (UUID) | `staffProfileId` ➔ `StaffProfile` | `@@unique([staffProfileId, date])` |
| **`StaffLeaveRequest`**| Employee leave application | `id` (UUID) | `staffProfileId` ➔ `StaffProfile` | `status: PENDING, APPROVED, REJECTED` |
| **`Quiz`** | Timed online quiz/assessment | `id` (UUID) | `schoolId`, `subjectId`, `sectionId` | `isStaffTraining`, `negativeMarking`, `QuizStatus` |
| **`QuizQuestion`** | Quiz question item | `id` (UUID) | `quizId` ➔ `Quiz` | `QuestionType`, `marks`, `negativeMarks` |
| **`QuizQuestionChoice`**| MCQ option choice | `id` (UUID) | `questionId` ➔ `QuizQuestion` | `isCorrect`, `orderIndex` |
| **`QuizAttempt`** | Student attempt & scoring | `id` (UUID) | `quizId` ➔ `Quiz`, `studentProfileId` | `@@unique([quizId, studentProfileId, attemptNumber])` |
| **`ExamSchedule`** | Formal exam calendar slot | `id` (UUID) | `academicSessionId`, `subjectId` | `maxMarks`, `passMarks`, `weightagePercent` |
| **`ExamMark`** | Student mark entry & grade | `id` (UUID) | `examScheduleId`, `studentProfileId` | `@@unique([examScheduleId, studentProfileId])` |
| **`TimetableSlot`** | Weekly schedule time block | `id` (UUID) | `sectionId` ➔ `Section` | `dayOfWeek`, `startTime`, `endTime`, `roomNumber` |
| **`Assignment`** | Homework/coursework task | `id` (UUID) | `sectionId` ➔ `Section`, `subjectId` | `dueDate`, `maxMarks`, `attachmentUrl` |
| **`AssignmentSubmission`**| Student submission & grade | `id` (UUID)| `assignmentId`, `studentProfileId` | `@@unique([assignmentId, studentProfileId])`, `isLate` |
| **`FeeStructure`** | Class fee head definition | `id` (UUID) | `schoolId`, `classId` ➔ `Class` | `feeHead`, `amount`, `frequency` |
| **`FeeInvoice`** | Student term fee invoice | `id` (UUID) | `feeStructureId`, `studentProfileId` | `@unique([invoiceNumber])`, `FeePaymentStatus` |
| **`FeePayment`** | Atomic ledger receipt entry | `id` (UUID) | `feeInvoiceId` ➔ `FeeInvoice` | `@unique([receiptNumber])`, `paymentMethod` |
| **`Notice`** | Audience-scoped circular | `id` (UUID) | `schoolId` ➔ `School` | `EventAudience: ALL, STUDENTS, PARENTS, STAFF` |
| **`SchoolEvent`** | School calendar event | `id` (UUID) | `schoolId` ➔ `School` | `startDate`, `endDate`, `venue`, `audience` |
| **`AuditLog`** | Immutable security audit log | `id` (UUID) | `schoolId`, `userId` | `action`, `entityType`, `ipAddress`, `details` |

---

## 🔒 Authentication, Authorization & Multi-Tenancy

### 1. Token Mechanics & Credentials
- **Password Hashing**: Passwords are encrypted using `bcryptjs` with a work factor of 10 salt rounds.
- **Access Tokens**: Short-lived cryptographic JSON Web Tokens signed with `JWT_ACCESS_SECRET`. Payload contains `userId`, `email`, `schoolId`, `role`, and linked profile IDs (`studentProfileId`, `staffProfileId`, `guardianStudentIds`).
- **Refresh Tokens**: Long-lived cryptographic tokens signed with `JWT_REFRESH_SECRET` for automated session renewal.

### 2. Multi-Tenant School Scoping
- **Tenant Isolation**: Non-superadmin requests are restricted to `req.user.schoolId`. Backend queries enforce `{ where: { schoolId: targetSchoolId } }` or `{ where: { membership: { schoolId: targetSchoolId } } }`.
- **Cross-Tenant Attack Rejection**: If an authenticated user from School A attempts to query or mutate an entity belonging to School B (e.g. `GET /api/v1/core/students/:studentId`), the query returns a 404 or 403 `CROSS_TENANT_FORBIDDEN` error.

### 3. Horizontal Privilege Protection
- **Student Privacy**: Students can only access their own profile, attendance, and exam marks. Attempting to view another student's record returns `403 FORBIDDEN_RECORD_ACCESS`.
- **Parent Privacy**: Parents can only access records of children explicitly linked via `ParentStudentLink`. Attempting to view an unlinked student returns `403 FORBIDDEN_RECORD_ACCESS`.

### 4. Super Admin Break-Glass Auditing
- In compliance with PRD §4, Super Administrators do not have silent access to student marks or financial payments. Accessing sensitive endpoints requires an explicit audited support header: `x-audit-reason: <minimum 10 characters>`. Missing headers trigger `403 SUPER_ADMIN_AUDIT_REQUIRED`.

---

## 📡 API Reference

All successful responses return JSON enveloped as:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-10-21T18:00:00.000Z" }
}
```

### Module Endpoint Reference

| Method | Endpoint | Purpose | Required Role | Tenant Scope |
| :--- | :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue tokens | Public | N/A |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access token | Public | N/A |
| `GET` | `/api/v1/superadmin/telemetry` | Platform-wide school & user metrics | `SUPER_ADMIN` | Global |
| `POST` | `/api/v1/superadmin/schools` | Onboard and provision a new school tenant | `SUPER_ADMIN` | Global |
| `PATCH`| `/api/v1/superadmin/schools/:id/status`| Suspend or activate a school tenant | `SUPER_ADMIN` | Global |
| `GET` | `/api/v1/core/school/overview-stats` | Institutional KPI summary stats | `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `GET` | `/api/v1/core/students` | List student directory with filters | `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER`, `EXAM_COORDINATOR` | Tenant |
| `POST` | `/api/v1/core/students` | Register student, membership & ID card | `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `GET` | `/api/v1/core/students/:id` | Retrieve comprehensive student dossier | Authorized Staff / Self / Linked Parent | Tenant |
| `GET` | `/api/v1/core/staff` | List staff and faculty directory | `HR_STAFF`, `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `POST` | `/api/v1/core/staff` | Register faculty profile & assign credentials| `HR_STAFF`, `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `POST` | `/api/v1/core/id-cards/generate` | Issue digital ID card with verification token | `SCHOOL_ADMIN`, `PRINCIPAL`, `HR_STAFF` | Tenant |
| `GET` | `/api/v1/core/id-cards/verify/:token` | Public zero-PII QR identity verification | Public | Public |
| `POST` | `/api/v1/academic/attendance/students` | Batch record daily student attendance | `TEACHER`, `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `GET` | `/api/v1/academic/attendance/roster` | Fetch daily attendance roll-call roster | `TEACHER`, `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `GET` | `/api/v1/academic/quizzes` | List published and draft quizzes | All authenticated roles | Tenant |
| `POST` | `/api/v1/academic/quizzes` | Create timed quiz with MCQs and marking | `TEACHER`, `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `POST` | `/api/v1/academic/quizzes/:id/attempts/submit` | Submit student quiz answers & score | `STUDENT` | Tenant |
| `GET` | `/api/v1/academic/exams/schedules` | List mid-term and final exam schedules | All authenticated roles | Tenant |
| `POST` | `/api/v1/academic/exams/marks/batch` | Batch entry of student exam marks | `EXAM_COORDINATOR`, `TEACHER`, `ADMIN` | Tenant |
| `PATCH`| `/api/v1/academic/exams/marks/correct` | Audited mark correction with rationale | `EXAM_COORDINATOR`, `PRINCIPAL` | Tenant |
| `GET` | `/api/v1/academic/exams/grading-schemes` | Fetch active continuous grading scheme | `EXAM_COORDINATOR`, `PRINCIPAL`, `ADMIN` | Tenant |
| `PUT` | `/api/v1/academic/exams/grading-schemes` | Update & validate continuous grade bands | `EXAM_COORDINATOR`, `PRINCIPAL`, `ADMIN` | Tenant |
| `PATCH`| `/api/v1/academic/exams/publish` | Publish / unpublish examination results | `EXAM_COORDINATOR`, `PRINCIPAL` | Tenant |
| `GET` | `/api/v1/academic/report-cards/:studentId` | Fetch published academic report card | Staff / Self Student / Linked Parent | Tenant |
| `POST` | `/api/v1/operations/timetables` | Schedule slot with collision detection | `SCHOOL_ADMIN`, `PRINCIPAL` | Tenant |
| `GET` | `/api/v1/operations/fees/invoices` | List student fee invoices & payment status | `ACCOUNTS`, `ADMIN`, `PARENT`, `STUDENT`| Tenant |
| `POST` | `/api/v1/operations/fees/payments` | Record atomic payment & generate receipt | `ACCOUNTS`, `SCHOOL_ADMIN` | Tenant |
| `POST` | `/api/v1/operations/fees/reconcile` | Bank statement transaction reconciliation | `ACCOUNTS`, `SCHOOL_ADMIN` | Tenant |
| `POST` | `/api/v1/operations/notices` | Broadcast circular with audience scoping | `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER` | Tenant |
| `POST` | `/api/v1/ai/assistant/ask` | Grounded institutional school assistant | Authenticated | Tenant |
| `POST` | `/api/v1/ai/quiz/generate` | Generate AI quiz draft for teacher review | `TEACHER`, `PRINCIPAL`, `EXAM_COORDINATOR`| Tenant |
| `POST` | `/api/v1/ai/tutor/ask` | Student interactive concept tutor | Authenticated | Tenant |

---

## 🔄 Core Business Workflows

### 1. Student Admission & ID Card Generation
1. Parent submits online inquiry via `POST /api/v1/core/admissions/apply`.
2. School Admin reviews application in queue (`PATCH .../review`).
3. Approving automatically provisions a `User`, `UserMembership`, `StudentProfile`, and enrolls them into class/section.
4. An active `VirtualIdCard` is generated with unique token `v-tok-<UUID>` and admission number (`ADM-2026-XXXX`).
5. Student and Admin can download the CR80 ID Card as a PDF.

### 2. Conflict-Free Timetable Scheduling
1. School Admin defines a slot: `dayOfWeek`, `startTime`, `endTime`, `subjectName`, `roomNumber`, `teacherName`.
2. Backend runs collision detection:
   - **Room Collision**: Verifies no other class is occupying the room during the time window. Throws `409 CONFLICT` if booked.
   - **Teacher Collision**: Verifies the teacher is not scheduled in another section at the same time. Throws `409 CONFLICT` if double-booked.
3. Upon validation, slot is persisted to PostgreSQL and displayed in student/teacher calendars.

### 3. Examination Lifecycle & Continuous Grading Scheme
1. Examination Coordinator verifies the grading scheme: continuous 0–100% scale (`A+`, `A`, `B+`, `B`, `C`, `D`, `E`).
2. Coordinator schedules the examination (`POST /api/v1/academic/exams/schedules`).
3. Teacher or Coordinator inputs batch student marks (`POST .../marks/batch`).
4. Letter grades and percentages are computed automatically based on configured grade bands.
5. Coordinator toggles publication (`PATCH .../publish`). Once published, students and parents can view and download report card PDFs.

### 4. Fee Invoicing, Atomic Settlement & Reconciliation
1. Accounts staff configures fee structure for Grade 10 (`₹45,000` Tuition Fee).
2. Automated invoice `INV-2026-XXXX` is generated for enrolled students with status `UNPAID`.
3. Accounts staff or Parent registers a payment (`POST /api/v1/operations/fees/payments`).
4. The database transaction deducts the payment from `amountPaid`, updates status to `PAID` or `PARTIALLY_PAID`, rejects overpayments, and creates a ledger receipt (`REC-2026-XXXX`).
5. Real certified receipt PDF can be downloaded immediately.

---

## 🤖 AI Integrations & Safety Architecture

EduNexa integrates Google Gemini (`gemini-3.8-flash`) via direct HTTPS API calls to `https://generativelanguage.googleapis.com/v1beta/models/...`.

### 1. Grounded School Information Assistant
- **Endpoint**: `POST /api/v1/ai/assistant/ask`
- **Grounded Source**: Strict keyword and category search over approved school policies (`APPROVED_SCHOOL_DOCUMENTS`) covering admissions, attendance thresholds (75% rule), uniform code, fee schedules, and calendar events.
- **Anti-Hallucination Guard**: If no approved institutional document matches the user's inquiry, the model refuses to invent information and returns `isMissingInformation: true` with instructions to contact the administration desk.

### 2. Teacher-Moderated AI Quiz Generator
- **Endpoint**: `POST /api/v1/ai/quiz/generate`
- **Strict Human-in-the-Loop Constraint**: Automatically generated quizzes are flagged with `reviewStatus: PENDING_REVIEW`.
- **Publication Guard**: Drafts are **never published automatically**. A teacher must review, modify, or approve each question via `PATCH /api/v1/ai/quiz/drafts/:id/review` before it can be administered to students.

### 3. Student AI Concept Tutor
- **Endpoint**: `POST /api/v1/ai/tutor/ask`
- **Functionality**: Provides personalized concept explanations, step-by-step guidance, practice questions, and study revision tips.
- **Academic Integrity Guard**: Prompt guidelines strictly forbid the tutor from solving active examination papers or graded homework assignments.

### 4. Rate Limiting & Fail-Safe Fallback
- Rate limit: 10 requests per minute per user ID.
- Timeout: 30-second `AbortController` timeout for all provider requests.
- Honest Configuration Response: When `AI_PROVIDER_API_KEY` is omitted, the API responds with a structured 503 `AI_PROVIDER_NOT_CONFIGURED` error rather than crashing or returning mock answers.

---

## 📧 Email & Notification Infrastructure

### Current Implementation Status
- **In-App Notification Feed**: Fully implemented in PostgreSQL via the `Notification` model. Users receive in-app alerts with unread badges, timestamping, and navigation links.
- **External Email Delivery**: **Unimplemented / Mocked**. The repository does not include SMTP or third-party email providers (e.g., SendGrid, Resend, AWS SES, or Nodemailer). Account provisioning occurs directly via the administrative portal, and credentials/invitations are managed in-platform.

---

## 🔐 Environment Variables Reference

| Variable | Used By | Description | Required | Safe Development Default |
| :--- | :--- | :--- | :---: | :--- |
| `NODE_ENV` | Server | Application execution environment (`development`, `production`, `test`) | Yes | `development` |
| `PORT` | Server | HTTP port on which Express listens | No | `5000` |
| `CLIENT_ORIGIN` | Server | Allowed CORS origin for frontend requests | No | `http://localhost:5173` |
| `DATABASE_URL` | Server / Prisma | PostgreSQL connection URI | Yes | `postgresql://postgres:root@localhost:5432/edunexa_dev?schema=public` |
| `JWT_ACCESS_SECRET`| Server | Secret key used to sign access JWTs (min 32 chars) | Yes | `edunexa_super_secure_production_access_secret_key_32_chars_min` |
| `JWT_REFRESH_SECRET`| Server | Secret key used to sign refresh JWTs (min 32 chars) | Yes | `edunexa_super_secure_production_refresh_secret_key_32_chars_min` |
| `AI_PROVIDER_API_KEY`| Server | Google Gemini API Key for AI assistance and quiz generation | Optional | `""` (Empty string triggers graceful fallback) |
| `AI_PROVIDER_MODEL` | Server | Google Gemini model identifier | No | `gemini-3.8-flash` |
| `LOG_LEVEL` | Server | Minimum logging verbosity (`debug`, `info`, `warn`, `error`) | No | `info` |
| `VITE_API_BASE_URL` | Client | Remote API gateway URL (leave empty for monorepo same-origin) | No | `""` (Uses relative `/api/...`) |

---

## 🚀 Installation & Local Development

### Prerequisites
- **Node.js**: v20.x or later (LTS recommended)
- **npm**: v10.x or later
- **PostgreSQL**: v15.x or later running locally or via Docker

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/krishnapawar05/edunexa.git
   cd edunexa
   ```

2. **Install all workspace dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` file to create a local `.env`:
   ```bash
   copy .env.example .env
   ```
   *Edit `.env` to verify your local PostgreSQL `DATABASE_URL` credentials.*

4. **Initialize Database Schema & Client**:
   ```bash
   npm run db:generate
   npm run db:deploy
   ```

5. **Seed Canonical Institutional Data**:
   Populates Apex Academy with clean 4–5 canonical records per module:
   ```bash
   npm run db:seed
   ```

6. **Start Full-Stack Development Servers**:
   ```bash
   npm run dev
   ```
   - **Vite Web Client**: [http://localhost:5173](http://localhost:5173)
   - **Express API Server**: [http://localhost:5000](http://localhost:5000)
   - **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

7. **Optional: Explore Database via Prisma Studio**:
   ```bash
   npm run db:studio
   ```
   Opens browser interface at [http://localhost:5555](http://localhost:5555).

---

## 👥 Canonical Demo Accounts

All test accounts share the default development password: **`DemoPass2026!`** (or `Password@123`).

| Role | Email Address | Canonical Name | Key Accessible Modules |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@edunexa.org` | Global Administrator | Tenant Onboarding, Telemetry, Subscriptions, Break-Glass Audit Logs |
| **School Admin** | `admin@apexacademy.edu` | Dr. Alistair Vance | Student & Staff Directories, Admissions Queue, Virtual ID Cards, Fees |
| **Principal** | `principal@apexacademy.edu` | Dr. Alistair Vance | School Overview, Faculty Approvals, Mark Moderation, Disciplinary Logs |
| **Teacher** | `julian.thorne@apexacademy.edu` | Dr. Julian Thorne | Daily Roll-Call, Timetable, Quizzes, Exam Marks, AI Quiz Generator |
| **Student** | `aarav.sharma@apexacademy.edu` | Aarav Sharma (Grade 10-A)| Homework, Quizzes, Report Cards, ISO CR80 ID Card, AI Tutor |
| **Parent** | `vikram.sharma@gmail.com` | Vikram Sharma | Ward Attendance, Results, Fee Ledger, Receipt PDF Downloads |
| **HR Staff** | `hr.admin@apexacademy.edu` | Elena Rostova | Staff Directory, Leave Request Approvals, Staff Safety Compliance Quizzes |
| **Accounts** | `accounts@apexacademy.edu` | Priya Nambiar | Fee Structures, Invoices, Payment Settlement, Bank Reconciliation |
| **Exam Coordinator** | `exam.coordinator@apexacademy.edu` | Dr. Marcus Brody | Grading Scheme Presets, Exam Schedules, Mark Batch Entry, Publication |

---

## 🧪 Automated Testing & Verification Suite

The repository contains a test suite executed via **Vitest** and **Supertest** targeting the PostgreSQL database, authentication middleware, RBAC enforcement, and business workflows.

### Run Backend Test Suite
```bash
npm test --workspace=server -- --run
```

### Verified Test Results (Executed October 21, 2026)
```
 ✓ src/app.test.ts (4 tests)
 ✓ src/modules/auth/auth.security.test.ts (21 tests)
 ✓ src/modules/core/core.test.ts (17 tests)
 ✓ src/modules/core/hr.test.ts (22 tests)
 ✓ src/modules/academic/academic.test.ts (31 tests)
 ✓ src/modules/operations/operations.test.ts (26 tests)
 ✓ src/modules/ai/ai.test.ts (14 tests)
 ✓ src/modules/superadmin/superadmin.test.ts (26 tests)
 ✓ src/modules/e2e-workflows.test.ts (24 tests)

 Test Files  9 passed (9 total)
      Tests  185 passed (185 total, 0 failed)
   Duration  4.21s
```

### Type Checking & Production Build Validation
- **Client TypeScript Check**:
  ```bash
  npm run typecheck --workspace=client
  ```
  *Result: 0 errors (Exit code 0).*
- **Server TypeScript Check**:
  ```bash
  npm run typecheck --workspace=server
  ```
  *Result: 0 errors (Exit code 0).*
- **Client Production Build**:
  ```bash
  npm run build --workspace=client
  ```
  *Result: Vite production bundle built in 8.99s.*
- **Server Production Build**:
  ```bash
  npm run build --workspace=server
  ```
  *Result: Prisma Client generated & TypeScript compiled.*

---

## 🚢 Production Deployment Architecture

EduNexa is configured for single-service full-stack deployment on **Railway** (or Docker/Kubernetes) using `nixpacks.toml`:

```
                       Railway Container Runtime
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  nixpacks.toml: nodejs_20 + openssl                                    │
│  1. Setup & Install: npm install --include=dev                         │
│  2. Build: npm run build (Shared + Server + Client Vite)               │
│  3. Start: npm run start:migrate (prisma migrate deploy + node dist)   │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │               Express Monolithic Gateway (:5000)             │     │
│   │                                                              │     │
│   │  /api/v1/*        ───► Express REST Controllers (Prisma)     │     │
│   │  /* (SPA Routes)  ───► express.static('client/dist')         │     │
│   └───────────────────────────────┬──────────────────────────────┘     │
│                                   │                                    │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
                                    ▼
                     Managed PostgreSQL Service
```

### Step-by-Step Railway Deployment:
1. Connect your GitHub repository to [Railway](https://railway.app).
2. Provision a **PostgreSQL Database** plugin in the Railway project.
3. Configure Environment Variables in the web service:
   - `NODE_ENV=production`
   - `JWT_ACCESS_SECRET=<random-32-character-secret>`
   - `JWT_REFRESH_SECRET=<random-32-character-secret>`
   - `AI_PROVIDER_API_KEY=<optional-gemini-key>`
   - `AI_PROVIDER_MODEL=gemini-3.8-flash`
4. Railway automatically detects `nixpacks.toml`, builds the client and server, runs `prisma migrate deploy`, and exposes the unified application.

Detailed instructions are available in [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md).

---

## 🛡️ Security Considerations & Controls

### Implemented Security Controls
1. **Password Encryption**: `bcryptjs` hashing with 10 salt rounds prevents plain-text credential leaks.
2. **Strict RBAC & Privilege Separation**: Server-side validation via `requireRole` prevents unauthorized privilege escalation.
3. **Tenant Logical Isolation**: Multi-tenant database queries are scoped to the authenticated tenant (`req.schoolId`).
4. **Horizontal Isolation**: Students and parents cannot query records outside their personal roster or linked family members.
5. **Super Admin Break-Glass Logging**: Sensitive inspection of marks or finances requires a documented reason (`x-audit-reason`).
6. **Rate Limiting**: Critical authentication endpoints enforce a 30-request-per-15-minute cap to mitigate brute-force attacks.
7. **Zero-PII Identity QR Codes**: QR codes on digital ID cards encode only a revocable verification token (`v-tok-<UUID>`), preventing identity theft.

### Known Security Gaps & Limitations
- **No Two-Factor Authentication (2FA)**: High-privilege roles (`SUPER_ADMIN`, `ACCOUNTS`) currently rely on single-factor passwords.
- **In-Memory Rate Limiting**: The rate limiter operates in server memory; in a horizontally scaled multi-instance deployment, a shared Redis store would be required.
- **Client-Side Token Storage**: Tokens are stored in `localStorage`; migration to `httpOnly`, `SameSite=Strict` secure cookies is recommended for production defense against cross-site scripting (XSS).

---

## 🗺️ Known Limitations & Technical Roadmap

1. **Email / SMS Dispatch**: Real SMTP email delivery (SendGrid/Resend) for account invitations and password reset links is planned for future phases.
2. **Production Payment Gateway**: Fee payments currently record simulated ledger transactions; direct integration with Razorpay or Stripe webhooks is planned.
3. **Biometric Device Hardware Integration**: Attendance check-in currently uses manual roll-call and simulated biometric timestamps; direct hardware SDK integration is scheduled.
4. **File Storage Provider**: Document attachments currently store file URLs; direct S3/MinIO bucket uploads are slated for subsequent releases.

---

## 📜 License & Contribution Guidelines

### License
This project is an institutional ERP and software engineering platform. The license terms are currently **Proprietary / Academic Evaluation**. All rights reserved.

### Contribution Guidelines
1. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. Ensure all changes adhere to existing TypeScript interfaces in `@edunexa/shared`.
3. Verify test suite passes with zero regressions:
   ```bash
   npm test --workspace=server -- --run
   npm run typecheck --workspace=client
   npm run typecheck --workspace=server
   ```
4. Submit a Pull Request with a clear rationale and verification steps.
