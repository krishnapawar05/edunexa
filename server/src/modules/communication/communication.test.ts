import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../config/db.js';
import { PlatformRole } from '@edunexa/shared';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

describe('SECTION 9: INTERNAL CHAT, MESSAGING, MEETINGS & CALENDAR TEST SUITE', () => {
  const app = createApp();

  let schoolId: string;
  let adminUserId: string;
  let teacherUserId: string;
  let studentUserId: string;
  let secondStudentUserId: string;
  let parentUserId: string;
  let superAdminUserId: string;

  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let secondStudentToken: string;
  let parentToken: string;
  let superAdminToken: string;

  let testConversationId: string;
  let testGroupId: string;
  let testMessageId: string;
  let testReportId: string;

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

    // Reset test school communication permissions to default restricted policy
    await prisma.communicationPermissionConfig.upsert({
      where: { schoolId },
      update: {
        allowStudentToStudent: false,
        allowParentToParent: false,
        allowTeacherToStudent: true,
        allowTeacherToParent: true,
        allowAdminToAll: true,
        allowFileSharing: true,
      },
      create: {
        schoolId,
        allowStudentToStudent: false,
        allowParentToParent: false,
        allowTeacherToStudent: true,
        allowTeacherToParent: true,
        allowAdminToAll: true,
        allowFileSharing: true,
      },
    });

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

      return user;
    };

    const admin = await getOrCreateUserWithRole('admin.sec9@apexacademy.edu', 'Admin', 'User', PlatformRole.SCHOOL_ADMIN);
    const teacher = await getOrCreateUserWithRole('teacher.sec9@apexacademy.edu', 'Julian', 'Thorne', PlatformRole.TEACHER);
    const student1 = await getOrCreateUserWithRole('student1.sec9@apexacademy.edu', 'Aarav', 'Sharma', PlatformRole.STUDENT);
    const student2 = await getOrCreateUserWithRole('student2.sec9@apexacademy.edu', 'Diya', 'Patel', PlatformRole.STUDENT);
    const parent = await getOrCreateUserWithRole('parent.sec9@apexacademy.edu', 'Sunita', 'Sharma', PlatformRole.PARENT);
    const superAdmin = await getOrCreateUserWithRole('superadmin.sec9@edunexa.org', 'Super', 'Admin', PlatformRole.SUPER_ADMIN);

    adminUserId = admin.id;
    teacherUserId = teacher.id;
    studentUserId = student1.id;
    secondStudentUserId = student2.id;
    parentUserId = parent.id;
    superAdminUserId = superAdmin.id;

    adminToken = generateToken({ userId: adminUserId, email: admin.email, role: PlatformRole.SCHOOL_ADMIN, schoolId });
    teacherToken = generateToken({ userId: teacherUserId, email: teacher.email, role: PlatformRole.TEACHER, schoolId });
    studentToken = generateToken({ userId: studentUserId, email: student1.email, role: PlatformRole.STUDENT, schoolId });
    secondStudentToken = generateToken({ userId: secondStudentUserId, email: student2.email, role: PlatformRole.STUDENT, schoolId });
    parentToken = generateToken({ userId: parentUserId, email: parent.email, role: PlatformRole.PARENT, schoolId });
    superAdminToken = generateToken({ userId: superAdminUserId, email: superAdmin.email, role: PlatformRole.SUPER_ADMIN, schoolId });
  });

  // ============================================================================
  // 1. ONE-TO-ONE CHAT & PERMISSIONS
  // ============================================================================
  describe('1. One-to-One Chat Lifecycle & Role Permissions', () => {
    it('1.1 Teacher can initiate 1-on-1 direct conversation with Student', async () => {
      const res = await request(app)
        .post('/api/v1/communication/direct')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ targetUserId: studentUserId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.type).toBe('DIRECT');
      testConversationId = res.body.data.id;
    });

    it('1.2 Subsequent direct chat lookup returns the same conversation (idempotent)', async () => {
      const res = await request(app)
        .post('/api/v1/communication/direct')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ targetUserId: teacherUserId });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testConversationId);
    });

    it('1.3 Student-to-student private chat is blocked by default policy (403)', async () => {
      const res = await request(app)
        .post('/api/v1/communication/direct')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ targetUserId: secondStudentUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('POLICY_COMMUNICATION_BLOCKED');
    });

    it('1.4 Teacher sends text message to student in conversation', async () => {
      const res = await request(app)
        .post('/api/v1/communication/messages')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          conversationId: testConversationId,
          content: 'Hello Aarav, please review Chapter 4 Physics homework problem set.',
          messageType: 'TEXT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('Chapter 4 Physics');
      expect(res.body.data.status).toBe('SENT');
      testMessageId = res.body.data.id;
    });

    it('1.5 Student marks message as read and updates read receipt', async () => {
      const res = await request(app)
        .post(`/api/v1/communication/conversations/${testConversationId}/messages/${testMessageId}/read`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('READ');
      expect(res.body.data).toHaveProperty('readAt');
    });

    it('1.6 User can retrieve message history with receipts and attachments', async () => {
      const res = await request(app)
        .get(`/api/v1/communication/conversations/${testConversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(testMessageId);
    });

    it('1.7 Search messages returns authorized matching content', async () => {
      const res = await request(app)
        .get('/api/v1/communication/messages/search?q=Chapter')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].content).toContain('Chapter 4');
    });
  });

  // ============================================================================
  // 2. GROUP CHATS
  // ============================================================================
  describe('2. Group Chat Management & Participation', () => {
    it('2.1 Teacher creates a Class Study Group', async () => {
      const res = await request(app)
        .post('/api/v1/communication/groups')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'GROUP',
          title: 'Grade 10-A Physics Cohort',
          groupType: 'CLASS_GROUP',
          participantIds: [studentUserId],
          initialMessage: 'Welcome all students to the official Physics discussion channel.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('GROUP');
      expect(res.body.data.title).toBe('Grade 10-A Physics Cohort');
      testGroupId = res.body.data.id;
    });

    it('2.2 Group Admin adds second student into the group', async () => {
      const res = await request(app)
        .post(`/api/v1/communication/groups/${testGroupId}/participants`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ userIds: [secondStudentUserId] });

      expect(res.status).toBe(200);
      const participantIds = res.body.data.participants.map((p: any) => p.userId);
      expect(participantIds).toContain(secondStudentUserId);
    });

    it('2.3 Non-admin student cannot remove other members (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/communication/groups/${testGroupId}/participants/${secondStudentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('2.4 Group Admin removes participant successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/communication/groups/${testGroupId}/participants/${secondStudentUserId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================================================
  // 3. MESSAGE REPORTING & MODERATION
  // ============================================================================
  describe('3. Message Reporting & Administrative Moderation', () => {
    it('3.1 Student can report an inappropriate message', async () => {
      const res = await request(app)
        .post('/api/v1/communication/messages/report')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          messageId: testMessageId,
          reason: 'Inappropriate content requiring administrative review.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      testReportId = res.body.data.id;
    });

    it('3.2 School Admin can list reported messages', async () => {
      const res = await request(app)
        .get('/api/v1/communication/moderation/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.id === testReportId)).toBe(true);
    });

    it('3.3 School Admin takes moderation action (MESSAGE_REMOVED) and redacts content', async () => {
      const res = await request(app)
        .patch(`/api/v1/communication/moderation/reports/${testReportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'MESSAGE_REMOVED',
          moderatorNotes: 'Removed in accordance with code of conduct.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTION_TAKEN');
      expect(res.body.data.moderationAction).toBe('MESSAGE_REMOVED');
    });
  });

  // ============================================================================
  // 4. SUPER ADMIN COMMUNICATION MONITORING
  // ============================================================================
  describe('4. Super Admin Centralized Monitoring & Audit', () => {
    it('4.1 Super Admin retrieves communication telemetry and statutory privacy policy', async () => {
      const res = await request(app)
        .get('/api/v1/communication/superadmin/telemetry')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalConversations');
      expect(res.body.data).toHaveProperty('totalMessages');
      expect(res.body.data.privacyPolicy.enforced).toBe(true);
      expect(res.body.data.privacyPolicy.noticeText).toContain('Official school communication is recorded');
    });

    it('4.2 Super Admin can view monitored conversations across school tenants', async () => {
      const res = await request(app)
        .get('/api/v1/communication/superadmin/conversations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('4.3 Super Admin exports conversation records as CSV and creates audit log', async () => {
      const res = await request(app)
        .get(`/api/v1/communication/superadmin/conversations/${testConversationId}/export?format=CSV`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.format).toBe('CSV');
      expect(res.body.data.content).toContain('MessageID,SenderName');
    });

    it('4.4 Super Admin exports conversation records as PDF data structure', async () => {
      const res = await request(app)
        .get(`/api/v1/communication/superadmin/conversations/${testConversationId}/export?format=PDF`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.format).toBe('PDF');
      expect(res.body.data).toHaveProperty('schoolName');
    });

    it('4.5 Administrative audit logs record export action', async () => {
      const res = await request(app)
        .get('/api/v1/communication/superadmin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((l: any) => l.action.startsWith('EXPORT_CHAT'))).toBe(true);
    });

    it('4.6 Super Admin updates communication policy permissions', async () => {
      const res = await request(app)
        .patch('/api/v1/communication/permissions/config')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          allowStudentToStudent: true,
          allowParentToParent: true,
          maxAttachmentSizeBytes: 15728640,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.allowStudentToStudent).toBe(true);
      expect(res.body.data.allowParentToParent).toBe(true);
    });
  });

  // ============================================================================
  // 5. GOOGLE WORKSPACE & GOOGLE MEET INTEGRATION
  // ============================================================================
  describe('5. Google Workspace, Meet & Calendar Integration', () => {
    it('5.1 Retrieve Google Workspace integration status for school', async () => {
      const res = await request(app)
        .get('/api/v1/communication/google/config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status');
    });

    it('5.2 School Admin configures Google Workspace OAuth connection', async () => {
      const res = await request(app)
        .post('/api/v1/communication/google/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: 'edunexa-google-client-id-123.apps.googleusercontent.com',
          clientSecret: 'google-secret-xyz',
          connectedEmail: 'admin@apexacademy.edu',
          calendarSyncEnabled: true,
          meetIntegrationEnabled: true,
          status: 'CONNECTED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONNECTED');
      expect(res.body.data.connectedEmail).toBe('admin@apexacademy.edu');
    });

    it('5.3 Schedule Meeting generates genuine Google Meet link and synchronizes with Calendar', async () => {
      const res = await request(app)
        .post('/api/v1/communication/meetings/schedule')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Comprehensive Academic Term Consultation',
          description: 'PTM to review mid-term exam performance and progress hints.',
          meetingType: 'PARENT_TEACHER',
          scheduledDate: '2026-11-20',
          startTime: '10:00 AM',
          endTime: '10:30 AM',
          meetingMode: 'ONLINE',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('joiningUrl');
      expect(res.body.data.joiningUrl).toMatch(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
    });

    let testCalendarEventId: string;

    it('5.4 Teacher creates an ERP Calendar Event', async () => {
      const res = await request(app)
        .post('/api/v1/communication/calendar/events')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'National Science Day Exhibition & Workshop',
          description: 'Annual STEM science projects exhibition.',
          category: 'ACADEMIC',
          startDate: '2026-11-28T09:00:00Z',
          endDate: '2026-11-28T16:00:00Z',
          isAllDay: false,
          location: 'Auditorium & Physics Lab',
          targetAudience: 'ALL',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toContain('National Science Day');
      testCalendarEventId = res.body.data.id;
    });

    it('5.5 List Calendar Events retrieves both custom events and formal examination schedules', async () => {
      const res = await request(app)
        .get('/api/v1/communication/calendar/events')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((e: any) => e.category === 'ACADEMIC')).toBe(true);
    });

    it('5.6 Teacher edits their own scheduled calendar event', async () => {
      const res = await request(app)
        .put(`/api/v1/communication/calendar/events/${testCalendarEventId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'National Science Day Exhibition & Robotics Arena (Updated)',
          description: 'Updated STEM robotics demonstration & keynote lecture.',
          category: 'ACADEMIC',
          startDate: '2026-11-28T10:00:00Z',
          endDate: '2026-11-28T17:00:00Z',
          location: 'Auditorium Hall A & Robotics Lab',
          targetAudience: 'ALL',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('(Updated)');
      expect(res.body.data.location).toBe('Auditorium Hall A & Robotics Lab');
    });

    it('5.7 School Admin can edit any calendar event in the institutional tenant', async () => {
      const res = await request(app)
        .patch(`/api/v1/communication/calendar/events/${testCalendarEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Verified by Institutional School Admin. High priority attendance.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toContain('Verified by Institutional School Admin');
    });

    it('5.8 Security: Student role is rejected from modifying calendar events (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/communication/calendar/events/${testCalendarEventId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Malicious Event Override by Student',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('5.9 Security & Tenant Isolation: Foreign school token cannot edit or delete event (404)', async () => {
      const foreignAdminToken = generateToken({
        userId: 'usr-foreign-admin-01',
        email: 'foreign.admin@other.edu',
        schoolId: '00000000-0000-0000-0000-000000000000',
        role: PlatformRole.SCHOOL_ADMIN,
      });

      const res = await request(app)
        .delete(`/api/v1/communication/calendar/events/${testCalendarEventId}`)
        .set('Authorization', `Bearer ${foreignAdminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('5.10 Teacher deletes their scheduled calendar event', async () => {
      const res = await request(app)
        .delete(`/api/v1/communication/calendar/events/${testCalendarEventId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('5.11 Deleted calendar event no longer appears in event list', async () => {
      const res = await request(app)
        .get('/api/v1/communication/calendar/events')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find((e: any) => e.id === testCalendarEventId);
      expect(found).toBeUndefined();
    });
  });

  // ============================================================================
  // 6. Multi-Role Peer & Cross-Role Meeting Scheduling (Teacher, Principal, Admin)
  // ============================================================================
  describe('6. Multi-Role Peer & Cross-Role Meeting Scheduling', () => {
    it('6.1 Fetch meeting participants directory returns faculty, principals, and admins', async () => {
      const res = await request(app)
        .get('/api/v1/communication/meeting-participants')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.teachers)).toBe(true);
      expect(Array.isArray(res.body.data.principals)).toBe(true);
      expect(Array.isArray(res.body.data.admins)).toBe(true);
    });

    it('6.2 Teacher schedules a 1-on-1 Google Meet with a specific colleague teacher', async () => {
      const res = await request(app)
        .post('/api/v1/communication/meetings/schedule')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Physics & Math Cross-Disciplinary Planning',
          description: 'Joint lesson design for kinematics and calculus',
          meetingType: 'TEACHER_TO_TEACHER',
          targetUserId: adminUserId, // pairing colleague
          scheduledDate: new Date().toISOString(),
          startTime: '15:00',
          endTime: '15:45',
          meetingMode: 'ONLINE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.joiningUrl).toMatch(/^https:\/\/meet\.google\.com\//);
      expect(res.body.data.meetingType).toBe('TEACHER_TO_TEACHER');
      expect(res.body.data.guardianUserId).toBe(adminUserId);
    });

    it('6.3 School Admin schedules a meeting with Principal with Google Meet', async () => {
      const res = await request(app)
        .post('/api/v1/communication/meetings/schedule')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Quarterly Academic Progress & Staffing Review',
          meetingType: 'ADMIN_TO_PRINCIPAL',
          scheduledDate: new Date().toISOString(),
          startTime: '11:00',
          endTime: '12:00',
          meetingMode: 'ONLINE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.joiningUrl).toMatch(/^https:\/\/meet\.google\.com\//);
    });
  });
});
