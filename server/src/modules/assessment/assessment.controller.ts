import { Request, Response, NextFunction } from 'express';
import { assessmentService } from './assessment.service.js';
import {
  CreateQuestionBankItemSchema,
  UpdateQuestionBankItemSchema,
  CreateQuestionPaperSchema,
  UpdateQuestionPaperSchema,
  SaveAssessmentAnswerSchema,
  SubmitAssessmentAttemptSchema,
  EvaluateAssessmentAttemptSchema,
  PublishAssessmentResultsSchema,
  ApiSuccessResponse,
} from '@edunexa/shared';

export class AssessmentController {
  // ==========================================================================
  // QUESTION BANK
  // ==========================================================================

  async createQuestionBankItem(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateQuestionBankItemSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const createdById = req.user!.userId;

      const result = await assessmentService.createQuestionBankItem(schoolId, createdById, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async listQuestionBankItems(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const filters = {
        subjectId: req.query.subjectId as string,
        classId: req.query.classId as string,
        difficulty: req.query.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
        questionType: req.query.questionType as string,
        chapter: req.query.chapter as string,
        search: req.query.search as string,
      };

      const result = await assessmentService.listQuestionBankItems(schoolId, filters);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getQuestionBankItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;

      const result = await assessmentService.getQuestionBankItem(schoolId, id);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateQuestionBankItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;
      const parsed = UpdateQuestionBankItemSchema.parse(req.body);

      const result = await assessmentService.updateQuestionBankItem(schoolId, id, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async deleteQuestionBankItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;

      const result = await assessmentService.deleteQuestionBankItem(schoolId, id);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // QUESTION PAPERS
  // ==========================================================================

  async createQuestionPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateQuestionPaperSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const createdById = req.user!.userId;

      const result = await assessmentService.createQuestionPaper(schoolId, createdById, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async listQuestionPapers(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const filters = {
        subjectId: req.query.subjectId as string,
        classId: req.query.classId as string,
        status: req.query.status as any,
        examScheduleId: req.query.examScheduleId as string,
        search: req.query.search as string,
      };

      const result = await assessmentService.listQuestionPapers(schoolId, filters);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getQuestionPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;

      const result = await assessmentService.getQuestionPaper(schoolId, id);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateQuestionPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;
      const parsed = UpdateQuestionPaperSchema.parse(req.body);

      const result = await assessmentService.updateQuestionPaper(schoolId, id, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async deleteQuestionPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;

      const result = await assessmentService.deleteQuestionPaper(schoolId, id);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  // Helper to resolve student profile ID
  private resolveStudentProfileId(req: Request): string | undefined {
    return (
      (req as any).studentProfileId ||
      req.user?.studentProfileId ||
      (req.query.studentProfileId as string) ||
      (req.body?.studentProfileId as string) ||
      (req.user?.role === 'STUDENT' ? (req.user?.studentProfileId || req.user.userId) : undefined)
    );
  }

  // ==========================================================================
  // ONLINE EXAM ENGINE
  // ==========================================================================

  async startAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentProfileId = this.resolveStudentProfileId(req);

      if (!studentProfileId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only active students can start online assessment attempts' },
        });
      }

      const { id: questionPaperId } = req.params;
      const result = await assessmentService.startAttempt(schoolId, studentProfileId, questionPaperId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async saveAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentProfileId = this.resolveStudentProfileId(req);

      if (!studentProfileId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Student profile required' },
        });
      }

      const parsed = SaveAssessmentAnswerSchema.parse(req.body);
      const result = await assessmentService.saveAnswer(schoolId, studentProfileId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentProfileId = this.resolveStudentProfileId(req);

      if (!studentProfileId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Student profile required' },
        });
      }

      const parsed = SubmitAssessmentAttemptSchema.parse(req.body);
      const result = await assessmentService.submitAttempt(schoolId, studentProfileId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;
      const role = req.user!.role;
      const studentProfileId = this.resolveStudentProfileId(req);

      const result = await assessmentService.getAttemptDetails(schoolId, id, role, studentProfileId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // EVALUATION & PUBLICATION
  // ==========================================================================

  async evaluateAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const teacherId = req.user!.userId;
      const parsed = EvaluateAssessmentAttemptSchema.parse(req.body);

      const result = await assessmentService.evaluateAttempt(schoolId, teacherId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async publishResults(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;
      const { id: questionPaperId } = req.params;
      const parsed = PublishAssessmentResultsSchema.parse({
        ...req.body,
        questionPaperId,
      });

      const result = await assessmentService.publishResults(schoolId, userId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // RESULTS VISIBILITY
  // ==========================================================================

  async getStudentResults(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentProfileId = this.resolveStudentProfileId(req);

      if (!studentProfileId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Student profile ID is required' },
        });
      }

      const result = await assessmentService.getStudentAssessmentResults(schoolId, studentProfileId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const assessmentController = new AssessmentController();
