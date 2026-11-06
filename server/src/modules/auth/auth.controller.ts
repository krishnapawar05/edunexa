import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import {
  ApiSuccessResponse,
  ActivateAccountSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from '@edunexa/shared';
import { accountProvisioningService } from '../core/provisioning.service.js';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

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

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = ForgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(parsed.email, parsed.schoolSlug);
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const details = await authService.verifyPasswordResetToken(token);
      res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = ResetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(parsed.token, parsed.password);
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = ChangePasswordSchema.parse(req.body);
      const result = await authService.changePassword(
        req.user!.userId,
        parsed.currentPassword,
        parsed.newPassword,
        req.user?.email
      );
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
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
      let userContext: any = req.user;
      const dbCheck = await checkDatabaseConnection();
      if (dbCheck.connected && req.user?.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            accountLocked: true,
            mustChangePassword: true,
            passwordResetAt: true,
            passwordChangedAt: true,
          },
        });
        if (dbUser) {
          userContext = {
            ...req.user,
            ...dbUser,
          };
        }
      }

      const response: ApiSuccessResponse<any> = {
        success: true,
        data: {
          user: userContext,
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

  async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mfaToken, otpCode } = req.body;
      const result = await authService.verifyMfaOtp(mfaToken, otpCode);
      res.status(200).json({
        success: true,
        data: result,
        message: 'MFA verification successful. Authentication confirmed.',
      });
    } catch (err) {
      next(err);
    }
  }

  async resendMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mfaToken } = req.body;
      const result = await authService.resendMfaOtp(mfaToken);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { enable, method } = req.body;
      const result = await authService.toggleMfa(req.user!.userId, Boolean(enable), method);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user?.userId);
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
