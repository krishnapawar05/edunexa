import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('SECTION 3: ADMISSION MANAGEMENT & DOWNLOADABLE FORMS TEST SUITE', () => {
  let schoolAdminToken: string;
  let teacherToken: string;
  let targetSchoolId: string;

  let createdEnquiryId: string;
  let createdEnquiryNumber: string;
  let createdAppId: string;
  let createdAppNumber: string;
  const testGuardianEmail = `test.parent.${Date.now()}@edunexa-admissions.org`;
  const testGuardianPhone = '+919876543210';

  beforeAll(async () => {
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    const school =
      (await prisma.school.findFirst({ where: { slug: 'apex-academy' } })) ||
      (await prisma.school.findFirst());

    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    schoolAdminToken = generateAccessToken({
      userId: 'usr-schooladmin-01',
      email: 'admin@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    teacherToken = generateAccessToken({
      userId: 'usr-teacher-01',
      email: 'dr.thorne@apexacademy.edu',
      schoolId: targetSchoolId,
      staffProfileId: 'staff-thorne-01',
      role: PlatformRole.TEACHER,
    });
  });

  // --------------------------------------------------------------------------
  // 1. PUBLIC ADMISSION CONFIGURATION
  // --------------------------------------------------------------------------
  it('1. GET /api/v1/admissions/public/config returns dynamic classes, documents, and popup settings', async () => {
    const res = await request(app).get('/api/v1/admissions/public/config?school=apex-academy');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { school, admissionSession, popup, classes, requiredDocuments } = res.body.data;
    expect(school).toBeDefined();
    expect(school.name).toBeDefined();
    expect(admissionSession).toBeDefined();
    expect(popup).toBeDefined();
    expect(popup.frequency).toBeDefined();
    expect(Array.isArray(classes)).toBe(true);
    expect(classes.length).toBeGreaterThan(0);
    expect(Array.isArray(requiredDocuments)).toBe(true);
    expect(requiredDocuments.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 2. PUBLIC ADMISSION ENQUIRY SUBMISSION
  // --------------------------------------------------------------------------
  it('2. POST /api/v1/admissions/public/enquiry successfully registers an enquiry with ENQ- reference', async () => {
    const res = await request(app)
      .post('/api/v1/admissions/public/enquiry?school=apex-academy')
      .send({
        parentName: 'Harold Finch',
        studentName: 'Bear Finch',
        email: testGuardianEmail,
        phone: testGuardianPhone,
        applyingClass: 'Grade 9',
        message: 'Requesting syllabus brochure and robotics facility tour details.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.enquiryNumber).toMatch(/^ENQ-2026-\d{4}$/);
    expect(res.body.data.status).toBe('NEW');

    createdEnquiryId = res.body.data.id;
    createdEnquiryNumber = res.body.data.enquiryNumber;
  });

  // --------------------------------------------------------------------------
  // 3. SPAM DEFENSE FOR ENQUIRIES
  // --------------------------------------------------------------------------
  it('3. POST /api/v1/admissions/public/enquiry detects rapid identical re-submission (spam guard)', async () => {
    const res = await request(app)
      .post('/api/v1/admissions/public/enquiry?school=apex-academy')
      .send({
        parentName: 'Harold Finch',
        studentName: 'Bear Finch',
        email: testGuardianEmail,
        phone: testGuardianPhone,
        applyingClass: 'Grade 9',
        message: 'Requesting syllabus brochure and robotics facility tour details.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enquiryNumber).toBe(createdEnquiryNumber);
    expect(res.body.data.message).toContain('already received');
  });

  // --------------------------------------------------------------------------
  // 4. MULTI-STEP ONLINE ADMISSION APPLICATION SUBMISSION
  // --------------------------------------------------------------------------
  it('4. POST /api/v1/admissions/public/apply successfully submits application with APP- reference', async () => {
    const res = await request(app)
      .post('/api/v1/admissions/public/apply?school=apex-academy')
      .send({
        studentFirstName: 'Marcus',
        studentLastName: 'Aurelius',
        dateOfBirth: '2012-04-26',
        gender: 'MALE',
        bloodGroup: 'O+',
        residentialAddress: 'Villa 12, Athena Promenade, High Grounds, Bengaluru',
        guardianName: 'Harold Finch',
        guardianRelationship: 'Father',
        guardianEmail: testGuardianEmail,
        guardianPhone: testGuardianPhone,
        applyingClass: 'Grade 9',
        academicSession: '2026–2027',
        previousSchool: 'Imperial Preparatory Academy',
        previousClass: 'Grade 8',
        marksPercentage: 92.5,
        documents: [
          {
            type: 'BIRTH_CERTIFICATE',
            fileName: 'birth_certificate_marcus.pdf',
            fileUrl: '/uploads/admissions/birth_certificate_marcus.pdf',
          },
          {
            type: 'PREVIOUS_MARKSHEET',
            fileName: 'grade8_marksheet.pdf',
            fileUrl: '/uploads/admissions/grade8_marksheet.pdf',
          },
        ],
        declarationAgreed: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.applicationNumber).toMatch(/^APP-2026-\d{4}$/);
    expect(res.body.data.status).toBe('SUBMITTED');

    createdAppId = res.body.data.id;
    createdAppNumber = res.body.data.applicationNumber;
  });

  // --------------------------------------------------------------------------
  // 5. APPLICATION STATUS TRACKING (AUTHORIZED VS UNAUTHORIZED)
  // --------------------------------------------------------------------------
  it('5a. POST /api/v1/admissions/public/track returns sanitized tracking progress for authorized contact', async () => {
    const res = await request(app)
      .post('/api/v1/admissions/public/track?school=apex-academy')
      .send({
        applicationNumber: createdAppNumber,
        verificationContact: testGuardianEmail,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applicationNumber).toBe(createdAppNumber);
    expect(res.body.data.studentName).toContain('Marcus');
    expect(res.body.data.status).toBe('SUBMITTED');
  });

  it('5b. POST /api/v1/admissions/public/track rejects unauthorized verification contact (401/404)', async () => {
    const res = await request(app)
      .post('/api/v1/admissions/public/track?school=apex-academy')
      .send({
        applicationNumber: createdAppNumber,
        verificationContact: 'wrong.parent@unauthorized.com',
      });

    expect([401, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 6. ADMIN ADMISSION STATS TELEMETRY
  // --------------------------------------------------------------------------
  it('6. GET /api/v1/admissions/admin/stats returns real counts for applications & enquiries', async () => {
    const res = await request(app)
      .get('/api/v1/admissions/admin/stats')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { applications, enquiries } = res.body.data;
    expect(applications.total).toBeGreaterThan(0);
    expect(enquiries.total).toBeGreaterThan(0);
    expect(typeof applications.submitted).toBe('number');
    expect(typeof enquiries.new).toBe('number');
  });

  // --------------------------------------------------------------------------
  // 7. ADMIN ENQUIRY MANAGEMENT (UPDATE & FOLLOW-UP NOTES)
  // --------------------------------------------------------------------------
  it('7. PUT /api/v1/admissions/admin/enquiries/:id updates status and follow-up notes', async () => {
    const res = await request(app)
      .put(`/api/v1/admissions/admin/enquiries/${createdEnquiryId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        status: 'CONTACTED',
        internalNotes: 'Contacted parent via telephone. Shared prospectus and campus tour link.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONTACTED');
    expect(res.body.data.internalNotes).toContain('Contacted parent');
  });

  // --------------------------------------------------------------------------
  // 8. ADMIN APPLICATION REVIEW: DOCUMENTS_REQUIRED DECISION
  // --------------------------------------------------------------------------
  it('8. POST /api/v1/admissions/admin/applications/:id/review marks application as DOCUMENTS_REQUIRED', async () => {
    const res = await request(app)
      .post(`/api/v1/admissions/admin/applications/${createdAppId}/review`)
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        decision: 'DOCUMENTS_REQUIRED',
        reviewNotes: 'Transfer Certificate copy is missing competent authority seal.',
        missingDocuments: [
          {
            type: 'TRANSFER_CERTIFICATE',
            notes: 'Please obtain counter-signature from educational officer.',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.application.status).toBe('DOCUMENTS_REQUIRED');
    expect(res.body.data.application.missingDocuments).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 9. ADMIN APPLICATION REVIEW: APPROVAL & TRANSACTION-SAFE STUDENT PROVISIONING
  // --------------------------------------------------------------------------
  it('9. POST /api/v1/admissions/admin/applications/:id/review approves application and provisions student', async () => {
    const res = await request(app)
      .post(`/api/v1/admissions/admin/applications/${createdAppId}/review`)
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        decision: 'APPROVED',
        assignedClass: 'Grade 9',
        assignedSection: 'A',
        reviewNotes: 'All criteria satisfied. Approved for admission into Grade 9 section A.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.application.status).toBe('APPROVED');
    expect(res.body.data.application.enrolledStudentProfileId).toBeDefined();
    expect(res.body.data.enrolledStudent).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 10. ADMIN ADMISSION CONFIG & POPUP SETTINGS UPDATE
  // --------------------------------------------------------------------------
  it('10. PUT /api/v1/admissions/admin/config successfully updates popup frequency and settings', async () => {
    const res = await request(app)
      .put('/api/v1/admissions/admin/config')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        admissionNoticeOpen: true,
        admissionSession: '2026–2027',
        admissionPopupEnabled: true,
        admissionPopupHeading: 'Admissions Open 2026–2027 (Apex Academy)',
        admissionPopupFrequency: 'ONCE_PER_DAY',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admissionPopupFrequency).toBe('ONCE_PER_DAY');
  });

  // --------------------------------------------------------------------------
  // 11. SECURITY & RBAC ISOLATION
  // --------------------------------------------------------------------------
  it('11. Non-admin roles (e.g. TEACHER) cannot perform application review (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/v1/admissions/admin/applications/${createdAppId}/review`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        decision: 'REJECTED',
        reviewNotes: 'Unauthorized attempt',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
