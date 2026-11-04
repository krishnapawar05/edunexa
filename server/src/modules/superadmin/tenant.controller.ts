import { Request, Response, NextFunction } from 'express';
import { tenantService } from './tenant.service.js';
import { ApiSuccessResponse } from '@edunexa/shared';

export class TenantController {
  async getTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const telemetry = await tenantService.getTelemetry();
      const response: ApiSuccessResponse<typeof telemetry> = {
        success: true,
        data: telemetry,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async listSchools(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, status } = req.query;
      const schools = await tenantService.listSchools({
        query: typeof query === 'string' ? query : undefined,
        status: typeof status === 'string' ? status : undefined,
      });
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

  async bulkSchoolActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, action } = req.body;
      const adminUserId = req.user?.userId || 'system-admin';
      const result = await tenantService.bulkSchoolActions(action, ids, adminUserId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkSubscriptionActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, action } = req.body;
      const adminUserId = req.user?.userId || 'system-admin';
      const result = await tenantService.bulkSubscriptionActions(action, ids, adminUserId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user?.userId || 'system-admin';
      const updated = await tenantService.updateSchool(id, req.body, adminUserId);
      const response: ApiSuccessResponse<typeof updated> = {
        success: true,
        data: updated,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async listSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscriptions = await tenantService.listSubscriptions();
      const response: ApiSuccessResponse<typeof subscriptions> = {
        success: true,
        data: subscriptions,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user?.userId || 'system-admin';
      const updated = await tenantService.updateSubscription(id, req.body, adminUserId);
      const response: ApiSuccessResponse<typeof updated> = {
        success: true,
        data: updated,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, schoolId, limit } = req.query;
      const logs = await tenantService.getAuditLogs({
        action: typeof action === 'string' ? action : undefined,
        schoolId: typeof schoolId === 'string' ? schoolId : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      const response: ApiSuccessResponse<typeof logs> = {
        success: true,
        data: logs,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await tenantService.getSettings();
      const response: ApiSuccessResponse<typeof settings> = {
        success: true,
        data: settings,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user?.userId || 'system-admin';
      const updated = await tenantService.updateSettings(req.body, adminUserId);
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

  async listSchoolInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const invitations = await tenantService.listSchoolInvitations(id);
      const response: ApiSuccessResponse<typeof invitations> = {
        success: true,
        data: invitations,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async sendSchoolAdminInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user?.userId || 'system-admin';
      const result = await tenantService.sendSchoolAdminInvitation(id, req.body, adminUserId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async resendSchoolAdminInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, invitationId } = req.params;
      const invId = invitationId || req.body?.invitationId;
      const adminUserId = req.user?.userId || 'system-admin';
      const result = await tenantService.resendSchoolAdminInvitation(id, invId, adminUserId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async revokeSchoolAdminInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, invitationId } = req.params;
      const invId = invitationId || req.body?.invitationId;
      const reason = req.body?.reason;
      const adminUserId = req.user?.userId || 'system-admin';
      const result = await tenantService.revokeSchoolAdminInvitation(id, invId, adminUserId, reason);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async listSuperAdminAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, schoolId, role, status, page, limit } = req.query;
      const result = await tenantService.listAccounts({
        search: search as string,
        schoolId: schoolId as string,
        role: role as string,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetAccountPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { temporaryPassword, mustChangePassword, reason } = req.body;
      const result = await tenantService.resetAccountPassword({
        targetUserId: userId,
        temporaryPassword,
        mustChangePassword,
        actingUserId: req.user?.userId,
        reason,
      });
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async unlockAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const result = await tenantService.unlockAccount({
        targetUserId: userId,
        actingUserId: req.user?.userId,
        reason,
      });
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAccountStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive, reason } = req.body;
      const result = await tenantService.updateAccountStatus({
        targetUserId: userId,
        isActive,
        actingUserId: req.user?.userId,
        reason,
      });
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const tenantController = new TenantController();
