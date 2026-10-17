import { Router } from 'express';
import { tenantController } from './tenant.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import { PlatformRole, SchoolOnboardingSchema } from '@edunexa/shared';

const router = Router();

// Super Admin Only Guard applied to all routes in this router
router.use(authenticateUser);
router.use(requireRole(PlatformRole.SUPER_ADMIN));

router.get('/schools', (req, res, next) => {
  tenantController.listSchools(req, res, next);
});

router.post('/schools', validateRequest({ body: SchoolOnboardingSchema }), (req, res, next) => {
  tenantController.onboardSchool(req, res, next);
});

router.patch('/schools/:id/status', (req, res, next) => {
  tenantController.updateSchoolStatus(req, res, next);
});

router.post('/memberships/role', (req, res, next) => {
  tenantController.assignUserRole(req, res, next);
});

router.get('/audit-logs', (req, res, next) => {
  tenantController.getAuditLogs(req, res, next);
});

export default router;
