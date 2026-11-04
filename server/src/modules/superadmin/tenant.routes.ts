import { Router } from 'express';
import { tenantController } from './tenant.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import { PlatformRole, SchoolOnboardingSchema, BulkActionRequestSchema } from '@edunexa/shared';

const router = Router();

// Super Admin Only Guard applied to all routes in this router
router.use(authenticateUser);
router.use(requireRole(PlatformRole.SUPER_ADMIN));

// 1. Platform Telemetry
router.get('/telemetry', (req, res, next) => {
  tenantController.getTelemetry(req, res, next);
});

// 2. School Tenants
router.get('/schools', (req, res, next) => {
  tenantController.listSchools(req, res, next);
});

router.post('/schools', validateRequest({ body: SchoolOnboardingSchema }), (req, res, next) => {
  tenantController.onboardSchool(req, res, next);
});

router.patch('/schools/:id/status', (req, res, next) => {
  tenantController.updateSchoolStatus(req, res, next);
});

router.patch('/schools/:id', (req, res, next) => {
  tenantController.updateSchool(req, res, next);
});

router.post('/schools/bulk-actions', validateRequest({ body: BulkActionRequestSchema }), (req, res, next) => {
  tenantController.bulkSchoolActions(req, res, next);
});

// School Admin Invitation Management
router.get('/schools/:id/invitations', (req, res, next) => {
  tenantController.listSchoolInvitations(req, res, next);
});

router.post('/schools/:id/invitations/send', (req, res, next) => {
  tenantController.sendSchoolAdminInvitation(req, res, next);
});

router.post('/schools/:id/invitations/resend', (req, res, next) => {
  tenantController.resendSchoolAdminInvitation(req, res, next);
});

router.post('/schools/:id/invitations/:invitationId/resend', (req, res, next) => {
  tenantController.resendSchoolAdminInvitation(req, res, next);
});

router.post('/schools/:id/invitations/revoke', (req, res, next) => {
  tenantController.revokeSchoolAdminInvitation(req, res, next);
});

router.post('/schools/:id/invitations/:invitationId/revoke', (req, res, next) => {
  tenantController.revokeSchoolAdminInvitation(req, res, next);
});

// 3. Subscriptions & Plans
router.get('/subscriptions', (req, res, next) => {
  tenantController.listSubscriptions(req, res, next);
});

router.post('/subscriptions/bulk-actions', validateRequest({ body: BulkActionRequestSchema }), (req, res, next) => {
  tenantController.bulkSubscriptionActions(req, res, next);
});

router.patch('/subscriptions/:id', (req, res, next) => {
  tenantController.updateSubscription(req, res, next);
});

// 4. Administrative Audit Logs
router.get('/audit-logs', (req, res, next) => {
  tenantController.getAuditLogs(req, res, next);
});

// 5. Platform Settings
router.get('/settings', (req, res, next) => {
  tenantController.getSettings(req, res, next);
});

router.put('/settings', (req, res, next) => {
  tenantController.updateSettings(req, res, next);
});

// 6. Role Membership Adjustments
router.post('/memberships/role', (req, res, next) => {
  tenantController.assignUserRole(req, res, next);
});

export default router;
