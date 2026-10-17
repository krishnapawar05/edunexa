import { Request, Response, NextFunction } from 'express';
import { tenantService } from './tenant.service.js';
import { ApiSuccessResponse } from '@edunexa/shared';

export class TenantController {
  async listSchools(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schools = await tenantService.listSchools();
      const response: ApiSuccessResponse<typeof schools> = {
        success: true,
        data: schools,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async onboardSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user?.userId || 'system-admin';
      const created = await tenantService.onboardSchool(req.body, adminUserId);
      const response: ApiSuccessResponse<typeof created> = {
        success: true,
        data: created,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateSchoolStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminUserId = req.user?.userId || 'system-admin';
      const updated = await tenantService.updateSchoolStatus(id, status, adminUserId);
      const response: ApiSuccessResponse<typeof updated> = {
        success: true,
        data: updated,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async assignUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetUserId, schoolId, newRole } = req.body;
      const performedByUserId = req.user?.userId || 'system-admin';
      const result = await tenantService.assignUserRole(targetUserId, schoolId, newRole, performedByUserId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = tenantService.getAuditLogs();
      const response: ApiSuccessResponse<typeof logs> = {
        success: true,
        data: logs,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const tenantController = new TenantController();
