import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken, hashPassword } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('STAGE 3: Authentication and Multi-Tenant Security Test Suite', () => {
  // Test Tokens for Different Roles and Tenants
  const superAdminToken = generateAccessToken({
    userId: 'usr-superadmin-01',
    email: 'superadmin@edunexa.org',
    role: PlatformRole.SUPER_ADMIN,
  });

  const schoolAdminTokenSchoolA = generateAccessToken({
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  const teacherTokenSchoolA = generateAccessToken({
    userId: 'usr-teacher-01',
    email: 'dr.thorne@apexacademy.edu',
    schoolId: 'sch-apex-01',
    staffProfileId: 'staff-thorne-01',
    role: PlatformRole.TEACHER,
  });

  const studentTokenA = generateAccessToken({
    userId: 'usr-student-01',
    email: 'aarav.sharma@student.apex.edu',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    role: PlatformRole.STUDENT,
  });

  const studentTokenOtherSchool = generateAccessToken({
    userId: 'usr-student-02',
    email: 'rohan.p@greenwood.edu',
    schoolId: 'sch-greenwood-02',
    studentProfileId: 'stu-rohan-99',
    role: PlatformRole.STUDENT,
  });

  // --------------------------------------------------------------------------
  // 1. Unauthenticated Access Tests
  // --------------------------------------------------------------------------
  it('1. Unauthenticated request to protected route should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // --------------------------------------------------------------------------
  // 2. Forbidden Roles (RBAC Enforced) Tests
  // --------------------------------------------------------------------------
  it('2. Teacher attempting to access Super Admin onboarding should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${teacherTokenSchoolA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('2b. Student attempting to access Super Admin route should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${studentTokenA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  // --------------------------------------------------------------------------
  // 3. Invalid and Expired Authentication Tests
  // --------------------------------------------------------------------------
  it('3a. Request with forged or corrupted JWT signature should return 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.signature');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('3b. Request with expired token should return 401 TOKEN_EXPIRED', async () => {
    // Generate token that expired 10 seconds ago
    const expiredToken = generateAccessToken(
      {
        userId: 'usr-student-01',
        email: 'aarav@apex.edu',
        role: PlatformRole.STUDENT,
      },
      -10 // Negative expiration
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  // --------------------------------------------------------------------------
  // 4. Cross-School Data Access (Multi-Tenant Isolation) Tests
  // --------------------------------------------------------------------------
  it('4. User belonging to School A attempting to access School B records should return 403 CROSS_TENANT_FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/schools/sch-greenwood-02/roster')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CROSS_TENANT_FORBIDDEN');
  });

  it('4b. User belonging to School A accessing School A records should succeed with 200', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/schools/sch-apex-01/roster')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  // --------------------------------------------------------------------------
  // 5. Access to Another Student's Records (Horizontal Privilege Escalation) Tests
  // --------------------------------------------------------------------------
  it("5a. Student attempting to access another student's marks should return 403 FORBIDDEN_RECORD_ACCESS", async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-rohan-99/private-marks')
      .set('Authorization', `Bearer ${studentTokenA}`); // Student A (Aarav) accessing Rohan's marks

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_RECORD_ACCESS');
  });

  it('5b. Student accessing their own private marks should succeed with 200', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-aarav-01/private-marks')
      .set('Authorization', `Bearer ${studentTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Aarav Sharma');
  });

  // --------------------------------------------------------------------------
  // 6. Super Admin Sensitive Access Guardrail Tests (PRD §4)
  // --------------------------------------------------------------------------
  it('6a. Super Admin accessing sensitive student marks without x-audit-reason should return 403 SUPER_ADMIN_AUDIT_REQUIRED', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-aarav-01/private-marks')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SUPER_ADMIN_AUDIT_REQUIRED');
  });

  it('6b. Super Admin accessing sensitive marks with valid audited rationale should succeed with 200', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-aarav-01/private-marks')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('x-audit-reason', 'Parent escalated Grade 10 mark discrepancy ticket #8841');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. Manipulated Record IDs Tests
  // --------------------------------------------------------------------------
  it('7. Accessing a manipulated or non-existent record ID should return 404 RECORD_NOT_FOUND', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/records/rec-nonexistent-999')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  // --------------------------------------------------------------------------
  // 8. Super Admin School Onboarding & Auditable Role Changes
  // --------------------------------------------------------------------------
  it('8a. Super Admin can list schools and onboard a new school tenant', async () => {
    const listRes = await request(app)
      .get('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    const onboardRes = await request(app)
      .post('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Delhi Public Collegiate',
        code: `DPC-${Date.now().toString().slice(-4)}`,
        email: 'contact@dpc.edu',
        phone: '+91 11 2345 6789',
        address: '10 Mathura Road',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110003',
        planName: 'Enterprise',
      });

    expect(onboardRes.status).toBe(201);
    expect(onboardRes.body.success).toBe(true);
    expect(onboardRes.body.data).toHaveProperty('id');
    expect(onboardRes.body.data.name).toBe('Delhi Public Collegiate');
  });

  it('8b. Super Admin role changes produce persistent audit log entries', async () => {
    const roleChangeRes = await request(app)
      .post('/api/v1/superadmin/memberships/role')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        targetUserId: 'usr-teacher-01',
        schoolId: 'sch-apex-01',
        newRole: PlatformRole.EXAM_COORDINATOR,
      });

    expect(roleChangeRes.status).toBe(200);
    expect(roleChangeRes.body.success).toBe(true);
    expect(roleChangeRes.body.data.role).toBe(PlatformRole.EXAM_COORDINATOR);

    const auditRes = await request(app)
      .get('/api/v1/superadmin/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.length).toBeGreaterThanOrEqual(1);
    const lastLog = auditRes.body.data[auditRes.body.data.length - 1];
    expect(lastLog.action).toBe('ROLE_PERMISSION_CHANGED');
  });
});
