import { Router } from 'express';
import { governanceController } from './governance.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// All Section 16 Super Admin Governance endpoints strictly require SUPER_ADMIN
router.use(authenticateUser);
router.use(requireRole(PlatformRole.SUPER_ADMIN));

// 1. User Account Management
router.get('/accounts', (req, res, next) => governanceController.listAccounts(req, res, next));
router.post('/accounts', (req, res, next) => governanceController.createUser(req, res, next));
router.patch('/accounts/:id', (req, res, next) => governanceController.updateUser(req, res, next));
router.post('/accounts/:id/reset-password', (req, res, next) => governanceController.resetPassword(req, res, next));
router.post('/accounts/:id/unlock', (req, res, next) => governanceController.unlockAccount(req, res, next));
router.post('/accounts/:id/status', (req, res, next) => governanceController.updateAccountStatus(req, res, next));

// 2. RBAC & Module Permissions
router.get('/permissions', (req, res, next) => governanceController.listPermissions(req, res, next));
router.put('/permissions', (req, res, next) => governanceController.updatePermission(req, res, next));
router.patch('/permissions', (req, res, next) => governanceController.updatePermission(req, res, next));

// 3. Admission Enquiries Monitoring
router.get('/admissions/enquiries', (req, res, next) => governanceController.listAdmissionEnquiries(req, res, next));

// 4. Marksheet Publication Requests
router.get('/marksheets/requests', (req, res, next) => governanceController.listPublicationRequests(req, res, next));
router.post('/marksheets/requests/:id/review', (req, res, next) => governanceController.reviewPublicationRequest(req, res, next));

// 5. ID Cards & Certificates Templates Oversight
router.get('/templates', (req, res, next) => governanceController.listTemplates(req, res, next));

// 6. Analytics Intelligence
router.get('/analytics', (req, res, next) => governanceController.getAnalytics(req, res, next));

// 7. Backup Management
router.get('/backups', (req, res, next) => governanceController.listBackups(req, res, next));
router.post('/backups', (req, res, next) => governanceController.initiateBackup(req, res, next));

// 8. System Preferences & Settings
router.get('/system-config', (req, res, next) => governanceController.getSystemConfig(req, res, next));
router.put('/system-config', (req, res, next) => governanceController.updateSystemConfig(req, res, next));
router.patch('/system-config', (req, res, next) => governanceController.updateSystemConfig(req, res, next));

// 9. Mandatory Activity Logs & Auditing
router.get('/activity-logs', (req, res, next) => governanceController.listActivityLogs(req, res, next));
router.get('/activity-logs/export', (req, res, next) => governanceController.exportActivityLogsCsv(req, res, next));

export default router;

