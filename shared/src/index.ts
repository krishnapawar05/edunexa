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
  email: z.string().min(3, 'Please provide a valid institutional email or username'),
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
  // School Admin Account Details & Provisioning
  adminFullName: z.string().min(2, 'School Admin full name must be at least 2 characters').optional().or(z.literal('')),
  adminEmail: z.string().email('Valid administrator email is required').optional().or(z.literal('')),
  adminPhone: z.string().optional().or(z.literal('')),
  sendInvitation: z.boolean().optional().default(true),
});

export type SchoolOnboardingDTO = z.infer<typeof SchoolOnboardingSchema>;

export const SendSchoolAdminInvitationSchema = z.object({
  adminFullName: z.string().min(2, 'School Admin full name is required'),
  adminEmail: z.string().email('Valid school administrator email is required'),
  adminPhone: z.string().optional().or(z.literal('')),
  sendInvitation: z.boolean().optional().default(true),
});

export type SendSchoolAdminInvitationDTO = z.infer<typeof SendSchoolAdminInvitationSchema>;

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
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  admissionNumber: z.string().regex(/^ADM-\d{4}-\d{3,6}$/, 'Format must be ADM-YYYY-XXXX').optional().or(z.literal('')),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Non-Binary', 'Other']).default('Male'),
  bloodGroup: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyPhone: z.string().optional().or(z.literal('')),
  className: z.string().min(1, 'Class is required'),
  sectionName: z.string().min(1, 'Section is required'),
  rollNumber: z.number().int().positive().optional(),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianRelationship: z.string().optional().or(z.literal('')),
  guardianEmail: z.string().email('Valid guardian email is required').optional().or(z.literal('')),
  guardianPhone: z.string().optional().or(z.literal('')),
  sendInvitation: z.boolean().optional().default(true),
  isAssistedActivation: z.boolean().optional().default(false),
});

export type CreateStudentDTO = z.infer<typeof CreateStudentSchema>;

export const CreateStaffSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid institutional email is required'),
  role: z.enum(['TEACHER', 'PRINCIPAL', 'EXAM_COORDINATOR', 'HR_STAFF', 'ACCOUNTS', 'SCHOOL_ADMIN']).default('TEACHER'),
  employeeId: z.string().regex(/^EMP-\d{4}-\d{3,6}$/, 'Format must be EMP-YYYY-XXXX'),
  departmentName: z.string().min(2, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'PROBATION', 'RESIGNED', 'TERMINATED']).default('ACTIVE'),
  phone: z.string().min(7, 'Contact phone is required'),
  sendInvitation: z.boolean().default(true),
});

export type CreateStaffDTO = z.infer<typeof CreateStaffSchema>;

export const InvitationStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'FAILED']);
export type InvitationStatusType = z.infer<typeof InvitationStatusEnum>;

export const ActivateAccountSchema = z.object({
  token: z.string().min(6, 'Valid activation token or code is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
export type ActivateAccountDTO = z.infer<typeof ActivateAccountSchema>;

export const ResendInvitationSchema = z.object({
  invitationId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
});
export type ResendInvitationDTO = z.infer<typeof ResendInvitationSchema>;

export const RevokeInvitationSchema = z.object({
  invitationId: z.string().min(1),
  reason: z.string().optional(),
});
export type RevokeInvitationDTO = z.infer<typeof RevokeInvitationSchema>;

export const UpdateAccountStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional(),
});

export const AdminResetPasswordSchema = z.object({
  temporaryPassword: z
    .string()
    .min(8, 'Temporary password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one numeric digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
  mustChangePassword: z.boolean().default(true).optional(),
  reason: z.string().optional(),
});
export type AdminResetPasswordDTO = z.infer<typeof AdminResetPasswordSchema>;

export const UserChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one numeric digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
export type UserChangePasswordDTO = z.infer<typeof UserChangePasswordSchema>;

export const AdminUnlockAccountSchema = z.object({
  reason: z.string().optional(),
});
export type AdminUnlockAccountDTO = z.infer<typeof AdminUnlockAccountSchema>;

export const BulkUserAccountActionSchema = z.object({
  userIds: z.array(z.string().min(1)),
  action: z.enum(['ACTIVATE', 'DEACTIVATE', 'UNLOCK']),
  reason: z.string().optional(),
});
export type BulkUserAccountActionDTO = z.infer<typeof BulkUserAccountActionSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().min(3, 'Email or username is required'),
  schoolSlug: z.string().optional(),
});
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(16, 'Valid password reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;
export type UpdateAccountStatusDTO = z.infer<typeof UpdateAccountStatusSchema>;

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

// ============================================================================
// STAGE 5: ACADEMIC WORKFLOWS DEFINITIONS & CONTRACTS
// ============================================================================

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  APPROVED_LEAVE: 'APPROVED_LEAVE',
} as const;

export type AttendanceStatusType = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const QuestionType = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT: 'MULTIPLE_SELECT',
  TRUE_FALSE: 'TRUE_FALSE',
  FILL_IN_BLANKS: 'FILL_IN_BLANKS',
  SHORT_ANSWER: 'SHORT_ANSWER',
  LONG_ANSWER: 'LONG_ANSWER',
  DESCRIPTIVE: 'DESCRIPTIVE',
  MATCH_THE_FOLLOWING: 'MATCH_THE_FOLLOWING',
  NUMERICAL: 'NUMERICAL',
  FILE_UPLOAD: 'FILE_UPLOAD',
} as const;

export type QuestionTypeEnum = (typeof QuestionType)[keyof typeof QuestionType];

export const QuestionDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type QuestionDifficultyType = (typeof QuestionDifficulty)[keyof typeof QuestionDifficulty];

export const QuestionPaperStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type QuestionPaperStatusType = (typeof QuestionPaperStatus)[keyof typeof QuestionPaperStatus];

export const AssessmentAttemptStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  EVALUATED: 'EVALUATED',
  PUBLISHED: 'PUBLISHED',
} as const;
export type AssessmentAttemptStatusType = (typeof AssessmentAttemptStatus)[keyof typeof AssessmentAttemptStatus];

export const QuizStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type QuizStatusType = (typeof QuizStatus)[keyof typeof QuizStatus];

export const ExamStatus = {
  SCHEDULED: 'SCHEDULED',
  MARKS_DRAFT: 'MARKS_DRAFT',
  MARKS_SUBMITTED: 'MARKS_SUBMITTED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ExamStatusType = (typeof ExamStatus)[keyof typeof ExamStatus];

// Attendance Schemas
export const MarkStudentAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  className: z.string().min(1),
  sectionName: z.string().min(1),
  records: z.array(
    z.object({
      studentProfileId: z.string().min(1),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'APPROVED_LEAVE']),
      remarks: z.string().optional(),
    })
  ).min(1, 'At least one student attendance record must be provided'),
});

export type MarkStudentAttendanceDTO = z.infer<typeof MarkStudentAttendanceSchema>;

export const CorrectAttendanceSchema = z.object({
  recordId: z.string().min(1),
  newStatus: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'APPROVED_LEAVE']),
  reason: z.string().min(5, 'Correction reason must be at least 5 characters for audit integrity'),
});

export type CorrectAttendanceDTO = z.infer<typeof CorrectAttendanceSchema>;

export const MarkStaffAttendanceSchema = z.object({
  staffProfileId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'APPROVED_LEAVE']),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  remarks: z.string().optional(),
});

export type MarkStaffAttendanceDTO = z.infer<typeof MarkStaffAttendanceSchema>;

export const StaffLeaveRequestSchema = z.object({
  staffProfileId: z.string().min(1),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reason: z.string().min(5, 'Leave justification is required'),
});

export type StaffLeaveRequestDTO = z.infer<typeof StaffLeaveRequestSchema>;

// Quiz Schemas
export const QuizQuestionChoiceSchema = z.object({
  id: z.string().optional(),
  choiceText: z.string().min(1, 'Option text cannot be empty'),
  isCorrect: z.boolean(),
  orderIndex: z.number().int().default(0),
});

export const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  questionText: z.string().min(3, 'Question text must be at least 3 characters'),
  questionType: z.enum([
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'TRUE_FALSE',
    'FILL_IN_BLANKS',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'DESCRIPTIVE',
    'MATCH_THE_FOLLOWING',
    'NUMERICAL',
    'FILE_UPLOAD',
  ]),
  marks: z.number().positive('Marks must be positive'),
  negativeMarks: z.number().min(0).default(0),
  explanation: z.string().optional(),
  orderIndex: z.number().int().default(0),
  choices: z.array(QuizQuestionChoiceSchema).optional(),
  sampleAnswer: z.string().optional(),
});

export const CreateQuizSchema = z.object({
  title: z.string().min(3, 'Quiz title must be at least 3 characters'),
  subjectCode: z.string().min(2),
  className: z.string().min(1),
  sectionName: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().positive('Duration must be positive in minutes'),
  totalMarks: z.number().positive('Total marks must be positive'),
  passingMarks: z.number().min(0, 'Passing marks cannot be negative'),
  opensAt: z.string().min(10, 'Opens at timestamp required'),
  closesAt: z.string().min(10, 'Closes at timestamp required'),
  maxAttempts: z.number().int().positive().default(1),
  randomizeQuestions: z.boolean().default(true),
  negativeMarking: z.number().min(0).default(0),
  releaseGradesImmediately: z.boolean().default(false),
  questions: z.array(QuizQuestionSchema).min(1, 'A quiz must contain at least one question'),
});

export type CreateQuizDTO = z.infer<typeof CreateQuizSchema>;

export const QuizAnswerSubmissionSchema = z.object({
  questionId: z.string().min(1),
  selectedChoiceIds: z.array(z.string()).optional(),
  textAnswer: z.string().optional(),
});

export const SubmitQuizAttemptSchema = z.object({
  quizId: z.string().min(1),
  attemptId: z.string().optional(),
  answers: z.array(QuizAnswerSubmissionSchema),
  saveOnly: z.boolean().default(false), // true for periodic draft autosave, false for final submission
});

export type SubmitQuizAttemptDTO = z.infer<typeof SubmitQuizAttemptSchema>;

export const GradeQuizReviewSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  marksAwarded: z.number().min(0),
  feedback: z.string().optional(),
});

export type GradeQuizReviewDTO = z.infer<typeof GradeQuizReviewSchema>;

// Examination & Marks Schemas
export const CreateExamScheduleSchema = z.object({
  academicSession: z.string().min(1),
  className: z.string().min(1),
  subjectCode: z.string().min(2),
  name: z.string().min(3, 'Exam title must be at least 3 characters'),
  examType: z.enum(['UNIT_TEST', 'MID_TERM', 'FINAL_TERM', 'PRACTICAL']),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().min(3, 'Start time is required (e.g. 09:30 AM)'),
  durationMinutes: z.number().int().positive(),
  maxMarks: z.number().positive(),
  passMarks: z.number().positive(),
  weightagePercent: z.number().min(1).max(100).default(100),
  roomNumber: z.string().optional(),
  instructions: z.string().optional(),
});

export type CreateExamScheduleDTO = z.infer<typeof CreateExamScheduleSchema>;

export const StudentMarkItemSchema = z.object({
  studentProfileId: z.string().min(1),
  marksObtained: z.number().min(0).optional(),
  isAbsent: z.boolean().default(false),
  isExempt: z.boolean().default(false),
  teacherRemarks: z.string().optional(),
});

export const SubmitExamMarksBatchSchema = z.object({
  examScheduleId: z.string().min(1),
  isDraft: z.boolean().default(false),
  marks: z.array(StudentMarkItemSchema).min(1, 'At least one student mark entry is required'),
});

export type SubmitExamMarksBatchDTO = z.infer<typeof SubmitExamMarksBatchSchema>;

export const CorrectExamMarkSchema = z.object({
  markId: z.string().min(1),
  newMarksObtained: z.number().min(0).optional(),
  isAbsent: z.boolean().optional(),
  isExempt: z.boolean().optional(),
  teacherRemarks: z.string().optional(),
  reason: z.string().min(5, 'Audit rationale required for grade modification'),
});

export type CorrectExamMarkDTO = z.infer<typeof CorrectExamMarkSchema>;

export const PublishExamSchema = z.object({
  examScheduleId: z.string().min(1),
  publish: z.boolean(),
});

export type PublishExamDTO = z.infer<typeof PublishExamSchema>;

// Report Card & Academic Results Contracts
export interface SubjectResultEntry {
  subjectCode: string;
  subjectName: string;
  examType: string;
  maxMarks: number;
  passMarks: number;
  marksObtained: number | null;
  grade: string;
  isAbsent: boolean;
  isExempt: boolean;
  weightagePercent: number;
  teacherRemarks?: string;
}

export interface StudentReportCard {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  className: string;
  sectionName: string;
  rollNumber: number;
  academicSession: string;
  attendancePercentage: number;
  totalPresent: number;
  totalWorkingDays: number;
  results: SubjectResultEntry[];
  totalMaxMarks: number;
  totalMarksObtained: number;
  overallPercentage: number;
  overallGrade: string;
  isPassed: boolean;
  promotedToNextGrade: boolean;
  isPublished: boolean;
  generatedAt: string;
}

// ============================================================================
// STAGE 6: OPERATIONS, COMMUNICATIONS & FINANCIAL CONTRACTS
// ============================================================================

export const EventAudience = {
  ALL: 'ALL',
  STUDENTS_ONLY: 'STUDENTS_ONLY',
  PARENTS_ONLY: 'PARENTS_ONLY',
  STAFF_ONLY: 'STAFF_ONLY',
  SPECIFIC_CLASS: 'SPECIFIC_CLASS',
} as const;

export type EventAudienceType = (typeof EventAudience)[keyof typeof EventAudience];

export const FeePaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
} as const;

export type FeePaymentStatusType = (typeof FeePaymentStatus)[keyof typeof FeePaymentStatus];

export const PaymentTxnStatus = {
  CREATED: 'CREATED',
  ATTEMPTED: 'ATTEMPTED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentTxnStatusType = (typeof PaymentTxnStatus)[keyof typeof PaymentTxnStatus];

// Timetable Slot Schema
export const CreateTimetableSlotSchema = z.object({
  className: z.string().min(1),
  sectionName: z.string().min(1),
  dayOfWeek: z.number().int().min(1).max(7), // 1 = Monday, 6 = Saturday
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  subjectName: z.string().min(2),
  roomNumber: z.string().min(1),
  teacherName: z.string().min(2),
});

export type CreateTimetableSlotDTO = z.infer<typeof CreateTimetableSlotSchema>;

// Assignment Schemas
export const CreateAssignmentSchema = z.object({
  className: z.string().min(1),
  sectionName: z.string().min(1),
  subjectCode: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(5),
  dueDate: z.string().min(10, 'Due date is required'),
  maxMarks: z.number().positive().default(20),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
});

export type CreateAssignmentDTO = z.infer<typeof CreateAssignmentSchema>;

export const SubmitAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  studentProfileId: z.string().min(1),
  submissionText: z.string().optional(),
  fileUrl: z.string().min(3, 'Valid file or attachment URL is required'),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().positive(),
  fileType: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']),
});

export type SubmitAssignmentDTO = z.infer<typeof SubmitAssignmentSchema>;

export const GradeAssignmentSchema = z.object({
  submissionId: z.string().min(1),
  marksAwarded: z.number().min(0),
  feedback: z.string().min(2),
});

export type GradeAssignmentDTO = z.infer<typeof GradeAssignmentSchema>;

// Learning Resources Schema
export const CreateLearningResourceSchema = z.object({
  subjectCode: z.string().min(2),
  className: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  topic: z.string().min(2),
  fileUrl: z.string().min(3),
  fileType: z.enum(['PDF', 'DOCUMENT', 'VIDEO', 'PRESENTATION', 'LINK']),
  fileSizeBytes: z.number().max(50 * 1024 * 1024, 'Resource cannot exceed 50 MB'),
});

export type CreateLearningResourceDTO = z.infer<typeof CreateLearningResourceSchema>;

// Notices & School Events
export const CreateNoticeSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  audience: z.enum(['ALL', 'STUDENTS_ONLY', 'PARENTS_ONLY', 'STAFF_ONLY', 'SPECIFIC_CLASS']),
  targetClass: z.string().optional(),
  isUrgent: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

export type CreateNoticeDTO = z.infer<typeof CreateNoticeSchema>;

export const CreateSchoolEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  venue: z.string().min(2),
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  audience: z.enum(['ALL', 'STUDENTS_ONLY', 'PARENTS_ONLY', 'STAFF_ONLY', 'SPECIFIC_CLASS']),
  isPublic: z.boolean().default(false),
});

export type CreateSchoolEventDTO = z.infer<typeof CreateSchoolEventSchema>;

// Financial & Fee Management Schemas
export const CreateFeeStructureSchema = z.object({
  className: z.string().min(1),
  feeHead: z.string().min(2), // e.g. Tuition Fee, Science Lab, ICT & AI Fee
  amount: z.number().positive('Fee amount must be positive'),
  frequency: z.enum(['ANNUAL', 'TERM', 'MONTHLY']),
});

export type CreateFeeStructureDTO = z.infer<typeof CreateFeeStructureSchema>;

export const RecordFeePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amountPaid: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['UPI', 'NET_BANKING', 'CREDIT_CARD', 'CHEQUE', 'CASH']),
  transactionRef: z.string().min(3, 'Transaction reference required'),
  isSimulated: z.boolean().default(true), // Explicitly labeled simulated payment
  notes: z.string().optional(),
});

export type RecordFeePaymentDTO = z.infer<typeof RecordFeePaymentSchema>;

export const ApplyFeeConcessionSchema = z.object({
  invoiceId: z.string().min(1),
  concessionAmount: z.number().positive(),
  reason: z.string().min(5, 'Auditable rationale required for fee concession'),
});

export type ApplyFeeConcessionDTO = z.infer<typeof ApplyFeeConcessionSchema>;

export const RecordFeeRefundSchema = z.object({
  invoiceId: z.string().min(1),
  refundAmount: z.number().positive(),
  reason: z.string().min(5, 'Auditable reason required for fee refund'),
});

export type RecordFeeRefundDTO = z.infer<typeof RecordFeeRefundSchema>;

export const CreateFeeInvoiceSchema = z.object({
  studentProfileId: z.string().min(1, 'Student identifier is required'),
  feeStructureId: z.string().optional(),
  feeHead: z.string().optional(),
  className: z.string().optional(),
  amountDue: z.number().positive('Invoice amount must be positive'),
  dueDate: z.string().min(1, 'Due date is required'),
});

export type CreateFeeInvoiceDTO = z.infer<typeof CreateFeeInvoiceSchema>;

export const RecordReconciliationSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID required'),
  action: z.enum(['RECONCILE', 'FLAG_DISCREPANCY']),
  statementRef: z.string().optional(),
  reason: z.string().optional(),
});

export type RecordReconciliationDTO = z.infer<typeof RecordReconciliationSchema>;

// Razorpay Payment Gateway Schemas & Contracts
export const CreateRazorpayOrderSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be positive').optional(),
  notes: z.record(z.string()).optional(),
});

export type CreateRazorpayOrderDTO = z.infer<typeof CreateRazorpayOrderSchema>;

export const VerifyRazorpayPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  orderId: z.string().min(1, 'Razorpay Order ID is required'),
  paymentId: z.string().min(1, 'Razorpay Payment ID is required'),
  signature: z.string().min(1, 'Razorpay signature is required'),
});

export type VerifyRazorpayPaymentDTO = z.infer<typeof VerifyRazorpayPaymentSchema>;

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number; // in paise
  amountInRupees: number;
  currency: string;
  keyId: string;
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  studentAdmissionNo: string;
  schoolName: string;
  notes?: Record<string, any>;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  orderId: string;
  paymentId: string;
  receiptNumber: string;
  amountPaid: number;
  invoiceStatus: FeePaymentStatusType;
  remainingBalance: number;
  paidAt: string;
  schoolName: string;
  studentName: string;
  invoiceNumber: string;
}

export interface PaymentTransactionRecord {
  id: string;
  schoolId: string;
  feeInvoiceId: string;
  userId: string;
  orderId: string;
  paymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentTxnStatusType;
  paymentMethod?: string | null;
  receiptNumber?: string | null;
  invoiceNumber?: string;
  studentName?: string;
  errorCode?: string | null;
  errorDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Financial Summary Report Contract
export interface FinancialSummaryReport {
  schoolId: string;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalConcessions: number;
  totalRefunded: number;
  collectionRatePercentage: number;
  invoicesCount: number;
  paidInvoicesCount: number;
  partialInvoicesCount: number;
  overdueInvoicesCount: number;
  recentTransactions: Array<{
    receiptNo: string;
    studentName: string;
    amount: number;
    method: string;
    date: string;
    isSimulated: boolean;
  }>;
  breakdownByClass?: Array<{
    className: string;
    invoiced: number;
    collected: number;
    outstanding: number;
  }>;
  breakdownByFeeHead?: Array<{
    feeHead: string;
    invoiced: number;
    collected: number;
    outstanding: number;
  }>;
}

// ============================================================================
// STAGE 7: EDUNEXA AI CONTRACTS & SCHEMAS
// ============================================================================

export interface AiProviderStatusResponse {
  isConfigured: boolean;
  provider: string;
  model: string;
  message: string;
  supportedFeatures: {
    schoolInformationAssistant: boolean;
    aiQuizGeneration: boolean;
  };
}

export const SchoolInfoContextScope = {
  GENERAL: 'GENERAL',
  ADMISSIONS: 'ADMISSIONS',
  POLICIES: 'POLICIES',
  EVENTS: 'EVENTS',
  TIMETABLES: 'TIMETABLES',
} as const;

export type SchoolInfoContextScopeType = (typeof SchoolInfoContextScope)[keyof typeof SchoolInfoContextScope];

export const SchoolInfoQuerySchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters').max(500, 'Question cannot exceed 500 characters'),
  contextScope: z.enum(['GENERAL', 'ADMISSIONS', 'POLICIES', 'EVENTS', 'TIMETABLES']).default('GENERAL'),
});

export type SchoolInfoQueryDTO = z.infer<typeof SchoolInfoQuerySchema>;

export interface SchoolInfoAnswerResponse {
  question: string;
  answer: string;
  groundedSources: string[];
  isMissingInformation: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  timestamp: string;
  disclaimer: string;
  model: string;
}

export const GenerateQuizDraftSchema = z.object({
  studyMaterial: z.string().min(20, 'Study material must be at least 20 characters').max(15000, 'Study material cannot exceed 15000 characters'),
  subject: z.string().min(2, 'Subject name required'),
  gradeLevel: z.string().min(1, 'Grade level required'),
  questionCount: z.number().int().min(1).max(10).default(3),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
});

export type GenerateQuizDraftDTO = z.infer<typeof GenerateQuizDraftSchema>;

export interface AiGeneratedQuestion {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'TRUE_FALSE';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  suggestedDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isAiGenerated: true;
  reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  teacherFeedback?: string;
}

export const ReviewAiQuestionSchema = z.object({
  questionId: z.string().min(1),
  reviewStatus: z.enum(['APPROVED', 'REJECTED']),
  editedQuestionText: z.string().optional(),
  editedOptions: z.array(z.string()).optional(),
  editedCorrectAnswer: z.string().optional(),
  teacherFeedback: z.string().optional(),
});

export type ReviewAiQuestionDTO = z.infer<typeof ReviewAiQuestionSchema>;

export const ReviewAiQuizDraftSchema = z.object({
  reviews: z.array(ReviewAiQuestionSchema).min(1, 'At least one question review required'),
});

export type ReviewAiQuizDraftDTO = z.infer<typeof ReviewAiQuizDraftSchema>;

export interface AiQuizDraftResponse {
  draftId: string;
  schoolId: string;
  teacherId: string;
  subject: string;
  gradeLevel: string;
  questions: AiGeneratedQuestion[];
  createdAt: string;
  status: 'DRAFT_PENDING_APPROVAL' | 'PARTIALLY_APPROVED' | 'FULLY_APPROVED';
  disclaimer: string;
  model: string;
}

export const ConceptTutorQuerySchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters').max(200),
  question: z.string().min(3, 'Question must be at least 3 characters').max(1000),
  subject: z.string().optional().default('General Science'),
  gradeLevel: z.string().optional().default('Grade 10'),
});

export type ConceptTutorQueryDTO = z.infer<typeof ConceptTutorQuerySchema>;

export interface ConceptTutorAnswerResponse {
  topic: string;
  question: string;
  explanation: string;
  stepByStepGuidance: string[];
  practiceQuestions: Array<{ question: string; hint: string }>;
  revisionTips: string[];
  disclaimer: string;
  model: string;
  isAiGenerated: boolean;
}

// ============================================================================
// UNIVERSAL BULK ACTIONS CONTRACTS
// ============================================================================

export const BulkActionRequestSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one record ID must be selected').max(500, 'Cannot exceed 500 records per batch'),
  action: z.string().min(1, 'Action type is required'),
  params: z.record(z.any()).optional(),
});

export type BulkActionRequestDTO = z.infer<typeof BulkActionRequestSchema>;

export interface BulkItemResult {
  id: string;
  success: boolean;
  message?: string;
  data?: any;
}

export interface BulkActionResponse {
  success: boolean;
  action: string;
  processedCount: number;
  failedCount: number;
  totalRequested: number;
  results: BulkItemResult[];
  message?: string;
  summary?: {
    succeeded: number;
    failed: number;
  };
}

// ============================================================================
// DYNAMIC WEBSITE CMS & PHOTO/VIDEO GALLERY SCHEMAS & CONTRACTS
// ============================================================================

export const UpdateWebsiteContentSchema = z.object({
  heroTitle: z.string().min(2).optional(),
  heroSubtitle: z.string().optional(),
  heroDescription: z.string().optional(),
  heroCtaText: z.string().optional(),
  heroCtaLink: z.string().optional(),
  heroSecondaryCtaText: z.string().optional(),
  heroSecondaryCtaLink: z.string().optional(),
  heroImageUrl: z.string().optional(),
  heroSliderImages: z.array(z.string()).optional(),

  aboutTitle: z.string().min(2).optional(),
  aboutSubtitle: z.string().optional(),
  aboutDescription: z.string().optional(),
  aboutStory: z.string().optional(),
  aboutPhilosophy: z.string().optional(),
  aboutHistory: z.string().optional(),
  aboutImageUrl: z.string().optional(),

  principalName: z.string().min(2).optional(),
  principalDesignation: z.string().optional(),
  principalMessage: z.string().optional(),
  principalPhotoUrl: z.string().optional(),

  visionTitle: z.string().optional(),
  visionDescription: z.string().optional(),
  missionTitle: z.string().optional(),
  missionDescription: z.string().optional(),

  smartClassroomsHeading: z.string().optional(),
  smartClassroomsDescription: z.string().optional(),
  smartClassroomsImageUrl: z.string().optional(),

  sportsActivitiesHeading: z.string().optional(),
  sportsActivitiesDescription: z.string().optional(),
  sportsActivitiesImageUrl: z.string().optional(),

  admissionHeading: z.string().optional(),
  admissionDescription: z.string().optional(),
  admissionImageUrl: z.string().optional(),
  admissionProcedure: z.any().optional(),
  admissionEligibility: z.any().optional(),
  admissionDates: z.any().optional(),

  admissionFormTitle: z.string().optional(),
  admissionFormDescription: z.string().optional(),
  admissionFormUrl: z.string().optional().nullable(),

  officeTimings: z.string().optional(),
  mapEmbedUrl: z.string().optional().nullable(),

  sectionVisibility: z.record(z.boolean()).optional(),
  sectionOrder: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export type UpdateWebsiteContentDTO = z.infer<typeof UpdateWebsiteContentSchema>;

export const CreateHighlightSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  iconName: z.string().default('Award'),
  imageUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateHighlightDTO = z.infer<typeof CreateHighlightSchema>;

export const CreateFacilitySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  category: z.string().default('Academic'),
  imageUrl: z.string().min(1),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateFacilityDTO = z.infer<typeof CreateFacilitySchema>;

export const CreateAchievementSchema = z.object({
  studentName: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(5),
  competition: z.string().min(2),
  academicYear: z.string().default('2026-2027'),
  photoUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateAchievementDTO = z.infer<typeof CreateAchievementSchema>;

export const CreateTestimonialSchema = z.object({
  parentName: z.string().min(2),
  parentRole: z.string().default('Parent'),
  content: z.string().min(5),
  avatarUrl: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).default(5),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateTestimonialDTO = z.infer<typeof CreateTestimonialSchema>;

export const CreateDocumentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.string().default('GENERAL'),
  fileUrl: z.string().min(1),
  fileSize: z.string().optional().nullable(),
  fileType: z.string().default('PDF'),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateDocumentDTO = z.infer<typeof CreateDocumentSchema>;

export const CreateGalleryCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateGalleryCategoryDTO = z.infer<typeof CreateGalleryCategorySchema>;

export const CreateGalleryItemSchema = z.object({
  categoryId: z.string().min(1),
  mediaType: z.enum(['PHOTO', 'VIDEO', 'IMAGE']).default('PHOTO'),
  title: z.string().min(2),
  caption: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable().default(''),
  thumbnailUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateGalleryItemDTO = z.infer<typeof CreateGalleryItemSchema>;

export interface PublicWebsiteData {
  school: {
    id: string;
    slug: string;
    name: string;
    code: string;
    logoUrl?: string | null;
    motto?: string | null;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    websiteUrl?: string | null;
    brandingConfig?: any;
    establishedYear?: number | null;
  };
  content: any;
  highlights: any[];
  facilities: any[];
  academicPrograms: any[];
  faculty: any[];
  upcomingEvents: any[];
  latestNotices: any[];
  achievements: any[];
  testimonials: any[];
  galleryPreview: {
    photos: any[];
    videos: any[];
  };
  downloadableDocs: any[];
}

// ============================================================================
// SECTION 3: ADMISSION MANAGEMENT & ENQUIRIES SCHEMAS & CONTRACTS
// ============================================================================

export const EnquiryStatusEnum = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  FOLLOW_UP_REQUIRED: 'FOLLOW_UP_REQUIRED',
  CONVERTED: 'CONVERTED',
  CLOSED: 'CLOSED',
} as const;

export type EnquiryStatusType = (typeof EnquiryStatusEnum)[keyof typeof EnquiryStatusEnum];

export const CreateAdmissionEnquirySchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  studentName: z.string().min(2, 'Student name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  applyingClass: z.string().min(1, 'Please select the class applying for'),
  message: z.string().optional().nullable(),
  source: z.string().default('WEBSITE_POPUP'),
});
export type CreateAdmissionEnquiryDTO = z.infer<typeof CreateAdmissionEnquirySchema>;

export const UpdateAdmissionEnquirySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP_REQUIRED', 'CONVERTED', 'CLOSED']).optional(),
  internalNotes: z.string().optional().nullable(),
});
export type UpdateAdmissionEnquiryDTO = z.infer<typeof UpdateAdmissionEnquirySchema>;

export const SubmitOnlineApplicationSchema = z.object({
  // Student Information
  studentFirstName: z.string().min(2, 'Student first name is required'),
  studentLastName: z.string().min(1, 'Student last name is required'),
  dateOfBirth: z.string().min(4, 'Valid date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  bloodGroup: z.string().optional().nullable(),
  studentEmail: z.string().email().optional().nullable().or(z.literal('')),
  residentialAddress: z.string().min(5, 'Residential address is required'),

  // Guardian Information
  guardianName: z.string().min(2, 'Parent/guardian name is required'),
  guardianRelationship: z.string().optional().default('Parent'),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  guardianEmail: z.string().email('Valid guardian email is required'),
  guardianPhone: z.string().min(8, 'Valid guardian phone is required'),

  // Academic Information
  applyingClass: z.string().min(1, 'Applying class is required'),
  academicSession: z.string().optional().default('2026-2027'),
  previousSchool: z.string().optional().nullable(),
  previousClass: z.string().optional().nullable(),
  previousMarksPercentage: z.number().min(0).max(100).optional().nullable(),
  marksPercentage: z.number().min(0).max(100).optional().nullable(),

  // Uploaded Documents
  documents: z
    .array(
      z.object({
        type: z.string(),
        name: z.string().optional(),
        fileName: z.string().optional(),
        url: z.string().optional(),
        fileUrl: z.string().optional(),
        size: z.string().optional(),
        fileSize: z.string().optional(),
        uploadedAt: z.string().optional(),
      })
    )
    .optional()
    .default([]),

  // Declaration
  declarationAccepted: z.boolean().optional(),
  declarationAgreed: z.boolean().optional(),
}).refine((data) => data.declarationAccepted === true || data.declarationAgreed === true, {
  message: 'You must confirm and accept the admission declaration',
  path: ['declarationAgreed'],
});
export type SubmitOnlineApplicationDTO = z.infer<typeof SubmitOnlineApplicationSchema>;

export const TrackApplicationStatusSchema = z.object({
  applicationNumber: z.string().min(3, 'Application reference number is required'),
  verificationContact: z.string().min(3, 'Parent email or phone number is required'),
});
export type TrackApplicationStatusDTO = z.infer<typeof TrackApplicationStatusSchema>;

export const AdmissionReviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'WAITLISTED']),
  reviewNotes: z.string().optional().nullable(),
  assignedClass: z.string().optional(),
  assignedSection: z.string().optional(),
  missingDocuments: z
    .array(
      z.object({
        type: z.string(),
        notes: z.string().optional(),
        requestedAt: z.string().optional(),
      })
    )
    .optional(),
});
export type AdmissionReviewDecisionDTO = z.infer<typeof AdmissionReviewDecisionSchema>;

export const UpdateAdmissionConfigSchema = z.object({
  admissionNoticeOpen: z.boolean().optional(),
  admissionNoticeTitle: z.string().optional(),
  admissionNoticeDesc: z.string().optional(),
  admissionSession: z.string().optional(),
  admissionDates: z.any().optional(),
  admissionEligibility: z.any().optional(),
  admissionProcedure: z.any().optional(),
  admissionFormTitle: z.string().optional(),
  admissionFormDescription: z.string().optional(),
  admissionFormUrl: z.string().optional().nullable(),
  admissionPopupEnabled: z.boolean().optional(),
  admissionPopupHeading: z.string().optional(),
  admissionPopupDescription: z.string().optional(),
  admissionPopupFrequency: z.enum(['EVERY_VISIT', 'ONCE_PER_SESSION', 'ONCE_PER_DAY']).optional(),
  requiredDocumentsConfig: z
    .array(
      z.object({
        type: z.string(),
        label: z.string(),
        isRequired: z.boolean(),
        description: z.string().optional(),
      })
    )
    .optional(),
});
export type UpdateAdmissionConfigDTO = z.infer<typeof UpdateAdmissionConfigSchema>;

// ============================================================================
// 15. ID CARD MANAGEMENT & TEMPLATES (SECTION 4)
// ============================================================================

export const GenerateIdCardSchema = z.object({
  holderType: z.enum(['STUDENT', 'STAFF', 'TEACHER']),
  profileId: z.string().min(1, 'Profile ID is required'),
  templateId: z.string().optional(),
});
export type GenerateIdCardDTO = z.infer<typeof GenerateIdCardSchema>;

export const BulkGenerateIdCardsSchema = z.object({
  targetType: z.enum([
    'CLASS',
    'SECTION',
    'ALL_TEACHERS',
    'ALL_STAFF',
    'DEPARTMENT_STAFF',
    'SELECTED_STUDENTS',
    'SELECTED_STAFF',
  ]),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  departmentId: z.string().optional(),
  profileIds: z.array(z.string()).optional(),
  templateId: z.string().optional(),
});
export type BulkGenerateIdCardsDTO = z.infer<typeof BulkGenerateIdCardsSchema>;

export const IdCardTemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  description: z.string().optional(),
  targetRole: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'ALL']).default('ALL'),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  primaryColor: z.string().default('#1e3a8a'),
  secondaryColor: z.string().default('#d97706'),
  headerTextColor: z.string().default('#ffffff'),
  cardOrientation: z.enum(['LANDSCAPE', 'PORTRAIT']).default('LANDSCAPE'),
  showBloodGroup: z.boolean().default(true),
  showParentContact: z.boolean().default(true),
  showEmergencyPhone: z.boolean().default(true),
  showPrincipalSign: z.boolean().default(true),
  showSchoolSeal: z.boolean().default(true),
  showBarcode: z.boolean().default(false),
  customTermsText: z.string().optional(),
  layoutConfig: z.any().optional(),
});
export type IdCardTemplateDTO = z.infer<typeof IdCardTemplateSchema>;

export const UpdateIdCardStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']),
  reason: z.string().optional(),
});
export type UpdateIdCardStatusDTO = z.infer<typeof UpdateIdCardStatusSchema>;

// ============================================================================
// EXAMINATION ADMIT CARD CONTRACTS (SECTION 5)
// ============================================================================

export interface AdmitCardTimetableEntry {
  subjectName: string;
  subjectCode: string;
  examDate: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  roomNumber: string;
  maxMarks: number;
}

export const GenerateAdmitCardSchema = z.object({
  studentProfileId: z.string().min(1, 'Student ID is required'),
  examTitle: z.string().min(1, 'Examination title is required'),
  examType: z.string().optional(),
  centerName: z.string().optional(),
  roomNumber: z.string().optional(),
  candidateInstructions: z.string().optional(),
});
export type GenerateAdmitCardDTO = z.infer<typeof GenerateAdmitCardSchema>;

export const BulkGenerateAdmitCardsSchema = z.object({
  targetType: z.enum(['CLASS', 'SECTION', 'SELECTED_STUDENTS', 'ALL_ELIGIBLE']).optional(),
  className: z.string().optional(),
  sectionName: z.string().optional(),
  studentProfileIds: z.array(z.string()).optional(),
  selectedIds: z.array(z.string()).optional(),
  allEligible: z.boolean().optional(),
  examTitle: z.string().min(1, 'Examination title is required'),
  examType: z.string().optional(),
  academicSessionId: z.string().optional(),
  centerName: z.string().optional(),
  roomNumber: z.string().optional(),
  defaultRoomNumber: z.string().optional(),
  candidateInstructions: z.string().optional(),
  skipUnpaidFees: z.boolean().optional(),
  feeThresholdAmount: z.number().optional(),
  skipLowAttendance: z.boolean().optional(),
  minAttendancePercent: z.number().optional(),
});
export type BulkGenerateAdmitCardsDTO = z.infer<typeof BulkGenerateAdmitCardsSchema>;

export const PublishAdmitCardsSchema = z.object({
  cardIds: z.array(z.string()).optional(),
  admitCardIds: z.array(z.string()).optional(),
  action: z.enum(['PUBLISH', 'UNPUBLISH', 'WITHHOLD', 'REVOKE']).optional(),
  publish: z.boolean().optional(),
  enforceClearance: z.boolean().optional(),
  examTitle: z.string().optional(),
  className: z.string().optional(),
});
export type PublishAdmitCardsDTO = z.infer<typeof PublishAdmitCardsSchema>;

export const UpdateAdmitCardClearanceSchema = z.object({
  clearanceStatus: z.enum(['CLEARED', 'PENDING_FEES', 'PENDING_ATTENDANCE', 'PENDING_ADMIN', 'BLOCKED']),
  remarks: z.string().optional(),
  reason: z.string().optional(),
});
export type UpdateAdmitCardClearanceDTO = z.infer<typeof UpdateAdmitCardClearanceSchema>;

// ============================================================================
// SECTION 6: QUESTION BANK, QUESTION PAPER & ONLINE EXAM CONTRACTS
// ============================================================================

export const QuestionBankMetadataSchema = z.object({
  choices: z
    .array(
      z.object({
        id: z.string().optional(),
        choiceText: z.string(),
        isCorrect: z.boolean(),
        orderIndex: z.number().int().optional(),
      })
    )
    .optional(),
  blanks: z
    .array(
      z.object({
        index: z.number().int(),
        acceptedAnswers: z.array(z.string()),
      })
    )
    .optional(),
  matchPairs: z
    .object({
      leftItems: z.array(z.string()),
      rightItems: z.array(z.string()),
      correctPairs: z.array(
        z.object({
          leftIndex: z.number().int(),
          rightIndex: z.number().int(),
        })
      ),
    })
    .optional(),
  numerical: z
    .object({
      expectedNumber: z.number(),
      tolerance: z.number().min(0).default(0.01),
      unit: z.string().optional(),
    })
    .optional(),
  sampleAnswer: z.string().optional(),
  evaluationRubric: z.string().optional(),
  maxWordCount: z.number().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
}).passthrough();
export type QuestionBankMetadata = z.infer<typeof QuestionBankMetadataSchema>;

export const CreateQuestionBankItemSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().optional(),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  questionType: z.enum([
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'TRUE_FALSE',
    'FILL_IN_BLANKS',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'DESCRIPTIVE',
    'MATCH_THE_FOLLOWING',
    'NUMERICAL',
    'FILE_UPLOAD',
  ]),
  questionText: z.string().min(3, 'Question text must be at least 3 characters'),
  marks: z.number().positive('Marks must be positive').default(1.0),
  negativeMarks: z.number().min(0).default(0.0),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
  metadata: QuestionBankMetadataSchema.optional(),
});
export type CreateQuestionBankItemDTO = z.infer<typeof CreateQuestionBankItemSchema>;

export const UpdateQuestionBankItemSchema = CreateQuestionBankItemSchema.partial();
export type UpdateQuestionBankItemDTO = z.infer<typeof UpdateQuestionBankItemSchema>;

export const QuestionPaperSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string().optional(),
  marks: z.number().optional(),
});
export type QuestionPaperSection = z.infer<typeof QuestionPaperSectionSchema>;

export const QuestionPaperItemSchema = z.object({
  id: z.string().optional(),
  questionBankItemId: z.string().optional(),
  sectionName: z.string().default('Section A'),
  orderIndex: z.number().int().default(0),
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.enum([
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'TRUE_FALSE',
    'FILL_IN_BLANKS',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'DESCRIPTIVE',
    'MATCH_THE_FOLLOWING',
    'NUMERICAL',
    'FILE_UPLOAD',
  ]),
  marks: z.number().positive().default(1.0),
  negativeMarks: z.number().min(0).default(0.0),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
  metadata: QuestionBankMetadataSchema.optional(),
});
export type QuestionPaperItemDTO = z.infer<typeof QuestionPaperItemSchema>;

export const CreateQuestionPaperSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().optional(),
  academicSessionId: z.string().optional(),
  examScheduleId: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().positive().default(60),
  totalMarks: z.number().positive().default(50.0),
  passingMarks: z.number().positive().default(20.0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  sections: z.array(QuestionPaperSectionSchema).optional(),
  items: z.array(QuestionPaperItemSchema).min(1, 'Question paper must have at least one question'),
});
export type CreateQuestionPaperDTO = z.infer<typeof CreateQuestionPaperSchema>;

export const UpdateQuestionPaperSchema = CreateQuestionPaperSchema.partial();
export type UpdateQuestionPaperDTO = z.infer<typeof UpdateQuestionPaperSchema>;

export const StartAssessmentAttemptSchema = z.object({
  questionPaperId: z.string().min(1, 'Question Paper ID is required'),
});
export type StartAssessmentAttemptDTO = z.infer<typeof StartAssessmentAttemptSchema>;

export const StudentAssessmentAnswerDataSchema = z.object({
  selectedChoiceIds: z.array(z.string()).optional(),
  textAnswer: z.string().optional(),
  blankAnswers: z.array(z.string()).optional(),
  matchedPairs: z
    .array(
      z.object({
        leftIndex: z.number().int(),
        rightIndex: z.number().int(),
      })
    )
    .optional(),
  numericalValue: z.number().optional(),
  fileUrl: z.string().optional(),
}).passthrough();
export type StudentAssessmentAnswerData = z.infer<typeof StudentAssessmentAnswerDataSchema>;

export const SaveAssessmentAnswerSchema = z.object({
  attemptId: z.string().min(1),
  paperItemId: z.string().min(1),
  studentAnswer: StudentAssessmentAnswerDataSchema,
});
export type SaveAssessmentAnswerDTO = z.infer<typeof SaveAssessmentAnswerSchema>;

export const SubmitAssessmentAttemptSchema = z.object({
  attemptId: z.string().min(1),
  answers: z
    .array(
      z.object({
        paperItemId: z.string().min(1),
        studentAnswer: StudentAssessmentAnswerDataSchema,
      })
    )
    .optional(),
  isAutoSubmitted: z.boolean().default(false),
});
export type SubmitAssessmentAttemptDTO = z.infer<typeof SubmitAssessmentAttemptSchema>;

export const SingleItemEvaluationSchema = z.object({
  paperItemId: z.string().min(1),
  marksAwarded: z.number().min(0),
  teacherRemarks: z.string().optional(),
});
export type SingleItemEvaluation = z.infer<typeof SingleItemEvaluationSchema>;

export const EvaluateAssessmentAttemptSchema = z.object({
  attemptId: z.string().min(1),
  status: z.enum(['SUBMITTED', 'EVALUATED', 'PUBLISHED']).default('EVALUATED'),
  teacherFeedback: z.string().optional(),
  itemEvaluations: z.array(SingleItemEvaluationSchema),
});
export type EvaluateAssessmentAttemptDTO = z.infer<typeof EvaluateAssessmentAttemptSchema>;

export const PublishAssessmentResultsSchema = z.object({
  questionPaperId: z.string().min(1),
  publish: z.boolean().default(true),
  syncToExamMarks: z.boolean().default(true),
});
export type PublishAssessmentResultsDTO = z.infer<typeof PublishAssessmentResultsSchema>;






