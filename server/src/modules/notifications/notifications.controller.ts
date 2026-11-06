import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import {
  UpdateNotificationEventConfigSchema,
  CreateNotificationTemplateSchema,
  UpdateNotificationTemplateSchema,
  PreviewNotificationTemplateSchema,
  UpdateNotificationProviderConfigSchema,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class NotificationsController {
  // ============================================================================
  // USER NOTIFICATIONS
  // ============================================================================

  async listUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      const schoolId = user.schoolId || (req.headers['x-school-slug'] as string);

      const result = await notificationsService.listUserNotifications(
        schoolId,
        user.userId,
        {
          unreadOnly: req.query.unreadOnly === 'true',
          category: req.query.category as string,
          search: req.query.search as string,
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 20,
        }
      );

      res.json({
        success: true,
        data: result.items,
        unreadCount: result.unreadCount,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      const schoolId = user.schoolId || (req.headers['x-school-slug'] as string);

      const result = await notificationsService.getUnreadCount(schoolId, user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      const schoolId = user.schoolId || (req.headers['x-school-slug'] as string);
      const { id } = req.params;

      const result = await notificationsService.markAsRead(schoolId, user.userId, id);
      res.json({ success: true, message: 'Notification marked as read.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      const schoolId = user.schoolId || (req.headers['x-school-slug'] as string);

      const result = await notificationsService.markAllAsRead(schoolId, user.userId);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async dismissNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      const schoolId = user.schoolId || (req.headers['x-school-slug'] as string);
      const { id } = req.params;

      const result = await notificationsService.dismissNotification(schoolId, user.userId, id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN EVENT CONFIGURATION
  // ============================================================================

  async listEventConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');

      const configs = await notificationsService.listEventConfigs(schoolId);
      res.json({ success: true, data: configs });
    } catch (err) {
      next(err);
    }
  }

  async updateEventConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { eventKey } = req.params;

      const parsed = UpdateNotificationEventConfigSchema.parse(req.body);
      const updated = await notificationsService.updateEventConfig(schoolId, eventKey, parsed);
      res.json({ success: true, message: 'Event configuration updated successfully.', data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN TEMPLATE MANAGEMENT
  // ============================================================================

  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');

      const templates = await notificationsService.listTemplates(schoolId, req.query as any);
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');

      const parsed = CreateNotificationTemplateSchema.parse(req.body);
      const template = await notificationsService.createTemplate(schoolId, parsed);
      res.status(201).json({ success: true, message: 'Template created successfully.', data: template });
    } catch (err) {
      next(err);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;

      const parsed = UpdateNotificationTemplateSchema.parse(req.body);
      const updated = await notificationsService.updateTemplate(schoolId, id, parsed);
      res.json({ success: true, message: 'Template updated successfully.', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;

      const result = await notificationsService.deleteTemplate(schoolId, id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async previewTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = PreviewNotificationTemplateSchema.parse(req.body);
      const preview = notificationsService.previewTemplate(parsed);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN CHANNELS & PROVIDER CONFIG
  // ============================================================================

  async getProviderConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');

      const config = await notificationsService.getProviderConfig(schoolId);
      res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async updateProviderConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');

      const parsed = UpdateNotificationProviderConfigSchema.parse(req.body);
      const updated = await notificationsService.updateProviderConfig(schoolId, parsed);
      res.json({ success: true, message: 'Provider configurations saved.', data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN DELIVERY AUDIT LOGS
  // ============================================================================

  async listDeliveryLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');

      const result = await notificationsService.listDeliveryLogs(schoolId, req.query as any);
      res.json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async retryDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;

      const retried = await notificationsService.retryDelivery(schoolId, id);
      res.json({ success: true, message: 'Delivery retry initiated.', data: retried });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // DISPATCH NOTIFICATION TRIGGER (FOR BACKEND / TESTING USE)
  // ============================================================================

  async dispatchManualNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const schoolId = user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');

      const { eventKey, variables, recipientUserIds, title, priority, link } = req.body;
      const result = await notificationsService.dispatchNotification(schoolId, eventKey, {
        variables: variables || {},
        recipientUserIds,
        title,
        priority,
        link,
      });

      res.status(201).json({ success: true, message: 'Notification dispatched successfully.', data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();

