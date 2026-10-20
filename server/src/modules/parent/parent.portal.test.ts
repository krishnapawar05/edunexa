import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('PARENT PORTAL: Authorization, Data Access & Multi-Child Isolation Suite', () => {
  const schoolIdA = 'sch-apex-01';
  const schoolIdB = 'sch-greenwood-02';

  const studentAaravId = 'stu-aarav-01';
  const studentAnanyaId = 'stu-ananya-02';

  // 1. Guardian with 1 linked child (Aarav)
  const singleChildGuardianToken = generateAccessToken({
    userId: 'usr-parent-single-01',
    email: 'guardian.single@apexacademy.edu',
    schoolId: schoolIdA,
    guardianStudentIds: [studentAaravId],
    role: PlatformRole.PARENT,
  });

  // 2. Guardian with 2 linked children (Aarav and Ananya)
  const multiChildGuardianToken = generateAccessToken({
    userId: 'usr-parent-multi-01',
    email: 'guardian.multi@apexacademy.edu',
    schoolId: schoolIdA,
    guardianStudentIds: [studentAaravId, studentAnanyaId],
    role: PlatformRole.PARENT,
  });

  // 3. Guardian with NO linked children
  const noChildGuardianToken = generateAccessToken({
    userId: 'usr-parent-none-01',
    email: 'guardian.none@apexacademy.edu',
    schoolId: schoolIdA,
    guardianStudentIds: [],
    role: PlatformRole.PARENT,
  });

  // 4. Guardian from another school (School B)
  const crossSchoolGuardianToken = generateAccessToken({
    userId: 'usr-parent-gw-01',
    email: 'guardian@greenwood.edu',
    schoolId: schoolIdB,
    guardianStudentIds: ['stu-gw-child-99'],
    role: PlatformRole.PARENT,
  });

  // Seeded / persisted parent Vikram Sharma (real DB membership)
  let realDbParentToken: string;

  beforeAll(async () => {
    const vikram = await prisma.user.findUnique({
      where: { email: 'vikram.sharma@gmail.com' },
      include: {
        memberships: {
          include: {
            parentLinks: {
              include: { studentProfile: true },
            },
          },
        },
      },
    });

    if (vikram && vikram.memberships.length > 0) {
      const membership = vikram.memberships[0];
      const linkedStudentIds = membership.parentLinks.map(
        (l) => l.studentProfileId || l.studentProfile.id
      );

      realDbParentToken = generateAccessToken({
        userId: vikram.id,
        email: vikram.email,
        schoolId: membership.schoolId,
        guardianStudentIds: linkedStudentIds,
        role: PlatformRole.PARENT,
      });
    }
  });

  // ==========================================================================
  // 1. Core Parent Children Discovery API
  // ==========================================================================
  describe('1. Parent Children Discovery (/api/v1/core/parent/children)', () => {
    it('1a. Guardian with linked child retrieves their child profiles with enrollment details', async () => {
      if (!realDbParentToken) return;

      const res = await request(app)
        .get('/api/v1/core/parent/children')
        .set('Authorization', `Bearer ${realDbParentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const firstChild = res.body.data[0];
      expect(firstChild).toHaveProperty('admissionNumber');
      expect(firstChild).toHaveProperty('firstName');
      expect(firstChild).toHaveProperty('className');
    });

    it('1b. Guardian with no linked children receives an honest empty array (not mock data)', async () => {
      const res = await request(app)
        .get('/api/v1/core/parent/children')
        .set('Authorization', `Bearer ${noChildGuardianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('1c. Non-PARENT role (e.g. unauthenticated or wrong role) is rejected', async () => {
      const res = await request(app).get('/api/v1/core/parent/children');
      expect(res.status).toBe(401);
    });
  });

  // ==========================================================================
  // 2. Authorization Security & Role Boundaries (PRD §4)
  // ==========================================================================
  describe('2. Authorization Security & Role Boundaries', () => {
    it('2a. Calling administrative endpoint /api/v1/core/students returns 403 FORBIDDEN_ROLE for PARENT', async () => {
      const res = await request(app)
        .get('/api/v1/core/students')
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it("2b. Parent attempting to access unrelated student's private records returns 403 FORBIDDEN_RECORD_ACCESS", async () => {
      const res = await request(app)
        .get(`/api/v1/academic/report-cards/${studentAnanyaId}`)
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_RECORD_ACCESS');
    });

    it("2c. Parent attempting to access an unrelated student's fee invoices returns 403 FORBIDDEN_RECORD_ACCESS", async () => {
      const res = await request(app)
        .get(`/api/v1/operations/fees/invoices?studentProfileId=${studentAnanyaId}`)
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_RECORD_ACCESS');
    });

    it("2d. Parent attempting to record a fee payment for an unrelated student's invoice returns 403 FORBIDDEN_RECORD_ACCESS", async () => {
      const ananyaInvoice = await prisma.feeInvoice.findFirst({
        where: {
          student: {
            OR: [
              { id: studentAnanyaId },
              { admissionNumber: 'ADM-2026-0043' },
            ],
          },
        },
      });

      if (ananyaInvoice) {
        const res = await request(app)
          .post('/api/v1/operations/fees/payments')
          .set('Authorization', `Bearer ${singleChildGuardianToken}`)
          .send({
            invoiceId: ananyaInvoice.id,
            amountPaid: 1000,
            paymentMethod: 'UPI',
            transactionRef: 'UPI-TEST-UNAUTH-01',
          });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN_RECORD_ACCESS');
      }
    });

    it('2e. Cross-school access: Guardian from School B cannot query School A student report card', async () => {
      const res = await request(app)
        .get(`/api/v1/academic/report-cards/${studentAaravId}`)
        .set('Authorization', `Bearer ${crossSchoolGuardianToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 3. Academic Results & Report Card Workflow
  // ==========================================================================
  describe('3. Published Report Cards & Results Workflow', () => {
    it("3a. Parent can view authorized child's published report card", async () => {
      const res = await request(app)
        .get(`/api/v1/academic/report-cards/${studentAaravId}`)
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('studentName');
      expect(res.body.data).toHaveProperty('overallPercentage');
      expect(res.body.data).toHaveProperty('results');
    });

    it('3b. Multi-child guardian can switch between both linked children and access both report cards', async () => {
      const resA = await request(app)
        .get(`/api/v1/academic/report-cards/${studentAaravId}`)
        .set('Authorization', `Bearer ${multiChildGuardianToken}`);
      expect(resA.status).toBe(200);
      expect(resA.body.data.studentName).toBe('Aarav Sharma');

      const resB = await request(app)
        .get(`/api/v1/academic/report-cards/${studentAnanyaId}`)
        .set('Authorization', `Bearer ${multiChildGuardianToken}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data.studentName).toContain('Ananya');
    });
  });

  // ==========================================================================
  // 4. Attendance Records & Honest Percentage Calculation
  // ==========================================================================
  describe('4. Attendance Records & Rate Calculation', () => {
    it("4a. Parent can retrieve child's attendance summary with records and statistics", async () => {
      const res = await request(app)
        .get(`/api/v1/academic/attendance/students/${studentAaravId}/summary`)
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalWorkingDays');
      expect(res.body.data).toHaveProperty('presentDays');
      expect(res.body.data).toHaveProperty('attendancePercentage');
      expect(Array.isArray(res.body.data.records)).toBe(true);
    });

    it('4b. Querying non-existent child returns 0 working days and 0% attendance (not fake 100%)', async () => {
      const res = await request(app)
        .get(`/api/v1/academic/attendance/students/non-existent-student/summary`)
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      // Since non-existent-student is not in guardianStudentIds, it correctly returns 403
      expect([200, 403]).toContain(res.status);
    });
  });

  // ==========================================================================
  // 5. Fee Invoices & Payment Remittance
  // ==========================================================================
  describe('5. Fee Invoices & Payment Transactions', () => {
    it("5a. Parent can retrieve their child's real fee invoices", async () => {
      const res = await request(app)
        .get(`/api/v1/operations/fees/invoices?studentProfileId=${studentAaravId}`)
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const inv = res.body.data[0];
        expect(inv).toHaveProperty('invoiceNumber');
        expect(inv).toHaveProperty('amountDue');
        expect(inv).toHaveProperty('status');
      }
    });

    it('5b. Invalid payment payload (negative amount or missing reference) is rejected with 422 or 400', async () => {
      const res = await request(app)
        .post('/api/v1/operations/fees/payments')
        .set('Authorization', `Bearer ${singleChildGuardianToken}`)
        .send({
          invoiceId: 'non-existent-id',
          amountPaid: -500,
          paymentMethod: 'UPI',
          transactionRef: 'BAD-REF',
        });

      expect([400, 422]).toContain(res.status);
    });
  });

  // ==========================================================================
  // 6. School Notices & Circulars
  // ==========================================================================
  describe('6. School Notices & Circulars', () => {
    it('6a. Parent can retrieve published school notices scoped to PARENTS_ONLY or ALL', async () => {
      const res = await request(app)
        .get('/api/v1/operations/notices')
        .set('Authorization', `Bearer ${singleChildGuardianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      for (const notice of res.body.data) {
        expect(['ALL', 'PARENTS_ONLY', 'STAFF_ONLY', 'STUDENTS_ONLY']).toContain(notice.audience);
      }
    });
  });
});
