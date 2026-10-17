# Stage 4: Core School Management & Digital Identity Architecture

## Overview & Scope
Stage 4 implements the complete core operational engine of **EduNexa** across student administration, academic hierarchy, staff rosters, and verifiable virtual ID credentials in compliance with the B2World Product Requirements Document (PRD).

---

## 1. Core Modules Implemented

### 1.1 School Profiles & Academic Hierarchy
- **Hierarchical Structure**: Academic Sessions, Classes, Sections, Subjects, and Departments.
- **Tenant Scoping**: All academic models (`AcademicSession`, `Class`, `Section`, `Subject`, `Department`) enforce compound foreign keys on `schoolId`, guaranteeing that academic configurations do not bleed across institutional boundaries.
- **Dynamic Profile Customization**: Real-time school branding (motto, crest, colors, affiliation codes, principal contacts) persisted per tenant and reflected across the ERP.

### 1.2 Student Information System (SIS) & Guardian Relationships
- **Unique Admission Number Enforcement**: Every student receives a scoped admission number (e.g. `ADM-YYYY-XXXX`). The backend service and database enforce uniqueness within the school scope:
  - Attempting to register an existing admission number in the same tenant produces a `409 CONFLICT` (`DUPLICATE_ADMISSION_NUMBER`).
  - Distinct schools can independently use identical numbering schemes without collision.
- **Permanent Student Dossier**:
  - Full demographics: First name, last name, gender, date of birth, blood group, residential address, emergency contact.
  - Academic metadata: Assigned grade, section, roll number, attendance rate, fee status.
  - Guardian links: Primary guardian full name, relationship (Father/Mother/Legal Guardian), verified contact phone, and email.

### 1.3 Online Admissions & Application Review Queue
- **Application Review Workflow**:
  - Prospective student applications submitted with parent and candidate details.
  - School administrators review candidates in the `SUBMITTED` queue.
  - **Approve & Enroll**: Automatically generates student SIS profile, allocates roll number, assigns designated class and section, and sets application status to `APPROVED`.
  - **Decline / Reject**: Archives application with administrative notes and sets status to `REJECTED`.

### 1.4 Faculty & Staff Roster with Subject Assignments
- **Unique Employee ID Enforcement**:
  - Faculty members are provisioned with unique employee IDs (e.g., `EMP-YYYY-XXXX`).
  - Scoped uniqueness prevents duplicate staff records within the institution (`409 CONFLICT` on collision).
- **Class & Subject Assignments**:
  - Teachers are mapped to specific academic sessions, classes, sections, and subjects (`TeacherAssignment`).
  - Supports lead teacher designations (`isLeadTeacher: boolean`) for homeroom and primary subject authority.

### 1.5 Virtual ID Card Generation (ISO CR80 Compliant)
- **Approved Profile Data Binding**:
  - ID Cards are generated using immutable snapshots of approved profile data (full name, admission/employee ID, issue date, expiry date, institution crest, and cardholder designation).
  - Physical card preview adheres to ISO CR80 standard badge dimensions (85.6mm × 53.98mm aspect ratio) with high-contrast institutional styling.
- **Card Lifecycle Management**:
  - **Active**: Valid for campus access and identification.
  - **Revocation**: Authorized administrators can deactivate/revoke cards with a mandatory audit reason (e.g. *Lost badge in transit*, *Transferred institution*, *Compromised credential*).
  - Deactivation immediately invalidates the cryptographic verification token.

### 1.6 Secure, Privacy-Preserving QR Verification Gateway
- **Anti-Tamper Random Token Architecture**:
  - QR codes embed a randomly generated UUID-based revocable verification token (`v-tok-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
  - **Zero PII & Zero Plaintext**: QR codes contain **no passwords, no birth dates, no phone numbers, no residential addresses, and no academic marks/grades**.
- **Public Verification Endpoint** (`GET /api/v1/core/id-cards/verify/:token`):
  - Completely unauthenticated and publicly accessible to security guards, bus conductors, and tournament organizers.
  - Returns strictly minimal verification data:
    ```json
    {
      "success": true,
      "data": {
        "isValid": true,
        "status": "ACTIVE",
        "holderName": "Aarav Sharma",
        "identifierNumber": "ADM-2026-0042",
        "schoolName": "Apex Academy of Sciences & Arts",
        "schoolCode": "APEX-DEL",
        "academicSession": "2026-2027",
        "issuedAt": "2026-02-01T00:00:00.000Z",
        "expiresAt": "2027-03-31T23:59:59.000Z"
      }
    }
    ```
  - When revoked, returns `isValid: false` and `status: "REVOKED"` with revocation timestamp, safeguarding the institution against expired or forged badges.

---

## 2. API Contract & Endpoint Registry

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/v1/core/academic-structure` | `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER` | Retrieve sessions, classes, sections, departments |
| `GET` | `/api/v1/core/students` | `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER` | Search & filter students by grade, section, status |
| `GET` | `/api/v1/core/students/:id` | `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER`, `PARENT` | Retrieve detailed student dossier & guardian profile |
| `POST` | `/api/v1/core/students` | `SCHOOL_ADMIN`, `PRINCIPAL` | Enroll student (unique admission number check) |
| `GET` | `/api/v1/core/admissions/applications` | `SCHOOL_ADMIN`, `PRINCIPAL` | List pending admissions queue |
| `PATCH` | `/api/v1/core/admissions/applications/:id/review` | `SCHOOL_ADMIN`, `PRINCIPAL` | Approve or decline candidate admission |
| `GET` | `/api/v1/core/staff` | `SCHOOL_ADMIN`, `PRINCIPAL`, `HR_STAFF` | List staff & faculty with department filters |
| `POST` | `/api/v1/core/staff` | `SCHOOL_ADMIN`, `PRINCIPAL`, `HR_STAFF` | Register staff (unique employee ID check) |
| `POST` | `/api/v1/core/staff/assignments` | `SCHOOL_ADMIN`, `PRINCIPAL` | Assign teacher to class & subject |
| `GET` | `/api/v1/core/id-cards` | `SCHOOL_ADMIN`, `PRINCIPAL` | List virtual ID cards issued for tenant |
| `POST` | `/api/v1/core/id-cards/generate` | `SCHOOL_ADMIN`, `PRINCIPAL` | Generate ISO CR80 virtual card with token |
| `PATCH` | `/api/v1/core/id-cards/:id/deactivate` | `SCHOOL_ADMIN`, `PRINCIPAL` | Revoke card credential with audit reason |
| `GET` | `/api/v1/core/id-cards/verify/:token` | **Public** (No Auth Required) | Privacy-preserving QR card authenticity check |

---

## 3. Automated Test Verification Results

All 41 tests across the entire test suite pass cleanly:

```bash
Test Files  3 passed (3)
     Tests  41 passed (41)
  Duration  2.13s (tests)
```

### Stage 4 Test Suite Breakdown (`src/modules/core/core.test.ts`):
1. `GET /api/v1/core/academic-structure` - Retrieves tenant-scoped sessions, classes, and sections.
2. `GET /api/v1/core/students` - Searches and filters active student body.
3. `POST /api/v1/core/students` - Enrolls student with valid `ADM-YYYY-XXXX` format.
4. `POST /api/v1/core/students` (Duplicate) - Prevents duplicate admission number in same school (`409 CONFLICT`).
5. `GET /api/v1/core/students/:id` - Returns student permanent dossier with guardian relationship.
6. `GET /api/v1/core/staff` - Lists faculty with department filtering.
7. `POST /api/v1/core/staff` - Registers new faculty member with unique employee ID.
8. `POST /api/v1/core/staff` (Duplicate) - Prevents duplicate employee ID within tenant (`409 CONFLICT`).
9. `POST /api/v1/core/staff/assignments` - Maps teacher to subject and section.
10. `POST /api/v1/core/id-cards/generate` - Issues ISO CR80 card with unique verification token.
11. `GET /api/v1/core/id-cards/verify/:token` - Confirms active status and reveals zero sensitive PII.
12. `PATCH /api/v1/core/id-cards/:id/deactivate` - Deactivates card with mandatory reason.
13. `GET /api/v1/core/id-cards/verify/:token` (Revoked) - Confirms revoked status and `isValid: false`.
14. `GET /api/v1/core/admissions/applications` - Fetches admissions review queue.
15. `PATCH /api/v1/core/admissions/applications/:id/review` - Approves admission and enrolls candidate into target class.
16. Access Control Enforcement - Unauthorized role (Student) attempting to enroll or issue cards receives `403 FORBIDDEN_ROLE`.

---

## 4. Visual Inspection Summary

The UI was inspected on `http://localhost:5173/` using automated browser verification:
- **Student Directory & SIS**: Rendered student table with status badges, attendance rates, search, and grade filters.
- **Enroll New Student Modal**: Verified input validation and guardian link entry fields.
- **Student Permanent Dossier**: Displayed emergency contacts, blood group, address, and parent credentials.
- **Admissions Review Queue**: Displayed pending applications with single-click approval and enrollment workflows.
- **Faculty & Assignments**: Displayed faculty cards and class/subject assignment modal.
- **ISO CR80 Virtual ID Card**: Displayed realistic badge with cardholder photo placeholder, barcode/details, and QR token.
- **Card Revocation**: Verified revocation modal with reason selector.
- **Public Anti-Tamper QR Gateway**:
  - Active Token: Displays green verification checkmark with "OFFICIALLY VERIFIED ACTIVE CREDENTIAL" and school badge.
  - Invalid / Revoked Token: Displays red alert card with "Invalid Credential: Verification token is invalid or does not exist."
