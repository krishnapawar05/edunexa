import { Router } from 'express';
import { portalsController } from './portals.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ==============================================================================
// 1. STUDENT PANEL ENDPOINTS
// ==============================================================================

router.get(
  '/student/dashboard',
  authenticateUser,
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => portalsController.getStudentDashboard(req, res, next)
);

router.get(
  '/student/admission-details',
  authenticateUser,
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => portalsController.getStudentAdmissionDetails(req, res, next)
);

router.get(
  '/student/library',
  authenticateUser,
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => portalsController.getStudentLibrary(req, res, next)
);

router.get(
  '/student/meetings',
  authenticateUser,
  requireRole(PlatformRole.STUDENT),
  (req, res, next) => portalsController.getStudentMeetings(req, res, next)
);

// ==============================================================================
// 2. PARENT / GUARDIAN PORTAL ENDPOINTS (MULTI-CHILD SUPPORT)
// ==============================================================================

router.get(
  '/parent/children',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => portalsController.getParentChildren(req, res, next)
);

router.get(
  '/parent/child/:studentProfileId/dashboard',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => portalsController.getParentChildDashboard(req, res, next)
);

router.get(
  '/parent/child/:studentProfileId/homework',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => portalsController.getParentChildHomework(req, res, next)
);

router.get(
  '/parent/child/:studentProfileId/receipts',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => portalsController.getParentChildReceipts(req, res, next)
);

router.get(
  '/parent/child/:studentProfileId/meetings',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => portalsController.getParentChildMeetings(req, res, next)
);

router.get(
  '/parent/child/:studentProfileId/messages',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => portalsController.getParentMessages(req, res, next)
);

router.post(
  '/parent/child/:studentProfileId/messages',
  authenticateUser,
  requireRole(PlatformRole.PARENT),
  (req, res, next) => portalsController.sendParentMessage(req, res, next)
);

// ==============================================================================
// 3. TEACHER PANEL ENDPOINTS
// ==============================================================================

router.get(
  '/teacher/dashboard',
  authenticateUser,
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN),
  (req, res, next) => portalsController.getTeacherDashboard(req, res, next)
);

router.get(
  '/teacher/academic-reports',
  authenticateUser,
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.EXAM_COORDINATOR),
  (req, res, next) => portalsController.getTeacherAcademicReports(req, res, next)
);

router.get(
  '/teacher/students/:studentProfileId/remarks',
  authenticateUser,
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  (req, res, next) => portalsController.getStudentRemarks(req, res, next)
);

router.post(
  '/teacher/students/:studentProfileId/remarks',
  authenticateUser,
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN),
  (req, res, next) => portalsController.addStudentRemark(req, res, next)
);

router.post(
  '/teacher/meetings',
  authenticateUser,
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  (req, res, next) => portalsController.scheduleMeeting(req, res, next)
);

router.patch(
  '/teacher/meetings/:id',
  authenticateUser,
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  (req, res, next) => portalsController.updateMeeting(req, res, next)
);

// ==============================================================================
// 4. LIBRARY SERVICES
// ==============================================================================

router.get(
  '/library/books',
  authenticateUser,
  (req, res, next) => portalsController.listLibraryBooks(req, res, next)
);

router.post(
  '/library/books',
  authenticateUser,
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.TEACHER, PlatformRole.PRINCIPAL),
  (req, res, next) => portalsController.createLibraryBook(req, res, next)
);

router.post(
  '/library/issue',
  authenticateUser,
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.TEACHER, PlatformRole.PRINCIPAL),
  (req, res, next) => portalsController.issueBook(req, res, next)
);

router.post(
  '/library/return/:issueId',
  authenticateUser,
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.TEACHER, PlatformRole.PRINCIPAL),
  (req, res, next) => portalsController.returnBook(req, res, next)
);

export default router;
