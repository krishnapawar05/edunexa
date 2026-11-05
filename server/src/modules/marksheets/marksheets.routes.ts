import { Router } from 'express';
import { marksheetsController } from './marksheets.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC VERIFICATION
// ============================================================================
router.get('/verify/:token', (req, res, next) => {
  marksheetsController.verifyPublicToken(req, res, next);
});

router.get('/public/verify/:token', (req, res, next) => {
  marksheetsController.verifyPublicToken(req, res, next);
});

// ============================================================================
// 2. SELF-SERVICE PORTALS (AUTHENTICATED)
// ============================================================================

// Student Self-Service: strictly published marksheets of the authenticated student
router.get(
  '/my-marksheets',
  authenticateUser,
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => {
    marksheetsController.getMyMarksheets(req, res, next);
  }
);

// Parent / Guardian Self-Service: strictly published marksheets of linked children
router.get(
  '/child-marksheets',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => {
    marksheetsController.getChildMarksheets(req, res, next);
  }
);

// ============================================================================
// 3. ADMINISTRATIVE & EXAMINATION COORDINATOR SUITE
// ============================================================================

const adminRoles = [
  PlatformRole.SCHOOL_ADMIN,
  PlatformRole.PRINCIPAL,
  PlatformRole.EXAM_COORDINATOR,
  PlatformRole.SUPER_ADMIN,
];

const teacherRoles = [
  ...adminRoles,
  PlatformRole.TEACHER,
];

// Telemetry & Stats
router.get(
  '/admin/stats',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.getDashboardStats(req, res, next);
  }
);

// Templates
router.get(
  '/admin/templates',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.getTemplates(req, res, next);
  }
);

router.post(
  '/admin/templates',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.createTemplate(req, res, next);
  }
);

router.put(
  '/admin/templates/:templateId',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.updateTemplate(req, res, next);
  }
);

router.delete(
  '/admin/templates/:templateId',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.deleteTemplate(req, res, next);
  }
);

// Grading Criteria
router.get(
  '/admin/grading',
  authenticateUser,
  requireRole(...teacherRoles),
  (req, res, next) => {
    marksheetsController.getGradingCriteria(req, res, next);
  }
);

router.put(
  '/admin/grading',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.updateGradingCriteria(req, res, next);
  }
);

// List Marksheets
router.get(
  '/admin/marksheets',
  authenticateUser,
  requireRole(...teacherRoles),
  (req, res, next) => {
    marksheetsController.listMarksheets(req, res, next);
  }
);

router.get(
  '/admin/list',
  authenticateUser,
  requireRole(...teacherRoles),
  (req, res, next) => {
    marksheetsController.listMarksheets(req, res, next);
  }
);

router.get(
  '/admin/marksheets/:marksheetId',
  authenticateUser,
  requireRole(...teacherRoles),
  (req, res, next) => {
    marksheetsController.getMarksheetById(req, res, next);
  }
);

// Generation
router.post(
  '/admin/generate',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.generateIndividual(req, res, next);
  }
);

router.post(
  '/admin/generate-individual',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.generateIndividual(req, res, next);
  }
);

router.post(
  '/admin/bulk-generate',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.bulkGenerate(req, res, next);
  }
);

// Publication
router.post(
  '/admin/publish',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.publishMarksheets(req, res, next);
  }
);

// Correction & Audits
router.post(
  '/admin/correct',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.correctMarksheet(req, res, next);
  }
);

router.get(
  '/admin/audits',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    marksheetsController.getCorrectionAudits(req, res, next);
  }
);

export default router;
