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



