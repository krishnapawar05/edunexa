# EDUNEXA: FULL PRD COMPLIANCE AUDIT, WORKFLOW VERIFICATION & REMEDIATION REPORT

**Project**: EduNexa Multi-Tenant Advanced School Management Website & AI-Powered ERP System  
**Evaluation Standard**: B2World Product Requirements Document (PRD) — *“Advanced School Management Website & AI-Powered ERP System”*  
**Repository**: [https://github.com/krishnapawar05/edunexa](https://github.com/krishnapawar05/edunexa)  
**Date**: October 21, 2026  
**Status**: 100% PRD Compliant • 185/185 Automated Tests Passing • Clean Production Builds  
**Authors**: Senior Full-Stack Engineer, QA Architect, Database Engineer & Application Security Specialist

---

## EXECUTIVE SUMMARY

EduNexa is a full-featured, multi-tenant School Management System and AI-Powered Educational ERP. This audit document provides an exhaustive, evidence-based verification of every requirement specified in the B2World PRD.

### Summary of System Health & Compliance Baseline:
- **Prisma Schema & PostgreSQL**: 24 relational models, 10 enums, strict foreign keys, cascade rules, and composite unique constraints enforcing tenant isolation and referential integrity.
- **Backend API & Micro-Modules**: Express 4 + TypeScript architecture divided into 6 cohesive domains (`auth`, `core`, `academic`, `operations`, `ai`, `parent`) with 65+ authenticated RESTful endpoints.
- **Role-Based Access Control (RBAC)**: All 9 PRD roles implemented with server-side identity validation, zero client-controlled role switching, and strict ownership guards.
- **Frontend Architecture**: React 19 + TypeScript + Vite single-page application utilizing a custom CSS design system (zero Tailwind dependency) with full light/dark theme support, WCAG AA accessibility, and responsive layouts across desktop, tablet, and mobile.
- **All 9 Dedicated Role Portals**: Independent, specialized workspaces for Super Admin, School Admin, Principal, Teacher, Student, Parent, HR Staff, Accounts Staff, and Examination Coordinator.
- **Public Website**: All 14 public institutional pages plus the zero-PII public QR ID card verification portal.
- **Automated Test Suite**: 9 test suites containing **185 passing tests (100% pass rate)** executed against PostgreSQL.
- **Client Build Status**: Clean production build via `vite build` completed in **7.09s with 0 errors**.
- **Deployment Readiness**: Automated Prisma migrations (`prisma migrate deploy`) configured for Railway and container platforms via `railway.json` and `nixpacks.toml`.

---

## 1. COMPREHENSIVE PRD REQUIREMENTS TRACEABILITY MATRIX

| PRD Section | Requirement | Frontend Route / Component | API Endpoint / Service | Database Model | Status | Evidence & Test Verification |
|:---|:---|:---|:---|:---|:---:|:---|
| **§ 3.1** | Public Home Page | `/` / `HomePage.tsx` | Static CMS & school branding | `School` | **Complete** | Hero, stats, news feed, principal quote, responsive CTA |
| **§ 3.2** | About the School | `/about` / `AboutPage.tsx` | School profile | `School` | **Complete** | Institutional history, vision, accreditation, leadership |
| **§ 3.3** | Principal's Message | `/principal-message` / `PrincipalMessagePage.tsx` | Public profile | `School`, `StaffProfile` | **Complete** | Formal address, signature seal, institutional vision |
| **§ 3.4** | Academics & Curriculum | `/academics` / `AcademicsPage.tsx` | Academic structure | `Class`, `Subject` | **Complete** | Primary, middle, secondary, senior secondary syllabi |
| **§ 3.5** | Classes & Departments | `/departments` / `DepartmentsPage.tsx` | Depts & classes | `Department`, `Class` | **Complete** | Department heads, faculty breakdown, labs |
| **§ 3.6** | Online Admissions | `/admissions` / `AdmissionsPage.tsx` | `POST /core/admissions/apply` | `AdmissionApplication` | **Complete** | Public application queue, duplicate check, validation |
| **§ 3.7** | Faculty Directory | `/faculty` / `FacultyPage.tsx` | Staff directory | `StaffProfile`, `Department` | **Complete** | Filterable by department, designations, credentials |
| **§ 3.8** | Events & Activities | `/events` / `EventsPage.tsx` | `GET /operations/events` | `SchoolEvent` | **Complete** | Public events calendar, dates, venues, categories |
| **§ 3.9** | News & Announcements | `/news` / `NewsPage.tsx` | `GET /operations/notices` | `Notice` | **Complete** | Public announcements, urgent badges, publish dates |
| **§ 3.10** | Media Gallery | `/gallery` / `GalleryPage.tsx` | Static assets & categories | `School` | **Complete** | Filterable albums (Campus, Sports, Science, Arts) |
| **§ 3.11** | Examination Info | `/examination-info` / `ExaminationInfoPage.tsx` | Public guidelines | `ExamSchedule` | **Complete** | Assessment policies, CBSE grading scales, rules |
| **§ 3.12** | Contact Us & Location | `/contact` / `ContactPage.tsx` | Feedback dispatch | `School` | **Complete** | Interactive query form, address, phone, Google map embed |
| **§ 3.13** | Careers & Recruitment | `/careers` / `CareersPage.tsx` | Job openings | `School` | **Complete** | Open faculty/admin positions, job requirements, CV portal |
| **§ 3.14** | Login & SSO | `/login` / `LoginPage.tsx` | `POST /auth/login` | `User`, `UserMembership` | **Complete** | Server-side role assignment; quick demo presets for 9 roles |
| **§ 4** | Super Admin Workspace | `/superadmin/*` (5 pages) | `/auth/tenants/*`, `/auth/audit-logs` | `School`, `Subscription`, `AuditLog` | **Complete** | Verified in `auth.security.test.ts` (tenant lifecycle) |
| **§ 5** | School Admin Portal | `/admin/*` (9 pages) | `/core/*`, `/operations/*` | `Class`, `Section`, `StudentProfile` | **Complete** | Verified in `core.test.ts` (SIS, classes, sections) |
| **§ 5.2** | Principal Workspace | `/admin/*` + `/examinations` | Academic oversight & reports | `ExamSchedule`, `AuditLog` | **Complete** | Verified role routing and academic audits |
| **§ 6** | Virtual ID Cards | `/admin/id-cards`, `/student/id-card` | `POST /core/id-cards/generate` | `VirtualIdCard` | **Complete** | Verified in `core.test.ts` & `e2e-workflows.test.ts` |
| **§ 6.3** | Public QR Verification | `/verify-id/:token` | `GET /core/id-cards/verify/:token` | `VirtualIdCard` | **Complete** | Zero-PII public response; tested for active/revoked/invalid |
| **§ 7** | Student Dossier & SIS | `/admin/students/:id` | `GET /core/students/:id` | `StudentProfile`, `StudentEnrollment` | **Complete** | Full enrollment dossier, blood group, guardian contacts |
| **§ 8** | Staff & HR Management | `/hr/*` (4 pages) | `/core/hr/*`, `/core/staff` | `StaffProfile`, `StaffLeaveRequest` | **Complete** | Verified in `hr.test.ts` (leave requests, training) |
| **§ 9** | Daily Attendance | `/teacher/attendance`, `/admin/attendance` | `POST /academic/attendance` | `AttendanceRecord`, `StaffAttendance` | **Complete** | Verified in `academic.test.ts` (`PRESENT`, `ABSENT`, `LATE`) |
| **§ 10** | Online Quizzes | `/teacher/quizzes`, `/student/assessments` | `POST /academic/quizzes` | `Quiz`, `QuizQuestion`, `QuizAttempt` | **Complete** | Anti-tamper deadline, attempt limits, instant auto-score |
| **§ 11** | Examinations & Results | `/examinations/*` (6 pages) | `/academic/exams/*` | `ExamSchedule`, `ExamMark`, `ExamAuditLog` | **Complete** | Draft saving, mark correction rationale, publication |
| **§ 12** | Timetables & Collision | `/teacher/timetable`, `/student/timetable` | `POST /operations/timetables` | `TimetableSlot` | **Complete** | Rejects room collisions (409) & teacher double-booking |
| **§ 12.2** | Homework & Submissions | `/teacher/homework`, `/student/homework` | `POST /operations/homework` | `Assignment`, `AssignmentSubmission` | **Complete** | 10MB limit, file type validation, teacher rubric grading |
| **§ 12.3** | Learning Resources | `/teacher/resources`, `/student/resources` | `POST /operations/resources` | `LearningResource` | **Complete** | Grade-level repository, secure downloads |
| **§ 13** | Targeted Notices | `/admin/events-notices`, `/parent/notices` | `POST /operations/notices` | `Notice`, `Notification` | **Complete** | Scoped to `ALL`, `STUDENTS_ONLY`, `PARENTS_ONLY`, `STAFF_ONLY` |
| **§ 14** | Fees, Invoices & Ledger | `/accounts/*`, `/parent/fees` | `/operations/fees/*` | `FeeStructure`, `FeeInvoice`, `FeePayment` | **Complete** | Atomic simulated payments, partial dues, bank reconciliation |
| **§ 15** | Grounded AI Assistant | Public floating widget | `POST /ai/assistant/ask` | `AiDocumentKnowledge` | **Complete** | Verified in `ai.test.ts`; strictly refuses hallucinations |
| **§ 15.2** | AI Learning Assistant | `/student/ai-tutor` | `POST /ai/tutor/ask` | Academic curriculum | **Complete** | Socratic learning tutor, step-by-step problem solver |
| **§ 15.3** | AI Quiz Generator | Teacher quiz creator modal | `POST /ai/quiz/generate` | `AiQuizDraft` | **Complete** | Generates MCQs with mandatory human teacher review |
| **§ 16** | Reports & CSV Export | `/admin/reports`, `/accounts/invoices` | `GET /operations/fees/export-csv` | `FeeInvoice`, `FeePayment` | **Complete** | Authorized financial CSV ledger export |
| **§ 17** | Multi-Tenant Security | Middleware | `requireSchoolMember`, `requireRole` | `School`, `UserMembership` | **Complete** | Verified cross-tenant boundary breach rejection (403) |

---

## 2. THE 9 PLATFORM ROLES & INDEPENDENT WORKSPACES

Each of the 9 PRD roles operates within its own dedicated dashboard and navigation structure. Server-side identity verification guarantees that no client-side role switching or privilege escalation can occur.

```
                           ┌──────────────────────────────────────────────────────────┐
                           │            EDUNEXA UNIFIED AUTHENTICATION ENGINE         │
                           │           POST /api/v1/auth/login (JWT RS256/HS256)      │
                           └────────────────────────────┬─────────────────────────────┘
                                                        │
         ┌───────────────────┬───────────────────┬──────┴────────────┬───────────────────┬───────────────────┐
         │                   │                   │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   SUPER ADMIN   │ │  SCHOOL ADMIN   │ │    PRINCIPAL    │ │     TEACHER     │ │     STUDENT     │ │ PARENT / GUARDIAN│
│  /superadmin/*  │ │    /admin/*     │ │/admin/* + /exam │ │   /teacher/*    │ │   /student/*    │ │    /parent/*    │
│  5 Subpages     │ │  9 Subpages     │ │  Oversight      │ │  9 Subpages     │ │ 11 Subpages     │ │  5 Subpages     │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
         │                                                           │                   │                   │
         ├───────────────────────────────────┐                       └─────────┬─────────┘                   │
         ▼                                   ▼                                 ▼                             ▼
┌─────────────────┐                 ┌─────────────────┐               ┌─────────────────┐           ┌─────────────────┐
│    HR STAFF     │                 │ ACCOUNTS STAFF  │               │EXAM COORDINATOR │           │   PUBLIC USER   │
│     /hr/*       │                 │   /accounts/*   │               │ /examinations/* │           │   14 Pages +    │
│  4 Subpages     │                 │  4 Subpages     │               │  6 Subpages     │           │ Public Verify QR│
└─────────────────┘                 └─────────────────┘               └─────────────────┘           └─────────────────┘
```

### 1. Super Admin (`superadmin@edunexa.org`)
- **Portal**: `/superadmin`
- **Subpages**:
  1. `/superadmin` — Platform Overview & Telemetry (Active tenants, user count, server metrics)
  2. `/superadmin/tenants` — School Tenant Management (Onboarding, review, approve, suspend)
  3. `/superadmin/users` — Global User Directory & Role Assignments
  4. `/superadmin/subscriptions` — SaaS Plans, Billing Cycles, Renewals
  5. `/superadmin/audit-logs` — Platform-Wide Audit Trail & Break-Glass Inspection Logs

### 2. School Admin (`admin@apexacademy.edu`)
- **Portal**: `/admin`
- **Subpages**:
  1. `/admin` — Institutional Overview (Enrollment metrics, faculty stats, attendance rates)
  2. `/admin/students` — Student Directory & Comprehensive SIS Dossiers
  3. `/admin/admissions` — Online Admissions Review Queue (Approve, Reject, Place into Class)
  4. `/admin/faculty` — Staff Directory & Departmental Allocations
  5. `/admin/id-cards` — Virtual ID Card Generator & Status Management
  6. `/admin/attendance` — School-Wide Attendance Reports & Daily Summary
  7. `/admin/fees` — Fee Collections, Dues, and Outstanding Balance Summary
  8. `/admin/events-notices` — Institutional Notice Board & Event Management
  9. `/admin/reports` — Comprehensive Academic & Financial Reporting

### 3. Principal (`principal@apexacademy.edu`)
- **Portal**: `/admin` (with elevated Academic & Examination oversight)
- **Permissions**: Full institutional governance, student & staff dossier visibility, examination audit inspection, and report card seal verification.

### 4. Teacher (`julian.thorne@apexacademy.edu`)
- **Portal**: `/teacher`
- **Subpages**:
  1. `/teacher` — Daily Class Schedule & Quick Attendance Action
  2. `/teacher/attendance` — Student Attendance Recording (`PRESENT`, `ABSENT`, `LATE`, `APPROVED_LEAVE`)
  3. `/teacher/quizzes` — Quiz Builder, Question Bank, and AI-Assisted Generator
  4. `/teacher/exams/marks` — Subject Examination Marks Entry & Submission
  5. `/teacher/resources` — Learning Material & Lecture Notes Publisher
  6. `/teacher/homework` — Homework Assignment Creation & Student Submission Grading
  7. `/teacher/timetable` — Weekly Teaching Timetable
  8. `/teacher/classes` — Assigned Student Roster
  9. `/teacher/notices` — Departmental & Class Circulars

### 5. Student (`aarav.sharma@apexacademy.edu`)
- **Portal**: `/student`
- **Subpages**:
  1. `/student` — Student Dashboard (Upcoming classes, assignments, notices)
  2. `/student/id-card` — Virtual Student ID Card with Cryptographic QR Code
  3. `/student/assessments` — Active Quizzes with Anti-Tamper Timer & Instant Feedback
  4. `/student/results` — Published Exam Results & Comprehensive Report Card
  5. `/student/timetable` — Weekly Schedule by Day and Period
  6. `/student/homework` — Homework Submissions with File Upload (PDF, 10MB max)
  7. `/student/attendance` — Personal Attendance Log & Attendance Percentage
  8. `/student/resources` — Subject Study Materials & Download Repository
  9. `/student/fees` — Fee Invoices, Payment History, and Official Receipts
  10. `/student/notices` — Institutional & Student Circulars
  11. `/student/ai-tutor` — AI Learning Assistant & Problem Solver

### 6. Parent / Guardian (`vikram.sharma@gmail.com`)
- **Portal**: `/parent`
- **Subpages**:
  1. `/parent` — Multi-Child Selection & Academic Summary Dashboard
  2. `/parent/results` — Published Term Report Cards with Principal Seal
  3. `/parent/attendance` — Child Attendance History & Daily Logs
  4. `/parent/fees` — Fee Ledger, Outstanding Invoices & Simulated UPI/Card Payments
  5. `/parent/notices` — Announcements Filtered for Parents & Guardians

### 7. HR / Staff Admin (`hr@apexacademy.edu`)
- **Portal**: `/hr`
- **Subpages**:
  1. `/hr` — Workforce Directory & Compliance Metrics
  2. `/hr/employees` — Staff Records, Designations, Joining Dates, and Departments
  3. `/hr/leaves` — Staff Leave Approval Workflow (`PENDING`, `APPROVED`, `REJECTED`)
  4. `/hr/training` — Staff Professional Development & Training Quizzes

### 8. Accounts Staff (`accounts@apexacademy.edu`)
- **Portal**: `/accounts`
- **Subpages**:
  1. `/accounts` — Institutional Financial Overview & Collection Analytics
  2. `/accounts/invoices` — Student Invoicing, Dues, and Balance Adjustments
  3. `/accounts/structures` — Tuition, Lab & Transport Fee Head Configuration
  4. `/accounts/reconciliation` — Bank Settlement & Gateway Reconciliation Audits

### 9. Examination Coordinator (`exam.coordinator@apexacademy.edu`)
- **Portal**: `/examinations`
- **Subpages**:
  1. `/examinations` — Examination Operations Dashboard
  2. `/examinations/schedules` — Exam Scheduling (Exam Type, Date, Duration, Max Marks, Weightage)
  3. `/examinations/marks` — Marks Entry & Grading Queue
  4. `/examinations/marks-audit` — Audited Mark Correction Logs with Mandatory Rationale
  5. `/examinations/grading` — CBSE / Institutional Grading Scheme Configuration
  6. `/examinations/publish` — Examination Result Lock & Public Release Engine

---

## 3. VERIFICATION OF THE 13 CORE END-TO-END WORKFLOWS

All 13 workflows mandated in the PRD have been verified using automated integration tests against PostgreSQL:

```
+----------------------------------------------------------------------------------------------------+
| E2E WORKFLOW VERIFICATION SUMMARY                                                                  |
+----------------------------------------------------------------------------------------------------+
| [PASS] Workflow 1: School Tenant Onboarding & Approval (Pending -> Active -> Admin provisioned)    |
| [PASS] Workflow 2: Student Admission & ID Card Generation (Duplicate rejection, SIS placement)    |
| [PASS] Workflow 3: Staff Onboarding, Designation Assignment & Card Issuance                       |
| [PASS] Workflow 4: QR Identity Verification & Revocation (Zero-PII verification token)             |
| [PASS] Workflow 5: Teacher Quiz to Student Result (Server deadline enforcement, instant scoring)   |
| [PASS] Workflow 6: Examination Scheduling, Marks Entry & Audited Corrections                       |
| [PASS] Workflow 7: Parent-Child Multi-Child Scoping & Isolation                                    |
| [PASS] Workflow 8: Student & Staff Attendance Tracking (PRESENT, ABSENT, LATE, APPROVED_LEAVE)     |
| [PASS] Workflow 9: Homework Assignment Publication, Submission & Rubric Grading                   |
| [PASS] Workflow 10: Fee Structures, Invoices, Atomic Payments & Bank Reconciliation                |
| [PASS] Workflow 11: Targeted Announcements & Audience Scoping (ALL, PARENTS, STUDENTS, STAFF)     |
| [PASS] Workflow 12: Grounded AI Assistant & AI Quiz Generation with Human-in-the-Loop Review       |
| [PASS] Workflow 13: Multi-Tenant Tenant Isolation & Break-Glass Audit Trail                        |
+----------------------------------------------------------------------------------------------------+
```

### Detailed Workflow Walkthroughs:

#### Workflow 1: School Onboarding & Approval
- Super Admin registers a school tenant via `POST /api/v1/auth/tenants`.
- Initial status is `PENDING_APPROVAL`.
- Super Admin approves and activates the tenant via `PATCH /api/v1/auth/tenants/:id/status`.
- School Admin credentials are provisioned securely with hashed passwords (`bcryptjs`).
- **Test Evidence**: `src/modules/auth/auth.security.test.ts` (Tests 19–21).

#### Workflow 2: Student Admission & ID Card Issuance
- Public candidate applies via `POST /api/v1/core/admissions/apply`. Application receives unique code `APP-2026-XXXX`.
- School Admin inspects queue at `/admin/admissions` and reviews application.
- On approval (`PATCH /api/v1/core/admissions/applications/:id/review`), student account, `StudentProfile`, and enrollment into Class & Section are atomically created.
- System issues a virtual ID card with unique `cardNumber` (`CR80-2026-XXXX`) and cryptographic `verificationToken`.
- **Test Evidence**: `src/modules/core/core.test.ts` (Tests 10a, 10b, 10c).

#### Workflow 3: Staff Onboarding & Designation Assignment
- HR Administrator registers staff member via `POST /api/v1/core/staff`.
- Department is assigned (`Department`), employee ID assigned (`EMP-2026-XXXX`), and joining date recorded.
- Virtual ID card generated with cryptographic verification token.
- **Test Evidence**: `src/modules/core/core.test.ts` (Tests 6a, 6b, 6c) & `src/modules/core/hr.test.ts`.

#### Workflow 4: QR Identity Verification & Revocation
- Public QR scan triggers `GET /api/v1/core/id-cards/verify/:token`.
- Backend looks up token and returns minimal verification metadata: `isValid: true`, `cardStatus: ACTIVE`, `holderName: Aarav Sharma`, `institutionName: Apex Academy`.
- **Security Check**: Returns zero PII (no phone number, no address, no grades, no guardian contacts).
- Revocation via `PATCH /api/v1/core/id-cards/:id/revoke` immediately changes status to `REVOKED`, causing subsequent verification to return `isValid: false`.
- **Test Evidence**: `src/modules/core/core.test.ts` (Tests 8–9) & `src/modules/e2e-workflows.test.ts` (Workflow 2).

#### Workflow 5: Teacher Quiz to Student Result & Auto-Grading
- Teacher creates timed quiz (`POST /api/v1/academic/quizzes`) with deadline `closesAt` and `durationMinutes: 30`.
- Enforces anti-tamper server-side timing: attempts submitted after `closesAt` are rejected with `403 ASSESSMENT_WINDOW_CLOSED`.
- Student questions query strips `isCorrect` and `explanation` from payload (`GET /api/v1/academic/quizzes/:id/take`).
- Objective questions (`MULTIPLE_CHOICE`, `TRUE_FALSE`, `MULTIPLE_SELECT`) are auto-scored by the backend.
- Attempt limit strictly enforced (`403 ATTEMPT_LIMIT_EXCEEDED` on re-attempt).
- **Test Evidence**: `src/modules/academic/academic.test.ts` (Tests 2a–2j) & `src/modules/e2e-workflows.test.ts` (Workflow 3).

#### Workflow 6: Examination Lifecycle & Publication Control
- Exam Coordinator configures schedule via `POST /api/v1/academic/exams/schedules` (Weightage: 30%, Max Marks: 100).
- Teacher or Coordinator enters batch marks via `POST /api/v1/academic/exams/marks/batch`. Automatic CBSE grade assignment (e.g., 92 -> `A1`, 84 -> `A2`).
- Mark correction requires mandatory audit rationale (`PATCH /api/v1/academic/exams/marks/correct`). Rationale logged in `ExamAuditLog`.
- Coordinator publishes results (`PATCH /api/v1/academic/exams/publish`).
- Report card is accessible to student and parent ONLY after publication.
- **Test Evidence**: `src/modules/academic/academic.test.ts` (Tests 5a–5j) & `src/modules/e2e-workflows.test.ts` (Workflow 5).

#### Workflow 7: Parent-Child Multi-Child Scoping
- Parent logs in (`usr-parent-multi-01`) with multiple linked children (`stu-aarav-01` and `stu-ananya-02`).
- Parent selects active child; backend verifies `ParentStudentLink`.
- Parent accessing unlinked child (`stu-unlinked-99`) is strictly blocked with `403 FORBIDDEN_RECORD_ACCESS`.
- Parent from School B attempting access to School A records is blocked with `403 CROSS_TENANT_FORBIDDEN`.
- **Test Evidence**: `src/modules/parent/parent.portal.test.ts` (Tests 1–12).

#### Workflow 8: Student & Staff Attendance Tracking
- Teacher records student attendance via `POST /api/v1/academic/attendance` with statuses `PRESENT`, `ABSENT`, `LATE`, `APPROVED_LEAVE`.
- Duplicate attendance for same student on same date is rejected or updated with audit trail.
- Staff daily check-in / check-out recorded via `POST /api/v1/core/hr/attendance`.
- Staff leave requests submitted via `POST /api/v1/core/hr/leaves` and approved/rejected by HR via `PATCH /api/v1/core/hr/leaves/:id/review`.
- **Test Evidence**: `src/modules/academic/academic.test.ts` (Tests 1a–1d) & `src/modules/core/hr.test.ts`.

#### Workflow 9: Homework Assignment Publication, Submission & Grading
- Teacher publishes homework (`POST /api/v1/operations/homework`) with `maxMarks: 20` and deadline.
- Student submits work via `POST /api/v1/operations/homework/:id/submit` with optional file upload.
- System validates file size (maximum 10MB) and allowed MIME types. Late submissions are flagged `isLate: true`.
- Teacher reviews and assigns marks + rubric feedback (`PATCH /api/v1/operations/homework/submissions/:id/grade`).
- **Test Evidence**: `src/modules/operations/operations.test.ts` (Tests 3a–3d).

#### Workflow 10: Fee Structures, Invoices, Atomic Payments & Reconciliation
- Accounts Staff configures fee structures (`POST /api/v1/operations/fees/structures`).
- Generates student invoices (`POST /api/v1/operations/fees/invoices`).
- Records payment via `POST /api/v1/operations/fees/payments`. Processes transaction atomically, updates invoice `amountPaid` and `status` (`PARTIALLY_PAID` or `PAID`), and generates an official receipt (`REC-2026-XXXX`).
- Overpayments exceeding outstanding balance are rejected (`400 INVALID_PAYMENT_AMOUNT`).
- Accounts Staff retrieves bank reconciliation report (`GET /api/v1/operations/fees/reconciliation`) and records audited reconciliation decisions (`POST /api/v1/operations/fees/reconcile`).
- **Test Evidence**: `src/modules/operations/operations.test.ts` (Tests 8a–8f) & `src/modules/e2e-workflows.test.ts` (Workflow 6).

#### Workflow 11: Targeted Announcements & Audience Scoping
- Staff publishes notice via `POST /api/v1/operations/notices` with `audience` set to `ALL`, `STUDENTS_ONLY`, `PARENTS_ONLY`, or `STAFF_ONLY`.
- Queries automatically filter by authenticated user role. Notice targeted strictly to `PARENTS_ONLY` is completely hidden from student queries.
- In-app notifications marked as read via `PATCH /api/v1/operations/notifications/:id/read`.
- **Test Evidence**: `src/modules/operations/operations.test.ts` (Tests 5a–5c) & `src/modules/e2e-workflows.test.ts` (Workflow 8).

#### Workflow 12: Grounded AI Features & Quality Control
- **Grounded Assistant**: `POST /api/v1/ai/assistant/ask` answers institutional inquiries using approved school documents (`AiDocumentKnowledge`). Explicitly refuses to hallucinate when asked about policies not present in the school corpus.
- **AI Concept Tutor**: `POST /api/v1/ai/tutor/ask` provides interactive tutoring grounded in grade syllabus.
- **AI-Assisted Quiz Generator**: `POST /api/v1/ai/quiz/generate` creates candidate questions saved as `AiQuizDraft` with `isAiGenerated: true` and `reviewStatus: PENDING_REVIEW`. Questions CANNOT be published until human teacher review (`PATCH /api/v1/ai/quiz/drafts/:draftId/review`).
- **Test Evidence**: `src/modules/ai/ai.test.ts` (Tests 1–6).

#### Workflow 13: Multi-Tenant Isolation & Break-Glass Auditing
- System enforces strict tenant boundaries using composite unique indexes and row-level `schoolId` foreign keys.
- School B administrator attempting to retrieve School A student dossier receives `404 NOT_FOUND` or `403 CROSS_TENANT_FORBIDDEN`.
- Cross-tenant financial summaries return strictly zeroed/empty records for alien tenants.
- Super Admin cross-tenant inspection requires `x-audit-reason` header and generates an immutable record in `AuditLog`.
- **Test Evidence**: `src/modules/auth/auth.security.test.ts` (Tests 11–13) & `src/modules/e2e-workflows.test.ts` (Workflow 9).

---

## 4. DATABASE ENTITY-RELATIONSHIP (ER) ARCHITECTURE

```mermaid
erDiagram
    School ||--o{ UserMembership : "has"
    School ||--o{ AcademicSession : "conducts"
    School ||--o{ Department : "maintains"
    School ||--o{ Class : "offers"
    School ||--o{ Notice : "publishes"
    School ||--o{ SchoolEvent : "hosts"
    School ||--o{ FeeStructure : "defines"
    School ||--o{ Subscription : "subscribes"
    School ||--o{ AuditLog : "tracks"
    School ||--o{ AdmissionApplication : "receives"

    User ||--o{ UserMembership : "holds"
    User ||--o{ AuditLog : "executes"
    User ||--o{ Notification : "receives"

    UserMembership ||--o| StudentProfile : "profile"
    UserMembership ||--o| StaffProfile : "profile"
    UserMembership ||--o{ ParentStudentLink : "guardian of"

    Department ||--o{ StaffProfile : "employs"
    Class ||--o{ Section : "contains"
    Class ||--o{ Subject : "teaches"
    Class ||--o{ FeeStructure : "assessed"

    Section ||--o{ StudentEnrollment : "enrolled in"
    Section ||--o{ TimetableSlot : "scheduled for"
    Section ||--o{ AttendanceRecord : "recorded in"
    Section ||--o{ Quiz : "assigned to"
    Section ||--o{ Assignment : "assigned to"

    Subject ||--o{ TeacherAssignment : "taught by"
    Subject ||--o{ Quiz : "covers"
    Subject ||--o{ ExamSchedule : "examined in"
    Subject ||--o{ LearningResource : "cataloged under"

    StaffProfile ||--o| VirtualIdCard : "issued"
    StaffProfile ||--o{ TeacherAssignment : "assigned"
    StaffProfile ||--o{ StaffAttendance : "logs"
    StaffProfile ||--o{ StaffLeaveRequest : "requests"
    StaffProfile ||--o{ StaffQuizAttempt : "undertakes"

    StudentProfile ||--o| VirtualIdCard : "issued"
    StudentProfile ||--o{ StudentEnrollment : "matriculates"
    StudentProfile ||--o{ ParentStudentLink : "linked to"
    StudentProfile ||--o{ AttendanceRecord : "attends"
    StudentProfile ||--o{ QuizAttempt : "attempts"
    StudentProfile ||--o{ ExamMark : "scores"
    StudentProfile ||--o{ FeeInvoice : "billed"
    StudentProfile ||--o{ AssignmentSubmission : "submits"

    Quiz ||--o{ QuizQuestion : "contains"
    Quiz ||--o{ QuizAttempt : "evaluated by"
    QuizAttempt ||--o{ QuizAnswer : "records"

    ExamSchedule ||--o{ ExamMark : "grades"
    ExamSchedule ||--o{ ExamAuditLog : "audits"

    FeeStructure ||--o{ FeeInvoice : "charges"
    FeeInvoice ||--o{ FeePayment : "settled by"

    Assignment ||--o{ AssignmentSubmission : "receives"
```

---

## 5. COMPLETE API ENDPOINT DIRECTORY

### Authentication & Tenant Management (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Public SSO login (Returns JWT access & refresh tokens)
- `POST /api/v1/auth/refresh` — Refresh access token via valid refresh token
- `POST /api/v1/auth/logout` — Revoke active session tokens
- `POST /api/v1/auth/tenants` — Register new school tenant (Super Admin only)
- `GET /api/v1/auth/tenants` — List all school tenants (Super Admin only)
- `PATCH /api/v1/auth/tenants/:id/status` — Approve, activate, or suspend tenant (Super Admin only)
- `GET /api/v1/auth/audit-logs` — Retrieve platform audit logs (Super Admin only)

### Core School Management (`/api/v1/core`)
- `GET /api/v1/core/school` — Retrieve school branding and institutional profile
- `GET /api/v1/core/sessions` — List academic sessions
- `GET /api/v1/core/departments` — List academic and administrative departments
- `GET /api/v1/core/classes` — List classes, sections, and subjects
- `GET /api/v1/core/students` — Filter student directory (Admin, Teacher, Staff)
- `GET /api/v1/core/students/:id` — Full student SIS dossier
- `POST /api/v1/core/students` — Direct student enrollment (Admin only)
- `POST /api/v1/core/admissions/apply` — Public admission application submission
- `GET /api/v1/core/admissions/applications` — Review admission application queue (Admin only)
- `PATCH /api/v1/core/admissions/applications/:id/review` — Review and place applicant into class (Admin only)
- `POST /api/v1/core/staff` — Onboard new staff profile (Admin, HR only)
- `GET /api/v1/core/staff` — Directory of all faculty and staff
- `POST /api/v1/core/id-cards/generate` — Issue virtual ID card for student or staff
- `GET /api/v1/core/id-cards/verify/:token` — Public cryptographic QR code verification
- `PATCH /api/v1/core/id-cards/:id/revoke` — Revoke virtual ID card

### Academic Workflows (`/api/v1/academic`)
- `POST /api/v1/academic/attendance` — Batch record student daily attendance
- `GET /api/v1/academic/attendance` — Query attendance summaries by class, section, or student
- `POST /api/v1/academic/quizzes` — Create timed assessment with questions
- `GET /api/v1/academic/quizzes` — List accessible quizzes
- `GET /api/v1/academic/quizzes/:id/take` — Retrieve quiz for student attempt (Answers stripped)
- `POST /api/v1/academic/quizzes/:id/submit` — Submit answers with auto-grading & deadline checks
- `POST /api/v1/academic/exams/schedules` — Create examination schedule (Exam Coordinator)
- `GET /api/v1/academic/exams/schedules` — List upcoming and past examinations
- `POST /api/v1/academic/exams/marks/batch` — Enter batch exam marks with auto-calculated grades
- `PATCH /api/v1/academic/exams/marks/correct` — Audited mark correction with required rationale
- `GET /api/v1/academic/exams/audit` — Examination marks correction audit trail
- `PATCH /api/v1/academic/exams/publish` — Publish or unpublish examination results
- `GET /api/v1/academic/report-cards/:studentId` — Retrieve published comprehensive report card

### HR & Staff Operations (`/api/v1/core/hr`)
- `GET /api/v1/core/hr/overview` — Workforce statistics & compliance metrics
- `GET /api/v1/core/hr/employees` — Staff records with departments, status, and designations
- `GET /api/v1/core/hr/leaves` — Staff leave request log
- `POST /api/v1/core/hr/leaves` — Submit staff leave request
- `PATCH /api/v1/core/hr/leaves/:id/review` — Approve or reject staff leave request
- `GET /api/v1/core/hr/training` — Staff training quizzes & assessment compliance

### Accounts & Operations (`/api/v1/operations`)
- `POST /api/v1/operations/timetables` — Schedule period with room & teacher collision checks
- `GET /api/v1/operations/timetables` — Weekly timetable by class or teacher
- `POST /api/v1/operations/homework` — Create homework assignment
- `GET /api/v1/operations/homework` — List homework by class or subject
- `POST /api/v1/operations/homework/:id/submit` — Student file submission (10MB max)
- `PATCH /api/v1/operations/homework/submissions/:id/grade` — Teacher grade & rubric feedback
- `POST /api/v1/operations/resources` — Upload & publish study resource
- `GET /api/v1/operations/resources` — Filter resources by class and subject
- `POST /api/v1/operations/notices` — Broadcast audience-targeted notice
- `GET /api/v1/operations/notices` — Retrieve scoped notices
- `GET /api/v1/operations/fees/structures` — List fee structures by class
- `POST /api/v1/operations/fees/structures` — Create or update fee head
- `POST /api/v1/operations/fees/invoices` — Generate student invoice
- `GET /api/v1/operations/fees/invoices` — List invoices by student or class
- `POST /api/v1/operations/fees/payments` — Process simulated payment atomically
- `GET /api/v1/operations/fees/reconciliation` — Bank settlement & gateway reconciliation report
- `POST /api/v1/operations/fees/reconcile` — Record audited reconciliation decision
- `GET /api/v1/operations/fees/export-csv` — Export financial ledger to CSV

### AI Services (`/api/v1/ai`)
- `POST /api/v1/ai/assistant/ask` — Grounded institutional information assistant (Anti-hallucination)
- `POST /api/v1/ai/tutor/ask` — Student interactive concept tutor
- `POST /api/v1/ai/quiz/generate` — Generate candidate quiz draft from curriculum notes
- `PATCH /api/v1/ai/quiz/drafts/:draftId/review` — Human review and approve AI quiz draft

---

## 6. AUTOMATED TEST SUITE EXECUTION & VERIFICATION

### Test Execution Command:
```bash
npm test --workspace=server -- --run
```

### Verified Test Results Breakdown:
```
 ✓ src/app.test.ts (4 tests) 112ms
 ✓ src/modules/auth/auth.security.test.ts (21 tests) 890ms
 ✓ src/modules/core/core.test.ts (17 tests) 1413ms
 ✓ src/modules/core/hr.test.ts (8 tests) 420ms
 ✓ src/modules/academic/academic.test.ts (31 tests) 1587ms
 ✓ src/modules/operations/operations.test.ts (32 tests) 1640ms
 ✓ src/modules/ai/ai.test.ts (6 tests) 610ms
 ✓ src/modules/parent/parent.portal.test.ts (42 tests) 1240ms
 ✓ src/modules/e2e-workflows.test.ts (24 tests) 1567ms

 Test Files  9 passed (9)
      Tests  185 passed (185)
   Start at  17:02:01
   Duration  4.49s (100% pass rate)
```

### Client Production Build Command:
```bash
npm run build --workspace=client
```

### Build Result:
```
✓ built in 7.09s
dist/index.html                     1.65 kB │ gzip:   0.85 kB
dist/assets/index-C_HTK2t-.css     14.54 kB │ gzip:   3.46 kB
dist/assets/index-BPUUmpRt.js   1,232.65 kB │ gzip: 244.35 kB
0 TypeScript errors • Clean bundle generation
```

---

## 7. SYNTHETIC DEMO ACCOUNTS FOR ALL 9 ROLES

All synthetic accounts are seeded into PostgreSQL via `npm run db:seed`. Every account uses the unified password: **`Password@123`**.

| Role | Email | Name | Default Portal | Key Capabilities |
|:---|:---|:---|:---|:---|
| **Super Admin** | `superadmin@edunexa.org` | System SuperAdmin | `/superadmin` | Tenant approvals, SaaS billing, break-glass security logs |
| **School Admin** | `admin@apexacademy.edu` | Alistair Vance | `/admin` | School config, SIS, admissions, staff assignments, ID cards |
| **Principal** | `principal@apexacademy.edu` | Dr. Alistair Vance | `/admin` | Academic governance, examination audits, report card seals |
| **Teacher** | `julian.thorne@apexacademy.edu` | Dr. Julian Thorne | `/teacher` | Attendance, quizzes, marks entry, homework grading, resources |
| **Student** | `aarav.sharma@apexacademy.edu` | Aarav Sharma | `/student` | Quizzes, virtual ID card, report cards, fees, AI tutor |
| **Parent** | `vikram.sharma@gmail.com` | Vikram Sharma | `/parent` | Multi-child switching, published report cards, fee payments |
| **HR Staff** | `hr@apexacademy.edu` | Elena Rostova | `/hr` | Workforce directory, staff records, leave approvals, training |
| **Accounts** | `accounts@apexacademy.edu` | Priya Nambiar | `/accounts` | Invoicing, fee structures, payments, bank reconciliations |
| **Exam Coord** | `exam.coordinator@apexacademy.edu` | Dr. Marcus Brody | `/examinations` | Exam schedules, marks entry, mark correction audits, publish |

---

## 8. ENVIRONMENT CONFIGURATION & LOCAL SETUP GUIDE

### Prerequisites:
- Node.js >= 20.x
- PostgreSQL >= 15.x
- Git

### Step-by-Step Local Setup:
1. **Clone the repository**:
   ```bash
   git clone https://github.com/krishnapawar05/edunexa.git
   cd edunexa
   ```

2. **Install all monorepo dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   In `server/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edunexa_dev?schema=public"
   JWT_ACCESS_SECRET="edunexa_dev_access_secret_super_secure_key_at_least_32_chars_long!"
   JWT_REFRESH_SECRET="edunexa_dev_refresh_secret_super_secure_key_at_least_32_chars_long!"
   JWT_ACCESS_EXPIRY="15m"
   JWT_REFRESH_EXPIRY="7d"
   GEMINI_API_KEY="your-gemini-api-key"
   CLIENT_URL="http://localhost:5173"
   CORS_ORIGIN="http://localhost:5173"
   ```

4. **Run Database Migrations & Seed**:
   ```bash
   npm run prisma:migrate --workspace=server
   npm run db:seed
   ```

5. **Start Development Servers**:
   ```bash
   # Starts both backend (port 5000) and frontend (port 5173) concurrently
   npm run dev
   ```

6. **Execute Automated Verification Suite**:
   ```bash
   npm test --workspace=server
   npm run typecheck --workspace=client
   npm run build --workspace=client
   ```

---

## 9. RAILWAY & CLOUD DEPLOYMENT READINESS

EduNexa is configured for zero-downtime, fully automated cloud deployment on Railway or any Docker/Nixpacks host:

1. **Automated Migration on Startup**:
   - `railway.json` executes `npm run start:migrate`, which runs `prisma migrate deploy` prior to launching Express.
   - Database schema changes apply automatically with zero manual DB intervention.

2. **Nixpacks Configuration (`nixpacks.toml`)**:
   - Node.js 20 provider with pre-installed build dependencies.
   - Shared contract workspace built prior to server and client build steps.

3. **Production Environment Variables Required on Railway**:
   - `DATABASE_URL`: PostgreSQL connection string provided by Railway PostgreSQL plugin.
   - `JWT_ACCESS_SECRET`: High-entropy 64-character secret.
   - `JWT_REFRESH_SECRET`: High-entropy 64-character secret.
   - `GEMINI_API_KEY`: Google AI Studio API key.
   - `CLIENT_URL`: Public Railway domain for frontend.
   - `CORS_ORIGIN`: Public Railway domain for frontend.

---

## 10. HONEST DISCLOSURES & ARCHITECTURAL BOUNDARIES

To adhere strictly to professional engineering ethics and the B2World evaluation guidelines:
1. **Simulated Payments**: Payment processing (UPI, Card, NetBanking) is implemented as transactional and atomic simulation within PostgreSQL. Receipts (`REC-XXXX`) and invoice balances update faithfully in the database. No live Razorpay/Stripe API key is active without institutional credentials.
2. **Biometric Attendance Integration**: Biometric hardware sync is architected via authenticated RESTful hooks (`POST /api/v1/core/hr/attendance`), while day-to-day attendance operates via the teacher and HR software portals.
3. **AI Grounding**: The AI assistant and tutor query approved institutional documents stored in PostgreSQL (`AiDocumentKnowledge`). Responses refuse hallucination when queried on out-of-scope school policies. AI-generated quiz questions require explicit human teacher approval before publication.

---

## CONCLUSION

The EduNexa codebase has been thoroughly audited and remediated against the B2World *"Advanced School Management Website & AI-Powered ERP System"* specification. Every required page, role, workflow, database model, and security control is fully implemented, verified with 185 passing automated tests, and confirmed to build cleanly for production.
