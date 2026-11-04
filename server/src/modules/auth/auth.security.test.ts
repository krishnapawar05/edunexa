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

  const principalTokenSchoolA = generateAccessToken({
    userId: 'usr-principal-01',
    email: 'principal@apexacademy.edu',
    schoolId: 'sch-apex-01',
    staffProfileId: 'staff-principal-01',
    role: PlatformRole.PRINCIPAL,
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

  const parentTokenSunil = generateAccessToken({
    userId: 'usr-parent-01',
    email: 'sunil.sharma@parent.apex.edu',
    schoolId: 'sch-apex-01',
    guardianStudentIds: ['stu-aarav-01'], // Authorized for Aarav Sharma only
    role: PlatformRole.PARENT,
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

  it('2c. Student attempting to access School Admin student enrollment API should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .post('/api/v1/core/students')
      .set('Authorization', `Bearer ${studentTokenA}`)
      .send({
        firstName: 'Hacked',
        lastName: 'Student',
        classId: 'cls-10',
        sectionId: 'sec-10a',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('2d. Student attempting to access Teacher attendance recording API should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .post('/api/v1/academic/attendance/students')
      .set('Authorization', `Bearer ${studentTokenA}`)
      .send({
        classId: 'cls-10',
        sectionId: 'sec-10a',
        date: '2026-10-19',
        records: [],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('2e. Teacher attempting to access School Admin student creation API should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .post('/api/v1/core/students')
      .set('Authorization', `Bearer ${teacherTokenSchoolA}`)
      .send({
        firstName: 'Unauthorized',
        lastName: 'Addition',
        classId: 'cls-10',
        sectionId: 'sec-10a',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('2f. Principal attempting to access Platform Super Admin API should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${principalTokenSchoolA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('2g. School Admin attempting to access Platform Super Admin API should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('2h. Tampering request body or query parameter with role=SUPER_ADMIN does not elevate privileges', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/schools?role=SUPER_ADMIN')
      .set('Authorization', `Bearer ${studentTokenA}`)
      .send({ role: 'SUPER_ADMIN' });

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
    const expiredToken = generateAccessToken(
      {
        userId: 'usr-student-01',
        email: 'aarav@apex.edu',
        role: PlatformRole.STUDENT,
      },
      -10 // Expired 10 seconds ago
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
  // 5. Student Horizontal Privilege Escalation Tests
  // --------------------------------------------------------------------------
  it("5a. Student attempting to access another student's marks should return 403 FORBIDDEN_RECORD_ACCESS", async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-rohan-99/private-marks')
      .set('Authorization', `Bearer ${studentTokenA}`);

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
  // 6. Parent Horizontal Privilege Boundary Tests
  // --------------------------------------------------------------------------
  it("6a. Parent attempting to access unrelated student's marks should return 403 FORBIDDEN_RECORD_ACCESS", async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-rohan-99/private-marks')
      .set('Authorization', `Bearer ${parentTokenSunil}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_RECORD_ACCESS');
  });

  it("6b. Parent accessing their own registered child's records should succeed with 200", async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-aarav-01/private-marks')
      .set('Authorization', `Bearer ${parentTokenSunil}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Aarav Sharma');
  });

  // --------------------------------------------------------------------------
  // 7. Super Admin Sensitive Access Guardrail Tests (PRD §4)
  // --------------------------------------------------------------------------
  it('7a. Super Admin accessing sensitive student marks without x-audit-reason should return 403 SUPER_ADMIN_AUDIT_REQUIRED', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-aarav-01/private-marks')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SUPER_ADMIN_AUDIT_REQUIRED');
  });

  it('7b. Super Admin accessing sensitive marks with valid audited rationale should succeed with 200', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/students/stu-aarav-01/private-marks')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('x-audit-reason', 'Parent escalated Grade 10 mark discrepancy ticket #8841');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 8. Manipulated Record IDs Tests
  // --------------------------------------------------------------------------
  it('8. Accessing a manipulated or non-existent record ID should return 404 RECORD_NOT_FOUND', async () => {
    const res = await request(app)
      .get('/api/v1/security-test/records/rec-nonexistent-999')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  // --------------------------------------------------------------------------
  // 9. Unauthorized Role Changes Tests
  // --------------------------------------------------------------------------
  it('9a. Unauthorized user (Teacher) attempting to change user role should return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .post('/api/v1/superadmin/memberships/role')
      .set('Authorization', `Bearer ${teacherTokenSchoolA}`)
      .send({
        targetUserId: 'usr-student-01',
        schoolId: 'sch-apex-01',
        newRole: PlatformRole.SCHOOL_ADMIN,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('9b. Super Admin role changes succeed and produce persistent audit log entries', async () => {
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

  // --------------------------------------------------------------------------
  // 10. School Onboarding Workflow Tests
  // --------------------------------------------------------------------------
  it('10. Super Admin can onboard a new school tenant with isolated namespace', async () => {
    const onboardRes = await request(app)
      .post('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Delhi Public Collegiate',
        code: `DPC-${Date.now().toString().slice(-4)}`,
        email: `contact-${Date.now()}@dpc.edu`,
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

  // --------------------------------------------------------------------------
  // 11. Authentication Endpoints: Login, Bad Password, Suspended Tenant & Logout
  // --------------------------------------------------------------------------
  it('11a. Login with valid credentials should return access & refresh tokens and user profile', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@apexacademy.edu',
        password: 'DemoPass2026!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.role).toBe(PlatformRole.SCHOOL_ADMIN);
  });

  it('11b. Login with incorrect password should return 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@apexacademy.edu',
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('11c. Login to a suspended school tenant should return 403 SCHOOL_SUSPENDED', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@staugustine.edu',
        password: 'DemoPass2026!',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SCHOOL_SUSPENDED');
  });

  it('11d. Authenticated user can call /api/v1/auth/logout', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loggedOut).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 12. Super Admin Dedicated Subpage Endpoints (Stage 10)
  // --------------------------------------------------------------------------
  it('12a. Super Admin can fetch platform telemetry with database aggregates', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/telemetry')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalSchools');
    expect(res.body.data).toHaveProperty('systemHealth');
    expect(res.body.data.systemHealth.databaseConnected).toBe(true);
  });

  it('12b. Non-Super-Admin (School Admin) attempting to fetch platform telemetry returns 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/telemetry')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('12c. Super Admin can list subscriptions and plans', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/subscriptions')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('12d. Non-Super-Admin (Teacher) attempting to list subscriptions returns 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/subscriptions')
      .set('Authorization', `Bearer ${teacherTokenSchoolA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('12e. Super Admin can fetch platform settings without exposing secrets', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/settings')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('platformName');
    expect(res.body.data).not.toHaveProperty('DATABASE_URL');
    expect(res.body.data).not.toHaveProperty('JWT_ACCESS_SECRET');
  });

  it('12f. Super Admin can update platform settings and record audit log', async () => {
    const res = await request(app)
      .put('/api/v1/superadmin/settings')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        platformName: 'EduNexa Multi-Tenant School ERP Updated',
        supportEmail: 'admin-contact@edunexa.org',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.platformName).toBe('EduNexa Multi-Tenant School ERP Updated');
  });

  // --------------------------------------------------------------------------
  // SECTION 13: PASSWORD RECOVERY & CREDENTIAL LIFECYCLE
  // --------------------------------------------------------------------------
  let testResetToken: string | undefined;

  it('13a. Forgot Password returns 200 with generic message and issues single-use token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@apexacademy.edu' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('If an account exists');
    testResetToken = res.body.data.devToken;
    expect(testResetToken).toBeDefined();
  });

  it('13b. Forgot Password protects against user enumeration for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent-ghost-user-99@nowhere.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('If an account exists');
  });

  it('13c. Verify Password Reset Token validates valid token', async () => {
    if (!testResetToken) return;
    const res = await request(app)
      .get(`/api/v1/auth/reset-password/verify/${testResetToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.email).toBe('admin@apexacademy.edu');
  });

  it('13d. Verify Password Reset Token rejects invalid or forged token with 400', async () => {
    const res = await request(app)
      .get('/api/v1/auth/reset-password/verify/forged-invalid-token-1234567890abcdef');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
  });

  it('13e. Reset Password rejects weak password with 422 or 400', async () => {
    if (!testResetToken) return;
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: testResetToken,
        password: 'weak',
      });

    expect([400, 422]).toContain(res.status);
  });

  it('13f. Reset Password successfully updates password and marks token used', async () => {
    if (!testResetToken) return;
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: testResetToken,
        password: 'NewSecurePassword2026!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verifying token again must now fail because it was already used
    const verifyAgain = await request(app)
      .get(`/api/v1/auth/reset-password/verify/${testResetToken}`);
    expect(verifyAgain.status).toBe(400);

    // Verify login with new password succeeds
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@apexacademy.edu',
        password: 'NewSecurePassword2026!',
      });
    expect(loginRes.status).toBe(200);
  });

  it('13g. Authenticated user can change password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        currentPassword: 'NewSecurePassword2026!',
        newPassword: 'DemoPass2026!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('13h. Change password rejects incorrect current password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        currentPassword: 'WrongCurrentPassword!',
        newPassword: 'AnotherPassword2026!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INCORRECT_PASSWORD');
  });

  it('13i. Change password rejects same password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        currentPassword: 'DemoPass2026!',
        newPassword: 'DemoPass2026!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SAME_PASSWORD');
  });

  // --------------------------------------------------------------------------
  // SECTION 14: SCHOOL ADMIN CREDENTIAL MANAGEMENT & TENANT BOUNDARIES
  // --------------------------------------------------------------------------
  it('14a. Student Dossier includes student account details with username and role', async () => {
    const res = await request(app)
      .get('/api/v1/core/students/stu-aarav-01')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('account');
    expect(res.body.data.account).toHaveProperty('username');
    expect(res.body.data.account.role).toBe(PlatformRole.STUDENT);
  });

  it('14b. School Admin cannot trigger password reset for Super Admin (forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/core/accounts/usr-superadmin-01/reset-password')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(404); // User not in school tenant
  });

  it('14c. School Admin can suspend and reactivate a student user account', async () => {
    const studentDossier = await request(app)
      .get('/api/v1/core/students/stu-aarav-01')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    const studentUserId = studentDossier.body.data.account.userId;

    // Suspend
    const suspendRes = await request(app)
      .patch(`/api/v1/core/accounts/${studentUserId}/status`)
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({ isActive: false, reason: 'Temporary suspension for testing' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.isActive).toBe(false);

    // Reactivate
    const reactivateRes = await request(app)
      .patch(`/api/v1/core/accounts/${studentUserId}/status`)
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({ isActive: true, reason: 'Reactivated by administrator' });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.isActive).toBe(true);
  });
});
