import { Request, Response, NextFunction } from 'express';
import { marksheetsService } from './marksheets.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateMarksheetTemplateSchema,
  UpdateMarksheetTemplateSchema,
  GenerateIndividualMarksheetSchema,
  BulkGenerateMarksheetsSchema,
  PublishMarksheetsSchema,
  CorrectMarksheetSchema,
  UpdateGradingCriteriaSchema,
} from '@edunexa/shared';

export class MarksheetsController {
  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const templates = await marksheetsService.getTemplates(schoolId);
      res.status(200).json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = CreateMarksheetTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const template = await marksheetsService.createTemplate(schoolId, parsed.data);
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = UpdateMarksheetTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const template = await marksheetsService.updateTemplate(schoolId, req.params.templateId, parsed.data);
      res.status(200).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const result = await marksheetsService.deleteTemplate(schoolId, req.params.templateId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // GRADING CRITERIA
  // ==========================================================================

  async getGradingCriteria(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const criteria = await marksheetsService.getGradingCriteria(schoolId);
      res.status(200).json({ success: true, data: criteria });
    } catch (err) {
      next(err);
    }
  }

  async updateGradingCriteria(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authenticated tenant context required.', 400);

      const parsed = UpdateGradingCriteriaSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await marksheetsService.updateGradingCriteria(schoolId, userId, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // MARKSHEET GENERATION
  // ==========================================================================

  async generateIndividual(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = GenerateIndividualMarksheetSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await marksheetsService.generateIndividualMarksheet(schoolId, parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkGenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = BulkGenerateMarksheetsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await marksheetsService.bulkGenerateMarksheets(schoolId, parsed.data);
      res.status(200).json({
        success: true,
        message: `Successfully generated ${result.generatedCount} student marksheets.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PUBLICATION & WITHHOLDING
  // ==========================================================================

  async publishMarksheets(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authenticated tenant context required.', 400);

      const parsed = PublishMarksheetsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await marksheetsService.publishMarksheets(schoolId, userId, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // CORRECTION & AUDIT TRAIL
  // ==========================================================================

  async correctMarksheet(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authenticated tenant context required.', 400);

      const parsed = CorrectMarksheetSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await marksheetsService.correctMarksheet(schoolId, userId, parsed.data);
      res.status(200).json({
        success: true,
        message: `Marksheet updated to Version ${result.marksheet.version} with audit trail.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCorrectionAudits(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const marksheetId = req.query.marksheetId as string | undefined;
      const audits = await marksheetsService.getCorrectionAudits(schoolId, marksheetId);
      res.status(200).json({ success: true, data: audits });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // LIST & GET
  // ==========================================================================

  async listMarksheets(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const params = {
        examTitle: req.query.examTitle as string | undefined,
        className: req.query.className as string | undefined,
        sectionName: req.query.sectionName as string | undefined,
        status: req.query.status as string | undefined,
        academicSessionId: req.query.academicSessionId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await marksheetsService.listMarksheets(schoolId, params);
      res.status(200).json({
        success: true,
        data: result,
        items: result.items,
        marksheets: result.marksheets,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getMarksheetById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const marksheet = await marksheetsService.getMarksheetById(schoolId, req.params.marksheetId);
      res.status(200).json({ success: true, data: marksheet });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const stats = await marksheetsService.getDashboardStats(schoolId);
      res.status(200).json({ success: true, data: stats, stats });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PUBLIC DIGITAL VERIFICATION
  // ==========================================================================

  async verifyPublicToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token;
      if (!token) throw new AppError('Verification token is required.', 400);

      const result = await marksheetsService.verifyPublicToken(token);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // SELF-SERVICE (STUDENT & PARENT)
  // ==========================================================================

  async getMyMarksheets(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authenticated student context required.', 400);

      const list = await marksheetsService.getMyMarksheets(schoolId, userId);
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  async getChildMarksheets(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !parentUserId) throw new AppError('Authenticated parent context required.', 400);

      const targetStudentProfileId = req.query.studentProfileId as string | undefined;
      const list = await marksheetsService.getChildMarksheets(schoolId, parentUserId, targetStudentProfileId);
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }
}

export const marksheetsController = new MarksheetsController();
