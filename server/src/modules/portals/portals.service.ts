import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PlatformRole } from '@edunexa/shared';

export class PortalsService {
  // ==========================================================================
  // 1. STUDENT PANEL SERVICES
  // ==========================================================================

  async getStudentProfileByUserId(schoolId: string, userId: string) {
    const student = await prisma.studentProfile.findFirst({
      where: {
        membership: { schoolId, userId, role: PlatformRole.STUDENT },
      },
      include: {
        membership: { include: { user: true } },
        enrollments: {
          include: {
            class: true,
            section: true,
            academicSession: true,
          },
          orderBy: { enrolledAt: 'desc' },
          take: 1,
        },
        parentLinks: {
          include: {
            parentMembership: { include: { user: true } },
          },
        },
      },
    });

    if (!student) {
      throw new AppError('Student profile not found for authenticated account.', 404);
    }
    return student;
  }

  async getStudentDashboardTelemetry(schoolId: string, userId: string) {
    const student = await this.getStudentProfileByUserId(schoolId, userId);
    const studentProfileId = student.id;
    const activeEnrollment = student.enrollments[0];
    const classId = activeEnrollment?.classId;
    const sectionId = activeEnrollment?.sectionId;
    const academicSessionId = activeEnrollment?.academicSessionId;

    // 1. Attendance Summary
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentProfileId },
      orderBy: { date: 'desc' },
    });
    const totalWorkingDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const attendancePercentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    // 2. Today's Timetable
    const todayDayOfWeek = new Date().getDay();
    const timetable = sectionId
      ? await prisma.timetableSlot.findMany({
          where: { sectionId, dayOfWeek: todayDayOfWeek },
          orderBy: { startTime: 'asc' },
        })
      : [];

    // 3. Homework / Assignments
    const assignments = sectionId
      ? await prisma.assignment.findMany({
          where: { sectionId },
          include: {
            submissions: { where: { studentProfileId } },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        })
      : [];

    // 4. Upcoming Exam Schedules
    const examSchedules = classId
      ? await prisma.examSchedule.findMany({
          where: {
            academicSession: { schoolId },
            subject: { classId },
            ...(academicSessionId ? { academicSessionId } : {}),
            examDate: { gte: new Date(Date.now() - 30 * 86400000) },
          },
          include: { subject: true },
          orderBy: { examDate: 'asc' },
          take: 6,
        })
      : [];

    // 5. Published Marksheets & Results
    const marksheets = await prisma.marksheet.findMany({
      where: {
        schoolId,
        studentProfileId,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    // 6. Active Admit Cards
    const admitCards = await prisma.admitCard.findMany({
      where: {
        schoolId,
        studentProfileId,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    // 7. Library Issued Books
    const libraryIssues = await prisma.bookIssue.findMany({
      where: { schoolId, studentProfileId },
      include: { book: true },
      orderBy: { issueDate: 'desc' },
      take: 5,
    });

    // 8. Fee Summary
    const feeInvoices = await prisma.feeInvoice.findMany({
      where: { studentProfileId },
      include: { feeStructure: true },
      orderBy: { dueDate: 'asc' },
    });
    const totalFeesDue = feeInvoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
    const totalFeesPaid = feeInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

    // 9. Notices
    const notices = await prisma.notice.findMany({
      where: {
        schoolId,
        audience: { in: ['ALL', 'STUDENTS_ONLY'] },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    // 10. Teacher Feedback / Remarks
    const remarks = await prisma.studentRemark.findMany({
      where: { schoolId, studentProfileId, isPrivate: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.membership.user.firstName,
        lastName: student.membership.user.lastName,
        fullName: `${student.membership.user.firstName} ${student.membership.user.lastName}`.trim(),
        email: student.membership.user.email,
        phone: student.membership.user.phone,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        emergencyPhone: student.emergencyPhone,
        address: student.address,
        photoUrl: student.photoUrl,
        className: activeEnrollment?.class?.name || 'Unassigned',
        sectionName: activeEnrollment?.section?.name || '',
        academicSession: activeEnrollment?.academicSession?.name || '',
        rollNumber: activeEnrollment?.rollNumber || 1,
      },
      attendance: {
        totalWorkingDays,
        presentDays,
        attendancePercentage,
        records: attendanceRecords.slice(0, 10),
      },
      timetable,
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        assignedDate: a.assignedDate,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        isSubmitted: a.submissions.length > 0,
        submission: a.submissions[0] || null,
      })),
      upcomingExams: examSchedules,
      marksheets,
      admitCards,
      library: {
        activeIssues: libraryIssues.filter((i) => i.status === 'ISSUED'),
        allIssues: libraryIssues,
      },
      fees: {
        totalFeesDue,
        totalFeesPaid,
        pendingAmount: Math.max(0, totalFeesDue - totalFeesPaid),
        invoices: feeInvoices,
      },
      notices,
      remarks,
    };
  }

  async getStudentAdmissionDetails(schoolId: string, userId: string) {
    const student = await this.getStudentProfileByUserId(schoolId, userId);
    const enrollment = student.enrollments[0];

    const application = await prisma.admissionApplication.findFirst({
      where: {
        schoolId,
        applicationNumber: student.admissionNumber,
      },
    });

    return {
      admissionNumber: student.admissionNumber,
      admissionStatus: student.status,
      admittedAt: student.createdAt,
      className: enrollment?.class?.name || 'Class 10',
      sectionName: enrollment?.section?.name || 'A',
      academicSession: enrollment?.academicSession?.name || '2026-2027',
      rollNumber: enrollment?.rollNumber || 1,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      address: student.address,
      emergencyPhone: student.emergencyPhone,
      parents: student.parentLinks.map((p) => ({
        relationship: p.relationship,
        isPrimary: p.isPrimaryContact,
        fullName: `${p.parentMembership.user.firstName} ${p.parentMembership.user.lastName}`.trim(),
        email: p.parentMembership.user.email,
        phone: p.parentMembership.user.phone,
      })),
      documents: application?.documents || [
        { name: 'Birth Certificate', verified: true, uploadedAt: student.createdAt },
        { name: 'Transfer Certificate (TC)', verified: true, uploadedAt: student.createdAt },
        { name: 'Previous Academic Marksheet', verified: true, uploadedAt: student.createdAt },
        { name: 'Address Proof (Aadhaar)', verified: true, uploadedAt: student.createdAt },
      ],
    };
  }

  async getStudentLibraryHistory(schoolId: string, userId: string) {
    const student = await this.getStudentProfileByUserId(schoolId, userId);
    return prisma.bookIssue.findMany({
      where: { schoolId, studentProfileId: student.id },
      include: { book: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  async getStudentMeetings(schoolId: string, userId: string) {
    const student = await this.getStudentProfileByUserId(schoolId, userId);
    return prisma.meeting.findMany({
      where: {
        schoolId,
        studentProfileId: student.id,
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  // ==========================================================================
  // 2. PARENT/GUARDIAN SERVICES (WITH MULTI-CHILD ISOLATION & SWITCHING)
  // ==========================================================================

  async getParentChildren(schoolId: string, parentUserId: string) {
    const parentMembership = await prisma.userMembership.findFirst({
      where: { schoolId, userId: parentUserId, role: PlatformRole.PARENT },
      include: {
        parentLinks: {
          include: {
            studentProfile: {
              include: {
                membership: { include: { user: true } },
                enrollments: {
                  include: { class: true, section: true, academicSession: true },
                  orderBy: { enrolledAt: 'desc' },
                  take: 1,
                },
                feeInvoices: true,
                attendance: true,
                admitCards: {
                  where: { status: 'PUBLISHED' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!parentMembership) {
      return [];
    }

    return parentMembership.parentLinks.map((link) => {
      const sp = link.studentProfile;
      const user = sp.membership.user;
      const enr = sp.enrollments[0];

      const totalWorking = sp.attendance.length;
      const present = sp.attendance.filter((a) => a.status === 'PRESENT').length;
      const attendancePercent = totalWorking > 0 ? Math.round((present / totalWorking) * 100) : 0;

      const totalDue = sp.feeInvoices.reduce((acc, inv) => acc + (inv.amountDue || 0), 0);
      const totalPaid = sp.feeInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
      const pendingFees = Math.max(0, totalDue - totalPaid);

      return {
        id: sp.id,
        studentProfileId: sp.id,
        admissionNumber: sp.admissionNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        gender: sp.gender,
        bloodGroup: sp.bloodGroup,
        photoUrl: sp.photoUrl,
        className: enr?.class?.name || 'Class 10',
        sectionName: enr?.section?.name || 'A',
        grade: enr?.class?.name ? `${enr.class.name}-${enr.section?.name || 'A'}` : 'Grade 10-A',
        rollNumber: enr?.rollNumber || 1,
        academicSession: enr?.academicSession?.name || '2026-2027',
        relationship: link.relationship,
        isPrimaryContact: link.isPrimaryContact,
        attendancePercent,
        pendingFees,
        hasActiveAdmitCard: sp.admitCards.length > 0,
      };
    });
  }

  async verifyParentChildAccess(schoolId: string, parentUserId: string, studentProfileId: string) {
    const link = await prisma.parentStudentLink.findFirst({
      where: {
        studentProfileId,
        parentMembership: {
          schoolId,
          userId: parentUserId,
          role: PlatformRole.PARENT,
        },
      },
      include: {
        studentProfile: {
          include: {
            membership: { include: { user: true } },
            enrollments: {
              include: { class: true, section: true, academicSession: true },
              orderBy: { enrolledAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!link) {
      throw new AppError('Unauthorized: You do not have access to this student profile.', 403, 'FORBIDDEN_RECORD_ACCESS');
    }

    return link.studentProfile;
  }

  async getParentChildDashboard(schoolId: string, parentUserId: string, studentProfileId: string) {
    const student = await this.verifyParentChildAccess(schoolId, parentUserId, studentProfileId);
    const activeEnrollment = student.enrollments[0];
    const classId = activeEnrollment?.classId;
    const sectionId = activeEnrollment?.sectionId;

    // Attendance summary
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentProfileId },
      orderBy: { date: 'desc' },
    });
    const totalWorkingDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const attendancePercentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    // Fee Invoices
    const invoices = await prisma.feeInvoice.findMany({
      where: { studentProfileId },
      include: { feeStructure: true, payments: true },
      orderBy: { dueDate: 'asc' },
    });
    const totalFeesDue = invoices.reduce((acc, inv) => acc + (inv.amountDue || 0), 0);
    const totalFeesPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);

    // Published Marksheets
    const marksheets = await prisma.marksheet.findMany({
      where: {
        schoolId,
        studentProfileId,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Published Admit Cards
    const admitCards = await prisma.admitCard.findMany({
      where: {
        schoolId,
        studentProfileId,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Homework
    const homework = sectionId
      ? await prisma.assignment.findMany({
          where: { sectionId },
          include: {
            submissions: { where: { studentProfileId } },
          },
          orderBy: { dueDate: 'desc' },
          take: 5,
        })
      : [];

    // Exam Schedules
    const exams = classId
      ? await prisma.examSchedule.findMany({
          where: {
            academicSession: { schoolId },
            subject: { classId },
            examDate: { gte: new Date(Date.now() - 30 * 86400000) },
          },
          include: { subject: true },
          orderBy: { examDate: 'asc' },
          take: 6,
        })
      : [];

    // Scheduled PTMs
    const meetings = await prisma.meeting.findMany({
      where: {
        schoolId,
        studentProfileId,
      },
      orderBy: { scheduledDate: 'desc' },
      take: 4,
    });

    // School Notices
    const notices = await prisma.notice.findMany({
      where: {
        schoolId,
        audience: { in: ['ALL', 'PARENTS_ONLY'] },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.membership.user.firstName,
        lastName: student.membership.user.lastName,
        fullName: `${student.membership.user.firstName} ${student.membership.user.lastName}`.trim(),
        email: student.membership.user.email,
        phone: student.membership.user.phone,
        className: activeEnrollment?.class?.name || 'Class 10',
        sectionName: activeEnrollment?.section?.name || 'A',
        rollNumber: activeEnrollment?.rollNumber || 1,
        academicSession: activeEnrollment?.academicSession?.name || '2026-2027',
      },
      attendance: {
        totalWorkingDays,
        presentDays,
        attendancePercentage,
        records: attendanceRecords.slice(0, 10),
      },
      fees: {
        totalFeesDue,
        totalFeesPaid,
        pendingAmount: Math.max(0, totalFeesDue - totalFeesPaid),
        invoices,
      },
      marksheets,
      admitCards,
      homework: homework.map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        dueDate: h.dueDate,
        maxMarks: h.maxMarks,
        submission: h.submissions[0] || null,
      })),
      upcomingExams: exams,
      meetings,
      notices,
    };
  }

  async getParentChildHomework(schoolId: string, parentUserId: string, studentProfileId: string) {
    const student = await this.verifyParentChildAccess(schoolId, parentUserId, studentProfileId);
    const enrollment = student.enrollments[0];
    if (!enrollment?.sectionId) return [];

    const assignments = await prisma.assignment.findMany({
      where: { sectionId: enrollment.sectionId },
      include: {
        submissions: { where: { studentProfileId } },
      },
      orderBy: { dueDate: 'desc' },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      assignedDate: a.assignedDate,
      dueDate: a.dueDate,
      maxMarks: a.maxMarks,
      attachmentUrl: a.attachmentUrl,
      submission: a.submissions[0] || null,
    }));
  }

  async getParentChildReceipts(schoolId: string, parentUserId: string, studentProfileId: string) {
    await this.verifyParentChildAccess(schoolId, parentUserId, studentProfileId);
    const invoices = await prisma.feeInvoice.findMany({
      where: { studentProfileId },
      include: {
        feeStructure: true,
        payments: true,
      },
    });

    const receipts: any[] = [];
    for (const inv of invoices) {
      for (const p of inv.payments) {
        receipts.push({
          receiptNumber: p.receiptNumber || `REC-${p.id.slice(0, 8).toUpperCase()}`,
          paymentId: p.id,
          invoiceNumber: inv.invoiceNumber,
          feeStructureTitle: inv.feeStructure?.feeHead || 'Academic Tuition & Services',
          amountPaid: p.amountPaid,
          paymentDate: p.paidAt,
          paymentMethod: p.paymentMethod,
          transactionRef: p.transactionRef,
          remarks: p.notes,
        });
      }
    }
    return receipts.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  async getParentChildMeetings(schoolId: string, parentUserId: string, studentProfileId: string) {
    await this.verifyParentChildAccess(schoolId, parentUserId, studentProfileId);
    const meetings = await prisma.meeting.findMany({
      where: {
        schoolId,
        studentProfileId,
      },
      orderBy: { scheduledDate: 'desc' },
    });

    const hostUserIds = Array.from(new Set(meetings.map((m) => m.hostUserId).filter(Boolean)));
    const hosts = await prisma.user.findMany({
      where: { id: { in: hostUserIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
    });
    const hostMap = new Map(hosts.map((h) => [h.id, h]));

    return meetings.map((m) => {
      const host = hostMap.get(m.hostUserId);
      return {
        ...m,
        hostName: host ? `${host.firstName} ${host.lastName}`.trim() : 'Faculty Host',
        hostEmail: host?.email,
        hostAvatar: host?.avatarUrl,
        hostUser: host
          ? {
              id: host.id,
              firstName: host.firstName,
              lastName: host.lastName,
              email: host.email,
              avatarUrl: host.avatarUrl,
            }
          : null,
      };
    });
  }

  async getParentMessages(schoolId: string, parentUserId: string, studentProfileId: string) {
    await this.verifyParentChildAccess(schoolId, parentUserId, studentProfileId);
    return prisma.communicationMessage.findMany({
      where: {
        schoolId,
        studentProfileId,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendParentMessage(schoolId: string, parentUserId: string, studentProfileId: string, data: any) {
    await this.verifyParentChildAccess(schoolId, parentUserId, studentProfileId);
    return prisma.communicationMessage.create({
      data: {
        schoolId,
        senderUserId: parentUserId,
        recipientUserId: data.recipientUserId || null,
        studentProfileId,
        channel: 'PARENT_TEACHER',
        subject: data.subject || 'Inquiry regarding student',
        messageContent: data.messageContent,
        attachmentUrl: data.attachmentUrl || null,
      },
    });
  }

  // ==========================================================================
  // 3. TEACHER PANEL SERVICES
  // ==========================================================================

  async getTeacherDashboardTelemetry(schoolId: string, teacherUserId: string) {
    const teacherProfile = await prisma.staffProfile.findFirst({
      where: {
        membership: { schoolId, userId: teacherUserId },
      },
      include: {
        membership: { include: { user: true } },
        department: true,
        teacherAssignments: {
          include: {
            subject: {
              include: {
                class: {
                  include: { sections: true },
                },
              },
            },
          },
        },
      },
    });

    const assignments = teacherProfile?.teacherAssignments || [];
    const sectionIds = assignments.flatMap((a) => a.subject.class?.sections.map((s) => s.id) || []);

    // 2. Today's Classes from Timetable
    const todayDayOfWeek = new Date().getDay();
    const timetable = teacherProfile && sectionIds.length > 0
      ? await prisma.timetableSlot.findMany({
          where: {
            sectionId: { in: sectionIds },
            dayOfWeek: todayDayOfWeek,
          },
          orderBy: { startTime: 'asc' },
        })
      : [];

    // 3. Pending Evaluations for Question Papers
    const pendingEvaluations = await prisma.assessmentAttempt.count({
      where: {
        schoolId,
        status: 'SUBMITTED',
      },
    });

    // 4. Homework Assignments created
    const homeworkCount = sectionIds.length > 0
      ? await prisma.assignment.count({
          where: {
            sectionId: { in: sectionIds },
          },
        })
      : 0;

    // 5. Total Students in Assigned Sections
    const totalStudents = sectionIds.length > 0
      ? await prisma.studentEnrollment.count({
          where: {
            sectionId: { in: sectionIds },
          },
        })
      : 0;

    // 6. Upcoming Meetings
    const meetings = await prisma.meeting.findMany({
      where: {
        schoolId,
        OR: [{ hostUserId: teacherUserId }, { meetingType: 'STAFF_INTERNAL' }],
      },
      include: {
        student: {
          include: { membership: { include: { user: true } } },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
    });

    // 7. Recent Notices
    const notices = await prisma.notice.findMany({
      where: {
        schoolId,
        audience: { in: ['ALL', 'STAFF_ONLY'] },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    return {
      teacher: teacherProfile
        ? {
            id: teacherProfile.id,
            employeeId: teacherProfile.employeeId,
            fullName: `${teacherProfile.membership.user.firstName} ${teacherProfile.membership.user.lastName}`.trim(),
            email: teacherProfile.membership.user.email,
            designation: teacherProfile.designation,
            department: teacherProfile.department?.name || 'General Faculty',
            assignments: assignments.map((a) => ({
              id: a.id,
              className: a.subject.class?.name || 'Assigned Class',
              sectionName: a.subject.class?.sections[0]?.name || 'A',
              subjectName: a.subject.name,
              classId: a.subject.classId,
              subjectId: a.subjectId,
            })),
          }
        : null,
      stats: {
        assignedClassesCount: assignments.length,
        totalStudents,
        pendingEvaluations,
        homeworkCount,
      },
      todaySchedule: timetable,
      meetings,
      notices,
    };
  }

  async getTeacherAcademicPerformanceReports(schoolId: string, classId?: string, subjectId?: string) {
    const marks = await prisma.examMark.findMany({
      where: {
        examSchedule: {
          academicSession: { schoolId },
          ...(subjectId ? { subjectId } : {}),
          ...(classId ? { subject: { classId } } : {}),
        },
      },
      include: {
        student: {
          include: {
            membership: { include: { user: true } },
            enrollments: { include: { class: true, section: true } },
          },
        },
        examSchedule: {
          include: { subject: { include: { class: true } } },
        },
      },
    });

    if (marks.length === 0) {
      return {
        summary: {
          totalEntries: 0,
          averageMarks: 0,
          highestMarks: 0,
          lowestMarks: 0,
          passPercentage: 0,
        },
        distribution: [],
        studentRoster: [],
      };
    }

    const scores = marks.map((m) => m.marksObtained || 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    const averageMarks = Math.round((sum / marks.length) * 10) / 10;
    const highestMarks = Math.max(...scores);
    const lowestMarks = Math.min(...scores);

    const passedCount = marks.filter((m) => (m.marksObtained || 0) >= (m.examSchedule.passMarks || 33)).length;
    const passPercentage = Math.round((passedCount / marks.length) * 100);

    // Distribution
    const distribution = [
      { range: '90-100%', count: marks.filter((m) => ((m.marksObtained || 0) / m.examSchedule.maxMarks) >= 0.9).length },
      { range: '75-89%', count: marks.filter((m) => ((m.marksObtained || 0) / m.examSchedule.maxMarks) >= 0.75 && ((m.marksObtained || 0) / m.examSchedule.maxMarks) < 0.9).length },
      { range: '60-74%', count: marks.filter((m) => ((m.marksObtained || 0) / m.examSchedule.maxMarks) >= 0.6 && ((m.marksObtained || 0) / m.examSchedule.maxMarks) < 0.75).length },
      { range: '35-59%', count: marks.filter((m) => ((m.marksObtained || 0) / m.examSchedule.maxMarks) >= 0.35 && ((m.marksObtained || 0) / m.examSchedule.maxMarks) < 0.6).length },
      { range: '< 35% (Repeat)', count: marks.filter((m) => ((m.marksObtained || 0) / m.examSchedule.maxMarks) < 0.35).length },
    ];

    const studentRoster = marks.map((m) => {
      const enr = m.student.enrollments[0];
      const pct = Math.round(((m.marksObtained || 0) / m.examSchedule.maxMarks) * 100);
      return {
        studentId: m.student.id,
        admissionNumber: m.student.admissionNumber,
        studentName: `${m.student.membership.user.firstName} ${m.student.membership.user.lastName}`.trim(),
        className: enr?.class?.name || m.examSchedule.subject?.class?.name || 'Class 10',
        sectionName: enr?.section?.name || 'A',
        subjectName: m.examSchedule.subject?.name || 'Subject',
        examTitle: m.examSchedule.name || 'Mid-Term Examination',
        marksObtained: m.marksObtained || 0,
        maxMarks: m.examSchedule.maxMarks,
        percentage: pct,
        isPassed: (m.marksObtained || 0) >= (m.examSchedule.passMarks || 33),
      };
    });

    return {
      summary: {
        totalEntries: marks.length,
        averageMarks,
        highestMarks,
        lowestMarks,
        passPercentage,
      },
      distribution,
      studentRoster,
    };
  }

  async getStudentRemarks(schoolId: string, studentProfileId: string) {
    return prisma.studentRemark.findMany({
      where: { schoolId, studentProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addStudentRemark(schoolId: string, teacherUserId: string, data: any) {
    return prisma.studentRemark.create({
      data: {
        schoolId,
        studentProfileId: data.studentProfileId,
        teacherUserId,
        academicSessionId: data.academicSessionId || null,
        category: data.category || 'GENERAL',
        remark: data.remark,
        isPrivate: !!data.isPrivate,
      },
    });
  }

  async getTeacherMeetings(schoolId: string, userId: string, userRole: string, statusFilter?: string) {
    let whereCondition: any = { schoolId };

    if (statusFilter && statusFilter !== 'ALL') {
      whereCondition.status = statusFilter;
    }

    if (userRole === PlatformRole.TEACHER) {
      // Find teacher profile and assigned sections
      const teacherProfile = await prisma.staffProfile.findFirst({
        where: {
          membership: { schoolId, userId },
        },
        include: {
          teacherAssignments: {
            include: {
              subject: {
                include: {
                  class: {
                    include: { sections: true },
                  },
                },
              },
            },
          },
        },
      });

      const assignments = teacherProfile?.teacherAssignments || [];
      const sectionIds = assignments.flatMap((a) => a.subject.class?.sections.map((s) => s.id) || []);

      let assignedStudentProfileIds: string[] = [];
      if (sectionIds.length > 0) {
        const enrollments = await prisma.studentEnrollment.findMany({
          where: { sectionId: { in: sectionIds } },
          select: { studentProfileId: true },
        });
        assignedStudentProfileIds = enrollments.map((e) => e.studentProfileId);
      }

      // Teacher can see:
      // 1. Meetings hosted by the teacher
      // 2. Meetings for students in the teacher's assigned classes/sections
      // 3. Staff internal meetings for the school
      const orClauses: any[] = [
        { hostUserId: userId },
        { meetingType: 'STAFF_INTERNAL' },
      ];
      if (assignedStudentProfileIds.length > 0) {
        orClauses.push({ studentProfileId: { in: assignedStudentProfileIds } });
      }

      whereCondition.AND = [{ OR: orClauses }];
    } else if (
      userRole === PlatformRole.SCHOOL_ADMIN ||
      userRole === PlatformRole.PRINCIPAL ||
      userRole === PlatformRole.SUPER_ADMIN
    ) {
      // Institutional Admins and Principals see all consultations in the school tenant
    } else {
      throw new AppError(`Access denied. Role '${userRole}' cannot view teacher consultations.`, 403);
    }

    const meetings = await prisma.meeting.findMany({
      where: whereCondition,
      include: {
        student: {
          include: {
            membership: { include: { user: true } },
            enrollments: {
              include: { class: true, section: true },
              orderBy: { enrolledAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    // Collect hostUserIds and guardianUserIds to load user profiles
    const userIdsToFetch = new Set<string>();
    meetings.forEach((m) => {
      if (m.hostUserId) userIdsToFetch.add(m.hostUserId);
      if (m.guardianUserId) userIdsToFetch.add(m.guardianUserId);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIdsToFetch) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return meetings.map((m) => {
      const studentUser = m.student?.membership?.user;
      const enrollment = m.student?.enrollments?.[0];
      const host = userMap.get(m.hostUserId);
      const guardian = m.guardianUserId ? userMap.get(m.guardianUserId) : null;

      return {
        id: m.id,
        schoolId: m.schoolId,
        title: m.title,
        description: m.description,
        meetingType: m.meetingType,
        meetingMode: m.meetingMode,
        scheduledDate: m.scheduledDate,
        startTime: m.startTime,
        endTime: m.endTime,
        locationOrRoom: m.locationOrRoom,
        joiningUrl: m.joiningUrl,
        status: m.status,
        notes: m.notes,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        hostUserId: m.hostUserId,
        guardianUserId: m.guardianUserId,
        studentProfileId: m.studentProfileId,
        hostName: host ? `${host.firstName} ${host.lastName}`.trim() : 'Faculty Host',
        hostEmail: host?.email,
        hostAvatar: host?.avatarUrl,
        hostUser: host
          ? {
              id: host.id,
              firstName: host.firstName,
              lastName: host.lastName,
              email: host.email,
              avatarUrl: host.avatarUrl,
            }
          : null,
        guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}`.trim() : undefined,
        guardianEmail: guardian?.email,
        guardianPhone: guardian?.phone,
        studentName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : undefined,
        studentAdmissionNumber: m.student?.admissionNumber,
        studentClassName: enrollment?.class?.name,
        studentSectionName: enrollment?.section?.name,
        studentRollNumber: enrollment?.rollNumber,
        studentPhotoUrl: m.student?.photoUrl || studentUser?.avatarUrl,
        studentProfile: m.student
          ? {
              id: m.student.id,
              admissionNumber: m.student.admissionNumber,
              user: studentUser,
              enrollments: m.student.enrollments,
            }
          : null,
      };
    });
  }

  async scheduleMeeting(schoolId: string, hostUserId: string, userRoleOrData: any, dataParam?: any) {
    const userRole = dataParam !== undefined ? userRoleOrData : PlatformRole.SCHOOL_ADMIN;
    const data = dataParam !== undefined ? dataParam : userRoleOrData;

    let guardianUserId = data.guardianUserId || null;

    if (data.studentProfileId) {
      const student = await prisma.studentProfile.findFirst({
        where: { id: data.studentProfileId, membership: { schoolId } },
        include: {
          enrollments: {
            include: { section: true },
            orderBy: { enrolledAt: 'desc' },
            take: 1,
          },
          parentLinks: {
            include: {
              parentMembership: { include: { user: true } },
            },
          },
        },
      });

      if (!student) {
        throw new AppError('Student profile not found within this institutional school tenant.', 404);
      }

      // Enforce tenant boundary: student must belong to the caller's school
      // Auto-link guardian if not explicitly passed
      if (!guardianUserId && student.parentLinks.length > 0) {
        const primaryLink = student.parentLinks.find((l) => l.isPrimaryContact) || student.parentLinks[0];
        guardianUserId = primaryLink.parentMembership.userId;
      }
    }

    let scheduledDate = new Date();
    if (data.scheduledDate) {
      const d = new Date(data.scheduledDate);
      if (!isNaN(d.getTime())) scheduledDate = d;
    } else if (data.startDate) {
      const d = new Date(data.startDate);
      if (!isNaN(d.getTime())) scheduledDate = d;
    }

    const startTime = data.startTime || '10:00';
    const endTime = data.endTime || '10:30';

    let meetUrl = data.joiningUrl || null;
    const meetingMode = data.meetingMode || 'ONLINE';
    if (meetingMode === 'ONLINE' && !meetUrl) {
      const cleanAlpha = () => crypto.randomBytes(4).toString('hex').replace(/[^a-z]/g, 'a').slice(0, 3);
      const part1 = cleanAlpha() || 'edu';
      const part2 = (cleanAlpha() + 'm').slice(0, 4);
      const part3 = cleanAlpha() || 'xyz';
      meetUrl = `https://meet.google.com/${part1}-${part2}-${part3}`;
    }

    let meetingType = data.meetingType || 'PARENT_TEACHER';
    if (meetingType === 'PTM') meetingType = 'PARENT_TEACHER';

    const meeting = await prisma.meeting.create({
      data: {
        schoolId,
        title: data.title,
        description: data.description || null,
        meetingType,
        hostUserId,
        studentProfileId: data.studentProfileId || null,
        guardianUserId,
        scheduledDate,
        startTime,
        endTime,
        meetingMode,
        locationOrRoom: meetingMode === 'IN_PERSON' ? (data.locationOrRoom || 'Main Campus Conference Room') : null,
        joiningUrl: meetingMode === 'ONLINE' ? meetUrl : null,
        notes: data.notes || null,
        status: 'SCHEDULED',
      },
      include: {
        student: {
          include: {
            membership: { include: { user: true } },
            enrollments: { include: { class: true, section: true }, take: 1, orderBy: { enrolledAt: 'desc' } },
          },
        },
      },
    });

    // Mirror to CalendarEvent so it appears in master ERP calendar
    try {
      const [startH, startM] = startTime.split(':').map((n: string) => parseInt(n, 10) || 0);
      const [endH, endM] = endTime.split(':').map((n: string) => parseInt(n, 10) || 0);
      const eventStart = new Date(scheduledDate);
      eventStart.setHours(startH, startM, 0, 0);
      const eventEnd = new Date(scheduledDate);
      eventEnd.setHours(endH, endM, 0, 0);

      await prisma.calendarEvent.create({
        data: {
          schoolId,
          title: `[Meeting] ${meeting.title}`,
          description: meeting.description || (meetUrl ? `Google Meet Link: ${meetUrl}` : null),
          category: 'MEETING',
          startDate: eventStart,
          endDate: eventEnd,
          location: meetUrl || meeting.locationOrRoom || 'Google Meet',
          createdById: hostUserId,
          targetAudience: 'ALL',
        },
      });
    } catch (e) {
      console.warn('Could not mirror meeting to calendarEvent:', e);
    }

    return meeting;
  }

  async updateMeeting(schoolId: string, userId: string, userRole: string, meetingId: string, data: any) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, schoolId },
      include: {
        student: {
          include: {
            enrollments: { include: { section: true }, take: 1, orderBy: { enrolledAt: 'desc' } },
          },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Consultation meeting not found in this school tenant', 404);
    }

    // Authorization check for TEACHER role
    if (userRole === PlatformRole.TEACHER) {
      const isHost = meeting.hostUserId === userId;

      let isAssignedTeacher = false;
      if (!isHost && meeting.student?.enrollments?.[0]?.sectionId) {
        const staff = await prisma.staffProfile.findFirst({
          where: { membership: { schoolId, userId } },
          include: {
            teacherAssignments: {
              include: { subject: { include: { class: { include: { sections: true } } } } },
            },
          },
        });
        const assignedSectionIds = staff?.teacherAssignments?.flatMap(
          (a) => a.subject.class?.sections.map((s) => s.id) || []
        ) || [];
        isAssignedTeacher = assignedSectionIds.includes(meeting.student.enrollments[0].sectionId);
      }

      if (!isHost && !isAssignedTeacher) {
        throw new AppError(
          'Access denied. Teachers can only manage or reschedule their own consultations or meetings for their assigned students.',
          403
        );
      }
    } else if (
      userRole !== PlatformRole.SCHOOL_ADMIN &&
      userRole !== PlatformRole.PRINCIPAL &&
      userRole !== PlatformRole.SUPER_ADMIN
    ) {
      throw new AppError(`Access denied. Role '${userRole}' is not authorized to manage consultations.`, 403);
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.joiningUrl !== undefined) updateData.joiningUrl = data.joiningUrl;
    if (data.locationOrRoom !== undefined) updateData.locationOrRoom = data.locationOrRoom;
    if (data.meetingMode) updateData.meetingMode = data.meetingMode;
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;

    if (data.scheduledDate) {
      const d = new Date(data.scheduledDate);
      if (!isNaN(d.getTime())) updateData.scheduledDate = d;
    }
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
    });

    return updated;
  }

  async updateMeetingStatus(schoolId: string, meetingId: string, data: any) {
    return prisma.meeting.update({
      where: { id: meetingId, schoolId },
      data: {
        status: data.status,
        notes: data.notes !== undefined ? data.notes : undefined,
        joiningUrl: data.joiningUrl !== undefined ? data.joiningUrl : undefined,
      },
    });
  }

  async deleteMeeting(schoolId: string, userId: string, userRole: string, meetingId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, schoolId },
    });
    if (!meeting) throw new AppError('Consultation meeting not found in this school tenant', 404);

    if (
      userRole === PlatformRole.TEACHER &&
      meeting.hostUserId !== userId
    ) {
      throw new AppError('Access denied. Teachers can only cancel their own scheduled meetings.', 403);
    } else if (
      userRole !== PlatformRole.TEACHER &&
      userRole !== PlatformRole.SCHOOL_ADMIN &&
      userRole !== PlatformRole.PRINCIPAL &&
      userRole !== PlatformRole.SUPER_ADMIN
    ) {
      throw new AppError(`Access denied. Role '${userRole}' cannot cancel meetings.`, 403);
    }

    return prisma.meeting.delete({
      where: { id: meetingId },
    });
  }

  // ==========================================================================
  // 4. LIBRARY SERVICES
  // ==========================================================================

  async listLibraryBooks(schoolId: string, search?: string, category?: string) {
    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

    return prisma.libraryBook.findMany({
      where,
      orderBy: { title: 'asc' },
    });
  }

  async createLibraryBook(schoolId: string, data: any) {
    return prisma.libraryBook.create({
      data: {
        schoolId,
        title: data.title,
        author: data.author,
        isbn: data.isbn || null,
        category: data.category || 'General',
        publisher: data.publisher || null,
        totalCopies: Number(data.totalCopies) || 1,
        availableCopies: Number(data.totalCopies) || 1,
        shelfLocation: data.shelfLocation || 'Main Stacks',
      },
    });
  }

  async issueBook(schoolId: string, data: any) {
    const book = await prisma.libraryBook.findFirst({
      where: { id: data.bookId, schoolId },
    });
    if (!book) throw new AppError('Library book not found.', 404);
    if (book.availableCopies <= 0) throw new AppError('No copies available for issue.', 400);

    const [issue] = await prisma.$transaction([
      prisma.bookIssue.create({
        data: {
          schoolId,
          bookId: data.bookId,
          studentProfileId: data.studentProfileId,
          dueDate: new Date(data.dueDate),
          status: 'ISSUED',
          notes: data.notes || null,
        },
        include: { book: true, student: true },
      }),
      prisma.libraryBook.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    return issue;
  }

  async returnBook(schoolId: string, issueId: string, fineAmount: number = 0) {
    const issue = await prisma.bookIssue.findFirst({
      where: { id: issueId, schoolId },
    });
    if (!issue) throw new AppError('Issue record not found.', 404);

    const [updatedIssue] = await prisma.$transaction([
      prisma.bookIssue.update({
        where: { id: issueId },
        data: {
          status: 'RETURNED',
          returnDate: new Date(),
          fineAmount,
          finePaid: fineAmount > 0 ? true : false,
        },
      }),
      prisma.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    return updatedIssue;
  }
}

export const portalsService = new PortalsService();
