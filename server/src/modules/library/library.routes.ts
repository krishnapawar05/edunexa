import { Router } from 'express';
import { libraryController } from './library.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// ALL LIBRARY ROUTES ARE TENANT AUTHENTICATED
// ============================================================================
router.use(authenticateUser);

// 1. Dashboard Telemetry & Overview
router.get(
  '/dashboard/stats',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TEACHER
  ),
  libraryController.getDashboardStats
);

// 2. Book Inventory Management
router.get(
  '/books',
  libraryController.listBooks
);

router.get(
  '/books/:id',
  libraryController.getBookById
);

router.post(
  '/books',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.createBook
);

router.patch(
  '/books/:id',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.updateBook
);

router.delete(
  '/books/:id',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.deleteBook
);

// 3. Circulation: Book Issue & Return
router.get(
  '/issues',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TEACHER
  ),
  libraryController.listIssues
);

router.post(
  '/issues',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.issueBook
);

router.post(
  '/issues/:issueId/return',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.returnBook
);

// 4. Due-Date Tracking & Overdue Ledger
router.get(
  '/overdue',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TEACHER
  ),
  libraryController.getOverdueBooks
);

// 5. Fine Management
router.patch(
  '/issues/:issueId/fine',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.updateFineStatus
);

// 6. Student-Wise History & Portals Self-Service
router.get(
  '/my-history',
  requireRole(PlatformRole.STUDENT),
  libraryController.getMyLibraryHistory
);

router.get(
  '/students/:studentProfileId/history',
  libraryController.getStudentHistory
);

// 7. Library Settings & Policies
router.get(
  '/settings',
  libraryController.getSettings
);

router.patch(
  '/settings',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.updateSettings
);

// 8. Dynamic Reports
router.get(
  '/reports',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TEACHER
  ),
  libraryController.generateReport
);

// 9. Demo Seed Utility
router.post(
  '/seed-sample-books',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.LIBRARIAN,
    PlatformRole.SUPER_ADMIN
  ),
  libraryController.seedSampleData
);

export const libraryRouter = router;

