import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { chatbotService } from './chatbot.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  ChatbotMessageSchema,
  ChatbotEnquirySchema,
  ChatbotEscalationSchema,
  CreateChatbotFAQSchema,
  UpdateChatbotFAQSchema,
  UpdateChatbotConfigSchema,
  UpdateEscalationStatusSchema,
} from '@edunexa/shared';

async function resolveSchoolId(req: Request): Promise<string> {
  let schoolId = req.schoolId || (req.user as any)?.schoolId || (req.query?.schoolId as string) || (req.headers['x-school-id'] as string);
  if (!schoolId) {
    const defaultSchool = await prisma.school.findFirst({ select: { id: true } });
    schoolId = defaultSchool?.id || '';
  }
  return schoolId;
}

export class ChatbotController {
  // ==========================================================================
  // PUBLIC CHATBOT ENDPOINTS
  // ==========================================================================

  async getPublicData(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier =
        (req.query.schoolIdentifier as string) ||
        (req.headers['x-school-id'] as string) ||
        (req.headers['x-tenant-id'] as string);

      const data = await chatbotService.getPublicChatbotData(schoolIdentifier);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async processPublicMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const rawText = String(req.body?.message !== undefined ? req.body.message : (req.body?.question || '')).trim();
      if (!rawText) {
        throw new AppError('Message cannot be empty', 422);
      }

      const rawHistory = Array.isArray(req.body?.history)
        ? req.body.history
        : Array.isArray(req.body?.conversationHistory)
        ? req.body.conversationHistory
        : [];

      const sanitizedHistory = rawHistory
        .filter((h: any) => h && typeof h === 'object')
        .map((h: any) => {
          const rawSender = String(h?.sender || h?.role || 'user').toLowerCase();
          const sender: 'user' | 'bot' = rawSender === 'bot' || rawSender === 'assistant' ? 'bot' : 'user';
          const text = String(h?.text || h?.content || h?.message || '').trim();
          return { sender, text };
        })
        .filter((h: any) => h.text.length > 0 && !h.text.toLowerCase().includes('validation failed'));

      const normalizedBody = {
        message: rawText,
        question: rawText,
        history: sanitizedHistory,
        conversationHistory: sanitizedHistory,
        schoolIdentifier: req.body?.schoolIdentifier,
        visitorSessionId: req.body?.visitorSessionId,
      };

      const parsed = ChatbotMessageSchema.safeParse(normalizedBody);
      const messageData = parsed.success
        ? parsed.data
        : {
            message: rawText,
            question: rawText,
            history: sanitizedHistory,
            schoolIdentifier: req.body?.schoolIdentifier,
          };

      const schoolIdentifier =
        messageData.schoolIdentifier ||
        (req.query.schoolIdentifier as string) ||
        (req.headers['x-school-id'] as string) ||
        (req.headers['x-tenant-id'] as string);

      const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const result = await chatbotService.askPublicChatbot(
        schoolIdentifier,
        {
          ...messageData,
          message: rawText,
          history: sanitizedHistory,
        },
        clientIp
      );

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async submitPublicEnquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ChatbotEnquirySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await chatbotService.submitChatbotAdmissionEnquiry(parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async submitPublicEscalation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ChatbotEscalationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const result = await chatbotService.submitChatbotEscalation(parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // ADMIN FAQ CONTROLLER
  // ==========================================================================

  async listAdminFAQs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const params = {
        category: req.query.category as string,
        search: req.query.search as string,
        isPublished: req.query.isPublished !== undefined ? req.query.isPublished === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await chatbotService.listAdminFAQs(schoolId, params);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createAdminFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = CreateChatbotFAQSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const item = await chatbotService.createAdminFAQ(schoolId, parsed.data);
      res.status(201).json({ success: true, message: 'FAQ created successfully.', data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateAdminFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = UpdateChatbotFAQSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const item = await chatbotService.updateAdminFAQ(schoolId, req.params.id, parsed.data);
      res.status(200).json({ success: true, message: 'FAQ updated successfully.', data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteAdminFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const result = await chatbotService.deleteAdminFAQ(schoolId, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async reorderAdminFAQs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { faqIds } = req.body;
      if (!Array.isArray(faqIds)) {
        throw new AppError('faqIds array is required.', 400);
      }

      const result = await chatbotService.reorderAdminFAQs(schoolId, faqIds);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // ADMIN CONFIG & ESCALATION CONTROLLER
  // ==========================================================================

  async getAdminConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const config = await chatbotService.getAdminConfig(schoolId);
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async updateAdminConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = UpdateChatbotConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const updated = await chatbotService.updateAdminConfig(schoolId, parsed.data);
      res.status(200).json({ success: true, message: 'Chatbot configuration updated successfully.', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async listAdminEscalations(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const params = {
        status: req.query.status as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await chatbotService.listAdminEscalations(schoolId, params);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateAdminEscalationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = UpdateEscalationStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const item = await chatbotService.updateAdminEscalationStatus(schoolId, req.params.id, parsed.data);
      res.status(200).json({ success: true, message: 'Escalation status updated.', data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteAdminEscalation(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = await resolveSchoolId(req);
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const result = await chatbotService.deleteAdminEscalation(schoolId, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const chatbotController = new ChatbotController();

