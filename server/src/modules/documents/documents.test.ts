import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { PlatformRole } from '@edunexa/shared';

describe('SECTION 10: ADMISSION, DOCUMENT & DOWNLOAD CENTRE TEST SUITE', () => {
  let schoolId: string;
  let adminUserId: string;
  let teacherUserId: string;
  let studentUserId: string;
  let secondStudentUserId: string;
  let parentUserId: string;
  let unrelatedParentUserId: string;
  let studentProfileId: string;
  let secondStudentProfileId: string;

  let adminToken: string;
  let studentToken: string;
  let parentToken: string;
  let unrelatedParentToken: string;

  let testPublicDocId: string;
  let testDraftDocId: string;
  let testCertificateId: string;
  let testCertificateQrToken: string;

  const generateToken = (payload: any) =>
    jwt.sign(payload, env.jwtAccessSecret, { expiresIn: '1h' });

  beforeAll(async () => {
    // 1. Resolve or seed test school
    let school = await prisma.school.findFirst({ where: { slug: 'apex-academy' } });
    if (!school) {
      school = await prisma.school.create({
        data: {
          slug: 'apex-academy',
          name: 'Apex Academy of Sciences & Arts',
          code: 'APEX-2026',
          email: 'admin@apexacademy.edu',
          phone: '+91 11 2659 1000',
          address: 'Plot 42, Institutional Area',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
        },
      });
    }
    schoolId = school.id;

    // Helper to get or create a user with a specific membership role
    const getOrCreateUserWithRole = async (email: string, firstName: string, lastName: string, role: any) => {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            passwordHash: '$2b$10$dummyHash1234567890abcdef',
          },
        });
      }

      let membership = await prisma.userMembership.findFirst({
        where: { userId: user.id, schoolId, role },
      });
      if (!membership) {
        membership = await prisma.userMembership.create({
          data: {
            userId: user.id,
            schoolId,
            role,
          },
        });
      }

      return { user, membership };
    };

    const admin = await getOrCreateUserWithRole('admin.sec10@apexacademy.edu', 'Admin', 'Officer', PlatformRole.SCHOOL_ADMIN);
    const student1 = await getOrCreateUserWithRole('student1.sec10@apexacademy.edu', 'Aarav', 'Verma', PlatformRole.STUDENT);
    const student2 = await getOrCreateUserWithRole('student2.sec10@apexacademy.edu', 'Rohan', 'Gupta', PlatformRole.STUDENT);
    const parent1 = await getOrCreateUserWithRole('parent1.sec10@apexacademy.edu', 'Sunita', 'Verma', PlatformRole.PARENT);
    const parent2 = await getOrCreateUserWithRole('parent2.sec10@apexacademy.edu', 'Vikram', 'Mehta', PlatformRole.PARENT);

    adminUserId = admin.user.id;
    studentUserId = student1.user.id;
    secondStudentUserId = student2.user.id;
    parentUserId = parent1.user.id;
    unrelatedParentUserId = parent2.user.id;

    // Student 1 Profile
    let sp1 = await prisma.studentProfile.findUnique({ where: { membershipId: student1.membership.id } });
    if (!sp1) {
      sp1 = await prisma.studentProfile.create({
        data: {
          membershipId: student1.membership.id,
          admissionNumber: `ADM-${Date.now().toString().slice(-6)}`,
          dateOfBirth: new Date('2010-05-15'),
          gender: 'MALE',
          emergencyPhone: '+91 98765 43210',
        },
      });
    }
    studentProfileId = sp1.id;

    // Student 2 Profile
    let sp2 = await prisma.studentProfile.findUnique({ where: { membershipId: student2.membership.id } });
    if (!sp2) {
      sp2 = await prisma.studentProfile.create({
        data: {
          membershipId: student2.membership.id,
          admissionNumber: `ADM-${(Date.now() + 1).toString().slice(-6)}`,
          dateOfBirth: new Date('2010-08-20'),
          gender: 'MALE',
          emergencyPhone: '+91 98765 43211',
        },
      });
    }
    secondStudentProfileId = sp2.id;

    // Link Parent 1 to Student 1
    const existingLink = await prisma.parentStudentLink.findFirst({
      where: { parentMembershipId: parent1.membership.id, studentProfileId },
    });
    if (!existingLink) {
      await prisma.parentStudentLink.create({
        data: {
          parentMembershipId: parent1.membership.id,
          studentProfileId,
          relationship: 'MOTHER',
          isPrimaryContact: true,
        },
      });
    }

    // Tokens
    adminToken = generateToken({ userId: adminUserId, email: admin.user.email, role: PlatformRole.SCHOOL_ADMIN, schoolId });
    studentToken = generateToken({ userId: studentUserId, email: student1.user.email, role: PlatformRole.STUDENT, schoolId });
    parentToken = generateToken({ userId: parentUserId, email: parent1.user.email, role: PlatformRole.PARENT, schoolId });
    unrelatedParentToken = generateToken({ userId: unrelatedParentUserId, email: parent2.user.email, role: PlatformRole.PARENT, schoolId });
  });

  // ============================================================================
  // 1. PUBLIC DOWNLOAD CENTRE
  // ============================================================================
  describe('1. Public Download Centre (Unauthenticated Access)', () => {
    it('1.1 Admin publishes an official school prospectus and admission guidelines', async () => {
      const res = await request(app)
        .post('/api/v1/documents/admin/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Official School Prospectus 2026-2027',
          description: 'Comprehensive curriculum guide, institutional values, and admission procedures.',
          category: 'PROSPECTUS',
          fileUrl: 'https://edunexa.storage.internal/public/Prospectus_2026.pdf',
          fileSize: '3.4 MB',
          fileType: 'PDF',
          targetAudience: 'PUBLIC',
          isPublished: true,
          publicationStatus: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      testPublicDocId = res.body.data.id;
    });

    it('1.2 Admin creates a draft document not yet available to the public', async () => {
      const res = await request(app)
        .post('/api/v1/documents/admin/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Upcoming Fee Revision Notice (Confidential Draft)',
          description: 'Internal draft not for public release.',
          category: 'FEE_STRUCTURE',
          fileUrl: 'https://edunexa.storage.internal/admin/fee_draft_confidential.pdf',
          fileSize: '850 KB',
          fileType: 'PDF',
          targetAudience: 'STAFF_ONLY',
          isPublished: false,
          publicationStatus: 'DRAFT',
        });

      expect(res.status).toBe(201);
      testDraftDocId = res.body.data.id;
    });

    it('1.3 Public visitor retrieves published documents without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/documents/public')
        .query({ schoolIdentifier: 'apex-academy' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const foundPublic = res.body.data.find((d: any) => d.id === testPublicDocId);
      const foundDraft = res.body.data.find((d: any) => d.id === testDraftDocId);

      expect(foundPublic).toBeDefined();
      expect(foundPublic.title).toBe('Official School Prospectus 2026-2027');
      // Draft document MUST be excluded
      expect(foundDraft).toBeUndefined();
    });

    it('1.4 Public visitor filters documents by category (PROSPECTUS)', async () => {
      const res = await request(app)
        .get('/api/v1/documents/public')
        .query({ schoolIdentifier: 'apex-academy', category: 'PROSPECTUS' });

      expect(res.status).toBe(200);
      expect(res.body.data.every((d: any) => d.category === 'PROSPECTUS')).toBe(true);
    });

    it('1.5 Public visitor retrieves individual document and increments download count', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/public/${testPublicDocId}`)
        .query({ schoolIdentifier: 'apex-academy' });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testPublicDocId);
      expect(res.body.data.downloadCount).toBeGreaterThanOrEqual(1);
    });

    it('1.6 Requesting a draft or restricted document via public URL returns 404', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/public/${testDraftDocId}`)
        .query({ schoolIdentifier: 'apex-academy' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  // ============================================================================
  // 2. ADMIN DOCUMENT MANAGEMENT
  // ============================================================================
  describe('2. School Admin Document Management & Metadata Governance', () => {
    it('2.1 Admin lists all school documents including drafts and target audiences', async () => {
      const res = await request(app)
        .get('/api/v1/documents/admin/documents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('2.2 Admin updates document metadata and changes category', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/admin/documents/${testPublicDocId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Official School Prospectus & Admission Guide 2026-2027 (Revised)',
          category: 'ADMISSION_FORM',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('(Revised)');
      expect(res.body.data.category).toBe('ADMISSION_FORM');
    });

    it('2.3 Non-admin student cannot perform administrative document modifications (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/admin/documents/${testPublicDocId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Tampered Document Title' });

      expect(res.status).toBe(403);
    });
  });

  // ============================================================================
  // 3. STUDENT & PARENT ACADEMIC DOWNLOAD CENTRE
  // ============================================================================
  describe('3. Student & Parent/Guardian Academic Documents Hub', () => {
    it('3.1 Enrolled student can retrieve their own consolidated academic documents', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/academic/students/${studentProfileId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(studentProfileId);
      expect(res.body.data.documents).toBeDefined();
      expect(res.body.data.documents.admitCards).toBeDefined();
      expect(res.body.data.documents.marksheets).toBeDefined();
      expect(res.body.data.documents.certificates).toBeDefined();
    });

    it('3.2 Student cannot access another student profile documents (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/academic/students/${secondStudentProfileId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_STUDENT_OWNERSHIP');
    });

    it('3.3 Linked parent can retrieve their ward academic documents', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/academic/students/${studentProfileId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(studentProfileId);
    });

    it('3.4 Unrelated parent cannot access non-linked student academic documents (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/academic/students/${studentProfileId}`)
        .set('Authorization', `Bearer ${unrelatedParentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_GUARDIAN_LINK');
    });
  });

  // ============================================================================
  // 4. INSTITUTIONAL CERTIFICATES (BONAFIDE & TC)
  // ============================================================================
  describe('4. Institutional Certificates Issuance & QR Verification', () => {
    it('4.1 Admin issues an official Bonafide Certificate with auto-generated serial number', async () => {
      const res = await request(app)
        .post('/api/v1/documents/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentProfileId,
          certificateType: 'BONAFIDE',
          reason: 'Passport and Visa Application Verification',
          remarks: 'Student bears exemplary conduct in Grade 10-A',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.certificateNumber).toContain('BON-APEX-');
      expect(res.body.data.qrToken).toBeDefined();

      testCertificateId = res.body.data.id;
      testCertificateQrToken = res.body.data.qrToken;
    });

    it('4.2 Admin issues a Transfer Certificate (TC) upon completion', async () => {
      const res = await request(app)
        .post('/api/v1/documents/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentProfileId: secondStudentProfileId,
          certificateType: 'TRANSFER_CERTIFICATE',
          reason: 'Family Relocation',
          remarks: 'All institutional fees cleared in full.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.certificateNumber).toContain('TC-APEX-');
    });

    it('4.3 Public QR verification endpoint confirms authentic institutional certificate', async () => {
      const res = await request(app)
        .get(`/api/v1/documents/certificates/verify/${testCertificateQrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.certificateType).toBe('BONAFIDE');
      expect(res.body.data.candidate.fullName).toBe('Aarav Verma');
    });

    it('4.4 Invalid QR verification token returns 404', async () => {
      const res = await request(app)
        .get('/api/v1/documents/certificates/verify/invalid-fake-qr-token-1234');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CERTIFICATE_INVALID');
    });

    it('4.5 Admin lists all issued institutional certificates', async () => {
      const res = await request(app)
        .get('/api/v1/documents/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('4.6 Admin can update certificate status to REVOKED', async () => {
      const res = await request(app)
        .patch(`/api/v1/documents/admin/certificates/${testCertificateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'REVOKED',
          remarks: 'Revoked due to administrative re-issuance',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REVOKED');
    });
  });

  // ============================================================================
  // 5. AUDIT & ACCESS LOGGING
  // ============================================================================
  describe('5. Document Access Logging & Compliance Auditing', () => {
    it('5.1 Record preview and download events in DocumentAccessLog', async () => {
      const res = await request(app)
        .post('/api/v1/documents/access/log')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'CERTIFICATE',
          documentId: testCertificateId,
          documentTitle: 'Official Bonafide Certificate',
          action: 'PRINT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('5.2 Admin retrieves audit access log ledger', async () => {
      const res = await request(app)
        .get('/api/v1/documents/admin/access-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].documentTitle).toBeDefined();
    });
  });
});
