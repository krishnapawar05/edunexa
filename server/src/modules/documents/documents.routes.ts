import { Router } from 'express';
import { documentsController } from './documents.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC ROUTES (No Auth Required)
// ============================================================================
router.get('/public', documentsController.listPublicDocuments);
router.get('/public/:id', documentsController.getPublicDocument);
router.get('/certificates/verify/:qrToken', documentsController.verifyCertificatePublic);
router.post('/access/log', documentsController.recordAccess);

// ============================================================================
// 2. AUTHENTICATED ROUTES
// ============================================================================
router.use(authenticateUser);

// Student & Guardian Academic Documents Hub
router.get(
  '/academic/students/:studentProfileId',
  documentsController.getStudentAcademicDocuments
);

// Admin Document Management (School Admin, Principal, Super Admin)
router.post(
  '/admin/documents',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.createAdminDocument
);

router.get(
  '/admin/documents',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.listAdminDocuments
);

router.patch(
  '/admin/documents/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.updateAdminDocument
);

router.delete(
  '/admin/documents/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.deleteAdminDocument
);

// Certificate Issuance & Management
router.post(
  '/admin/certificates',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.issueCertificate
);

router.get(
  '/admin/certificates',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.listCertificates
);

router.patch(
  '/admin/certificates/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.updateCertificateStatus
);

// Access Logs
router.get(
  '/admin/access-logs',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  documentsController.getAccessLogs
);

export default router;
