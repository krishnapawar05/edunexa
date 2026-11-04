import { Router } from 'express';
import { admitCardsController } from './admitcards.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC VERIFICATION
// ============================================================================
router.get('/verify/:token', (req, res, next) => {
  admitCardsController.verifyPublicToken(req, res, next);
});

router.get('/public/verify/:token', (req, res, next) => {
  admitCardsController.verifyPublicToken(req, res, next);
});

// ============================================================================
// 2. SELF-SERVICE PORTALS (AUTHENTICATED)
// ============================================================================

// Student Self-Service: strictly published admit cards
router.get(
  '/my-cards',
  authenticateUser,
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => {
    admitCardsController.getMyAdmitCards(req, res, next);
  }
);

// Parent / Guardian Self-Service: strictly published admit cards of linked children
router.get(
  '/child-cards',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => {
    admitCardsController.getChildAdmitCards(req, res, next);
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

// Telemetry & Stats
router.get(
  '/admin/stats',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.getDashboardStats(req, res, next);
  }
);

// List Admit Cards (with Class, Section, Clearance, and Status filters)
router.get(
  '/admin/cards',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.listAdmitCards(req, res, next);
  }
);

router.get(
  '/admin/list',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.listAdmitCards(req, res, next);
  }
);

// Individual Generation
router.post(
  '/admin/generate',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.generateIndividual(req, res, next);
  }
);

router.post(
  '/admin/generate-individual',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.generateIndividual(req, res, next);
  }
);

// Bulk Generation
router.post(
  '/admin/bulk-generate',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.bulkGenerate(req, res, next);
  }
);

// Publish / Unpublish Workflow
router.post(
  '/admin/publish',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.publishAdmitCards(req, res, next);
  }
);

// Clearance Status Update
router.patch(
  '/admin/cards/:id/clearance',
  authenticateUser,
  requireRole(...adminRoles),
  (req, res, next) => {
    admitCardsController.updateClearance(req, res, next);
  }
);

export default router;
