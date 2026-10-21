import { Router } from 'express';
import { operationsController } from './operations.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// All operational routes require authenticated session & tenant scoping
router.use(authenticateUser);

// ============================================================================
// 1. TIMETABLES
// ============================================================================
router.post(
  '/timetables',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.TEACHER),
  operationsController.createTimetableSlot
);

router.get('/timetables', operationsController.getSectionTimetable);

// ============================================================================
// 2. ASSIGNMENTS & HOMEWORK
// ============================================================================
router.post(
  '/assignments',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  operationsController.createAssignment
);

router.get('/assignments', operationsController.listAssignments);

router.post(
  '/assignments/submit',
  requireRole(PlatformRole.STUDENT, PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN),
  operationsController.submitAssignment
);

router.patch(
  '/assignments/grade',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  operationsController.gradeAssignment
);

// ============================================================================
// 3. LEARNING RESOURCES
// ============================================================================
router.post(
  '/resources',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  operationsController.createLearningResource
);

router.get('/resources', operationsController.listLearningResources);

// ============================================================================
// 4. NOTICES & SCHOOL EVENTS
// ============================================================================
router.post(
  '/notices',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.TEACHER),
  operationsController.createNotice
);

router.get('/notices', operationsController.listNotices);

router.post(
  '/events',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.TEACHER),
  operationsController.createSchoolEvent
);

router.get('/events', operationsController.listSchoolEvents);

// ============================================================================
// 5. IN-APP NOTIFICATIONS
// ============================================================================
router.get('/notifications', operationsController.listUserNotifications);
router.patch('/notifications/read-all', operationsController.markAllNotificationsRead);
router.patch('/notifications/:id/read', operationsController.markNotificationRead);

// ============================================================================
// 6. FINANCIAL & FEE OPERATIONS
// ============================================================================
router.post(
  '/fees/structures',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.createFeeStructure
);

router.get(
  '/fees/structures',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.listFeeStructures
);

router.patch(
  '/fees/structures/:id',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.updateFeeStructure
);

router.delete(
  '/fees/structures/:id',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.deleteFeeStructure
);

router.post(
  '/fees/invoices',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.createFeeInvoice
);

router.get('/fees/invoices', operationsController.listFeeInvoices);

router.post(
  '/fees/payments',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.PARENT, PlatformRole.STUDENT),
  operationsController.recordFeePayment
);

router.patch(
  '/fees/concessions',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.applyFeeConcession
);

router.patch(
  '/fees/refunds',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.recordFeeRefund
);

router.get(
  '/fees/summary',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.getFinancialSummary
);

router.get(
  '/fees/export-csv',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.exportFinancialLedgerCSV
);

router.get(
  '/fees/reconciliation',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.getReconciliationReport
);

router.post(
  '/fees/reconcile',
  requireRole(PlatformRole.ACCOUNTS, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  operationsController.recordReconciliation
);

export default router;
