import { Request, Response, NextFunction } from 'express';
import { admitCardsService } from './admitcards.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  GenerateAdmitCardSchema,
  BulkGenerateAdmitCardsSchema,
  PublishAdmitCardsSchema,
  UpdateAdmitCardClearanceSchema,
} from '@edunexa/shared';

export class AdmitCardsController {
  // ==========================================================================
  // ADMIN & COORDINATOR ENDPOINTS
  // ==========================================================================

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const stats = await admitCardsService.getDashboardStats(schoolId);
      res.status(200).json({ success: true, data: { ...stats, stats } });
    } catch (err) {
      next(err);
    }
  }

  async listAdmitCards(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const params = {
        examTitle: req.query.examTitle as string | undefined,
        className: req.query.className as string | undefined,
        sectionName: req.query.sectionName as string | undefined,
        status: req.query.status as string | undefined,
        clearanceStatus: req.query.clearanceStatus as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await admitCardsService.listAdmitCards(schoolId, params);
      const pagination = {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      };

      res.status(200).json({
        success: true,
        data: {
          ...result,
          cards: result.items,
          pagination,
        },
        cards: result.items,
        pagination,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async generateIndividual(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = GenerateAdmitCardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await admitCardsService.generateIndividualAdmitCard(schoolId, parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkGenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      if (!req.body?.examTitle) {
        throw new AppError('Examination title is required', 400);
      }

      const parsed = BulkGenerateAdmitCardsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await admitCardsService.bulkGenerateAdmitCards(schoolId, parsed.data);
      res.status(200).json({
        success: true,
        message: `Successfully generated ${result.generatedCount} examination admit cards.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async publishAdmitCards(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authenticated tenant context required.', 400);

      const parsed = PublishAdmitCardsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await admitCardsService.publishAdmitCards(schoolId, userId, parsed.data);
      res.status(200).json({
        success: true,
        message:
          parsed.data.publish
            ? `Published ${result.publishedCount} admit cards successfully.`
            : `Unpublished ${result.unpublishedCount} admit cards.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateClearance(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      const parsed = UpdateAdmitCardClearanceSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await admitCardsService.updateClearance(schoolId, id, parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // STUDENT SELF-SERVICE
  // ==========================================================================

  async getMyAdmitCards(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      if (!user) throw new AppError('Authentication required.', 401);

      const schoolId = req.schoolId || user.schoolId;
      const userId = user.id || user.userId;
      if (!schoolId) throw new AppError('Tenant context required.', 400);

      const result = await admitCardsService.getMyAdmitCards(userId, schoolId);
      res.status(200).json({ success: true, data: result.publishedCards, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PARENT / GUARDIAN SELF-SERVICE
  // ==========================================================================

  async getChildAdmitCards(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      if (!user) throw new AppError('Authentication required.', 401);

      const schoolId = req.schoolId || user.schoolId;
      const userId = user.id || user.userId;
      if (!schoolId) throw new AppError('Tenant context required.', 400);

      const studentProfileId = req.query.studentProfileId as string | undefined;
      const result = await admitCardsService.getChildAdmitCards(userId, schoolId, studentProfileId);
      res.status(200).json({ success: true, data: result.publishedCards, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PUBLIC QR VERIFICATION
  // ==========================================================================

  async verifyPublicToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      if (!token) throw new AppError('Verification token is required.', 400);

      const result = await admitCardsService.verifyAdmitCardToken(token);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const admitCardsController = new AdmitCardsController();
