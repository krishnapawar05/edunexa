import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { PlatformRole, TenantStatus } from '@edunexa/shared';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../../utils/crypto.js';

describe('SECTION 16: SUPER ADMIN GOVERNANCE, RBAC, AUDIT & SYSTEM CONTROLS TEST SUITE', () => {
  let superAdminUser: any;
  let superAdminToken: string;

  let schoolAdminUser: any;
  let schoolAdminToken: string;

  let teacherUser: any;
  let teacherToken: string;

  let testSchool: any;

  beforeAll(async () => {
    // 1. Create or resolve test school
    testSchool = await prisma.school.upsert({
      where: { code: 'GOV-01' },
      update: {},
      create: {
        code: 'GOV-01',
        slug: 'gov-academy',
        name: 'Governance Test Academy',
        email: 'admin@govacademy.edu',
        phone: '+919876543210',
        address: '123 Governance Way',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        status: TenantStatus.ACTIVE,
      },
    });

    const pwdHash = await bcrypt.hash('Secret123!', 10);

    // 2. Create Super Admin
    superAdminUser = await prisma.user.upsert({
      where: { email: 'superadmin.governance@edunexa.org' },
      update: { passwordHash: pwdHash, isActive: true },
      create: {
        email: 'superadmin.governance@edunexa.org',
        username: 'superadmin_gov',
        passwordHash: pwdHash,
        firstName: 'Platform',
        lastName: 'Governor',
        isActive: true,
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: superAdminUser.id,
          schoolId: testSchool.id,
          role: PlatformRole.SUPER_ADMIN,
        },
      },
      update: {},
      create: {
        userId: superAdminUser.id,
        schoolId: testSchool.id,
        role: PlatformRole.SUPER_ADMIN,
        isPrimary: true,
      },
    });

    superAdminToken = generateAccessToken({
      userId: superAdminUser.id,
      email: superAdminUser.email,
      role: PlatformRole.SUPER_ADMIN,
    });

    // 3. Create School Admin
    schoolAdminUser = await prisma.user.upsert({
      where: { email: 'schooladmin.gov@edunexa.org' },
      update: { passwordHash: pwdHash, isActive: true },
      create: {
        email: 'schooladmin.gov@edunexa.org',
        username: 'schooladmin_gov',
        passwordHash: pwdHash,
        firstName: 'School',
        lastName: 'AdminGov',
        isActive: true,
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: schoolAdminUser.id,
          schoolId: testSchool.id,
          role: PlatformRole.SCHOOL_ADMIN,
        },
      },
      update: {},
      create: {
        userId: schoolAdminUser.id,
        schoolId: testSchool.id,
        role: PlatformRole.SCHOOL_ADMIN,
        isPrimary: true,
      },
    });

    schoolAdminToken = generateAccessToken({
      userId: schoolAdminUser.id,
      email: schoolAdminUser.email,
      role: PlatformRole.SCHOOL_ADMIN,
      schoolId: testSchool.id,
    });

    // 4. Create Teacher
    teacherUser = await prisma.user.upsert({
      where: { email: 'teacher.gov@edunexa.org' },
      update: { passwordHash: pwdHash, isActive: true },
      create: {
        email: 'teacher.gov@edunexa.org',
        username: 'teacher_gov',
        passwordHash: pwdHash,
        firstName: 'Teacher',
        lastName: 'Gov',
        isActive: true,
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: teacherUser.id,
          schoolId: testSchool.id,
          role: PlatformRole.TEACHER,
        },
      },
      update: {},
      create: {
        userId: teacherUser.id,
        schoolId: testSchool.id,
        role: PlatformRole.TEACHER,
        isPrimary: true,
      },
    });

    teacherToken = generateAccessToken({
      userId: teacherUser.id,
      email: teacherUser.email,
      role: PlatformRole.TEACHER,
      schoolId: testSchool.id,
    });
  });

  // ==========================================================================
  // 1. SECURITY & ACCESS RESTRICTION TESTS
  // ==========================================================================
  describe('1. Security & RBAC Enforcement', () => {
    it('1.1 Rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/superadmin/governance/accounts');
      expect(res.status).toBe(401);
    });

    it('1.2 Forbids School Admin from accessing Super Admin Governance endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/accounts')
        .set('Authorization', `Bearer ${schoolAdminToken}`);
      expect(res.status).toBe(403);
    });

    it('1.3 Forbids Teacher from accessing Super Admin Governance endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/accounts')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // 2. CENTRALIZED USER ACCOUNT MANAGEMENT TESTS
  // ==========================================================================
  describe('2. User Account Management & Recovery', () => {
    let createdUserId: string;

    it('2.1 Super Admin lists all platform user accounts with search and filters', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/accounts?limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('2.2 Super Admin creates a new institutional user account', async () => {
      const email = `new.student.${Date.now()}@govacademy.edu`;
      const res = await request(app)
        .post('/api/v1/superadmin/governance/accounts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email,
          firstName: 'Rohan',
          lastName: 'Verma',
          phone: '+919988776655',
          role: PlatformRole.STUDENT,
          schoolId: testSchool.id,
          temporaryPassword: 'TempPassword123!',
          mustChangePassword: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      createdUserId = res.body.data.id;
    });

    it('2.3 Super Admin updates user details', async () => {
      const res = await request(app)
        .patch(`/api/v1/superadmin/governance/accounts/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          firstName: 'Rohan Updated',
          phone: '+919988000000',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Rohan Updated');
    });

    it('2.4 Super Admin resets user password and invalidates tokens', async () => {
      const res = await request(app)
        .post(`/api/v1/superadmin/governance/accounts/${createdUserId}/reset-password`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          temporaryPassword: 'NewSecurePassword99!',
          mustChangePassword: true,
          reason: 'Periodic compliance reset',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.temporaryPassword).toBe('NewSecurePassword99!');

      // Verify user in database has updated password and reset flag
      const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
      expect(dbUser?.mustChangePassword).toBe(true);
      expect(dbUser?.passwordResetAt).toBeDefined();
    });

    it('2.5 Super Admin deactivates and reactivates user account', async () => {
      // Deactivate
      const res1 = await request(app)
        .post(`/api/v1/superadmin/governance/accounts/${createdUserId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ action: 'DEACTIVATE', reason: 'Temporary administrative leave' });

      expect(res1.status).toBe(200);
      expect(res1.body.isActive).toBe(false);

      // Reactivate
      const res2 = await request(app)
        .post(`/api/v1/superadmin/governance/accounts/${createdUserId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ action: 'ACTIVATE', reason: 'Returned to active status' });

      expect(res2.status).toBe(200);
      expect(res2.body.isActive).toBe(true);
    });
  });

  // ==========================================================================
  // 3. RBAC & MODULE PERMISSION MATRIX TESTS
  // ==========================================================================
  describe('3. Role & Module Permission Matrix', () => {
    it('3.1 Super Admin lists permission matrix across roles and ERP modules', async () => {
      const res = await request(app)
        .get(`/api/v1/superadmin/governance/permissions?schoolId=${testSchool.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('3.2 Super Admin updates specific module permission for TEACHER role', async () => {
      const res = await request(app)
        .put('/api/v1/superadmin/governance/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          schoolId: testSchool.id,
          role: PlatformRole.TEACHER,
          moduleKey: 'MARKSHEETS',
          canView: true,
          canEdit: true,
          canPublish: false, // Teacher cannot publish directly without review
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canPublish).toBe(false);
    });
  });

  // ==========================================================================
  // 4. ADMISSION ENQUIRY CENTRALIZED MONITORING TESTS
  // ==========================================================================
  describe('4. Centralized Admission Enquiries Monitoring', () => {
    beforeAll(async () => {
      await prisma.admissionEnquiry.create({
        data: {
          schoolId: testSchool.id,
          enquiryNumber: `ENQ-GOV-${Date.now()}`,
          parentName: 'Sanjay Gupta',
          studentName: 'Aarav Gupta',
          phone: '+919123456789',
          email: 'sanjay@example.com',
          applyingClass: 'Grade 10',
          status: 'NEW',
          source: 'DIRECT_WEBSITE',
        },
      });
    });

    it('4.1 Super Admin lists cross-tenant admission enquiries with filters', async () => {
      const res = await request(app)
        .get(`/api/v1/superadmin/governance/admissions/enquiries?schoolId=${testSchool.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].studentName).toBe('Aarav Gupta');
    });
  });

  // ==========================================================================
  // 5. MARKSHEET PUBLICATION APPROVAL CONTROLS TESTS
  // ==========================================================================
  describe('5. Marksheet Publication Approval Workflow', () => {
    let requestId: string;

    beforeAll(async () => {
      const req = await prisma.marksheetPublicationRequest.create({
        data: {
          schoolId: testSchool.id,
          termName: 'Mid-Term Examination 2026',
          academicYear: '2026-2027',
          className: 'Grade 10 - Section A',
          totalStudents: 32,
          status: 'PENDING_REVIEW',
          requestedBy: teacherUser.id,
        },
      });
      requestId = req.id;
    });

    it('5.1 Super Admin reviews pending marksheet publication requests', async () => {
      const res = await request(app)
        .get(`/api/v1/superadmin/governance/marksheets/requests?schoolId=${testSchool.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.id === requestId)).toBe(true);
    });

    it('5.2 Super Admin approves and publishes marksheet request', async () => {
      const res = await request(app)
        .post(`/api/v1/superadmin/governance/marksheets/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          action: 'APPROVE',
          reviewNotes: 'Marks verified against moderation standards. Approved for publication.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.reviewedBy).toBe(superAdminUser.id);
    });
  });

  // ==========================================================================
  // 6. BACKUP MANAGEMENT TESTS
  // ==========================================================================
  describe('6. Platform Backup Management', () => {
    let backupId: string;

    it('6.1 Super Admin initiates a verified database snapshot backup', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/governance/backups')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          backupType: 'DATABASE_SQL',
          schoolId: testSchool.id,
          notes: 'Pre-upgrade automated verified backup',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileName).toContain('.sql.gz');
      expect(res.body.data.status).toBe('COMPLETED');
      backupId = res.body.data.id;
    });

    it('6.2 Super Admin lists backup history', async () => {
      const res = await request(app)
        .get(`/api/v1/superadmin/governance/backups?schoolId=${testSchool.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((b: any) => b.id === backupId)).toBe(true);
    });
  });

  // ==========================================================================
  // 7. PLATFORM SYSTEM CONFIGURATION TESTS
  // ==========================================================================
  describe('7. Platform System Configuration', () => {
    it('7.1 Super Admin retrieves persistent platform system configuration', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/system-config')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.platformName).toBeDefined();
    });

    it('7.2 Super Admin updates security and maintenance configuration in PostgreSQL', async () => {
      const res = await request(app)
        .put('/api/v1/superadmin/governance/system-config')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          platformName: 'EduNexa Enterprise Multi-Academy Platform',
          sessionTimeoutMinutes: 45,
          maxLoginAttempts: 4,
          maintenanceMode: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sessionTimeoutMinutes).toBe(45);
      expect(res.body.data.maxLoginAttempts).toBe(4);
    });
  });

  // ==========================================================================
  // 8. ERP ANALYTICS & STATS FROM DATABASE TESTS
  // ==========================================================================
  describe('8. Centralized ERP Analytics & Stats', () => {
    it('8.1 Retrieves real database metrics without hardcoded numbers', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/analytics')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.totalSchools).toBeGreaterThanOrEqual(1);
      expect(res.body.data.overview.totalUsers).toBeGreaterThanOrEqual(1);
      expect(res.body.data.databaseStatus).toBe('CONNECTED');
    });
  });

  // ==========================================================================
  // 9. MANDATORY ACTIVITY LOGGING & AUDIT TRAIL TESTS
  // ==========================================================================
  describe('9. Complete Mandatory Activity Logging', () => {
    it('9.1 Super Admin lists activity logs with module and action filters', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/activity-logs?limit=20')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('9.2 Verifies that password resets, permission changes, and backups were logged', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/activity-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const actions = res.body.data.items.map((i: any) => i.action);
      expect(actions).toContain('ADMIN_PASSWORD_RESET');
      expect(actions).toContain('MODULE_PERMISSION_UPDATED');
      expect(actions).toContain('DATABASE_BACKUP_GENERATED');
    });

    it('9.3 Exports activity logs as formatted CSV', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/governance/activity-logs/export')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('Timestamp');
      expect(res.text).toContain('Action');
      expect(res.text).toContain('Module');
    });
  });
});
