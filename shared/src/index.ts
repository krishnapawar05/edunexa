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
  SHORT_ANSWER: 'SHORT_ANSWER',
  DESCRIPTIVE: 'DESCRIPTIVE',
} as const;

export type QuestionTypeEnum = (typeof QuestionType)[keyof typeof QuestionType];

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
  questionType: z.enum(['MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'DESCRIPTIVE']),
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

