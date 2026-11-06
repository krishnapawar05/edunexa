import { Request, Response, NextFunction } from 'express';
import { governanceService } from './governance.service.js';
import {
  SuperAdminCreateUserSchema,
  SuperAdminUpdateUserSchema,
  UpdateModulePermissionSchema,
  MarksheetPublicationReviewSchema,
  CreateBackupRequestSchema,
  UpdatePlatformSystemConfigSchema,
  ActivityLogQuerySchema,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class GovernanceController {
  // ==========================================================================
  // 1. USER ACCOUNTS MANAGEMENT
  // ==========================================================================

  async listAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        search: req.query.search as string,
        schoolId: req.query.schoolId as string,
        role: req.query.role as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await governanceService.listAllAccounts(params);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SuperAdminCreateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const result = await governanceService.createUserAccount(parsed.data, actingAdminId);
      res.status(201).json({ success: true, message: 'User account provisioned successfully.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SuperAdminUpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const result = await governanceService.updateUserAccount(req.params.id, parsed.data, actingAdminId);
      res.status(200).json({ success: true, message: 'User updated successfully.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const { temporaryPassword, mustChangePassword, reason } = req.body;

      const result = await governanceService.resetUserPassword(
        req.params.id,
        temporaryPassword,
        mustChangePassword ?? true,
        actingAdminId,
        reason
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async unlockAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const result = await governanceService.unlockUserAccount(req.params.id, actingAdminId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateAccountStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const { action, reason } = req.body;
      if (!['ACTIVATE', 'DEACTIVATE', 'SUSPEND'].includes(action)) {
        throw new AppError('Invalid status action. Must be ACTIVATE, DEACTIVATE, or SUSPEND.', 400);
      }

      const result = await governanceService.updateAccountStatus(req.params.id, action, actingAdminId, reason);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 2. RBAC & PERMISSION MATRIX
  // ==========================================================================

  async listPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.query.schoolId as string;
      const role = req.query.role as string;
      const permissions = await governanceService.listRolePermissions(schoolId, role);
      res.status(200).json({ success: true, data: permissions });
    } catch (err) {
      next(err);
    }
  }

  async updatePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = UpdateModulePermissionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const result = await governanceService.updateRolePermission(parsed.data, actingAdminId);
      res.status(200).json({ success: true, message: 'Permission updated successfully.', data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 3. ADMISSION ENQUIRIES CENTRALIZED MONITORING
  // ==========================================================================

  async listAdmissionEnquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        search: req.query.search as string,
        schoolId: req.query.schoolId as string,
        status: req.query.status as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await governanceService.listAllAdmissionEnquiries(params);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 4. MARKSHEET PUBLICATION APPROVAL CONTROLS
  // ==========================================================================

  async listPublicationRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        schoolId: req.query.schoolId as string,
        status: req.query.status as string,
      };

      const result = await governanceService.listPublicationRequests(params);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async reviewPublicationRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = MarksheetPublicationReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const result = await governanceService.reviewPublicationRequest(req.params.id, parsed.data, actingAdminId);
      res.status(200).json({ success: true, message: `Marksheet publication request ${parsed.data.action.toLowerCase()}ed.`, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 5. TEMPLATES OVERSIGHT
  // ==========================================================================

  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.query.schoolId as string;
      const result = await governanceService.listAllTemplates({ schoolId });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 6. ERP ANALYTICS
  // ==========================================================================

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.query.schoolId as string;
      const result = await governanceService.getPlatformErpAnalytics({ schoolId });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 7. BACKUP MANAGEMENT
  // ==========================================================================

  async listBackups(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.query.schoolId as string;
      const result = await governanceService.listBackups(schoolId);
      const safe = result.map((b) => ({ ...b, fileSizeBytes: Number(b.fileSizeBytes) }));
      res.status(200).json({ success: true, data: safe });
    } catch (err) {
      next(err);
    }
  }

  async initiateBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateBackupRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const result = await governanceService.initiateBackup(parsed.data, actingAdminId);
      res.status(201).json({ success: true, message: 'Backup snapshot successfully generated.', data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 8. SYSTEM CONFIGURATION
  // ==========================================================================

  async getSystemConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await governanceService.getPlatformConfig();
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async updateSystemConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = UpdatePlatformSystemConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const actingAdminId = (req.user as any)?.id || (req.user as any)?.userId;
      const updated = await governanceService.updatePlatformConfig(parsed.data, actingAdminId);
      res.status(200).json({ success: true, message: 'Platform system configuration updated.', data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 9. ACTIVITY LOGS & EXPORT
  // ==========================================================================

  async listActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ActivityLogQuerySchema.safeParse({
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      });

      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await governanceService.listActivityLogs(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async exportActivityLogsCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ActivityLogQuerySchema.safeParse(req.query);
      const csv = await governanceService.exportActivityLogsCsv(parsed.data || ({} as any));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="edunexa_activity_logs.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

export const governanceController = new GovernanceController();

