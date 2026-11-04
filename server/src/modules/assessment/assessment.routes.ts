import { Router } from 'express';
import { assessmentController } from './assessment.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// All assessment routes require authentication
router.use(authenticateUser);

const staffRoles = [
  PlatformRole.TEACHER,
  PlatformRole.SCHOOL_ADMIN,
  PlatformRole.PRINCIPAL,
  PlatformRole.EXAM_COORDINATOR,
];

const adminRoles = [
  PlatformRole.SCHOOL_ADMIN,
  PlatformRole.PRINCIPAL,
  PlatformRole.EXAM_COORDINATOR,
];

// ============================================================================
// 1. QUESTION BANK ROUTES
// ============================================================================

router.post(
  '/bank',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.createQuestionBankItem(req, res, next)
);

router.get(
  '/bank',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.listQuestionBankItems(req, res, next)
);

router.get(
  '/bank/:id',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.getQuestionBankItem(req, res, next)
);

router.put(
  '/bank/:id',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.updateQuestionBankItem(req, res, next)
);

router.delete(
  '/bank/:id',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.deleteQuestionBankItem(req, res, next)
);

// ============================================================================
// 2. QUESTION PAPER BUILDER ROUTES
// ============================================================================

router.post(
  '/papers',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.createQuestionPaper(req, res, next)
);

router.get(
  '/papers',
  // Allow all logged-in roles to view published papers (students) or drafts (staff)
  (req, res, next) => assessmentController.listQuestionPapers(req, res, next)
);

router.get(
  '/papers/:id',
  (req, res, next) => assessmentController.getQuestionPaper(req, res, next)
);

router.put(
  '/papers/:id',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.updateQuestionPaper(req, res, next)
);

router.delete(
  '/papers/:id',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.deleteQuestionPaper(req, res, next)
);

// ============================================================================
// 3. ONLINE ASSESSMENT & ATTEMPT ENGINE (STUDENT + REVIEW)
// ============================================================================

router.post(
  '/papers/:id/attempts/start',
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => assessmentController.startAttempt(req, res, next)
);

router.post(
  '/attempts/answer',
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => assessmentController.saveAnswer(req, res, next)
);

router.post(
  '/attempts/submit',
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => assessmentController.submitAttempt(req, res, next)
);

router.get(
  '/attempts/:id',
  (req, res, next) => assessmentController.getAttempt(req, res, next)
);

// ============================================================================
// 4. MANUAL EVALUATION & RESULT PUBLICATION
// ============================================================================

router.post(
  '/attempts/evaluate',
  requireRole(...staffRoles),
  (req, res, next) => assessmentController.evaluateAttempt(req, res, next)
);

router.post(
  '/papers/:id/publish-results',
  requireRole(...adminRoles),
  (req, res, next) => assessmentController.publishResults(req, res, next)
);

// ============================================================================
// 5. RESULTS REPORTING (STUDENTS & PARENTS)
// ============================================================================

router.get(
  '/results/student',
  (req, res, next) => assessmentController.getStudentResults(req, res, next)
);

export default router;
