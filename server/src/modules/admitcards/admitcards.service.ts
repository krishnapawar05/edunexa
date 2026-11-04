import { randomUUID } from 'crypto';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PlatformRole } from '@edunexa/shared';
import {
  GenerateAdmitCardDTO,
  BulkGenerateAdmitCardsDTO,
  PublishAdmitCardsDTO,
  UpdateAdmitCardClearanceDTO,
  AdmitCardTimetableEntry,
} from '@edunexa/shared';

export class AdmitCardsService {
  /**
   * Helper: compute end time string from startTime (e.g. "09:30" or "09:30 AM") + durationMinutes
   */
  private computeEndTime(startTime: string, durationMinutes: number): string {
    try {
      // Normalize time string
      const clean = startTime.trim().toUpperCase();
      let hours = 9;
      let minutes = 0;
      const isPM = clean.includes('PM');
      const isAM = clean.includes('AM');
      const timePart = clean.replace(/[AP]M/, '').trim();
      const parts = timePart.split(':');
      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
      }
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      const totalMinutes = hours * 60 + minutes + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${pad(endHours)}:${pad(endMins)}`;
    } catch {
      return '12:30';
    }
  }

  /**
   * Helper: check student clearance (Fee, Attendance, Admin)
   */
  async evaluateStudentClearance(studentProfileId: string, schoolId: string) {
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentProfileId, membership: { schoolId } },
      include: {
        feeInvoices: {
          where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
        },
        attendance: true,
      },
    });

    if (!student) {
      return {
        clearanceStatus: 'BLOCKED' as const,
        clearanceDetails: {
          feeCleared: false,
          pendingFee: 0,
          attendanceRate: 0,
          remarks: 'Student record not found or inactive.',
        },
      };
    }

    // 1. Fee calculation
    let pendingFee = 0;
    for (const inv of student.feeInvoices) {
      const balance = Math.max(0, inv.amountDue - inv.amountPaid - inv.discountApplied);
      pendingFee += balance;
    }
    const feeCleared = pendingFee <= 0;

    // 2. Attendance calculation
    const totalRecords = student.attendance.length;
    let presentCount = 0;
    for (const att of student.attendance) {
      if (att.status === 'PRESENT' || att.status === 'APPROVED_LEAVE') {
        presentCount++;
      }
    }
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;
    const attendanceCleared = attendanceRate >= 65; // Institutional benchmark

    let clearanceStatus: 'CLEARED' | 'PENDING_FEES' | 'PENDING_ATTENDANCE' | 'BLOCKED' = 'CLEARED';
    let remarks = 'Candidate cleared across all institutional compliance gates.';

    if (!feeCleared && pendingFee > 20000) {
      clearanceStatus = 'PENDING_FEES';
      remarks = `Pending institutional dues of ₹${pendingFee.toLocaleString('en-IN')}. Clearance required from accounts.`;
    } else if (!attendanceCleared && totalRecords >= 10) {
      clearanceStatus = 'PENDING_ATTENDANCE';
      remarks = `Attendance rate (${attendanceRate}%) is below the examination threshold (65%). Dean clearance required.`;
    }

    return {
      clearanceStatus,
      clearanceDetails: {
        feeCleared,
        pendingFee,
        attendanceRate,
        remarks,
      },
    };
  }

  /**
   * Helper: retrieve subject-wise examination timetable for a given class & session
   */
  async getExamTimetableForClass(
    schoolId: string,
    className: string,
    academicSessionId: string,
    examTitle?: string
  ): Promise<AdmitCardTimetableEntry[]> {
    const where: any = {
      academicSessionId,
      subject: {
        class: {
          schoolId,
          name: { equals: className, mode: 'insensitive' },
        },
      },
    };

    if (examTitle) {
      where.OR = [
        { name: { contains: examTitle, mode: 'insensitive' } },
        { examType: { contains: examTitle, mode: 'insensitive' } },
      ];
    }

    const schedules = await prisma.examSchedule.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: { examDate: 'asc' },
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return schedules.map((s) => {
      const dateObj = new Date(s.examDate);
      const dayOfWeek = days[dateObj.getDay()] || 'Weekday';
      const endTime = this.computeEndTime(s.startTime, s.durationMinutes);

      return {
        subjectName: s.subject.name,
        subjectCode: s.subject.code,
        examDate: s.examDate.toISOString().split('T')[0],
        dayOfWeek,
        startTime: s.startTime,
        endTime,
        durationMinutes: s.durationMinutes,
        roomNumber: s.roomNumber || 'Examination Hall A',
        maxMarks: s.maxMarks,
      };
    });
  }

  // ==========================================================================
  // 1. DASHBOARD TELEMETRY & STATS
  // ==========================================================================

  async getDashboardStats(schoolId: string) {
    // 1. Distinct examinations
    const distinctExams = await prisma.examSchedule.groupBy({
      by: ['name'],
      where: { subject: { class: { schoolId } } },
      _count: true,
    });

    // 2. Total active enrolled students
    const totalStudents = await prisma.studentProfile.count({
      where: { membership: { schoolId }, status: 'ACTIVE' },
    });

    // 3. Total admit cards generated
    const totalGenerated = await prisma.admitCard.count({
      where: { schoolId },
    });

    // 4. Total admit cards published
    const totalPublished = await prisma.admitCard.count({
      where: { schoolId, status: 'PUBLISHED' },
    });

    // 5. Total admit cards pending publication
    const pendingPublication = await prisma.admitCard.count({
      where: { schoolId, status: 'GENERATED' },
    });

    // 6. Total pending clearance
    const pendingClearance = await prisma.admitCard.count({
      where: { schoolId, clearanceStatus: { not: 'CLEARED' } },
    });

    // 7. Recent activity ledger
    const recentActivity = await prisma.admitCard.findMany({
      where: { schoolId },
      include: {
        student: {
          include: {
            membership: { include: { user: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    const formattedRecent = recentActivity.map((ac) => ({
      id: ac.id,
      admitCardNumber: ac.admitCardNumber,
      examTitle: ac.examTitle,
      studentName: `${ac.student.membership.user.firstName} ${ac.student.membership.user.lastName}`,
      className: ac.className,
      status: ac.status,
      clearanceStatus: ac.clearanceStatus,
      updatedAt: ac.updatedAt.toISOString(),
    }));

    return {
      totalExams: distinctExams.length,
      totalExaminations: distinctExams.length,
      totalStudents,
      totalEligibleStudents: totalStudents,
      totalGeneratedCards: totalGenerated,
      admitCardsGenerated: totalGenerated,
      publishedCards: totalPublished,
      admitCardsPublished: totalPublished,
      pendingPublication,
      admitCardsPendingPublication: pendingPublication,
      pendingClearance,
      studentsPendingClearance: pendingClearance,
      recentCards: formattedRecent,
      recentActivity: formattedRecent,
    };
  }

  // ==========================================================================
  // 2. LIST ADMIT CARDS & ELIGIBLE ROSTERS
  // ==========================================================================

  async listAdmitCards(
    schoolId: string,
    params: {
      examTitle?: string;
      className?: string;
      sectionName?: string;
      status?: string;
      clearanceStatus?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    if (params.examTitle) {
      where.examTitle = { contains: params.examTitle, mode: 'insensitive' };
    }
    if (params.className && params.className !== 'ALL') {
      where.className = { equals: params.className, mode: 'insensitive' };
    }
    if (params.sectionName && params.sectionName !== 'ALL') {
      where.sectionName = { equals: params.sectionName, mode: 'insensitive' };
    }
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as any;
    }
    if (params.clearanceStatus && params.clearanceStatus !== 'ALL') {
      where.clearanceStatus = params.clearanceStatus as any;
    }
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { admitCardNumber: { contains: q, mode: 'insensitive' } },
        { student: { admissionNumber: { contains: q, mode: 'insensitive' } } },
        { student: { membership: { user: { firstName: { contains: q, mode: 'insensitive' } } } } },
        { student: { membership: { user: { lastName: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.admitCard.findMany({
        where,
        include: {
          student: {
            include: {
              membership: { include: { user: true } },
            },
          },
          academicSession: true,
        },
        orderBy: [{ className: 'asc' }, { student: { admissionNumber: 'asc' } }],
        skip,
        take: limit,
      }),
      prisma.admitCard.count({ where }),
    ]);

    const formatted = items.map((ac) => {
      const u = ac.student?.membership?.user;
      return {
        ...ac,
        studentProfile: {
          ...ac.student,
          user: u,
        },
        id: ac.id,
        admitCardNumber: ac.admitCardNumber,
        examTitle: ac.examTitle,
        examType: ac.examType,
        studentId: ac.student.id,
        fullName: u ? `${u.firstName} ${u.lastName}` : 'Candidate',
        admissionNumber: ac.student.admissionNumber,
        rollNumber: ac.rollNumber || '—',
        className: ac.className,
        sectionName: ac.sectionName || '—',
        centerName: ac.centerName,
        roomNumber: ac.roomNumber || 'Hall A',
        status: ac.status,
        clearanceStatus: ac.clearanceStatus,
        clearanceDetails: ac.clearanceDetails,
        qrToken: ac.qrToken,
        publishedAt: ac.publishedAt?.toISOString() || null,
        issuedAt: ac.issuedAt.toISOString(),
      };
    });

    return { items: formatted, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ==========================================================================
  // 3. INDIVIDUAL ADMIT CARD GENERATION
  // ==========================================================================

  async generateIndividualAdmitCard(schoolId: string, data: GenerateAdmitCardDTO) {
    const student = await prisma.studentProfile.findFirst({
      where: { id: data.studentProfileId, membership: { schoolId } },
      include: {
        membership: { include: { user: true, school: true } },
        enrollments: {
          include: { class: true, section: true, academicSession: true },
          take: 1,
        },
      },
    });

    if (!student) {
      throw new AppError('Student profile not found in this school tenant.', 404, 'NOT_FOUND');
    }

    const enrollment = student.enrollments[0];
    const className = enrollment?.class?.name || 'Grade 10';
    const sectionName = enrollment?.section?.name || 'A';
    const rollNumber = enrollment?.rollNumber ? String(enrollment.rollNumber) : '01';

    let academicSessionId: string | undefined = enrollment?.academicSessionId;
    if (!academicSessionId) {
      const curSession = await prisma.academicSession.findFirst({
        where: { schoolId, isCurrent: true },
      });
      if (curSession) academicSessionId = curSession.id;
    }
    if (!academicSessionId) {
      const anySession = await prisma.academicSession.findFirst({ where: { schoolId } });
      if (anySession) academicSessionId = anySession.id;
    }
    if (!academicSessionId) {
      const newSession = await prisma.academicSession.create({
        data: {
          schoolId,
          name: 'Academic Year 2026–2027',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
        },
      });
      academicSessionId = newSession.id;
    }

    const resolvedSessionId = academicSessionId as string;

    // 1. Evaluate compliance & clearance
    const clearance = await this.evaluateStudentClearance(student.id, schoolId);

    // 2. Unique card numbers
    const rand = Math.floor(1000 + Math.random() * 9000);
    const admitCardNumber = `AC-2026-${student.admissionNumber || 'STU'}-${rand}`;
    const qrToken = `ac-tok-${randomUUID()}`;

    // 3. Upsert AdmitCard
    const existing = await prisma.admitCard.findFirst({
      where: {
        schoolId,
        studentProfileId: student.id,
        examTitle: data.examTitle,
      },
    });

    let admitCard;
    if (existing) {
      admitCard = await prisma.admitCard.update({
        where: { id: existing.id },
        data: {
          admitCardNumber: existing.admitCardNumber,
          rollNumber,
          className,
          sectionName,
          centerName: data.centerName || existing.centerName || 'Main Campus Examination Center',
          roomNumber: data.roomNumber || existing.roomNumber || 'Examination Hall A',
          candidateInstructions: data.candidateInstructions || existing.candidateInstructions,
          clearanceStatus: clearance.clearanceStatus,
          clearanceDetails: clearance.clearanceDetails,
          updatedAt: new Date(),
        },
        include: {
          school: true,
          student: { include: { membership: { include: { user: true } } } },
        },
      });
    } else {
      admitCard = await prisma.admitCard.create({
        data: {
          schoolId,
          studentProfileId: student.id,
          academicSessionId: resolvedSessionId,
          examTitle: data.examTitle,
          examType: data.examType || 'MID_TERM',
          admitCardNumber,
          rollNumber,
          className,
          sectionName,
          centerName: data.centerName || 'Main Campus Examination Center',
          roomNumber: data.roomNumber || 'Examination Hall A',
          candidateInstructions: data.candidateInstructions,
          clearanceStatus: clearance.clearanceStatus,
          clearanceDetails: clearance.clearanceDetails,
          qrToken,
          status: 'GENERATED',
        },
        include: {
          school: true,
          student: { include: { membership: { include: { user: true } } } },
        },
      });
    }

    // 4. Retrieve applicable examination timetable
    const timetable = await this.getExamTimetableForClass(
      schoolId,
      className,
      resolvedSessionId,
      data.examTitle
    );

    return {
      ...admitCard,
      studentProfile: {
        ...admitCard.student,
        user: admitCard.student?.membership?.user,
      },
      admitCard,
      timetable,
    };
  }

  // ==========================================================================
  // 4. BULK ADMIT CARD GENERATION
  // ==========================================================================

  async bulkGenerateAdmitCards(schoolId: string, data: BulkGenerateAdmitCardsDTO) {
    let studentIds: string[] = [];

    const targetType =
      data.targetType ||
      (data.className ? 'CLASS' : (data.studentProfileIds?.length || data.selectedIds?.length ? 'SELECTED_STUDENTS' : 'ALL_ELIGIBLE'));

    if (targetType === 'CLASS' || targetType === 'SECTION') {
      const where: any = {
        membership: { schoolId },
        status: 'ACTIVE',
      };
      if (data.className) {
        where.enrollments = {
          some: { class: { name: { equals: data.className, mode: 'insensitive' } } },
        };
      }
      if (data.sectionName) {
        where.enrollments = {
          ...where.enrollments,
          some: {
            ...(where.enrollments?.some || {}),
            section: { name: { equals: data.sectionName, mode: 'insensitive' } },
          },
        };
      }
      const students = await prisma.studentProfile.findMany({
        where,
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    } else if (targetType === 'SELECTED_STUDENTS') {
      studentIds = data.studentProfileIds || data.selectedIds || [];
    } else {
      // ALL_ELIGIBLE
      const students = await prisma.studentProfile.findMany({
        where: { membership: { schoolId }, status: 'ACTIVE' },
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    }

    let generatedCount = 0;
    let skippedCount = 0;
    const skippedReasons: Array<{ studentId: string; reason: string }> = [];
    const generatedCards: any[] = [];

    for (const sid of studentIds) {
      try {
        const res = await this.generateIndividualAdmitCard(schoolId, {
          studentProfileId: sid,
          examTitle: data.examTitle,
          examType: data.examType,
          centerName: data.centerName,
          roomNumber: data.roomNumber || data.defaultRoomNumber,
          candidateInstructions: data.candidateInstructions,
        });
        generatedCards.push(res);
        generatedCount++;
      } catch (err: any) {
        skippedCount++;
        skippedReasons.push({ studentId: sid, reason: err.message || 'Generation failed' });
      }
    }

    return {
      totalSelected: studentIds.length,
      generatedCount,
      skippedCount,
      skippedReasons,
      skipped: skippedReasons,
      cards: generatedCards,
    };
  }

  // ==========================================================================
  // 5. PUBLISHING & UNPUBLISHING WORKFLOW
  // ==========================================================================

  async publishAdmitCards(schoolId: string, publishedByUserId: string, data: PublishAdmitCardsDTO) {
    const where: any = { schoolId };
    const targetIds = data.cardIds || data.admitCardIds;

    if (targetIds && targetIds.length > 0) {
      where.id = { in: targetIds };
    } else {
      if (data.examTitle) where.examTitle = data.examTitle;
      if (data.className) where.className = data.className;
    }

    const isPublish = data.publish !== undefined ? data.publish : (data.action === 'PUBLISH');
    const enforceClearance = data.enforceClearance !== false;

    if (isPublish) {
      // Before publishing: check clearance
      const candidateCards = await prisma.admitCard.findMany({
        where,
        select: { id: true, clearanceStatus: true },
      });

      const eligibleToPublish = enforceClearance
        ? candidateCards.filter((c) => c.clearanceStatus === 'CLEARED')
        : candidateCards.filter((c) => c.clearanceStatus !== 'BLOCKED');

      const ids = eligibleToPublish.map((c) => c.id);
      const skippedCount = candidateCards.length - ids.length;

      let updatedCount = 0;
      if (ids.length > 0) {
        const result = await prisma.admitCard.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            publishedByUserId,
          },
        });
        updatedCount = result.count;
      }

      return {
        action: 'PUBLISHED',
        updatedCount,
        publishedCount: updatedCount,
        skippedCount,
        withheldCount: skippedCount,
      };
    } else {
      // Unpublish or withhold
      const newStatus = data.action === 'WITHHOLD' ? 'WITHHELD' : 'GENERATED';
      const result = await prisma.admitCard.updateMany({
        where,
        data: {
          status: newStatus,
          publishedAt: null,
          publishedByUserId: null,
        },
      });

      return {
        action: data.action || 'UNPUBLISHED',
        updatedCount: result.count,
        unpublishedCount: result.count,
        skippedCount: 0,
      };
    }
  }

  // ==========================================================================
  // 6. CLEARANCE STATUS MANAGEMENT
  // ==========================================================================

  async updateClearance(schoolId: string, admitCardId: string, data: UpdateAdmitCardClearanceDTO) {
    const card = await prisma.admitCard.findFirst({
      where: { id: admitCardId, schoolId },
    });

    if (!card) {
      throw new AppError('Admit card not found.', 404, 'NOT_FOUND');
    }

    const reason = data.reason || data.remarks || 'Updated by administrative examination council.';
    const updated = await prisma.admitCard.update({
      where: { id: card.id },
      data: {
        clearanceStatus: data.clearanceStatus,
        clearanceDetails: {
          ...((card.clearanceDetails as any) || {}),
          reason,
          remarks: data.remarks || reason,
          updatedAt: new Date().toISOString(),
        },
        // If set to BLOCKED, automatically unpublish
        status: data.clearanceStatus === 'BLOCKED' ? 'WITHHELD' : card.status,
      },
      include: {
        student: { include: { membership: { include: { user: true } } } },
      },
    });

    return {
      ...updated,
      studentProfile: updated.student,
    };
  }

  // ==========================================================================
  // 7. STUDENT SELF-SERVICE (MY ADMIT CARDS)
  // ==========================================================================

  async getMyAdmitCards(userId: string, schoolId: string) {
    const student = await prisma.studentProfile.findFirst({
      where: { membership: { userId, schoolId } },
      include: {
        membership: { include: { user: true, school: true } },
        enrollments: {
          include: { class: true, section: true },
          take: 1,
        },
      },
    });

    if (!student) {
      throw new AppError('Student profile not found for authenticated user.', 404, 'NOT_FOUND');
    }

    // Strictly fetch published admit cards
    const cards = await prisma.admitCard.findMany({
      where: {
        schoolId,
        studentProfileId: student.id,
        status: 'PUBLISHED',
      },
      include: {
        academicSession: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    // Also check if there are pending/unpublished cards to show friendly indicator
    const pendingCount = await prisma.admitCard.count({
      where: {
        schoolId,
        studentProfileId: student.id,
        status: { in: ['GENERATED', 'WITHHELD'] },
      },
    });

    const school = student.membership.school;
    const u = student.membership.user;
    const enrollment = student.enrollments[0];

    const cardsWithTimetable = await Promise.all(
      cards.map(async (c) => {
        const timetable = await this.getExamTimetableForClass(
          schoolId,
          c.className,
          c.academicSessionId,
          c.examTitle
        );

        return {
          id: c.id,
          admitCardNumber: c.admitCardNumber,
          examTitle: c.examTitle,
          examType: c.examType,
          sessionName: c.academicSession?.name || '2026–2027',
          studentName: `${u.firstName} ${u.lastName}`,
          admissionNumber: student.admissionNumber,
          rollNumber: c.rollNumber || enrollment?.rollNumber || '—',
          className: c.className,
          sectionName: c.sectionName || enrollment?.section?.name || 'A',
          centerName: c.centerName,
          roomNumber: c.roomNumber,
          candidateInstructions: c.candidateInstructions,
          qrToken: c.qrToken,
          status: c.status,
          publishedAt: c.publishedAt?.toISOString(),
          school: {
            name: school.name,
            code: school.code,
            address: `${school.address}, ${school.city}`,
            phone: school.phone,
            email: school.email,
          },
          timetable,
        };
      })
    );

    return {
      publishedCards: cardsWithTimetable,
      hasPendingCards: pendingCount > 0,
      student: {
        id: student.id,
        fullName: `${u.firstName} ${u.lastName}`,
        admissionNumber: student.admissionNumber,
        className: enrollment?.class?.name || 'Grade 10',
        sectionName: enrollment?.section?.name || 'A',
      },
    };
  }

  // ==========================================================================
  // 8. PARENT / GUARDIAN SELF-SERVICE (CHILD'S ADMIT CARDS)
  // ==========================================================================

  async getChildAdmitCards(parentUserId: string, schoolId: string, studentProfileId?: string) {
    // 1. Verify parent-student links for this user
    const links = await prisma.parentStudentLink.findMany({
      where: {
        parentMembership: { userId: parentUserId, schoolId },
      },
      include: {
        studentProfile: {
          include: {
            membership: { include: { user: true, school: true } },
            enrollments: { include: { class: true, section: true }, take: 1 },
          },
        },
      },
    });

    if (links.length === 0) {
      throw new AppError('No student records are linked to this guardian account.', 403, 'FORBIDDEN');
    }

    // 2. Select child
    const targetStudentId = studentProfileId || links[0].studentProfileId;
    const targetLink = links.find((l) => l.studentProfileId === targetStudentId);

    if (!targetLink) {
      throw new AppError('You do not have authorization to view admit cards for this student.', 403, 'FORBIDDEN');
    }

    const student = targetLink.studentProfile;
    const school = student.membership.school;
    const u = student.membership.user;
    const enrollment = student.enrollments[0];

    // 3. Retrieve published admit cards only
    const cards = await prisma.admitCard.findMany({
      where: {
        schoolId,
        studentProfileId: student.id,
        status: 'PUBLISHED',
      },
      include: { academicSession: true },
      orderBy: { issuedAt: 'desc' },
    });

    const cardsWithTimetable = await Promise.all(
      cards.map(async (c) => {
        const timetable = await this.getExamTimetableForClass(
          schoolId,
          c.className,
          c.academicSessionId,
          c.examTitle
        );

        return {
          id: c.id,
          admitCardNumber: c.admitCardNumber,
          examTitle: c.examTitle,
          examType: c.examType,
          sessionName: c.academicSession?.name || '2026–2027',
          studentName: `${u.firstName} ${u.lastName}`,
          admissionNumber: student.admissionNumber,
          rollNumber: c.rollNumber || enrollment?.rollNumber || '—',
          className: c.className,
          sectionName: c.sectionName || enrollment?.section?.name || 'A',
          centerName: c.centerName,
          roomNumber: c.roomNumber,
          candidateInstructions: c.candidateInstructions,
          qrToken: c.qrToken,
          status: c.status,
          publishedAt: c.publishedAt?.toISOString(),
          school: {
            name: school.name,
            code: school.code,
            address: `${school.address}, ${school.city}`,
            phone: school.phone,
            email: school.email,
          },
          timetable,
        };
      })
    );

    const children = links.map((l) => ({
      id: l.studentProfile.id,
      fullName: `${l.studentProfile.membership.user.firstName} ${l.studentProfile.membership.user.lastName}`,
      admissionNumber: l.studentProfile.admissionNumber,
      className: l.studentProfile.enrollments[0]?.class?.name || 'Class',
      sectionName: l.studentProfile.enrollments[0]?.section?.name || 'A',
      relationship: l.relationship,
    }));

    return {
      children,
      selectedChildId: targetStudentId,
      publishedCards: cardsWithTimetable,
    };
  }

  // ==========================================================================
  // 9. PUBLIC PRIVACY-PRESERVING QR VERIFICATION
  // ==========================================================================

  async verifyAdmitCardToken(token: string) {
    const card = await prisma.admitCard.findUnique({
      where: { qrToken: token },
      include: {
        school: true,
        student: {
          include: {
            membership: { include: { user: true } },
          },
        },
      },
    });

    if (!card) {
      throw new AppError('Admit card verification token is invalid or does not exist.', 404, 'NOT_FOUND');
    }

    const u = card.student.membership.user;

    return {
      verified: true,
      isValid: card.status === 'PUBLISHED',
      status: card.status,
      admitCardNumber: card.admitCardNumber,
      examTitle: card.examTitle,
      candidateName: `${u.firstName} ${u.lastName}`,
      studentName: `${u.firstName} ${u.lastName}`,
      admissionNumber: card.student.admissionNumber,
      className: card.className,
      sectionName: card.sectionName,
      centerName: card.centerName,
      institution: card.school.name,
      schoolName: card.school.name,
      clearanceStatus: card.clearanceStatus,
    };
  }
}

export const admitCardsService = new AdmitCardsService();
