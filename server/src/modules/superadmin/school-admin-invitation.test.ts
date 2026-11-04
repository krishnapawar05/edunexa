import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('SUPER ADMIN: School Admin Onboarding, Invitation & Activation Test Suite', () => {
  const superAdminToken = generateAccessToken({
    userId: 'usr-superadmin-01',
    email: 'superadmin@edunexa.org',
    role: PlatformRole.SUPER_ADMIN,
  });

  const teacherTokenSchoolA = generateAccessToken({
    userId: 'usr-teacher-01',
    email: 'dr.thorne@apexacademy.edu',
    schoolId: 'sch-apex-01',
    staffProfileId: 'staff-thorne-01',
    role: PlatformRole.TEACHER,
  });

  const schoolAdminTokenSchoolA = generateAccessToken({
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  const uniqueSuffix = Date.now().toString().slice(-5);
  let createdSchoolId: string;
  let createdSchoolCode: string;
  let adminEmail: string;
  let invitationId: string;
  let rawToken: string | undefined;

  // --------------------------------------------------------------------------
  // 1. School Onboarding with School Admin Details
  // --------------------------------------------------------------------------
  it('1. Super Admin onboards new school with School Admin details and issues invitation', async () => {
    createdSchoolCode = `INV-${uniqueSuffix}`;
    adminEmail = `principal-${uniqueSuffix}@invacademy.edu`;

    const onboardRes = await request(app)
      .post('/api/v1/superadmin/schools')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: `Invictus Academy ${uniqueSuffix}`,
        code: createdSchoolCode,
        email: `office-${uniqueSuffix}@invacademy.edu`,
        phone: '+91 80 4999 1234',
        address: '77 Innovation Park',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'India',
        planName: 'Pro',
        adminFullName: 'Dr. Raymond Holt',
        adminEmail,
        adminPhone: '+91 80 4999 5678',
        sendInvitation: true,
      });

    expect(onboardRes.status).toBe(201);
    expect(onboardRes.body.success).toBe(true);
    expect(onboardRes.body.data).toHaveProperty('id');
    expect(onboardRes.body.data.name).toBe(`Invictus Academy ${uniqueSuffix}`);

    createdSchoolId = onboardRes.body.data.id;

    // Check school admin details
    expect(onboardRes.body.data).toHaveProperty('schoolAdmin');
    expect(onboardRes.body.data.schoolAdmin).not.toBeNull();
    expect(onboardRes.body.data.schoolAdmin.email).toBe(adminEmail);
    expect(onboardRes.body.data.schoolAdmin.accountStatus).toBe('PENDING_ACTIVATION');
    expect(onboardRes.body.data.invitationStatus).toBe('SENT');

    if (onboardRes.body.data.schoolAdmin.invitation) {
      invitationId = onboardRes.body.data.schoolAdmin.invitation.id;
    }
    rawToken = onboardRes.body.data.schoolAdmin.rawActivationToken;
  });

  // --------------------------------------------------------------------------
  // 2. Cryptographic Security: Token Hashing
  // --------------------------------------------------------------------------
  it('2. Invitation token is securely hashed with SHA-256 and never stored in plaintext', async () => {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      const invRecord = await prisma.accountInvitation.findFirst({
        where: {
          schoolId: createdSchoolId,
          role: 'SCHOOL_ADMIN',
        },
      });

      expect(invRecord).not.toBeNull();
      invitationId = invRecord!.id;

      // SHA-256 hash must be 64 characters hex
      expect(invRecord!.tokenHash).toHaveLength(64);
      expect(invRecord!.tokenHash).toMatch(/^[a-f0-9]{64}$/);

      // Raw token must NOT be equal to the stored hash
      if (rawToken) {
        expect(invRecord!.tokenHash).not.toBe(rawToken);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3. Super Admin Views School Admin Invitation Status
  // --------------------------------------------------------------------------
  it('3. Super Admin can view invitation status ledger for the school tenant', async () => {
    const res = await request(app)
      .get(`/api/v1/superadmin/schools/${createdSchoolId}/invitations`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const latest = res.body.data[0];
    expect(latest.email).toBe(adminEmail);
    expect(latest.role).toBe(PlatformRole.SCHOOL_ADMIN);
    expect(['PENDING', 'SENT']).toContain(latest.status);
    expect(latest).toHaveProperty('expiresAt');
    expect(latest).toHaveProperty('deliveryStatus');
    if (!invitationId) {
      invitationId = latest.id;
    }
  });

  // --------------------------------------------------------------------------
  // 4. Role Authorization Boundary Guards
  // --------------------------------------------------------------------------
  it('4a. Non-Super Admin (Teacher) cannot view school admin invitations (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/superadmin/schools/${createdSchoolId}/invitations`)
      .set('Authorization', `Bearer ${teacherTokenSchoolA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('4b. Non-Super Admin (Teacher) cannot issue school admin invitations (403)', async () => {
    const res = await request(app)
      .post(`/api/v1/superadmin/schools/${createdSchoolId}/invitations/send`)
      .set('Authorization', `Bearer ${teacherTokenSchoolA}`)
      .send({
        adminFullName: 'Unauthorized Attempt',
        adminEmail: 'hacker@unauthorized.com',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  // --------------------------------------------------------------------------
  // 5. Super Admin Resend Invitation
  // --------------------------------------------------------------------------
  it('5. Super Admin can resend invitation with fresh expiring token', async () => {
    if (!invitationId) return;

    const res = await request(app)
      .post(`/api/v1/superadmin/schools/${createdSchoolId}/invitations/${invitationId}/resend`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data).toHaveProperty('expiresAt');

    if (res.body.data.rawToken) {
      rawToken = res.body.data.rawToken;
    }
  });

  // --------------------------------------------------------------------------
  // 6. Super Admin Revoke Invitation
  // --------------------------------------------------------------------------
  it('6a. Super Admin can revoke an outstanding invitation', async () => {
    if (!invitationId) return;

    const revokeRes = await request(app)
      .post(`/api/v1/superadmin/schools/${createdSchoolId}/invitations/${invitationId}/revoke`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Admin email updated before activation' });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);
    expect(revokeRes.body.data.status).toBe('REVOKED');
  });

  it('6b. Revoked invitation cannot be verified or used to activate account', async () => {
    if (!rawToken) return;

    // Verify should fail
    const verifyRes = await request(app)
      .get(`/api/v1/auth/invitations/verify/${rawToken}`);

    expect([400, 404]).toContain(verifyRes.status);
    expect(verifyRes.body.success).toBe(false);

    // Activation attempt must fail
    const activateRes = await request(app)
      .post('/api/v1/auth/invitations/activate')
      .send({
        token: rawToken,
        password: 'SecureAdminPass2026!',
      });

    expect(activateRes.status).toBe(400);
    expect(activateRes.body.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 7. Issue Fresh Invitation and Complete Account Activation Workflow
  // --------------------------------------------------------------------------
  let activeToken: string | undefined;
  const activatedAdminEmail = `active-admin-${uniqueSuffix}@invacademy.edu`;

  it('7a. Super Admin sends fresh invitation for replacement School Admin', async () => {
    const sendRes = await request(app)
      .post(`/api/v1/superadmin/schools/${createdSchoolId}/invitations/send`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        adminFullName: 'Amy Santiago',
        adminEmail: activatedAdminEmail,
        adminPhone: '+91 80 4999 8888',
        sendInvitation: true,
      });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.success).toBe(true);
    expect(sendRes.body.data.user.email).toBe(activatedAdminEmail);
    expect(sendRes.body.data.invitation.status).toBe('PENDING');

    activeToken = sendRes.body.data.rawActivationToken;
    expect(activeToken).toBeDefined();
  });

  it('7b. Verify token endpoint confirms recipient details without exposing secret', async () => {
    if (!activeToken) return;

    const verifyRes = await request(app)
      .get(`/api/v1/auth/invitations/verify/${activeToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.valid).toBe(true);
    expect(verifyRes.body.data.email).toBe(activatedAdminEmail);
    expect(verifyRes.body.data.role).toBe(PlatformRole.SCHOOL_ADMIN);
    expect(verifyRes.body.data.schoolName).toBe(`Invictus Academy ${uniqueSuffix}`);
  });

  it('7c. Activation rejects weak password', async () => {
    if (!activeToken) return;

    const weakRes = await request(app)
      .post('/api/v1/auth/invitations/activate')
      .send({
        token: activeToken,
        password: 'weak',
      });

    expect([400, 422]).toContain(weakRes.status);
    expect(weakRes.body.success).toBe(false);
  });

  it('7d. School Admin activates account with strong password and status transitions to ACTIVE', async () => {
    if (!activeToken) return;

    const activateRes = await request(app)
      .post('/api/v1/auth/invitations/activate')
      .send({
        token: activeToken,
        password: 'StrongAdminPass2026!',
      });

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.success).toBe(true);
    expect(activateRes.body.data.email).toBe(activatedAdminEmail);
    expect(activateRes.body.data.role).toBe(PlatformRole.SCHOOL_ADMIN);
  });

  it('7e. Single-use token enforcement: Second activation attempt with same token is rejected', async () => {
    if (!activeToken) return;

    const secondAttempt = await request(app)
      .post('/api/v1/auth/invitations/activate')
      .send({
        token: activeToken,
        password: 'StrongAdminPass2026!',
      });

    expect(secondAttempt.status).toBe(400);
    expect(secondAttempt.body.success).toBe(false);
  });

  it('7f. Activated School Admin can log in successfully with newly chosen password', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: activatedAdminEmail,
        password: 'StrongAdminPass2026!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data).toHaveProperty('accessToken');
    expect(loginRes.body.data.user.role).toBe(PlatformRole.SCHOOL_ADMIN);
    expect(loginRes.body.data.user.schoolId).toBe(createdSchoolId);
  });

  // --------------------------------------------------------------------------
  // 8. Duplicate Prevention
  // --------------------------------------------------------------------------
  it('8. Prevents duplicate active School Admin accounts for same email and tenant (409)', async () => {
    const dupRes = await request(app)
      .post(`/api/v1/superadmin/schools/${createdSchoolId}/invitations/send`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        adminFullName: 'Amy Santiago Duplicate',
        adminEmail: activatedAdminEmail,
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.error.code).toBe('DUPLICATE_SCHOOL_ADMIN');
  });
});
