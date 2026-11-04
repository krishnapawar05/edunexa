import { Request, Response, NextFunction } from 'express';
import { admissionsService } from './admissions.service.js';
import {
  CreateAdmissionEnquirySchema,
  UpdateAdmissionEnquirySchema,
  SubmitOnlineApplicationSchema,
  TrackApplicationStatusSchema,
  AdmissionReviewDecisionSchema,
  UpdateAdmissionConfigSchema,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class AdmissionsController {
  // ==========================================================================
  // PUBLIC CONTROLLERS
  // ==========================================================================

  async getPublicAdmissionConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const identifierOrHost =
        (req.query.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const config = await admissionsService.getPublicAdmissionConfig(identifierOrHost);
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async submitAdmissionEnquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateAdmissionEnquirySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const identifierOrHost =
        (req.query.school as string) ||
        (req.body.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const result = await admissionsService.submitAdmissionEnquiry(identifierOrHost || '', parsed.data);
      const statusCode = result.message?.includes('already received') ? 200 : 201;
      res.status(statusCode).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async submitOnlineApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SubmitOnlineApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const identifierOrHost =
        (req.query.school as string) ||
        (req.body.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const result = await admissionsService.submitOnlineApplication(identifierOrHost || '', parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async trackApplicationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = TrackApplicationStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const identifierOrHost =
        (req.query.school as string) ||
        (req.body.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const result = await admissionsService.trackApplicationStatus(
        identifierOrHost || '',
        parsed.data.applicationNumber,
        parsed.data.verificationContact
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // SCHOOL ADMIN CONTROLLERS
  // ==========================================================================

  async getAdminAdmissionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const stats = await admissionsService.getAdminAdmissionStats(schoolId);
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async listAdminEnquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await admissionsService.listAdminEnquiries(schoolId, { status, search, page, limit });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateAdminEnquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const parsed = UpdateAdmissionEnquirySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await admissionsService.updateAdminEnquiry(schoolId, req.params.id, parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteAdminEnquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const result = await admissionsService.deleteAdminEnquiry(schoolId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listAdminApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await admissionsService.listAdminApplications(schoolId, { status, search, page, limit });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAdminApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const result = await admissionsService.getAdminApplicationById(schoolId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async reviewApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const parsed = AdmissionReviewDecisionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await admissionsService.reviewApplication(
        schoolId,
        req.params.id,
        parsed.data,
        req.user?.userId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateAdmissionConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        throw new AppError('User not associated with a school tenant.', 403, 'FORBIDDEN');
      }

      const parsed = UpdateAdmissionConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await admissionsService.updateAdmissionConfig(schoolId, parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const admissionsController = new AdmissionsController();
