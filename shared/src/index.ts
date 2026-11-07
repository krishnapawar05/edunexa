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
  LIBRARIAN: 'LIBRARIAN',
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
  photoUrl: z.string().optional().or(z.literal('')),
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
  photoUrl: z.string().optional().or(z.literal('')),
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

// ============================================================================
// SECTION 7: PROFESSIONAL MARKSHEET & REPORT CARD GENERATION
// ============================================================================

export const MarksheetStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PUBLISHED: 'PUBLISHED',
  WITHHELD: 'WITHHELD',
  CORRECTED: 'CORRECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type MarksheetStatusType = (typeof MarksheetStatus)[keyof typeof MarksheetStatus];

export interface SubjectMarksEntry {
  subjectCode: string;
  subjectName: string;
  theoryMaxMarks: number;
  theoryMarksObtained: number;
  practicalMaxMarks?: number;
  practicalMarksObtained?: number;
  totalMaxMarks: number;
  totalMarksObtained: number;
  percentage: number;
  grade: string;
  remarks?: string;
}

export const CreateMarksheetTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  examType: z.string().optional().default('ALL'),
  isDefault: z.boolean().optional().default(false),
  layoutStyle: z.string().default('FORMAL_CBSE'),
  primaryColor: z.string().default('#1e3a8a'),
  secondaryColor: z.string().default('#d97706'),
  headerTextColor: z.string().default('#ffffff'),
  logoUrl: z.string().optional(),
  stampUrl: z.string().optional(),
  principalSignatureUrl: z.string().optional(),
  teacherSignatureUrl: z.string().optional(),
  showStudentPhoto: z.boolean().default(true),
  showAttendance: z.boolean().default(true),
  showRank: z.boolean().default(false),
  showDivision: z.boolean().default(true),
  showPracticalMarks: z.boolean().default(true),
  gradingScaleJson: z.any().optional(),
  passingCriteriaJson: z.any().optional(),
  customRemarks: z.string().optional(),
});
export type CreateMarksheetTemplateDTO = z.infer<typeof CreateMarksheetTemplateSchema>;

export const UpdateMarksheetTemplateSchema = CreateMarksheetTemplateSchema.partial();
export type UpdateMarksheetTemplateDTO = z.infer<typeof UpdateMarksheetTemplateSchema>;

export const GenerateIndividualMarksheetSchema = z.object({
  studentProfileId: z.string().min(1, 'Student ID is required'),
  examTitle: z.string().min(1, 'Examination title is required'),
  examType: z.string().optional().default('ANNUAL'),
  academicSessionId: z.string().optional(),
  templateId: z.string().optional(),
  classTeacherRemarks: z.string().optional(),
  principalRemarks: z.string().optional(),
});
export type GenerateIndividualMarksheetDTO = z.infer<typeof GenerateIndividualMarksheetSchema>;

export const BulkGenerateMarksheetsSchema = z.object({
  examTitle: z.string().min(1, 'Examination title is required'),
  examType: z.string().optional().default('ANNUAL'),
  academicSessionId: z.string().optional(),
  className: z.string().optional(),
  sectionName: z.string().optional(),
  allEligible: z.boolean().optional().default(true),
  templateId: z.string().optional(),
  studentProfileIds: z.array(z.string()).optional(),
  classTeacherRemarks: z.string().optional(),
  principalRemarks: z.string().optional(),
});
export type BulkGenerateMarksheetsDTO = z.infer<typeof BulkGenerateMarksheetsSchema>;

export const PublishMarksheetsSchema = z.object({
  marksheetIds: z.array(z.string()).optional(),
  action: z.enum(['PUBLISH', 'UNPUBLISH', 'WITHHOLD']).default('PUBLISH'),
  examTitle: z.string().optional(),
  className: z.string().optional(),
});
export type PublishMarksheetsDTO = z.infer<typeof PublishMarksheetsSchema>;

export const CorrectMarksheetSchema = z.object({
  marksheetId: z.string().min(1, 'Marksheet ID is required'),
  reason: z.string().min(3, 'Correction justification reason is required'),
  updatedSubjectMarks: z
    .array(
      z.object({
        subjectCode: z.string(),
        subjectName: z.string(),
        theoryMarksObtained: z.number().min(0).optional(),
        practicalMarksObtained: z.number().min(0).optional(),
        remarks: z.string().optional(),
      })
    )
    .optional(),
  classTeacherRemarks: z.string().optional(),
  principalRemarks: z.string().optional(),
});
export type CorrectMarksheetDTO = z.infer<typeof CorrectMarksheetSchema>;

export const UpdateGradingCriteriaSchema = z.object({
  schemeName: z.string().optional(),
  passingPercentage: z.number().min(0).max(100).default(33),
  divisionCriteria: z
    .object({
      distinction: z.number().default(75),
      firstDivision: z.number().default(60),
      secondDivision: z.number().default(45),
      thirdDivision: z.number().default(33),
    })
    .optional(),
  grades: z
    .array(
      z.object({
        grade: z.string(),
        minPercentage: z.number().min(0).max(100),
        maxPercentage: z.number().min(0).max(100),
        gradePoint: z.number().default(0),
        description: z.string().optional(),
      })
    )
    .min(1, 'At least one grade boundary is required'),
});
export type UpdateGradingCriteriaDTO = z.infer<typeof UpdateGradingCriteriaSchema>;

// ==============================================================================
// SECTION 8: STUDENT, PARENT & TEACHER PANELS SCHEMAS
// ==============================================================================

export const ScheduleMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  description: z.string().optional(),
  meetingType: z.enum([
    'PARENT_TEACHER',
    'PTM',
    'STAFF_INTERNAL',
    'STUDENT_COUNSELING',
    'ACADEMIC_REVIEW',
    'DISCIPLINARY',
    'SPECIAL_COUNSELING',
  ]).default('PARENT_TEACHER'),
  studentProfileId: z.string().optional(),
  guardianUserId: z.string().optional(),
  scheduledDate: z.string().min(1, 'Meeting date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  meetingMode: z.enum(['ONLINE', 'IN_PERSON']).default('ONLINE'),
  locationOrRoom: z.string().optional(),
  joiningUrl: z.string().optional(),
  notes: z.string().optional(),
});
export type ScheduleMeetingDTO = z.infer<typeof ScheduleMeetingSchema>;

export const UpdateMeetingStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  notes: z.string().optional(),
  joiningUrl: z.string().optional(),
  scheduledDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  meetingMode: z.enum(['ONLINE', 'IN_PERSON']).optional(),
  locationOrRoom: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});
export type UpdateMeetingStatusDTO = z.infer<typeof UpdateMeetingStatusSchema>;

export const SendCommunicationMessageSchema = z.object({
  recipientUserId: z.string().optional(),
  studentProfileId: z.string().optional(),
  channel: z.enum(['PARENT_TEACHER', 'STUDENT_TEACHER', 'ANNOUNCEMENT']).default('PARENT_TEACHER'),
  subject: z.string().optional(),
  messageContent: z.string().min(1, 'Message content cannot be empty'),
  attachmentUrl: z.string().optional(),
});
export type SendCommunicationMessageDTO = z.infer<typeof SendCommunicationMessageSchema>;

export const AddStudentRemarkSchema = z.object({
  studentProfileId: z.string().min(1, 'Student ID is required'),
  academicSessionId: z.string().optional(),
  category: z.enum(['GENERAL', 'ACADEMIC', 'DISCIPLINE', 'REPORT_CARD', 'ATTENDANCE']).default('GENERAL'),
  remark: z.string().min(1, 'Remark is required'),
  isPrivate: z.boolean().default(false),
});
export type AddStudentRemarkDTO = z.infer<typeof AddStudentRemarkSchema>;

// ==============================================================================
// SECTION 11: LIBRARY MANAGEMENT SYSTEM SCHEMAS
// ==============================================================================

export const LibraryCategoryList = [
  'Science',
  'Mathematics',
  'English',
  'Hindi',
  'Computers',
  'History',
  'Geography',
  'General Knowledge',
] as const;

export const BookStatusList = ['AVAILABLE', 'OUT_OF_STOCK', 'ARCHIVED'] as const;
export const BookConditionList = ['GOOD', 'DAMAGED', 'LOST'] as const;
export const BookIssueStatusList = ['ISSUED', 'RETURNED', 'OVERDUE', 'LOST'] as const;
export const FineStatusList = ['NONE', 'PENDING', 'PAID', 'WAIVED'] as const;

export const CreateLibraryBookSchema = z.object({
  title: z.string().min(1, 'Book title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().optional(),
  category: z.string().optional(),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  publicationYear: z.number().int().optional(),
  language: z.string().default('English'),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  totalCopies: z.number().int().min(1).default(1),
  availableCopies: z.number().int().min(0).optional(),
  shelfLocation: z.string().optional(),
  status: z.enum(BookStatusList).default('AVAILABLE'),
});
export type CreateLibraryBookDTO = z.infer<typeof CreateLibraryBookSchema>;

export const UpdateLibraryBookSchema = CreateLibraryBookSchema.partial();
export type UpdateLibraryBookDTO = z.infer<typeof UpdateLibraryBookSchema>;

export const IssueBookSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  studentProfileId: z.string().min(1, 'Student ID is required'),
  issueDate: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
});
export type IssueBookDTO = z.infer<typeof IssueBookSchema>;

export const ReturnBookSchema = z.object({
  returnCondition: z.enum(BookConditionList).default('GOOD'),
  returnDate: z.string().optional(),
  notes: z.string().optional(),
  waiveFine: z.boolean().optional(),
});
export type ReturnBookDTO = z.infer<typeof ReturnBookSchema>;

export const UpdateFineStatusSchema = z.object({
  fineStatus: z.enum(['NONE', 'PENDING', 'PAID', 'WAIVED']),
  notes: z.string().optional(),
});
export type UpdateFineStatusDTO = z.infer<typeof UpdateFineStatusSchema>;

export const UpdateLibrarySettingSchema = z.object({
  finePerDay: z.number().min(0).optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  maxFineAmount: z.number().min(0).optional(),
  maxBooksPerStudent: z.number().int().min(1).optional(),
  loanDurationDays: z.number().int().min(1).optional(),
});
export type UpdateLibrarySettingDTO = z.infer<typeof UpdateLibrarySettingSchema>;

// ==============================================================================
// SECTION 9: INTERNAL CHAT, MESSAGING, MEETINGS & CALENDAR SCHEMAS
// ==============================================================================

export const CreateConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']).default('DIRECT'),
  participantIds: z.array(z.string()).min(1, 'At least one participant required'),
  title: z.string().optional(),
  groupType: z
    .enum(['CLASS_GROUP', 'SUBJECT_GROUP', 'DEPARTMENT_GROUP', 'ADMIN_GROUP', 'PTM_GROUP', 'GENERAL_GROUP'])
    .optional(),
  initialMessage: z.string().optional(),
});
export type CreateConversationDTO = z.infer<typeof CreateConversationSchema>;

export const SendChatMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content cannot be empty'),
  messageType: z.enum(['TEXT', 'FILE', 'SYSTEM']).default('TEXT'),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        fileSize: z.number().int().min(1),
      })
    )
    .optional(),
});
export type SendChatMessageDTO = z.infer<typeof SendChatMessageSchema>;

export const AddGroupParticipantsSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID required'),
});
export type AddGroupParticipantsDTO = z.infer<typeof AddGroupParticipantsSchema>;

export const ReportMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  reason: z.string().min(3, 'Detailed reporting reason required'),
});
export type ReportMessageDTO = z.infer<typeof ReportMessageSchema>;

export const ModerateReportedMessageSchema = z.object({
  action: z.enum(['WARNING', 'MESSAGE_REMOVED', 'DISMISSED']),
  moderatorNotes: z.string().optional(),
});
export type ModerateReportedMessageDTO = z.infer<typeof ModerateReportedMessageSchema>;

export const UpdateCommunicationPermissionConfigSchema = z.object({
  allowStudentToStudent: z.boolean().optional(),
  allowParentToParent: z.boolean().optional(),
  allowTeacherToStudent: z.boolean().optional(),
  allowTeacherToParent: z.boolean().optional(),
  allowAdminToAll: z.boolean().optional(),
  allowFileSharing: z.boolean().optional(),
  maxAttachmentSizeBytes: z.number().int().positive().optional(),
});
export type UpdateCommunicationPermissionConfigDTO = z.infer<typeof UpdateCommunicationPermissionConfigSchema>;

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().optional().nullable(),
  category: z.enum(['ACADEMIC', 'EXAM', 'MEETING', 'HOLIDAY', 'SPORTS', 'PTM', 'CULTURAL', 'OTHER']).default('ACADEMIC'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isAllDay: z.boolean().default(false),
  location: z.string().optional().nullable(),
  targetAudience: z.enum(['ALL', 'TEACHERS_ONLY', 'STUDENTS_ONLY', 'PARENTS_ONLY']).default('ALL'),
  classId: z.string().optional().nullable(),
});
export type CreateCalendarEventDTO = z.infer<typeof CreateCalendarEventSchema>;

export const UpdateCalendarEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').optional(),
  description: z.string().optional().nullable(),
  category: z.enum(['ACADEMIC', 'EXAM', 'MEETING', 'HOLIDAY', 'SPORTS', 'PTM', 'CULTURAL', 'OTHER']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isAllDay: z.boolean().optional(),
  location: z.string().optional().nullable(),
  targetAudience: z.enum(['ALL', 'TEACHERS_ONLY', 'STUDENTS_ONLY', 'PARENTS_ONLY']).optional(),
  classId: z.string().optional().nullable(),
  googleMeetLink: z.string().optional().nullable(),
});
export type UpdateCalendarEventDTO = z.infer<typeof UpdateCalendarEventSchema>;

export const ConfigureGoogleWorkspaceSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().optional(),
  connectedEmail: z.string().email().optional(),
  calendarSyncEnabled: z.boolean().default(true),
  meetIntegrationEnabled: z.boolean().default(true),
  primaryCalendarId: z.string().optional(),
  status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR']).default('CONNECTED'),
});
export type ConfigureGoogleWorkspaceDTO = z.infer<typeof ConfigureGoogleWorkspaceSchema>;

// ============================================================================
// SECTION 10: ADMISSION, DOCUMENT & DOWNLOAD CENTRE SCHEMAS
// ============================================================================

export const DocumentCategoryEnum = [
  'ADMISSION_FORM',
  'PROSPECTUS',
  'FEE_STRUCTURE',
  'ACADEMIC_CALENDAR',
  'GUIDELINES',
  'UNIFORM_INFO',
  'HOLIDAY_LIST',
  'SYLLABUS',
  'CIRCULAR',
  'GENERAL',
] as const;

export const DocumentAudienceEnum = [
  'PUBLIC',
  'ALL_STUDENTS',
  'CLASS_SPECIFIC',
  'TEACHERS_ONLY',
  'STAFF_ONLY',
] as const;

export const CertificateTypeEnum = [
  'BONAFIDE',
  'TRANSFER_CERTIFICATE',
  'CHARACTER',
  'MIGRATION',
  'MERIT',
] as const;

export const CreateDownloadableDocSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  category: z.enum(DocumentCategoryEnum).default('GENERAL'),
  fileUrl: z.string().min(1, 'File URL or storage path is required'),
  fileSize: z.string().optional(),
  fileType: z.string().default('PDF'),
  targetAudience: z.enum(DocumentAudienceEnum).default('PUBLIC'),
  academicSessionId: z.string().optional(),
  classId: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
  publicationStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});
export type CreateDownloadableDocDTO = z.infer<typeof CreateDownloadableDocSchema>;

export const UpdateDownloadableDocSchema = CreateDownloadableDocSchema.partial();
export type UpdateDownloadableDocDTO = z.infer<typeof UpdateDownloadableDocSchema>;

export const IssueCertificateSchema = z.object({
  studentProfileId: z.string().min(1, 'Student ID is required'),
  certificateType: z.enum(CertificateTypeEnum).default('BONAFIDE'),
  academicSessionId: z.string().optional(),
  reason: z.string().optional(),
  remarks: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type IssueCertificateDTO = z.infer<typeof IssueCertificateSchema>;

export const UpdateCertificateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'REVOKED']),
  remarks: z.string().optional(),
});
export type UpdateCertificateStatusDTO = z.infer<typeof UpdateCertificateStatusSchema>;

export const RecordDocumentAccessSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  documentId: z.string().min(1, 'Document ID is required'),
  documentTitle: z.string().min(1, 'Document title is required'),
  targetStudentId: z.string().optional(),
  action: z.enum(['PREVIEW', 'DOWNLOAD', 'PRINT']).default('DOWNLOAD'),
});
export type RecordDocumentAccessDTO = z.infer<typeof RecordDocumentAccessSchema>;

// ============================================================================
// SECTION 12: STAFF PAYROLL SCHEMAS
// ============================================================================

export const GeneratePayrollSchema = z.object({
  staffProfileId: z.string().uuid('Valid Staff ID is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2050),
  basicSalary: z.number().min(0, 'Basic salary cannot be negative'),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});
export type GeneratePayrollDTO = z.infer<typeof GeneratePayrollSchema>;

export const UpdatePayrollStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'CANCELLED']),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdatePayrollStatusDTO = z.infer<typeof UpdatePayrollStatusSchema>;

// ============================================================================
// SECTION 12: TRANSPORT MANAGEMENT SCHEMAS
// ============================================================================

export const CreateTransportVehicleSchema = z.object({
  registrationNumber: z.string().min(3, 'Registration number is required'),
  vehicleModel: z.string().min(2, 'Vehicle model is required'),
  capacity: z.number().int().min(1).default(40),
  driverId: z.string().uuid().optional().nullable(),
  insuranceExpiry: z.string().optional().nullable(),
  fitnessExpiry: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
});
export type CreateTransportVehicleDTO = z.infer<typeof CreateTransportVehicleSchema>;

export const CreateTransportDriverSchema = z.object({
  name: z.string().min(2, 'Driver name is required'),
  licenseNumber: z.string().min(4, 'License number is required'),
  phone: z.string().min(7, 'Valid contact phone number is required'),
  emergencyContact: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
export type CreateTransportDriverDTO = z.infer<typeof CreateTransportDriverSchema>;

export const CreateTransportRouteSchema = z.object({
  routeName: z.string().min(3, 'Route name is required'),
  routeCode: z.string().min(2, 'Route code is required'),
  vehicleId: z.string().uuid().optional().nullable(),
  startLocation: z.string().min(2, 'Start location is required'),
  endLocation: z.string().min(2, 'End location is required'),
  monthlyFare: z.number().min(0).default(1500),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
  stops: z.array(
    z.object({
      stopName: z.string().min(2),
      stopOrder: z.number().int().min(1),
      pickupTime: z.string().min(2),
      dropTime: z.string().min(2),
      fare: z.number().min(0).optional(),
    })
  ).optional(),
});
export type CreateTransportRouteDTO = z.infer<typeof CreateTransportRouteSchema>;

export const AllocateStudentTransportSchema = z.object({
  studentProfileId: z.string().uuid('Valid Student ID is required'),
  routeId: z.string().uuid('Valid Route ID is required'),
  stopId: z.string().uuid().optional().nullable(),
  pickupType: z.enum(['BOTH', 'PICKUP_ONLY', 'DROP_ONLY']).default('BOTH'),
  startDate: z.string().optional(),
  monthlyFare: z.number().min(0).default(1500),
  notes: z.string().optional(),
});
export type AllocateStudentTransportDTO = z.infer<typeof AllocateStudentTransportSchema>;

// ============================================================================
// SECTION 12: INVENTORY MANAGEMENT SCHEMAS
// ============================================================================

export const CreateInventoryCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  code: z.string().min(2, 'Category code is required'),
  description: z.string().optional(),
});
export type CreateInventoryCategoryDTO = z.infer<typeof CreateInventoryCategorySchema>;

export const CreateInventoryItemSchema = z.object({
  categoryId: z.string().uuid('Category ID is required'),
  itemName: z.string().min(2, 'Item name is required'),
  itemCode: z.string().min(2, 'Item code is required'),
  quantity: z.number().int().min(0).default(0),
  unit: z.string().default('Units'),
  minStockAlert: z.number().int().min(0).default(5),
  unitPrice: z.number().min(0).default(0),
  location: z.string().optional(),
});
export type CreateInventoryItemDTO = z.infer<typeof CreateInventoryItemSchema>;

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();
export type UpdateInventoryItemDTO = z.infer<typeof UpdateInventoryItemSchema>;

export const RecordInventoryTransactionSchema = z.object({
  itemId: z.string().uuid('Item ID is required'),
  transactionType: z.enum(['PURCHASE', 'ISSUE', 'RETURN', 'DISPOSAL', 'ADJUSTMENT']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0).optional(),
  issuedToName: z.string().optional(),
  recipientRole: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});
export type RecordInventoryTransactionDTO = z.infer<typeof RecordInventoryTransactionSchema>;

// ============================================================================
// SECTION 12: CERTIFICATE REQUEST SCHEMAS
// ============================================================================

export const RequestCertificateSchema = z.object({
  certificateType: z.enum(['BONAFIDE', 'TRANSFER_CERTIFICATE', 'CHARACTER', 'MIGRATION', 'MERIT']),
  reason: z.string().min(3, 'Reason for certificate request is required'),
  academicSessionId: z.string().uuid().optional(),
});
export type RequestCertificateDTO = z.infer<typeof RequestCertificateSchema>;

export const ReviewCertificateRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
  remarks: z.string().optional(),
});
export type ReviewCertificateRequestDTO = z.infer<typeof ReviewCertificateRequestSchema>;

// ============================================================================
// SECTION 13: AI CHATBOT, FAQ & ENQUIRY ESCALATION SCHEMAS
// ============================================================================

export const ChatbotMessageSchema = z
  .object({
    message: z.string().optional(),
    question: z.string().optional(),
    schoolIdentifier: z.string().optional(),
    history: z
      .array(
        z.object({
          sender: z.enum(['user', 'bot']),
          text: z.string(),
        })
      )
      .optional(),
    conversationHistory: z
      .array(
        z.object({
          sender: z.enum(['user', 'bot']),
          text: z.string(),
        })
      )
      .optional(),
    visitorSessionId: z.string().optional(),
  })
  .refine(
    (data) => Boolean((data.message && data.message.trim().length > 0) || (data.question && data.question.trim().length > 0)),
    {
      message: 'Message cannot be empty',
      path: ['message'],
    }
  );
export type ChatbotMessageDTO = z.infer<typeof ChatbotMessageSchema>;

export const ChatbotEnquirySchema = z.object({
  schoolIdentifier: z.string().min(1, 'School identifier is required'),
  parentName: z.string().min(2, 'Parent name is required'),
  studentName: z.string().min(2, 'Student name is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  email: z.string().email('Valid email address is required'),
  applyingClass: z.string().min(1, 'Target class is required'),
  message: z.string().optional(),
});
export type ChatbotEnquiryDTO = z.infer<typeof ChatbotEnquirySchema>;

export const ChatbotEscalationSchema = z.object({
  schoolIdentifier: z.string().min(1, 'School identifier is required'),
  visitorName: z.string().optional(),
  visitorPhone: z.string().optional(),
  visitorEmail: z.string().optional(),
  query: z.string().min(1, 'Inquiry text is required'),
  reason: z.string().default('VISITOR_REQUESTED_HUMAN'),
  conversationSnapshot: z.array(z.any()).optional(),
});
export type ChatbotEscalationDTO = z.infer<typeof ChatbotEscalationSchema>;

export const FAQCategoryEnum = z.enum([
  'ADMISSIONS',
  'FEES',
  'ACADEMICS',
  'FACILITIES',
  'TIMINGS',
  'EXAMINATIONS',
  'CONTACT',
  'GENERAL',
]);
export type FAQCategory = z.infer<typeof FAQCategoryEnum>;

export const CreateChatbotFAQSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters long'),
  answer: z.string().min(3, 'Answer must be at least 3 characters long'),
  category: FAQCategoryEnum.default('GENERAL'),
  displayOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});
export type CreateChatbotFAQDTO = z.infer<typeof CreateChatbotFAQSchema>;

export const UpdateChatbotFAQSchema = CreateChatbotFAQSchema.partial();
export type UpdateChatbotFAQDTO = z.infer<typeof UpdateChatbotFAQSchema>;

export const UpdateChatbotConfigSchema = z.object({
  botName: z.string().optional(),
  welcomeMessage: z.string().optional(),
  suggestedQuestions: z.array(z.string()).optional(),
  fallbackMessage: z.string().optional(),
  whatsappNumber: z.string().optional().nullable(),
  whatsappPrefillText: z.string().optional().nullable(),
  whatsappEnabled: z.boolean().optional(),
  escalationEnabled: z.boolean().optional(),
  escalationContactName: z.string().optional().nullable(),
  escalationEmail: z.string().optional().nullable(),
  escalationPhone: z.string().optional().nullable(),
  escalationAvailability: z.string().optional().nullable(),
  escalationMessage: z.string().optional().nullable(),
});
export type UpdateChatbotConfigDTO = z.infer<typeof UpdateChatbotConfigSchema>;

export const UpdateEscalationStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']),
  staffNotes: z.string().optional(),
  assignedToStaffId: z.string().optional().nullable(),
});
export type UpdateEscalationStatusDTO = z.infer<typeof UpdateEscalationStatusSchema>;

// ============================================================================
// SECTION 14: SEO, DIGITAL MARKETING & WEBSITE CONVERSION
// ============================================================================

export const PageSEOSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  pagePath: z.string(),
  pageTitle: z.string(),
  metaDescription: z.string().nullable().optional(),
  metaKeywords: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  ogTitle: z.string().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  twitterCard: z.string().default('summary_large_image'),
  structuredData: z.any().nullable().optional(),
  imageAltText: z.string().nullable().optional(),
  isPublished: z.boolean().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type PageSEODTO = z.infer<typeof PageSEOSchema>;

export const UpsertPageSEOSchema = z.object({
  pagePath: z.string().min(1, 'Page path is required'),
  pageTitle: z.string().min(1, 'Page title is required'),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  twitterCard: z.string().default('summary_large_image'),
  structuredData: z.any().optional().nullable(),
  imageAltText: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});
export type UpsertPageSEODTO = z.infer<typeof UpsertPageSEOSchema>;

export const MarketingIntegrationSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  googleAnalyticsId: z.string().nullable().optional(),
  ga4TrackingEnabled: z.boolean().default(false),
  searchConsoleProperty: z.string().nullable().optional(),
  searchConsoleVerificationCode: z.string().nullable().optional(),
  searchConsoleConnected: z.boolean().default(false),
  facebookUrl: z.string().nullable().optional(),
  instagramUrl: z.string().nullable().optional(),
  youtubeUrl: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  prospectusFileUrl: z.string().nullable().optional(),
  prospectusTitle: z.string().nullable().optional(),
  prospectusPublished: z.boolean().default(false),
});
export type MarketingIntegrationDTO = z.infer<typeof MarketingIntegrationSchema>;

export const UpdateMarketingIntegrationSchema = MarketingIntegrationSchema.partial();
export type UpdateMarketingIntegrationDTO = z.infer<typeof UpdateMarketingIntegrationSchema>;

export const BlogArticleSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable().optional(),
  content: z.string(),
  coverImageUrl: z.string().nullable().optional(),
  authorName: z.string().default('School Editorial Team'),
  category: z.string().default('Academics'),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
  publishedAt: z.string().or(z.date()).nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  imageAltText: z.string().nullable().optional(),
  viewCount: z.number().default(0),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type BlogArticleDTO = z.infer<typeof BlogArticleSchema>;

export const CreateBlogArticleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  summary: z.string().optional().nullable(),
  content: z.string().min(10, 'Article content must be at least 10 characters'),
  coverImageUrl: z.string().optional().nullable(),
  authorName: z.string().default('School Editorial Team'),
  category: z.string().default('Academics'),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  imageAltText: z.string().optional().nullable(),
});
export type CreateBlogArticleDTO = z.infer<typeof CreateBlogArticleSchema>;

export const UpdateBlogArticleSchema = CreateBlogArticleSchema.partial();
export type UpdateBlogArticleDTO = z.infer<typeof UpdateBlogArticleSchema>;

export const MarketingBannerSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  bannerType: z.enum(['ADMISSION_OPEN', 'PROMOTIONAL', 'ANNOUNCEMENT', 'ACHIEVEMENT']).default('ADMISSION_OPEN'),
  imageUrl: z.string().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  ctaLink: z.string().nullable().optional(),
  startDate: z.string().or(z.date()).nullable().optional(),
  endDate: z.string().or(z.date()).nullable().optional(),
  displayPosition: z.enum(['TOP_BAR', 'HERO_POPUP', 'SIDE_DRAWER', 'CONTENT_FOOTER']).default('TOP_BAR'),
  displayOrder: z.number().default(0),
  isPublished: z.boolean().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type MarketingBannerDTO = z.infer<typeof MarketingBannerSchema>;

export const CreateMarketingBannerSchema = z.object({
  title: z.string().min(2, 'Banner title is required'),
  description: z.string().optional().nullable(),
  bannerType: z.enum(['ADMISSION_OPEN', 'PROMOTIONAL', 'ANNOUNCEMENT', 'ACHIEVEMENT']).default('ADMISSION_OPEN'),
  imageUrl: z.string().optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaLink: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  displayPosition: z.enum(['TOP_BAR', 'HERO_POPUP', 'SIDE_DRAWER', 'CONTENT_FOOTER']).default('TOP_BAR'),
  displayOrder: z.number().default(0),
  isPublished: z.boolean().default(true),
});
export type CreateMarketingBannerDTO = z.infer<typeof CreateMarketingBannerSchema>;

export const UpdateMarketingBannerSchema = CreateMarketingBannerSchema.partial();
export type UpdateMarketingBannerDTO = z.infer<typeof UpdateMarketingBannerSchema>;

export const CallbackRequestSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  requestNumber: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  applyingClass: z.string().nullable().optional(),
  preferredTime: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'CONTACTED', 'FOLLOW_UP_REQUIRED', 'RESOLVED', 'CLOSED']).default('PENDING'),
  assignedStaffId: z.string().nullable().optional(),
  staffNotes: z.string().nullable().optional(),
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type CallbackRequestDTO = z.infer<typeof CallbackRequestSchema>;

export const CreateCallbackRequestSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'A valid contact phone number is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  applyingClass: z.string().optional().nullable(),
  preferredTime: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
});
export type CreateCallbackRequestDTO = z.infer<typeof CreateCallbackRequestSchema>;

export const UpdateCallbackStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'FOLLOW_UP_REQUIRED', 'RESOLVED', 'CLOSED']),
  staffNotes: z.string().optional().nullable(),
  assignedStaffId: z.string().optional().nullable(),
});
export type UpdateCallbackStatusDTO = z.infer<typeof UpdateCallbackStatusSchema>;

export const NewsletterSubscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  source: z.string().default('WEBSITE_FOOTER'),
});
export type NewsletterSubscribeDTO = z.infer<typeof NewsletterSubscribeSchema>;

export const LeadFollowUpSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  enquiryId: z.string().nullable().optional(),
  callbackId: z.string().nullable().optional(),
  counsellorId: z.string().nullable().optional(),
  counsellorName: z.string().default('Admission Counsellor'),
  followUpDate: z.string().or(z.date()),
  followUpTime: z.string().nullable().optional(),
  description: z.string().min(1, 'Follow-up description/objective is required'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED']).default('SCHEDULED'),
  outcomeNotes: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type LeadFollowUpDTO = z.infer<typeof LeadFollowUpSchema>;

export const CreateLeadFollowUpSchema = z.object({
  enquiryId: z.string().optional().nullable(),
  callbackId: z.string().optional().nullable(),
  counsellorId: z.string().optional().nullable(),
  counsellorName: z.string().default('Admission Counsellor'),
  followUpDate: z.string().min(1, 'Follow up date is required'),
  followUpTime: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED']).default('SCHEDULED'),
  outcomeNotes: z.string().optional().nullable(),
});
export type CreateLeadFollowUpDTO = z.infer<typeof CreateLeadFollowUpSchema>;

export const UpdateLeadFollowUpSchema = CreateLeadFollowUpSchema.partial();
export type UpdateLeadFollowUpDTO = z.infer<typeof UpdateLeadFollowUpSchema>;

export const RecordAnalyticsEventSchema = z.object({
  eventType: z.enum(['PAGE_VIEW', 'ADMISSION_BANNER_CLICK', 'ENQUIRY_SUBMIT', 'APPLICATION_START', 'PROSPECTUS_DOWNLOAD', 'WHATSAPP_CLICK', 'CALLBACK_REQUEST', 'NEWSLETTER_SUBMIT']),
  pagePath: z.string(),
  source: z.string().default('WEBSITE'),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  referrer: z.string().optional().nullable(),
});
export type RecordAnalyticsEventDTO = z.infer<typeof RecordAnalyticsEventSchema>;

// ============================================================================
// SECTION 15: NOTIFICATION & ALERT MANAGEMENT
// ============================================================================

export const NotificationEventEnum = z.enum([
  'ADMISSION_ENQUIRY_RECEIVED',
  'ADMISSION_STATUS_UPDATED',
  'FEE_PAYMENT_REMINDER',
  'FEE_PAYMENT_SUCCESS',
  'ATTENDANCE_ABSENT_ALERT',
  'HOMEWORK_ASSIGNED',
  'EXAMINATION_ANNOUNCED',
  'ADMIT_CARD_PUBLISHED',
  'RESULT_PUBLISHED',
  'MEETING_SCHEDULED',
  'CHAT_MESSAGE_RECEIVED',
  'SCHOOL_ANNOUNCEMENT',
]);
export type NotificationEventType = z.infer<typeof NotificationEventEnum>;

export const NotificationChannelEnum = z.enum([
  'IN_APP',
  'EMAIL',
  'SMS',
  'WHATSAPP',
]);
export type NotificationChannelType = z.infer<typeof NotificationChannelEnum>;

export const NotificationItemSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string().default('INFO'),
  category: z.string().default('GENERAL'),
  priority: z.string().default('MEDIUM'),
  link: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.string().or(z.date()),
});
export type NotificationItemDTO = z.infer<typeof NotificationItemSchema>;

export const NotificationEventConfigSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  eventKey: NotificationEventEnum,
  eventName: z.string(),
  description: z.string().nullable().optional(),
  isEnabled: z.boolean().default(true),
  channels: z.array(NotificationChannelEnum).default(['IN_APP']),
  recipientRoles: z.array(z.string()).default([]),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type NotificationEventConfigDTO = z.infer<typeof NotificationEventConfigSchema>;

export const UpdateNotificationEventConfigSchema = z.object({
  isEnabled: z.boolean().optional(),
  channels: z.array(NotificationChannelEnum).optional(),
  recipientRoles: z.array(z.string()).optional(),
});
export type UpdateNotificationEventConfigDTO = z.infer<typeof UpdateNotificationEventConfigSchema>;

export const NotificationTemplateSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  eventKey: NotificationEventEnum,
  channel: NotificationChannelEnum,
  name: z.string(),
  subject: z.string().nullable().optional(),
  body: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type NotificationTemplateDTO = z.infer<typeof NotificationTemplateSchema>;

export const CreateNotificationTemplateSchema = z.object({
  eventKey: NotificationEventEnum,
  channel: NotificationChannelEnum,
  name: z.string().min(2, 'Template name is required'),
  subject: z.string().optional().nullable(),
  body: z.string().min(5, 'Template body is required'),
  isActive: z.boolean().default(true),
});
export type CreateNotificationTemplateDTO = z.infer<typeof CreateNotificationTemplateSchema>;

export const UpdateNotificationTemplateSchema = CreateNotificationTemplateSchema.partial();
export type UpdateNotificationTemplateDTO = z.infer<typeof UpdateNotificationTemplateSchema>;

export const PreviewNotificationTemplateSchema = z.object({
  subject: z.string().optional().nullable(),
  body: z.string().min(1, 'Body is required for preview'),
  eventKey: NotificationEventEnum,
  sampleOverrides: z.record(z.string()).optional(),
});
export type PreviewNotificationTemplateDTO = z.infer<typeof PreviewNotificationTemplateSchema>;

export const NotificationDeliveryLogSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  notificationId: z.string().nullable().optional(),
  eventKey: z.string(),
  channel: NotificationChannelEnum,
  recipientId: z.string().nullable().optional(),
  recipientContact: z.string(),
  recipientName: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  content: z.string(),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED']),
  errorDetails: z.string().nullable().optional(),
  providerMessageId: z.string().nullable().optional(),
  retryCount: z.number().default(0),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional(),
});
export type NotificationDeliveryLogDTO = z.infer<typeof NotificationDeliveryLogSchema>;

export const NotificationProviderConfigSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  emailProvider: z.enum(['SYSTEM_DEFAULT', 'SMTP', 'RESEND', 'SENDGRID']).default('SYSTEM_DEFAULT'),
  emailSenderName: z.string().default('Apex Academy Notifications'),
  emailSenderAddress: z.string().default('notifications@apexacademy.edu.in'),
  emailApiKey: z.string().nullable().optional(),
  smsProvider: z.enum(['SIMULATED', 'TWILIO', 'MSG91', 'FAST2SMS']).default('SIMULATED'),
  smsSenderId: z.string().nullable().optional(),
  smsApiKey: z.string().nullable().optional(),
  whatsAppProvider: z.enum(['SIMULATED', 'META_CLOUD', 'TWILIO_WHATSAPP']).default('SIMULATED'),
  whatsAppPhoneNumberId: z.string().nullable().optional(),
  whatsAppApiKey: z.string().nullable().optional(),
});
export type NotificationProviderConfigDTO = z.infer<typeof NotificationProviderConfigSchema>;

export const UpdateNotificationProviderConfigSchema = NotificationProviderConfigSchema.partial();
export type UpdateNotificationProviderConfigDTO = z.infer<typeof UpdateNotificationProviderConfigSchema>;

// ============================================================================
// SECTION 16: SUPER ADMIN PLATFORM GOVERNANCE, RBAC, AUDIT & SYSTEM CONTROLS
// ============================================================================

export const PlatformModuleEnum = z.enum([
  'DASHBOARD',
  'USERS',
  'SCHOOLS',
  'STUDENTS',
  'STAFF',
  'ACADEMIC',
  'ADMISSIONS',
  'ATTENDANCE',
  'FEES',
  'EXAMINATIONS',
  'MARKSHEETS',
  'ID_CARDS',
  'CERTIFICATES',
  'LIBRARY',
  'TRANSPORT',
  'INVENTORY',
  'COMMUNICATION',
  'NOTIFICATIONS',
  'WEBSITE',
  'ANALYTICS',
  'BACKUP',
  'SETTINGS',
]);
export type PlatformModule = z.infer<typeof PlatformModuleEnum>;

export const ModulePermissionSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().nullable().optional(),
  role: z.nativeEnum(PlatformRole),
  moduleKey: z.string(),
  canView: z.boolean().default(true),
  canCreate: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canApprove: z.boolean().default(false),
  canPublish: z.boolean().default(false),
  canExport: z.boolean().default(false),
  canManage: z.boolean().default(false),
});
export type ModulePermissionDTO = z.infer<typeof ModulePermissionSchema>;

export const UpdateModulePermissionSchema = z.object({
  schoolId: z.string().nullable().optional(),
  role: z.nativeEnum(PlatformRole),
  moduleKey: z.string(),
  canView: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canApprove: z.boolean().optional(),
  canPublish: z.boolean().optional(),
  canExport: z.boolean().optional(),
  canManage: z.boolean().optional(),
});
export type UpdateModulePermissionDTO = z.infer<typeof UpdateModulePermissionSchema>;

export const SuperAdminCreateUserSchema = z.object({
  email: z.string().email('Valid email address is required'),
  username: z.string().min(3).optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(PlatformRole),
  schoolId: z.string().optional(),
  temporaryPassword: z.string().min(6).optional(),
  mustChangePassword: z.boolean().default(true),
});
export type SuperAdminCreateUserDTO = z.infer<typeof SuperAdminCreateUserSchema>;

export const SuperAdminUpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  accountLocked: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});
export type SuperAdminUpdateUserDTO = z.infer<typeof SuperAdminUpdateUserSchema>;

export const MarksheetPublicationReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'PUBLISH']),
  reviewNotes: z.string().optional(),
});
export type MarksheetPublicationReviewDTO = z.infer<typeof MarksheetPublicationReviewSchema>;

export const CreateBackupRequestSchema = z.object({
  backupType: z.enum(['FULL', 'TENANT_DATA', 'DATABASE_SQL', 'MEDIA_METADATA']).default('FULL'),
  schoolId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateBackupRequestDTO = z.infer<typeof CreateBackupRequestSchema>;

export const UpdatePlatformSystemConfigSchema = z.object({
  platformName: z.string().optional(),
  supportEmail: z.string().email().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().nullable().optional(),
  sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
  maxLoginAttempts: z.number().min(1).max(20).optional(),
  lockoutDurationMinutes: z.number().min(5).max(1440).optional(),
  enforcePasswordChangeDays: z.number().min(0).max(365).optional(),
  allowSelfRegistration: z.boolean().optional(),
  globalAnnouncements: z.any().optional(),
  featureFlags: z.any().optional(),
  backupSettings: z.any().optional(),
});
export type UpdatePlatformSystemConfigDTO = z.infer<typeof UpdatePlatformSystemConfigSchema>;

export const ActivityLogQuerySchema = z.object({
  search: z.string().optional(),
  schoolId: z.string().optional(),
  userId: z.string().optional(),
  role: z.string().optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});
export type ActivityLogQueryDTO = z.infer<typeof ActivityLogQuerySchema>;

// ============================================================================
// SECTION 17: UI/UX, SECURITY & TECHNICAL STANDARDS SCHEMAS
// ============================================================================

export const VerifyMfaOtpSchema = z.object({
  mfaToken: z.string().min(1, 'MFA Token is required'),
  otpCode: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
});
export type VerifyMfaOtpDTO = z.infer<typeof VerifyMfaOtpSchema>;

export const ResendMfaOtpSchema = z.object({
  mfaToken: z.string().min(1, 'MFA Token is required'),
});
export type ResendMfaOtpDTO = z.infer<typeof ResendMfaOtpSchema>;

export const ToggleMfaSchema = z.object({
  enable: z.boolean(),
  method: z.enum(['EMAIL_OTP', 'TOTP']).default('EMAIL_OTP'),
});
export type ToggleMfaDTO = z.infer<typeof ToggleMfaSchema>;

export const SecureFileUploadSchema = z.object({
  originalName: z.string().min(1, 'Original file name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  category: z.enum([
    'STUDENT_PHOTO',
    'STAFF_PHOTO',
    'ADMISSION_DOC',
    'ASSIGNMENT',
    'EXAM_PAPER',
    'MARKSHEET_ATTACHMENT',
    'FEE_RECEIPT',
    'DOCUMENT',
  ]).default('DOCUMENT'),
  isPublic: z.boolean().default(false),
  base64Data: z.string().min(1, 'File payload in base64 is required'),
  metadata: z.record(z.any()).optional(),
});
export type SecureFileUploadDTO = z.infer<typeof SecureFileUploadSchema>;

export const SecureFileQuerySchema = z.object({
  category: z.string().optional(),
  isPublic: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});
export type SecureFileQueryDTO = z.infer<typeof SecureFileQuerySchema>;
















