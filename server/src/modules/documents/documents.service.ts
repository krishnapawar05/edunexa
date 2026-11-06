import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  PlatformRole,
  CreateDownloadableDocDTO,
  UpdateDownloadableDocDTO,
  IssueCertificateDTO,
  UpdateCertificateStatusDTO,
  RecordDocumentAccessDTO,
} from '@edunexa/shared';

export class DocumentsService {
  // ============================================================================
  // 1. PUBLIC DOWNLOAD CENTRE
  // ============================================================================

  async listPublicDocuments(
    schoolIdentifier: string,
    filters?: { category?: string; query?: string }
  ) {
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { id: schoolIdentifier },
          { slug: schoolIdentifier },
          { code: schoolIdentifier },
        ],
      },
    });

    if (!school) {
      throw new AppError('School not found', 404, 'SCHOOL_NOT_FOUND');
    }

    const whereClause: any = {
      schoolId: school.id,
      isPublished: true,
      targetAudience: 'PUBLIC',
      publicationStatus: 'PUBLISHED',
    };

    if (filters?.category && filters.category !== 'ALL') {
      whereClause.category = filters.category;
    }

    if (filters?.query?.trim()) {
      whereClause.OR = [
        { title: { contains: filters.query.trim(), mode: 'insensitive' } },
        { description: { contains: filters.query.trim(), mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.downloadableDocument.findMany({
      where: whereClause,
      include: {
        academicSession: { select: { id: true, name: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        slug: school.slug,
      },
      documents,
    };
  }

  async getPublicDocument(schoolIdentifier: string, documentId: string) {
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { id: schoolIdentifier },
          { slug: schoolIdentifier },
          { code: schoolIdentifier },
        ],
      },
    });

    if (!school) {
      throw new AppError('School not found', 404, 'SCHOOL_NOT_FOUND');
    }

    const document = await prisma.downloadableDocument.findFirst({
      where: {
        id: documentId,
        schoolId: school.id,
        isPublished: true,
        targetAudience: 'PUBLIC',
        publicationStatus: 'PUBLISHED',
      },
      include: {
        academicSession: { select: { id: true, name: true } },
      },
    });

    if (!document) {
      throw new AppError('Document not found or access restricted.', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Increment download count and return updated document
    const updated = await prisma.downloadableDocument.update({
      where: { id: document.id },
      data: { downloadCount: { increment: 1 } },
      include: {
        academicSession: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  // ============================================================================
  // 2. ADMIN DOCUMENT MANAGEMENT (SCHOOL ADMIN / PRINCIPAL)
  // ============================================================================

  async createAdminDocument(schoolId: string, userId: string, data: CreateDownloadableDocDTO) {
    return prisma.downloadableDocument.create({
      data: {
        schoolId,
        uploadedById: userId,
        title: data.title,
        description: data.description,
        category: data.category,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize || '1.2 MB',
        fileType: data.fileType || 'PDF',
        targetAudience: data.targetAudience || 'PUBLIC',
        academicSessionId: data.academicSessionId || undefined,
        classId: data.classId || undefined,
        displayOrder: data.displayOrder ?? 0,
        isPublished: data.isPublished ?? true,
        publicationStatus: data.publicationStatus || 'PUBLISHED',
      },
      include: {
        academicSession: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async listAdminDocuments(
    schoolId: string,
    filters?: {
      category?: string;
      targetAudience?: string;
      publicationStatus?: string;
      query?: string;
    }
  ) {
    const whereClause: any = { schoolId };

    if (filters?.category && filters.category !== 'ALL') {
      whereClause.category = filters.category;
    }

    if (filters?.targetAudience && filters.targetAudience !== 'ALL') {
      whereClause.targetAudience = filters.targetAudience;
    }

    if (filters?.publicationStatus && filters.publicationStatus !== 'ALL') {
      whereClause.publicationStatus = filters.publicationStatus;
    }

    if (filters?.query?.trim()) {
      whereClause.OR = [
        { title: { contains: filters.query.trim(), mode: 'insensitive' } },
        { description: { contains: filters.query.trim(), mode: 'insensitive' } },
      ];
    }

    return prisma.downloadableDocument.findMany({
      where: whereClause,
      include: {
        academicSession: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateAdminDocument(schoolId: string, documentId: string, data: UpdateDownloadableDocDTO) {
    const existing = await prisma.downloadableDocument.findFirst({
      where: { id: documentId, schoolId },
    });

    if (!existing) {
      throw new AppError('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
    }

    return prisma.downloadableDocument.update({
      where: { id: documentId },
      data: {
        ...data,
        isPublished: data.publicationStatus ? data.publicationStatus === 'PUBLISHED' : data.isPublished,
      },
      include: {
        academicSession: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async deleteAdminDocument(schoolId: string, documentId: string) {
    const existing = await prisma.downloadableDocument.findFirst({
      where: { id: documentId, schoolId },
    });

    if (!existing) {
      throw new AppError('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
    }

    return prisma.downloadableDocument.delete({
      where: { id: documentId },
    });
  }

  // ============================================================================
  // 3. STUDENT & GUARDIAN ACADEMIC DOWNLOAD CENTRE
  // ============================================================================

  async getStudentAcademicDocuments(
    schoolId: string,
    studentProfileId: string,
    authenticatedUserId: string,
    authenticatedRole: string
  ) {
    // 1. Verify existence of student profile
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentProfileId, membership: { schoolId } },
      include: {
        membership: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        enrollments: {
          include: {
            class: true,
            section: true,
            academicSession: true,
          },
        },
        parentLinks: {
          include: {
            parentMembership: true,
          },
        },
      },
    });

    if (!student) {
      throw new AppError('Student record not found in active school tenant.', 404, 'STUDENT_NOT_FOUND');
    }

    // 2. Strict Security Ownership Verification
    if (authenticatedRole === PlatformRole.STUDENT) {
      if (student.membership.userId !== authenticatedUserId) {
        throw new AppError('Unauthorized: Students can only access their own academic documents.', 403, 'FORBIDDEN_STUDENT_OWNERSHIP');
      }
    } else if (authenticatedRole === PlatformRole.PARENT) {
      const isLinked = student.parentLinks.some(
        (link) => link.parentMembership?.userId === authenticatedUserId
      );
      if (!isLinked) {
        throw new AppError('Unauthorized: Guardian is not linked to the requested student profile.', 403, 'FORBIDDEN_GUARDIAN_LINK');
      }
    } else if (
      authenticatedRole !== PlatformRole.SCHOOL_ADMIN &&
      authenticatedRole !== PlatformRole.PRINCIPAL &&
      authenticatedRole !== PlatformRole.SUPER_ADMIN &&
      authenticatedRole !== PlatformRole.TEACHER
    ) {
      throw new AppError('Access forbidden for your role.', 403, 'ACCESS_FORBIDDEN');
    }

    const currentEnrollment = student.enrollments[0];
    const classId = currentEnrollment?.classId;

    // 3. Concurrently aggregate all academic documents from live PostgreSQL tables
    const [
      virtualIdCard,
      admitCards,
      marksheets,
      feeInvoices,
      certificates,
      studyMaterials,
    ] = await Promise.all([
      // Virtual ID Card
      prisma.virtualIdCard.findFirst({
        where: {
          schoolId,
          studentProfileId,
          status: 'ACTIVE',
        },
        include: {
          template: true,
        },
      }),

      // Examination Admit Cards (published only)
      prisma.admitCard.findMany({
        where: {
          schoolId,
          studentProfileId,
          status: 'PUBLISHED',
        },
        include: {
          academicSession: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Published Marksheets & Report Cards
      prisma.marksheet.findMany({
        where: {
          schoolId,
          studentProfileId,
          status: 'PUBLISHED',
        },
        include: {
          academicSession: true,
          template: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Fee Receipts & Invoices
      prisma.feeInvoice.findMany({
        where: {
          studentProfileId,
        },
        include: {
          payments: true,
          feeStructure: true,
        },
        orderBy: { dueDate: 'desc' },
      }),

      // Issued Institutional Certificates (Bonafide, TC, Character)
      prisma.studentCertificate.findMany({
        where: {
          schoolId,
          studentProfileId,
          status: 'ISSUED',
        },
        include: {
          academicSession: true,
          issuedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { issueDate: 'desc' },
      }),

      // Study Materials & Class Circulars
      prisma.downloadableDocument.findMany({
        where: {
          schoolId,
          isPublished: true,
          publicationStatus: 'PUBLISHED',
          OR: [
            { targetAudience: 'ALL_STUDENTS' },
            ...(classId ? [{ targetAudience: 'CLASS_SPECIFIC', classId }] : []),
          ],
        },
        include: {
          academicSession: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format Fee Receipts from verified payment records
    const feeReceipts = feeInvoices
      .filter((inv) => inv.payments && inv.payments.length > 0)
      .map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: `Fee Payment Receipt — ${(inv.feeStructure as any)?.feeHead || (inv.feeStructure as any)?.name || 'Academic Fee'}`,
        feeName: (inv.feeStructure as any)?.feeHead || (inv.feeStructure as any)?.name || 'Tuition Fee',
        amountPaid: inv.amountPaid,
        totalAmount: inv.amountDue,
        status: inv.status,
        dueDate: inv.dueDate,
        paidAt: inv.payments[0]?.paidAt || inv.dueDate,
        receiptNumber: `REC-${inv.invoiceNumber}`,
        transactionId: (inv.payments[0] as any)?.transactionRef || (inv.payments[0] as any)?.receiptNumber || inv.id,
      }));

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.membership.user.firstName,
        lastName: student.membership.user.lastName,
        fullName: `${student.membership.user.firstName} ${student.membership.user.lastName}`,
        email: student.membership.user.email,
        phone: student.emergencyPhone || student.membership.user.phone,
        className: currentEnrollment?.class?.name || 'Class',
        sectionName: currentEnrollment?.section?.name || 'A',
        academicSessionName: currentEnrollment?.academicSession?.name || 'Session 2026-2027',
      },
      documents: {
        idCard: virtualIdCard,
        admitCards,
        marksheets,
        feeReceipts,
        certificates,
        studyMaterials,
      },
    };
  }

  // ============================================================================
  // 4. INSTITUTIONAL CERTIFICATES (BONAFIDE, TRANSFER CERTIFICATES)
  // ============================================================================

  async issueCertificate(schoolId: string, adminUserId: string, data: IssueCertificateDTO) {
    const [school, student] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId } }),
      prisma.studentProfile.findFirst({
        where: { id: data.studentProfileId, membership: { schoolId } },
        include: {
          membership: { include: { user: true } },
          enrollments: { include: { class: true, section: true } },
        },
      }),
    ]);

    if (!school) throw new AppError('School not found', 404, 'SCHOOL_NOT_FOUND');
    if (!student) throw new AppError('Student not found in this school', 404, 'STUDENT_NOT_FOUND');

    const year = new Date().getFullYear();
    const count = await prisma.studentCertificate.count({ where: { schoolId } });
    const seq = String(count + 1).padStart(4, '0');
    const prefix = data.certificateType === 'BONAFIDE' ? 'BON' : data.certificateType === 'TRANSFER_CERTIFICATE' ? 'TC' : 'CERT';
    const certificateNumber = `${prefix}-${school.code || 'EDX'}-${year}-${seq}`;

    return prisma.studentCertificate.create({
      data: {
        schoolId,
        studentProfileId: data.studentProfileId,
        certificateType: data.certificateType,
        certificateNumber,
        academicSessionId: data.academicSessionId || undefined,
        reason: data.reason || 'General Academic Verification',
        remarks: data.remarks || 'Issued under official school administration seal',
        metadata: data.metadata || {},
        issuedById: adminUserId,
        status: 'ISSUED',
      },
      include: {
        studentProfile: {
          include: {
            membership: { include: { user: true } },
          },
        },
        academicSession: true,
        issuedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async listCertificates(
    schoolId: string,
    filters?: { certificateType?: string; status?: string; query?: string }
  ) {
    const whereClause: any = { schoolId };

    if (filters?.certificateType && filters.certificateType !== 'ALL') {
      whereClause.certificateType = filters.certificateType;
    }

    if (filters?.status && filters.status !== 'ALL') {
      whereClause.status = filters.status;
    }

    return prisma.studentCertificate.findMany({
      where: whereClause,
      include: {
        studentProfile: {
          include: {
            membership: { include: { user: true } },
            enrollments: { include: { class: true, section: true } },
          },
        },
        academicSession: true,
        issuedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async updateCertificateStatus(
    schoolId: string,
    certificateId: string,
    data: UpdateCertificateStatusDTO
  ) {
    const existing = await prisma.studentCertificate.findFirst({
      where: { id: certificateId, schoolId },
    });

    if (!existing) {
      throw new AppError('Certificate not found.', 404, 'CERTIFICATE_NOT_FOUND');
    }

    return prisma.studentCertificate.update({
      where: { id: certificateId },
      data: {
        status: data.status,
        remarks: data.remarks || existing.remarks,
      },
    });
  }

  async verifyCertificatePublic(qrToken: string) {
    const cert = await prisma.studentCertificate.findUnique({
      where: { qrToken },
      include: {
        school: { select: { id: true, name: true, code: true, email: true, phone: true } },
        studentProfile: {
          include: {
            membership: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            enrollments: { include: { class: true, section: true } },
          },
        },
        academicSession: { select: { name: true } },
      },
    });

    if (!cert) {
      throw new AppError('Invalid or expired certificate verification token.', 404, 'CERTIFICATE_INVALID');
    }

    return {
      isValid: cert.status === 'ISSUED',
      certificateNumber: cert.certificateNumber,
      certificateType: cert.certificateType,
      status: cert.status,
      issueDate: cert.issueDate,
      school: cert.school,
      candidate: {
        fullName: `${cert.studentProfile.membership.user.firstName} ${cert.studentProfile.membership.user.lastName}`,
        admissionNumber: cert.studentProfile.admissionNumber,
        className: cert.studentProfile.enrollments[0]?.class?.name || 'Class',
        sectionName: cert.studentProfile.enrollments[0]?.section?.name || 'A',
      },
      academicSession: cert.academicSession?.name || 'Session 2026-2027',
      reason: cert.reason,
    };
  }

  // ============================================================================
  // 5. AUDIT & DOCUMENT ACCESS LOGGING
  // ============================================================================

  async logDocumentAccess(
    schoolId: string,
    userId: string | undefined,
    userRole: string | undefined,
    data: RecordDocumentAccessDTO,
    ipAddress?: string,
    userAgent?: string
  ) {
    return prisma.documentAccessLog.create({
      data: {
        schoolId,
        accessedById: userId || undefined,
        accessorRole: userRole || 'PUBLIC',
        documentType: data.documentType,
        documentId: data.documentId,
        documentTitle: data.documentTitle,
        targetStudentId: data.targetStudentId || undefined,
        action: data.action,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Browser',
      },
    });
  }

  async getAccessLogs(schoolId: string, limit = 50) {
    return prisma.documentAccessLog.findMany({
      where: { schoolId },
      include: {
        accessedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const documentsService = new DocumentsService();
