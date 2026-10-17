# EduNexa — Authentication & Multi-Tenant Security Specification (Stage 3)

**Platform:** EduNexa — Multi-Tenant School Management & AI-Powered ERP  
**Document Status:** Stage 3 Security Engine & RBAC Implementation  
**Revision:** 1.0  

---

## 1. Authentication Engine & Cryptographic Invariants

Authentication in EduNexa is built strictly according to institutional multi-tenant security principles:

1. **Password Hashing**: Implemented in [`server/src/utils/crypto.ts`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/utils/crypto.ts) using **Bcrypt** with `saltRounds = 10`. Plaintext passwords are never persisted or logged.
2. **Access & Refresh Tokens**:
   - Short-lived JSON Web Tokens (JWT) signed with HMAC-SHA256 using `JWT_ACCESS_SECRET`.
   - Long-lived Refresh Tokens signed with `JWT_REFRESH_SECRET`.
   - Verified payload contains verified identity metadata: `userId`, `email`, `role`, `schoolId`, `studentProfileId`, `staffProfileId`, and `guardianStudentIds`.
3. **Session Termination**:
   - Endpoint: `POST /api/v1/auth/logout` invalidates client session state.
4. **Rate Limiting**:
   - Implemented via `express-rate-limit` in [`server/src/middleware/auth.middleware.ts`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/middleware/auth.middleware.ts), limiting authentication attempts to 30 requests per 15-minute window per IP to eliminate brute-force and credential stuffing threats.

---

## 2. Server-Side RBAC & Permission Boundaries

EduNexa enforces role boundaries strictly on the server:

- **Role Hierarchy**: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `PRINCIPAL`, `TEACHER`, `STUDENT`, `PARENT`, `HR_STAFF`, `ACCOUNTS`, `EXAM_COORDINATOR`.
- **RBAC Middleware**: `requireRole(...allowedRoles)` verifies that `req.user.role` matches the route requirements. Frontend requests attempting unauthorized actions are rejected with `403 FORBIDDEN_ROLE`.

---

## 3. Strict Multi-Tenant Data Isolation

- **Non-Trust of Frontend School ID**: Client-supplied `schoolId` headers, query parameters, or request body fields are never trusted for tenant isolation. The tenant identity `req.schoolId` is strictly extracted from the cryptographically verified JWT bearer token.
- **Tenant Scope Guard**: `requireTenantScope` checks that `:schoolId` parameters match `req.user.schoolId`. Cross-tenant queries are blocked with `403 CROSS_TENANT_FORBIDDEN`.
- **Database Query Filtering**: Every database operation on school data is forced through `{ where: { schoolId: req.schoolId } }`.

---

## 4. Horizontal Privilege Escalation Protection

- **Student Record Isolation**: Implemented via `enforceStudentIsolation`. If `req.user.role === STUDENT`, the target `studentId` must match `req.user.studentProfileId`. Unauthorized student-to-student access attempts return `403 FORBIDDEN_RECORD_ACCESS`.
- **Parent Child Record Isolation**: If `req.user.role === PARENT`, the requested `studentId` must be in the parent's verified `guardianStudentIds` array. Unrelated student access attempts return `403 FORBIDDEN_RECORD_ACCESS`.

---

## 5. Super Admin Sensitive Access Guardrail (PRD §4)

Per the B2World PRD, a Super Admin must not automatically receive unrestricted access to sensitive student, parent, staff, or payment records:

- **Audit Rationale Guard**: Implemented via `auditSuperAdminSensitiveAccess`.
- When a `SUPER_ADMIN` attempts to view sensitive student records or grades, the request MUST provide an explicit `x-audit-reason` header (minimum 10 characters).
- Requests lacking this rationale are blocked with `403 SUPER_ADMIN_AUDIT_REQUIRED`.
- All audited requests generate persistent entries in the platform `AuditLog` table.

---

## 6. School Onboarding & Auditable Role Changes

1. **School Onboarding**:
   - Endpoint: `POST /api/v1/superadmin/schools` (Restricted to `SUPER_ADMIN`).
   - Validates institutional parameters via `SchoolOnboardingSchema` (Name, Code, Contact, Plan).
   - Generates an isolated tenant namespace with initial `ACTIVE` status.
2. **Tenant Suspension**:
   - Endpoint: `PATCH /api/v1/superadmin/schools/:id/status`.
   - Allows activating, suspending, or retiring schools. Users attempting to log in to a suspended school receive `403 SCHOOL_SUSPENDED`.
3. **Auditable Role Changes**:
   - Endpoint: `POST /api/v1/superadmin/memberships/role`.
   - Modifies user permissions and immediately writes a structured log to `AuditLog` capturing actor ID, target user ID, previous role, new role, and timestamp.
   - Non-Super Admins attempting to change roles are rejected with `403 FORBIDDEN_ROLE`.

---

## 7. Automated Test Suite (25 Passing Tests)

The complete security test suite is located in [`server/src/modules/auth/auth.security.test.ts`](file:///c:/Users/Krishna%20Pawar/Desktop/B2World/EduNexa/server/src/modules/auth/auth.security.test.ts):

| Category | Test Case | Expected Status | Verified Code | Result |
|---|---|---|---|---|
| **Unauthenticated** | Protected route without Bearer token | 401 | `UNAUTHORIZED` | **PASS** |
| **Forbidden Roles** | Teacher accessing Super Admin onboarding | 403 | `FORBIDDEN_ROLE` | **PASS** |
| **Forbidden Roles** | Student accessing Super Admin onboarding | 403 | `FORBIDDEN_ROLE` | **PASS** |
| **Invalid Auth** | Forged / corrupted JWT token signature | 401 | `INVALID_TOKEN` | **PASS** |
| **Expired Auth** | Expired JWT token | 401 | `TOKEN_EXPIRED` | **PASS** |
| **Cross-School** | User from School A accessing School B roster | 403 | `CROSS_TENANT_FORBIDDEN` | **PASS** |
| **Multi-Tenant** | User from School A accessing School A roster | 200 | `success: true` | **PASS** |
| **Student Privacy** | Student accessing another student's marks | 403 | `FORBIDDEN_RECORD_ACCESS` | **PASS** |
| **Student Privacy** | Student accessing their own private marks | 200 | `success: true` | **PASS** |
| **Parent Boundary** | Parent accessing unrelated student's marks | 403 | `FORBIDDEN_RECORD_ACCESS` | **PASS** |
| **Parent Boundary** | Parent accessing their registered child's marks | 200 | `success: true` | **PASS** |
| **Super Admin** | Super Admin accessing marks without audit header | 403 | `SUPER_ADMIN_AUDIT_REQUIRED` | **PASS** |
| **Super Admin** | Super Admin accessing marks with audit rationale | 200 | `success: true` | **PASS** |
| **Tampered IDs** | Non-existent or manipulated record ID | 404 | `RECORD_NOT_FOUND` | **PASS** |
| **Role Changes** | Teacher attempting to change user role | 403 | `FORBIDDEN_ROLE` | **PASS** |
| **Role Changes** | Super Admin changes user role with audit log | 200 | `ROLE_PERMISSION_CHANGED` | **PASS** |
| **Onboarding** | Super Admin onboards new school tenant | 201 | `success: true` | **PASS** |
| **Login** | Valid credentials return JWT tokens & profile | 200 | `success: true` | **PASS** |
| **Login** | Incorrect password returns 401 | 401 | `INVALID_CREDENTIALS` | **PASS** |
| **Suspended Tenant** | Login to suspended school returns 403 | 403 | `SCHOOL_SUSPENDED` | **PASS** |
| **Logout** | Authenticated user logs out | 200 | `loggedOut: true` | **PASS** |
| **Foundation** | Health check response envelope integrity | 200 | `success: true` | **PASS** |
| **Foundation** | 404 handler structured error response | 404 | `NOT_FOUND` | **PASS** |
| **Foundation** | CORS & Helmet security headers | 200 | Headers verified | **PASS** |
| **Foundation** | Environment configuration Zod validation | — | Type assertions | **PASS** |
