import { Request, Response, NextFunction } from 'express';
import { idCardsService } from './idcards.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  GenerateIdCardSchema,
  BulkGenerateIdCardsSchema,
  IdCardTemplateSchema,
  UpdateIdCardStatusSchema,
} from '@edunexa/shared';

export class IdCardsController {
  // ==========================================================================
  // DASHBOARD & TELEMETRY
  // ==========================================================================
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const data = await idCardsService.getDashboardStats(schoolId);
      res.status(200).json({ success: true, data: { ...data, stats: data } });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // ROSTER LISTS
  // ==========================================================================
  async listStudentIdCards(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const params = {
        classId: req.query.classId as string | undefined,
        sectionId: req.query.sectionId as string | undefined,
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await idCardsService.listStudentIdCards(schoolId, params);
      res.status(200).json({
        success: true,
        data: { ...result, students: result.items },
        students: result.items,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listEmployeeIdCards(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const params = {
        category: (req.query.category as any) || 'ALL',
        departmentId: req.query.departmentId as string | undefined,
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await idCardsService.listEmployeeIdCards(schoolId, params);
      res.status(200).json({
        success: true,
        data: { ...result, employees: result.items },
        employees: result.items,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // CARD GENERATION & REVOCATION
  // ==========================================================================
  async generateIndividualIdCard(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = GenerateIdCardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await idCardsService.generateIndividualIdCard(
        schoolId,
        parsed.data.holderType,
        parsed.data.profileId,
        parsed.data.templateId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkGenerateIdCards(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = BulkGenerateIdCardsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await idCardsService.bulkGenerateIdCards(schoolId, parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateCardStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      const parsed = UpdateIdCardStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await idCardsService.updateCardStatus(schoolId, id, parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // SELF-SERVICE ID CARD (STUDENT & TEACHER/STAFF)
  // ==========================================================================
  async getSelfServiceCard(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError('Authentication required.', 401);

      const schoolId = req.schoolId || user.schoolId;
      if (!schoolId) throw new AppError('School context required.', 400);

      const result = await idCardsService.getSelfServiceCard(user.userId, schoolId, user.role);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // TEMPLATES
  // ==========================================================================
  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const data = await idCardsService.listTemplates(schoolId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = IdCardTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const data = await idCardsService.createTemplate(schoolId, parsed.data);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      const data = await idCardsService.updateTemplate(schoolId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      await idCardsService.deleteTemplate(schoolId, id);
      res.status(200).json({ success: true, message: 'Template deleted.' });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // PHOTO MANAGEMENT (STUDENT & EMPLOYEE)
  // ==========================================================================

  async uploadStudentPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      const { photoData, fileName, mimeType } = req.body;
      if (!photoData) {
        throw new AppError('Photograph data payload (photoData) is required.', 422);
      }

      const actingUserId = (req.user as any)?.userId || (req.user as any)?.id;
      const result = await idCardsService.updateStudentPhoto(
        schoolId,
        id,
        photoData,
        fileName,
        mimeType,
        actingUserId
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async removeStudentPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      const actingUserId = (req.user as any)?.userId || (req.user as any)?.id;
      const result = await idCardsService.removeStudentPhoto(schoolId, id, actingUserId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async uploadEmployeePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      const { photoData, fileName, mimeType } = req.body;
      if (!photoData) {
        throw new AppError('Photograph data payload (photoData) is required.', 422);
      }

      const actingUserId = (req.user as any)?.userId || (req.user as any)?.id;
      const result = await idCardsService.updateEmployeePhoto(
        schoolId,
        id,
        photoData,
        fileName,
        mimeType,
        actingUserId
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async removeEmployeePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { id } = req.params;
      const actingUserId = (req.user as any)?.userId || (req.user as any)?.id;
      const result = await idCardsService.removeEmployeePhoto(schoolId, id, actingUserId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const idCardsController = new IdCardsController();
