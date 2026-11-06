import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('SECTION 8: STUDENT, PARENT & TEACHER ROLE-BASED PANELS TEST SUITE', () => {
  const schoolId = '92318ca5-473c-4436-a7cd-6b6eaadac413'; // Apex Academy
  const foreignSchoolId = '4f9704c8-f139-459a-afc0-95e5ff9b85ec';

  // Tokens
  let studentToken: string;
  let studentProfileId: string;
  let studentUserId: string;

  let parentToken: string;
  let parentUserId: string;
  let linkedChildAId: string;

  let foreignParentToken: string;

  let teacherToken: string;
  let teacherUserId: string;

  let createdBookId: string;
  let createdIssueId: string;
  let createdMeetingId: string;

  beforeAll(async () => {
    // 1. Fetch real student in Apex Academy
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { membership: { schoolId }, status: 'ACTIVE' },
      include: { membership: true },
    });

    if (studentProfile) {
      studentProfileId = studentProfile.id;
      studentUserId = studentProfile.membership.userId;
      studentToken = generateAccessToken({
        userId: studentUserId,
        email: 'student.test@apexacademy.edu',
        schoolId,
        role: PlatformRole.STUDENT,
        studentProfileId,
      });
    }

    // 2. Fetch or establish Parent with linked child
    const parentMembership = await prisma.userMembership.findFirst({
      where: { schoolId, role: PlatformRole.PARENT },
      include: {
        parentLinks: { include: { studentProfile: true } },
      },
    });

    if (parentMembership && parentMembership.parentLinks.length > 0) {
      parentUserId = parentMembership.userId;
      linkedChildAId = parentMembership.parentLinks[0].studentProfileId;
      parentToken = generateAccessToken({
        userId: parentUserId,
        email: 'parent.test@apexacademy.edu',
        schoolId,
        role: PlatformRole.PARENT,
      });
    } else {
      // Create user and link for testing
      const testUser = await prisma.user.create({
        data: {
          email: `test.parent.${Date.now()}@apexacademy.edu`,
          firstName: 'Ramesh',
          lastName: 'Sharma',
          passwordHash: '$2b$10$dummyHash1234567890abcdef',
        },
      });
      const newParentMembership = await prisma.userMembership.create({
        data: {
          userId: testUser.id,
          schoolId,
          role: PlatformRole.PARENT,
        },
      });
      await prisma.parentStudentLink.create({
        data: {
          parentMembershipId: newParentMembership.id,
          studentProfileId,
          relationship: 'Father',
          isPrimaryContact: true,
        },
      });
      parentUserId = testUser.id;
      linkedChildAId = studentProfileId;
      parentToken = generateAccessToken({
        userId: parentUserId,
        email: testUser.email,
        schoolId,
        role: PlatformRole.PARENT,
      });
    }

    // 3. Foreign parent (from another school)
    foreignParentToken = generateAccessToken({
      userId: 'usr-foreign-parent-01',
      email: 'foreign.parent@other.edu',
      schoolId: foreignSchoolId,
      role: PlatformRole.PARENT,
    });

    // 4. Fetch teacher
    const teacherMembership = await prisma.userMembership.findFirst({
      where: { schoolId, role: PlatformRole.TEACHER },
    });
    if (teacherMembership) {
      teacherUserId = teacherMembership.userId;
      teacherToken = generateAccessToken({
        userId: teacherUserId,
        email: 'teacher.test@apexacademy.edu',
        schoolId,
        role: PlatformRole.TEACHER,
      });
    } else {
      const tUser = await prisma.user.create({
        data: {
          email: `test.teacher.${Date.now()}@apexacademy.edu`,
          firstName: 'Meenakshi',
          lastName: 'Sundaram',
          passwordHash: '$2b$10$dummyHash1234567890abcdef',
        },
      });
      await prisma.userMembership.create({
        data: {
          userId: tUser.id,
          schoolId,
          role: PlatformRole.TEACHER,
        },
      });
      teacherUserId = tUser.id;
      teacherToken = generateAccessToken({
        userId: teacherUserId,
        email: tUser.email,
        schoolId,
        role: PlatformRole.TEACHER,
      });
    }
  });

  // ============================================================================
  // 1. STUDENT PANEL ENDPOINTS & OWNERSHIP
  // ============================================================================
  describe('1. Student Panel: Personal Dashboard, Academics & Services', () => {
    it('1.1 Student retrieves unified dashboard telemetry with real PostgreSQL records', async () => {
      const res = await request(app)
        .get('/api/v1/portals/student/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.student.admissionNumber).toBeDefined();
      expect(res.body.data.attendance).toHaveProperty('attendancePercentage');
      expect(Array.isArray(res.body.data.assignments)).toBe(true);
      expect(Array.isArray(res.body.data.marksheets)).toBe(true);
      expect(Array.isArray(res.body.data.admitCards)).toBe(true);
      expect(res.body.data.fees).toHaveProperty('pendingAmount');
    });

    it('1.2 Student retrieves official admission details and verification documents', async () => {
      const res = await request(app)
        .get('/api/v1/portals/student/admission-details')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('admissionNumber');
      expect(res.body.data).toHaveProperty('admissionStatus');
      expect(Array.isArray(res.body.data.documents)).toBe(true);
    });

    it('1.3 Student retrieves library issue history', async () => {
      const res = await request(app)
        .get('/api/v1/portals/student/library')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('1.4 Student retrieves scheduled meetings with join links', async () => {
      const res = await request(app)
        .get('/api/v1/portals/student/meetings')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('1.5 Student cannot access parent or administrative endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/portals/parent/children')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================================================
  // 2. PARENT PANEL: MULTI-CHILD SELECTOR & ISOLATION
  // ============================================================================
  describe('2. Parent/Guardian Panel: Multi-Child Discovery & Switching', () => {
    it('2.1 Parent retrieves list of all authorized linked children', async () => {
      const res = await request(app)
        .get('/api/v1/portals/parent/children')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const firstChild = res.body.data[0];
      expect(firstChild).toHaveProperty('studentProfileId');
      expect(firstChild).toHaveProperty('fullName');
      expect(firstChild).toHaveProperty('className');
      expect(firstChild).toHaveProperty('attendancePercent');
      expect(firstChild).toHaveProperty('pendingFees');
    });

    it('2.2 Parent retrieves full dashboard for their selected child', async () => {
      const res = await request(app)
        .get(`/api/v1/portals/parent/child/${linkedChildAId}/dashboard`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(linkedChildAId);
      expect(res.body.data.attendance).toBeDefined();
      expect(res.body.data.fees).toBeDefined();
      expect(Array.isArray(res.body.data.homework)).toBe(true);
      expect(Array.isArray(res.body.data.marksheets)).toBe(true);
    });

    it('2.3 Parent retrieves verified fee payment receipts for selected child', async () => {
      const res = await request(app)
        .get(`/api/v1/portals/parent/child/${linkedChildAId}/receipts`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('2.4 Parent retrieves homework and assignments for selected child', async () => {
      const res = await request(app)
        .get(`/api/v1/portals/parent/child/${linkedChildAId}/homework`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('2.5 Security: Parent cannot access an unrelated student profile (403 FORBIDDEN_RECORD_ACCESS)', async () => {
      const res = await request(app)
        .get('/api/v1/portals/parent/child/non-existent-or-unrelated-child-id/dashboard')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_RECORD_ACCESS');
    });

    it('2.6 Security: Foreign parent from another school cannot access this student (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/portals/parent/child/${linkedChildAId}/dashboard`)
        .set('Authorization', `Bearer ${foreignParentToken}`);

      expect(res.status).toBe(403);
    });

    it('2.7 Parent can send an academic inquiry message to teacher for their child', async () => {
      const res = await request(app)
        .post(`/api/v1/portals/parent/child/${linkedChildAId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          subject: 'Clarification regarding upcoming mathematics test',
          messageContent: 'Dear Teacher, could you please confirm chapter coverage for next week test?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messageContent).toContain('chapter coverage');
    });
  });

  // ============================================================================
  // 3. TEACHER PANEL: ACADEMICS, REMARKS, MEETINGS & PERFORMANCE
  // ============================================================================
  describe('3. Teacher Panel: Schedule, Performance Reports, Remarks & Meetings', () => {
    it('3.1 Teacher retrieves operational dashboard telemetry with assigned classes', async () => {
      const res = await request(app)
        .get('/api/v1/portals/teacher/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
      expect(Array.isArray(res.body.data.todaySchedule)).toBe(true);
      expect(Array.isArray(res.body.data.meetings)).toBe(true);
    });

    it('3.2 Teacher retrieves real academic performance reports with distribution statistics', async () => {
      const res = await request(app)
        .get('/api/v1/portals/teacher/academic-reports')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toHaveProperty('averageMarks');
      expect(res.body.data.summary).toHaveProperty('passPercentage');
      expect(Array.isArray(res.body.data.distribution)).toBe(true);
      expect(Array.isArray(res.body.data.studentRoster)).toBe(true);
    });

    it('3.3 Teacher records academic feedback remark for a student', async () => {
      const res = await request(app)
        .post(`/api/v1/portals/teacher/students/${studentProfileId}/remarks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentProfileId,
          category: 'ACADEMIC',
          remark: 'Demonstrates exceptional critical thinking in physics problem sets.',
          isPrivate: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.remark).toContain('exceptional critical thinking');
    });

    it('3.4 Teacher retrieves remarks for a student', async () => {
      const res = await request(app)
        .get(`/api/v1/portals/teacher/students/${studentProfileId}/remarks`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('3.5 Teacher schedules a Parent-Teacher Meeting with Google Meet joining link', async () => {
      const res = await request(app)
        .post('/api/v1/portals/teacher/meetings')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Term 1 Academic Progress Review',
          description: 'Discussion on midterm exam outcomes and recommended revision plan.',
          meetingType: 'PARENT_TEACHER',
          studentProfileId,
          scheduledDate: '2026-11-15',
          startTime: '10:00 AM',
          endTime: '10:30 AM',
          meetingMode: 'ONLINE',
          joiningUrl: 'https://meet.google.com/edn-ptm-term1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Term 1 Academic Progress Review');
      expect(res.body.data.status).toBe('SCHEDULED');
      createdMeetingId = res.body.data.id;
    });

    it('3.6 Teacher updates meeting status to COMPLETED with notes', async () => {
      const res = await request(app)
        .patch(`/api/v1/portals/teacher/meetings/${createdMeetingId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          status: 'COMPLETED',
          notes: 'Met with guardian. Aligned on mathematics revision schedule.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  // ============================================================================
  // 4. LIBRARY SERVICES WORKFLOW
  // ============================================================================
  describe('4. Library Module: Books Inventory, Issue & Return Lifecycle', () => {
    it('4.1 Adds a new cataloged book into institutional library', async () => {
      const res = await request(app)
        .post('/api/v1/portals/library/books')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Fundamentals of Modern Physics',
          author: 'Dr. H. C. Verma',
          isbn: '978-81-7709-187-8',
          category: 'Physics',
          publisher: 'Bharati Bhawan',
          totalCopies: 5,
          shelfLocation: 'Stack-B / Row-04',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Fundamentals of Modern Physics');
      expect(res.body.data.availableCopies).toBe(5);
      createdBookId = res.body.data.id;
    });

    it('4.2 Issues library book to student and decrements available copies', async () => {
      const res = await request(app)
        .post('/api/v1/portals/library/issue')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          bookId: createdBookId,
          studentProfileId,
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          notes: 'Standard 14-day book lending',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ISSUED');
      createdIssueId = res.body.data.id;

      // Verify book copy decremented
      const book = await prisma.libraryBook.findUnique({ where: { id: createdBookId } });
      expect(book?.availableCopies).toBe(4);
    });

    it('4.3 Student can now view this newly issued book in their library tab', async () => {
      const res = await request(app)
        .get('/api/v1/portals/student/library')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const myIssues = res.body.data;
      const found = myIssues.find((i: any) => i.id === createdIssueId);
      expect(found).toBeDefined();
      expect(found.book.title).toBe('Fundamentals of Modern Physics');
      expect(found.status).toBe('ISSUED');
    });

    it('4.4 Returns library book and restores available copy count', async () => {
      const res = await request(app)
        .post(`/api/v1/portals/library/return/${createdIssueId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ fineAmount: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RETURNED');

      const book = await prisma.libraryBook.findUnique({ where: { id: createdBookId } });
      expect(book?.availableCopies).toBe(5);
    });
  });
});

