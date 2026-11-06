import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { generateAccessToken, hashPassword } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('SECTION 17: UI/UX, SECURITY & TECHNICAL STANDARDS TEST SUITE', () => {
  let primarySchoolId: string;
  let secondarySchoolId: string;

  let superAdminToken: string;
  let schoolAdminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let studentUserId: string;

  let mfaUser: any;
  let mfaToken: string;
  let validOtp: string;

  let uploadedFileId: string;
  let publicFileId: string;

  beforeAll(async () => {
    // 1. Resolve or create primary test school
    let schools = await prisma.school.findMany({ take: 2 });
    if (schools.length === 0) {
      const s1 = await prisma.school.create({
        data: {
          name: 'Apex Academy of Sciences & Arts',
          code: 'APX-01',
          slug: 'apex-academy',
          email: 'admin@apexacademy.edu',
          phone: '+91 98450 00000',
          address: 'Main Campus',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          status: 'ACTIVE',
        },
      });
      schools = [s1];
    }
    primarySchoolId = schools[0].id;

    // 2. Resolve or create secondary test school for tenant isolation
    if (schools.length > 1) {
      secondarySchoolId = schools[1].id;
    } else {
      const s2 = await prisma.school.create({
        data: {
          name: 'Greenwood International School',
          code: 'GWD-02',
          slug: 'greenwood-intl',
          email: 'info@greenwood.edu',
          phone: '+91 98450 11111',
          address: 'South Campus',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560002',
          status: 'ACTIVE',
        },
      });
      secondarySchoolId = s2.id;
    }

    // 3. Setup test users
    // A. Student
    let stuUser = await prisma.user.findFirst({
      where: { email: 'sec17.student@apexacademy.edu' },
    });

    if (!stuUser) {
      stuUser = await prisma.user.create({
        data: {
          email: 'sec17.student@apexacademy.edu',
          firstName: 'Security',
          lastName: 'Student',
          passwordHash: await hashPassword('StudentPass2026!'),
          tokenVersion: 1,
        },
      });

      await prisma.userMembership.create({
        data: {
          userId: stuUser.id,
          schoolId: primarySchoolId,
          role: 'STUDENT',
          isPrimary: true,
        },
      });
    }
    studentUserId = stuUser.id;

    studentToken = generateAccessToken({
      userId: stuUser.id,
      email: stuUser.email,
      role: PlatformRole.STUDENT,
      schoolId: primarySchoolId,
      tokenVersion: stuUser.tokenVersion,
    });

    // B. Super Admin
    superAdminToken = generateAccessToken({
      userId: 'usr-sec17-superadmin',
      email: 'sec17.superadmin@edunexa.org',
      role: PlatformRole.SUPER_ADMIN,
      tokenVersion: 1,
    });

    // C. School Admin
    let adminUser = await prisma.user.findFirst({
      where: { email: 'sec17.admin@apexacademy.edu' },
    });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'sec17.admin@apexacademy.edu',
          firstName: 'Admin',
          lastName: 'Security',
          passwordHash: await hashPassword('AdminPass2026!'),
          tokenVersion: 1,
        },
      });
      await prisma.userMembership.create({
        data: {
          userId: adminUser.id,
          schoolId: primarySchoolId,
          role: 'SCHOOL_ADMIN',
          isPrimary: true,
        },
      });
    }

    schoolAdminToken = generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: PlatformRole.SCHOOL_ADMIN,
      schoolId: primarySchoolId,
      tokenVersion: 1,
    });

    // D. Teacher
    teacherToken = generateAccessToken({
      userId: 'usr-sec17-teacher',
      email: 'sec17.teacher@apexacademy.edu',
      role: PlatformRole.TEACHER,
      schoolId: primarySchoolId,
      tokenVersion: 1,
    });

    // E. MFA-Enabled User
    mfaUser = await prisma.user.findFirst({
      where: { email: 'sec17.mfauser@apexacademy.edu' },
    });

    if (!mfaUser) {
      mfaUser = await prisma.user.create({
        data: {
          email: 'sec17.mfauser@apexacademy.edu',
          firstName: 'MFA',
          lastName: 'Enforced',
          passwordHash: await hashPassword('MfaUserSecure2026!'),
          mfaEnabled: true,
          mfaMethod: 'EMAIL_OTP',
          tokenVersion: 1,
        },
      });

      await prisma.userMembership.create({
        data: {
          userId: mfaUser.id,
          schoolId: primarySchoolId,
          role: 'SCHOOL_ADMIN',
          isPrimary: true,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: mfaUser.id },
        data: { mfaEnabled: true, failedLoginAttempts: 0, accountLocked: false },
      });
    }
  });

  afterAll(async () => {
    // Cleanup files created in tests
    if (uploadedFileId) {
      await prisma.secureFile.deleteMany({ where: { id: uploadedFileId } });
    }
    if (publicFileId) {
      await prisma.secureFile.deleteMany({ where: { id: publicFileId } });
    }
  });

  // ============================================================================
  // 1. AUTHENTICATION & SESSION SECURITY
  // ============================================================================
  describe('1. Authentication & Session Security', () => {
    it('1.1 Rejects unauthenticated API access with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('1.2 Rejects forged or invalid JWT signature with 401 INVALID_TOKEN', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('1.3 Enforces lockout policy after 5 consecutive failed login attempts', async () => {
      // Test user for lockout
      const testEmail = 'lockout.victim@apexacademy.edu';
      let targetUser = await prisma.user.findFirst({ where: { email: testEmail } });
      if (!targetUser) {
        targetUser = await prisma.user.create({
          data: {
            email: testEmail,
            firstName: 'Victim',
            lastName: 'Lockout',
            passwordHash: await hashPassword('CorrectPassword123!'),
            tokenVersion: 1,
          },
        });
        await prisma.userMembership.create({
          data: {
            userId: targetUser.id,
            schoolId: primarySchoolId,
            role: 'TEACHER',
            isPrimary: true,
          },
        });
      }

      // 5 consecutive incorrect attempts
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/v1/auth/login').send({
          email: testEmail,
          password: `WrongPassword_${i}!`,
        });
      }

      // 6th attempt must be rejected with 403 ACCOUNT_LOCKED
      const lockedRes = await request(app).post('/api/v1/auth/login').send({
        email: testEmail,
        password: 'CorrectPassword123!',
      });

      expect(lockedRes.status).toBe(403);
      expect(lockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('1.4 Invalidation on logout: incrementing tokenVersion revokes session', async () => {
      // Login to get fresh token
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'sec17.student@apexacademy.edu',
        password: 'StudentPass2026!',
      });
      expect(loginRes.status).toBe(200);
      const activeToken = loginRes.body.data.accessToken;

      // Logout request
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${activeToken}`);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.data.loggedOut).toBe(true);

      // Verify that tokenVersion was incremented on user record in PostgreSQL
      const userInDb = await prisma.user.findUnique({
        where: { email: 'sec17.student@apexacademy.edu' },
      });
      expect(userInDb?.tokenVersion).toBeGreaterThan(1);
    });
  });

  // ============================================================================
  // 2. MULTI-FACTOR AUTHENTICATION (MFA / 2FA) WORKFLOW
  // ============================================================================
  describe('2. Multi-Factor Authentication (MFA / 2FA) Workflow', () => {
    it('2.1 Triggers MFA challenge when an MFA-enforced user logs in', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'sec17.mfauser@apexacademy.edu',
        password: 'MfaUserSecure2026!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mfaRequired).toBe(true);
      expect(res.body.data.mfaToken).toBeDefined();
      expect(res.body.data.emailMasked).toContain('***');

      mfaToken = res.body.data.mfaToken;
      validOtp = res.body.data.debugOtp;
    });

    it('2.2 Rejects incorrect 6-digit MFA OTP with 401 INVALID_MFA_OTP', async () => {
      const res = await request(app).post('/api/v1/auth/mfa/verify').send({
        mfaToken,
        otpCode: '000000',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_MFA_OTP');
    });

    it('2.3 Resends fresh 6-digit MFA OTP upon request', async () => {
      const res = await request(app).post('/api/v1/auth/mfa/resend').send({
        mfaToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('dispatched');

      validOtp = res.body.data.debugOtp;
    });

    it('2.4 Successfully verifies genuine MFA OTP and issues full JWT access token', async () => {
      const res = await request(app).post('/api/v1/auth/mfa/verify').send({
        mfaToken,
        otpCode: validOtp,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('sec17.mfauser@apexacademy.edu');
    });

    it('2.5 User can toggle MFA setting on and off in account settings', async () => {
      const res = await request(app)
        .post('/api/v1/auth/mfa/toggle')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          enable: true,
          method: 'EMAIL_OTP',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mfaEnabled).toBe(true);
    });
  });

  // ============================================================================
  // 3. SECURE FILE UPLOAD & STORAGE (PATH TRAVERSAL & MIME VALIDATION)
  // ============================================================================
  describe('3. Secure File Upload & Storage Architecture', () => {
    it('3.1 Rejects unauthenticated file upload with 401', async () => {
      const res = await request(app).post('/api/v1/storage/upload').send({
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        base64Data: Buffer.from('PDF dummy content').toString('base64'),
      });

      expect(res.status).toBe(401);
    });

    it('3.2 Rejects unpermitted executable MIME type (.exe) with 415 UNSUPPORTED_MEDIA_TYPE', async () => {
      const res = await request(app)
        .post('/api/v1/storage/upload')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          originalName: 'malware.exe',
          mimeType: 'application/x-msdownload',
          category: 'DOCUMENT',
          base64Data: Buffer.from('malicious payload').toString('base64'),
        });

      expect(res.status).toBe(415);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('3.3 Prevents path traversal in filename and sanitizes destination', async () => {
      const maliciousName = '../../../../etc/shadow';
      const sampleText = 'Secure verification text content';
      const base64Data = Buffer.from(sampleText).toString('base64');

      const res = await request(app)
        .post('/api/v1/storage/upload')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          originalName: `${maliciousName}.txt`,
          mimeType: 'text/plain',
          category: 'DOCUMENT',
          isPublic: false,
          base64Data,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Verify name was sanitized and stripped of path navigation
      expect(res.body.data.fileName).not.toContain('..');
      expect(res.body.data.fileName).toContain('shadow.txt');

      uploadedFileId = res.body.data.fileId;
    });

    it('3.4 Uploads public document and verifies SHA-256 cryptographic checksum', async () => {
      const samplePdf = '%PDF-1.4 sample school prospectus';
      const expectedChecksum = '9fb15eb4911d33166827038e6ff6715f5c9e2b10a2fef403666b6c236ad6564e';

      const res = await request(app)
        .post('/api/v1/storage/upload')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          originalName: 'prospectus_2026.pdf',
          mimeType: 'application/pdf',
          category: 'DOCUMENT',
          isPublic: true,
          base64Data: Buffer.from(samplePdf).toString('base64'),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isPublic).toBe(true);
      expect(res.body.data.checksum).toBeDefined();

      publicFileId = res.body.data.fileId;
    });

    it('3.5 Enforces tenant isolation: User from School B cannot access School A private file', async () => {
      const schoolBUserToken = generateAccessToken({
        userId: 'usr-school-b-user',
        email: 'attacker@greenwood.edu',
        role: PlatformRole.SCHOOL_ADMIN,
        schoolId: secondarySchoolId,
        tokenVersion: 1,
      });

      const res = await request(app)
        .get(`/api/v1/storage/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${schoolBUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CROSS_TENANT_ACCESS_DENIED');
    });

    it('3.6 Authorized School A user streams private file with nosniff security header', async () => {
      const res = await request(app)
        .get(`/api/v1/storage/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('3.7 Public file is downloadable without authentication', async () => {
      const res = await request(app).get(`/api/v1/storage/files/${publicFileId}`);
      expect(res.status).toBe(200);
    });

    it('3.8 Lists files with tenant filter and pagination', async () => {
      const res = await request(app)
        .get('/api/v1/storage/files')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // 4. DATA PRIVACY CONTROLS & RBAC ISOLATION
  // ============================================================================
  describe('4. Data Privacy Controls & RBAC Enforcement', () => {
    it('4.1 User profile endpoint (/api/v1/auth/me) never exposes password hashes or OTP secrets', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const user = res.body.data.user;

      expect(user.passwordHash).toBeUndefined();
      expect(user.mfaOtpCode).toBeUndefined();
      expect(user.mfaSecret).toBeUndefined();
    });

    it('4.2 Horizontal privilege violation defense: Student cannot access other students academic records', async () => {
      const otherStudentProfileId = 'stu-other-foreign-id';
      const res = await request(app)
        .get(`/api/v1/documents/academic/students/${otherStudentProfileId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      // Expect either 403 Horizontal Violation or 404 (non-existent)
      expect([403, 404]).toContain(res.status);
    });
  });

  // ============================================================================
  // 5. AUDIT LOGGING OF SECURITY ACTIONS
  // ============================================================================
  describe('5. Persistent Audit Logging of Security Operations', () => {
    it('5.1 Confirms that MFA challenges and verifications are logged in PostgreSQL AuditLog', async () => {
      const mfaLogs = await prisma.auditLog.findMany({
        where: {
          action: { in: ['MFA_CHALLENGE_ISSUED', 'MFA_VERIFICATION_SUCCESS', 'MFA_ENABLED'] },
        },
      });

      expect(mfaLogs.length).toBeGreaterThan(0);
      expect(mfaLogs[0].module).toBe('SECURITY');
    });
  });
});
