import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// All notification routes require authentication
router.use(authenticateUser);

// ============================================================================
// 1. USER IN-APP NOTIFICATION ENDPOINTS (All authenticated roles)
// ============================================================================
router.get('/', (req, res, next) => notificationsController.listUserNotifications(req, res, next));
router.get('/unread-count', (req, res, next) => notificationsController.getUnreadCount(req, res, next));
router.patch('/read-all', (req, res, next) => notificationsController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationsController.markAsRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationsController.dismissNotification(req, res, next));

// ============================================================================
// 2. ADMIN NOTIFICATION CONFIGURATION & TEMPLATES (Admin & Principal)
// ============================================================================
const adminAuth = requireRole(
  PlatformRole.SCHOOL_ADMIN,
  PlatformRole.PRINCIPAL,
  PlatformRole.SUPER_ADMIN
);

// Event Triggers Configuration
router.get('/admin/events', adminAuth, (req, res, next) => notificationsController.listEventConfigs(req, res, next));
router.put('/admin/events/:eventKey', adminAuth, (req, res, next) => notificationsController.updateEventConfig(req, res, next));

// Templates Management
router.get('/admin/templates', adminAuth, (req, res, next) => notificationsController.listTemplates(req, res, next));
router.post('/admin/templates', adminAuth, (req, res, next) => notificationsController.createTemplate(req, res, next));
router.put('/admin/templates/:id', adminAuth, (req, res, next) => notificationsController.updateTemplate(req, res, next));
router.delete('/admin/templates/:id', adminAuth, (req, res, next) => notificationsController.deleteTemplate(req, res, next));
router.post('/admin/templates/preview', adminAuth, (req, res, next) => notificationsController.previewTemplate(req, res, next));

// Channels & Provider Gateways
router.get('/admin/providers', adminAuth, (req, res, next) => notificationsController.getProviderConfig(req, res, next));
router.put('/admin/providers', adminAuth, (req, res, next) => notificationsController.updateProviderConfig(req, res, next));

// Delivery Audit Logs & Retry
router.get('/admin/logs', adminAuth, (req, res, next) => notificationsController.listDeliveryLogs(req, res, next));
router.post('/admin/logs/:id/retry', adminAuth, (req, res, next) => notificationsController.retryDelivery(req, res, next));

// Manual Event Dispatch
router.post('/admin/dispatch', adminAuth, (req, res, next) => notificationsController.dispatchManualNotification(req, res, next));

export default router;

