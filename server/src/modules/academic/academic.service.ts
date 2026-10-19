import { randomUUID } from 'crypto';
import { AppError } from '../../middleware/errorHandler.js';
import {
  AttendanceStatus,
  AttendanceStatusType,
  QuestionType,
  QuizStatus,
  ExamStatus,
  MarkStudentAttendanceDTO,
  CorrectAttendanceDTO,
  MarkStaffAttendanceDTO,
  StaffLeaveRequestDTO,
  CreateQuizDTO,
  SubmitQuizAttemptDTO,
  GradeQuizReviewDTO,
  CreateExamScheduleDTO,
  SubmitExamMarksBatchDTO,
  CorrectExamMarkDTO,
  PublishExamDTO,
  StudentReportCard,
  SubjectResultEntry,
} from '@edunexa/shared';

// ============================================================================
// DATA MODELS FOR ACADEMIC WORKFLOWS
// ============================================================================

export interface SyntheticAttendanceRecord {
  id: string;
  schoolId: string;
  studentProfileId: string;
  className: string;
  sectionName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatusType;
  remarks?: string;
  markedByUserId: string;
  auditTrail: Array<{
    correctedAt: string;
    correctedByUserId: string;
    previousStatus: AttendanceStatusType;
    newStatus: AttendanceStatusType;
    reason: string;
  }>;
  createdAt: string;
}

export interface SyntheticStaffAttendance {
  id: string;
  schoolId: string;
  staffProfileId: string;
  date: string;
  status: AttendanceStatusType;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  markedByUserId: string;
}

export interface SyntheticStaffLeaveRequest {
  id: string;
  schoolId: string;
  staffProfileId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedByUserId?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SyntheticQuizChoice {
  id: string;
  choiceText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface SyntheticQuizQuestion {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'DESCRIPTIVE';
  marks: number;
  negativeMarks: number;
  explanation?: string;
  orderIndex: number;
  choices?: SyntheticQuizChoice[];
  sampleAnswer?: string;
}

export interface SyntheticQuiz {
  id: string;
  schoolId: string;
  title: string;
  subjectCode: string;
  className: string;
  sectionName?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  opensAt: string; // ISO String
  closesAt: string; // ISO String
  maxAttempts: number;
  randomizeQuestions: boolean;
  negativeMarking: number;
  releaseGradesImmediately: boolean;
  createdByUserId: string;
  questions: SyntheticQuizQuestion[];
  createdAt: string;
}

export interface SyntheticQuizAttemptAnswer {
  questionId: string;
  selectedChoiceIds?: string[];
  textAnswer?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
  teacherFeedback?: string;
}

export interface SyntheticQuizAttempt {
  id: string;
  quizId: string;
  studentProfileId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  scoreObtained?: number;
  percentage?: number;
  isPassed?: boolean;
  isGraded: boolean;
  answers: SyntheticQuizAttemptAnswer[];
  createdAt: string;
}

export interface SyntheticExamSchedule {
  id: string;
  schoolId: string;
  academicSession: string;
  className: string;
  subjectCode: string;
  name: string;
  examType: 'UNIT_TEST' | 'MID_TERM' | 'FINAL_TERM' | 'PRACTICAL';
  examDate: string;
  startTime: string;
  durationMinutes: number;
  maxMarks: number;
  passMarks: number;
  weightagePercent: number;
  status: 'SCHEDULED' | 'MARKS_DRAFT' | 'MARKS_SUBMITTED' | 'PUBLISHED' | 'ARCHIVED';
  createdByUserId: string;
  createdAt: string;
}

export interface SyntheticExamMark {
  id: string;
  schoolId: string;
  examScheduleId: string;
  studentProfileId: string;
  marksObtained: number | null;
  grade: string;
  isAbsent: boolean;
  isExempt: boolean;
  teacherRemarks?: string;
  enteredByUserId: string;
  auditTrail: Array<{
    correctedAt: string;
    correctedByUserId: string;
    previousMarks: number | null;
    previousGrade: string;
    newMarks: number | null;
    newGrade: string;
    reason: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SEED STORE (REALISTIC SYNTHETIC DATA)
// ============================================================================

const MOCK_ATTENDANCE: SyntheticAttendanceRecord[] = [
  // Aarav Sharma (Grade 10 A) past attendance records
  {
    id: 'att-aarav-01',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-14',
    status: 'PRESENT',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-14T08:30:00.000Z',
  },
  {
    id: 'att-aarav-02',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-15',
    status: 'PRESENT',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-15T08:30:00.000Z',
  },
  {
    id: 'att-aarav-03',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-16',
    status: 'LATE',
    remarks: 'Bus breakdown on Route 4',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-16T08:45:00.000Z',
  },
  {
    id: 'att-aarav-04',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-17',
    status: 'PRESENT',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-17T08:30:00.000Z',
  },
  {
    id: 'att-aarav-05',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-18',
    status: 'APPROVED_LEAVE',
    remarks: 'Inter-school science olympiad',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-18T08:30:00.000Z',
  },
  // Ananya Deshmukh (Grade 10 A) past attendance records
  {
    id: 'att-ananya-01',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-ananya-02',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-14',
    status: 'PRESENT',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-14T08:30:00.000Z',
  },
  {
    id: 'att-ananya-02',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-ananya-02',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-15',
    status: 'PRESENT',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-15T08:30:00.000Z',
  },
  {
    id: 'att-ananya-03',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-ananya-02',
    className: 'Grade 10',
    sectionName: 'A',
    date: '2026-10-16',
    status: 'ABSENT',
    remarks: 'Uninformed absence',
    markedByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-16T08:30:00.000Z',
  },
];

const MOCK_STAFF_ATTENDANCE: SyntheticStaffAttendance[] = [
  {
    id: 'satt-thorne-01',
    schoolId: 'sch-apex-01',
    staffProfileId: 'staff-thorne-01',
    date: '2026-10-18',
    status: 'PRESENT',
    checkInTime: '2026-10-18T07:45:00.000Z',
    checkOutTime: '2026-10-18T16:15:00.000Z',
    remarks: 'Biometric verified at Gate A',
    markedByUserId: 'usr-sys-biometric',
  },
];

const MOCK_STAFF_LEAVE: SyntheticStaffLeaveRequest[] = [
  {
    id: 'leave-vance-01',
    schoolId: 'sch-apex-01',
    staffProfileId: 'staff-vance-02',
    leaveType: 'CASUAL',
    startDate: '2026-10-25',
    endDate: '2026-10-26',
    reason: 'Family wedding engagement',
    status: 'PENDING',
    createdAt: '2026-10-18T10:00:00.000Z',
  },
];

const MOCK_QUIZZES: SyntheticQuiz[] = [
  {
    id: 'quiz-phy-01',
    schoolId: 'sch-apex-01',
    title: 'Physics Chapter 4: Electromagnetism & Induction',
    subjectCode: 'PHY-10',
    className: 'Grade 10',
    sectionName: 'A',
    instructions: 'Timed assessment. Negative marking of 0.25 marks applies to incorrect MCQs.',
    durationMinutes: 30,
    totalMarks: 20,
    passingMarks: 8,
    status: 'PUBLISHED',
    opensAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Opened yesterday
    closesAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // Closes next week
    maxAttempts: 1,
    randomizeQuestions: true,
    negativeMarking: 0.25,
    releaseGradesImmediately: true,
    createdByUserId: 'usr-thorne-01',
    questions: [
      {
        id: 'q-phy-1',
        questionText: 'What is the SI unit of magnetic flux density?',
        questionType: 'MULTIPLE_CHOICE',
        marks: 5,
        negativeMarks: 1.25,
        explanation: 'Tesla (T) is the SI unit of magnetic flux density (B). Weber (Wb) is magnetic flux.',
        orderIndex: 0,
        choices: [
          { id: 'c-1a', choiceText: 'Tesla (T)', isCorrect: true, orderIndex: 0 },
          { id: 'c-1b', choiceText: 'Weber (Wb)', isCorrect: false, orderIndex: 1 },
          { id: 'c-1c', choiceText: 'Henry (H)', isCorrect: false, orderIndex: 2 },
          { id: 'c-1d', choiceText: 'Gauss (G)', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'q-phy-2',
        questionText: 'According to Faraday\'s law of induction, induced EMF is directly proportional to the rate of change of magnetic flux.',
        questionType: 'TRUE_FALSE',
        marks: 5,
        negativeMarks: 1.25,
        explanation: 'Faraday stated that induced EMF = -d(Phi)/dt.',
        orderIndex: 1,
        choices: [
          { id: 'c-2a', choiceText: 'True', isCorrect: true, orderIndex: 0 },
          { id: 'c-2b', choiceText: 'False', isCorrect: false, orderIndex: 1 },
        ],
      },
      {
        id: 'q-phy-3',
        questionText: 'Which of the following factors increase the strength of an electromagnet? (Select all that apply)',
        questionType: 'MULTIPLE_SELECT',
        marks: 5,
        negativeMarks: 0,
        explanation: 'Increasing current, number of coil turns, and using a ferromagnetic soft iron core all enhance field strength.',
        orderIndex: 2,
        choices: [
          { id: 'c-3a', choiceText: 'Increasing electric current through the coil', isCorrect: true, orderIndex: 0 },
          { id: 'c-3b', choiceText: 'Increasing the number of wire turns', isCorrect: true, orderIndex: 1 },
          { id: 'c-3c', choiceText: 'Inserting a soft iron core into the solenoid', isCorrect: true, orderIndex: 2 },
          { id: 'c-3d', choiceText: 'Decreasing the current to zero', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'q-phy-4',
        questionText: 'State Lenz\'s law in your own words regarding the direction of induced current.',
        questionType: 'SHORT_ANSWER',
        marks: 5,
        negativeMarks: 0,
        sampleAnswer: 'The direction of an induced current always opposes the change in magnetic flux that produces it.',
        orderIndex: 3,
      },
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
  },
  {
    id: 'quiz-math-closed',
    schoolId: 'sch-apex-01',
    title: 'Mathematics Unit Test 1: Quadratic Equations',
    subjectCode: 'MATH-10',
    className: 'Grade 10',
    instructions: 'Past test, submissions closed.',
    durationMinutes: 45,
    totalMarks: 25,
    passingMarks: 10,
    status: 'PUBLISHED',
    opensAt: '2026-09-01T09:00:00.000Z',
    closesAt: '2026-09-05T17:00:00.000Z', // Expired
    maxAttempts: 1,
    randomizeQuestions: false,
    negativeMarking: 0,
    releaseGradesImmediately: true,
    createdByUserId: 'usr-vance-02',
    questions: [
      {
        id: 'q-mat-1',
        questionText: 'What is the discriminant of ax^2 + bx + c = 0?',
        questionType: 'MULTIPLE_CHOICE',
        marks: 5,
        negativeMarks: 0,
        orderIndex: 0,
        choices: [
          { id: 'cm-1a', choiceText: 'b^2 - 4ac', isCorrect: true, orderIndex: 0 },
          { id: 'cm-1b', choiceText: 'b^2 + 4ac', isCorrect: false, orderIndex: 1 },
        ],
      },
    ],
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

const MOCK_QUIZ_ATTEMPTS: SyntheticQuizAttempt[] = [];

const MOCK_EXAM_SCHEDULES: SyntheticExamSchedule[] = [
  {
    id: 'exam-mid-phy-10',
    schoolId: 'sch-apex-01',
    academicSession: '2026–2027',
    className: 'Grade 10',
    subjectCode: 'PHY-10',
    name: 'Mid-Term Examination 2026: Physics',
    examType: 'MID_TERM',
    examDate: '2026-09-20',
    startTime: '09:30 AM',
    durationMinutes: 180,
    maxMarks: 100,
    passMarks: 35,
    weightagePercent: 30, // 30% weight in annual calculation
    status: 'PUBLISHED',
    createdByUserId: 'usr-thorne-01',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'exam-mid-math-10',
    schoolId: 'sch-apex-01',
    academicSession: '2026–2027',
    className: 'Grade 10',
    subjectCode: 'MATH-10',
    name: 'Mid-Term Examination 2026: Mathematics',
    examType: 'MID_TERM',
    examDate: '2026-09-22',
    startTime: '09:30 AM',
    durationMinutes: 180,
    maxMarks: 100,
    passMarks: 35,
    weightagePercent: 30,
    status: 'PUBLISHED',
    createdByUserId: 'usr-vance-02',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'exam-fin-phy-10',
    schoolId: 'sch-apex-01',
    academicSession: '2026–2027',
    className: 'Grade 10',
    subjectCode: 'PHY-10',
    name: 'Final Term Examination 2027: Physics',
    examType: 'FINAL_TERM',
    examDate: '2026-10-20',
    startTime: '09:30 AM',
    durationMinutes: 180,
    maxMarks: 100,
    passMarks: 35,
    weightagePercent: 70, // 70% weight
    status: 'MARKS_DRAFT', // Draft marks entered by teacher, UNPUBLISHED to students/parents!
    createdByUserId: 'usr-thorne-01',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
];

const MOCK_EXAM_MARKS: SyntheticExamMark[] = [
  // Aarav Sharma Mid-Term Physics: 92/100 -> A1 (PUBLISHED)
  {
    id: 'mark-aarav-phy-mid',
    schoolId: 'sch-apex-01',
    examScheduleId: 'exam-mid-phy-10',
    studentProfileId: 'stu-aarav-01',
    marksObtained: 92,
    grade: 'A1',
    isAbsent: false,
    isExempt: false,
    teacherRemarks: 'Exceptional analytical clarity in electromagnetic theory.',
    enteredByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-09-25T11:00:00.000Z',
    updatedAt: '2026-09-25T11:00:00.000Z',
  },
  // Aarav Sharma Mid-Term Math: 88/100 -> A2 (PUBLISHED)
  {
    id: 'mark-aarav-math-mid',
    schoolId: 'sch-apex-01',
    examScheduleId: 'exam-mid-math-10',
    studentProfileId: 'stu-aarav-01',
    marksObtained: 88,
    grade: 'A2',
    isAbsent: false,
    isExempt: false,
    teacherRemarks: 'Strong grasp of trigonometry and geometric proofs.',
    enteredByUserId: 'usr-vance-02',
    auditTrail: [],
    createdAt: '2026-09-26T11:00:00.000Z',
    updatedAt: '2026-09-26T11:00:00.000Z',
  },
  // Aarav Sharma Final Term Physics: 95/100 -> A1 (DRAFT / UNPUBLISHED)
  {
    id: 'mark-aarav-phy-fin-draft',
    schoolId: 'sch-apex-01',
    examScheduleId: 'exam-fin-phy-10',
    studentProfileId: 'stu-aarav-01',
    marksObtained: 95,
    grade: 'A1',
    isAbsent: false,
    isExempt: false,
    teacherRemarks: 'Outstanding final performance.',
    enteredByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-10-18T14:00:00.000Z',
    updatedAt: '2026-10-18T14:00:00.000Z',
  },
  // Ananya Deshmukh Mid-Term Physics: 84/100 -> A2 (PUBLISHED)
  {
    id: 'mark-ananya-phy-mid',
    schoolId: 'sch-apex-01',
    examScheduleId: 'exam-mid-phy-10',
    studentProfileId: 'stu-ananya-02',
    marksObtained: 84,
    grade: 'A2',
    isAbsent: false,
    isExempt: false,
    teacherRemarks: 'Good conceptual foundation.',
    enteredByUserId: 'usr-thorne-01',
    auditTrail: [],
    createdAt: '2026-09-25T11:00:00.000Z',
    updatedAt: '2026-09-25T11:00:00.000Z',
  },
];

// Parent to Student Relationship Mapping for Parent-Child Authorization Gate
const MOCK_PARENT_CHILD_LINKS = [
  {
    parentUserId: 'usr-parent-01',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    relationship: 'Father',
    isPrimary: true,
  },
  {
    parentUserId: 'usr-parent-02',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-ananya-02',
    relationship: 'Mother',
    isPrimary: true,
  },
];

// ============================================================================
// GRADING SCALE HELPER (CBSE / ICSE STANDARD)
// ============================================================================

export function calculateGradeFromPercentage(percentage: number): string {
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E'; // Below passing mark
}

export class AcademicService {
  // ==========================================================================
  // 1. ATTENDANCE WORKFLOWS
  // ==========================================================================

  /**
   * Bulk record daily student attendance for class/section with tenant scoping
   */
  async recordStudentAttendance(schoolId: string, markedByUserId: string, data: MarkStudentAttendanceDTO) {
    const recorded: SyntheticAttendanceRecord[] = [];

    for (const record of data.records) {
      // Check if attendance already recorded for this student on this date
      const existingIndex = MOCK_ATTENDANCE.findIndex(
        (a) => a.schoolId === schoolId && a.studentProfileId === record.studentProfileId && a.date === data.date
      );

      if (existingIndex >= 0) {
        // Update existing record
        MOCK_ATTENDANCE[existingIndex].status = record.status;
        MOCK_ATTENDANCE[existingIndex].remarks = record.remarks;
        MOCK_ATTENDANCE[existingIndex].markedByUserId = markedByUserId;
        recorded.push(MOCK_ATTENDANCE[existingIndex]);
      } else {
        const newRecord: SyntheticAttendanceRecord = {
          id: `att-${randomUUID().slice(0, 8)}`,
          schoolId,
          studentProfileId: record.studentProfileId,
          className: data.className,
          sectionName: data.sectionName,
          date: data.date,
          status: record.status,
          remarks: record.remarks,
          markedByUserId,
          auditTrail: [],
          createdAt: new Date().toISOString(),
        };
        MOCK_ATTENDANCE.unshift(newRecord);
        recorded.push(newRecord);
      }
    }

    return {
      date: data.date,
      className: data.className,
      sectionName: data.sectionName,
      recordsCount: recorded.length,
      records: recorded,
    };
  }

  /**
   * Correct attendance status with auditable modification trail
   */
  async correctStudentAttendance(schoolId: string, correctedByUserId: string, data: CorrectAttendanceDTO) {
    const record = MOCK_ATTENDANCE.find((a) => a.id === data.recordId && a.schoolId === schoolId);
    if (!record) {
      throw new AppError(`Attendance record '${data.recordId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const previousStatus = record.status;
    record.status = data.newStatus;
    record.auditTrail.push({
      correctedAt: new Date().toISOString(),
      correctedByUserId,
      previousStatus,
      newStatus: data.newStatus,
      reason: data.reason,
    });

    return record;
  }

  /**
   * Calculate student attendance summary and percentage
   */
  async getStudentAttendanceSummary(schoolId: string, studentProfileId: string) {
    const records = MOCK_ATTENDANCE.filter(
      (a) => a.schoolId === schoolId && a.studentProfileId === studentProfileId
    );

    const totalDays = records.length;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let leaveDays = 0;
    let halfDays = 0;

    for (const r of records) {
      if (r.status === 'PRESENT') presentDays++;
      else if (r.status === 'ABSENT') absentDays++;
      else if (r.status === 'LATE') {
        lateDays++;
        presentDays += 1; // Late students are counted as present for academic eligibility
      } else if (r.status === 'APPROVED_LEAVE') leaveDays++;
      else if (r.status === 'HALF_DAY') {
        halfDays++;
        presentDays += 0.5;
      }
    }

    const attendancePercentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 100.0;

    return {
      studentProfileId,
      totalWorkingDays: totalDays,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      halfDays,
      attendancePercentage,
      records: records.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }

  /**
   * Class attendance report on a given date
   */
  async getClassAttendanceReport(schoolId: string, className: string, sectionName: string, date: string) {
    const records = MOCK_ATTENDANCE.filter(
      (a) =>
        a.schoolId === schoolId &&
        a.className.toLowerCase() === className.toLowerCase() &&
        a.sectionName.toLowerCase() === sectionName.toLowerCase() &&
        a.date === date
    );

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const leave = records.filter((r) => r.status === 'APPROVED_LEAVE').length;

    return {
      className,
      sectionName,
      date,
      totalStudentsMarked: total,
      presentCount: present,
      absentCount: absent,
      leaveCount: leave,
      dailyAttendanceRate: total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0,
      records,
    };
  }

  /**
   * Staff attendance & leave workflows
   */
  async recordStaffAttendance(schoolId: string, markedByUserId: string, data: MarkStaffAttendanceDTO) {
    const existingIndex = MOCK_STAFF_ATTENDANCE.findIndex(
      (s) => s.schoolId === schoolId && s.staffProfileId === data.staffProfileId && s.date === data.date
    );

    if (existingIndex >= 0) {
      MOCK_STAFF_ATTENDANCE[existingIndex].status = data.status;
      MOCK_STAFF_ATTENDANCE[existingIndex].checkInTime = data.checkInTime;
      MOCK_STAFF_ATTENDANCE[existingIndex].checkOutTime = data.checkOutTime;
      MOCK_STAFF_ATTENDANCE[existingIndex].remarks = data.remarks;
      return MOCK_STAFF_ATTENDANCE[existingIndex];
    }

    const newRecord: SyntheticStaffAttendance = {
      id: `satt-${randomUUID().slice(0, 8)}`,
      schoolId,
      staffProfileId: data.staffProfileId,
      date: data.date,
      status: data.status,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      remarks: data.remarks,
      markedByUserId,
    };
    MOCK_STAFF_ATTENDANCE.unshift(newRecord);
    return newRecord;
  }

  async submitStaffLeaveRequest(schoolId: string, staffProfileId: string, data: StaffLeaveRequestDTO) {
    const newLeave: SyntheticStaffLeaveRequest = {
      id: `leave-${randomUUID().slice(0, 8)}`,
      schoolId,
      staffProfileId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    MOCK_STAFF_LEAVE.unshift(newLeave);
    return newLeave;
  }

  async reviewStaffLeaveRequest(schoolId: string, leaveRequestId: string, reviewedByUserId: string, decision: 'APPROVED' | 'REJECTED') {
    const leave = MOCK_STAFF_LEAVE.find((l) => l.id === leaveRequestId && l.schoolId === schoolId);
    if (!leave) {
      throw new AppError(`Leave request '${leaveRequestId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }
    leave.status = decision;
    leave.reviewedByUserId = reviewedByUserId;
    leave.reviewedAt = new Date().toISOString();
    return leave;
  }

  // ==========================================================================
  // 2. QUIZ WORKFLOWS
  // ==========================================================================

  /**
   * Create Quiz with question bank & configurable options
   */
  async createQuiz(schoolId: string, createdByUserId: string, data: CreateQuizDTO) {
    const quizId = `quiz-${randomUUID().slice(0, 8)}`;
    const questions: SyntheticQuizQuestion[] = data.questions.map((q, idx) => ({
      id: q.id || `q-${randomUUID().slice(0, 6)}`,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      negativeMarks: q.negativeMarks ?? 0,
      explanation: q.explanation,
      orderIndex: idx,
      choices: q.choices?.map((c, cIdx) => ({
        id: c.id || `ch-${randomUUID().slice(0, 6)}`,
        choiceText: c.choiceText,
        isCorrect: c.isCorrect,
        orderIndex: cIdx,
      })),
      sampleAnswer: q.sampleAnswer,
    }));

    const newQuiz: SyntheticQuiz = {
      id: quizId,
      schoolId,
      title: data.title,
      subjectCode: data.subjectCode,
      className: data.className,
      sectionName: data.sectionName,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks,
      status: 'PUBLISHED', // Auto-publish for student access if window is open
      opensAt: data.opensAt,
      closesAt: data.closesAt,
      maxAttempts: data.maxAttempts,
      randomizeQuestions: data.randomizeQuestions ?? true,
      negativeMarking: data.negativeMarking ?? 0,
      releaseGradesImmediately: data.releaseGradesImmediately ?? false,
      createdByUserId,
      questions,
      createdAt: new Date().toISOString(),
    };

    MOCK_QUIZZES.unshift(newQuiz);
    return newQuiz;
  }

  /**
   * List quizzes available for a class / student
   */
  async listQuizzes(schoolId: string, className?: string) {
    let list = MOCK_QUIZZES.filter((q) => q.schoolId === schoolId);
    if (className) {
      list = list.filter((q) => q.className.toLowerCase() === className.toLowerCase());
    }
    return list;
  }

  /**
   * Start or Resume Quiz Attempt with Server-Side Eligibility & Window Verification
   */
  async startQuizAttempt(schoolId: string, quizId: string, studentProfileId: string) {
    const quiz = MOCK_QUIZZES.find((q) => q.id === quizId && q.schoolId === schoolId);
    if (!quiz) {
      throw new AppError(`Quiz '${quizId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const now = new Date();
    const opensAt = new Date(quiz.opensAt);
    const closesAt = new Date(quiz.closesAt);

    // 1. Server-side Timing Enforcement: Not open yet
    if (now < opensAt) {
      throw new AppError(
        `This quiz is scheduled to open at ${quiz.opensAt}. Attempts before opening are strictly forbidden.`,
        403,
        'QUIZ_NOT_OPEN'
      );
    }

    // 2. Server-side Timing Enforcement: Closed / Expired
    if (now > closesAt) {
      throw new AppError(
        `This quiz window closed on ${quiz.closesAt}. Late attempts are not permitted.`,
        403,
        'QUIZ_CLOSED'
      );
    }

    // 3. Attempt limit verification
    const studentAttempts = MOCK_QUIZ_ATTEMPTS.filter(
      (a) => a.quizId === quizId && a.studentProfileId === studentProfileId
    );

    const activeAttempt = studentAttempts.find((a) => !a.submittedAt);
    if (activeAttempt) {
      // Return ongoing attempt without revealing correct answers!
      return {
        attemptId: activeAttempt.id,
        quiz: this.sanitizeQuizForStudent(quiz),
        startedAt: activeAttempt.startedAt,
        attemptNumber: activeAttempt.attemptNumber,
        savedAnswers: activeAttempt.answers,
      };
    }

    if (studentAttempts.length >= quiz.maxAttempts) {
      throw new AppError(
        `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`,
        403,
        'ATTEMPT_LIMIT_EXCEEDED'
      );
    }

    // Start fresh attempt
    const newAttempt: SyntheticQuizAttempt = {
      id: `att-qz-${randomUUID().slice(0, 8)}`,
      quizId,
      studentProfileId,
      attemptNumber: studentAttempts.length + 1,
      startedAt: now.toISOString(),
      isGraded: false,
      answers: [],
      createdAt: now.toISOString(),
    };

    MOCK_QUIZ_ATTEMPTS.unshift(newAttempt);

    return {
      attemptId: newAttempt.id,
      quiz: this.sanitizeQuizForStudent(quiz),
      startedAt: newAttempt.startedAt,
      attemptNumber: newAttempt.attemptNumber,
      savedAnswers: [],
    };
  }

  /**
   * Save or Submit Quiz Attempt with Server-Side Objective Auto-Grading & Timing Enforcement
   */
  async submitQuizAttempt(
    schoolId: string,
    studentProfileId: string,
    data: SubmitQuizAttemptDTO
  ) {
    const quiz = MOCK_QUIZZES.find((q) => q.id === data.quizId && q.schoolId === schoolId);
    if (!quiz) {
      throw new AppError(`Quiz '${data.quizId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    // Find attempt
    let attempt: SyntheticQuizAttempt | undefined;
    if (data.attemptId) {
      attempt = MOCK_QUIZ_ATTEMPTS.find((a) => a.id === data.attemptId && a.studentProfileId === studentProfileId);
    } else {
      attempt = MOCK_QUIZ_ATTEMPTS.find((a) => a.quizId === data.quizId && a.studentProfileId === studentProfileId && !a.submittedAt);
    }

    if (!attempt) {
      throw new AppError('No active attempt found for this quiz.', 404, 'ACTIVE_ATTEMPT_NOT_FOUND');
    }

    if (attempt.submittedAt) {
      throw new AppError('This attempt has already been submitted and finalized.', 409, 'ATTEMPT_ALREADY_SUBMITTED');
    }

    const now = new Date();
    const startedAt = new Date(attempt.startedAt);
    const elapsedSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);
    const allowedSecondsWithGrace = quiz.durationMinutes * 60 + 120; // 2 min grace period for network jitter

    // Server-side strict timing check on final submission
    if (!data.saveOnly && elapsedSeconds > allowedSecondsWithGrace) {
      throw new AppError(
        `Submission deadline exceeded. Allowed: ${quiz.durationMinutes} min, Elapsed: ${Math.round(elapsedSeconds / 60)} min.`,
        403,
        'QUIZ_TIME_EXPIRED'
      );
    }

    // Update answers
    const gradedAnswers: SyntheticQuizAttemptAnswer[] = [];
    let totalScore = 0;
    let hasUngradedSubjective = false;

    for (const sub of data.answers) {
      const q = quiz.questions.find((quest) => quest.id === sub.questionId);
      if (!q) continue;

      let isCorrect: boolean | undefined = undefined;
      let marksAwarded: number | undefined = undefined;

      // Objective Auto-Grading
      if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
        const correctChoice = q.choices?.find((c) => c.isCorrect);
        const userChoiceId = sub.selectedChoiceIds?.[0];
        if (correctChoice && userChoiceId) {
          if (correctChoice.id === userChoiceId) {
            isCorrect = true;
            marksAwarded = q.marks;
          } else {
            isCorrect = false;
            marksAwarded = q.negativeMarks > 0 ? -q.negativeMarks : 0;
          }
        } else {
          isCorrect = false;
          marksAwarded = 0; // Unattempted
        }
      } else if (q.questionType === 'MULTIPLE_SELECT') {
        const correctChoiceIds = (q.choices || []).filter((c) => c.isCorrect).map((c) => c.id).sort();
        const userChoiceIds = (sub.selectedChoiceIds || []).slice().sort();

        const isExactMatch =
          correctChoiceIds.length === userChoiceIds.length &&
          correctChoiceIds.every((val, i) => val === userChoiceIds[i]);

        if (isExactMatch) {
          isCorrect = true;
          marksAwarded = q.marks;
        } else {
          isCorrect = false;
          marksAwarded = q.negativeMarks > 0 ? -q.negativeMarks : 0;
        }
      } else {
        // SHORT_ANSWER or DESCRIPTIVE requires teacher review
        hasUngradedSubjective = true;
        isCorrect = undefined;
        marksAwarded = 0;
      }

      totalScore += marksAwarded || 0;

      gradedAnswers.push({
        questionId: sub.questionId,
        selectedChoiceIds: sub.selectedChoiceIds,
        textAnswer: sub.textAnswer,
        isCorrect,
        marksAwarded,
      });
    }

    // Prevent score from dropping below zero
    totalScore = Math.max(0, totalScore);

    attempt.answers = gradedAnswers;

    if (data.saveOnly) {
      // Periodic autosave
      return {
        attemptId: attempt.id,
        saved: true,
        message: 'Draft answers saved successfully.',
      };
    }

    // Finalize submission
    attempt.submittedAt = now.toISOString();
    attempt.timeTakenSeconds = elapsedSeconds;
    attempt.scoreObtained = Number(totalScore.toFixed(2));
    attempt.percentage = Number(((totalScore / quiz.totalMarks) * 100).toFixed(1));
    attempt.isPassed = totalScore >= quiz.passingMarks;
    attempt.isGraded = !hasUngradedSubjective;

    return {
      attemptId: attempt.id,
      submittedAt: attempt.submittedAt,
      timeTakenSeconds: attempt.timeTakenSeconds,
      scoreObtained: quiz.releaseGradesImmediately ? attempt.scoreObtained : null,
      percentage: quiz.releaseGradesImmediately ? attempt.percentage : null,
      isPassed: quiz.releaseGradesImmediately ? attempt.isPassed : null,
      isGraded: attempt.isGraded,
      message: quiz.releaseGradesImmediately
        ? `Quiz submitted and graded: ${attempt.scoreObtained}/${quiz.totalMarks}`
        : 'Quiz submitted successfully. Results will be released following teacher review.',
    };
  }

  /**
   * Teacher Review for Subjective Questions
   */
  async reviewQuizSubjective(schoolId: string, teacherUserId: string, data: GradeQuizReviewDTO) {
    const attempt = MOCK_QUIZ_ATTEMPTS.find((a) => a.id === data.attemptId);
    if (!attempt) {
      throw new AppError(`Attempt '${data.attemptId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const quiz = MOCK_QUIZZES.find((q) => q.id === attempt.quizId && q.schoolId === schoolId);
    if (!quiz) {
      throw new AppError('Quiz not found in this school tenant.', 404, 'RECORD_NOT_FOUND');
    }

    const answer = attempt.answers.find((ans) => ans.questionId === data.questionId);
    if (!answer) {
      throw new AppError('Question answer not found in this attempt.', 404, 'RECORD_NOT_FOUND');
    }

    answer.marksAwarded = data.marksAwarded;
    answer.teacherFeedback = data.feedback;
    answer.isCorrect = data.marksAwarded > 0;

    // Recalculate total score
    const newTotal = attempt.answers.reduce((acc, curr) => acc + (curr.marksAwarded || 0), 0);
    attempt.scoreObtained = Math.max(0, Number(newTotal.toFixed(2)));
    attempt.percentage = Number(((attempt.scoreObtained / quiz.totalMarks) * 100).toFixed(1));
    attempt.isPassed = attempt.scoreObtained >= quiz.passingMarks;
    attempt.isGraded = true;

    return {
      attemptId: attempt.id,
      questionId: data.questionId,
      marksAwarded: data.marksAwarded,
      newTotalScore: attempt.scoreObtained,
      isGraded: attempt.isGraded,
    };
  }

  // ==========================================================================
  // 3. EXAMINATIONS AND MARKS MANAGEMENT
  // ==========================================================================

  /**
   * Create Examination Schedule
   */
  async createExamSchedule(schoolId: string, createdByUserId: string, data: CreateExamScheduleDTO) {
    const newSchedule: SyntheticExamSchedule = {
      id: `exam-${randomUUID().slice(0, 8)}`,
      schoolId,
      academicSession: data.academicSession,
      className: data.className,
      subjectCode: data.subjectCode,
      name: data.name,
      examType: data.examType,
      examDate: data.examDate,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      maxMarks: data.maxMarks,
      passMarks: data.passMarks,
      weightagePercent: data.weightagePercent,
      status: 'SCHEDULED',
      createdByUserId,
      createdAt: new Date().toISOString(),
    };

    MOCK_EXAM_SCHEDULES.unshift(newSchedule);
    return newSchedule;
  }

  /**
   * List Exam Schedules
   */
  async listExamSchedules(schoolId: string, className?: string) {
    let schedules = MOCK_EXAM_SCHEDULES.filter((s) => s.schoolId === schoolId);
    if (className) {
      schedules = schedules.filter((s) => s.className.toLowerCase() === className.toLowerCase());
    }
    return schedules;
  }

  /**
   * Batch Enter Exam Marks with Draft Support & Auto Grade Assignment
   */
  async submitExamMarksBatch(schoolId: string, enteredByUserId: string, data: SubmitExamMarksBatchDTO) {
    const exam = MOCK_EXAM_SCHEDULES.find((s) => s.id === data.examScheduleId && s.schoolId === schoolId);
    if (!exam) {
      throw new AppError(`Exam schedule '${data.examScheduleId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const savedMarks: SyntheticExamMark[] = [];

    for (const item of data.marks) {
      let grade = 'E';
      if (!item.isAbsent && !item.isExempt && item.marksObtained !== undefined) {
        const percentage = (item.marksObtained / exam.maxMarks) * 100;
        grade = calculateGradeFromPercentage(percentage);
      } else if (item.isAbsent) {
        grade = 'AB';
      } else if (item.isExempt) {
        grade = 'EX';
      }

      const existingIndex = MOCK_EXAM_MARKS.findIndex(
        (m) => m.schoolId === schoolId && m.examScheduleId === data.examScheduleId && m.studentProfileId === item.studentProfileId
      );

      if (existingIndex >= 0) {
        MOCK_EXAM_MARKS[existingIndex].marksObtained = item.isAbsent || item.isExempt ? null : item.marksObtained ?? null;
        MOCK_EXAM_MARKS[existingIndex].grade = grade;
        MOCK_EXAM_MARKS[existingIndex].isAbsent = item.isAbsent;
        MOCK_EXAM_MARKS[existingIndex].isExempt = item.isExempt;
        MOCK_EXAM_MARKS[existingIndex].teacherRemarks = item.teacherRemarks;
        MOCK_EXAM_MARKS[existingIndex].updatedAt = new Date().toISOString();
        savedMarks.push(MOCK_EXAM_MARKS[existingIndex]);
      } else {
        const newMark: SyntheticExamMark = {
          id: `mark-${randomUUID().slice(0, 8)}`,
          schoolId,
          examScheduleId: data.examScheduleId,
          studentProfileId: item.studentProfileId,
          marksObtained: item.isAbsent || item.isExempt ? null : item.marksObtained ?? null,
          grade,
          isAbsent: item.isAbsent,
          isExempt: item.isExempt,
          teacherRemarks: item.teacherRemarks,
          enteredByUserId,
          auditTrail: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        MOCK_EXAM_MARKS.unshift(newMark);
        savedMarks.push(newMark);
      }
    }

    // Update exam status
    exam.status = data.isDraft ? 'MARKS_DRAFT' : 'MARKS_SUBMITTED';

    return {
      examScheduleId: exam.id,
      status: exam.status,
      count: savedMarks.length,
      marks: savedMarks,
    };
  }

  /**
   * Correct Exam Mark with Mandatory Audit Reason
   */
  async correctExamMark(schoolId: string, correctedByUserId: string, data: CorrectExamMarkDTO) {
    const mark = MOCK_EXAM_MARKS.find((m) => m.id === data.markId && m.schoolId === schoolId);
    if (!mark) {
      throw new AppError(`Mark entry '${data.markId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const exam = MOCK_EXAM_SCHEDULES.find((s) => s.id === mark.examScheduleId && s.schoolId === schoolId);
    const prevMarks = mark.marksObtained;
    const prevGrade = mark.grade;

    if (data.newMarksObtained !== undefined && exam) {
      mark.marksObtained = data.newMarksObtained;
      const pct = (data.newMarksObtained / exam.maxMarks) * 100;
      mark.grade = calculateGradeFromPercentage(pct);
    }

    if (data.isAbsent !== undefined) mark.isAbsent = data.isAbsent;
    if (data.isExempt !== undefined) mark.isExempt = data.isExempt;
    if (data.teacherRemarks) mark.teacherRemarks = data.teacherRemarks;

    mark.auditTrail.push({
      correctedAt: new Date().toISOString(),
      correctedByUserId,
      previousMarks: prevMarks,
      previousGrade: prevGrade,
      newMarks: mark.marksObtained,
      newGrade: mark.grade,
      reason: data.reason,
    });
    mark.updatedAt = new Date().toISOString();

    return mark;
  }

  /**
   * Publish or Unpublish Examination Results (Controls student/parent visibility)
   */
  async publishExamResults(schoolId: string, examScheduleId: string, publish: boolean) {
    const exam = MOCK_EXAM_SCHEDULES.find((s) => s.id === examScheduleId && s.schoolId === schoolId);
    if (!exam) {
      throw new AppError(`Exam schedule '${examScheduleId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    exam.status = publish ? 'PUBLISHED' : 'MARKS_DRAFT';
    return {
      examScheduleId: exam.id,
      name: exam.name,
      status: exam.status,
      published: publish,
    };
  }

  // ==========================================================================
  // 4. STUDENT & PARENT ACADEMIC DASHBOARDS & REPORT CARDS
  // ==========================================================================

  /**
   * Generate Full Student Report Card with Weighted Totals, Attendance, and Role Checks
   */
  async getStudentReportCard(
    schoolId: string,
    studentProfileId: string,
    caller: { userId: string; role: string }
  ): Promise<StudentReportCard> {
    // 1. Parent Authorization Check: Parent can only access their linked child!
    if (caller.role === 'PARENT') {
      const link = MOCK_PARENT_CHILD_LINKS.find(
        (l) => l.parentUserId === caller.userId && l.studentProfileId === studentProfileId && l.schoolId === schoolId
      );
      if (!link) {
        throw new AppError(
          `Unauthorized access. You do not have registered parental authority over student '${studentProfileId}'.`,
          403,
          'FORBIDDEN_RECORD_ACCESS'
        );
      }
    }

    // 2. Student Self-Access Check: Student can only view their own records!
    if (caller.role === 'STUDENT') {
      // Map user ID to their student profile
      const callerStudentId = caller.userId === 'usr-aarav-01' ? 'stu-aarav-01' : (caller.userId === 'usr-ananya-02' ? 'stu-ananya-02' : null);
      if (callerStudentId && callerStudentId !== studentProfileId) {
        throw new AppError(
          'Unauthorized student access. You cannot view the private academic records of another student.',
          403,
          'FORBIDDEN_RECORD_ACCESS'
        );
      }
    }

    // 3. Fetch Student Attendance Stats
    const attSummary = await this.getStudentAttendanceSummary(schoolId, studentProfileId);

    // 4. Fetch Exam Marks
    const marks = MOCK_EXAM_MARKS.filter(
      (m) => m.schoolId === schoolId && m.studentProfileId === studentProfileId
    );

    const subjectResults: SubjectResultEntry[] = [];
    let weightedScoreSum = 0;
    let totalWeightSum = 0;
    let totalMaxMarks = 0;
    let totalMarksObtained = 0;

    for (const mark of marks) {
      const exam = MOCK_EXAM_SCHEDULES.find((s) => s.id === mark.examScheduleId);
      if (!exam) continue;

      // Privacy Check: Students and parents CANNOT see draft / unpublished marks!
      if ((caller.role === 'STUDENT' || caller.role === 'PARENT') && exam.status !== 'PUBLISHED') {
        continue; // Omit unpublished results
      }

      const score = mark.marksObtained ?? 0;
      totalMaxMarks += exam.maxMarks;
      totalMarksObtained += score;

      // Weighted calculation
      const percentage = (score / exam.maxMarks) * 100;
      weightedScoreSum += percentage * (exam.weightagePercent / 100);
      totalWeightSum += exam.weightagePercent / 100;

      subjectResults.push({
        subjectCode: exam.subjectCode,
        subjectName: exam.name,
        examType: exam.examType,
        maxMarks: exam.maxMarks,
        passMarks: exam.passMarks,
        marksObtained: mark.marksObtained,
        grade: mark.grade,
        isAbsent: mark.isAbsent,
        isExempt: mark.isExempt,
        weightagePercent: exam.weightagePercent,
        teacherRemarks: mark.teacherRemarks,
      });
    }

    const overallPercentage = totalWeightSum > 0
      ? Number((weightedScoreSum / totalWeightSum).toFixed(1))
      : (totalMaxMarks > 0 ? Number(((totalMarksObtained / totalMaxMarks) * 100).toFixed(1)) : 0);

    const overallGrade = calculateGradeFromPercentage(overallPercentage);
    
    // Academic promotion considers academic percentage (>= 35%) and minimum attendance (present + approved leaves)
    const effectiveAttendance = attSummary.totalWorkingDays > 0
      ? ((attSummary.presentDays + attSummary.leaveDays) / attSummary.totalWorkingDays) * 100
      : 100.0;
    const isPassed = overallPercentage >= 35.0 && effectiveAttendance >= 75.0;

    return {
      studentId: studentProfileId,
      admissionNumber: studentProfileId === 'stu-aarav-01' ? 'ADM-2026-0042' : 'ADM-2026-0089',
      studentName: studentProfileId === 'stu-aarav-01' ? 'Aarav Sharma' : 'Ananya Deshmukh',
      className: 'Grade 10',
      sectionName: 'A',
      rollNumber: studentProfileId === 'stu-aarav-01' ? 1 : 2,
      academicSession: '2026–2027',
      attendancePercentage: attSummary.attendancePercentage,
      totalPresent: attSummary.presentDays,
      totalWorkingDays: attSummary.totalWorkingDays,
      results: subjectResults,
      totalMaxMarks,
      totalMarksObtained,
      overallPercentage,
      overallGrade,
      isPassed,
      promotedToNextGrade: isPassed,
      isPublished: subjectResults.length > 0,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper to strip correct answer choices before serving to student
   */
  private sanitizeQuizForStudent(quiz: SyntheticQuiz) {
    return {
      id: quiz.id,
      title: quiz.title,
      subjectCode: quiz.subjectCode,
      className: quiz.className,
      instructions: quiz.instructions,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      passingMarks: quiz.passingMarks,
      opensAt: quiz.opensAt,
      closesAt: quiz.closesAt,
      maxAttempts: quiz.maxAttempts,
      negativeMarking: quiz.negativeMarking,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        choices: q.choices?.map((c) => ({
          id: c.id,
          choiceText: c.choiceText,
          orderIndex: c.orderIndex,
        })),
      })),
    };
  }
}

export const academicService = new AcademicService();
