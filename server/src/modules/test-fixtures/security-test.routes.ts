import { Router, Request, Response } from 'express';
import {
  authenticateUser,
  requireRole,
  requireTenantScope,
  enforceStudentIsolation,
  auditSuperAdminSensitiveAccess,
} from '../../middleware/auth.middleware.js';
import { PlatformRole, ApiSuccessResponse } from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

// Mock store for tenant isolation verification
const MOCK_RECORDS = [
  { id: 'rec-001', studentId: 'stu-aarav-01', schoolId: 'sch-apex-01', name: 'Aarav Sharma', physicsMarks: 94 },
  { id: 'rec-002', studentId: 'stu-rohan-99', schoolId: 'sch-greenwood-02', name: 'Rohan Patel', physicsMarks: 88 },
];

/**
 * Endpoint testing tenant isolation:
 * Users belonging to School A cannot read School B's roster.
 */
router.get(
  '/schools/:schoolId/roster',
  authenticateUser,
  requireTenantScope,
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.TEACHER, PlatformRole.PRINCIPAL),
  (req: Request, res: Response) => {
    const { schoolId } = req.params;
    const records = MOCK_RECORDS.filter((r) => r.schoolId === schoolId);
    const response: ApiSuccessResponse<typeof records> = {
      success: true,
      data: records,
    };
    res.status(200).json(response);
  }
);

/**
 * Endpoint testing student isolation & Super Admin sensitive data guardrails:
 * - Student can only view their own marks.
 * - Super Admin must provide audited rationale.
 */
router.get(
  '/students/:studentId/private-marks',
  authenticateUser,
  auditSuperAdminSensitiveAccess,
  enforceStudentIsolation,
  (req: Request, res: Response) => {
    const { studentId } = req.params;
    const record = MOCK_RECORDS.find((r) => r.studentId === studentId);

    if (!record) {
      throw new AppError(`Student record for '${studentId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const response: ApiSuccessResponse<typeof record> = {
      success: true,
      data: record,
    };
    res.status(200).json(response);
  }
);

/**
 * Endpoint testing manipulated record ID within tenant:
 */
router.get(
  '/records/:recordId',
  authenticateUser,
  requireTenantScope,
  (req: Request, res: Response) => {
    const { recordId } = req.params;
    const record = MOCK_RECORDS.find((r) => r.id === recordId && r.schoolId === req.user?.schoolId);

    if (!record) {
      throw new AppError(`Record '${recordId}' not found in your school tenant.`, 404, 'RECORD_NOT_FOUND');
    }

    res.status(200).json({ success: true, data: record });
  }
);

export default router;
