import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('SECTION 5: ADMIT CARD GENERATION, DOWNLOAD & CLEARANCE TEST SUITE', () => {
  let schoolAdminToken: string;
  let examCoordinatorToken: string;
  let studentToken: string;
  let parentToken: string;
  let otherSchoolAdminToken: string;

  let targetSchoolId: string;
  let otherSchoolId: string;
  let testStudentProfileId: string;
  let testStudentUserId: string;
  let testParentUserId: string;
  let testAcademicSessionId: string;
  let generatedCardId: string;
  let generatedCardQrToken: string;

  beforeAll(async () => {
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    // Locate primary school
    const school =
      (await prisma.school.findFirst({ where: { slug: 'apex-academy' } })) ||
      (await prisma.school.findFirst());
    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    // Locate or create second school for tenant isolation
    let otherSchool = await prisma.school.findFirst({
      where: { id: { not: targetSchoolId } },
    });
    if (!otherSchool) {
      otherSchool = await prisma.school.create({
        data: {
          name: 'Starlight International School',
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
      where: { membership: { schoolId: targetSchoolId } },
      include: {
        membership: { include: { user: true } },
        enrollments: { include: { class: true, section: true }, take: 1 },
      },
    });
    expect(student).toBeDefined();
    testStudentProfileId = student!.id;
    testStudentUserId = student!.membership.user.id;

    // Locate or link a parent to this student
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
            email: 'parent.test@apexacademy.edu',
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

    // 1. School Admin Token
    schoolAdminToken = generateAccessToken({
      userId: 'usr-admin-sec5',
      email: 'admin@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    // 2. Exam Coordinator Token
    examCoordinatorToken = generateAccessToken({
      userId: 'usr-coordinator-sec5',
      email: 'coordinator@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.EXAM_COORDINATOR,
    });

    // 3. Student Token
    studentToken = generateAccessToken({
      userId: testStudentUserId,
      email: student!.membership.user.email,
      schoolId: targetSchoolId,
      studentProfileId: testStudentProfileId,
      role: PlatformRole.STUDENT,
    });

    // 4. Parent Token
    parentToken = generateAccessToken({
      userId: testParentUserId,
      email: parentLink.parentMembership.user.email,
      schoolId: targetSchoolId,
      role: PlatformRole.PARENT,
    });

    // 5. Other School Admin Token
    otherSchoolAdminToken = generateAccessToken({
      userId: 'usr-other-admin',
      email: 'admin@starlight.edu',
      schoolId: otherSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    // Ensure a baseline admit card exists
    const existingCard = await prisma.admitCard.findFirst({
      where: { schoolId: targetSchoolId, studentProfileId: testStudentProfileId },
    });
    if (existingCard) {
      generatedCardId = existingCard.id;
      generatedCardQrToken = existingCard.qrToken;
    } else {
      const createdCard = await prisma.admitCard.create({
        data: {
          schoolId: targetSchoolId,
          studentProfileId: testStudentProfileId,
          academicSessionId: testAcademicSessionId,
          examTitle: 'Annual Board Assessment 2026',
          examType: 'ANNUAL',
          admitCardNumber: `AC-2026-INIT-${Math.floor(1000 + Math.random() * 9000)}`,
          rollNumber: '01',
          className: 'Grade 10',
          sectionName: 'A',
          centerName: 'Apex Central Examination Hall, Wing B',
          roomNumber: 'Hall-204',
          status: 'GENERATED',
          clearanceStatus: 'CLEARED',
          clearanceDetails: { reason: 'Initial baseline clearance' },
          qrToken: `ac-tok-init-${Math.random().toString(36).slice(2)}`,
        },
      });
      generatedCardId = createdCard.id;
      generatedCardQrToken = createdCard.qrToken;
    }
  });

  // ==========================================================================
  // 1. RBAC & SECURITY ISOLATION
  // ==========================================================================
  describe('1. RBAC & Security Isolation', () => {
    it('1.1 Rejects unauthenticated requests to admit card endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/admit-cards/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('1.2 Forbids student role from accessing admin stats and list endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admit-cards/admin/stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('1.3 Forbids parent role from accessing bulk generation endpoint with 403', async () => {
      const res = await request(app)
        .post('/api/v1/admit-cards/admin/bulk-generate')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ examTitle: 'Mid-Term Exam' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 2. DASHBOARD TELEMETRY & STATS
  // ==========================================================================
  describe('2. Dashboard Telemetry & Real-Time Stats', () => {
    it('2.1 Retrieves database-backed admit card statistics for school admin', async () => {
      const res = await request(app)
        .get('/api/v1/admit-cards/admin/stats')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.totalExams).toBe('number');
      expect(typeof res.body.data.totalStudents).toBe('number');
      expect(typeof res.body.data.totalGeneratedCards).toBe('number');
      expect(typeof res.body.data.publishedCards).toBe('number');
      expect(typeof res.body.data.pendingClearance).toBe('number');
      expect(Array.isArray(res.body.data.recentCards)).toBe(true);
    });

    it('2.2 Allows exam coordinator to access telemetry stats', async () => {
      const res = await request(app)
        .get('/api/v1/admit-cards/admin/stats')
        .set('Authorization', `Bearer ${examCoordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 3. INDIVIDUAL ADMIT CARD GENERATION & CLEARANCE EVALUATION
  // ==========================================================================
  describe('3. Individual Generation & Timetable Resolution', () => {
    it('3.1 Generates an individual admit card with unique serial, QR token, and timetable', async () => {
      const res = await request(app)
        .post('/api/v1/admit-cards/admin/generate-individual')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          studentProfileId: testStudentProfileId,
          examTitle: 'Annual Board Assessment 2026',
          examType: 'ANNUAL',
          centerName: 'Apex Central Examination Hall, Wing B',
          roomNumber: 'Hall-204',
          candidateInstructions: 'Mandatory ID and Admit Card inspection at entrance.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const card = res.body.data;
      expect(card.id).toBeDefined();
      expect(card.admitCardNumber).toMatch(/^AC-\d{4}-/);
      expect(card.qrToken).toBeDefined();
      expect(card.examTitle).toBe('Annual Board Assessment 2026');
      expect(card.centerName).toBe('Apex Central Examination Hall, Wing B');
      expect(card.roomNumber).toBe('Hall-204');
      expect(['GENERATED', 'PUBLISHED']).toContain(card.status);
      expect(['CLEARED', 'PENDING_FEES', 'PENDING_ATTENDANCE', 'BLOCKED']).toContain(card.clearanceStatus);
      expect(Array.isArray(card.timetable)).toBe(true);

      generatedCardId = card.id;
      generatedCardQrToken = card.qrToken;
    });

    it('3.2 Re-generating for same student and exam updates existing record idempotently', async () => {
      const res = await request(app)
        .post('/api/v1/admit-cards/admin/generate-individual')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          studentProfileId: testStudentProfileId,
          examTitle: 'Annual Board Assessment 2026',
          roomNumber: 'Hall-305', // Updated room number
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(generatedCardId);
      expect(res.body.data.roomNumber).toBe('Hall-305');
    });
  });

  // ==========================================================================
  // 4. BULK GENERATION STUDIO
  // ==========================================================================
  describe('4. Bulk Admit Card Generation', () => {
    it('4.1 Executes cohort generation with fee & attendance policy enforcement', async () => {
      const res = await request(app)
        .post('/api/v1/admit-cards/admin/bulk-generate')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          examTitle: 'Mid-Term Institutional Exams 2026',
          examType: 'MID_TERM',
          allEligible: true,
          centerName: 'EduNexa Central Testing Pavilion',
          defaultRoomNumber: 'Hall-A',
          skipUnpaidFees: false,
          skipLowAttendance: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.generatedCount).toBe('number');
      expect(res.body.data.generatedCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.skipped)).toBe(true);
    });

    it('4.2 Rejects bulk generation if exam title is missing', async () => {
      const res = await request(app)
        .post('/api/v1/admit-cards/admin/bulk-generate')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          allEligible: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 5. DIRECTORY LISTING & FILTERING
  // ==========================================================================
  describe('5. Roster Listing & Search Filters', () => {
    it('5.1 Lists admit cards with pagination and candidate relations', async () => {
      const res = await request(app)
        .get('/api/v1/admit-cards/admin/list?limit=20&page=1')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.cards)).toBe(true);
      expect(res.body.data.cards.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination).toBeDefined();

      const first = res.body.data.cards[0];
      expect(first.studentProfile).toBeDefined();
      expect(first.studentProfile.user).toBeDefined();
    });

    it('5.2 Filters cards by clearanceStatus', async () => {
      const res = await request(app)
        .get('/api/v1/admit-cards/admin/list?clearanceStatus=CLEARED')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const c of res.body.data.cards) {
        expect(c.clearanceStatus).toBe('CLEARED');
      }
    });
  });

  // ==========================================================================
  // 6. CLEARANCE OVERRIDE & PUBLISHING GATEKEEPER
  // ==========================================================================
  describe('6. Clearance Override & Publishing Workflow', () => {
    it('6.1 Allows admin to manually clear a candidate with logged justification', async () => {
      const res = await request(app)
        .patch(`/api/v1/admit-cards/admin/cards/${generatedCardId}/clearance`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          clearanceStatus: 'CLEARED',
          reason: 'Institutional scholarship approved; full fee waiver verified.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clearanceStatus).toBe('CLEARED');
      expect(res.body.data.clearanceDetails.reason).toBe(
        'Institutional scholarship approved; full fee waiver verified.'
      );
    });

    it('6.2 Publishes cleared admit cards to student & parent portals', async () => {
      const res = await request(app)
        .post('/api/v1/admit-cards/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          cardIds: [generatedCardId],
          action: 'PUBLISH',
          enforceClearance: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBe(1);
      expect(res.body.data.skippedCount).toBe(0);
    });

    it('6.3 Blocks publishing if candidate clearance is BLOCKED and enforceClearance is true', async () => {
      // First set card clearance to BLOCKED
      await request(app)
        .patch(`/api/v1/admit-cards/admin/cards/${generatedCardId}/clearance`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          clearanceStatus: 'BLOCKED',
          reason: 'Disciplinary hearing pending.',
        });

      // Attempt to publish
      const res = await request(app)
        .post('/api/v1/admit-cards/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          cardIds: [generatedCardId],
          action: 'PUBLISH',
          enforceClearance: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(0);
      expect(res.body.data.skippedCount).toBe(1);
    });

    it('6.4 Resets card back to CLEARED and PUBLISHED for student self-service tests', async () => {
      await request(app)
        .patch(`/api/v1/admit-cards/admin/cards/${generatedCardId}/clearance`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          clearanceStatus: 'CLEARED',
          reason: 'Clearance validated.',
        });

      const res = await request(app)
        .post('/api/v1/admit-cards/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          cardIds: [generatedCardId],
          action: 'PUBLISH',
          enforceClearance: false,
        });

      expect(res.body.data.updatedCount).toBe(1);
    });
  });

  // ==========================================================================
  // 7. STUDENT SELF-SERVICE PORTAL
  // ==========================================================================
  describe('7. Student Self-Service Integration', () => {
    it('7.1 Authenticated student can view only their own published admit cards', async () => {
      const res = await request(app)
        .get('/api/v1/admit-cards/my-cards')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const myCard = res.body.data.find((c: any) => c.id === generatedCardId);
      expect(myCard).toBeDefined();
      expect(myCard.status).toBe('PUBLISHED');
      expect(Array.isArray(myCard.timetable)).toBe(true);
    });

    it('7.2 Student cannot access unpublished / withheld cards', async () => {
      // Temporarily withhold the card
      await request(app)
        .post('/api/v1/admit-cards/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          cardIds: [generatedCardId],
          action: 'WITHHOLD',
        });

      const res = await request(app)
        .get('/api/v1/admit-cards/my-cards')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const withheldFound = res.body.data.find((c: any) => c.id === generatedCardId);
      expect(withheldFound).toBeUndefined();

      // Restore to PUBLISHED
      await request(app)
        .post('/api/v1/admit-cards/admin/publish')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          cardIds: [generatedCardId],
          action: 'PUBLISH',
          enforceClearance: false,
        });
    });
  });

  // ==========================================================================
  // 8. PARENT & GUARDIAN SELF-SERVICE PORTAL
  // ==========================================================================
  describe('8. Parent / Guardian Self-Service Integration', () => {
    it('8.1 Parent can retrieve published admit cards for their linked ward', async () => {
      const res = await request(app)
        .get(`/api/v1/admit-cards/child-cards?studentProfileId=${testStudentProfileId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const wardCard = res.body.data.find((c: any) => c.id === generatedCardId);
      expect(wardCard).toBeDefined();
      expect(wardCard.status).toBe('PUBLISHED');
    });

    it('8.2 Parent is forbidden from accessing admit cards of unlinked students', async () => {
      // Fabricate a fake or unlinked studentProfileId
      const fakeStudentId = 'stu-unlinked-fake-99999';

      const res = await request(app)
        .get(`/api/v1/admit-cards/child-cards?studentProfileId=${fakeStudentId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 9. PUBLIC QR CODE VERIFICATION (ZERO-PII)
  // ==========================================================================
  describe('9. Public QR Code Verification Endpoint', () => {
    it('9.1 Verifies authentic hall ticket without requiring auth tokens', async () => {
      expect(generatedCardQrToken).toBeDefined();

      const res = await request(app).get(
        `/api/v1/admit-cards/public/verify/${encodeURIComponent(generatedCardQrToken)}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.status).toBe('PUBLISHED');
      expect(res.body.data.examTitle).toBe('Annual Board Assessment 2026');
      expect(res.body.data.admitCardNumber).toBeDefined();
      expect(res.body.data.studentName).toBeDefined();
    });

    it('9.2 Returns 404 for an invalid or forged QR token', async () => {
      const res = await request(app).get('/api/v1/admit-cards/public/verify/forged-token-xyz-123');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 10. MULTI-TENANT ISOLATION
  // ==========================================================================
  describe('10. Multi-Tenant School Isolation', () => {
    it('10.1 School admin from other school cannot view or manipulate cards of primary school', async () => {
      const res = await request(app)
        .get('/api/v1/admit-cards/admin/list')
        .set('Authorization', `Bearer ${otherSchoolAdminToken}`);

      expect(res.status).toBe(200);
      // Other school cards should not include target school's card
      const leakedCard = res.body.data.cards.find((c: any) => c.id === generatedCardId);
      expect(leakedCard).toBeUndefined();
    });

    it('10.2 Other school admin cannot alter clearance of primary school card', async () => {
      const res = await request(app)
        .patch(`/api/v1/admit-cards/admin/cards/${generatedCardId}/clearance`)
        .set('Authorization', `Bearer ${otherSchoolAdminToken}`)
        .send({ clearanceStatus: 'BLOCKED' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
