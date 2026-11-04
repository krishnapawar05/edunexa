import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service.js';
import { env } from '../../config/env.js';
import {
  CreateRazorpayOrderSchema,
  VerifyRazorpayPaymentSchema,
  ApiSuccessResponse,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class PaymentsController {
  /**
   * Get Razorpay client configuration (Key ID, Mode, Currency)
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const response: ApiSuccessResponse<{ keyId: string; mode: string; currency: string }> = {
        success: true,
        data: {
          keyId: env.razorpayKeyId,
          mode: env.razorpayMode,
          currency: 'INR',
        },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Razorpay order for an invoice
   */
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateRazorpayOrderSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const order = await paymentsService.createRazorpayOrder(schoolId, userId, userRole, parsed);

      const response: ApiSuccessResponse<typeof order> = {
        success: true,
        data: order,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Razorpay payment signature and settle invoice
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = VerifyRazorpayPaymentSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;

      const result = await paymentsService.verifyRazorpayPayment(schoolId, userId, parsed);

      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Razorpay Webhook listener for asynchronous events
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      if (!signature) {
        throw new AppError('Missing X-Razorpay-Signature header', 400, 'MISSING_SIGNATURE');
      }

      const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
      const result = await paymentsService.handleWebhook(rawBody, signature, req.body);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List payment transactions for tenant or user
   */
  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const invoiceId = req.query.invoiceId as string | undefined;

      const txns = await paymentsService.getPaymentTransactions(schoolId, userId, userRole, invoiceId);

      const response: ApiSuccessResponse<typeof txns> = {
        success: true,
        data: txns,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get official printable receipt details
   */
  async getReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const identifier = req.params.identifier;

      const receipt = await paymentsService.getReceipt(schoolId, identifier, userId, userRole);

      const response: ApiSuccessResponse<typeof receipt> = {
        success: true,
        data: receipt,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();

