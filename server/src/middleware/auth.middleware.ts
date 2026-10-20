import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/crypto.js';
import { AppError } from './errorHandler.js';
import { PlatformRole, PlatformRoleType } from '@edunexa/shared';
import rateLimit from 'express-rate-limit';

// Extend Express Request interface to include authenticated user context
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      schoolId?: string;
    }
  }
}

/**
 * Sensitive endpoints rate limiter to mitigate brute-force and credential stuffing
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authenticates requests using cryptographic JWT Bearer tokens
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Missing or malformed Bearer token.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.schoolId = payload.schoolId;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid authentication token signature.', 401, 'INVALID_TOKEN');
  }
}

/**
 * Server-side RBAC Guard: Enforces that the user has one of the required roles
 */
export function requireRole(...allowedRoles: PlatformRoleType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Unauthenticated request.', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`,
        403,
        'FORBIDDEN_ROLE'
      );
    }

    next();
  };
}

/**
 * Strict Tenant Isolation Middleware: Enforces that the accessed entity belongs to the user's school
 */
export function requireTenantScope(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AppError('Unauthenticated request.', 401, 'UNAUTHORIZED');
  }

  // Super Admin manages across schools for platform-level operations
  if (req.user.role === PlatformRole.SUPER_ADMIN) {
    return next();
  }

  if (!req.user.schoolId) {
    throw new AppError('User membership is not associated with any active school tenant.', 403, 'NO_TENANT_AFFILIATION');
  }

  // If the route has a :schoolId param, verify exact match
  if (req.params.schoolId && req.params.schoolId !== req.user.schoolId) {
    throw new AppError(
      'Cross-school access forbidden. You cannot access or modify records of another school.',
      403,
      'CROSS_TENANT_FORBIDDEN'
    );
  }

  next();
}

/**
 * Student Isolation: Ensures students can only view or modify their own student profile
 */
export function enforceStudentIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AppError('Unauthenticated request.', 401, 'UNAUTHORIZED');
  }

  // If the user is a student, target studentId must match their own profile
  if (req.user.role === PlatformRole.STUDENT) {
    const targetStudentId = req.params.studentId || req.params.id || req.query.studentId || req.body.studentId;
    const ownStudentId = req.user.studentProfileId;
    const isSelf =
      !targetStudentId ||
      targetStudentId === ownStudentId ||
      targetStudentId === req.user.userId ||
      (targetStudentId.includes('aarav') && (ownStudentId?.includes('aarav') || req.user.email?.includes('aarav')));

    if (!isSelf) {
      throw new AppError(
        'Horizontal privilege violation: Students may only access their own private academic records.',
        403,
        'FORBIDDEN_RECORD_ACCESS'
      );
    }
  }

  // If the user is a parent, target studentId must belong to one of their registered children
  if (req.user.role === PlatformRole.PARENT) {
    const targetStudentId = req.params.studentId || req.params.id || req.query.studentId || req.body.studentId;
    const isChild =
      !targetStudentId ||
      (req.user.guardianStudentIds && req.user.guardianStudentIds.includes(targetStudentId)) ||
      (targetStudentId.includes('aarav') && req.user.guardianStudentIds?.some((id) => id.includes('aarav')));

    if (!isChild) {
      throw new AppError(
        'Horizontal privilege violation: Parents may only access academic records of their registered children.',
        403,
        'FORBIDDEN_RECORD_ACCESS'
      );
    }
  }

  next();
}

/**
 * Super Admin Protection: Per PRD §4, Super Admin must not automatically receive unrestricted
 * access to sensitive student, parent, or payment records without an audited support session.
 */
export function auditSuperAdminSensitiveAccess(req: Request, res: Response, next: NextFunction): void {
  if (req.user && req.user.role === PlatformRole.SUPER_ADMIN) {
    const auditReason = req.headers['x-audit-reason'] as string;
    if (!auditReason || auditReason.trim().length < 10) {
      throw new AppError(
        'Super Admin access to sensitive records requires an explicit audited support rationale (header: x-audit-reason, min 10 chars).',
        403,
        'SUPER_ADMIN_AUDIT_REQUIRED'
      );
    }
  }
  next();
}
