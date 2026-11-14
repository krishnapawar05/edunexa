import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { communicationService } from './communication.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateConversationSchema,
  SendChatMessageSchema,
  AddGroupParticipantsSchema,
  ReportMessageSchema,
  ModerateReportedMessageSchema,
  UpdateCommunicationPermissionConfigSchema,
  CreateCalendarEventSchema,
  UpdateCalendarEventSchema,
  ConfigureGoogleWorkspaceSchema,
} from '@edunexa/shared';

export class CommunicationController {
  // ============================================================================
  // 1. CONVERSATIONS & CHAT
  // ============================================================================

  async getOrCreateDirectConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const targetUserId = req.body?.targetUserId || req.params?.targetUserId;

      if (!schoolId || !userId || !targetUserId) {
        throw new AppError('Tenant and target user ID required.', 400);
      }

      const conversation = await communicationService.getOrCreateDirectConversation(schoolId, userId, targetUserId);
      res.status(200).json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  }

  async createGroupConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authentication required', 401);

      const parsed = CreateConversationSchema.parse(req.body);
      const group = await communicationService.createGroupConversation(schoolId, userId, parsed);
      res.status(201).json({ success: true, data: group });
    } catch (err) {
      next(err);
    }
  }

  async listUserConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authentication required', 401);

      const query = (req.query?.q as string) || (req.query?.search as string);
      const conversations = await communicationService.listUserConversations(schoolId, userId, query);
      res.status(200).json({ success: true, data: conversations });
    } catch (err) {
      next(err);
    }
  }

  async getConversationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const { id } = req.params;

      const conversation = await communicationService.getConversationDetails(schoolId, id, userId);
      res.status(200).json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  }

  async addGroupParticipants(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const { id } = req.params;

      const parsed = AddGroupParticipantsSchema.parse(req.body);
      const updated = await communicationService.addGroupParticipants(schoolId, id, parsed, userId);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async removeGroupParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const { id, targetUserId } = req.params;

      const result = await communicationService.removeGroupParticipant(schoolId, id, targetUserId, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 2. MESSAGES & RECEIPTS
  // ============================================================================

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Authentication required', 401);

      const parsed = SendChatMessageSchema.parse(req.body);
      const message = await communicationService.sendMessage(schoolId, userId, parsed);
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  async getConversationMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const { id } = req.params;
      const limit = parseInt(req.query?.limit as string, 10) || 50;
      const before = req.query?.before as string;

      const messages = await communicationService.getConversationMessages(schoolId, id, userId, limit, before);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  async markMessageRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const { id, messageId } = req.params;

      const receipt = await communicationService.markMessageRead(id, userId, messageId);
      res.status(200).json({ success: true, data: receipt });
    } catch (err) {
      next(err);
    }
  }

  async searchMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const q = (req.query?.q as string) || '';

      const results = await communicationService.searchMessages(schoolId, userId, q);
      res.status(200).json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 3. REPORTING & MODERATION
  // ============================================================================

  async reportMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;

      const parsed = ReportMessageSchema.parse(req.body);
      const report = await communicationService.reportMessage(schoolId, userId, parsed);
      res.status(201).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async listReportedMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const reports = await communicationService.listReportedMessages(schoolId);
      res.status(200).json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }

  async moderateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const { reportId } = req.params;

      const parsed = ModerateReportedMessageSchema.parse(req.body);
      const result = await communicationService.moderateReport(schoolId, reportId, userId, parsed);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 4. SUPER ADMIN COMMUNICATION MONITORING
  // ============================================================================

  async getSuperAdminMonitoringTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      const telemetry = await communicationService.getSuperAdminMonitoringTelemetry();
      res.status(200).json({ success: true, data: telemetry });
    } catch (err) {
      next(err);
    }
  }

  async listMonitoredConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const { schoolId, role, userId, search } = req.query as any;
      const items = await communicationService.listMonitoredConversations({
        schoolId,
        role,
        userId,
        search,
      });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  async exportConversationRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const { id } = req.params;
      const format = ((req.query?.format as string) || 'CSV').toUpperCase() as 'PDF' | 'CSV';

      const result = await communicationService.exportConversationRecords(schoolId, id, userId, format);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCommunicationAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req.query?.schoolId as string) || req.schoolId;
      const logs = await communicationService.getCommunicationAuditLogs(schoolId);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  async getPermissionConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const config = await communicationService.getOrCreatePermissionConfig(schoolId);
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async updatePermissionConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;

      const parsed = UpdateCommunicationPermissionConfigSchema.parse(req.body);
      const updated = await communicationService.updatePermissionConfig(schoolId, parsed, userId);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 5. GOOGLE WORKSPACE & GOOGLE MEET INTEGRATION
  // ============================================================================

  async getGoogleIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const config = await communicationService.getGoogleIntegration(schoolId);
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async configureGoogleWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;

      const parsed = ConfigureGoogleWorkspaceSchema.parse(req.body);
      const result = await communicationService.configureGoogleWorkspace(schoolId, parsed, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMeetingParticipants(req: Request, res: Response, next: NextFunction) {
    try {
      let schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) {
        const defaultSchool = await prisma.school.findFirst({ select: { id: true } });
        schoolId = defaultSchool?.id || '';
      }
      const currentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const data = await communicationService.getMeetingParticipants(schoolId, currentUserId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async scheduleMeetingWithGoogleMeet(req: Request, res: Response, next: NextFunction) {
    try {
      let schoolId = req.schoolId || (req.user as any)?.schoolId || req.body?.schoolId;
      if (!schoolId) {
        const defaultSchool = await prisma.school.findFirst({ select: { id: true } });
        schoolId = defaultSchool?.id || '';
      }
      const userId = (req.user as any)?.id || (req.user as any)?.userId;

      const meeting = await communicationService.scheduleMeetingWithGoogleMeet(schoolId, userId, req.body);
      res.status(201).json({ success: true, data: meeting });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 6. INTEGRATED ERP CALENDAR
  // ============================================================================

  async createCalendarEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;

      const parsed = CreateCalendarEventSchema.parse(req.body);
      const event = await communicationService.createCalendarEvent(schoolId, userId, parsed);
      res.status(201).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  async listCalendarEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const role = (req.user as any)?.role || 'STUDENT';
      const month = req.query?.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query?.year ? parseInt(req.query.year as string, 10) : undefined;

      const events = await communicationService.listCalendarEvents(schoolId, role, month, year);
      res.status(200).json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  }

  async updateCalendarEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      const eventId = req.params.id;
      if (!schoolId || !eventId) throw new AppError('Missing school context or eventId', 400);

      const parsed = UpdateCalendarEventSchema.parse(req.body);
      const event = await communicationService.updateCalendarEvent(schoolId, userId, userRole, eventId, parsed);
      res.status(200).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  async deleteCalendarEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      const eventId = req.params.id;
      if (!schoolId || !eventId) throw new AppError('Missing school context or eventId', 400);

      const result = await communicationService.deleteCalendarEvent(schoolId, userId, userRole, eventId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateMeetingSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      const meetingId = req.params.id;
      if (!schoolId || !meetingId) throw new AppError('Missing school context or meetingId', 400);

      const updated = await communicationService.updateMeetingSchedule(schoolId, userId, userRole, meetingId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteMeetingSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      const meetingId = req.params.id;
      if (!schoolId || !meetingId) throw new AppError('Missing school context or meetingId', 400);

      const result = await communicationService.deleteMeetingSchedule(schoolId, userId, userRole, meetingId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const communicationController = new CommunicationController();

