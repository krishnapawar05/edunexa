import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('UNIVERSAL MULTI-SELECT & BULK ACTIONS TEST SUITE', () => {
  const schoolAdminToken = generateAccessToken({
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  const superAdminToken = generateAccessToken({
    userId: 'usr-superadmin-01',
    email: 'superadmin@edunexa.org',
    role: PlatformRole.SUPER_ADMIN,
  });

  const studentToken = generateAccessToken({
    userId: 'usr-student-01',
    email: 'aarav.sharma@student.apex.edu',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    role: PlatformRole.STUDENT,
  });

  let studentId1: string;
  let studentId2: string;
  let staffId1: string;
  let realSchoolId: string = 'sch-apex-01';

  beforeAll(async () => {
    const school = await prisma.school.findFirst({
      where: { OR: [{ slug: 'apex-academy' }, { code: 'APEX-2026' }, { id: 'sch-apex-01' }] },
    });
    if (school) realSchoolId = school.id;

    // Find two students in Apex Academy
    const students = await prisma.studentProfile.findMany({
      where: { membership: { schoolId: realSchoolId } },
      take: 2,
    });
    if (students.length >= 2) {
      studentId1 = students[0].id;
      studentId2 = students[1].id;
    } else if (students.length === 1) {
      studentId1 = students[0].id;
      studentId2 = students[0].id;
    } else {
      studentId1 = 'stu-aarav-01';
      studentId2 = 'stu-aarav-01';
    }

    const staff = await prisma.staffProfile.findFirst({
      where: { membership: { schoolId: 'sch-apex-01' } },
    });
    staffId1 = staff ? staff.id : 'staff-thorne-01';
  });

  // ==========================================================================
  // 1. STUDENT BULK ACTIONS
  // ==========================================================================
  describe('1. Student Bulk Actions', () => {
    it('1a. Rejects unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/v1/core/students/bulk-actions')
        .send({ ids: [studentId1], action: 'ACTIVATE' });
      expect(res.status).toBe(401);
    });

    it('1b. Rejects unauthorized student role with 403', async () => {
      const res = await request(app)
        .post('/api/v1/core/students/bulk-actions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ ids: [studentId1], action: 'ACTIVATE' });
      expect(res.status).toBe(403);
    });

    it('1c. Rejects empty ID list with validation error (400 or 422)', async () => {
      const res = await request(app)
        .post('/api/v1/core/students/bulk-actions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ ids: [], action: 'ACTIVATE' });
      expect([400, 422]).toContain(res.status);
    });

    it('1d. Bulk suspends multiple students successfully', async () => {
      const res = await request(app)
        .post('/api/v1/core/students/bulk-actions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ ids: [studentId1, studentId2], action: 'SUSPEND' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('SUSPEND');
      expect(res.body.data.processedCount).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.results)).toBe(true);
    });

    it('1e. Bulk activates multiple students successfully', async () => {
      const res = await request(app)
        .post('/api/v1/core/students/bulk-actions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ ids: [studentId1, studentId2], action: 'ACTIVATE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('ACTIVATE');
      expect(res.body.data.processedCount).toBeGreaterThan(0);
    });

    it('1f. Bulk marks multiple students as reviewed', async () => {
      const res = await request(app)
        .post('/api/v1/core/students/bulk-actions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          ids: [studentId1, studentId2],
          action: 'REVIEW',
          params: { notes: 'Automated test bulk review verification' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('REVIEW');
      expect(res.body.data.processedCount).toBeGreaterThan(0);
    });

    it('1g. Handles foreign tenant / nonexistent ID gracefully without failing whole batch', async () => {
      const res = await request(app)
        .post('/api/v1/core/students/bulk-actions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          ids: [studentId1, 'foreign-tenant-stu-999'],
          action: 'ACTIVATE',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.processedCount).toBe(1);
      expect(res.body.data.failedCount).toBe(1);
      const foreignResult = res.body.data.results.find((r: any) => r.id === 'foreign-tenant-stu-999');
      expect(foreignResult.success).toBe(false);
    });
  });

  // ==========================================================================
  // 2. STAFF BULK ACTIONS
  // ==========================================================================
  describe('2. Staff Bulk Actions', () => {
    it('2a. Rejects unauthorized student role with 403', async () => {
      const res = await request(app)
        .post('/api/v1/core/staff/bulk-actions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ ids: [staffId1], action: 'REVIEW' });
      expect(res.status).toBe(403);
    });

    it('2b. Allows School Admin to bulk review and activate staff', async () => {
      const res = await request(app)
        .post('/api/v1/core/staff/bulk-actions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ ids: [staffId1], action: 'ACTIVATE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(1);
    });
  });

  // ==========================================================================
  // 3. ADMISSIONS BULK REVIEW
  // ==========================================================================
  describe('3. Admissions Bulk Review', () => {
    it('3a. Bulk marks admission applications under review', async () => {
      // Create a test admission application
      const appRecord = await prisma.admissionApplication.create({
        data: {
          schoolId: realSchoolId,
          applicationNumber: `APP-TEST-BULK-${Date.now()}`,
          studentFirstName: 'BulkTest',
          studentLastName: 'Candidate',
          dateOfBirth: new Date('2011-01-01'),
          gender: 'Female',
          applyingClass: 'Grade 9',
          guardianName: 'Test Parent',
          guardianRelationship: 'Father',
          guardianEmail: 'test.parent.bulk@example.com',
          guardianPhone: '+1-555-0199',
          residentialAddress: '123 Campus Way',
          status: 'SUBMITTED',
        },
      });

      const res = await request(app)
        .post('/api/v1/core/admissions/bulk-review')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          ids: [appRecord.id],
          action: 'REVIEW',
          params: { reviewNotes: 'Bulk review test verification' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(1);

      // Clean up test application
      await prisma.admissionApplication.deleteMany({ where: { id: appRecord.id } });
    });
  });

  // ==========================================================================
  // 4. SUPER ADMIN TENANT BULK ACTIONS
  // ==========================================================================
  describe('4. Super Admin School Bulk Actions', () => {
    it('4a. Rejects School Admin role with 403 on Super Admin endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools/bulk-actions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ ids: [realSchoolId], action: 'REVIEW' });
      expect(res.status).toBe(403);
    });

    it('4b. Allows Super Admin to bulk review school tenants', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/schools/bulk-actions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ids: [realSchoolId], action: 'REVIEW' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(1);
    });
  });
});
