import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';
import { notificationsService } from './notifications.service.js';

describe('SECTION 15: NOTIFICATION & ALERT MANAGEMENT TEST SUITE', () => {
  let schoolAdminToken: string;
  let studentToken: string;
  let parentToken: string;
  let targetSchoolId: string;
  let studentUserId: string;
  let sampleNotificationId: string;
  let sampleTemplateId: string;
  let sampleDeliveryLogId: string;

  beforeAll(async () => {
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    const school = (await prisma.school.findFirst({
      where: { slug: 'apex-academy' },
    })) || (await prisma.school.findFirst());

    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    // Resolve or create student user
    let studentUser = await prisma.user.findFirst({
      where: { email: { contains: 'aarav' } },
    });
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          email: `student.notif.${Date.now()}@apexacademy.edu`,
          firstName: 'Aarav',
          lastName: 'Sharma',
          passwordHash: '$2b$10$hashedtestpassword',
        },
      });
      await prisma.userMembership.create({
        data: {
          userId: studentUser.id,
          schoolId: targetSchoolId,
          role: 'STUDENT',
          isPrimary: true,
        },
      });
    }
    studentUserId = studentUser.id;

    schoolAdminToken = generateAccessToken({
      userId: 'usr-schooladmin-notif',
      email: 'admin@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    studentToken = generateAccessToken({
      userId: studentUserId,
      email: studentUser.email,
      schoolId: targetSchoolId,
      role: PlatformRole.STUDENT,
    });

    parentToken = generateAccessToken({
      userId: 'usr-parent-notif',
      email: 'parent.notif@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.PARENT,
    });
  });

  // ============================================================================
  // 1. IN-APP USER NOTIFICATIONS WORKFLOW
  // ============================================================================

  it('1. Centralized service dispatches in-app notification to student', async () => {
    const res = await notificationsService.dispatchNotification(targetSchoolId, 'HOMEWORK_ASSIGNED', {
      recipientUserIds: [studentUserId],
      title: 'Mathematics Assignment: Quadratic Equations',
      priority: 'HIGH',
      link: '/student/homework',
      variables: {
        studentName: 'Aarav Sharma',
        className: 'Grade 9 - Section A',
        message: 'Complete exercise 4.2 by Friday 5 PM.',
      },
    });

    expect(res).toBeDefined();
    expect(res!.success).toBe(true);

    // Verify persisted in PostgreSQL
    const notif = await prisma.notification.findFirst({
      where: { schoolId: targetSchoolId, userId: studentUserId },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).toBeDefined();
    expect(notif!.isRead).toBe(false);
    sampleNotificationId = notif!.id;
  });

  it('2. GET /api/v1/notifications lists user-specific in-app notifications', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('3. GET /api/v1/notifications/unread-count returns accurate count for the notification bell', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('4. PATCH /api/v1/notifications/:id/read marks notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${sampleNotificationId}/read`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
  });

  it('5. PATCH /api/v1/notifications/read-all marks all unread notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify unread count is now 0
    const countCheck = await notificationsService.getUnreadCount(targetSchoolId, studentUserId);
    expect(countCheck.unreadCount).toBe(0);
  });

  it('6. DELETE /api/v1/notifications/:id dismisses notification permanently', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifications/${sampleNotificationId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ============================================================================
  // 2. BACKEND EVENT TRIGGERS & MULTI-CHANNEL DISPATCHING
  // ============================================================================

  it('7. Dispatches ADMISSION_STATUS_UPDATED across IN_APP, EMAIL, SMS, and WHATSAPP', async () => {
    const res = await notificationsService.dispatchNotification(targetSchoolId, 'ADMISSION_STATUS_UPDATED', {
      recipientUserIds: [studentUserId],
      recipientEmails: ['guardian.sharma@example.com'],
      recipientPhones: ['+91 98450 00000'],
      priority: 'HIGH',
      variables: {
        studentName: 'Aarav Sharma',
        parentName: 'Rajesh Sharma',
        admissionNumber: 'APP-2026-0981',
        applicationStatus: 'APPROVED',
        message: 'Congratulations! Your admission application for Grade 9 has been approved.',
      },
    });

    expect(res).toBeDefined();
    expect(res!.success).toBe(true);

    // Verify delivery logs created for channels
    const logs = await prisma.notificationDeliveryLog.findMany({
      where: { schoolId: targetSchoolId, eventKey: 'ADMISSION_STATUS_UPDATED' },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    sampleDeliveryLogId = logs[0].id;
  });

  it('8. Dispatches FEE_PAYMENT_SUCCESS with financial placeholders', async () => {
    const res = await notificationsService.dispatchNotification(targetSchoolId, 'FEE_PAYMENT_SUCCESS', {
      recipientUserIds: [studentUserId],
      priority: 'HIGH',
      variables: {
        studentName: 'Aarav Sharma',
        parentName: 'Rajesh Sharma',
        feeAmount: '38,500',
        paymentDate: '2026-11-05',
        message: 'Payment of ₹38,500 received via Online Gateway. Receipt REC-2026-8842 issued.',
      },
    });

    expect(res!.success).toBe(true);

    const log = await prisma.notificationDeliveryLog.findFirst({
      where: { schoolId: targetSchoolId, eventKey: 'FEE_PAYMENT_SUCCESS' },
      orderBy: { createdAt: 'desc' },
    });
    expect(log).toBeDefined();
    expect(log!.content).toContain('38,500');
  });

  it('9. Dispatches ATTENDANCE_ABSENT_ALERT to parent', async () => {
    const res = await notificationsService.dispatchNotification(targetSchoolId, 'ATTENDANCE_ABSENT_ALERT', {
      recipientUserIds: [studentUserId],
      priority: 'URGENT',
      variables: {
        studentName: 'Aarav Sharma',
        className: 'Grade 9 - A',
        message: 'Student was marked Absent during morning attendance roll call.',
      },
    });

    expect(res!.success).toBe(true);
  });

  // ============================================================================
  // 3. ADMIN EVENT CONFIGURATION & RBAC
  // ============================================================================

  it('10. GET /api/v1/notifications/admin/events lists configurable ERP events', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/admin/events')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(12);

    const feeEvent = res.body.data.find((e: any) => e.eventKey === 'FEE_PAYMENT_REMINDER');
    expect(feeEvent).toBeDefined();
    expect(feeEvent.isEnabled).toBe(true);
  });

  it('11. PUT /api/v1/notifications/admin/events/:eventKey updates enabled status and channels', async () => {
    const res = await request(app)
      .put('/api/v1/notifications/admin/events/FEE_PAYMENT_REMINDER')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        isEnabled: true,
        channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
        recipientRoles: ['PARENT', 'ACCOUNTS'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.channels).toContain('WHATSAPP');
  });

  // ============================================================================
  // 4. ADMIN NOTIFICATION TEMPLATES MANAGEMENT & PREVIEW
  // ============================================================================

  it('12. POST /api/v1/notifications/admin/templates creates a custom message template', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/admin/templates')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        eventKey: 'MEETING_SCHEDULED',
        channel: 'WHATSAPP',
        name: 'Parent Teacher Conference Reminder (WhatsApp)',
        body: 'Greetings from {{schoolName}}! A conference with {{teacherName}} is scheduled for {{studentName}} on {{meetingDate}} at {{meetingTime}}.',
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    sampleTemplateId = res.body.data.id;
  });

  it('13. POST /api/v1/notifications/admin/templates/preview renders dynamic placeholders safely', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/admin/templates/preview')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        eventKey: 'MEETING_SCHEDULED',
        subject: '[{{schoolName}}] Meeting Scheduled with {{teacherName}}',
        body: 'Dear {{parentName}}, your meeting for {{studentName}} in {{className}} is on {{meetingDate}} at {{meetingTime}}.',
        sampleOverrides: {
          studentName: 'Kabir Varma',
          parentName: 'Sunil Varma',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.renderedBody).toContain('Sunil Varma');
    expect(res.body.data.renderedBody).toContain('Kabir Varma');
    expect(res.body.data.renderedSubject).toContain('Apex Academy');
  });

  it('14. DELETE /api/v1/notifications/admin/templates/:id removes custom template', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifications/admin/templates/${sampleTemplateId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ============================================================================
  // 5. PROVIDER GATEWAY CONFIG & DELIVERY AUDIT LOGS
  // ============================================================================

  it('15. GET /api/v1/notifications/admin/providers retrieves gateway configuration', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/admin/providers')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.emailSenderName).toBeDefined();
    expect(res.body.data.smsProvider).toBeDefined();
  });

  it('16. PUT /api/v1/notifications/admin/providers updates sender credentials securely', async () => {
    const res = await request(app)
      .put('/api/v1/notifications/admin/providers')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        emailSenderName: 'Apex Academy Official Bureau',
        smsSenderId: 'APEXAC',
        whatsAppProvider: 'META_CLOUD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.emailSenderName).toBe('Apex Academy Official Bureau');
  });

  it('17. GET /api/v1/notifications/admin/logs lists delivery audit logs and allows retry', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/admin/logs')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Test retry
    const retryRes = await request(app)
      .post(`/api/v1/notifications/admin/logs/${sampleDeliveryLogId}/retry`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.success).toBe(true);
    expect(retryRes.body.data.retryCount).toBeGreaterThanOrEqual(1);
  });
});

