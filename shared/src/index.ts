import { z } from 'zod';

// ============================================================================
// ROLE & TENANT DEFINITIONS
// ============================================================================

export const PlatformRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  HR_STAFF: 'HR_STAFF',
  ACCOUNTS: 'ACCOUNTS',
  EXAM_COORDINATOR: 'EXAM_COORDINATOR',
} as const;

export type PlatformRoleType = (typeof PlatformRole)[keyof typeof PlatformRole];

export const TenantStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
} as const;

export type TenantStatusType = (typeof TenantStatus)[keyof typeof TenantStatus];

export const CardStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  LOST: 'LOST',
} as const;

export type CardStatusType = (typeof CardStatus)[keyof typeof CardStatus];

export const ApplicationStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WAITLISTED: 'WAITLISTED',
} as const;

export type ApplicationStatusType = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// ============================================================================
// STANDARDIZED API RESPONSE ENVELOPES
// ============================================================================

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// HEALTH & DIAGNOSTICS CONTRACTS
// ============================================================================

export interface HealthCheckData {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  database: {
    status: 'connected' | 'disconnected' | 'connecting';
    latencyMs?: number;
  };
  environment: string;
}

// ============================================================================
// VALIDATION SCHEMAS (ZOD)
// ============================================================================

export const LoginRequestSchema = z.object({
  email: z.string().email('Please provide a valid institutional email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  schoolSlug: z.string().optional(),
});

export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>;

export const SchoolOnboardingSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  code: z.string().min(2).max(10, 'School code must be between 2 and 10 characters').regex(/^[A-Z0-9-]+$/, 'Uppercase letters, numbers, and hyphens only'),
  email: z.string().email('Valid school email is required'),
  phone: z.string().min(7, 'Valid contact phone number is required'),
  address: z.string().min(5, 'Physical address is required'),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().default('India'),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  planName: z.enum(['Standard', 'Pro', 'Enterprise']).default('Standard'),
});

export type SchoolOnboardingDTO = z.infer<typeof SchoolOnboardingSchema>;

export const StudentAdmissionApplicationSchema = z.object({
  schoolSlug: z.string(),
  studentFirstName: z.string().min(2, 'First name is required'),
  studentLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  gender: z.enum(['Male', 'Female', 'Non-Binary', 'Other']),
  bloodGroup: z.string().optional(),
  applyingClass: z.string().min(1, 'Class is required'),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianRelationship: z.string().min(2, 'Relationship is required'),
  guardianEmail: z.string().email('Valid email is required'),
  guardianPhone: z.string().min(8, 'Valid phone number is required'),
  residentialAddress: z.string().min(5, 'Address is required'),
  previousSchool: z.string().optional(),
  previousMarksPercentage: z.number().min(0).max(100).optional(),
});

export type StudentAdmissionApplicationDTO = z.infer<typeof StudentAdmissionApplicationSchema>;

export const CreateStudentSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  admissionNumber: z.string().regex(/^ADM-\d{4}-\d{3,6}$/, 'Format must be ADM-YYYY-XXXX'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['Male', 'Female', 'Non-Binary', 'Other']),
  bloodGroup: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  emergencyPhone: z.string().min(7, 'Emergency contact is required'),
  className: z.string().min(1, 'Class is required'),
  sectionName: z.string().min(1, 'Section is required'),
  rollNumber: z.number().int().positive().optional(),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianRelationship: z.string().min(2, 'Relationship is required'),
  guardianEmail: z.string().email('Valid guardian email is required'),
  guardianPhone: z.string().min(7, 'Valid guardian phone is required'),
});

export type CreateStudentDTO = z.infer<typeof CreateStudentSchema>;

export const CreateStaffSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid institutional email is required'),
  employeeId: z.string().regex(/^EMP-\d{4}-\d{3,6}$/, 'Format must be EMP-YYYY-XXXX'),
  departmentName: z.string().min(2, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'PROBATION', 'RESIGNED', 'TERMINATED']).default('ACTIVE'),
  phone: z.string().min(7, 'Contact phone is required'),
});

export type CreateStaffDTO = z.infer<typeof CreateStaffSchema>;

export const TeacherAssignmentSchema = z.object({
  staffProfileId: z.string().uuid().or(z.string().min(3)),
  className: z.string().min(1),
  sectionName: z.string().min(1),
  subjectCode: z.string().min(2),
  isLeadTeacher: z.boolean().default(false),
});

export type TeacherAssignmentDTO = z.infer<typeof TeacherAssignmentSchema>;

export const IdCardGenerateSchema = z.object({
  holderType: z.enum(['STUDENT', 'STAFF']),
  profileId: z.string().min(1),
  expiresAt: z.string().optional(),
});

export type IdCardGenerateDTO = z.infer<typeof IdCardGenerateSchema>;

export const IdCardDeactivateSchema = z.object({
  cardId: z.string().min(1),
  reason: z.string().min(5, 'Revocation reason must be at least 5 characters'),
});

export type IdCardDeactivateDTO = z.infer<typeof IdCardDeactivateSchema>;

export const AdmissionReviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'WAITLISTED']),
  reviewNotes: z.string().optional(),
  assignedClass: z.string().optional(),
  assignedSection: z.string().optional(),
});

export type AdmissionReviewDTO = z.infer<typeof AdmissionReviewSchema>;

// Minimal, privacy-preserving public card verification response (PRD Requirement)
export interface PublicIdCardVerificationResponse {
  isValid: boolean;
  status: CardStatusType;
  holderType: 'STUDENT' | 'STAFF';
  holderName: string;
  identifierNumber: string; // e.g. ADM-2026-0042 or EMP-2026-0012
  schoolName: string;
  schoolCode: string;
  academicSession: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
}
