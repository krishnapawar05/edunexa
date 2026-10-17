# EduNexa — UI/UX Design System Specification (Stage 1)

**Platform:** EduNexa — Multi-Tenant School Management & AI-Powered ERP  
**Document Status:** Stage 1 Design System Specification & Component Library Baseline  
**Revision:** 1.0  

---

## 1. Visual Direction & Design Philosophy

EduNexa is crafted as a calm, trustworthy, authoritative institutional operating system. It avoids superficial design fads (neon glowing gradients, excessive glassmorphism, decorative blobs, cartoon cards, and inflated headings inside operational dashboards) in favor of crisp typography, structural contrast, and deliberate data density suitable for everyday school operations.

### Core Art Direction Principles:
1. **Primary Structural Foundation**: Deep Blue-Gray / Slate Navy (`#0F172A`, `#1E293B`, `#334155`) for the persistent application shell, dark sidebars, and high-level headers.
2. **Restrained Positive & Accent Colors**: Institutional Teal (`#0F766E` / hover `#115E59`) and Scholar Blue (`#1D4ED8` / `#2563EB`) reserved for confirmed positive states, primary actions, and verified credentials.
3. **Warm Neutral Canvas**: App canvas (`#F8FAFC`) with crisp, pure white surface cards (`#FFFFFF`) framed by subtle borders (`#E2E8F0`), creating clear separation without heavy shadows.
4. **Deliberate Typography Hierarchy**: Pairing **Plus Jakarta Sans** for crisp, geometric headers and **Inter** for dense, highly legible metric tables and operational data.
5. **No Interface Emojis**: 100% vector iconography via Lucide icons ensuring semantic clarity and professional institutional presentation.

---

## 2. Design Tokens Reference

All design tokens are implemented as CSS custom properties in [`client/src/styles/tokens.css`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/styles/tokens.css).

### Color Palette

| Token | Hex Value | Semantic Usage |
|---|---|---|
| `--ink-900` | `#0F172A` | Primary structural background (sidebar, dark banners) |
| `--ink-800` | `#1E293B` | High-level headers, dark modal headers |
| `--ink-700` | `#334155` | Secondary headings, authoritative section labels |
| `--ink-600` | `#475569` | Body subtext, active navigation icons |
| `--ink-500` | `#64748b` | Table column headers, helper notes |
| `--ink-400` | `#94A3B8` | Placeholder text, disabled icon states |
| `--ink-200` | `#E2E8F0` | Default component and card borders |
| `--ink-100` | `#F1F5F9` | Subtle background fills, alternating rows |
| `--ink-50` | `#F8FAFC` | App page canvas background |
| `--teal-accent` | `#0F766E` | Primary action buttons, positive badges, verified status |
| `--teal-hover` | `#115E59` | Active hover state for primary action buttons |
| `--teal-subtle` | `#F0FDFA` | Subtle background for verified tags and metric pills |
| `--brand-blue` | `#2563EB` | Institutional brand accent, active navigation items |
| `--success-solid`| `#059669` | Verified badges, attendance present indicators |
| `--warning-solid`| `#D97706` | Pending items, exam close warnings, partial fee dues |
| `--danger-solid` | `#DC2626` | Absent status, overdue fees, card revocation |
| `--info-solid` | `#0284C7` | Public notices, institutional announcements |

### Typography Scale

| Style Level | Font Family | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| **Display H1** | Plus Jakarta Sans | 3.2rem (45px) | 800 | 1.15 | -0.03em |
| **Page H2** | Plus Jakarta Sans | 1.85rem (26px) | 700 | 1.25 | -0.02em |
| **Section H3** | Plus Jakarta Sans | 1.45rem (20px) | 700 | 1.25 | -0.02em |
| **Card Header** | Plus Jakarta Sans | 1.05rem (15px) | 600 | 1.30 | -0.01em |
| **Body Regular**| Inter | 0.88rem (12.5px) | 400 | 1.55 | Normal |
| **Body Medium** | Inter | 0.88rem (12.5px) | 500 | 1.55 | Normal |
| **Table Head** | Inter | 0.82rem (11.5px) | 600 | 1.20 | 0.02em |
| **Monospace** | JetBrains Mono / SF Mono | 0.80rem (11px) | 600 | 1.20 | Normal |

### Architectural Radii & Shadows
- **Corner Radii**: `--radius-xs: 3px;` `--radius-sm: 5px;` `--radius-md: 7px;` `--radius-lg: 10px;` `--radius-pill: 9999px;`
- **Elevations**:
  - `--shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.04);`
  - `--shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.08);`
  - `--shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.07);`
  - `--shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.07);`

---

## 3. Information Architecture Across 8 User Roles

EduNexa implements role-specific navigation menus tailored to each role's daily duties rather than giving every user an identical sidebar:

```
1. Platform Super Admin:
   ├── Platform Telemetry (Tenant status, system health)
   ├── School Tenants (Onboard, activate, suspend schools)
   ├── Subscriptions & Plans (Plan management, renewals)
   ├── Administrative Audit Logs (Security forensics)
   └── Platform Settings (Global flags, LLM configs)

2. School Admin & Principal:
   ├── School Overview (Enrollment, fee realized, faculty stats)
   ├── Student Directory & SIS (Enrollments, dossiers, admissions)
   ├── Faculty & HR (Staff profiles, department heads)
   ├── Virtual ID Cards & QR (Batch issuance, print, revoke)
   ├── Daily Attendance (School-wide attendance sheets)
   ├── Fees & Invoices (Fee structures, invoice ledger)
   └── Events & Notices (School calendar and announcements)

3. Teacher:
   ├── Teacher Schedule (Today's classes, timetable slots)
   ├── Mark Attendance (1-click class attendance register)
   ├── Online Quizzes (Question bank, create/grade quizzes)
   ├── Exam Marks Entry (Spreadsheet mark entry & audit)
   └── Study Resources (Upload lecture notes, worksheets)

4. Student:
   ├── Student Dashboard (GPA, attendance percentage, today's schedule)
   ├── My Virtual ID Card (ISO CR80 preview & QR verification)
   ├── Assessments & Quizzes (Active quiz runner with server countdown)
   ├── Academic Results (Subject breakdown, published report cards)
   └── AI Learning Assistant (Curriculum-aligned concept explainer)

5. Parent / Guardian:
   ├── Sibling Profile Switcher (Aarav Sharma vs. Maya Sharma)
   ├── Published Report Cards (Term marks, teacher feedback)
   ├── Attendance Records (Monthly and cumulative stats)
   ├── Fee Payments & Invoices (Invoice balance, simulated checkout)
   └── School Notices (Class and institutional updates)

6. Examination Coordinator:
   ├── Exam Workspace (Exam terms, schedules)
   ├── Examination Schedules (Max marks, pass marks, weightage)
   ├── Marks Entry Audit (Inspection of entered marks sheets)
   ├── Grading Schemes (Grading boundaries: A+, A, B, C, D, F)
   └── Publish Results (School-wide result lock and publishing)

7. HR / Staff Admin:
   ├── HR Directory (Employee profiles, designations)
   ├── Staff Records (Employment contracts, emergency contacts)
   ├── Leave Requests (Approval workflows, leave quotas)
   └── Staff Training Quizzes (Cybersecurity & workplace policy assessments)

8. Accounts Staff:
   ├── Financial Overview (Collection trends, outstanding dues)
   ├── Fee Structures (Class-wise and term-wise tuition rules)
   ├── Student Invoices (Batch generation, discount adjustments)
   └── Payment Receipts (Sequential receipt issuance, reconciliations)
```

---

## 4. Representative Prototype Screens Implemented

The frontend prototype (`http://localhost:5173/`) implements the 7 mandatory representative screens:

1. **Public School Website Homepage (`PublicSchoolWebsite.tsx`)**:
   - Dynamic institutional branding (*Apex Academy of Sciences & Arts*).
   - 14-page navigation bar (Home, About, Academics, Admissions, Faculty, Events, News, Gallery, Exams, Contact, Careers, Login).
   - Academic STEM pathways spotlight and announcements ticker.
   - Interactive **Online Admission Application Modal** with instant field validation.

2. **Institutional Login Page (`LoginPage.tsx`)**:
   - Institutional portal credentials form.
   - One-click demo role fast-switcher for instantaneous reviewer evaluation.
   - Direct connection to backend `POST /api/v1/auth/login`.

3. **Super Admin Dashboard (`SuperAdminDashboard.tsx`)**:
   - System-wide metric tiles (Tenants, total students, platform staff, subscription health).
   - School directory table with live search and status filters (`ACTIVE` / `SUSPENDED`).
   - Interactive **Onboard New School Tenant Modal** generating isolated tenant namespaces.

4. **School Admin Dashboard & SIS (`SchoolAdminDashboard.tsx`)**:
   - Institutional metric tiles (Total enrollment, faculty attendance rate, fee realization).
   - Representative Student Management Workflow: Search, filter by grade, enroll new student with unique admission number generation, and inspect detailed student dossiers.

5. **Teacher Schedule & Assessment Creator (`TeacherDashboard.tsx`)**:
   - Today's teaching schedule with classroom locations.
   - Fast 1-click student attendance register.
   - Online quiz submission tracker and **Create Assessment Modal** with server countdown configuration.

6. **Examination Marks & Grade Calculation Workflow (`ExaminationWorkflow.tsx`)**:
   - Assessment term selector and class/subject filter.
   - Spreadsheet mark entry table with live grade computation (A+, A, B, C, D, F).
   - Absent and Exempt status toggle buttons.
   - Save Draft button and **Lock & Publish Marks Modal** with confirmation warnings.

7. **Parent & Guardian Academic Dashboard (`ParentDashboard.tsx`)**:
   - Sibling profile switcher (switching seamlessly between Aarav Sharma [Grade 10-A] and Maya Sharma [Grade 7-B]).
   - Published report cards with subject grades.
   - Fee invoice tracker with **Simulated Fee Payment Checkout Modal** producing sequential receipts.

8. **HR / Staff Admin Dashboard (`HrStaffDashboard.tsx`)**:
   - Institutional staff metric tiles (Total workforce, faculty on duty, pending leaves, safeguarding training compliance).
   - Staff directory table with search, department filtering (Science, Mathematics, Humanities, ICT, Admin), employment contracts, and designations.
   - Interactive leave requests approval/decline panel with real-time feedback.
   - Staff compliance progress bars for Child Protection & AI Literacy.
   - Modal for onboarding new faculty/staff members with employee ID generation (`EMP-2026-XXXX`).

9. **Accounts Staff Dashboard (`AccountsDashboard.tsx`)**:
   - Financial telemetry tiles (Total invoiced, realized revenue, collection percentage, outstanding arrears).
   - Filterable student fee ledger across grades with `PAID`, `PARTIAL`, and `OVERDUE` badges.
   - Interactive **Record Payment & Issue Receipt Modal** generating sequential receipts (`REC-2026-XXXX`) with print-ready receipts.
   - Approved class-wise quarterly fee structures overview and automated bank clearing reconciliation status.

---

## 5. Dynamic School Identity Configuration Engine

To fulfill the PRD mandate (*"The school name and identity must be configurable; do not finalize a demo school's branding without approval."*), EduNexa implements a reactive branding system powered by [`SchoolBrandingContext`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/context/SchoolBrandingContext.tsx) and [`SchoolIdentityModal`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/SchoolIdentityModal.tsx):

- **Live In-App Branding Switcher**: Users and reviewers can click the **Branding Badge** in the top header or on the public website to live-customize:
  - Official School Name (e.g. *Apex Academy of Sciences & Arts*, *St. Jude International Academy*, *Greenwood World School*)
  - Short Name & School Code (`APX-01`, `SJA-09`, `GWS-22`)
  - Single-character Crest Monogram (`A`, `J`, `G`)
  - Institutional Tagline / Motto
  - Board Affiliation & Accreditation
  - Primary Accent Color (`#0F766E` Institutional Teal, `#1E3A8A` Scholar Navy, `#065F46` Forest Emerald, `#881337` Royal Crimson)
  - Admissions Email, Phone & Campus Physical Address
- **Instant Global Propagation**: Modifying branding immediately updates the public website navbar, hero banners, dashboard headers, tenant chips, student ID cards, and official receipts without requiring a page reload.

---

## 6. Reusable Component System

A modular library of typed, accessible components is located under [`client/src/components/ui/`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/ui/):

| Component | File | Description & Capabilities |
|---|---|---|
| **Badge** | [`Badge.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/ui/Badge.tsx) | Semantic status pill supporting `success`, `warning`, `danger`, `info`, `teal`, and `neutral` states with optional icons. |
| **Button** | [`Button.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/ui/Button.tsx) | Action button supporting `primary`, `secondary`, `danger`, `ghost`, and `outline` variants, multiple sizes (`sm`, `md`, `lg`), and built-in loading spinners. |
| **Modal** | [`Modal.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/ui/Modal.tsx) | Accessible dialog with backdrop blur, escape key dismiss listener, custom headers, scrollable body, and sticky action footers. |
| **Tabs** | [`Tabs.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/ui/Tabs.tsx) | Accessible tab navigation with active accent indicators, icons, and dynamic count badges. |
| **Pagination** | [`Pagination.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/ui/Pagination.tsx) | Record range counter, previous/next controls, and page indicator for operational data tables. |
| **EmptyState** | [`EmptyState.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/ui/EmptyState.tsx) | Consistent empty states featuring clean vector icons, guidance subtext, and clear call-to-action buttons. |
| **Toast** | [`Toast.tsx`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/client/src/components/Toast.tsx) | Floating notification toast for positive confirmation and security alerts. |

---

## 7. Responsive Behavior & Accessibility Standards

- **Mobile Drawer Navigation**: Top bar features an accessible hamburger toggle (`.ed-mobile-toggle`) on viewports under `768px` that slides in the complete role-specific sidebar drawer (`.ed-sidebar-mobile-open`) with a dimmed backdrop overlay and keyboard escape dismissal.
- **Focus Rings**: Explicit `:focus-visible` outline rings (`2px solid var(--border-focus)`) with `2px` offset on all interactive buttons, inputs, and tabs.
- **Color Contrast**: All primary text (`#0F172A`) on white (`#FFFFFF`) achieves a contrast ratio of `16.1:1` (exceeding WCAG AAA `7:1`). Teal accent (`#0F766E`) achieves `4.8:1` (exceeding WCAG AA `4.5:1`).
- **Feedback States**: Complete support for loading states (`disabled`, spinner indicators), empty states, error alerts, and success confirmations.

