import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { ApiSuccessResponse } from '@edunexa/shared';

export class AuthController {
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
