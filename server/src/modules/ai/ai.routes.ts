import { Router, Request, Response, NextFunction } from 'express';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { aiController } from './ai.controller.js';
import { chatbotController } from './chatbot.controller.js';
import { PlatformRole } from '@edunexa/shared';

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

// ============================================================================
// SECTION 13: PUBLIC WEBSITE AI CHATBOT & ENQUIRY WORKFLOWS
// ============================================================================

// Public chatbot configuration, branding, and published FAQs
router.get('/chatbot/public-data', asyncHandler(chatbotController.getPublicData));

// Public chatbot intelligent conversation message
router.post('/chatbot/message', asyncHandler(chatbotController.processPublicMessage));

// Public chatbot admission enquiry submission
router.post('/chatbot/enquiry', asyncHandler(chatbotController.submitPublicEnquiry));

// Public chatbot escalation to human admissions counselor
router.post('/chatbot/escalate', asyncHandler(chatbotController.submitPublicEscalation));
router.post('/chatbot/escalation', asyncHandler(chatbotController.submitPublicEscalation));

// ============================================================================
// SECTION 13: ADMIN FAQ & CHATBOT RESPONSE / ESCALATION MANAGEMENT
// ============================================================================

const adminRoles = [PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN];

// FAQ CRUD & Reordering
router.get('/admin/faqs', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.listAdminFAQs));
router.post('/admin/faqs', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.createAdminFAQ));
router.patch('/admin/faqs/:id', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.updateAdminFAQ));
router.put('/admin/faqs/:id', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.updateAdminFAQ));
router.delete('/admin/faqs/:id', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.deleteAdminFAQ));
router.post('/admin/faqs/reorder', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.reorderAdminFAQs));

// Chatbot Configuration & Escalation Management
router.get('/admin/config', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.getAdminConfig));
router.patch('/admin/config', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.updateAdminConfig));
router.put('/admin/config', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.updateAdminConfig));
router.get('/admin/escalations', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.listAdminEscalations));
router.patch('/admin/escalations/:id/status', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.updateAdminEscalationStatus));
router.delete('/admin/escalations/:id', authenticateUser, requireRole(...adminRoles), asyncHandler(chatbotController.deleteAdminEscalation));

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
 * FEATURE 3: Student AI Concept Tutor
 * POST /api/v1/ai/tutor/ask
 * Accessible to Students, Teachers, Parents, and Admins
 */
router.post(
  '/tutor/ask',
  authenticateUser,
  asyncHandler(aiController.askConceptTutor)
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
