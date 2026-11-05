import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('SECTION 7: PROFESSIONAL MARKSHEET & REPORT CARD TEST SUITE', () => {
  let app: any;
  let schoolAdminToken: string;
  let examCoordinatorToken: string;
  let teacherToken: string;
  let studentToken: string;
  let parentToken: string;
  let otherSchoolAdminToken: string;

  let targetSchoolId: string;
  let otherSchoolId: string;
  let testStudentProfileId: string;
  let testStudentUserId: string;
  let testParentUserId: string;
  let testAcademicSessionId: string;
  let generatedMarksheetId: string;
  let generatedMarksheetQrToken: string;
  let testTemplateId: string;

  beforeAll(async () => {
    app = createApp();
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    // Locate primary school
    const school =
      (await prisma.school.findFirst({ where: { slug: 'apex-academy' } })) ||
      (await prisma.school.findFirst());
    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    // Locate or create second school for multi-tenant isolation tests
    let otherSchool = await prisma.school.findFirst({
      where: { id: { not: targetSchoolId } },
    });
    if (!otherSchool) {
      otherSchool = await prisma.school.create({
        data: {
          name: 'Starlight International Academy',
          slug: 'starlight-intl',
          code: 'STL-01',
          email: 'contact@starlight.edu',
          phone: '+91 99999 88888',
          address: '42 Galaxy Promenade',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          status: 'ACTIVE',
        },
      });
    }
    otherSchoolId = otherSchool.id;

    // Locate academic session
    let session = await prisma.academicSession.findFirst({
      where: { schoolId: targetSchoolId, isCurrent: true },
    });
    if (!session) {
      session = await prisma.academicSession.findFirst({
        where: { schoolId: targetSchoolId },
      });
    }
    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          name: '2026-2027 Academic Year',
          schoolId: targetSchoolId,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
        },
      });
    }
    testAcademicSessionId = session.id;

    // Locate student
    const student = await prisma.studentProfile.findFirst({
      where: { membership: { schoolId: targetSchoolId }, status: 'ACTIVE' },
      include: {
        membership: { include: { user: true } },
        enrollments: { include: { class: true, section: true }, take: 1 },
      },
    });
    expect(student).toBeDefined();
    testStudentProfileId = student!.id;
    testStudentUserId = student!.membership.user.id;

    // Locate or link a parent
    let parentLink = await prisma.parentStudentLink.findFirst({
      where: { studentProfileId: testStudentProfileId, parentMembership: { schoolId: targetSchoolId } },
      include: { parentMembership: { include: { user: true } } },
    });
    if (!parentLink) {
      let parentUser = await prisma.user.findFirst({
        where: { memberships: { some: { role: 'PARENT' } } },
      });
      if (!parentUser) {
        parentUser = await prisma.user.create({
          data: {
            email: 'parent.marksheet@apexacademy.edu',
            passwordHash: 'dummy-hash',
            firstName: 'Sunita',
            lastName: 'Sharma',
            isActive: true,
          },
        });
      }
      let parentMembership = await prisma.userMembership.findFirst({
        where: { userId: parentUser.id, schoolId: targetSchoolId },
      });
      if (!parentMembership) {
        parentMembership = await prisma.userMembership.create({
          data: {
            userId: parentUser.id,
            schoolId: targetSchoolId,
            role: 'PARENT',
          },
        });
      }
      parentLink = await prisma.parentStudentLink.create({
        data: {
          studentProfileId: testStudentProfileId,
          parentMembershipId: parentMembership.id,
          relationship: 'MOTHER',
          isPrimaryContact: true,
        },
        include: { parentMembership: { include: { user: true } } },
      });
    }
    testParentUserId = parentLink.parentMembership.userId;

    // Generate Auth Tokens
    schoolAdminToken = generateAccessToken({
      userId: 'usr-admin-sec7',
      email: 'admin@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    examCoordinatorToken = generateAccessToken({
      userId: 'usr-coordinator-sec7',
      email: 'exam.coordinator@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.EXAM_COORDINATOR,
    });

    teacherToken = generateAccessToken({
      userId: 'usr-teacher-sec7',
      email: 'julian.thorne@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.TEACHER,
    });

    studentToken = generateAccessToken({
      userId: testStudentUserId,
      email: student!.membership.user.email,
      schoolId: targetSchoolId,
      studentProfileId: testStudentProfileId,
      role: PlatformRole.STUDENT,
    });

    parentToken = generateAccessToken({
      userId: testParentUserId,
      email: 'parent.marksheet@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.PARENT,
    });

    otherSchoolAdminToken = generateAccessToken({
      userId: 'usr-admin-other',
      email: 'admin@starlight.edu',
      schoolId: otherSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });
  });

  // ==========================================================================
  // 1. RBAC & SECURITY ISOLATION
  // ==========================================================================
  describe('1. RBAC & Security Isolation', () => {
    it('1.1 Rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/marksheets/admin/stats');
      expect(res.status).toBe(401);
    });

    it('1.2 Forbids student role from accessing admin stats and list endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('1.3 Forbids parent role from accessing bulk generation endpoint with 403', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/bulk-generate')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ examTitle: 'Annual Exam 2026' });
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // 2. DASHBOARD TELEMETRY & STATS
  // ==========================================================================
  describe('2. Dashboard Telemetry & Stats', () => {
    it('2.1 Retrieves database-backed marksheet statistics for school admin', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/stats')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.totalMarksheets).toBe('number');
      expect(typeof res.body.data.publishedMarksheets).toBe('number');
      expect(Array.isArray(res.body.data.recentIssuances)).toBe(true);
    });

    it('2.2 Allows exam coordinator to access telemetry stats', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/stats')
        .set('Authorization', `Bearer ${examCoordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 3. TEMPLATE MANAGEMENT
  // ==========================================================================
  describe('3. Template Management', () => {
    it('3.1 Retrieves marksheet templates including canonical default', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/templates')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const def = res.body.data.find((t: any) => t.isDefault);
      expect(def).toBeDefined();
      testTemplateId = def.id;
    });

    it('3.2 Creates a new specialized examination template', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/templates')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Annual Board Distinction Marksheet',
          examType: 'ANNUAL',
          layoutStyle: 'MODERN_ACADEMIC',
          primaryColor: '#047857',
          secondaryColor: '#f59e0b',
          showStudentPhoto: true,
          showAttendance: true,
          showDivision: true,
          showPracticalMarks: true,
          customRemarks: 'Honours academic performance.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Annual Board Distinction Marksheet');
    });
  });

  // ==========================================================================
  // 4. GRADING SCHEME & PASSING CRITERIA
  // ==========================================================================
  describe('4. Grading Scheme & Passing Criteria', () => {
    it('4.1 Retrieves configurable grading criteria and division boundaries', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/grading')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grades).toBeDefined();
      expect(Array.isArray(res.body.data.grades)).toBe(true);
      expect(res.body.data.passingPercentage).toBeDefined();
    });

    it('4.2 Updates grading boundaries and division criteria in PostgreSQL', async () => {
      const res = await request(app)
        .put('/api/v1/marksheets/admin/grading')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          schemeName: 'Institutional CBSE Standard Scale 2026',
          passingPercentage: 35,
          divisionCriteria: {
            distinction: 75,
            firstDivision: 60,
            secondDivision: 45,
            thirdDivision: 35,
          },
          grades: [
            { grade: 'A1', minPercentage: 91, maxPercentage: 100, gradePoint: 10, description: 'Outstanding' },
            { grade: 'A2', minPercentage: 81, maxPercentage: 90, gradePoint: 9, description: 'Excellent' },
            { grade: 'B1', minPercentage: 71, maxPercentage: 80, gradePoint: 8, description: 'Very Good' },
            { grade: 'B2', minPercentage: 61, maxPercentage: 70, gradePoint: 7, description: 'Good' },
            { grade: 'C1', minPercentage: 51, maxPercentage: 60, gradePoint: 6, description: 'Satisfactory' },
            { grade: 'C2', minPercentage: 41, maxPercentage: 50, gradePoint: 5, description: 'Average' },
            { grade: 'D',  minPercentage: 35, maxPercentage: 40, gradePoint: 4, description: 'Marginal Pass' },
            { grade: 'E',  minPercentage: 0,  maxPercentage: 34, gradePoint: 0, description: 'Essential Repeat' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 5. INDIVIDUAL MARKSHEET GENERATION
  // ==========================================================================
  describe('5. Individual Marksheet Generation', () => {
    it('5.1 Generates an individual marksheet with verified theory & practical components, parent details, and QR token', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/generate-individual')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          studentProfileId: testStudentProfileId,
          examTitle: 'Annual Board Examination 2026-2027',
          examType: 'ANNUAL',
          templateId: testTemplateId,
          classTeacherRemarks: 'Demonstrates stellar academic acumen and scholastic diligence.',
          principalRemarks: 'Promoted with Honours to Grade 11.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const ms = res.body.data;
      generatedMarksheetId = ms.id;
      generatedMarksheetQrToken = ms.qrToken;

      expect(ms.marksheetNumber).toMatch(/^MS-2026-/);
      expect(ms.qrToken).toMatch(/^ms-tok-/);
      expect(typeof ms.version).toBe('number');
      expect(ms.version).toBeGreaterThanOrEqual(1);
      expect(typeof ms.totalMaxMarks).toBe('number');
      expect(typeof ms.totalMarksObtained).toBe('number');
      expect(typeof ms.overallPercentage).toBe('number');
      expect(typeof ms.grade).toBe('string');
      expect(typeof ms.division).toBe('string');
      expect(typeof ms.isPassed).toBe('boolean');

      // Verify subject breakdown snapshot
      expect(Array.isArray(ms.subjectMarksSnapshot)).toBe(true);
      expect(ms.subjectMarksSnapshot.length).toBeGreaterThanOrEqual(1);
      expect(ms.subjectMarksSnapshot[0].theoryMaxMarks).toBeDefined();

      // Verify student details snapshot
      expect(ms.studentSnapshot).toBeDefined();
      expect(ms.studentSnapshot.fullName).toBeDefined();
      expect(ms.studentSnapshot.admissionNumber).toBeDefined();
    });

    it('5.2 Re-generating for same student and exam updates existing record idempotently', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/generate-individual')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          studentProfileId: testStudentProfileId,
          examTitle: 'Annual Board Examination 2026-2027',
          classTeacherRemarks: 'Updated teacher note for same exam.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(generatedMarksheetId);
      expect(res.body.data.classTeacherRemarks).toBe('Updated teacher note for same exam.');
    });
  });

  // ==========================================================================
  // 6. BULK MARKSHEET GENERATION
  // ==========================================================================
  describe('6. Bulk Marksheet Generation', () => {
    it('6.1 Executes class-wise bulk marksheet generation for eligible cohort', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/bulk-generate')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          examTitle: 'Annual Final Examination 2026-2027',
          examType: 'ANNUAL',
          allEligible: true,
          templateId: testTemplateId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.generatedCount).toBeGreaterThanOrEqual(1);
    });

    it('6.2 Rejects bulk generation if exam title is missing with 422', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/bulk-generate')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          allEligible: true,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 7. ROSTER LISTING & SEARCH FILTERS
  // ==========================================================================
  describe('7. Roster Listing & Search Filters', () => {
    it('7.1 Lists marksheets with pagination, student details, and relations', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/list?limit=20&page=1')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('7.2 Allows teacher role to view marksheets roster', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/list')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 8. PUBLICATION & WITHHOLDING GATEKEEPER
  // ==========================================================================
  describe('8. Publication & Withholding Gatekeeper', () => {
    it('8.1 Publishes generated marksheet so it becomes accessible to student and parent', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          marksheetIds: [generatedMarksheetId],
          action: 'PUBLISH',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBe(1);
    });
  });

  // ==========================================================================
  // 9. AUTHORIZED CORRECTION & AUDIT HISTORY
  // ==========================================================================
  describe('9. Authorized Correction & Audit History', () => {
    it('9.1 Creates a new version (v2) with recorded justification and preserves audit trail', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/correct')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          marksheetId: generatedMarksheetId,
          reason: 'Authorized re-evaluation of Physics practical assessment by Head of Science.',
          classTeacherRemarks: 'Revised academic standing following formal re-evaluation.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.marksheet.version).toBeGreaterThanOrEqual(2);
      expect(res.body.data.marksheet.correctionReason).toContain('re-evaluation');
      expect(res.body.data.audit).toBeDefined();
      expect(res.body.data.audit.newVersion).toBe(res.body.data.marksheet.version);
    });

    it('9.2 Retrieves audit ledger for corrected marksheets', async () => {
      const res = await request(app)
        .get(`/api/v1/marksheets/admin/audits?marksheetId=${generatedMarksheetId}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].reason).toContain('re-evaluation');
    });
  });

  // ==========================================================================
  // 10. STUDENT SELF-SERVICE INTEGRATION
  // ==========================================================================
  describe('10. Student Self-Service Integration', () => {
    it('10.1 Authenticated student can view only their own published marksheets', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/my-marksheets')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].studentProfileId).toBe(testStudentProfileId);
    });

    it('10.2 Student cannot access unpublished / withheld marksheets', async () => {
      // Withhold the card
      await request(app)
        .post('/api/v1/marksheets/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ marksheetIds: [generatedMarksheetId], action: 'WITHHOLD' });

      const res = await request(app)
        .get('/api/v1/marksheets/my-marksheets')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find((m: any) => m.id === generatedMarksheetId);
      expect(found).toBeUndefined();

      // Restore to PUBLISHED
      await request(app)
        .post('/api/v1/marksheets/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ marksheetIds: [generatedMarksheetId], action: 'PUBLISH' });
    });
  });

  // ==========================================================================
  // 11. PARENT / GUARDIAN SELF-SERVICE INTEGRATION
  // ==========================================================================
  describe('11. Parent / Guardian Self-Service Integration', () => {
    it('11.1 Parent can retrieve published marksheets for their linked ward', async () => {
      const res = await request(app)
        .get(`/api/v1/marksheets/child-marksheets?studentProfileId=${testStudentProfileId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('11.2 Parent is forbidden from accessing marksheets of unlinked students with 403', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/child-marksheets?studentProfileId=unlinked-fake-student-id')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // 12. PUBLIC QR CODE VERIFICATION ENDPOINT
  // ==========================================================================
  describe('12. Public QR Code Verification Endpoint', () => {
    it('12.1 Verifies authentic marksheet without requiring auth token and protects private PII', async () => {
      const res = await request(app)
        .get(`/api/v1/marksheets/public/verify/${generatedMarksheetQrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.verificationStatus).toBe('AUTHENTIC');
      expect(res.body.data.marksheetNumber).toBeDefined();
      expect(res.body.data.schoolName).toBeDefined();
      // PII Protection: Student full name must NOT be publicly exposed, initials only
      expect(res.body.data.studentInitials).toBeDefined();
      expect(res.body.data.studentFullName).toBeUndefined();
    });

    it('12.2 Returns 404 for an invalid or forged QR token', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/public/verify/forged-token-xyz-999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 13. MULTI-TENANT SCHOOL ISOLATION
  // ==========================================================================
  describe('13. Multi-Tenant School Isolation', () => {
    it('13.1 School admin from other school cannot view marksheets of primary school', async () => {
      const res = await request(app)
        .get('/api/v1/marksheets/admin/list')
        .set('Authorization', `Bearer ${otherSchoolAdminToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.items.find((m: any) => m.id === generatedMarksheetId);
      expect(found).toBeUndefined();
    });

    it('13.2 Other school admin cannot alter or correct marksheet of primary school with 404', async () => {
      const res = await request(app)
        .post('/api/v1/marksheets/admin/correct')
        .set('Authorization', `Bearer ${otherSchoolAdminToken}`)
        .send({
          marksheetId: generatedMarksheetId,
          reason: 'Cross-tenant illegal modification attempt',
        });

      expect(res.status).toBe(404);
    });
  });
});
