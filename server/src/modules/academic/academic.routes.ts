import { Router } from 'express';
import { academicController } from './academic.controller.js';
import { authenticateUser, requireRole, enforceStudentIsolation } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// All academic endpoints require a verified JWT session and tenant scope
router.use(authenticateUser);

// ============================================================================
// 1. ATTENDANCE ROUTES
// ============================================================================

// Record student attendance (Teacher, School Admin, Principal)
router.post(
  '/attendance/students',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  academicController.recordStudentAttendance
);

// Correct student attendance with audit reason (School Admin, Principal, Teacher)
router.patch(
  '/attendance/students/correct',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  academicController.correctStudentAttendance
);

// Get student attendance summary (Student, Parent, Teacher, School Admin, Principal)
router.get(
  '/attendance/students/:studentProfileId/summary',
  enforceStudentIsolation,
  academicController.getStudentAttendanceSummary
);

// Get class daily attendance report (Teacher, School Admin, Principal)
router.get(
  '/attendance/class-report',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  academicController.getClassAttendanceReport
);

// Get section attendance roster for marking and monitoring (Teacher, School Admin, Principal, Super Admin)
router.get(
  '/attendance/roster',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  academicController.getAttendanceRoster
);

// Staff Attendance & Leaves
router.post(
  '/attendance/staff',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF),
  academicController.recordStaffAttendance
);

router.post(
  '/attendance/staff/leave',
  requireRole(PlatformRole.TEACHER, PlatformRole.HR_STAFF, PlatformRole.SCHOOL_ADMIN),
  academicController.submitStaffLeaveRequest
);

router.get(
  '/attendance/staff/leave',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF, PlatformRole.TEACHER),
  academicController.listStaffLeaveRequests
);

router.patch(
  '/attendance/staff/leave/:id/review',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF),
  academicController.reviewStaffLeaveRequest
);

// ============================================================================
// 2. QUIZ ROUTES
// ============================================================================

// Create quiz (Teacher, School Admin)
router.post(
  '/quizzes',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  academicController.createQuiz
);

// List available quizzes
router.get('/quizzes', academicController.listQuizzes);

// Start/Resume quiz attempt (Student, Teacher, Admin)
router.post('/quizzes/:id/attempts/start', academicController.startQuizAttempt);

// Save draft or submit completed quiz attempt
router.post('/quizzes/:id/attempts/submit', academicController.submitQuizAttempt);

// Teacher review and grading of subjective questions
router.patch(
  '/quizzes/attempts/review',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  academicController.reviewQuizSubjective
);

// ============================================================================
// 3. EXAMINATIONS & MARKS ROUTES
// ============================================================================

// Create exam schedule (School Admin, Principal, Exam Coordinator)
router.post(
  '/exams/schedules',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.EXAM_COORDINATOR, PlatformRole.TEACHER),
  academicController.createExamSchedule
);

// List exam schedules
router.get('/exams/schedules', academicController.listExamSchedules);

// Get exam schedule marks
router.get('/exams/schedules/:id/marks', academicController.getExamScheduleMarks);

// Batch enter marks (Teacher, Exam Coordinator, School Admin)
router.post(
  '/exams/marks/batch',
  requireRole(PlatformRole.TEACHER, PlatformRole.EXAM_COORDINATOR, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  academicController.submitExamMarksBatch
);

// Correct mark with audit rationale
router.patch(
  '/exams/marks/correct',
  requireRole(PlatformRole.TEACHER, PlatformRole.EXAM_COORDINATOR, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL),
  academicController.correctExamMark
);

// Publish or unpublish exam results (School Admin, Principal, Exam Coordinator)
router.patch(
  '/exams/publish',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.EXAM_COORDINATOR),
  academicController.publishExamResults
);

// ============================================================================
// 4. REPORT CARD & ACADEMIC DASHBOARD ROUTE
// ============================================================================

// Get comprehensive student report card (Student, Parent, Teacher, School Admin)
router.get(
  '/report-cards/:studentProfileId',
  enforceStudentIsolation,
  academicController.getStudentReportCard
);

export default router;
