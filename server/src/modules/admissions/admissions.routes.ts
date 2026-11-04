import { Router } from 'express';
import { admissionsController } from './admissions.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC ADMISSION ENDPOINTS (No authentication required)
// ============================================================================
router.get('/config', admissionsController.getPublicAdmissionConfig);
router.get('/public/config', admissionsController.getPublicAdmissionConfig);

router.post('/enquiry', admissionsController.submitAdmissionEnquiry);
router.post('/public/enquiry', admissionsController.submitAdmissionEnquiry);

router.post('/apply', admissionsController.submitOnlineApplication);
router.post('/public/apply', admissionsController.submitOnlineApplication);

router.post('/track', admissionsController.trackApplicationStatus);
router.post('/public/track', admissionsController.trackApplicationStatus);

// ============================================================================
// 2. SCHOOL ADMIN ADMISSION MANAGEMENT (Authenticated School Admin / Principal)
// ============================================================================
router.use(authenticateUser);
router.use(
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.SUPER_ADMIN
  )
);

router.get('/admin/stats', admissionsController.getAdminAdmissionStats);

router.get('/admin/enquiries', admissionsController.listAdminEnquiries);
router.put('/admin/enquiries/:id', admissionsController.updateAdminEnquiry);
router.patch('/admin/enquiries/:id', admissionsController.updateAdminEnquiry);
router.delete('/admin/enquiries/:id', admissionsController.deleteAdminEnquiry);

router.get('/admin/applications', admissionsController.listAdminApplications);
router.get('/admin/applications/:id', admissionsController.getAdminApplicationById);
router.post('/admin/applications/:id/review', admissionsController.reviewApplication);
router.patch('/admin/applications/:id/review', admissionsController.reviewApplication);

router.put('/admin/config', admissionsController.updateAdmissionConfig);

export default router;
