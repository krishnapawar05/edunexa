# EDUNEXA: DEMO DATA CLEANUP, GRADING SCHEME REPAIR & QUALITY AUDIT REPORT

**Project**: EduNexa Multi-Tenant Advanced School Management Website & AI-Powered ERP System  
**Canonical Demo Institution**: Apex Academy of Sciences & Arts (`apex-academy`)  
**Date**: October 21, 2026  
**Auditor**: Senior Full-Stack Engineer, QA Architect, Database Engineer & UI/UX Specialist  

---

## 1. EXECUTIVE AUDIT & BASELINE FINDINGS

A systematic inspection was conducted across the PostgreSQL database, Prisma schema, seed scripts, backend controllers, frontend views, and PDF/document actions.

### 1.1 Development Database State & Data Bloat Analysis
A query of the active development PostgreSQL database revealed extensive data bloat caused by test runs, non-deterministic identifiers, and repeated legacy seeds:

| Entity / Model | Current DB Count | Target Demo Count | Root Cause of Discrepancy |
|:---|:---:|:---:|:---|
| **School Tenants** | **50** | **2** (1 Demo + 1 Isolated) | Automated integration tests create transient schools (`sch-test-*`) that were never pruned. |
| **User Accounts** | **272** | **~15** (9 roles + 5 students + 4 parents) | Multiple test runs generating ephemeral student/staff emails. |
| **Student Profiles** | **142** | **5** (Grade 9, 10, 11) | Repeated test registrations and unlinked orphan profiles. |
| **Staff Profiles** | **67** | **5** (Principal, HR, Accounts, Exam, Teachers) | Ephemeral faculty accounts generated in testing without cleanup. |
| **Quizzes** | **73** | **4–5** (Physics, Math, Chem, CS) | Test fixtures persisted in development database. |
| **Examination Schedules** | **74** | **4–5** (Mid-term examinations) | Accumulated schedule rows from automated test cycles. |
| **Exam Marks Records** | **120** | **~15** (3–4 subjects x 4 students) | Legacy test runs inserting disconnected mark rows. |
| **Notices & Circulars** | **104** | **5** (All, Students, Parents, Staff) | Every test run created notices with random titles. |
| **Virtual ID Cards** | **51** | **~10** (5 students + 5 staff) | Old cards generated with random card numbers. |
| **Staff Leave Requests** | **68** | **4–5** (Pending, Approved, Rejected) | Test runs submitting synthetic leave requests without cleanup. |
| **Attendance Records** | **71** | **~20** (4 students x 5 days) | Redundant date entries from test suites. |
| **Fee Invoices & Payments** | **5** | **5 Invoices, 4 Receipts** | Already close to target, needs relationship alignment. |

### 1.2 Grading Scheme Defects & Gaps
- **Missing Grade Bands**: The Examination Coordinator's Grading Schemes page rendered inconsistent grade boundaries where standard letter bands such as `A+` and `B+` were missing.
- **Root Cause**: The hardcoded default in `academic.service.ts` used the CBSE 9-Point scale (`A1, A2, B1, B2, C1, C2, D, E`), but lacked support for the widely expected **Letter Grade Scale with Plus (`A+, A, B+, B, C, D, E`)**.
- **Missing Restore Capability**: There was no button to restore the official standard scheme if custom edits corrupted the boundaries or deleted bands.
- **Validation Deficiencies**: The frontend allowed saving disjointed ranges without validating continuous 0%–100% coverage, and backend validation did not reject gaps or overlapping bands.

### 1.3 PDF & Document Generation Audit
- **Virtual ID Cards**: Save/Print action merely triggered `window.print()` instead of generating a high-resolution, downloadable identity card PDF (`id-card-<admissionNo>.pdf`).
- **Fee Payment Receipts**: The parent and accounts portals displayed a receipt modal with a print button calling `window.print()`, but lacked a true PDF download (`fee-receipt-<receiptNo>.pdf`).
- **Student Report Cards**: The results view displayed an HTML modal without an official downloadable PDF report card (`report-card-<studentId>.pdf`).
- **Invoices**: Invoices could be viewed as tables or CSV, but lacked printable/downloadable PDF invoices (`fee-invoice-<invoiceNo>.pdf`).

### 1.4 Digital ID Card Design & QR Verification Audit
- **Layout & Visual Hierarchy**: The existing ID card was displayed inside a crowded card layout with small text, generic border treatments, and an oversized QR code that crowded out important details.
- **Design Standard**: Needs alignment with CR80 standard dimensions (3.375" × 2.125"), crisp institutional header, student/staff photograph fallback avatar, clear blood group, emergency contact, issue date, valid until date, and a prominent status pill (`ACTIVE`).
- **QR Security**: The verification token mechanism (`v-tok-<UUID>`) is secure and returns zero PII at `/verify-id/:token`. The card redesign must preserve this zero-PII guarantee.

---

## 2. CLEANUP & CONSOLIDATION STRATEGY

### 2.1 Target Synthetic Dataset (Apex Academy of Sciences & Arts)

We will prune all orphan/ephemeral test data from the development database and seed exactly **4–5 coherent records per domain**:

```
                                  APEX ACADEMY CANONICAL DATASET
                                  
       STUDENTS (5)                       STAFF & FACULTY (5)                  COURSES & EXAMS (4-5)
  ┌───────────────────────┐             ┌───────────────────────┐             ┌───────────────────────┐
  │ 1. Aarav Sharma (10-A)│             │ 1. Dr. Alistair Vance │             │ 1. Physics (Mid-Term) │
  │ 2. Ananya Deshmukh(10A│             │    (Principal)        │             │ 2. Mathematics        │
  │ 3. Rohan Verma (10-B) │             │ 2. Dr. Julian Thorne  │             │ 3. Chemistry          │
  │ 4. Meera Iyer (9-A)   │             │    (Senior Science)   │             │ 4. English Literature │
  │ 5. Kabir Sen (11-A)   │             │ 3. Mrs. Rebecca Vance │             └───────────────────────┘
  └───────────┬───────────┘             │    (Senior Math)      │
              │                         │ 4. Elena Rostova (HR) │
              ▼                         │ 5. Priya Nambiar (Acc)│
       GUARDIANS (4)                    │ 6. Dr. Marcus Brody   │
  ┌───────────────────────┐             │    (Exam Coordinator) │
  │ 1. Vikram Sharma      │             └───────────────────────┘
  │ 2. Priya Deshmukh     │
  │ 3. Rajesh Verma       │
  │ 4. Sunita Iyer        │
  └───────────────────────┘
```

#### Detailed Breakdown of Canonical Records:
1. **5 Students across 3 Classes**:
   - `Aarav Sharma` (Grade 10-A, `ADM-2026-0042`, Roll #1, Blood Group: O+)
   - `Ananya Deshmukh` (Grade 10-A, `ADM-2026-0089`, Roll #2, Blood Group: B+)
   - `Rohan Verma` (Grade 10-B, `ADM-2026-0104`, Roll #1, Blood Group: A+)
   - `Meera Iyer` (Grade 9-A, `ADM-2026-0155`, Roll #1, Blood Group: AB+)
   - `Kabir Sen` (Grade 11-A, `ADM-2026-0210`, Roll #1, Blood Group: O-)

2. **5 Staff Profiles (Key Roles)**:
   - `Dr. Alistair Vance` (`EMP-2026-0001`, Principal & Head of School)
   - `Dr. Julian Thorne` (`EMP-2026-0012`, Senior Physics Faculty & Science Dept Head)
   - `Mrs. Rebecca Vance` (`EMP-2026-0014`, Senior Mathematics Faculty)
   - `Elena Rostova` (`EMP-2026-0005`, HR Director & Staff Admin)
   - `Priya Nambiar` (`EMP-2026-0008`, Bursar & Finance Officer)
   - `Dr. Marcus Brody` (`EMP-2026-0009`, Examination Coordinator)

3. **5 Fee Structures & Invoices**:
   - `INV-2026-0412` (Aarav Sharma: ₹45,000 Due, ₹45,000 Paid in full via UPI, `REC-2026-4011`)
   - `INV-2026-0413` (Ananya Deshmukh: ₹45,000 Due, ₹20,000 Paid via Card, ₹25,000 Outstanding, `REC-2026-4012`)
   - `INV-2026-0414` (Rohan Verma: ₹45,000 Due, ₹0 Paid, Status: UNPAID)
   - `INV-2026-0301` (Meera Iyer: ₹32,000 Due, ₹32,000 Paid in full via NetBanking, `REC-2026-3001`)
   - `INV-2026-0501` (Kabir Sen: ₹40,000 Due, ₹40,000 Paid in full via Cheque, `REC-2026-5001`)

4. **4 Active & Past Examination Schedules**:
   - `Mid-Term Examination 2026: Physics` (Grade 10, Max: 100, Weight: 30%, Status: PUBLISHED)
   - `Mid-Term Examination 2026: Mathematics` (Grade 10, Max: 100, Weight: 30%, Status: PUBLISHED)
   - `Mid-Term Examination 2026: Chemistry` (Grade 10, Max: 100, Weight: 30%, Status: PUBLISHED)
   - `Mid-Term Examination 2026: English Literature` (Grade 10, Max: 100, Weight: 30%, Status: SCHEDULED)

5. **4 Quizzes & Timed Online Assessments**:
   - `Physics Chapter 4: Electromagnetism & Induction` (Grade 10, 30 min, 20 marks, Published)
   - `Mathematics Unit Test: Quadratic Equations` (Grade 10, 45 min, 25 marks, Past/Closed)
   - `Chemistry Chapter 2: Chemical Bonding & Molecular Structure` (Grade 10, 30 min, 20 marks, Published)
   - `Computer Science: Python & Algorithmic Foundations` (Grade 11, 40 min, 30 marks, Published)

6. **5 Audience-Targeted Notices**:
   - `CBSE Secondary Board Registration & Fee Circular` (Audience: `ALL`, Urgent: Yes)
   - `Internal Teacher Moderation & Pedagogy Workshop` (Audience: `STAFF_ONLY`)
   - `Grade 10 Science Practical Lab Schedule` (Audience: `STUDENTS_ONLY`)
   - `Annual Parent-Teacher Academic Consultation Meet` (Audience: `PARENTS_ONLY`)
   - `Annual Inter-School STEM & Robotics Exposition 2026` (Audience: `ALL`)

7. **4 School Events**:
   - `Annual Inter-School STEM & Robotics Exposition 2026`
   - `Annual Track & Field Sports Day`
   - `CBSE Science Exhibition & Innovation Fair`
   - `Annual Cultural Fest: Symphony of Cultures`

---

## 3. GRADING SCHEME REPAIR & DATA INTEGRITY SPECIFICATION

### 3.1 Standard Grading Scales Supported

#### Model 1: Institutional Letter Scale with Plus (Default)
| Grade | Min % | Max % | Grade Point (GPA) | Description / Performance Standard |
|:---:|:---:|:---:|:---:|:---|
| **A+** | **90%** | **100%** | **10.0** | **Outstanding Academic Excellence** |
| **A** | **80%** | **89%** | **9.0** | **Excellent Mastery of Subject** |
| **B+** | **70%** | **79%** | **8.0** | **Very Good Conceptual Standard** |
| **B** | **60%** | **69%** | **7.0** | **Good Comprehension & Application** |
| **C** | **50%** | **59%** | **6.0** | **Above Average Passing Standard** |
| **D** | **35%** | **49%** | **4.0** | **Minimum Passing Threshold** |
| **E** | **0%** | **34%** | **0.0** | **Needs Remedial Support (Unsuccessful)** |

#### Model 2: CBSE 9-Point Scale (Alternative Preset)
| Grade | Min % | Max % | Grade Point | Description |
|:---:|:---:|:---:|:---:|:---|
| **A1** | 91% | 100% | 10.0 | Outstanding Performance |
| **A2** | 81% | 90% | 9.0 | Excellent Academic Standard |
| **B1** | 71% | 80% | 8.0 | Very Good Comprehension |
| **B2** | 61% | 70% | 7.0 | Good Conceptual Mastery |
| **C1** | 51% | 60% | 6.0 | Above Average Standard |
| **C2** | 41% | 50% | 5.0 | Average Standard |
| **D** | 33% | 40% | 4.0 | Marginal Pass |
| **E** | 0% | 32% | 0.0 | Needs Essential Improvement |

### 3.2 Required Validation Rules (Frontend + Backend)
1. **Range Bounds**: For every grade band, `0 <= minPercentage <= maxPercentage <= 100`.
2. **Gap & Overlap Prevention**: Sorted bands must cover `0%` to `100%` continuously. For adjacent bands $B_i$ and $B_{i+1}$, $B_i.\text{minPercentage} = B_{i+1}.\text{maxPercentage} + 1$.
3. **Passing Boundary Consistency**: The configured `passingPercentage` must equal the minimum percentage of the lowest passing grade (e.g. `35%` for Grade D).
4. **Band Protection**: Cannot delete bands if the remaining count is $< 3$ or if it breaks the 0–100% coverage.
5. **Historical Integrity**: Updating the grading scheme does NOT rewrite published historical transcripts; only active drafts and future assessments compute marks with updated boundaries.

---

## 4. PDF GENERATION ARCHITECTURE

We have installed `jspdf` (`npm i jspdf --workspace=client`), a battle-tested, zero-external-service PDF generation engine that runs directly in the client browser with high fidelity.

### 4.1 Document Generators to Implement:
1. **Fee Payment Receipt (`generateFeeReceiptPdf`)**:
   - Institutional Header, Apex Academy logo & affiliation.
   - Receipt Number (`REC-2026-XXXX`), payment date, transaction mode (`UPI`, `Card`, `NetBanking`).
   - Student dossier: Name, Admission Number, Class & Section.
   - Cleared payment amount in Indian Rupees (`₹`), remaining outstanding balance.
   - Certified Digital Signature seal & watermark.
2. **Student Fee Invoice (`generateFeeInvoicePdf`)**:
   - Official School Bill, invoice reference (`INV-2026-XXXX`), term details.
   - Itemized fee heads (Tuition, Lab, Transport, Sports).
   - Payment status badge (`PAID`, `PARTIALLY_PAID`, `UNPAID`), due date, remittance instructions.
3. **Comprehensive Report Card (`generateReportCardPdf`)**:
   - School Crest & Academic Session (`2026–2027`).
   - Student particulars: Full Name, Admission No, Roll No, Class & Section.
   - Subject-wise Marks Table: Subject, Max Marks, Marks Obtained, Letter Grade, Teacher Remarks.
   - Aggregate percentage, cumulative GPA, Promotion Status.
   - Triple Signature Block: Class Teacher, Examination Coordinator, Principal & Head of School.
4. **Digital ID Card (`generateIdCardPdf`)**:
   - CR80 standard credit card dimensions (85.6 mm × 53.98 mm).
   - Crisp institutional navy banner, cardholder avatar/photo box, admission number/employee ID.
   - Secure QR Code linking to `/verify-id/:token`.
   - Cardholder details, validity date, and emergency contact.

---

## 5. DIGITAL ID CARD REDESIGN SPECIFICATION

### 5.1 Student ID Card (Front & Back Layout)
- **Dimensions**: ISO/IEC 7810 ID-1 standard (CR80: 85.60 × 53.98 mm).
- **Front Face**:
  - Top: Apex Academy Crest, institutional title, and "STUDENT IDENTITY CARD".
  - Center-Left: High-contrast student photograph or verified silhouette avatar with gold border.
  - Center-Right: Student Full Name (bold, 14pt), Admission Number, Class & Section, Blood Group.
  - Bottom: Status Pill (`ACTIVE`), Valid Academic Session (`2026–2027`), Barcode/Card Number.
- **Back Face**:
  - Verification QR Code (cryptographic token, zero PII).
  - Emergency contact phone, residential address, school address.
  - Principal's digital signature seal & compliance declaration.

### 5.2 Staff ID Card
- Specialized styling for Faculty, Department Heads, and Administrative Staff with designated badges and Employee ID (`EMP-2026-XXXX`).

---

## 6. CLEANUP & VERIFICATION ROADMAP

1. **Step 1**: Implement safe database pruning script to clear accumulated test rows from PostgreSQL while retaining canonical school accounts.
2. **Step 2**: Re-run the deterministic, idempotent `seed.ts` script to populate the exact 4–5 records per module.
3. **Step 3**: Repair the grading scheme in `academic.service.ts` and `ExamGradingSchemesPage.tsx` with full A+ through E support and preset restoration.
4. **Step 4**: Implement the centralized PDF generator (`client/src/services/pdfGenerator.ts`) and hook all download buttons across portals.
5. **Step 5**: Redesign the digital ID card components in `StudentVirtualIdCardPage.tsx` and `VirtualIdCardsPage.tsx`.
6. **Step 6**: Run complete automated test suite (`npm test`) and client build (`npm run build`) to ensure 100% regression pass rate.

---

## 7. EXECUTION RESULTS & FINAL VERIFIED STATE

### 7.1 Database Cleanup & Reseeding
- **Script Executed**: `server/prisma/clean-dev-data.ts` followed by `server/prisma/seed.ts`.
- **Tenant Scope**: All ephemeral transient schools (`sch-test-*`) purged; canonical tenant `Apex Academy of Sciences & Arts` (`apex-academy`, `APEX-2026`) retained and synchronized.
- **Post-Cleanup Canonical Counts**:
  - **Students**: Exactly 5 canonical profiles (`Aarav Sharma`, `Ananya Deshmukh`, `Rohan Verma`, `Meera Iyer`, `Kabir Sen`).
  - **Guardians**: Exactly 5 linked parent profiles with ward relationships.
  - **Faculty & Staff**: Exactly 6 core profiles (Principal, Physics Lead, Math Lead, HR Director, Bursar, Exam Coordinator).
  - **Fee Invoices**: Exactly 5 invoices (`INV-2026-0412` through `INV-2026-0416`).
  - **Fee Receipts**: Exactly 4 settled receipts (`REC-2026-4011` through `REC-2026-4014`).
  - **Examinations**: Exactly 4 mid-term schedules across Grade 10 subjects.
  - **Quizzes**: Exactly 5 canonical assessments (Physics, Math, Chemistry, Computer Science, and Child Safety Staff Training).
  - **Notices**: Exactly 5 audience-scoped notices (`ALL`, `STUDENTS_ONLY`, `PARENTS_ONLY`, `STAFF_ONLY`).
  - **Events**: Exactly 4 academic and co-curricular school events.

### 7.2 Grading Scheme Repair & Persistence
- **Default Restored**: 7-band continuous Letter Scale (`A+`, `A`, `B+`, `B`, `C`, `D`, `E`).
- **Validation Rules Enforced**:
  - Continuous 0% to 100% coverage with zero gaps or overlaps.
  - Strict descending order validation (`minPercentage` of band $i$ equals `maxPercentage` of band $i+1$ plus 1).
  - Passing percentage consistency (Grade D minimum threshold = 35%).
  - Minimum 3 bands requirement prevents invalid scheme destruction.
- **Preset Switching**: One-click preset restore buttons for "Standard Letter Scale (A+ to E)" and "CBSE 9-Point Scale (A1 to E)".
- **Database Persistence**: Successfully persists changes directly to PostgreSQL in `school.brandingConfig.gradingScheme` and reloads on browser refresh.

### 7.3 PDF Downloads Implemented & Tested
All PDF generation runs with client-side zero-latency rendering via `jspdf`, generating verified downloadable `.pdf` documents with standard filenames:
1. **Fee Payment Receipt**: `fee-receipt-<receiptNumber>.pdf` (with emerald paid stamp, line item breakdown, and digital verification seal).
2. **Student Fee Invoice**: `fee-invoice-<invoiceNumber>.pdf` (with invoice breakdown, due date, payment status, and outstanding balance).
3. **Student Report Card**: `report-card-<admissionNumber>.pdf` (with institutional header, subject-wise marks table, cumulative percentage, letter grades, and signature blocks).
4. **Digital Identity Card**: `id-card-<admissionNumber>.pdf` (with ISO CR80 standard card dimensions, navy header, gold crest, avatar box, and cryptographic verification token).

### 7.4 ID Card Redesign & QR Security
- **Visual Presentation**: ISO CR80 standard dimensions, dark navy (`#0f172a`) aesthetic, gold accents, status pill (`ACTIVE`), and high-contrast avatar placeholder fallback.
- **Zero-PII Verification**: QR codes encode revocable verification tokens (`/verify-id/:token`) without exposing names, phone numbers, or confidential student records.

### 7.5 Cross-Role Workflows Verified
- **School Admin**: Can manage student rosters, issue virtual ID cards, and view school-wide analytics.
- **Teacher**: Can view class rosters, record daily attendance, and enter examination marks.
- **Examination Coordinator**: Can manage grading schemes, restore presets, validate bands, publish/unpublish exam results, and inspect mark audit logs.
- **Accounts Staff**: Can view student fee invoices, register payments, and download official receipts.
- **Parent**: Can view linked child's attendance, pay fees, download receipts, and view published report cards.
- **Student**: Can view personal dashboard, timetable, quizzes, published results, and download virtual ID card.

---

## 8. REGRESSION & TEST VERIFICATION SUITE

### 8.1 Backend Vitest Test Suite Execution
- **Command**: `npm test --workspace=server -- --run`
- **Duration**: ~4.2 seconds
- **Test Files**: 9 passed (9 total)
- **Tests**: 185 passed (185 total, 0 failed)
- **Breakdown**:
  - `src/modules/academic/academic.test.ts`: 31 / 31 passed
  - `src/modules/core/core.test.ts`: 17 / 17 passed
  - `src/modules/core/hr.test.ts`: 22 / 22 passed
  - `src/modules/e2e-workflows.test.ts`: 24 / 24 passed
  - `src/modules/auth/auth.test.ts`: Passed
  - `src/modules/operations/operations.test.ts`: Passed
  - `src/modules/school/school.test.ts`: Passed
  - `src/modules/superadmin/superadmin.test.ts`: Passed
  - `src/modules/ai/ai.test.ts`: Passed

### 8.2 Client TypeScript & Production Build
- **Typecheck Command**: `npm run typecheck --workspace=client` -> **0 errors (Exit Code 0)**
- **Build Command**: `npm run build --workspace=client` -> **Built in 8.99s (Exit Code 0)**
- **Server Typecheck Command**: `npm run typecheck --workspace=server` -> **0 errors (Exit Code 0)**
- **Server Build Command**: `npm run build --workspace=server` -> **Prisma generated & tsc compiled (Exit Code 0)**
