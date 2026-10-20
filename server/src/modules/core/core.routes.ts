import { Router } from 'express';
import { coreSchoolController } from './core.controller.js';
import {
  authenticateUser,
  requireRole,
  requireTenantScope,
  enforceStudentIsolation,
} from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  PlatformRole,
  CreateStudentSchema,
  CreateStaffSchema,
  TeacherAssignmentSchema,
  IdCardGenerateSchema,
  IdCardDeactivateSchema,
  AdmissionReviewSchema,
} from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC ENDPOINTS (No Authentication Required)
// ============================================================================

/**
 * Public Privacy-Preserving QR ID Card Verification Endpoint
 * Validates cryptographically random UUID token and returns minimal verification info
 */
router.get('/id-cards/verify/:token', (req, res, next) => {
  coreSchoolController.verifyIdCardPublic(req, res, next);
});

/**
 * Public Online Admission Application Endpoint
 */
router.post('/admissions/apply', (req, res, next) => {
  coreSchoolController.submitAdmission(req, res, next);
});

// ============================================================================
// 2. AUTHENTICATED & TENANT-ISOLATED ENDPOINTS
// ============================================================================

router.use(authenticateUser);
router.use(requireTenantScope);

// Consolidated School Overview Statistics
router.get(
  '/school/overview-stats',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.getSchoolOverviewStats(req, res, next);
  }
);

// Academic Structure
router.get(
  '/academic/structure',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.TEACHER,
    PlatformRole.HR_STAFF,
    PlatformRole.ACCOUNTS,
    PlatformRole.EXAM_COORDINATOR,
    PlatformRole.SUPER_ADMIN
  ),
  (req, res, next) => {
    coreSchoolController.getAcademicStructure(req, res, next);
  }
);

router.post(
  '/academic/sessions',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.createAcademicSession(req, res, next);
  }
);

router.post(
  '/academic/classes',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.createClass(req, res, next);
  }
);

router.post(
  '/academic/classes/:classId/sections',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.createSection(req, res, next);
  }
);

router.post(
  '/academic/classes/:classId/subjects',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.createSubject(req, res, next);
  }
);

// Student Directory & SIS
router.get(
  '/students',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.TEACHER,
    PlatformRole.HR_STAFF,
    PlatformRole.ACCOUNTS,
    PlatformRole.SUPER_ADMIN
  ),
  (req, res, next) => {
    coreSchoolController.listStudents(req, res, next);
  }
);

router.post(
  '/students',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  validateRequest({ body: CreateStudentSchema }),
  (req, res, next) => {
    coreSchoolController.createStudent(req, res, next);
  }
);

router.get(
  '/students/:id',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.TEACHER,
    PlatformRole.HR_STAFF,
    PlatformRole.ACCOUNTS,
    PlatformRole.STUDENT,
    PlatformRole.PARENT,
    PlatformRole.SUPER_ADMIN
  ),
  enforceStudentIsolation,
  (req, res, next) => {
    coreSchoolController.getStudentById(req, res, next);
  }
);

router.patch(
  '/students/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.updateStudent(req, res, next);
  }
);

router.delete(
  '/students/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.deleteStudent(req, res, next);
  }
);

// Faculty & Staff Management
router.get(
  '/staff',
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.HR_STAFF,
    PlatformRole.SUPER_ADMIN
  ),
  (req, res, next) => {
    coreSchoolController.listStaff(req, res, next);
  }
);

router.post(
  '/staff',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF, PlatformRole.SUPER_ADMIN),
  validateRequest({ body: CreateStaffSchema }),
  (req, res, next) => {
    coreSchoolController.createStaff(req, res, next);
  }
);

router.patch(
  '/staff/:id/status',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.updateStaffStatus(req, res, next);
  }
);

router.post(
  '/staff/assignments',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF, PlatformRole.SUPER_ADMIN),
  validateRequest({ body: TeacherAssignmentSchema }),
  (req, res, next) => {
    coreSchoolController.assignTeacher(req, res, next);
  }
);

// Virtual ID Card Generation & Revocation
router.post(
  '/id-cards/generate',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF, PlatformRole.SUPER_ADMIN),
  validateRequest({ body: IdCardGenerateSchema }),
  (req, res, next) => {
    coreSchoolController.generateIdCard(req, res, next);
  }
);

router.patch(
  '/id-cards/:id/deactivate',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.HR_STAFF, PlatformRole.SUPER_ADMIN),
  validateRequest({ body: IdCardDeactivateSchema }),
  (req, res, next) => {
    coreSchoolController.deactivateIdCard(req, res, next);
  }
);

// Admissions & Applications Review
router.get(
  '/admissions/applications',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.listAdmissions(req, res, next);
  }
);

router.patch(
  '/admissions/applications/:id/review',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  validateRequest({ body: AdmissionReviewSchema }),
  (req, res, next) => {
    coreSchoolController.reviewAdmission(req, res, next);
  }
);

// Teacher Profile & Assigned Subjects/Classes
router.get(
  '/teacher/profile',
  requireRole(PlatformRole.TEACHER, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.getTeacherProfile(req, res, next);
  }
);

// Parent Registered Children / Wards
router.get(
  '/parent/children',
  requireRole(PlatformRole.PARENT, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  (req, res, next) => {
    coreSchoolController.getParentChildren(req, res, next);
  }
);

export default router;
