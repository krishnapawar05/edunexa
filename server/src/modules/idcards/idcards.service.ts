import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CardStatus, PlatformRole } from '@prisma/client';
import { randomUUID, createHash } from 'crypto';
import {
  GenerateIdCardDTO,
  BulkGenerateIdCardsDTO,
  IdCardTemplateDTO,
  UpdateIdCardStatusDTO,
} from '@edunexa/shared';
import { storageService } from '../storage/storage.service.js';

export class IdCardsService {
  /**
   * Helper: Compute cryptographic hash of holder's profile data to detect changes.
   */
  computeProfileHash(data: Record<string, any>): string {
    const serialized = Object.keys(data)
      .sort()
      .map((k) => `${k}:${data[k] ?? ''}`)
      .join('|');
    return createHash('sha256').update(serialized).digest('hex').slice(0, 16);
  }

  /**
   * Helper: Ensure at least one default template exists for the school.
   */
  async ensureDefaultTemplate(schoolId: string) {
    const existing = await prisma.idCardTemplate.findFirst({
      where: { schoolId },
    });
    if (existing) return existing;

    return prisma.idCardTemplate.create({
      data: {
        schoolId,
        name: 'Official Institutional Classic (CR80)',
        description: 'Standard institutional double-sided credential template with deep navy and academic gold palette.',
        targetRole: 'ALL',
        isDefault: true,
        isActive: true,
        primaryColor: '#1e3a8a',
        secondaryColor: '#d97706',
        headerTextColor: '#ffffff',
        cardOrientation: 'LANDSCAPE',
        showBloodGroup: true,
        showParentContact: true,
        showEmergencyPhone: true,
        showPrincipalSign: true,
        showSchoolSeal: true,
        showBarcode: false,
        customTermsText:
          'This card is the property of the institution. If found, please return to the school administration desk. Unauthorized use or reproduction is strictly prohibited.',
      },
    });
  }

  // ==========================================================================
  // 1. DASHBOARD & TELEMETRY
  // ==========================================================================

  async getDashboardStats(schoolId: string) {
    // 1. Student counts
    const totalStudents = await prisma.studentProfile.count({
      where: { membership: { schoolId } },
    });
    const studentsWithCard = await prisma.studentProfile.count({
      where: {
        membership: { schoolId },
        virtualIdCard: { is: { status: CardStatus.ACTIVE } },
      },
    });

    // 2. Teacher & Staff counts
    const staffMembers = await prisma.staffProfile.findMany({
      where: { membership: { schoolId } },
      include: {
        membership: true,
        virtualIdCard: true,
      },
    });

    let totalTeachers = 0;
    let teachersWithCard = 0;
    let totalStaff = 0;
    let staffWithCard = 0;

    staffMembers.forEach((st) => {
      const isTeacher = st.membership.role === PlatformRole.TEACHER;
      const hasActiveCard = st.virtualIdCard?.status === CardStatus.ACTIVE;
      if (isTeacher) {
        totalTeachers++;
        if (hasActiveCard) teachersWithCard++;
      } else {
        totalStaff++;
        if (hasActiveCard) staffWithCard++;
      }
    });

    // 3. Card statuses
    const totalActiveCards = await prisma.virtualIdCard.count({
      where: {
        OR: [
          { student: { membership: { schoolId } } },
          { staff: { membership: { schoolId } } },
        ],
        status: CardStatus.ACTIVE,
      },
    });

    const totalRevokedCards = await prisma.virtualIdCard.count({
      where: {
        OR: [
          { student: { membership: { schoolId } } },
          { staff: { membership: { schoolId } } },
        ],
        status: CardStatus.REVOKED,
      },
    });

    // 4. Recent activity
    const recentCards = await prisma.virtualIdCard.findMany({
      where: {
        OR: [
          { student: { membership: { schoolId } } },
          { staff: { membership: { schoolId } } },
        ],
      },
      orderBy: { issuedAt: 'desc' },
      take: 10,
      include: {
        student: {
          include: {
            membership: { include: { user: true } },
            enrollments: { include: { class: true, section: true }, take: 1 },
          },
        },
        staff: {
          include: {
            membership: { include: { user: true } },
            department: true,
          },
        },
        template: true,
      },
    });

    const formattedRecent = recentCards.map((c) => {
      const isStudent = !!c.student;
      const user = isStudent ? c.student?.membership.user : c.staff?.membership.user;
      const role = isStudent ? 'STUDENT' : c.staff?.membership.role === PlatformRole.TEACHER ? 'TEACHER' : 'STAFF';
      return {
        id: c.id,
        cardNumber: c.cardNumber,
        verificationToken: c.verificationToken,
        status: c.status,
        issuedAt: c.issuedAt.toISOString(),
        holderType: role,
        holderName: user ? `${user.firstName} ${user.lastName}` : 'Holder',
        identifier: isStudent ? c.student?.admissionNumber : c.staff?.employeeId,
        subDetail: isStudent
          ? `${c.student?.enrollments?.[0]?.class.name || 'Class'} - ${c.student?.enrollments?.[0]?.section.name || 'A'}`
          : `${c.staff?.department?.name || 'General'} • ${c.staff?.designation || 'Staff'}`,
      };
    });

    const totalEligible = totalStudents + totalTeachers + totalStaff;
    const totalCardsGenerated = studentsWithCard + teachersWithCard + staffWithCard;
    const pendingCards = Math.max(0, totalEligible - totalCardsGenerated);

    return {
      totalEligible,
      totalStudents,
      totalTeachers,
      totalStaff,
      totalCardsGenerated,
      pendingCards,
      activeCards: totalActiveCards,
      revokedCards: totalRevokedCards,
      students: {
        total: totalStudents,
        generated: studentsWithCard,
        pending: Math.max(0, totalStudents - studentsWithCard),
      },
      teachers: {
        total: totalTeachers,
        generated: teachersWithCard,
        pending: Math.max(0, totalTeachers - teachersWithCard),
      },
      staff: {
        total: totalStaff,
        generated: staffWithCard,
        pending: Math.max(0, totalStaff - staffWithCard),
      },
      cards: {
        totalActive: totalActiveCards,
        totalRevoked: totalRevokedCards,
        totalEligible,
      },
      recentActivity: formattedRecent,
    };
  }

  // ==========================================================================
  // 2. STUDENT ID CARD LISTING & FILTERING
  // ==========================================================================

  async listStudentIdCards(
    schoolId: string,
    params: {
      classId?: string;
      sectionId?: string;
      status?: string; // "ALL" | "ACTIVE" | "NOT_GENERATED" | "REVOKED"
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {
      membership: { schoolId },
    };

    if (params.classId) {
      where.enrollments = { some: { classId: params.classId } };
    }
    if (params.sectionId) {
      where.enrollments = {
        ...where.enrollments,
        some: { ...(where.enrollments?.some || {}), sectionId: params.sectionId },
      };
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { admissionNumber: { contains: q, mode: 'insensitive' } },
        { membership: { user: { firstName: { contains: q, mode: 'insensitive' } } } },
        { membership: { user: { lastName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (params.status && params.status !== 'ALL') {
      if (params.status === 'NOT_GENERATED') {
        where.virtualIdCard = null;
      } else if (params.status === 'ACTIVE') {
        where.virtualIdCard = { status: CardStatus.ACTIVE };
      } else if (params.status === 'REVOKED') {
        where.virtualIdCard = { status: CardStatus.REVOKED };
      }
    }

    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ membership: { user: { firstName: 'asc' } } }],
        include: {
          membership: { include: { user: true } },
          enrollments: {
            include: { class: true, section: true, academicSession: true },
            take: 1,
          },
          virtualIdCard: { include: { template: true } },
        },
      }),
      prisma.studentProfile.count({ where }),
    ]);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, code: true, logoUrl: true, address: true, phone: true, email: true },
    });

    const items = students.map((s) => {
      const u = s.membership.user;
      const enrollment = s.enrollments[0];
      const className = enrollment?.class?.name || 'Class —';
      const sectionName = enrollment?.section?.name || '—';
      const academicSession = enrollment?.academicSession?.name || '2026–2027';

      const currentData = {
        name: `${u.firstName} ${u.lastName}`.trim(),
        admissionNumber: s.admissionNumber,
        rollNumber: enrollment?.rollNumber ? String(enrollment.rollNumber) : '',
        className,
        sectionName,
        emergencyPhone: s.emergencyPhone || '',
        bloodGroup: s.bloodGroup || '',
        avatarUrl: s.photoUrl || u.avatarUrl || '',
      };
      const currentHash = this.computeProfileHash(currentData);
      const card = s.virtualIdCard;
      const isUpToDate = card?.dataHash ? card.dataHash === currentHash : true;

      return {
        id: s.id,
        holderType: 'STUDENT',
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        admissionNumber: s.admissionNumber,
        dateOfBirth: s.dateOfBirth?.toISOString().split('T')[0] || null,
        gender: s.gender,
        bloodGroup: s.bloodGroup,
        emergencyPhone: s.emergencyPhone,
        address: s.address,
        avatarUrl: s.photoUrl || u.avatarUrl,
        classId: enrollment?.classId || null,
        className,
        sectionId: enrollment?.sectionId || null,
        sectionName,
        rollNumber: enrollment?.rollNumber || null,
        academicSession,
        school,
        idCard: card
          ? {
              id: card.id,
              cardNumber: card.cardNumber,
              verificationToken: card.verificationToken,
              status: card.status,
              issuedAt: card.issuedAt.toISOString(),
              expiresAt: card.expiresAt?.toISOString() || null,
              template: card.template,
              isUpToDate,
            }
          : null,
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ==========================================================================
  // 3. TEACHER & STAFF ID CARD LISTING & FILTERING
  // ==========================================================================

  async listEmployeeIdCards(
    schoolId: string,
    params: {
      category?: 'ALL' | 'TEACHER' | 'STAFF';
      departmentId?: string;
      status?: string; // "ALL" | "ACTIVE" | "NOT_GENERATED" | "REVOKED"
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {
      membership: { schoolId },
    };

    if (params.category && params.category !== 'ALL') {
      if (params.category === 'TEACHER') {
        where.membership = { ...where.membership, role: PlatformRole.TEACHER };
      } else if (params.category === 'STAFF') {
        where.membership = { ...where.membership, role: { not: PlatformRole.TEACHER } };
      }
    }

    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { employeeId: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { membership: { user: { firstName: { contains: q, mode: 'insensitive' } } } },
        { membership: { user: { lastName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (params.status && params.status !== 'ALL') {
      if (params.status === 'NOT_GENERATED') {
        where.virtualIdCard = null;
      } else if (params.status === 'ACTIVE') {
        where.virtualIdCard = { status: CardStatus.ACTIVE };
      } else if (params.status === 'REVOKED') {
        where.virtualIdCard = { status: CardStatus.REVOKED };
      }
    }

    const [staff, total] = await Promise.all([
      prisma.staffProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ membership: { user: { firstName: 'asc' } } }],
        include: {
          membership: { include: { user: true } },
          department: true,
          virtualIdCard: { include: { template: true } },
        },
      }),
      prisma.staffProfile.count({ where }),
    ]);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, code: true, logoUrl: true, address: true, phone: true, email: true },
    });

    const items = staff.map((st) => {
      const u = st.membership.user;
      const isTeacher = st.membership.role === PlatformRole.TEACHER;
      const deptName = st.department?.name || 'General Administration';

      const currentData = {
        name: `${u.firstName} ${u.lastName}`.trim(),
        employeeId: st.employeeId,
        designation: st.designation,
        department: deptName,
        emergencyPhone: u.phone || '',
        avatarUrl: st.photoUrl || u.avatarUrl || '',
      };
      const currentHash = this.computeProfileHash(currentData);
      const card = st.virtualIdCard;
      const isUpToDate = card?.dataHash ? card.dataHash === currentHash : true;

      return {
        id: st.id,
        holderType: isTeacher ? 'TEACHER' : 'STAFF',
        userId: u.id,
        role: st.membership.role,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        employeeId: st.employeeId,
        designation: st.designation,
        departmentId: st.departmentId,
        departmentName: deptName,
        joiningDate: st.joiningDate?.toISOString().split('T')[0] || null,
        emergencyPhone: u.phone,
        avatarUrl: st.photoUrl || u.avatarUrl,
        school,
        idCard: card
          ? {
              id: card.id,
              cardNumber: card.cardNumber,
              verificationToken: card.verificationToken,
              status: card.status,
              issuedAt: card.issuedAt.toISOString(),
              expiresAt: card.expiresAt?.toISOString() || null,
              template: card.template,
              isUpToDate,
            }
          : null,
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ==========================================================================
  // 4. INDIVIDUAL ID CARD GENERATION & REGENERATION
  // ==========================================================================

  async generateIndividualIdCard(
    schoolId: string,
    holderType: 'STUDENT' | 'STAFF' | 'TEACHER',
    profileId: string,
    templateId?: string
  ) {
    let resolvedTemplateId = templateId;
    if (!resolvedTemplateId) {
      const defaultTpl = await this.ensureDefaultTemplate(schoolId);
      resolvedTemplateId = defaultTpl.id;
    }

    const verificationToken = `v-tok-${randomUUID()}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prefix = holderType === 'STUDENT' ? 'STU-CR80' : holderType === 'TEACHER' ? 'TEA-CR80' : 'STF-CR80';
    const cardNumber = `${prefix}-${rand}`;

    if (holderType === 'STUDENT') {
      const student = await prisma.studentProfile.findFirst({
        where: { id: profileId, membership: { schoolId } },
        include: {
          membership: { include: { user: true, school: true } },
          enrollments: { include: { class: true, section: true }, take: 1 },
          virtualIdCard: true,
        },
      });

      if (!student) {
        throw new AppError('Student profile not found in this school tenant.', 404, 'NOT_FOUND');
      }

      const u = student.membership.user;
      const dataHash = this.computeProfileHash({
        name: `${u.firstName} ${u.lastName}`.trim(),
        admissionNumber: student.admissionNumber,
        rollNumber: student.enrollments[0]?.rollNumber ? String(student.enrollments[0].rollNumber) : '',
        className: student.enrollments[0]?.class?.name || '',
        sectionName: student.enrollments[0]?.section?.name || '',
        emergencyPhone: student.emergencyPhone || '',
        bloodGroup: student.bloodGroup || '',
        avatarUrl: student.photoUrl || u.avatarUrl || '',
      });

      const existing = student.virtualIdCard;
      let card;

      if (existing) {
        card = await prisma.virtualIdCard.update({
          where: { id: existing.id },
          data: {
            cardNumber,
            verificationToken,
            dataHash,
            templateId: resolvedTemplateId,
            status: CardStatus.ACTIVE,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            revokedAt: null,
            revocationReason: null,
            schoolId,
          },
          include: { template: true },
        });
      } else {
        card = await prisma.virtualIdCard.create({
          data: {
            schoolId,
            studentProfileId: student.id,
            templateId: resolvedTemplateId,
            cardNumber,
            verificationToken,
            dataHash,
            status: CardStatus.ACTIVE,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          include: { template: true },
        });
      }

      return {
        card,
        holder: {
          holderType: 'STUDENT',
          id: student.id,
          name: `${u.firstName} ${u.lastName}`,
          admissionNumber: student.admissionNumber,
          className: student.enrollments[0]?.class?.name || 'Class —',
          sectionName: student.enrollments[0]?.section?.name || '—',
          bloodGroup: student.bloodGroup,
          avatarUrl: student.photoUrl || u.avatarUrl,
        },
      };
    } else {
      // Staff or Teacher
      const staff = await prisma.staffProfile.findFirst({
        where: { id: profileId, membership: { schoolId } },
        include: {
          membership: { include: { user: true, school: true } },
          department: true,
          virtualIdCard: true,
        },
      });

      if (!staff) {
        throw new AppError('Staff/Teacher profile not found in this school tenant.', 404, 'NOT_FOUND');
      }

      const u = staff.membership.user;
      const dataHash = this.computeProfileHash({
        name: `${u.firstName} ${u.lastName}`.trim(),
        employeeId: staff.employeeId,
        designation: staff.designation,
        department: staff.department?.name || '',
        emergencyPhone: u.phone || '',
        avatarUrl: staff.photoUrl || u.avatarUrl || '',
      });

      const existing = staff.virtualIdCard;
      let card;

      if (existing) {
        card = await prisma.virtualIdCard.update({
          where: { id: existing.id },
          data: {
            cardNumber,
            verificationToken,
            dataHash,
            templateId: resolvedTemplateId,
            status: CardStatus.ACTIVE,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            revokedAt: null,
            revocationReason: null,
            schoolId,
          },
          include: { template: true },
        });
      } else {
        card = await prisma.virtualIdCard.create({
          data: {
            schoolId,
            staffProfileId: staff.id,
            templateId: resolvedTemplateId,
            cardNumber,
            verificationToken,
            dataHash,
            status: CardStatus.ACTIVE,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          include: { template: true },
        });
      }

      return {
        card,
        holder: {
          holderType: staff.membership.role === PlatformRole.TEACHER ? 'TEACHER' : 'STAFF',
          id: staff.id,
          name: `${u.firstName} ${u.lastName}`,
          employeeId: staff.employeeId,
          designation: staff.designation,
          department: staff.department?.name || 'General',
          avatarUrl: staff.photoUrl || u.avatarUrl,
        },
      };
    }
  }

  // ==========================================================================
  // 5. BULK ID CARD GENERATION (CLASS / SECTION / DEPARTMENT / MULTI-SELECT)
  // ==========================================================================

  async bulkGenerateIdCards(schoolId: string, data: BulkGenerateIdCardsDTO) {
    let resolvedTemplateId = data.templateId;
    if (!resolvedTemplateId) {
      const defaultTpl = await this.ensureDefaultTemplate(schoolId);
      resolvedTemplateId = defaultTpl.id;
    }

    let generatedCount = 0;
    const generatedCards: any[] = [];

    if (data.targetType === 'CLASS' || data.targetType === 'SECTION') {
      const where: any = {
        membership: { schoolId },
      };
      if (data.classId) {
        where.enrollments = { some: { classId: data.classId } };
      }
      if (data.sectionId) {
        where.enrollments = {
          ...where.enrollments,
          some: { ...(where.enrollments?.some || {}), sectionId: data.sectionId },
        };
      }

      const students = await prisma.studentProfile.findMany({
        where,
        select: { id: true },
      });

      for (const s of students) {
        const res = await this.generateIndividualIdCard(schoolId, 'STUDENT', s.id, resolvedTemplateId);
        generatedCards.push(res);
        generatedCount++;
      }
    } else if (data.targetType === 'SELECTED_STUDENTS') {
      const ids = data.profileIds || (data as any).selectedIds || [];
      for (const id of ids) {
        try {
          const res = await this.generateIndividualIdCard(schoolId, 'STUDENT', id, resolvedTemplateId);
          generatedCards.push(res);
          generatedCount++;
        } catch {
          // Continue bulk loop safely
        }
      }
    } else if (data.targetType === 'ALL_TEACHERS') {
      const teachers = await prisma.staffProfile.findMany({
        where: {
          membership: { schoolId, role: PlatformRole.TEACHER },
        },
        select: { id: true },
      });

      for (const t of teachers) {
        const res = await this.generateIndividualIdCard(schoolId, 'TEACHER', t.id, resolvedTemplateId);
        generatedCards.push(res);
        generatedCount++;
      }
    } else if (data.targetType === 'ALL_STAFF' || data.targetType === 'DEPARTMENT_STAFF') {
      const where: any = {
        membership: { schoolId },
      };
      if (data.departmentId) {
        where.departmentId = data.departmentId;
      }

      const staffMembers = await prisma.staffProfile.findMany({
        where,
        select: { id: true },
      });

      for (const st of staffMembers) {
        const res = await this.generateIndividualIdCard(schoolId, 'STAFF', st.id, resolvedTemplateId);
        generatedCards.push(res);
        generatedCount++;
      }
    } else if (data.targetType === 'SELECTED_STAFF') {
      const ids = data.profileIds || (data as any).selectedIds || [];
      for (const id of ids) {
        try {
          const res = await this.generateIndividualIdCard(schoolId, 'STAFF', id, resolvedTemplateId);
          generatedCards.push(res);
          generatedCount++;
        } catch {
          // Continue bulk loop safely
        }
      }
    }

    return {
      success: true,
      generatedCount,
      createdCount: generatedCount,
      targetType: data.targetType,
      templateId: resolvedTemplateId,
      cards: generatedCards,
    };
  }

  // ==========================================================================
  // 6. REVOCATION & STATUS MANAGEMENT
  // ==========================================================================

  async updateCardStatus(schoolId: string, cardId: string, data: UpdateIdCardStatusDTO) {
    const card = await prisma.virtualIdCard.findFirst({
      where: {
        id: cardId,
        OR: [
          { schoolId },
          { student: { membership: { schoolId } } },
          { staff: { membership: { schoolId } } },
        ],
      },
    });

    if (!card) {
      throw new AppError('Virtual ID card not found in this school tenant.', 404, 'NOT_FOUND');
    }

    const updated = await prisma.virtualIdCard.update({
      where: { id: cardId },
      data: {
        status: data.status as CardStatus,
        revokedAt: data.status === 'REVOKED' ? new Date() : null,
        revocationReason: data.status === 'REVOKED' ? data.reason || 'Admin revoked' : null,
      },
      include: { template: true },
    });

    return updated;
  }

  // ==========================================================================
  // 7. SELF-SERVICE ID CARD (STUDENT & TEACHER/STAFF)
  // ==========================================================================

  async getSelfServiceCard(userId: string, schoolId: string, role: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        logoUrl: true,
        address: true,
        phone: true,
        email: true,
      },
    });

    if (!school) {
      throw new AppError('School tenant not found.', 404, 'NOT_FOUND');
    }

    if (role === PlatformRole.STUDENT) {
      let student = await prisma.studentProfile.findFirst({
        where: { membership: { userId, schoolId } },
        include: {
          membership: { include: { user: true } },
          enrollments: {
            include: { class: true, section: true, academicSession: true },
            take: 1,
          },
          virtualIdCard: { include: { template: true } },
        },
      });

      if (!student) {
        throw new AppError('Student profile record not found for this user account.', 404, 'NOT_FOUND');
      }

      // If no card exists yet, auto-provision an active ID card
      if (!student.virtualIdCard) {
        await this.generateIndividualIdCard(schoolId, 'STUDENT', student.id);
        student = await prisma.studentProfile.findFirst({
          where: { id: student.id },
          include: {
            membership: { include: { user: true } },
            enrollments: {
              include: { class: true, section: true, academicSession: true },
              take: 1,
            },
            virtualIdCard: { include: { template: true } },
          },
        });
      }

      const u = student!.membership.user;
      const enrollment = student!.enrollments[0];
      const card = student!.virtualIdCard!;

      const cardData = {
        id: card.id,
        cardNumber: card.cardNumber,
        verificationToken: card.verificationToken,
        status: card.status,
        issuedAt: card.issuedAt.toISOString(),
        expiresAt: card.expiresAt?.toISOString() || null,
        template: card.template,
      };

      const profileData = {
        id: student!.id,
        fullName: `${u.firstName} ${u.lastName}`,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        admissionNumber: student!.admissionNumber,
        rollNumber: enrollment?.rollNumber || null,
        className: enrollment?.class?.name || 'Class —',
        sectionName: enrollment?.section?.name || '—',
        academicSession: enrollment?.academicSession?.name || '2026–2027',
        dateOfBirth: student!.dateOfBirth?.toISOString().split('T')[0] || null,
        bloodGroup: student!.bloodGroup,
        emergencyPhone: student!.emergencyPhone,
        address: student!.address,
        avatarUrl: student!.photoUrl || u.avatarUrl,
        role: 'STUDENT',
      };

      return {
        holderType: 'STUDENT',
        ...profileData,
        profile: profileData,
        school,
        idCard: cardData,
        card: cardData,
        template: card.template,
      };
    } else {
      // Teacher or Staff
      let staff = await prisma.staffProfile.findFirst({
        where: { membership: { userId, schoolId } },
        include: {
          membership: { include: { user: true } },
          department: true,
          virtualIdCard: { include: { template: true } },
        },
      });

      if (!staff) {
        throw new AppError('Employee profile record not found for this user account.', 404, 'NOT_FOUND');
      }

      if (!staff.virtualIdCard) {
        const holderCat = staff.membership.role === PlatformRole.TEACHER ? 'TEACHER' : 'STAFF';
        await this.generateIndividualIdCard(schoolId, holderCat, staff.id);
        staff = await prisma.staffProfile.findFirst({
          where: { id: staff.id },
          include: {
            membership: { include: { user: true } },
            department: true,
            virtualIdCard: { include: { template: true } },
          },
        });
      }

      const u = staff!.membership.user;
      const card = staff!.virtualIdCard!;

      const cardData = {
        id: card.id,
        cardNumber: card.cardNumber,
        verificationToken: card.verificationToken,
        status: card.status,
        issuedAt: card.issuedAt.toISOString(),
        expiresAt: card.expiresAt?.toISOString() || null,
        template: card.template,
      };

      const profileData = {
        id: staff!.id,
        fullName: `${u.firstName} ${u.lastName}`,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        employeeId: staff!.employeeId,
        designation: staff!.designation,
        department: staff!.department?.name || 'Faculty',
        joiningDate: staff!.joiningDate?.toISOString().split('T')[0] || null,
        emergencyPhone: u.phone,
        avatarUrl: staff!.photoUrl || u.avatarUrl,
        role: staff!.membership.role,
      };

      return {
        holderType: staff!.membership.role === PlatformRole.TEACHER ? 'TEACHER' : 'STAFF',
        ...profileData,
        profile: profileData,
        school,
        idCard: cardData,
        card: cardData,
        template: card.template,
      };
    }
  }

  // ==========================================================================
  // 8. TEMPLATE MANAGEMENT
  // ==========================================================================

  async listTemplates(schoolId: string) {
    await this.ensureDefaultTemplate(schoolId);
    return prisma.idCardTemplate.findMany({
      where: { schoolId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createTemplate(schoolId: string, data: IdCardTemplateDTO) {
    if (data.isDefault) {
      await prisma.idCardTemplate.updateMany({
        where: { schoolId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.idCardTemplate.create({
      data: {
        schoolId,
        name: data.name,
        description: data.description || null,
        targetRole: data.targetRole,
        isDefault: data.isDefault,
        isActive: data.isActive,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        headerTextColor: data.headerTextColor,
        cardOrientation: data.cardOrientation,
        showBloodGroup: data.showBloodGroup,
        showParentContact: data.showParentContact,
        showEmergencyPhone: data.showEmergencyPhone,
        showPrincipalSign: data.showPrincipalSign,
        showSchoolSeal: data.showSchoolSeal,
        showBarcode: data.showBarcode,
        customTermsText: data.customTermsText || null,
        layoutConfig: data.layoutConfig || null,
      },
    });
  }

  async updateTemplate(schoolId: string, id: string, data: Partial<IdCardTemplateDTO>) {
    const existing = await prisma.idCardTemplate.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      throw new AppError('ID card template not found.', 404, 'NOT_FOUND');
    }

    if (data.isDefault) {
      await prisma.idCardTemplate.updateMany({
        where: { schoolId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.idCardTemplate.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async deleteTemplate(schoolId: string, id: string) {
    const existing = await prisma.idCardTemplate.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      throw new AppError('ID card template not found.', 404, 'NOT_FOUND');
    }

    if (existing.isDefault) {
      throw new AppError('Cannot delete the default ID card template.', 400, 'CANNOT_DELETE_DEFAULT');
    }

    return prisma.idCardTemplate.delete({
      where: { id },
    });
  }

  // ==========================================================================
  // 6. CENTRALIZED PHOTO MANAGEMENT (STUDENTS & EMPLOYEES)
  // ==========================================================================

  /**
   * Upload or replace student photograph with tenant isolation and audit logging.
   */
  async updateStudentPhoto(
    schoolId: string,
    studentId: string,
    photoData: string,
    originalName?: string,
    mimeType?: string,
    actingUserId?: string
  ) {
    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        membership: { schoolId },
      },
      include: {
        membership: { include: { user: true } },
        virtualIdCard: true,
      },
    });

    if (!student) {
      throw new AppError('Student record not found in this school tenant.', 404, 'NOT_FOUND');
    }

    let finalPhotoUrl = photoData;

    // If photoData is a base64 string, securely persist to disk via StorageService
    if (photoData.startsWith('data:') || photoData.length > 500) {
      const detectedMime = mimeType || (photoData.startsWith('data:') ? photoData.split(';')[0].split(':')[1] : 'image/jpeg');
      const ext = detectedMime.includes('png') ? 'png' : detectedMime.includes('webp') ? 'webp' : 'jpg';
      const fileName = originalName || `student_${student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '_')}_photo.${ext}`;

      const uploadResult = await storageService.uploadFile(schoolId, actingUserId || null, {
        originalName: fileName,
        mimeType: detectedMime,
        category: 'STUDENT_PHOTO',
        isPublic: true,
        base64Data: photoData,
      });

      finalPhotoUrl = uploadResult.downloadUrl;
    }

    // Persist photo reference in PostgreSQL on both StudentProfile and User models
    await prisma.$transaction([
      prisma.studentProfile.update({
        where: { id: student.id },
        data: { photoUrl: finalPhotoUrl },
      }),
      prisma.user.update({
        where: { id: student.membership.userId },
        data: { avatarUrl: finalPhotoUrl },
      }),
    ]);

    // Recompute Virtual ID Card dataHash if a card already exists
    if (student.virtualIdCard) {
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: { studentProfileId: student.id },
        include: { class: true, section: true },
      });
      const currentData = {
        name: `${student.membership.user.firstName} ${student.membership.user.lastName}`.trim(),
        admissionNumber: student.admissionNumber,
        rollNumber: enrollment?.rollNumber ? String(enrollment.rollNumber) : '',
        className: enrollment?.class?.name || '',
        sectionName: enrollment?.section?.name || '',
        emergencyPhone: student.emergencyPhone || '',
        bloodGroup: student.bloodGroup || '',
        avatarUrl: finalPhotoUrl,
      };
      await prisma.virtualIdCard.update({
        where: { id: student.virtualIdCard.id },
        data: { dataHash: this.computeProfileHash(currentData) },
      });
    }

    if (actingUserId) {
      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: actingUserId,
          action: 'STUDENT_PHOTO_UPDATED',
          entityType: 'STUDENT_PROFILE',
          entityId: studentId,
          details: { studentId, admissionNumber: student.admissionNumber, photoUrl: finalPhotoUrl },
        },
      }).catch(() => {});
    }

    return {
      success: true,
      message: 'Student photograph updated successfully.',
      photoUrl: finalPhotoUrl,
      studentId: student.id,
      admissionNumber: student.admissionNumber,
    };
  }

  /**
   * Remove student photograph
   */
  async removeStudentPhoto(schoolId: string, studentId: string, actingUserId?: string) {
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentId, membership: { schoolId } },
      include: { membership: true, virtualIdCard: true },
    });

    if (!student) {
      throw new AppError('Student record not found in this school tenant.', 404, 'NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.studentProfile.update({
        where: { id: student.id },
        data: { photoUrl: null },
      }),
      prisma.user.update({
        where: { id: student.membership.userId },
        data: { avatarUrl: null },
      }),
    ]);

    if (actingUserId) {
      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: actingUserId,
          action: 'STUDENT_PHOTO_REMOVED',
          entityType: 'STUDENT_PROFILE',
          entityId: studentId,
          details: { studentId, admissionNumber: student.admissionNumber },
        },
      }).catch(() => {});
    }

    return { success: true, message: 'Student photograph removed successfully.' };
  }

  /**
   * Upload or replace employee/faculty photograph with tenant isolation and audit logging.
   */
  async updateEmployeePhoto(
    schoolId: string,
    staffId: string,
    photoData: string,
    originalName?: string,
    mimeType?: string,
    actingUserId?: string
  ) {
    const staff = await prisma.staffProfile.findFirst({
      where: {
        id: staffId,
        membership: { schoolId },
      },
      include: {
        membership: { include: { user: true } },
        virtualIdCard: true,
        department: true,
      },
    });

    if (!staff) {
      throw new AppError('Employee record not found in this school tenant.', 404, 'NOT_FOUND');
    }

    let finalPhotoUrl = photoData;

    if (photoData.startsWith('data:') || photoData.length > 500) {
      const detectedMime = mimeType || (photoData.startsWith('data:') ? photoData.split(';')[0].split(':')[1] : 'image/jpeg');
      const ext = detectedMime.includes('png') ? 'png' : detectedMime.includes('webp') ? 'webp' : 'jpg';
      const fileName = originalName || `staff_${staff.employeeId.replace(/[^a-zA-Z0-9]/g, '_')}_photo.${ext}`;

      const uploadResult = await storageService.uploadFile(schoolId, actingUserId || null, {
        originalName: fileName,
        mimeType: detectedMime,
        category: 'STAFF_PHOTO',
        isPublic: true,
        base64Data: photoData,
      });

      finalPhotoUrl = uploadResult.downloadUrl;
    }

    await prisma.$transaction([
      prisma.staffProfile.update({
        where: { id: staff.id },
        data: { photoUrl: finalPhotoUrl },
      }),
      prisma.user.update({
        where: { id: staff.membership.userId },
        data: { avatarUrl: finalPhotoUrl },
      }),
    ]);

    if (staff.virtualIdCard) {
      const currentData = {
        name: `${staff.membership.user.firstName} ${staff.membership.user.lastName}`.trim(),
        employeeId: staff.employeeId,
        designation: staff.designation,
        department: staff.department?.name || '',
        emergencyPhone: staff.membership.user.phone || '',
        avatarUrl: finalPhotoUrl,
      };
      await prisma.virtualIdCard.update({
        where: { id: staff.virtualIdCard.id },
        data: { dataHash: this.computeProfileHash(currentData) },
      });
    }

    if (actingUserId) {
      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: actingUserId,
          action: 'STAFF_PHOTO_UPDATED',
          entityType: 'STAFF_PROFILE',
          entityId: staffId,
          details: { staffId, employeeId: staff.employeeId, photoUrl: finalPhotoUrl },
        },
      }).catch(() => {});
    }

    return {
      success: true,
      message: 'Employee photograph updated successfully.',
      photoUrl: finalPhotoUrl,
      staffId: staff.id,
      employeeId: staff.employeeId,
    };
  }

  /**
   * Remove employee photograph
   */
  async removeEmployeePhoto(schoolId: string, staffId: string, actingUserId?: string) {
    const staff = await prisma.staffProfile.findFirst({
      where: { id: staffId, membership: { schoolId } },
      include: { membership: true },
    });

    if (!staff) {
      throw new AppError('Employee record not found in this school tenant.', 404, 'NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.staffProfile.update({
        where: { id: staff.id },
        data: { photoUrl: null },
      }),
      prisma.user.update({
        where: { id: staff.membership.userId },
        data: { avatarUrl: null },
      }),
    ]);

    if (actingUserId) {
      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: actingUserId,
          action: 'STAFF_PHOTO_REMOVED',
          entityType: 'STAFF_PROFILE',
          entityId: staffId,
          details: { staffId, employeeId: staff.employeeId },
        },
      }).catch(() => {});
    }

    return { success: true, message: 'Employee photograph removed successfully.' };
  }
}

export const idCardsService = new IdCardsService();
