import { Router, Request, Response, NextFunction } from 'express';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { aiController } from './ai.controller.js';

const router = Router();

// Wrap async handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Public/General Status Endpoint
 * GET /api/v1/ai/status
 * Returns honest status of AI provider configuration
 */
router.get('/status', asyncHandler(aiController.getStatus));

/**
 * FEATURE 1: School Information Assistant
 * POST /api/v1/ai/assistant/ask
 * Grounded in approved institutional documents
 */
router.post(
  '/assistant/ask',
  authenticateUser,
  asyncHandler(aiController.askSchoolAssistant)
);

/**
 * FEATURE 2: AI-Assisted Quiz Generation
 * POST /api/v1/ai/quiz/generate
 * Accessible only to Teachers and Academic Coordinators
 */
router.post(
  '/quiz/generate',
  authenticateUser,
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'EXAM_COORDINATOR'),
  asyncHandler(aiController.generateQuizDraft)
);

/**
 * Teacher Review & Approval of Draft Questions
 * PATCH /api/v1/ai/quiz/drafts/:draftId/review
 */
router.patch(
  '/quiz/drafts/:draftId/review',
  authenticateUser,
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'EXAM_COORDINATOR'),
  asyncHandler(aiController.reviewQuizDraft)
);

/**
 * Retrieve Quiz Draft
 * GET /api/v1/ai/quiz/drafts/:draftId
 */
router.get(
  '/quiz/drafts/:draftId',
  authenticateUser,
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'EXAM_COORDINATOR'),
  asyncHandler(aiController.getQuizDraft)
);

export default router;
