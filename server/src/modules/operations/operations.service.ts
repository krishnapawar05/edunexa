import { randomUUID } from 'crypto';
import { AppError } from '../../middleware/errorHandler.js';
import {
  PlatformRole,
  EventAudience,
  EventAudienceType,
  FeePaymentStatus,
  FeePaymentStatusType,
  CreateTimetableSlotDTO,
  CreateAssignmentDTO,
  SubmitAssignmentDTO,
  GradeAssignmentDTO,
  CreateLearningResourceDTO,
  CreateNoticeDTO,
  CreateSchoolEventDTO,
  CreateFeeStructureDTO,
  RecordFeePaymentDTO,
  ApplyFeeConcessionDTO,
  RecordFeeRefundDTO,
  FinancialSummaryReport,
} from '@edunexa/shared';

// ============================================================================
// DATA MODELS FOR SCHOOL OPERATIONS & REPORTING
// ============================================================================

export interface SyntheticTimetableSlot {
  id: string;
  schoolId: string;
  className: string;
  sectionName: string;
  dayOfWeek: number; // 1 to 7
  startTime: string; // HH:MM
  endTime: string;
  subjectName: string;
  roomNumber: string;
  teacherName: string;
  createdAt: string;
}

export interface SyntheticAssignment {
  id: string;
  schoolId: string;
  className: string;
  sectionName: string;
  subjectCode: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface SyntheticAssignmentSubmission {
  id: string;
  assignmentId: string;
  studentProfileId: string;
  submissionText?: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  submittedAt: string;
  isLate: boolean;
  marksAwarded?: number;
  feedback?: string;
}

export interface SyntheticLearningResource {
  id: string;
  schoolId: string;
  subjectCode: string;
  className: string;
  title: string;
  description?: string;
  topic: string;
  fileUrl: string;
  fileType: 'PDF' | 'DOCUMENT' | 'VIDEO' | 'PRESENTATION' | 'LINK';
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedAt: string;
}

export interface SyntheticNotice {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  audience: EventAudienceType;
  targetClass?: string;
  isUrgent: boolean;
  publishedAt: string;
  expiresAt?: string;
  createdByUserId: string;
}

export interface SyntheticSchoolEvent {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  audience: EventAudienceType;
  isPublic: boolean;
  createdByUserId: string;
  createdAt: string;
}

export interface SyntheticNotification {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'FEE' | 'ACADEMIC' | 'URGENT';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SyntheticFeeStructure {
  id: string;
  schoolId: string;
  className: string;
  feeHead: string;
  amount: number;
  frequency: 'ANNUAL' | 'TERM' | 'MONTHLY';
  createdAt: string;
}

export interface SyntheticFeeInvoice {
  id: string;
  schoolId: string;
  invoiceNumber: string;
  studentProfileId: string;
  studentName: string;
  className: string;
  feeStructureHead: string;
  amountDue: number;
  amountPaid: number;
  discountApplied: number;
  dueDate: string;
  status: FeePaymentStatusType;
  auditTrail: Array<{
    action: string;
    amount: number;
    authorizedByUserId: string;
    reason: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface SyntheticFeePayment {
  id: string;
  schoolId: string;
  invoiceId: string;
  receiptNumber: string;
  studentName: string;
  amountPaid: number;
  paymentMethod: string;
  transactionRef: string;
  isSimulated: boolean;
  notes?: string;
  collectedByUserId: string;
  paidAt: string;
}

// ============================================================================
// IN-MEMORY OPERATIONAL SEED STORE
// ============================================================================

const MOCK_TIMETABLE: SyntheticTimetableSlot[] = [
  {
    id: 'tt-01',
    schoolId: 'sch-apex-01',
    className: 'Grade 10',
    sectionName: 'A',
    dayOfWeek: 1, // Monday
    startTime: '08:30',
    endTime: '09:20',
    subjectName: 'Physics Core',
    roomNumber: 'Room 204',
    teacherName: 'Dr. Julian Thorne',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'tt-02',
    schoolId: 'sch-apex-01',
    className: 'Grade 10',
    sectionName: 'A',
    dayOfWeek: 1, // Monday
    startTime: '09:25',
    endTime: '10:15',
    subjectName: 'Mathematics (Advanced)',
    roomNumber: 'Room 204',
    teacherName: 'Mrs. Rebecca Vance',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
];

const MOCK_ASSIGNMENTS: SyntheticAssignment[] = [
  {
    id: 'asg-phy-01',
    schoolId: 'sch-apex-01',
    className: 'Grade 10',
    sectionName: 'A',
    subjectCode: 'PHY-10',
    title: 'Electromagnetic Field Mapping & Solenoid Calculation',
    description: 'Calculate the magnetic flux density B within a 500-turn solenoid and submit your step-by-step PDF solutions.',
    assignedDate: '2026-10-14T09:00:00.000Z',
    dueDate: '2026-10-25T17:00:00.000Z',
    maxMarks: 20,
    attachmentUrl: 'https://edunexa.blob.core/assignments/phy10_solenoid_guidelines.pdf',
    createdByUserId: 'usr-thorne-01',
    createdAt: '2026-10-14T09:00:00.000Z',
  },
];

const MOCK_SUBMISSIONS: SyntheticAssignmentSubmission[] = [
  {
    id: 'sub-aarav-01',
    assignmentId: 'asg-phy-01',
    studentProfileId: 'stu-aarav-01',
    submissionText: 'Completed all 5 numerical problems with SI derivation diagrams.',
    fileUrl: 'https://edunexa.blob.core/submissions/aarav_solenoid_hw.pdf',
    fileName: 'aarav_solenoid_hw.pdf',
    fileSizeBytes: 1450000,
    fileType: 'application/pdf',
    submittedAt: '2026-10-18T14:30:00.000Z',
    isLate: false,
    marksAwarded: 19,
    feedback: 'Exemplary circuit derivation and accurate magnetic constant units.',
  },
];

const MOCK_RESOURCES: SyntheticLearningResource[] = [
  {
    id: 'res-phy-01',
    schoolId: 'sch-apex-01',
    subjectCode: 'PHY-10',
    className: 'Grade 10',
    title: 'NCERT & Exemplar Solutions: Magnetic Effects of Electric Current',
    description: 'Comprehensive chapter guide with annotated illustrations and practice MCQs.',
    topic: 'Electromagnetism',
    fileUrl: 'https://edunexa.blob.core/resources/ncert_phy_ch4_notes.pdf',
    fileType: 'PDF',
    fileSizeBytes: 4200000,
    uploadedByUserId: 'usr-thorne-01',
    uploadedAt: '2026-10-10T10:00:00.000Z',
  },
];

const MOCK_NOTICES: SyntheticNotice[] = [
  {
    id: 'not-01',
    schoolId: 'sch-apex-01',
    title: 'CBSE Secondary Board Registration & Fee Circular',
    content: 'All Grade 10 students and guardians are requested to verify their board enrollment forms and clear pending term fees by October 25, 2026.',
    audience: 'ALL',
    isUrgent: true,
    publishedAt: '2026-10-15T09:00:00.000Z',
    createdByUserId: 'usr-schooladmin-01',
  },
  {
    id: 'not-02',
    schoolId: 'sch-apex-01',
    title: 'Internal Teacher Moderation & Pedagogy Workshop',
    content: 'Faculty meeting scheduled in Seminar Hall 1 for secondary question bank standardization.',
    audience: 'STAFF_ONLY',
    isUrgent: false,
    publishedAt: '2026-10-16T11:00:00.000Z',
    createdByUserId: 'usr-schooladmin-01',
  },
  {
    id: 'not-03',
    schoolId: 'sch-apex-01',
    title: 'Grade 10 Science Practical Lab Schedule',
    content: 'Grade 10-A and 10-B optics lab sessions commence this Wednesday at 10:30 AM.',
    audience: 'STUDENTS_ONLY',
    targetClass: 'Grade 10',
    isUrgent: false,
    publishedAt: '2026-10-17T08:30:00.000Z',
    createdByUserId: 'usr-thorne-01',
  },
];

const MOCK_EVENTS: SyntheticSchoolEvent[] = [
  {
    id: 'evt-01',
    schoolId: 'sch-apex-01',
    title: 'Annual Inter-School STEM & Robotics Exposition 2026',
    description: 'Showcasing AI prototypes, renewable energy projects, and mathematical modeling.',
    venue: 'Main Auditorium & Exhibition Grounds',
    startDate: '2026-11-14T09:00:00.000Z',
    endDate: '2026-11-15T18:00:00.000Z',
    audience: 'ALL',
    isPublic: true,
    createdByUserId: 'usr-schooladmin-01',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
];

const MOCK_NOTIFICATIONS: SyntheticNotification[] = [
  {
    id: 'notif-01',
    schoolId: 'sch-apex-01',
    userId: 'usr-aarav-01',
    title: 'Assignment Evaluated',
    message: 'Dr. Thorne has graded your Electromagnetism Solenoid submission: 19/20.',
    type: 'ACADEMIC',
    link: '/student/assignments',
    isRead: false,
    createdAt: '2026-10-18T16:00:00.000Z',
  },
  {
    id: 'notif-02',
    schoolId: 'sch-apex-01',
    userId: 'usr-parent-01',
    title: 'Term 2 Fee Receipt Generated',
    message: 'Official receipt REC-2026-4011 generated for Aarav Sharma (₹ 45,000).',
    type: 'FEE',
    link: '/parent/fees',
    isRead: false,
    createdAt: '2026-10-15T11:00:00.000Z',
  },
];

const MOCK_FEE_STRUCTURES: SyntheticFeeStructure[] = [
  {
    id: 'fs-g10-tui',
    schoolId: 'sch-apex-01',
    className: 'Grade 10',
    feeHead: 'Secondary Tuition & Academic Development',
    amount: 35000,
    frequency: 'TERM',
    createdAt: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'fs-g10-lab',
    schoolId: 'sch-apex-01',
    className: 'Grade 10',
    feeHead: 'Science & Robotics Laboratory Facility',
    amount: 10000,
    frequency: 'TERM',
    createdAt: '2026-04-01T08:00:00.000Z',
  },
];

const MOCK_INVOICES: SyntheticFeeInvoice[] = [
  {
    id: 'inv-aarav-01',
    schoolId: 'sch-apex-01',
    invoiceNumber: 'INV-2026-0412',
    studentProfileId: 'stu-aarav-01',
    studentName: 'Aarav Sharma',
    className: 'Grade 10',
    feeStructureHead: 'Term 2 Tuition & Science Lab',
    amountDue: 45000,
    amountPaid: 45000,
    discountApplied: 0,
    dueDate: '2026-10-15',
    status: 'PAID',
    auditTrail: [],
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'inv-ananya-02',
    schoolId: 'sch-apex-01',
    invoiceNumber: 'INV-2026-0413',
    studentProfileId: 'stu-ananya-02',
    studentName: 'Ananya Deshmukh',
    className: 'Grade 10',
    feeStructureHead: 'Term 2 Tuition & Science Lab',
    amountDue: 45000,
    amountPaid: 20000,
    discountApplied: 0,
    dueDate: '2026-10-15',
    status: 'PARTIALLY_PAID',
    auditTrail: [],
    createdAt: '2026-10-01T09:00:00.000Z',
  },
];

const MOCK_PAYMENTS: SyntheticFeePayment[] = [
  {
    id: 'pay-01',
    schoolId: 'sch-apex-01',
    invoiceId: 'inv-aarav-01',
    receiptNumber: 'REC-2026-4011',
    studentName: 'Aarav Sharma',
    amountPaid: 45000,
    paymentMethod: 'UPI',
    transactionRef: 'UPI-SIM-98214-OKAXIS',
    isSimulated: true,
    collectedByUserId: 'usr-accounts-01',
    paidAt: '2026-10-15T10:45:00.000Z',
  },
];

export class OperationsService {
  // ==========================================================================
  // 1. TIMETABLE MANAGEMENT & CONFLICT CHECKING
  // ==========================================================================

  async createTimetableSlot(schoolId: string, data: CreateTimetableSlotDTO) {
    // 1. Double-booking check: Room conflict
    const roomConflict = MOCK_TIMETABLE.find(
      (s) =>
        s.schoolId === schoolId &&
        s.dayOfWeek === data.dayOfWeek &&
        s.roomNumber.toLowerCase() === data.roomNumber.toLowerCase() &&
        this.isTimeOverlap(s.startTime, s.endTime, data.startTime, data.endTime)
    );

    if (roomConflict) {
      throw new AppError(
        `Room scheduling collision: ${data.roomNumber} is already occupied on Day ${data.dayOfWeek} from ${roomConflict.startTime} to ${roomConflict.endTime} for ${roomConflict.subjectName}.`,
        409,
        'ROOM_SCHEDULE_CONFLICT'
      );
    }

    // 2. Double-booking check: Teacher conflict
    const teacherConflict = MOCK_TIMETABLE.find(
      (s) =>
        s.schoolId === schoolId &&
        s.dayOfWeek === data.dayOfWeek &&
        s.teacherName.toLowerCase() === data.teacherName.toLowerCase() &&
        this.isTimeOverlap(s.startTime, s.endTime, data.startTime, data.endTime)
    );

    if (teacherConflict) {
      throw new AppError(
        `Teacher schedule collision: ${data.teacherName} is already assigned to ${teacherConflict.className}-${teacherConflict.sectionName} from ${teacherConflict.startTime} to ${teacherConflict.endTime}.`,
        409,
        'TEACHER_SCHEDULE_CONFLICT'
      );
    }

    const newSlot: SyntheticTimetableSlot = {
      id: `tt-${randomUUID().slice(0, 8)}`,
      schoolId,
      className: data.className,
      sectionName: data.sectionName,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      subjectName: data.subjectName,
      roomNumber: data.roomNumber,
      teacherName: data.teacherName,
      createdAt: new Date().toISOString(),
    };

    MOCK_TIMETABLE.push(newSlot);
    return newSlot;
  }

  async getSectionTimetable(schoolId: string, className: string, sectionName: string) {
    return MOCK_TIMETABLE.filter(
      (s) =>
        s.schoolId === schoolId &&
        s.className.toLowerCase() === className.toLowerCase() &&
        s.sectionName.toLowerCase() === sectionName.toLowerCase()
    ).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  // ==========================================================================
  // 2. HOMEWORK & ASSIGNMENTS WORKFLOW
  // ==========================================================================

  async createAssignment(schoolId: string, createdByUserId: string, data: CreateAssignmentDTO) {
    const newAssignment: SyntheticAssignment = {
      id: `asg-${randomUUID().slice(0, 8)}`,
      schoolId,
      className: data.className,
      sectionName: data.sectionName,
      subjectCode: data.subjectCode,
      title: data.title,
      description: data.description,
      assignedDate: new Date().toISOString(),
      dueDate: data.dueDate,
      maxMarks: data.maxMarks,
      attachmentUrl: data.attachmentUrl,
      createdByUserId,
      createdAt: new Date().toISOString(),
    };

    MOCK_ASSIGNMENTS.unshift(newAssignment);
    return newAssignment;
  }

  async listAssignments(schoolId: string, className?: string) {
    let list = MOCK_ASSIGNMENTS.filter((a) => a.schoolId === schoolId);
    if (className) {
      list = list.filter((a) => a.className.toLowerCase() === className.toLowerCase());
    }
    return list;
  }

  async submitAssignment(schoolId: string, data: SubmitAssignmentDTO) {
    const assignment = MOCK_ASSIGNMENTS.find((a) => a.id === data.assignmentId && a.schoolId === schoolId);
    if (!assignment) {
      throw new AppError(`Assignment '${data.assignmentId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    // File validation: Size limit 10MB
    if (data.fileSizeBytes > 10 * 1024 * 1024) {
      throw new AppError('File size exceeds the permitted limit of 10 MB.', 400, 'FILE_TOO_LARGE');
    }

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;

    const existingIndex = MOCK_SUBMISSIONS.findIndex(
      (s) => s.assignmentId === data.assignmentId && s.studentProfileId === data.studentProfileId
    );

    const submission: SyntheticAssignmentSubmission = {
      id: existingIndex >= 0 ? MOCK_SUBMISSIONS[existingIndex].id : `sub-${randomUUID().slice(0, 8)}`,
      assignmentId: data.assignmentId,
      studentProfileId: data.studentProfileId,
      submissionText: data.submissionText,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      fileType: data.fileType,
      submittedAt: now.toISOString(),
      isLate,
    };

    if (existingIndex >= 0) {
      MOCK_SUBMISSIONS[existingIndex] = submission;
    } else {
      MOCK_SUBMISSIONS.unshift(submission);
    }

    return submission;
  }

  async gradeAssignment(schoolId: string, teacherId: string, data: GradeAssignmentDTO) {
    const submission = MOCK_SUBMISSIONS.find((s) => s.id === data.submissionId);
    if (!submission) {
      throw new AppError(`Submission '${data.submissionId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    submission.marksAwarded = data.marksAwarded;
    submission.feedback = data.feedback;

    return submission;
  }

  // ==========================================================================
  // 3. LEARNING RESOURCES & CONTENT REPOSITORY
  // ==========================================================================

  async createLearningResource(schoolId: string, uploadedByUserId: string, data: CreateLearningResourceDTO) {
    if (data.fileSizeBytes > 50 * 1024 * 1024) {
      throw new AppError('Resource file size exceeds 50 MB.', 400, 'FILE_TOO_LARGE');
    }

    const newResource: SyntheticLearningResource = {
      id: `res-${randomUUID().slice(0, 8)}`,
      schoolId,
      subjectCode: data.subjectCode,
      className: data.className,
      title: data.title,
      description: data.description,
      topic: data.topic,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSizeBytes: data.fileSizeBytes,
      uploadedByUserId,
      uploadedAt: new Date().toISOString(),
    };

    MOCK_RESOURCES.unshift(newResource);
    return newResource;
  }

  async listLearningResources(schoolId: string, className: string, subjectCode?: string) {
    let list = MOCK_RESOURCES.filter(
      (r) => r.schoolId === schoolId && r.className.toLowerCase() === className.toLowerCase()
    );
    if (subjectCode) {
      list = list.filter((r) => r.subjectCode.toLowerCase() === subjectCode.toLowerCase());
    }
    return list;
  }

  // ==========================================================================
  // 4. NOTICES, ANNOUNCEMENTS & SCHOOL EVENTS (AUDIENCE-TARGETED)
  // ==========================================================================

  async createNotice(schoolId: string, createdByUserId: string, data: CreateNoticeDTO) {
    const newNotice: SyntheticNotice = {
      id: `not-${randomUUID().slice(0, 8)}`,
      schoolId,
      title: data.title,
      content: data.content,
      audience: data.audience,
      targetClass: data.targetClass,
      isUrgent: data.isUrgent,
      publishedAt: new Date().toISOString(),
      expiresAt: data.expiresAt,
      createdByUserId,
    };

    MOCK_NOTICES.unshift(newNotice);
    return newNotice;
  }

  async listNotices(schoolId: string, userRole: string, userClass?: string) {
    return MOCK_NOTICES.filter((n) => {
      if (n.schoolId !== schoolId) return false;

      // Super Admin and School Admin can see all notices
      if (userRole === PlatformRole.SUPER_ADMIN || userRole === PlatformRole.SCHOOL_ADMIN || userRole === PlatformRole.PRINCIPAL) {
        return true;
      }

      // Audience Targeting
      if (n.audience === 'ALL') return true;
      if (userRole === PlatformRole.STUDENT) {
        if (n.audience === 'STUDENTS_ONLY') {
          return !n.targetClass || (userClass && n.targetClass.toLowerCase() === userClass.toLowerCase());
        }
        return false;
      }
      if (userRole === PlatformRole.PARENT) {
        return n.audience === 'PARENTS_ONLY';
      }
      if (userRole === PlatformRole.TEACHER || userRole === PlatformRole.HR_STAFF || userRole === PlatformRole.ACCOUNTS) {
        return n.audience === 'STAFF_ONLY';
      }

      return false;
    });
  }

  async createSchoolEvent(schoolId: string, createdByUserId: string, data: CreateSchoolEventDTO) {
    const newEvent: SyntheticSchoolEvent = {
      id: `evt-${randomUUID().slice(0, 8)}`,
      schoolId,
      title: data.title,
      description: data.description,
      venue: data.venue,
      startDate: data.startDate,
      endDate: data.endDate,
      audience: data.audience,
      isPublic: data.isPublic,
      createdByUserId,
      createdAt: new Date().toISOString(),
    };

    MOCK_EVENTS.unshift(newEvent);
    return newEvent;
  }

  async listSchoolEvents(schoolId: string) {
    return MOCK_EVENTS.filter((e) => e.schoolId === schoolId);
  }

  // ==========================================================================
  // 5. IN-APP NOTIFICATIONS
  // ==========================================================================

  async listUserNotifications(schoolId: string, userId: string) {
    const userNotifications = MOCK_NOTIFICATIONS.filter(
      (n) => n.schoolId === schoolId && n.userId === userId
    );
    const unreadCount = userNotifications.filter((n) => !n.isRead).length;

    return {
      unreadCount,
      notifications: userNotifications,
    };
  }

  async markNotificationRead(schoolId: string, userId: string, notificationId: string) {
    const notif = MOCK_NOTIFICATIONS.find(
      (n) => n.id === notificationId && n.schoolId === schoolId && n.userId === userId
    );
    if (notif) {
      notif.isRead = true;
    }
    return notif || { id: notificationId, isRead: true };
  }

  async markAllNotificationsRead(schoolId: string, userId: string) {
    const list = MOCK_NOTIFICATIONS.filter((n) => n.schoolId === schoolId && n.userId === userId);
    list.forEach((n) => (n.isRead = true));
    return { count: list.length, updated: true };
  }

  // ==========================================================================
  // 6. FINANCIAL OPERATIONS: FEE STRUCTURES, INVOICES, PAYMENTS & AUDIT
  // ==========================================================================

  async createFeeStructure(schoolId: string, data: CreateFeeStructureDTO) {
    const newFeeStructure: SyntheticFeeStructure = {
      id: `fs-${randomUUID().slice(0, 8)}`,
      schoolId,
      className: data.className,
      feeHead: data.feeHead,
      amount: data.amount,
      frequency: data.frequency,
      createdAt: new Date().toISOString(),
    };

    MOCK_FEE_STRUCTURES.unshift(newFeeStructure);
    return newFeeStructure;
  }

  async listFeeInvoices(schoolId: string, studentProfileId?: string) {
    let list = MOCK_INVOICES.filter((i) => i.schoolId === schoolId);
    if (studentProfileId) {
      list = list.filter((i) => i.studentProfileId === studentProfileId);
    }
    return list;
  }

  /**
   * Atomic Simulated Payment Processing & Receipt Generation
   */
  async recordFeePayment(schoolId: string, collectedByUserId: string, data: RecordFeePaymentDTO) {
    const invoice = MOCK_INVOICES.find((i) => i.id === data.invoiceId && i.schoolId === schoolId);
    if (!invoice) {
      throw new AppError(`Fee invoice '${data.invoiceId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const remainingDue = invoice.amountDue - invoice.amountPaid - invoice.discountApplied;
    if (data.amountPaid > remainingDue) {
      throw new AppError(
        `Payment amount (₹ ${data.amountPaid}) exceeds remaining outstanding balance of ₹ ${remainingDue}.`,
        400,
        'OVERPAYMENT_REJECTED'
      );
    }

    // Atomic update
    invoice.amountPaid += data.amountPaid;
    invoice.status = (invoice.amountPaid + invoice.discountApplied >= invoice.amountDue) ? 'PAID' : 'PARTIALLY_PAID';

    const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment: SyntheticFeePayment = {
      id: `pay-${randomUUID().slice(0, 8)}`,
      schoolId,
      invoiceId: invoice.id,
      receiptNumber,
      studentName: invoice.studentName,
      amountPaid: data.amountPaid,
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef,
      isSimulated: true, // Clearly declared simulated payment transaction
      notes: data.notes,
      collectedByUserId,
      paidAt: new Date().toISOString(),
    };

    MOCK_PAYMENTS.unshift(payment);

    invoice.auditTrail.unshift({
      action: 'PAYMENT_RECORDED',
      amount: data.amountPaid,
      authorizedByUserId: collectedByUserId,
      reason: `Simulated ${data.paymentMethod} payment recorded. Receipt: ${receiptNumber}`,
      timestamp: new Date().toISOString(),
    });

    return {
      receiptNumber,
      invoiceNumber: invoice.invoiceNumber,
      studentName: invoice.studentName,
      amountPaid: data.amountPaid,
      newOutstandingBalance: invoice.amountDue - invoice.amountPaid - invoice.discountApplied,
      invoiceStatus: invoice.status,
      isSimulated: true,
      paidAt: payment.paidAt,
    };
  }

  /**
   * Audited Fee Concession / Scholarship Application
   */
  async applyFeeConcession(schoolId: string, authorizedByUserId: string, data: ApplyFeeConcessionDTO) {
    const invoice = MOCK_INVOICES.find((i) => i.id === data.invoiceId && i.schoolId === schoolId);
    if (!invoice) {
      throw new AppError(`Invoice '${data.invoiceId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    invoice.discountApplied += data.concessionAmount;
    if (invoice.amountPaid + invoice.discountApplied >= invoice.amountDue) {
      invoice.status = 'PAID';
    }

    invoice.auditTrail.unshift({
      action: 'CONCESSION_APPLIED',
      amount: data.concessionAmount,
      authorizedByUserId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    return invoice;
  }

  /**
   * Audited Fee Refund Processing
   */
  async recordFeeRefund(schoolId: string, authorizedByUserId: string, data: RecordFeeRefundDTO) {
    const invoice = MOCK_INVOICES.find((i) => i.id === data.invoiceId && i.schoolId === schoolId);
    if (!invoice) {
      throw new AppError(`Invoice '${data.invoiceId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    if (data.refundAmount > invoice.amountPaid) {
      throw new AppError(
        `Refund amount (₹ ${data.refundAmount}) cannot exceed total paid amount (₹ ${invoice.amountPaid}).`,
        400,
        'INVALID_REFUND_AMOUNT'
      );
    }

    invoice.amountPaid -= data.refundAmount;
    invoice.status = invoice.amountPaid === 0 ? 'REFUNDED' : 'PARTIALLY_PAID';

    invoice.auditTrail.push({
      action: 'REFUND_PROCESSED',
      amount: data.refundAmount,
      authorizedByUserId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    return invoice;
  }

  /**
   * Financial Summary & Audit Statistics (Restricted to Accounts, Admin, Principal)
   */
  async getFinancialSummary(schoolId: string, callerRole: string): Promise<FinancialSummaryReport> {
    const permittedRoles: string[] = [
      PlatformRole.SUPER_ADMIN,
      PlatformRole.SCHOOL_ADMIN,
      PlatformRole.PRINCIPAL,
      PlatformRole.ACCOUNTS,
    ];

    if (!permittedRoles.includes(callerRole)) {
      throw new AppError(
        'Access denied. Private institutional financial records and fee ledgers are restricted to authorized accounts personnel.',
        403,
        'FORBIDDEN_ROLE'
      );
    }

    const schoolInvoices = MOCK_INVOICES.filter((i) => i.schoolId === schoolId);
    const totalInvoiced = schoolInvoices.reduce((acc, i) => acc + i.amountDue, 0);
    const totalCollected = schoolInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
    const totalConcessions = schoolInvoices.reduce((acc, i) => acc + i.discountApplied, 0);
    const totalOutstanding = Math.max(0, totalInvoiced - totalCollected - totalConcessions);

    const paidCount = schoolInvoices.filter((i) => i.status === 'PAID').length;
    const partialCount = schoolInvoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
    const overdueCount = schoolInvoices.filter((i) => i.status === 'OVERDUE' || (i.status === 'UNPAID' && new Date(i.dueDate) < new Date())).length;

    const rate = totalInvoiced > 0 ? Number(((totalCollected / totalInvoiced) * 100).toFixed(1)) : 0;

    const recentTx = MOCK_PAYMENTS.filter((p) => p.schoolId === schoolId).slice(0, 10).map((p) => ({
      receiptNo: p.receiptNumber,
      studentName: p.studentName,
      amount: p.amountPaid,
      method: p.paymentMethod,
      date: p.paidAt,
      isSimulated: p.isSimulated,
    }));

    return {
      schoolId,
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalConcessions,
      totalRefunded: 0,
      collectionRatePercentage: rate,
      invoicesCount: schoolInvoices.length,
      paidInvoicesCount: paidCount,
      partialInvoicesCount: partialCount,
      overdueInvoicesCount: overdueCount,
      recentTransactions: recentTx,
    };
  }

  /**
   * Export Financial Ledger as Sanitized CSV (Guarded for authorized personnel)
   */
  async exportFinancialLedgerCSV(schoolId: string, callerRole: string): Promise<string> {
    const permittedRoles: string[] = [
      PlatformRole.SUPER_ADMIN,
      PlatformRole.SCHOOL_ADMIN,
      PlatformRole.PRINCIPAL,
      PlatformRole.ACCOUNTS,
    ];

    if (!permittedRoles.includes(callerRole)) {
      throw new AppError('Unauthorized to export confidential institutional financial records.', 403, 'FORBIDDEN_ROLE');
    }

    const invoices = MOCK_INVOICES.filter((i) => i.schoolId === schoolId);
    let csv = 'Invoice Number,Student Name,Class,Fee Head,Amount Due,Amount Paid,Discount Applied,Status,Due Date\n';

    for (const inv of invoices) {
      csv += `"${inv.invoiceNumber}","${inv.studentName}","${inv.className}","${inv.feeStructureHead}",${inv.amountDue},${inv.amountPaid},${inv.discountApplied},"${inv.status}","${inv.dueDate}"\n`;
    }

    return csv;
  }
}

export const operationsService = new OperationsService();
