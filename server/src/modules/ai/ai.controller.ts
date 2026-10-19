import { Request, Response } from 'express';
import {
  SchoolInfoQuerySchema,
  GenerateQuizDraftSchema,
  ReviewAiQuizDraftSchema,
  ApiSuccessResponse,
} from '@edunexa/shared';
import { aiService } from './ai.service.js';

export class AiController {
  /**
   * GET /api/v1/ai/status
   * Honest configuration check for AI providers
   */
  public async getStatus(req: Request, res: Response): Promise<void> {
    const status = aiService.getStatus();
    const response: ApiSuccessResponse<typeof status> = {
      success: true,
      data: status,
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  }

  /**
   * POST /api/v1/ai/assistant/ask
   * FEATURE 1: School Information Assistant (grounded in approved institutional documents)
   */
  public async askSchoolAssistant(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    const validated = SchoolInfoQuerySchema.parse(req.body);

    const schoolId = user?.schoolId || 'school-apex-01';
    const userId = user?.id || 'anonymous-user';

    const result = await aiService.askSchoolAssistant(userId, schoolId, validated);

    const response: ApiSuccessResponse<typeof result> = {
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  }

  /**
   * POST /api/v1/ai/quiz/generate
   * FEATURE 2: AI-Assisted Quiz Generation from study materials
   */
  public async generateQuizDraft(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    const validated = GenerateQuizDraftSchema.parse(req.body);

    const schoolId = user.schoolId;
    const teacherId = user.id;

    const draft = await aiService.generateQuizDraft(teacherId, schoolId, validated);

    const response: ApiSuccessResponse<typeof draft> = {
      success: true,
      data: draft,
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(201).json(response);
  }

  /**
   * PATCH /api/v1/ai/quiz/drafts/:draftId/review
   * Teacher Review & Approval of draft questions
   */
  public async reviewQuizDraft(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    const draftId = req.params.draftId;
    const validated = ReviewAiQuizDraftSchema.parse(req.body);

    const schoolId = user.schoolId;
    const teacherId = user.id;

    const updatedDraft = aiService.reviewQuizDraft(teacherId, schoolId, draftId, validated);

    const response: ApiSuccessResponse<typeof updatedDraft> = {
      success: true,
      data: updatedDraft,
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  }

  /**
   * GET /api/v1/ai/quiz/drafts/:draftId
   * Retrieve a quiz draft
   */
  public async getQuizDraft(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    const draftId = req.params.draftId;
    const schoolId = user.schoolId;

    const draft = aiService.getQuizDraft(schoolId, draftId);

    const response: ApiSuccessResponse<typeof draft> = {
      success: true,
      data: draft,
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  }
}

export const aiController = new AiController();
