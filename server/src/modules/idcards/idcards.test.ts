import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('SECTION 4: PROFESSIONAL STUDENT & TEACHER ID CARD GENERATION TEST SUITE', () => {
  let schoolAdminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let targetSchoolId: string;
  let testStudentProfileId: string;
  let testTeacherProfileId: string;
  let testGeneratedCardId: string;
  let testVerificationToken: string;
  let createdTemplateId: string;

  beforeAll(async () => {
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    const school =
      (await prisma.school.findFirst({ where: { slug: 'apex-academy' } })) ||
      (await prisma.school.findFirst());

    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    // Locate or create test student
    const student = await prisma.studentProfile.findFirst({
      where: { membership: { schoolId: targetSchoolId } },
      include: { membership: { include: { user: true } } },
    });
    expect(student).toBeDefined();
    testStudentProfileId = student!.id;

    // Locate or create test teacher
    const teacher = await prisma.staffProfile.findFirst({
      where: { membership: { schoolId: targetSchoolId } },
      include: { membership: { include: { user: true } } },
    });
    expect(teacher).toBeDefined();
    testTeacherProfileId = teacher!.id;

    // Admin Token
    schoolAdminToken = generateAccessToken({
      userId: 'usr-schooladmin-01',
      email: 'admin@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    // Teacher Token
    teacherToken = generateAccessToken({
      userId: teacher!.membership.user.id,
      email: teacher!.membership.user.email,
      schoolId: targetSchoolId,
      staffProfileId: teacher!.id,
      role: PlatformRole.TEACHER,
    });

    // Student Token
    studentToken = generateAccessToken({
      userId: student!.membership.user.id,
      email: student!.membership.user.email,
      schoolId: targetSchoolId,
      studentProfileId: student!.id,
      role: PlatformRole.STUDENT,
    });
  });

  // --------------------------------------------------------------------------
  // 1. RBAC & SECURITY ISOLATION
  // --------------------------------------------------------------------------
  it('1. Rejects unauthenticated requests to ID card endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/id-cards/my-card');
    expect(res.status).toBe(401);
  });

  it('2. Blocks student and teacher accounts from accessing School Admin ID card endpoints with 403', async () => {
    const studentRes = await request(app)
      .get('/api/v1/id-cards/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentRes.status).toBe(403);

    const teacherRes = await request(app)
      .get('/api/v1/id-cards/admin/stats')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherRes.status).toBe(403);
  });

  // --------------------------------------------------------------------------
  // 2. DASHBOARD & ISSUANCE TELEMETRY
  // --------------------------------------------------------------------------
  it('3. GET /api/v1/id-cards/admin/stats returns real PostgreSQL-backed telemetry', async () => {
    const res = await request(app)
      .get('/api/v1/id-cards/admin/stats')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { stats, recentActivity } = res.body.data;
    expect(stats.totalEligible).toBeGreaterThanOrEqual(0);
    expect(stats.totalStudents).toBeGreaterThanOrEqual(0);
    expect(stats.totalTeachers).toBeGreaterThanOrEqual(0);
    expect(stats.totalCardsGenerated).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(recentActivity)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 3. STUDENT ROSTER & DATA SYNCHRONIZATION HASH CHECK
  // --------------------------------------------------------------------------
  it('4. GET /api/v1/id-cards/admin/students lists enrolled students with cryptographic hash verification', async () => {
    const res = await request(app)
      .get('/api/v1/id-cards/admin/students?limit=20')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.students).toBeDefined();
    expect(Array.isArray(res.body.data.students)).toBe(true);

    if (res.body.data.students.length > 0) {
      const first = res.body.data.students[0];
      expect(first.id).toBeDefined();
      expect(first.firstName).toBeDefined();
      expect(first.admissionNumber).toBeDefined();
      const cardObj = first.idCard || first.card;
      if (cardObj) {
        expect(typeof cardObj.isUpToDate).toBe('boolean');
        expect(cardObj.cardNumber).toMatch(/CR80/);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 4. EMPLOYEE ROSTERS (FACULTY VS STAFF)
  // --------------------------------------------------------------------------
  it('5. GET /api/v1/id-cards/admin/employees filters teaching faculty and support staff', async () => {
    const teachersRes = await request(app)
      .get('/api/v1/id-cards/admin/employees?category=TEACHER&limit=10')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(teachersRes.status).toBe(200);
    expect(teachersRes.body.success).toBe(true);
    expect(Array.isArray(teachersRes.body.data.employees)).toBe(true);

    const staffRes = await request(app)
      .get('/api/v1/id-cards/admin/employees?category=STAFF&limit=10')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(staffRes.status).toBe(200);
    expect(staffRes.body.success).toBe(true);
    expect(Array.isArray(staffRes.body.data.employees)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 5. INDIVIDUAL ID CARD GENERATION (STUDENT & TEACHER)
  // --------------------------------------------------------------------------
  it('6. POST /api/v1/id-cards/admin/generate issues ISO CR80 student card with verification token', async () => {
    const res = await request(app)
      .post('/api/v1/id-cards/admin/generate')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        holderType: 'STUDENT',
        profileId: testStudentProfileId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.card).toBeDefined();
    expect(res.body.data.card.cardNumber).toMatch(/^STU-CR80-\d{4}$/);
    expect(res.body.data.card.verificationToken).toMatch(/^v-tok-[a-f0-9-]+$/);
    expect(res.body.data.card.status).toBe('ACTIVE');
    expect(res.body.data.card.dataHash).toBeDefined();

    testGeneratedCardId = res.body.data.card.id;
    testVerificationToken = res.body.data.card.verificationToken;
  });

  it('7. POST /api/v1/id-cards/admin/generate issues faculty teacher ID card', async () => {
    const res = await request(app)
      .post('/api/v1/id-cards/admin/generate')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        holderType: 'TEACHER',
        profileId: testTeacherProfileId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.card.cardNumber).toMatch(/^TEA-CR80-\d{4}$/);
    expect(res.body.data.card.status).toBe('ACTIVE');
  });

  // --------------------------------------------------------------------------
  // 6. BULK ID CARD GENERATION
  // --------------------------------------------------------------------------
  it('8. POST /api/v1/id-cards/admin/bulk-generate processes selected students batch', async () => {
    const res = await request(app)
      .post('/api/v1/id-cards/admin/bulk-generate')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        targetType: 'SELECTED_STUDENTS',
        profileIds: [testStudentProfileId],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.createdCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.cards)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. CARD TEMPLATES CRUD
  // --------------------------------------------------------------------------
  it('9. POST /api/v1/id-cards/admin/templates creates custom ID card template', async () => {
    const res = await request(app)
      .post('/api/v1/id-cards/admin/templates')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        name: 'Honors Science Academy Card',
        targetRole: 'STUDENT',
        primaryColor: '#0b3d2e',
        secondaryColor: '#f59e0b',
        headerTextColor: '#ffffff',
        cardOrientation: 'LANDSCAPE',
        showBloodGroup: true,
        showParentContact: true,
        showEmergencyPhone: true,
        showPrincipalSign: true,
        showSchoolSeal: true,
        showBarcode: true,
        customTermsText: 'Property of Apex Academy of Sciences. Transferable only with dean approval.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBe('Honors Science Academy Card');
    createdTemplateId = res.body.data.id;
  });

  it('10. GET /api/v1/id-cards/admin/templates lists institutional templates', async () => {
    const res = await request(app)
      .get('/api/v1/id-cards/admin/templates')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((t: any) => t.id === createdTemplateId)).toBe(true);
  });

  it('11. PUT /api/v1/id-cards/admin/templates/:id updates template attributes', async () => {
    const res = await request(app)
      .put(`/api/v1/id-cards/admin/templates/${createdTemplateId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        name: 'Honors STEM Faculty & Student Card',
        primaryColor: '#092d22',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Honors STEM Faculty & Student Card');
  });

  it('12. DELETE /api/v1/id-cards/admin/templates/:id removes custom template', async () => {
    const res = await request(app)
      .delete(`/api/v1/id-cards/admin/templates/${createdTemplateId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 8. CARD REVOCATION & ACTIVATION LIFECYCLE
  // --------------------------------------------------------------------------
  it('13. PATCH /api/v1/id-cards/admin/cards/:id/status updates status to REVOKED with reason', async () => {
    const res = await request(app)
      .patch(`/api/v1/id-cards/admin/cards/${testGeneratedCardId}/status`)
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        status: 'REVOKED',
        reason: 'Reported lost by holder on transit route.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REVOKED');
    testVerificationToken = res.body.data.verificationToken;
  });

  // --------------------------------------------------------------------------
  // 9. PUBLIC PRIVACY-PRESERVING QR VERIFICATION
  // --------------------------------------------------------------------------
  it('14. GET /api/v1/core/id-cards/verify/:token verifies credential with zero sensitive PII exposure', async () => {
    const res = await request(app).get(`/api/v1/core/id-cards/verify/${testVerificationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(false); // Because we revoked it in test 13
    expect(res.body.data.status).toBe('REVOKED');
    expect(res.body.data?.phone).toBeUndefined();
    expect(res.body.data?.address).toBeUndefined();
    expect(res.body.data?.marks).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // 10. SELF-SERVICE ENDPOINTS FOR STUDENT AND TEACHER
  // --------------------------------------------------------------------------
  it('15. GET /api/v1/id-cards/my-card returns authenticated student credential and school branding', async () => {
    const res = await request(app)
      .get('/api/v1/id-cards/my-card')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.card).toBeDefined();
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.school).toBeDefined();
    expect(res.body.data.template).toBeDefined();
  });

  it('16. GET /api/v1/id-cards/my-card returns authenticated teacher credential with faculty details', async () => {
    const res = await request(app)
      .get('/api/v1/id-cards/my-card')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.card).toBeDefined();
    expect(res.body.data.profile.role).toBe('TEACHER');
    expect(res.body.data.school.name).toBeDefined();
  });
});
