import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { ApiSuccessResponse, ActivateAccountSchema } from '@edunexa/shared';
import { accountProvisioningService } from '../core/provisioning.service.js';

export class AuthController {
  async verifyInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const details = await accountProvisioningService.verifyInvitation(token);
      res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  async activateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = ActivateAccountSchema.parse(req.body);
      const result = await accountProvisioningService.activateAccount(parsed.token, parsed.password);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Account activated successfully. You can now log in with your credentials.',
      });
    } catch (err) {
      next(err);
    }
  }
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: ApiSuccessResponse<any> = {
        success: true,
        data: {
          user: req.user,
        },
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async switchContext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { schoolId, role } = req.body;
      const result = await authService.switchContext(req.user!.userId, schoolId, role);

      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: ApiSuccessResponse<{ loggedOut: boolean }> = {
        success: true,
        data: { loggedOut: true },
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
