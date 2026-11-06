import { Router } from 'express';
import { communicationController } from './communication.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// All communication endpoints require valid user authentication
router.use(authenticateUser);

// ==============================================================================
// 1. ONE-TO-ONE & GROUP CONVERSATIONS
// ==============================================================================

router.post('/direct', (req, res, next) => communicationController.getOrCreateDirectConversation(req, res, next));
router.post('/groups', (req, res, next) => communicationController.createGroupConversation(req, res, next));
router.get('/conversations', (req, res, next) => communicationController.listUserConversations(req, res, next));
router.get('/conversations/:id', (req, res, next) => communicationController.getConversationDetails(req, res, next));
router.post('/groups/:id/participants', (req, res, next) => communicationController.addGroupParticipants(req, res, next));
router.delete('/groups/:id/participants/:targetUserId', (req, res, next) => communicationController.removeGroupParticipant(req, res, next));

// ==============================================================================
// 2. MESSAGES, RECEIPTS & SEARCH
// ==============================================================================

router.post('/messages', (req, res, next) => communicationController.sendMessage(req, res, next));
router.get('/conversations/:id/messages', (req, res, next) => communicationController.getConversationMessages(req, res, next));
router.post('/conversations/:id/messages/:messageId/read', (req, res, next) => communicationController.markMessageRead(req, res, next));
router.get('/messages/search', (req, res, next) => communicationController.searchMessages(req, res, next));

// ==============================================================================
// 3. REPORTING & MODERATION
// ==============================================================================

router.post('/messages/report', (req, res, next) => communicationController.reportMessage(req, res, next));
router.get(
  '/moderation/reports',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => communicationController.listReportedMessages(req, res, next)
);
router.patch(
  '/moderation/reports/:reportId',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => communicationController.moderateReport(req, res, next)
);

// ==============================================================================
// 4. SUPER ADMIN COMMUNICATION MONITORING & EXPORT
// ==============================================================================

router.get(
  '/superadmin/telemetry',
  requireRole(PlatformRole.SUPER_ADMIN),
  (req, res, next) => communicationController.getSuperAdminMonitoringTelemetry(req, res, next)
);

router.get(
  '/superadmin/conversations',
  requireRole(PlatformRole.SUPER_ADMIN),
  (req, res, next) => communicationController.listMonitoredConversations(req, res, next)
);

router.get(
  '/superadmin/conversations/:id/export',
  requireRole(PlatformRole.SUPER_ADMIN, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  (req, res, next) => communicationController.exportConversationRecords(req, res, next)
);

router.get(
  '/superadmin/audit-logs',
  requireRole(PlatformRole.SUPER_ADMIN, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  (req, res, next) => communicationController.getCommunicationAuditLogs(req, res, next)
);

router.get(
  '/permissions/config',
  requireRole(PlatformRole.SUPER_ADMIN, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  (req, res, next) => communicationController.getPermissionConfig(req, res, next)
);

router.patch(
  '/permissions/config',
  requireRole(PlatformRole.SUPER_ADMIN, PlatformRole.SCHOOL_ADMIN),
  (req, res, next) => communicationController.updatePermissionConfig(req, res, next)
);

// ==============================================================================
// 5. GOOGLE WORKSPACE & GOOGLE MEET
// ==============================================================================

router.get('/google/config', (req, res, next) => communicationController.getGoogleIntegration(req, res, next));
router.post(
  '/google/config',
  requireRole(PlatformRole.SUPER_ADMIN, PlatformRole.SCHOOL_ADMIN),
  (req, res, next) => communicationController.configureGoogleWorkspace(req, res, next)
);

router.post('/meetings/schedule', (req, res, next) => communicationController.scheduleMeetingWithGoogleMeet(req, res, next));

// ==============================================================================
// 6. INTEGRATED ERP CALENDAR
// ==============================================================================

router.get('/calendar/events', (req, res, next) => communicationController.listCalendarEvents(req, res, next));
router.post(
  '/calendar/events',
  requireRole(PlatformRole.SUPER_ADMIN, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.TEACHER),
  (req, res, next) => communicationController.createCalendarEvent(req, res, next)
);

export default router;

