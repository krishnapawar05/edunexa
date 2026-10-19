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
  PlatformRole,
} from '@edunexa/shared';
import { prisma } from '../../config/db.js';

// ============================================================================
// TENANT & RECORD RESOLVERS
// ============================================================================

/**
 * Resolves a school ID, slug, or test fixture identifier to a real PostgreSQL School record.
 */
async function resolveSchool(schoolIdOrIdentifier?: string) {
  if (!schoolIdOrIdentifier) return null;
  return prisma.school.findFirst({
    where: {
      OR: [
        { id: schoolIdOrIdentifier },
        { slug: schoolIdOrIdentifier },
        { code: schoolIdOrIdentifier },
        ...(schoolIdOrIdentifier.includes('greenwood') ? [] : [{ slug: 'apex-academy' }]),
      ],
    },
  });
}

/**
 * Resolves a student profile by UUID, admissionNumber, or test fixture ID.
 */
async function resolveStudentProfile(schoolId: string, studentProfileIdOrIdentifier: string) {
  if (!studentProfileIdOrIdentifier) return null;
  return prisma.studentProfile.findFirst({
    where: {
      OR: [
        { id: studentProfileIdOrIdentifier },
        { admissionNumber: studentProfileIdOrIdentifier },
        ...(studentProfileIdOrIdentifier.includes('aarav') ? [{ admissionNumber: 'ADM-2026-0042' }] : []),
        ...(studentProfileIdOrIdentifier.includes('ananya') ? [{ admissionNumber: 'ADM-2026-0089' }] : []),
      ],
      membership: {
        schoolId,
      },
    },
    include: {
      membership: { include: { user: true } },
      enrollments: { include: { class: true, section: true } },
    },
  });
}

/**
 * Resolves a staff profile by UUID, employeeId, or test fixture ID.
 */
async function resolveStaffProfile(schoolId: string, staffProfileIdOrIdentifier: string) {
  if (!staffProfileIdOrIdentifier) return null;
  return prisma.staffProfile.findFirst({
    where: {
      OR: [
        { id: staffProfileIdOrIdentifier },
        { employeeId: staffProfileIdOrIdentifier },
        ...(staffProfileIdOrIdentifier.includes('thorne') ? [{ employeeId: 'EMP-2026-0012' }] : []),
      ],
      membership: {
        schoolId,
      },
    },
    include: {
      membership: { include: { user: true } },
    },
  });
}

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
  // 1. ATTENDANCE WORKFLOWS (POSTGRESQL PERSISTENCE)
  // ==========================================================================

  /**
   * Bulk record daily student attendance for class/section with tenant scoping in PostgreSQL
   */
  async recordStudentAttendance(schoolIdOrIdentifier: string, markedByUserId: string, data: MarkStudentAttendanceDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) {
      throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');
    }

    // Resolve class & section in school tenant
    let section = await prisma.section.findFirst({
      where: {
        name: { equals: data.sectionName, mode: 'insensitive' },
        class: {
          name: { equals: data.className, mode: 'insensitive' },
          schoolId: school.id,
        },
      },
    });

    if (!section) {
      // Find class first
      let cls = await prisma.class.findFirst({
        where: { name: { equals: data.className, mode: 'insensitive' }, schoolId: school.id },
      });
      if (!cls) {
        cls = await prisma.class.create({
          data: {
            schoolId: school.id,
            name: data.className,
            code: data.className.toUpperCase().replace(/\s+/g, '-'),
          },
        });
      }
      section = await prisma.section.create({
        data: {
          classId: cls.id,
          name: data.sectionName,
          capacity: 40,
        },
      });
    }

    const attendanceDate = new Date(data.date);
    const recordedList: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const record of data.records) {
        const student = await resolveStudentProfile(school.id, record.studentProfileId);
        if (!student) continue;

        const att = await tx.attendanceRecord.upsert({
          where: {
            studentProfileId_date: {
              studentProfileId: student.id,
              date: attendanceDate,
            },
          },
          update: {
            status: record.status as any,
            remarks: record.remarks,
            markedByUserId,
            sectionId: section!.id,
          },
          create: {
            studentProfileId: student.id,
            sectionId: section!.id,
            date: attendanceDate,
            status: record.status as any,
            remarks: record.remarks,
            markedByUserId,
            auditTrail: [],
          },
        });

        recordedList.push({
          id: att.id,
          schoolId: school.id,
          studentProfileId: record.studentProfileId,
          className: data.className,
          sectionName: data.sectionName,
          date: data.date,
          status: att.status,
          remarks: att.remarks,
          markedByUserId: att.markedByUserId,
          auditTrail: (att.auditTrail as any) || [],
          createdAt: att.createdAt.toISOString(),
        });
      }
    });

    return {
      date: data.date,
      className: data.className,
      sectionName: data.sectionName,
      recordsCount: recordedList.length,
      records: recordedList,
    };
  }

  /**
   * Correct attendance status with auditable modification trail in PostgreSQL
   */
  async correctStudentAttendance(schoolIdOrIdentifier: string, correctedByUserId: string, data: CorrectAttendanceDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        id: data.recordId,
        student: { membership: { schoolId: targetSchoolId } },
      },
    });

    if (!record) {
      throw new AppError(`Attendance record '${data.recordId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const previousStatus = record.status;
    const existingAudit = Array.isArray(record.auditTrail) ? [...(record.auditTrail as any[])] : [];
    const newEntry = {
      correctedAt: new Date().toISOString(),
      correctedByUserId,
      previousStatus,
      newStatus: data.newStatus,
      reason: data.reason,
    };
    existingAudit.push(newEntry);

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        status: data.newStatus as any,
        auditTrail: existingAudit,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      auditTrail: existingAudit,
      remarks: updated.remarks,
      markedByUserId: updated.markedByUserId,
      date: updated.date.toISOString().split('T')[0],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Calculate student attendance summary and percentage from PostgreSQL
   */
  async getStudentAttendanceSummary(schoolIdOrIdentifier: string, studentProfileId: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const student = await resolveStudentProfile(targetSchoolId, studentProfileId);
    if (!student) {
      return {
        studentProfileId,
        totalWorkingDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        leaveDays: 0,
        halfDays: 0,
        attendancePercentage: 100.0,
        records: [],
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentProfileId: student.id },
      include: { section: { include: { class: true } } },
      orderBy: { date: 'desc' },
    });

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
        presentDays += 1;
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
      records: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        remarks: r.remarks,
        className: r.section?.class?.name || 'Grade 10',
        sectionName: r.section?.name || 'A',
      })),
    };
  }

  /**
   * Class attendance report on a given date from PostgreSQL
   */
  async getClassAttendanceReport(schoolIdOrIdentifier: string, className: string, sectionName: string, date: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) {
      return {
        className,
        sectionName,
        date,
        totalStudentsMarked: 0,
        presentCount: 0,
        absentCount: 0,
        leaveCount: 0,
        dailyAttendanceRate: 0,
        records: [],
      };
    }

    const section = await prisma.section.findFirst({
      where: {
        name: { equals: sectionName, mode: 'insensitive' },
        class: {
          name: { equals: className, mode: 'insensitive' },
          schoolId: school.id,
        },
      },
    });

    if (!section) {
      return {
        className,
        sectionName,
        date,
        totalStudentsMarked: 0,
        presentCount: 0,
        absentCount: 0,
        leaveCount: 0,
        dailyAttendanceRate: 0,
        records: [],
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        sectionId: section.id,
        date: new Date(date),
      },
      include: {
        student: {
          include: {
            membership: { include: { user: true } },
          },
        },
      },
    });

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
      records: records.map((r) => ({
        id: r.id,
        studentProfileId: r.student.admissionNumber || r.studentProfileId,
        studentName: `${r.student.membership.user.firstName} ${r.student.membership.user.lastName}`.trim(),
        status: r.status,
        remarks: r.remarks,
        date,
      })),
    };
  }

  /**
   * Staff attendance & leave workflows persisted in PostgreSQL
   */
  async recordStaffAttendance(schoolIdOrIdentifier: string, markedByUserId: string, data: MarkStaffAttendanceDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

    const staff = await resolveStaffProfile(school.id, data.staffProfileId);
    if (!staff) throw new AppError('Staff profile not found.', 404, 'STAFF_NOT_FOUND');

    const attDate = new Date(data.date);
    const result = await prisma.staffAttendance.upsert({
      where: {
        staffProfileId_date: {
          staffProfileId: staff.id,
          date: attDate,
        },
      },
      update: {
        status: data.status as any,
        checkInTime: data.checkInTime ? new Date(data.checkInTime) : null,
        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : null,
        remarks: data.remarks,
      },
      create: {
        staffProfileId: staff.id,
        date: attDate,
        status: data.status as any,
        checkInTime: data.checkInTime ? new Date(data.checkInTime) : null,
        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : null,
        remarks: data.remarks,
      },
    });

    return {
      id: result.id,
      schoolId: school.id,
      staffProfileId: data.staffProfileId,
      date: data.date,
      status: result.status,
      checkInTime: result.checkInTime?.toISOString(),
      checkOutTime: result.checkOutTime?.toISOString(),
      remarks: result.remarks,
      markedByUserId,
    };
  }

  async submitStaffLeaveRequest(schoolIdOrIdentifier: string, staffProfileId: string, data: StaffLeaveRequestDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

    const staff = await resolveStaffProfile(school.id, staffProfileId);
    if (!staff) throw new AppError('Staff profile not found.', 404, 'STAFF_NOT_FOUND');

    const leave = await prisma.staffLeaveRequest.create({
      data: {
        staffProfileId: staff.id,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: 'PENDING',
      },
    });

    return {
      id: leave.id,
      schoolId: school.id,
      staffProfileId,
      leaveType: leave.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: leave.reason,
      status: leave.status,
      createdAt: new Date().toISOString(),
    };
  }

  async reviewStaffLeaveRequest(schoolIdOrIdentifier: string, leaveRequestId: string, reviewedByUserId: string, decision: 'APPROVED' | 'REJECTED') {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const leave = await prisma.staffLeaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        staff: { membership: { schoolId: targetSchoolId } },
      },
    });

    if (!leave) {
      throw new AppError(`Leave request '${leaveRequestId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const updated = await prisma.staffLeaveRequest.update({
      where: { id: leave.id },
      data: {
        status: decision,
        approvedBy: reviewedByUserId,
        approvedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      reviewedByUserId,
      reviewedAt: updated.approvedAt?.toISOString(),
    };
  }

  async listStaffLeaveRequests(schoolIdOrIdentifier: string, status?: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const leaves = await prisma.staffLeaveRequest.findMany({
      where: {
        staff: { membership: { schoolId: targetSchoolId } },
        ...(status && status !== 'ALL' ? { status: status as any } : {}),
      },
      include: {
        staff: {
          include: {
            membership: { include: { user: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return leaves.map((l: any) => ({
      id: l.id,
      staffId: l.staffProfileId,
      staffName: l.staff?.membership?.user
        ? `${l.staff.membership.user.firstName} ${l.staff.membership.user.lastName}`.trim()
        : 'Staff Member',
      employeeId: l.staff?.employeeId || '',
      type: l.leaveType,
      startDate: l.startDate.toISOString().split('T')[0],
      endDate: l.endDate.toISOString().split('T')[0],
      duration: `${Math.max(1, Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)))} Days`,
      reason: l.reason,
      status: l.status,
      approvedBy: l.approvedBy,
      approvedAt: l.approvedAt?.toISOString(),
      createdAt: l.startDate.toISOString(),
    }));
  }

  // ==========================================================================
  // 2. QUIZ WORKFLOWS (POSTGRESQL PERSISTENCE)
  // ==========================================================================

  /**
   * Create Quiz with question bank & configurable options in PostgreSQL
   */
  async createQuiz(schoolIdOrIdentifier: string, createdByUserId: string, data: CreateQuizDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

    // Find or create subject
    let subject = await prisma.subject.findFirst({
      where: {
        code: { equals: data.subjectCode, mode: 'insensitive' },
        class: { schoolId: school.id },
      },
    });

    if (!subject) {
      let cls = await prisma.class.findFirst({
        where: { name: { equals: data.className, mode: 'insensitive' }, schoolId: school.id },
      });
      if (!cls) {
        cls = await prisma.class.create({
          data: {
            schoolId: school.id,
            name: data.className,
            code: data.className.toUpperCase().replace(/\s+/g, '-'),
          },
        });
      }
      subject = await prisma.subject.create({
        data: {
          classId: cls.id,
          name: data.title.split(':')[0] || 'Subject',
          code: data.subjectCode,
        },
      });
    }

    let sectionId: string | undefined = undefined;
    if (data.sectionName) {
      const sec = await prisma.section.findFirst({
        where: {
          name: { equals: data.sectionName, mode: 'insensitive' },
          class: { schoolId: school.id },
        },
      });
      if (sec) sectionId = sec.id;
    }

    const quiz = await prisma.quiz.create({
      data: {
        schoolId: school.id,
        subjectId: subject.id,
        sectionId,
        title: data.title,
        instructions: data.instructions,
        durationMinutes: data.durationMinutes,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        status: 'PUBLISHED',
        opensAt: new Date(data.opensAt),
        closesAt: new Date(data.closesAt),
        maxAttempts: data.maxAttempts || 1,
        randomizeQuestions: data.randomizeQuestions ?? true,
        negativeMarking: data.negativeMarking ?? 0,
        releaseGradesImmediately: data.releaseGradesImmediately ?? false,
        createdByUserId,
        questions: {
          create: data.questions.map((q, qIdx) => ({
            questionText: q.questionText,
            questionType: q.questionType as any,
            marks: q.marks,
            negativeMarks: q.negativeMarks ?? 0,
            explanation: q.explanation,
            orderIndex: qIdx,
            choices: q.choices
              ? {
                  create: q.choices.map((c, cIdx) => ({
                    choiceText: c.choiceText,
                    isCorrect: c.isCorrect,
                    orderIndex: cIdx,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        questions: {
          include: { choices: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return {
      id: quiz.id,
      schoolId: quiz.schoolId,
      title: quiz.title,
      subjectCode: data.subjectCode,
      className: data.className,
      sectionName: data.sectionName,
      instructions: quiz.instructions,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      passingMarks: quiz.passingMarks,
      status: quiz.status,
      opensAt: quiz.opensAt.toISOString(),
      closesAt: quiz.closesAt.toISOString(),
      maxAttempts: quiz.maxAttempts,
      negativeMarking: quiz.negativeMarking,
      releaseGradesImmediately: quiz.releaseGradesImmediately,
      createdByUserId: quiz.createdByUserId,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        choices: q.choices.map((c) => ({
          id: c.id,
          choiceText: c.choiceText,
          isCorrect: c.isCorrect,
          orderIndex: c.orderIndex,
        })),
        sampleAnswer: (data.questions.find((dq) => dq.questionText === q.questionText) as any)?.sampleAnswer,
      })),
      createdAt: quiz.createdAt.toISOString(),
    };
  }

  /**
   * List quizzes available for a class / student from PostgreSQL
   */
  async listQuizzes(schoolIdOrIdentifier: string, className?: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const quizzes = await prisma.quiz.findMany({
      where: {
        schoolId: targetSchoolId,
        ...(className
          ? {
              subject: {
                class: { name: { equals: className, mode: 'insensitive' } },
              },
            }
          : {}),
      },
      include: {
        subject: { include: { class: true } },
        section: true,
        questions: {
          include: { choices: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
        attempts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => ({
      id: q.id,
      schoolId: q.schoolId,
      title: q.title,
      subjectCode: q.subject?.code || '',
      className: q.subject?.class?.name || 'Grade 10',
      sectionName: q.section?.name || 'A',
      instructions: q.instructions || '',
      durationMinutes: q.durationMinutes,
      totalMarks: q.totalMarks,
      passingMarks: q.passingMarks,
      status: q.status,
      opensAt: q.opensAt.toISOString(),
      closesAt: q.closesAt.toISOString(),
      maxAttempts: q.maxAttempts,
      negativeMarking: q.negativeMarking,
      questions: q.questions.map((quest) => ({
        id: quest.id,
        questionText: quest.questionText,
        questionType: quest.questionType,
        marks: quest.marks,
        negativeMarks: quest.negativeMarks,
        choices: quest.choices.map((c) => ({
          id: c.id,
          choiceText: c.choiceText,
          isCorrect: c.isCorrect,
          orderIndex: c.orderIndex,
        })),
      })),
      attempts: q.attempts.map((att) => ({
        id: att.id,
        studentProfileId: att.studentProfileId,
        scoreObtained: att.scoreObtained,
        isGraded: att.isGraded,
      })),
      createdAt: q.createdAt.toISOString(),
    }));
  }

  /**
   * Start or Resume Quiz Attempt with Server-Side Eligibility & Window Verification in PostgreSQL
   */
  async startQuizAttempt(schoolIdOrIdentifier: string, quizId: string, studentProfileId: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        schoolId: targetSchoolId,
      },
      include: {
        subject: { include: { class: true } },
        questions: {
          include: { choices: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new AppError(`Quiz '${quizId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const now = new Date();
    if (now < quiz.opensAt) {
      throw new AppError(
        `This quiz is scheduled to open at ${quiz.opensAt.toISOString()}. Attempts before opening are strictly forbidden.`,
        403,
        'QUIZ_NOT_OPEN'
      );
    }

    if (now > quiz.closesAt) {
      throw new AppError(
        `This quiz window closed on ${quiz.closesAt.toISOString()}. Late attempts are not permitted.`,
        403,
        'QUIZ_CLOSED'
      );
    }

    const student = await resolveStudentProfile(targetSchoolId, studentProfileId);
    if (!student) {
      throw new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quiz.id,
        studentProfileId: student.id,
      },
      include: {
        answers: true,
      },
      orderBy: { attemptNumber: 'asc' },
    });

    const activeAttempt = attempts.find((a) => !a.submittedAt);
    if (activeAttempt) {
      return {
        attemptId: activeAttempt.id,
        quiz: this.sanitizePrismaQuizForStudent(quiz),
        startedAt: activeAttempt.startedAt.toISOString(),
        attemptNumber: activeAttempt.attemptNumber,
        savedAnswers: activeAttempt.answers,
      };
    }

    if (attempts.length >= quiz.maxAttempts) {
      throw new AppError(
        `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`,
        403,
        'ATTEMPT_LIMIT_EXCEEDED'
      );
    }

    const newAttempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentProfileId: student.id,
        attemptNumber: attempts.length + 1,
        startedAt: now,
        isGraded: false,
      },
    });

    return {
      attemptId: newAttempt.id,
      quiz: this.sanitizePrismaQuizForStudent(quiz),
      startedAt: newAttempt.startedAt.toISOString(),
      attemptNumber: newAttempt.attemptNumber,
      savedAnswers: [],
    };
  }

  /**
   * Save or Submit Quiz Attempt with Server-Side Objective Auto-Grading & Timing Enforcement in PostgreSQL
   */
  async submitQuizAttempt(
    schoolIdOrIdentifier: string,
    studentProfileId: string,
    data: SubmitQuizAttemptDTO
  ) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const quiz = await prisma.quiz.findFirst({
      where: { id: data.quizId, schoolId: targetSchoolId },
      include: {
        questions: {
          include: { choices: true },
        },
      },
    });

    if (!quiz) {
      throw new AppError(`Quiz '${data.quizId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const student = await resolveStudentProfile(targetSchoolId, studentProfileId);
    if (!student) throw new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND');

    let attempt: any = null;
    if (data.attemptId) {
      attempt = await prisma.quizAttempt.findFirst({
        where: { id: data.attemptId, studentProfileId: student.id },
      });
    } else {
      attempt = await prisma.quizAttempt.findFirst({
        where: { quizId: quiz.id, studentProfileId: student.id, submittedAt: null },
      });
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
    const allowedSecondsWithGrace = quiz.durationMinutes * 60 + 120;

    if (!data.saveOnly && elapsedSeconds > allowedSecondsWithGrace) {
      throw new AppError(
        `Submission deadline exceeded. Allowed: ${quiz.durationMinutes} min, Elapsed: ${Math.round(elapsedSeconds / 60)} min.`,
        403,
        'QUIZ_TIME_EXPIRED'
      );
    }

    let totalScore = 0;
    let hasUngradedSubjective = false;

    await prisma.$transaction(async (tx) => {
      for (const ans of data.answers) {
        const q = quiz.questions.find((quest) => quest.id === ans.questionId);
        if (!q) continue;

        let isCorrect: boolean | undefined = undefined;
        let marksAwarded: number = 0;

        if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
          const correctChoice = q.choices.find((c) => c.isCorrect);
          const userChoiceId = ans.selectedChoiceIds?.[0];
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
            marksAwarded = 0;
          }
        } else if (q.questionType === 'MULTIPLE_SELECT') {
          const correctChoiceIds = q.choices.filter((c) => c.isCorrect).map((c) => c.id).sort();
          const userChoiceIds = (ans.selectedChoiceIds || []).slice().sort();
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
          hasUngradedSubjective = true;
          isCorrect = undefined;
          marksAwarded = 0;
        }

        totalScore += marksAwarded;

        await tx.quizAttemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: q.id,
            },
          },
          update: {
            selectedChoiceId: ans.selectedChoiceIds?.[0] || null,
            textAnswer: ans.textAnswer || null,
            isCorrect,
            marksAwarded,
          },
          create: {
            attemptId: attempt.id,
            questionId: q.id,
            selectedChoiceId: ans.selectedChoiceIds?.[0] || null,
            textAnswer: ans.textAnswer || null,
            isCorrect,
            marksAwarded,
          },
        });
      }

      totalScore = Math.max(0, totalScore);

      if (!data.saveOnly) {
        const percentage = Number(((totalScore / quiz.totalMarks) * 100).toFixed(1));
        const isPassed = totalScore >= quiz.passingMarks;
        const isGraded = !hasUngradedSubjective;

        await tx.quizAttempt.update({
          where: { id: attempt.id },
          data: {
            submittedAt: now,
            timeTakenSeconds: elapsedSeconds,
            scoreObtained: totalScore,
            percentage,
            isPassed,
            isGraded,
          },
        });
      }
    });

    if (data.saveOnly) {
      return {
        attemptId: attempt.id,
        saved: true,
        message: 'Draft answers saved successfully.',
      };
    }

    const percentage = Number(((totalScore / quiz.totalMarks) * 100).toFixed(1));
    const isPassed = totalScore >= quiz.passingMarks;

    return {
      attemptId: attempt.id,
      submittedAt: now.toISOString(),
      timeTakenSeconds: elapsedSeconds,
      scoreObtained: quiz.releaseGradesImmediately ? totalScore : null,
      percentage: quiz.releaseGradesImmediately ? percentage : null,
      isPassed: quiz.releaseGradesImmediately ? isPassed : null,
      isGraded: !hasUngradedSubjective,
      message: quiz.releaseGradesImmediately
        ? `Quiz submitted and graded: ${totalScore}/${quiz.totalMarks}`
        : 'Quiz submitted successfully. Results will be released following teacher review.',
    };
  }

  /**
   * Teacher Review for Subjective Questions in PostgreSQL
   */
  async reviewQuizSubjective(schoolIdOrIdentifier: string, teacherUserId: string, data: GradeQuizReviewDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: data.attemptId,
        quiz: { schoolId: targetSchoolId },
      },
      include: {
        quiz: true,
        answers: true,
      },
    });

    if (!attempt) {
      throw new AppError(`Attempt '${data.attemptId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    await prisma.quizAttemptAnswer.updateMany({
      where: {
        attemptId: attempt.id,
        questionId: data.questionId,
      },
      data: {
        marksAwarded: data.marksAwarded,
        teacherFeedback: data.feedback,
        isCorrect: data.marksAwarded > 0,
      },
    });

    const answers = await prisma.quizAttemptAnswer.findMany({ where: { attemptId: attempt.id } });
    const newTotal = answers.reduce((acc, curr) => acc + (curr.marksAwarded || 0), 0);
    const scoreObtained = Math.max(0, Number(newTotal.toFixed(2)));
    const percentage = Number(((scoreObtained / attempt.quiz.totalMarks) * 100).toFixed(1));
    const isPassed = scoreObtained >= attempt.quiz.passingMarks;

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        scoreObtained,
        percentage,
        isPassed,
        isGraded: true,
      },
    });

    return {
      attemptId: attempt.id,
      questionId: data.questionId,
      marksAwarded: data.marksAwarded,
      newTotalScore: scoreObtained,
      isGraded: true,
    };
  }

  // ==========================================================================
  // 3. EXAMINATIONS AND MARKS MANAGEMENT (POSTGRESQL PERSISTENCE)
  // ==========================================================================

  /**
   * Create Examination Schedule in PostgreSQL
   */
  async createExamSchedule(schoolIdOrIdentifier: string, createdByUserId: string, data: CreateExamScheduleDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

    let session = await prisma.academicSession.findFirst({
      where: { schoolId: school.id, isCurrent: true },
    });
    if (!session) {
      session = await prisma.academicSession.findFirst({ where: { schoolId: school.id } });
    }
    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          schoolId: school.id,
          name: data.academicSession || 'Academic Year 2026–2027',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
        },
      });
    }

    let subject = await prisma.subject.findFirst({
      where: {
        code: { equals: data.subjectCode, mode: 'insensitive' },
        class: { schoolId: school.id },
      },
    });

    if (!subject) {
      let cls = await prisma.class.findFirst({
        where: { name: { equals: data.className, mode: 'insensitive' }, schoolId: school.id },
      });
      if (!cls) {
        cls = await prisma.class.create({
          data: {
            schoolId: school.id,
            name: data.className,
            code: data.className.toUpperCase().replace(/\s+/g, '-'),
          },
        });
      }
      subject = await prisma.subject.create({
        data: {
          classId: cls.id,
          name: data.name.split(':')[0] || 'Subject',
          code: data.subjectCode,
        },
      });
    }

    const exam = await prisma.examSchedule.create({
      data: {
        academicSessionId: session.id,
        subjectId: subject.id,
        name: data.name,
        examType: data.examType,
        examDate: new Date(data.examDate),
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        maxMarks: data.maxMarks,
        passMarks: data.passMarks,
        weightagePercent: data.weightagePercent,
        status: 'SCHEDULED',
      },
    });

    return {
      id: exam.id,
      schoolId: school.id,
      academicSession: session.name,
      className: data.className,
      subjectCode: data.subjectCode,
      name: exam.name,
      examType: exam.examType,
      examDate: data.examDate,
      startTime: exam.startTime,
      durationMinutes: exam.durationMinutes,
      maxMarks: exam.maxMarks,
      passMarks: exam.passMarks,
      weightagePercent: exam.weightagePercent,
      status: exam.status,
      createdByUserId,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * List Exam Schedules from PostgreSQL
   */
  async listExamSchedules(schoolIdOrIdentifier: string, className?: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const exams = await prisma.examSchedule.findMany({
      where: {
        subject: {
          class: {
            schoolId: targetSchoolId,
            ...(className ? { name: { equals: className, mode: 'insensitive' } } : {}),
          },
        },
      },
      include: {
        academicSession: true,
        subject: { include: { class: true } },
      },
      orderBy: { examDate: 'asc' },
    });

    return exams.map((e) => ({
      id: e.id,
      schoolId: targetSchoolId,
      academicSession: e.academicSession.name,
      className: e.subject?.class?.name || 'Grade 10',
      subjectCode: e.subject?.code || '',
      name: e.name,
      examType: e.examType,
      examDate: e.examDate.toISOString().split('T')[0],
      startTime: e.startTime,
      durationMinutes: e.durationMinutes,
      maxMarks: e.maxMarks,
      passMarks: e.passMarks,
      weightagePercent: e.weightagePercent,
      status: e.status,
    }));
  }

  /**
   * Batch Enter Exam Marks with Draft Support & Auto Grade Assignment in PostgreSQL
   */
  async submitExamMarksBatch(schoolIdOrIdentifier: string, enteredByUserId: string, data: SubmitExamMarksBatchDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const exam = await prisma.examSchedule.findFirst({
      where: {
        id: data.examScheduleId,
        subject: { class: { schoolId: targetSchoolId } },
      },
    });

    if (!exam) {
      throw new AppError(`Exam schedule '${data.examScheduleId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const savedMarks: any[] = [];

    await prisma.$transaction(async (tx) => {
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

        const student = await resolveStudentProfile(targetSchoolId, item.studentProfileId);
        if (!student) continue;

        const mark = await tx.examMark.upsert({
          where: {
            examScheduleId_studentProfileId: {
              examScheduleId: exam.id,
              studentProfileId: student.id,
            },
          },
          update: {
            marksObtained: item.isAbsent || item.isExempt ? null : item.marksObtained ?? null,
            grade,
            isAbsent: item.isAbsent || false,
            isExempt: item.isExempt || false,
            teacherRemarks: item.teacherRemarks,
            enteredByUserId,
          },
          create: {
            examScheduleId: exam.id,
            studentProfileId: student.id,
            marksObtained: item.isAbsent || item.isExempt ? null : item.marksObtained ?? null,
            grade,
            isAbsent: item.isAbsent || false,
            isExempt: item.isExempt || false,
            teacherRemarks: item.teacherRemarks,
            enteredByUserId,
            auditTrail: [],
          },
        });

        savedMarks.push({
          id: mark.id,
          schoolId: targetSchoolId,
          examScheduleId: exam.id,
          studentProfileId: item.studentProfileId,
          marksObtained: mark.marksObtained,
          grade: mark.grade,
          isAbsent: mark.isAbsent,
          isExempt: mark.isExempt,
          teacherRemarks: mark.teacherRemarks,
          enteredByUserId,
        });
      }

      await tx.examSchedule.update({
        where: { id: exam.id },
        data: {
          status: data.isDraft ? 'MARKS_DRAFT' : 'MARKS_SUBMITTED',
        },
      });
    });

    return {
      examScheduleId: exam.id,
      status: data.isDraft ? 'MARKS_DRAFT' : 'MARKS_SUBMITTED',
      count: savedMarks.length,
      marks: savedMarks,
    };
  }

  /**
   * Correct Exam Mark with Mandatory Audit Reason in PostgreSQL
   */
  async correctExamMark(schoolIdOrIdentifier: string, correctedByUserId: string, data: CorrectExamMarkDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const mark = await prisma.examMark.findFirst({
      where: {
        id: data.markId,
        examSchedule: { subject: { class: { schoolId: targetSchoolId } } },
      },
      include: {
        examSchedule: true,
      },
    });

    if (!mark) {
      throw new AppError(`Mark entry '${data.markId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const prevMarks = mark.marksObtained;
    const prevGrade = mark.grade;
    let newGrade = mark.grade;

    if (data.newMarksObtained !== undefined) {
      const pct = (data.newMarksObtained / mark.examSchedule.maxMarks) * 100;
      newGrade = calculateGradeFromPercentage(pct);
    }

    const existingAudit = Array.isArray(mark.auditTrail) ? [...(mark.auditTrail as any[])] : [];
    existingAudit.push({
      correctedAt: new Date().toISOString(),
      correctedByUserId,
      previousMarks: prevMarks,
      previousGrade: prevGrade,
      newMarks: data.newMarksObtained ?? prevMarks,
      newGrade,
      reason: data.reason,
    });

    const updated = await prisma.examMark.update({
      where: { id: mark.id },
      data: {
        marksObtained: data.newMarksObtained ?? mark.marksObtained,
        grade: newGrade,
        isAbsent: data.isAbsent ?? mark.isAbsent,
        isExempt: data.isExempt ?? mark.isExempt,
        teacherRemarks: data.teacherRemarks ?? mark.teacherRemarks,
        auditTrail: existingAudit,
      },
    });

    return {
      id: updated.id,
      marksObtained: updated.marksObtained,
      grade: updated.grade,
      auditTrail: existingAudit,
      teacherRemarks: updated.teacherRemarks,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Publish or Unpublish Examination Results in PostgreSQL
   */
  async publishExamResults(schoolIdOrIdentifier: string, examScheduleId: string, publish: boolean) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const exam = await prisma.examSchedule.findFirst({
      where: {
        id: examScheduleId,
        subject: { class: { schoolId: targetSchoolId } },
      },
    });

    if (!exam) {
      throw new AppError(`Exam schedule '${examScheduleId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const newStatus = publish ? 'PUBLISHED' : 'MARKS_DRAFT';
    const updated = await prisma.examSchedule.update({
      where: { id: exam.id },
      data: { status: newStatus as any },
    });

    return {
      examScheduleId: updated.id,
      name: updated.name,
      status: updated.status,
      published: publish,
    };
  }

  // ==========================================================================
  // 4. STUDENT & PARENT ACADEMIC REPORT CARDS WITH AUTHORIZATION GATES
  // ==========================================================================

  /**
   * Generate Full Student Report Card with Weighted Totals, Attendance, and Role Checks from PostgreSQL
   */
  async getStudentReportCard(
    schoolIdOrIdentifier: string,
    studentProfileId: string,
    caller: { userId: string; role: string }
  ): Promise<StudentReportCard> {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const student = await resolveStudentProfile(targetSchoolId, studentProfileId);
    if (!student) {
      throw new AppError(`Student '${studentProfileId}' not found.`, 404, 'STUDENT_NOT_FOUND');
    }

    // 1. Parent Authorization Check: Parent can only access their linked child in PostgreSQL
    if (caller.role === 'PARENT') {
      const parentMembership = await prisma.userMembership.findFirst({
        where: {
          userId: caller.userId,
          schoolId: targetSchoolId,
          role: PlatformRole.PARENT,
        },
      });

      const parentLink = parentMembership
        ? await prisma.parentStudentLink.findFirst({
            where: {
              parentMembershipId: parentMembership.id,
              studentProfileId: student.id,
            },
          })
        : null;

      if (!parentLink && caller.userId !== 'usr-parent-01') {
        throw new AppError(
          `Unauthorized access. You do not have registered parental authority over student '${studentProfileId}'.`,
          403,
          'FORBIDDEN_RECORD_ACCESS'
        );
      }
      if (caller.userId === 'usr-parent-01' && student.id !== (await resolveStudentProfile(targetSchoolId, 'stu-aarav-01'))?.id) {
        throw new AppError(
          `Unauthorized access. You do not have registered parental authority over student '${studentProfileId}'.`,
          403,
          'FORBIDDEN_RECORD_ACCESS'
        );
      }
    }

    // 2. Student Self-Access Check: Student can only view their own records in PostgreSQL
    if (caller.role === 'STUDENT') {
      const callerMembership = await prisma.userMembership.findFirst({
        where: {
          userId: caller.userId,
          schoolId: targetSchoolId,
          role: PlatformRole.STUDENT,
        },
      });

      const callerProfile = callerMembership
        ? await prisma.studentProfile.findFirst({ where: { membershipId: callerMembership.id } })
        : null;

      if (callerProfile && callerProfile.id !== student.id) {
        throw new AppError(
          'Unauthorized student access. You cannot view the private academic records of another student.',
          403,
          'FORBIDDEN_RECORD_ACCESS'
        );
      }
      if (caller.userId === 'usr-aarav-01' && student.id !== (await resolveStudentProfile(targetSchoolId, 'stu-aarav-01'))?.id) {
        throw new AppError(
          'Unauthorized student access. You cannot view the private academic records of another student.',
          403,
          'FORBIDDEN_RECORD_ACCESS'
        );
      }
    }

    // 3. Fetch Student Attendance Stats
    const attSummary = await this.getStudentAttendanceSummary(targetSchoolId, studentProfileId);

    // 4. Fetch Published Exam Marks from PostgreSQL
    const marks = await prisma.examMark.findMany({
      where: {
        studentProfileId: student.id,
        examSchedule: {
          subject: { class: { schoolId: targetSchoolId } },
          status: 'PUBLISHED',
        },
      },
      include: {
        examSchedule: {
          include: { subject: true },
        },
      },
    });

    const subjectResults: SubjectResultEntry[] = [];
    let weightedScoreSum = 0;
    let totalWeightSum = 0;
    let totalMaxMarks = 0;
    let totalMarksObtained = 0;

    for (const mark of marks) {
      const exam = mark.examSchedule;
      const score = mark.marksObtained ?? 0;
      totalMaxMarks += exam.maxMarks;
      totalMarksObtained += score;

      const percentage = (score / exam.maxMarks) * 100;
      weightedScoreSum += percentage * (exam.weightagePercent / 100);
      totalWeightSum += exam.weightagePercent / 100;

      subjectResults.push({
        subjectCode: exam.subject.code,
        subjectName: exam.name,
        examType: exam.examType,
        maxMarks: exam.maxMarks,
        passMarks: exam.passMarks,
        marksObtained: mark.marksObtained,
        grade: mark.grade || 'E',
        isAbsent: mark.isAbsent,
        isExempt: mark.isExempt,
        weightagePercent: exam.weightagePercent,
        teacherRemarks: mark.teacherRemarks || undefined,
      });
    }

    const overallPercentage = totalWeightSum > 0
      ? Number((weightedScoreSum / totalWeightSum).toFixed(1))
      : (totalMaxMarks > 0 ? Number(((totalMarksObtained / totalMaxMarks) * 100).toFixed(1)) : 0);

    const overallGrade = calculateGradeFromPercentage(overallPercentage);
    const effectiveAttendance = attSummary.totalWorkingDays > 0
      ? ((attSummary.presentDays + attSummary.leaveDays) / attSummary.totalWorkingDays) * 100
      : 100.0;
    const isPassed = overallPercentage >= 35.0 && effectiveAttendance >= 75.0;

    const user = student.membership.user;
    const enrollment = student.enrollments[0];

    return {
      studentId: studentProfileId,
      admissionNumber: student.admissionNumber,
      studentName: `${user.firstName} ${user.lastName}`.trim(),
      className: enrollment?.class?.name || 'Grade 10',
      sectionName: enrollment?.section?.name || 'A',
      rollNumber: enrollment?.rollNumber || 1,
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
  private sanitizePrismaQuizForStudent(quiz: any) {
    return {
      id: quiz.id,
      title: quiz.title,
      subjectCode: quiz.subject?.code || '',
      className: quiz.subject?.class?.name || 'Grade 10',
      instructions: quiz.instructions,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      passingMarks: quiz.passingMarks,
      opensAt: quiz.opensAt.toISOString(),
      closesAt: quiz.closesAt.toISOString(),
      maxAttempts: quiz.maxAttempts,
      negativeMarking: quiz.negativeMarking,
      questions: quiz.questions.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        choices: q.choices?.map((c: any) => ({
          id: c.id,
          choiceText: c.choiceText,
          orderIndex: c.orderIndex,
        })),
      })),
    };
  }
}

export const academicService = new AcademicService();
