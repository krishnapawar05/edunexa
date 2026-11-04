import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken, hashPassword, verifyPassword } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('Admin Password Reset, Account Recovery & Locking System Test Suite', () => {
  const superAdminToken = generateAccessToken({
    userId: 'usr-superadmin-01',
    email: 'superadmin@edunexa.org',
    role: PlatformRole.SUPER_ADMIN,
  });

  let schoolAId: string;
  let schoolBId: string;
  let schoolAdminAToken: string;
  let studentUser: any;
  let teacherUser: any;
  let principalUser: any;
  let hrUser: any;
  let examUser: any;
  let accountsUser: any;
  let parentUser: any;
  let crossTenantUser: any;
  let schoolAdminUser: any;

  beforeAll(async () => {
    // Ensure apex school exists
    const schoolA = await prisma.school.findFirst({
      where: {
        OR: [{ slug: 'apex-academy' }, { code: 'APEX-2026' }, { id: 'sch-apex-01' }],
      },
    });

    if (schoolA) {
      schoolAId = schoolA.id;
    } else {
      const createdA = await prisma.school.create({
        data: {
          name: 'Apex Academy Test',
          slug: 'apex-academy-test',
          code: 'APX-TEST',
          email: 'office@apex-test.edu',
          phone: '+91 80 4000 0000',
          address: 'Main Campus',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
        },
      });
      schoolAId = createdA.id;
    }

    // Ensure secondary tenant exists for cross-tenant tests
    let schoolB = await prisma.school.findFirst({
      where: {
        OR: [
          { slug: 'greenwood-high-test' },
          { slug: 'greenwood-high' },
          { code: 'GWD-TEST' },
          { code: 'GWD-02' },
          { id: 'sch-greenwood-02' },
        ],
      },
    });

    if (!schoolB) {
      schoolB = await prisma.school.create({
        data: {
          name: 'Greenwood High Test',
          slug: 'greenwood-high-test',
          code: 'GWD-TEST',
          email: 'office@greenwood-test.edu',
          phone: '+91 80 4000 0001',
          address: 'North Campus',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      });
    }
    schoolBId = schoolB.id;

    // Helper to find or create test user
    const ensureUserWithRole = async (
      email: string,
      role: any,
      schoolId: string,
      firstName: string,
      lastName: string
    ) => {
      let u = await prisma.user.findUnique({
        where: { email },
        include: { memberships: true },
      });

      if (!u) {
        const pwHash = await hashPassword('InitialPass123!');
        u = await prisma.user.create({
          data: {
            email,
            username: email.split('@')[0],
            passwordHash: pwHash,
            firstName,
            lastName,
            isActive: true,
            accountLocked: false,
            failedLoginAttempts: 0,
            memberships: {
              create: {
                schoolId,
                role,
                isActive: true,
              },
            },
          },
          include: { memberships: true },
        });
      } else {
        const hasMembership = u.memberships.some((m) => m.schoolId === schoolId);
        if (!hasMembership) {
          await prisma.userMembership.create({
            data: {
              userId: u.id,
              schoolId,
              role,
              isActive: true,
            },
          });
        }
      }
      return u;
    };

    schoolAdminUser = await ensureUserWithRole(
      'admin.test@apexacademy.edu',
      PlatformRole.SCHOOL_ADMIN,
      schoolAId,
      'School',
      'Administrator'
    );

    schoolAdminAToken = generateAccessToken({
      userId: schoolAdminUser.id,
      email: schoolAdminUser.email,
      schoolId: schoolAId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    studentUser = await ensureUserWithRole(
      'student.test@apexacademy.edu',
      PlatformRole.STUDENT,
      schoolAId,
      'Rohan',
      'Verma'
    );

    teacherUser = await ensureUserWithRole(
      'teacher.test@apexacademy.edu',
      PlatformRole.TEACHER,
      schoolAId,
      'Vikram',
      'Bhat'
    );

    principalUser = await ensureUserWithRole(
      'principal.test@apexacademy.edu',
      PlatformRole.PRINCIPAL,
      schoolAId,
      'Dr. Robert',
      'Langdon'
    );

    hrUser = await ensureUserWithRole(
      'hr.test@apexacademy.edu',
      PlatformRole.HR_STAFF,
      schoolAId,
      'Sunita',
      'Pillai'
    );

    examUser = await ensureUserWithRole(
      'exam.test@apexacademy.edu',
      PlatformRole.EXAM_COORDINATOR,
      schoolAId,
      'Anand',
      'Kumar'
    );

    accountsUser = await ensureUserWithRole(
      'accounts.test@apexacademy.edu',
      PlatformRole.ACCOUNTS,
      schoolAId,
      'Meena',
      'Iyer'
    );

    parentUser = await ensureUserWithRole(
      'parent.test@apexacademy.edu',
      PlatformRole.PARENT,
      schoolAId,
      'Suresh',
      'Verma'
    );

    crossTenantUser = await ensureUserWithRole(
      'student.other@greenwood.edu',
      PlatformRole.STUDENT,
      schoolBId,
      'Cross',
      'Tenant'
    );
  });

  // --------------------------------------------------------------------------
  // 1. Super Admin Password Reset
  // --------------------------------------------------------------------------
  it('1. Super Admin resets School Admin password with temporary password (persisted in DB)', async () => {
    const tempPassword = 'TempAdminPass@2026';

    const res = await request(app)
      .post(`/api/v1/superadmin/accounts/${schoolAdminUser.id}/reset-password`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        temporaryPassword: tempPassword,
        mustChangePassword: true,
        reason: 'Super Admin manual reset',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.temporaryPassword).toBe(tempPassword);
    expect(res.body.data.mustChangePassword).toBe(true);

    // Verify direct PostgreSQL persistence via Prisma
    const updatedUser = await prisma.user.findUnique({
      where: { id: schoolAdminUser.id },
    });
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.mustChangePassword).toBe(true);
    expect(updatedUser?.passwordResetAt).toBeInstanceOf(Date);
    expect(updatedUser?.accountLocked).toBe(false);

    // Verify password hash matches temporary password
    const isPwMatch = await verifyPassword(tempPassword, updatedUser!.passwordHash);
    expect(isPwMatch).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. School Admin resets Student password
  // --------------------------------------------------------------------------
  it('2. School Admin resets Student password with auto-generated secure credentials', async () => {
    const res = await request(app)
      .post(`/api/v1/core/accounts/${studentUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        mustChangePassword: true,
        reason: 'Student forgot login credentials',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.temporaryPassword).toBeDefined();
    expect(res.body.data.temporaryPassword.length).toBeGreaterThanOrEqual(12);
    expect(res.body.data.mustChangePassword).toBe(true);

    const updatedStudent = await prisma.user.findUnique({
      where: { id: studentUser.id },
    });
    expect(updatedStudent?.mustChangePassword).toBe(true);
    expect(updatedStudent?.passwordResetAt).toBeInstanceOf(Date);
  });

  // --------------------------------------------------------------------------
  // 3. School Admin resets Teacher password
  // --------------------------------------------------------------------------
  it('3. School Admin resets Teacher password with manual temporary credentials', async () => {
    const tempPass = 'TeacherTempPass!2026';
    const res = await request(app)
      .post(`/api/v1/core/accounts/${teacherUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        temporaryPassword: tempPass,
        mustChangePassword: true,
        reason: 'Teacher onboarding recovery',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.temporaryPassword).toBe(tempPass);

    const updatedTeacher = await prisma.user.findUnique({
      where: { id: teacherUser.id },
    });
    expect(await verifyPassword(tempPass, updatedTeacher!.passwordHash)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 4. School Admin resets Principal password
  // --------------------------------------------------------------------------
  it('4. School Admin resets Principal password', async () => {
    const res = await request(app)
      .post(`/api/v1/core/accounts/${principalUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        mustChangePassword: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.temporaryPassword).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 5. School Admin resets HR Staff password
  // --------------------------------------------------------------------------
  it('5. School Admin resets HR Staff password', async () => {
    const res = await request(app)
      .post(`/api/v1/core/accounts/${hrUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        mustChangePassword: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 6. School Admin resets Exam Coordinator password
  // --------------------------------------------------------------------------
  it('6. School Admin resets Exam Coordinator password', async () => {
    const res = await request(app)
      .post(`/api/v1/core/accounts/${examUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        mustChangePassword: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. School Admin resets Accounts Staff password
  // --------------------------------------------------------------------------
  it('7. School Admin resets Accounts Staff password', async () => {
    const res = await request(app)
      .post(`/api/v1/core/accounts/${accountsUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        mustChangePassword: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 8. School Admin resets Parent password
  // --------------------------------------------------------------------------
  it('8. School Admin resets Parent password', async () => {
    const res = await request(app)
      .post(`/api/v1/core/accounts/${parentUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        mustChangePassword: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 9. Privilege Escalation Prevention: Cannot reset Super Admin
  // --------------------------------------------------------------------------
  it('9. School Admin is prohibited from resetting Super Admin password (403 FORBIDDEN_OPERATION)', async () => {
    const superAdminUser = await prisma.user.findFirst({
      where: {
        memberships: { some: { role: PlatformRole.SUPER_ADMIN } },
      },
    });

    if (superAdminUser) {
      const res = await request(app)
        .post(`/api/v1/core/accounts/${superAdminUser.id}/admin-reset-password`)
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({
          temporaryPassword: 'IllegalPassword@123',
        });

      expect([403, 404]).toContain(res.status);
    }
  });

  // --------------------------------------------------------------------------
  // 10. Cross-Tenant Isolation: Cannot reset user of another school
  // --------------------------------------------------------------------------
  it('10. School Admin is prohibited from resetting accounts belonging to another tenant (404/403)', async () => {
    const res = await request(app)
      .post(`/api/v1/core/accounts/${crossTenantUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        mustChangePassword: true,
      });

    expect([403, 404]).toContain(res.status);
  });

  // --------------------------------------------------------------------------
  // 11. Forced Password Change Enforcement on Login
  // --------------------------------------------------------------------------
  it('11. Login returns mustChangePassword = true for reset account and accepts temporary password', async () => {
    const tempPass = 'StudentTemp!987';
    await request(app)
      .post(`/api/v1/core/accounts/${studentUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        temporaryPassword: tempPass,
        mustChangePassword: true,
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: studentUser.email,
        password: tempPass,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 12. Individual User changes password clearing mustChangePassword
  // --------------------------------------------------------------------------
  it('12. User updates password via /api/v1/auth/change-password, clearing mustChangePassword in DB', async () => {
    const tempPass = 'UserChangePass!2026';
    const newConfidentialPass = 'PermanentSecretPass!99';

    await request(app)
      .post(`/api/v1/core/accounts/${studentUser.id}/admin-reset-password`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        temporaryPassword: tempPass,
        mustChangePassword: true,
      });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: studentUser.email,
        password: tempPass,
      });

    const studentToken = studentLogin.body.data.accessToken;

    const changeRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        currentPassword: tempPass,
        newPassword: newConfidentialPass,
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);

    // Verify database reflection
    const postChangeUser = await prisma.user.findUnique({
      where: { id: studentUser.id },
    });
    expect(postChangeUser?.mustChangePassword).toBe(false);
    expect(postChangeUser?.passwordChangedAt).toBeInstanceOf(Date);

    // Verify new password works for login and mustChangePassword is false
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: studentUser.email,
        password: newConfidentialPass,
      });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.user.mustChangePassword).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 13. Brute Force Defense & Account Locking
  // --------------------------------------------------------------------------
  it('13. Account locks automatically after 5 consecutive failed login attempts (403 ACCOUNT_LOCKED)', async () => {
    // Attempt 5 incorrect logins
    for (let i = 0; i < 4; i++) {
      const failedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: parentUser.email,
          password: `WrongPasswordAttempt${i}!`,
        });
      expect(failedRes.status).toBe(401);
    }

    // 5th attempt triggers lockout
    const fifthRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: parentUser.email,
        password: 'WrongPasswordFifth!',
      });
    expect(fifthRes.status).toBe(403);
    expect(fifthRes.body.error?.code).toBe('ACCOUNT_LOCKED');

    // Verify DB state
    const lockedUser = await prisma.user.findUnique({
      where: { id: parentUser.id },
    });
    expect(lockedUser?.accountLocked).toBe(true);
    expect(lockedUser?.failedLoginAttempts).toBeGreaterThanOrEqual(5);
  });

  // --------------------------------------------------------------------------
  // 14. Admin Unlocks Account
  // --------------------------------------------------------------------------
  it('14. School Admin unlocks locked account, restoring access', async () => {
    const unlockRes = await request(app)
      .post(`/api/v1/core/accounts/${parentUser.id}/unlock`)
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        reason: 'Parent identity verified by administration office',
      });

    expect(unlockRes.status).toBe(200);
    expect(unlockRes.body.success).toBe(true);

    const unlockedUser = await prisma.user.findUnique({
      where: { id: parentUser.id },
    });
    expect(unlockedUser?.accountLocked).toBe(false);
    expect(unlockedUser?.failedLoginAttempts).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 15. Universal Multi-Select Bulk Actions on Accounts
  // --------------------------------------------------------------------------
  it('15. Bulk account status updates and unlocking via /api/v1/core/accounts/bulk-actions', async () => {
    const bulkRes = await request(app)
      .post('/api/v1/core/accounts/bulk-actions')
      .set('Authorization', `Bearer ${schoolAdminAToken}`)
      .send({
        userIds: [studentUser.id, teacherUser.id],
        action: 'UNLOCK',
        reason: 'Universal multi-select unlock',
      });

    expect(bulkRes.status).toBe(200);
    expect(bulkRes.body.success).toBe(true);
    expect(bulkRes.body.data.processedCount).toBe(2);
  });
});
