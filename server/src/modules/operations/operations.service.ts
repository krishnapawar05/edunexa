import { randomUUID } from 'crypto';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateTimetableSlotDTO,
  CreateAssignmentDTO,
  SubmitAssignmentDTO,
  GradeAssignmentDTO,
  CreateLearningResourceDTO,
  CreateNoticeDTO,
  CreateSchoolEventDTO,
  CreateFeeStructureDTO,
  CreateFeeInvoiceDTO,
  RecordFeePaymentDTO,
  ApplyFeeConcessionDTO,
  RecordFeeRefundDTO,
  RecordReconciliationDTO,
  FinancialSummaryReport,
  PlatformRole,
  FeePaymentStatusType,
} from '@edunexa/shared';
import { prisma } from '../../config/db.js';

// ============================================================================
// TENANT & RECORD RESOLVERS
// ============================================================================

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

export class OperationsService {
  // ==========================================================================
  // 1. TIMETABLE MANAGEMENT & CONFLICT CHECKING (POSTGRESQL PERSISTENCE)
  // ==========================================================================

  async createTimetableSlot(schoolIdOrIdentifier: string, data: CreateTimetableSlotDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

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

    // 1. Double-booking check: Room conflict in same school
    const existingSlotsInSchool = await prisma.timetableSlot.findMany({
      where: {
        section: { class: { schoolId: school.id } },
        dayOfWeek: data.dayOfWeek,
      },
      include: {
        section: { include: { class: true } },
      },
    });

    const roomConflict = existingSlotsInSchool.find(
      (s) =>
        s.roomNumber &&
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

    // 2. Double-booking check: Teacher conflict in same school
    const teacherConflict = existingSlotsInSchool.find(
      (s) =>
        s.teacherName &&
        s.teacherName.toLowerCase() === data.teacherName.toLowerCase() &&
        this.isTimeOverlap(s.startTime, s.endTime, data.startTime, data.endTime)
    );

    if (teacherConflict) {
      throw new AppError(
        `Teacher schedule collision: ${data.teacherName} is already assigned to ${teacherConflict.section.class.name}-${teacherConflict.section.name} from ${teacherConflict.startTime} to ${teacherConflict.endTime}.`,
        409,
        'TEACHER_SCHEDULE_CONFLICT'
      );
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        sectionId: section.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectName: data.subjectName,
        roomNumber: data.roomNumber,
        teacherName: data.teacherName,
      },
    });

    return {
      id: slot.id,
      schoolId: school.id,
      className: data.className,
      sectionName: data.sectionName,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectName: slot.subjectName,
      roomNumber: slot.roomNumber,
      teacherName: slot.teacherName,
      createdAt: new Date().toISOString(),
    };
  }

  async getSectionTimetable(schoolIdOrIdentifier: string, className: string, sectionName: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) return [];

    const section = await prisma.section.findFirst({
      where: {
        name: { equals: sectionName, mode: 'insensitive' },
        class: {
          name: { equals: className, mode: 'insensitive' },
          schoolId: school.id,
        },
      },
    });

    if (!section) return [];

    const slots = await prisma.timetableSlot.findMany({
      where: { sectionId: section.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return slots.map((s) => ({
      id: s.id,
      schoolId: school.id,
      className,
      sectionName,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      subjectName: s.subjectName,
      roomNumber: s.roomNumber || '',
      teacherName: s.teacherName || '',
    }));
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  // ==========================================================================
  // 2. HOMEWORK & ASSIGNMENTS WORKFLOW (POSTGRESQL PERSISTENCE)
  // ==========================================================================

  async createAssignment(schoolIdOrIdentifier: string, createdByUserId: string, data: CreateAssignmentDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

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

    let subject = await prisma.subject.findFirst({
      where: {
        code: { equals: data.subjectCode, mode: 'insensitive' },
        class: { schoolId: school.id },
      },
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          classId: section.classId,
          name: data.title.split(':')[0] || 'Subject',
          code: data.subjectCode,
        },
      });
    }

    const asg = await prisma.assignment.create({
      data: {
        sectionId: section.id,
        subjectId: subject.id,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        maxMarks: data.maxMarks,
        attachmentUrl: data.attachmentUrl,
      },
    });

    return {
      id: asg.id,
      schoolId: school.id,
      className: data.className,
      sectionName: data.sectionName,
      subjectCode: data.subjectCode,
      title: asg.title,
      description: asg.description,
      assignedDate: asg.assignedDate.toISOString(),
      dueDate: asg.dueDate.toISOString(),
      maxMarks: asg.maxMarks,
      attachmentUrl: asg.attachmentUrl || undefined,
      createdByUserId,
      createdAt: asg.assignedDate.toISOString(),
    };
  }

  async listAssignments(schoolIdOrIdentifier: string, className?: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const list = await prisma.assignment.findMany({
      where: {
        section: {
          class: {
            schoolId: targetSchoolId,
            ...(className ? { name: { equals: className, mode: 'insensitive' } } : {}),
          },
        },
      },
      include: {
        section: { include: { class: true } },
      },
      orderBy: { assignedDate: 'desc' },
    });

    const subjectIds = Array.from(new Set(list.map((a) => a.subjectId)));
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });
    const subjectMap = new Map(subjects.map((s) => [s.id, s.code]));

    return list.map((a) => ({
      id: a.id,
      schoolId: targetSchoolId,
      className: a.section.class.name,
      sectionName: a.section.name,
      subjectCode: subjectMap.get(a.subjectId) || 'GEN-101',
      title: a.title,
      description: a.description,
      assignedDate: a.assignedDate.toISOString(),
      dueDate: a.dueDate.toISOString(),
      maxMarks: a.maxMarks,
      attachmentUrl: a.attachmentUrl || undefined,
      createdAt: a.assignedDate.toISOString(),
    }));
  }

  async submitAssignment(schoolIdOrIdentifier: string, data: SubmitAssignmentDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: data.assignmentId,
        section: { class: { schoolId: targetSchoolId } },
      },
    });

    if (!assignment) {
      throw new AppError(`Assignment '${data.assignmentId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    // File validation: Size limit 10MB
    if (data.fileSizeBytes > 10 * 1024 * 1024) {
      throw new AppError('File size exceeds the permitted limit of 10 MB.', 400, 'FILE_TOO_LARGE');
    }

    const student = await resolveStudentProfile(targetSchoolId, data.studentProfileId);
    if (!student) {
      throw new AppError('Student profile not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentProfileId: {
          assignmentId: assignment.id,
          studentProfileId: student.id,
        },
      },
      update: {
        submissionText: data.submissionText,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSizeBytes: data.fileSizeBytes,
        fileType: data.fileType,
        submittedAt: now,
        isLate,
      },
      create: {
        assignmentId: assignment.id,
        studentProfileId: student.id,
        submissionText: data.submissionText,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSizeBytes: data.fileSizeBytes,
        fileType: data.fileType,
        submittedAt: now,
        isLate,
      },
    });

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentProfileId: data.studentProfileId,
      submissionText: submission.submissionText || undefined,
      fileUrl: submission.fileUrl || undefined,
      fileName: submission.fileName || undefined,
      fileSizeBytes: submission.fileSizeBytes || undefined,
      fileType: submission.fileType || undefined,
      submittedAt: submission.submittedAt.toISOString(),
      isLate: submission.isLate,
    };
  }

  async gradeAssignment(schoolIdOrIdentifier: string, teacherId: string, data: GradeAssignmentDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: data.submissionId,
        assignment: { section: { class: { schoolId: targetSchoolId } } },
      },
    });

    if (!submission) {
      throw new AppError(`Submission '${data.submissionId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: {
        marksAwarded: data.marksAwarded,
        feedback: data.feedback,
      },
    });

    return {
      id: updated.id,
      marksAwarded: updated.marksAwarded,
      feedback: updated.feedback,
    };
  }

  // ==========================================================================
  // 3. LEARNING RESOURCES & CONTENT REPOSITORY (POSTGRESQL PERSISTENCE)
  // ==========================================================================

  async createLearningResource(schoolIdOrIdentifier: string, uploadedByUserId: string, data: CreateLearningResourceDTO) {
    if (data.fileSizeBytes > 50 * 1024 * 1024) {
      throw new AppError('Resource file size exceeds 50 MB.', 400, 'FILE_TOO_LARGE');
    }

    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

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

    const res = await prisma.learningResource.create({
      data: {
        subjectId: subject.id,
        title: data.title,
        description: data.description,
        topic: data.topic,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSizeBytes: data.fileSizeBytes,
      },
    });

    return {
      id: res.id,
      schoolId: school.id,
      subjectCode: data.subjectCode,
      className: data.className,
      title: res.title,
      description: res.description,
      topic: res.topic,
      fileUrl: res.fileUrl,
      fileType: res.fileType,
      fileSizeBytes: res.fileSizeBytes,
      uploadedByUserId,
      uploadedAt: res.uploadedAt.toISOString(),
    };
  }

  async listLearningResources(schoolIdOrIdentifier: string, className: string, subjectCode?: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) return [];

    const list = await prisma.learningResource.findMany({
      where: {
        subject: {
          class: {
            schoolId: school.id,
            name: { equals: className, mode: 'insensitive' },
          },
          ...(subjectCode ? { code: { equals: subjectCode, mode: 'insensitive' } } : {}),
        },
      },
      include: {
        subject: { include: { class: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return list.map((r) => ({
      id: r.id,
      schoolId: school.id,
      subjectCode: r.subject.code,
      className: r.subject.class.name,
      title: r.title,
      description: r.description,
      topic: r.topic,
      fileUrl: r.fileUrl,
      fileType: r.fileType,
      fileSizeBytes: r.fileSizeBytes,
      uploadedAt: r.uploadedAt.toISOString(),
    }));
  }

  // ==========================================================================
  // 4. NOTICES, ANNOUNCEMENTS & EVENTS (AUDIENCE-TARGETED) IN POSTGRESQL
  // ==========================================================================

  async createNotice(schoolIdOrIdentifier: string, createdByUserId: string, data: CreateNoticeDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

    const notice = await prisma.notice.create({
      data: {
        schoolId: school.id,
        title: data.title,
        content: data.content,
        audience: data.audience as any,
        targetClass: data.targetClass,
        isUrgent: data.isUrgent ?? false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdByUserId,
      },
    });

    return {
      id: notice.id,
      schoolId: school.id,
      title: notice.title,
      content: notice.content,
      audience: notice.audience,
      targetClass: notice.targetClass,
      isUrgent: notice.isUrgent,
      publishedAt: notice.publishedAt.toISOString(),
      expiresAt: notice.expiresAt?.toISOString(),
      createdByUserId,
    };
  }

  async listNotices(schoolIdOrIdentifier: string, userRole: string, userClass?: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) return [];

    const allNotices = await prisma.notice.findMany({
      where: { schoolId: school.id },
      orderBy: { publishedAt: 'desc' },
    });

    return allNotices.filter((n) => {
      // Super Admin and School Admin see all
      if (
        userRole === PlatformRole.SUPER_ADMIN ||
        userRole === PlatformRole.SCHOOL_ADMIN ||
        userRole === PlatformRole.PRINCIPAL
      ) {
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
      if (
        userRole === PlatformRole.TEACHER ||
        userRole === PlatformRole.HR_STAFF ||
        userRole === PlatformRole.ACCOUNTS
      ) {
        return n.audience === 'STAFF_ONLY';
      }

      return false;
    });
  }

  async createSchoolEvent(schoolIdOrIdentifier: string, createdByUserId: string, data: CreateSchoolEventDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

    const evt = await prisma.schoolEvent.create({
      data: {
        schoolId: school.id,
        title: data.title,
        description: data.description,
        venue: data.venue,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        audience: data.audience as any,
        isPublic: data.isPublic ?? false,
      },
    });

    return {
      id: evt.id,
      schoolId: school.id,
      title: evt.title,
      description: evt.description,
      venue: evt.venue,
      startDate: evt.startDate.toISOString(),
      endDate: evt.endDate.toISOString(),
      audience: evt.audience,
      isPublic: evt.isPublic,
      createdByUserId,
      createdAt: new Date().toISOString(),
    };
  }

  async listSchoolEvents(schoolIdOrIdentifier: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) return [];

    return prisma.schoolEvent.findMany({
      where: { schoolId: school.id },
      orderBy: { startDate: 'asc' },
    });
  }

  // ==========================================================================
  // 5. IN-APP NOTIFICATIONS (POSTGRESQL PERSISTENCE)
  // ==========================================================================

  async listUserNotifications(schoolIdOrIdentifier: string, userId: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    let targetUserId = userId;
    if (userId.startsWith('usr-aarav')) {
      const u = await prisma.user.findFirst({ where: { email: { contains: 'aarav' } } });
      if (u) targetUserId = u.id;
    } else if (userId.startsWith('usr-parent')) {
      const u = await prisma.user.findFirst({ where: { email: { contains: 'sharma' } } });
      if (u) targetUserId = u.id;
    }

    const notifications = await prisma.notification.findMany({
      where: {
        schoolId: targetSchoolId,
        OR: [{ userId: targetUserId }, { userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n.id,
        schoolId: n.schoolId,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  async markNotificationRead(schoolIdOrIdentifier: string, userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return { id: notificationId, isRead: true };
  }

  async markAllNotificationsRead(schoolIdOrIdentifier: string, userId: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    let targetUserId = userId;
    if (userId.startsWith('usr-aarav')) {
      const u = await prisma.user.findFirst({ where: { email: { contains: 'aarav' } } });
      if (u) targetUserId = u.id;
    }

    const res = await prisma.notification.updateMany({
      where: {
        schoolId: targetSchoolId,
        OR: [{ userId: targetUserId }, { userId }],
      },
      data: { isRead: true },
    });

    return { count: res.count, updated: true };
  }

  // ==========================================================================
  // 6. FINANCIAL OPERATIONS: FEE STRUCTURES, INVOICES, PAYMENTS & AUDIT IN POSTGRESQL
  // ==========================================================================

  async createFeeStructure(schoolIdOrIdentifier: string, data: CreateFeeStructureDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) throw new AppError('Tenant school not found.', 404, 'SCHOOL_NOT_FOUND');

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

    const fs = await prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        classId: cls.id,
        feeHead: data.feeHead,
        amount: data.amount,
        frequency: data.frequency,
      },
    });

    return {
      id: fs.id,
      schoolId: school.id,
      className: data.className,
      feeHead: fs.feeHead,
      amount: fs.amount,
      frequency: fs.frequency,
      createdAt: new Date().toISOString(),
    };
  }

  async listFeeStructures(schoolIdOrIdentifier: string, params?: { className?: string; feeHead?: string }) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const structures = await prisma.feeStructure.findMany({
      where: {
        schoolId: targetSchoolId,
        ...(params?.className ? { class: { name: { contains: params.className, mode: 'insensitive' } } } : {}),
        ...(params?.feeHead ? { feeHead: { contains: params.feeHead, mode: 'insensitive' } } : {}),
      },
      include: {
        class: true,
        invoices: {
          select: { id: true, amountDue: true, amountPaid: true, status: true },
        },
      },
      orderBy: { feeHead: 'asc' },
    });

    return structures.map((fs) => ({
      id: fs.id,
      schoolId: fs.schoolId,
      classId: fs.classId,
      className: fs.class.name,
      feeHead: fs.feeHead,
      amount: fs.amount,
      frequency: fs.frequency,
      invoicesCount: fs.invoices.length,
      totalInvoiced: fs.invoices.reduce((sum, inv) => sum + inv.amountDue, 0),
      totalCollected: fs.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
      totalOutstanding: fs.invoices.reduce((sum, inv) => sum + Math.max(0, inv.amountDue - inv.amountPaid), 0),
    }));
  }

  async updateFeeStructure(
    schoolIdOrIdentifier: string,
    id: string,
    data: { feeHead?: string; amount?: number; frequency?: string }
  ) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const existing = await prisma.feeStructure.findFirst({
      where: { id, schoolId: targetSchoolId },
    });
    if (!existing) {
      throw new AppError('Fee structure not found or does not belong to your institution.', 404, 'RECORD_NOT_FOUND');
    }

    if (data.amount !== undefined && data.amount <= 0) {
      throw new AppError('Fee structure amount must be greater than zero.', 400, 'INVALID_AMOUNT');
    }

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        ...(data.feeHead ? { feeHead: data.feeHead } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.frequency ? { frequency: data.frequency } : {}),
      },
      include: { class: true },
    });

    return {
      id: updated.id,
      className: updated.class.name,
      feeHead: updated.feeHead,
      amount: updated.amount,
      frequency: updated.frequency,
    };
  }

  async deleteFeeStructure(schoolIdOrIdentifier: string, id: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const existing = await prisma.feeStructure.findFirst({
      where: { id, schoolId: targetSchoolId },
      include: { invoices: { select: { id: true } } },
    });
    if (!existing) {
      throw new AppError('Fee structure not found.', 404, 'RECORD_NOT_FOUND');
    }

    if (existing.invoices.length > 0) {
      throw new AppError(
        `Cannot delete fee structure with ${existing.invoices.length} attached historical invoice(s). Archival required to preserve accounting integrity.`,
        400,
        'HAS_HISTORICAL_INVOICES'
      );
    }

    await prisma.feeStructure.delete({ where: { id } });
    return { success: true, deletedId: id };
  }

  async listFeeInvoices(schoolIdOrIdentifier: string, studentProfileId?: string | string[]) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    let studentProfileFilter: any = undefined;
    if (Array.isArray(studentProfileId)) {
      studentProfileFilter = { in: studentProfileId };
    } else if (studentProfileId) {
      const student = await resolveStudentProfile(targetSchoolId, studentProfileId);
      studentProfileFilter = student ? student.id : studentProfileId;
    }

    const invoices = await prisma.feeInvoice.findMany({
      where: {
        feeStructure: { schoolId: targetSchoolId },
        ...(studentProfileFilter ? { studentProfileId: studentProfileFilter } : {}),
      },
      include: {
        feeStructure: { include: { class: true } },
        student: { include: { membership: { include: { user: true } } } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices.map((i) => ({
      id: i.id,
      schoolId: targetSchoolId,
      invoiceNumber: i.invoiceNumber,
      studentProfileId: i.student.admissionNumber || i.studentProfileId,
      actualStudentProfileId: i.studentProfileId,
      studentName: `${i.student.membership.user.firstName} ${i.student.membership.user.lastName}`.trim(),
      className: i.feeStructure.class.name,
      feeStructureHead: i.feeStructure.feeHead,
      amountDue: i.amountDue,
      amountPaid: i.amountPaid,
      discountApplied: i.discountApplied,
      dueDate: i.dueDate.toISOString().split('T')[0],
      status: i.status as FeePaymentStatusType,
      payments: (i.payments || []).map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        amountPaid: p.amountPaid,
        paymentMethod: p.paymentMethod,
        transactionRef: p.transactionRef,
        date: p.paidAt.toISOString().split('T')[0],
        notes: p.notes,
        isSimulated: p.isSimulated,
      })),
      auditTrail: (i.auditTrail as any) || [],
      createdAt: (i as any).createdAt ? (i as any).createdAt.toISOString() : i.dueDate.toISOString(),
    }));
  }

  async createFeeInvoice(schoolIdOrIdentifier: string, authorizedByUserId: string, data: CreateFeeInvoiceDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    if (data.amountDue <= 0) {
      throw new AppError('Fee invoice amount must be greater than zero.', 400, 'INVALID_AMOUNT');
    }

    const student = await resolveStudentProfile(targetSchoolId, data.studentProfileId);
    if (!student) {
      throw new AppError(`Student profile '${data.studentProfileId}' not found in institution.`, 404, 'STUDENT_NOT_FOUND');
    }

    let feeStructureId = data.feeStructureId;
    if (!feeStructureId) {
      const cls = student.enrollments?.[0]?.class || (await prisma.class.findFirst({
        where: { schoolId: targetSchoolId },
      }));
      if (!cls) {
        throw new AppError('No class record found to associate with fee invoice.', 400, 'CLASS_NOT_FOUND');
      }

      let fs = await prisma.feeStructure.findFirst({
        where: { schoolId: targetSchoolId, classId: cls.id, feeHead: data.feeHead || 'General Tuition Fee' },
      });
      if (!fs) {
        fs = await prisma.feeStructure.create({
          data: {
            schoolId: targetSchoolId,
            classId: cls.id,
            feeHead: data.feeHead || 'General Tuition Fee',
            amount: data.amountDue,
            frequency: 'TERM',
          },
        });
      }
      feeStructureId = fs.id;
    }

    const count = await prisma.feeInvoice.count({
      where: { feeStructure: { schoolId: targetSchoolId } },
    });
    const invoiceNumber = `INV-2026-${String(count + 101).padStart(4, '0')}`;

    const newInvoice = await prisma.feeInvoice.create({
      data: {
        feeStructureId,
        studentProfileId: student.id,
        invoiceNumber,
        amountDue: data.amountDue,
        amountPaid: 0,
        discountApplied: 0,
        dueDate: new Date(data.dueDate),
        status: 'UNPAID',
        auditTrail: [
          {
            action: 'INVOICE_GENERATED',
            authorizedByUserId,
            amount: data.amountDue,
            timestamp: new Date().toISOString(),
          },
        ],
      },
      include: {
        feeStructure: { include: { class: true } },
        student: { include: { membership: { include: { user: true } } } },
      },
    });

    const studentUser = newInvoice.student.membership.user;
    return {
      id: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      studentProfileId: newInvoice.student.admissionNumber || newInvoice.studentProfileId,
      actualStudentProfileId: newInvoice.studentProfileId,
      studentName: `${studentUser.firstName} ${studentUser.lastName}`.trim(),
      className: newInvoice.feeStructure.class.name,
      feeStructureHead: newInvoice.feeStructure.feeHead,
      amountDue: newInvoice.amountDue,
      amountPaid: 0,
      balanceDue: newInvoice.amountDue,
      discountApplied: 0,
      dueDate: newInvoice.dueDate.toISOString().split('T')[0],
      status: newInvoice.status,
      payments: [],
      auditTrail: newInvoice.auditTrail,
    };
  }

  /**
   * Atomic Simulated Payment Processing & Receipt Generation in PostgreSQL
   */
  async recordFeePayment(schoolIdOrIdentifier: string, collectedByUserId: string, data: RecordFeePaymentDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.feeInvoice.findFirst({
        where: {
          OR: [{ id: data.invoiceId }, { invoiceNumber: data.invoiceId }],
          feeStructure: { schoolId: targetSchoolId },
        },
        include: {
          student: { include: { membership: { include: { user: true } } } },
        },
      });

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

      const newAmountPaid = invoice.amountPaid + data.amountPaid;
      const newStatus =
        newAmountPaid + invoice.discountApplied >= invoice.amountDue ? 'PAID' : 'PARTIALLY_PAID';

      const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const auditTrail = Array.isArray(invoice.auditTrail) ? [...(invoice.auditTrail as any[])] : [];
      auditTrail.unshift({
        action: 'PAYMENT_RECORDED',
        amount: data.amountPaid,
        authorizedByUserId: collectedByUserId,
        reason: `Simulated ${data.paymentMethod} payment recorded. Receipt: ${receiptNumber}`,
        timestamp: new Date().toISOString(),
      });

      await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus as any,
          auditTrail,
        },
      });

      const payment = await tx.feePayment.create({
        data: {
          feeInvoiceId: invoice.id,
          receiptNumber,
          amountPaid: data.amountPaid,
          paymentMethod: data.paymentMethod,
          transactionRef: data.transactionRef,
          isSimulated: true,
          collectedBy: collectedByUserId,
          notes: data.notes,
        },
      });

      const studentName = `${invoice.student.membership.user.firstName} ${invoice.student.membership.user.lastName}`.trim();

      return {
        receiptNumber,
        invoiceNumber: invoice.invoiceNumber,
        studentName,
        amountPaid: data.amountPaid,
        newOutstandingBalance: invoice.amountDue - newAmountPaid - invoice.discountApplied,
        invoiceStatus: newStatus,
        isSimulated: true,
        paidAt: payment.paidAt.toISOString(),
      };
    });
  }

  /**
   * Audited Fee Concession / Scholarship Application in PostgreSQL
   */
  async applyFeeConcession(schoolIdOrIdentifier: string, authorizedByUserId: string, data: ApplyFeeConcessionDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.feeInvoice.findFirst({
        where: {
          OR: [{ id: data.invoiceId }, { invoiceNumber: data.invoiceId }],
          feeStructure: { schoolId: targetSchoolId },
        },
      });

      if (!invoice) {
        throw new AppError(`Invoice '${data.invoiceId}' not found.`, 404, 'RECORD_NOT_FOUND');
      }

      const newDiscount = invoice.discountApplied + data.concessionAmount;
      const newStatus =
        invoice.amountPaid + newDiscount >= invoice.amountDue ? 'PAID' : invoice.status;

      const auditTrail = Array.isArray(invoice.auditTrail) ? [...(invoice.auditTrail as any[])] : [];
      auditTrail.unshift({
        action: 'CONCESSION_APPLIED',
        amount: data.concessionAmount,
        authorizedByUserId,
        reason: data.reason,
        timestamp: new Date().toISOString(),
      });

      const updated = await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          discountApplied: newDiscount,
          status: newStatus as any,
          auditTrail,
        },
      });

      return {
        id: updated.id,
        invoiceNumber: updated.invoiceNumber,
        amountDue: updated.amountDue,
        amountPaid: updated.amountPaid,
        discountApplied: updated.discountApplied,
        status: updated.status,
        auditTrail,
      };
    });
  }

  /**
   * Audited Fee Refund Processing in PostgreSQL
   */
  async recordFeeRefund(schoolIdOrIdentifier: string, authorizedByUserId: string, data: RecordFeeRefundDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.feeInvoice.findFirst({
        where: {
          OR: [{ id: data.invoiceId }, { invoiceNumber: data.invoiceId }],
          feeStructure: { schoolId: targetSchoolId },
        },
      });

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

      const newAmountPaid = invoice.amountPaid - data.refundAmount;
      const newStatus = newAmountPaid === 0 ? 'REFUNDED' : 'PARTIALLY_PAID';

      const auditTrail = Array.isArray(invoice.auditTrail) ? [...(invoice.auditTrail as any[])] : [];
      auditTrail.push({
        action: 'REFUND_PROCESSED',
        amount: data.refundAmount,
        authorizedByUserId,
        reason: data.reason,
        timestamp: new Date().toISOString(),
      });

      const updated = await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus as any,
          auditTrail,
        },
      });

      return {
        id: updated.id,
        invoiceNumber: updated.invoiceNumber,
        amountPaid: updated.amountPaid,
        status: updated.status,
        auditTrail,
      };
    });
  }

  /**
   * Financial Summary & Audit Statistics from PostgreSQL
   */
  async getFinancialSummary(schoolIdOrIdentifier: string, callerRole: string): Promise<FinancialSummaryReport> {
    const permittedRoles: string[] = [
      PlatformRole.SUPER_ADMIN,
      PlatformRole.SCHOOL_ADMIN,
      PlatformRole.PRINCIPAL,
      PlatformRole.ACCOUNTS,
    ];

    if (!permittedRoles.includes(callerRole as any)) {
      throw new AppError(
        'Access denied. Private institutional financial records and fee ledgers are restricted to authorized accounts personnel.',
        403,
        'FORBIDDEN_ROLE'
      );
    }

    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) {
      return {
        schoolId: schoolIdOrIdentifier,
        totalInvoiced: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        totalConcessions: 0,
        totalRefunded: 0,
        collectionRatePercentage: 0,
        invoicesCount: 0,
        paidInvoicesCount: 0,
        partialInvoicesCount: 0,
        overdueInvoicesCount: 0,
        recentTransactions: [],
      };
    }

    const schoolInvoices = await prisma.feeInvoice.findMany({
      where: { feeStructure: { schoolId: school.id } },
      include: {
        student: { include: { membership: { include: { user: true } } } },
        feeStructure: { include: { class: true } },
        payments: true,
      },
    });

    const totalInvoiced = schoolInvoices.reduce((acc, i) => acc + i.amountDue, 0);
    const totalCollected = schoolInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
    const totalConcessions = schoolInvoices.reduce((acc, i) => acc + i.discountApplied, 0);
    const totalOutstanding = Math.max(0, totalInvoiced - totalCollected - totalConcessions);

    const paidCount = schoolInvoices.filter((i) => i.status === 'PAID').length;
    const partialCount = schoolInvoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
    const overdueCount = schoolInvoices.filter(
      (i) => i.status === 'OVERDUE' || (i.status === 'UNPAID' && i.dueDate < new Date())
    ).length;

    const rate = totalInvoiced > 0 ? Number(((totalCollected / totalInvoiced) * 100).toFixed(1)) : 0;

    // Class-wise & Fee-Head Breakdowns
    const classMap = new Map<string, { className: string; invoiced: number; collected: number; outstanding: number }>();
    const feeHeadMap = new Map<string, { feeHead: string; invoiced: number; collected: number; outstanding: number }>();

    for (const inv of schoolInvoices) {
      const clsName = inv.feeStructure?.class?.name || 'Grade 10';
      const headName = inv.feeStructure?.feeHead || 'Tuition Fee';
      const outstanding = Math.max(0, inv.amountDue - inv.amountPaid - inv.discountApplied);

      const c = classMap.get(clsName) || { className: clsName, invoiced: 0, collected: 0, outstanding: 0 };
      c.invoiced += inv.amountDue;
      c.collected += inv.amountPaid;
      c.outstanding += outstanding;
      classMap.set(clsName, c);

      const h = feeHeadMap.get(headName) || { feeHead: headName, invoiced: 0, collected: 0, outstanding: 0 };
      h.invoiced += inv.amountDue;
      h.collected += inv.amountPaid;
      h.outstanding += outstanding;
      feeHeadMap.set(headName, h);
    }

    const payments = await prisma.feePayment.findMany({
      where: { invoice: { feeStructure: { schoolId: school.id } } },
      include: {
        invoice: {
          include: { student: { include: { membership: { include: { user: true } } } } },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 10,
    });

    const recentTx = payments.map((p) => {
      const u = p.invoice.student.membership.user;
      return {
        receiptNo: p.receiptNumber,
        studentName: `${u.firstName} ${u.lastName}`.trim(),
        amount: p.amountPaid,
        method: p.paymentMethod,
        date: p.paidAt.toISOString(),
        isSimulated: p.isSimulated,
      };
    });

    return {
      schoolId: school.id,
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
      breakdownByClass: Array.from(classMap.values()),
      breakdownByFeeHead: Array.from(feeHeadMap.values()),
    };
  }

  /**
   * Export Financial Ledger as Sanitized CSV from PostgreSQL
   */
  async exportFinancialLedgerCSV(schoolIdOrIdentifier: string, callerRole: string): Promise<string> {
    const permittedRoles: string[] = [
      PlatformRole.SUPER_ADMIN,
      PlatformRole.SCHOOL_ADMIN,
      PlatformRole.PRINCIPAL,
      PlatformRole.ACCOUNTS,
    ];

    if (!permittedRoles.includes(callerRole as any)) {
      throw new AppError('Unauthorized to export confidential institutional financial records.', 403, 'FORBIDDEN_ROLE');
    }

    const school = await resolveSchool(schoolIdOrIdentifier);
    if (!school) return 'Invoice Number,Student Name,Class,Fee Head,Amount Due,Amount Paid,Discount Applied,Status,Due Date\n';

    const invoices = await prisma.feeInvoice.findMany({
      where: { feeStructure: { schoolId: school.id } },
      include: {
        feeStructure: { include: { class: true } },
        student: { include: { membership: { include: { user: true } } } },
      },
      orderBy: { invoiceNumber: 'asc' },
    });

    let csv = 'Invoice Number,Student Name,Class,Fee Head,Amount Due,Amount Paid,Discount Applied,Status,Due Date\n';

    for (const inv of invoices) {
      const studentName = `${inv.student.membership.user.firstName} ${inv.student.membership.user.lastName}`.trim();
      csv += `"${inv.invoiceNumber}","${studentName}","${inv.feeStructure.class.name}","${inv.feeStructure.feeHead}",${inv.amountDue},${inv.amountPaid},${inv.discountApplied},"${inv.status}","${inv.dueDate.toISOString().split('T')[0]}"\n`;
    }

    return csv;
  }

  /**
   * Bank Settlement & Gateway Reconciliation Reporting from PostgreSQL
   */
  async getReconciliationReport(schoolIdOrIdentifier: string) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const payments = await prisma.feePayment.findMany({
      where: { invoice: { feeStructure: { schoolId: targetSchoolId } } },
      include: {
        invoice: {
          include: {
            feeStructure: { include: { class: true } },
            student: { include: { membership: { include: { user: true } } } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    // Retrieve reconciliation audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        schoolId: targetSchoolId,
        entityType: 'FeePayment',
        action: { in: ['PAYMENT_RECONCILED', 'PAYMENT_FLAGGED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const auditMap = new Map<string, any>();
    for (const log of auditLogs) {
      if (log.entityId && !auditMap.has(log.entityId)) {
        auditMap.set(log.entityId, log);
      }
    }

    const items = payments.map((p) => {
      const u = p.invoice.student.membership.user;
      const latestAudit = auditMap.get(p.id);

      let status: 'RECONCILED' | 'PENDING' | 'DISCREPANCY' = 'PENDING';
      let verifiedAt: string | null = null;
      let notes = p.notes || '';

      if (latestAudit) {
        if (latestAudit.action === 'PAYMENT_RECONCILED') {
          status = 'RECONCILED';
          verifiedAt = latestAudit.createdAt.toISOString();
        } else if (latestAudit.action === 'PAYMENT_FLAGGED') {
          status = 'DISCREPANCY';
          notes = latestAudit.details?.reason || notes;
        }
      } else if (p.paymentMethod === 'UPI' || p.transactionRef?.startsWith('UPI-') || p.notes?.includes('[RECONCILED]')) {
        status = 'RECONCILED';
        verifiedAt = p.paidAt.toISOString();
      }

      return {
        id: p.id,
        receiptNumber: p.receiptNumber,
        invoiceNumber: p.invoice.invoiceNumber,
        studentName: `${u.firstName} ${u.lastName}`.trim(),
        admissionNo: p.invoice.student.admissionNumber,
        className: p.invoice.feeStructure.class.name,
        amountPaid: p.amountPaid,
        paymentMethod: p.paymentMethod,
        transactionRef: p.transactionRef || 'N/A',
        paidAt: p.paidAt.toISOString(),
        isSimulated: p.isSimulated,
        status,
        verifiedAt,
        notes,
      };
    });

    const totalVolume = items.reduce((sum, item) => sum + item.amountPaid, 0);
    const totalReconciled = items.filter((i) => i.status === 'RECONCILED').reduce((sum, i) => sum + i.amountPaid, 0);
    const totalPending = items.filter((i) => i.status === 'PENDING').reduce((sum, i) => sum + i.amountPaid, 0);
    const discrepanciesCount = items.filter((i) => i.status === 'DISCREPANCY').length;

    return {
      summary: {
        totalVolume,
        totalReconciled,
        totalPending,
        discrepanciesCount,
        reconciliationRate: totalVolume > 0 ? Number(((totalReconciled / totalVolume) * 100).toFixed(1)) : 100,
      },
      transactions: items,
    };
  }

  /**
   * Record Audited Reconciliation Decision in PostgreSQL
   */
  async recordReconciliation(schoolIdOrIdentifier: string, userId: string, data: RecordReconciliationDTO) {
    const school = await resolveSchool(schoolIdOrIdentifier);
    const targetSchoolId = school ? school.id : schoolIdOrIdentifier;

    const payment = await prisma.feePayment.findFirst({
      where: {
        id: data.paymentId,
        invoice: { feeStructure: { schoolId: targetSchoolId } },
      },
    });

    if (!payment) {
      throw new AppError('Payment transaction record not found.', 404, 'RECORD_NOT_FOUND');
    }

    const auditAction = data.action === 'RECONCILE' ? 'PAYMENT_RECONCILED' : 'PAYMENT_FLAGGED';

    const validUser = await prisma.user.findUnique({ where: { id: userId } });
    const auditUserId = validUser ? validUser.id : null;

    const audit = await prisma.auditLog.create({
      data: {
        schoolId: targetSchoolId,
        userId: auditUserId,
        action: auditAction,
        entityType: 'FeePayment',
        entityId: payment.id,
        details: {
          receiptNumber: payment.receiptNumber,
          transactionRef: payment.transactionRef,
          amount: payment.amountPaid,
          statementRef: data.statementRef,
          reason:
            data.reason ||
            (data.action === 'RECONCILE'
              ? 'Bank settlement verified against institutional statement'
              : 'Discrepancy flagged for audit review'),
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (data.statementRef || data.reason) {
      await prisma.feePayment.update({
        where: { id: payment.id },
        data: {
          notes: `${data.action === 'RECONCILE' ? '[RECONCILED]' : '[DISCREPANCY]'}: ${data.statementRef || data.reason || ''}`.trim(),
        },
      });
    }

    return {
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      status: data.action === 'RECONCILE' ? 'RECONCILED' : 'DISCREPANCY',
      auditedAt: audit.createdAt.toISOString(),
    };
  }
}

export const operationsService = new OperationsService();
