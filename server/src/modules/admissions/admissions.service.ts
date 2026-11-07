import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ApplicationStatus, Prisma } from '@prisma/client';
import {
  CreateAdmissionEnquiryDTO,
  UpdateAdmissionEnquiryDTO,
  SubmitOnlineApplicationDTO,
  AdmissionReviewDecisionDTO,
  UpdateAdmissionConfigDTO,
} from '@edunexa/shared';
import { coreSchoolService } from '../core/core.service.js';
import { notificationsService } from '../notifications/notifications.service.js';

// Pre-configured standard document requirements for schools
export const DEFAULT_REQUIRED_DOCUMENTS = [
  {
    type: 'BIRTH_CERTIFICATE',
    label: 'Birth Certificate (Municipal / Registrar)',
    isRequired: true,
    description: 'Official birth certificate issued by municipal authority or authorized government registrar.',
  },
  {
    type: 'PREVIOUS_MARKSHEET',
    label: 'Previous Academic Year Marksheet / Report Card',
    isRequired: true,
    description: 'Final academic evaluation report card from the most recently completed grade.',
  },
  {
    type: 'TRANSFER_CERTIFICATE',
    label: 'Transfer Certificate (TC) / School Leaving Certificate',
    isRequired: false,
    description: 'Original counter-signed TC from previous school (can be submitted before orientation).',
  },
  {
    type: 'STUDENT_PHOTO',
    label: 'Recent Passport-Sized Photograph of Student',
    isRequired: true,
    description: 'Clear front-facing formal portrait with white background.',
  },
  {
    type: 'GUARDIAN_ID',
    label: 'Parent / Guardian Government ID (Aadhaar / Passport / Voter ID)',
    isRequired: true,
    description: 'Valid national photo identification of primary parent or legal guardian.',
  },
];

export class AdmissionsService {
  /**
   * Resolve School by domain/host or ID/slug.
   */
  async resolveSchool(identifierOrHost?: string) {
    if (!identifierOrHost) {
      const defaultSchool =
        (await prisma.school.findFirst({ where: { slug: 'apex-academy' } })) ||
        (await prisma.school.findFirst({ where: { status: 'ACTIVE' } })) ||
        (await prisma.school.findFirst());
      return defaultSchool;
    }

    const host = identifierOrHost.split(':')[0].toLowerCase();
    let school = await prisma.school.findFirst({
      where: {
        OR: [
          { websiteUrl: { contains: host, mode: 'insensitive' } },
          { id: identifierOrHost },
          { slug: identifierOrHost.toLowerCase() },
          { code: identifierOrHost.toUpperCase() },
        ],
      },
    });

    if (!school) {
      school =
        (await prisma.school.findFirst({ where: { slug: 'apex-academy' } })) ||
        (await prisma.school.findFirst());
    }

    return school;
  }

  // ==========================================================================
  // PUBLIC ADMISSION APIS
  // ==========================================================================

  /**
   * Get public admission settings, available classes, eligibility, and popup config.
   */
  async getPublicAdmissionConfig(schoolIdentifier?: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) {
      throw new AppError('School tenant not found.', 404, 'NOT_FOUND');
    }

    // Load available classes from DB
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      select: { id: true, name: true, code: true, stage: true },
      orderBy: { name: 'asc' },
    });

    // Load current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId: school.id, isCurrent: true },
    });

    // Load WebsiteContent for admission & popup settings
    const content = await prisma.websiteContent.findUnique({
      where: { schoolId: school.id },
    });

    const requiredDocuments =
      (content?.requiredDocumentsConfig as any[]) || DEFAULT_REQUIRED_DOCUMENTS;

    const c = (content as any) || {};

    return {
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        logoUrl: school.logoUrl,
        email: school.email,
        phone: school.phone,
        address: school.address,
      },
      admissionNoticeOpen: c.admissionNoticeOpen ?? true,
      admissionNoticeTitle: c.admissionNoticeTitle || c.admissionHeading || 'Admissions Open 2026–2027',
      admissionNoticeDesc:
        c.admissionNoticeDesc ||
        c.admissionDescription ||
        'Accepting applications for Pre-Primary through Grade 11. Limited seats available per section to ensure personalized faculty attention.',
      admissionSession: c.admissionSession || currentSession?.name || '2026–2027',
      admissionDates: c.admissionDates || {
        applicationStartDate: '2026-01-15',
        applicationDeadline: '2026-04-30',
        orientationDate: '2026-05-15',
        sessionCommencement: '2026-06-01',
      },
      admissionEligibility: c.admissionEligibility || [
        { grade: 'Grade 1', age: '6 Years as of June 1', prerequisite: 'Kindergarten Completion' },
        { grade: 'Grade 6 (Middle)', age: '11 Years', prerequisite: 'Grade 5 Clearance' },
        { grade: 'Grade 9 (Secondary)', age: '14 Years', prerequisite: 'Grade 8 Clearance' },
        { grade: 'Grade 11 (Senior Sec)', age: '16 Years', prerequisite: 'CBSE Class 10 Board Passed' },
      ],
      admissionProcedure: c.admissionProcedure || [
        { step: 1, title: 'Online Application', desc: 'Submit the verified online application form to receive a persistent tracking reference.' },
        { step: 2, title: 'Document Verification', desc: 'Upload mandatory birth certification, marksheets, and parent ID documents.' },
        { step: 3, title: 'Faculty Interaction', desc: 'Short informal cognitive interaction and campus orientation visit.' },
        { step: 4, title: 'Admission Decision', desc: 'Admissions council review and classroom section allocation.' },
        { step: 5, title: 'Formal Enrollment', desc: 'Generation of permanent admission number and ISO CR80 digital student ID card.' },
      ],
      admissionFormTitle: c.admissionFormTitle || 'Official Admission Application Form 2026-27',
      admissionFormDescription: c.admissionFormDescription || 'Download official PDF application form for offline submission.',
      admissionFormUrl: c.admissionFormUrl || '/documents/admission_form_2026_2027.pdf',
      popup: {
        enabled: c.admissionPopupEnabled ?? true,
        heading: c.admissionPopupHeading || 'Admissions Open 2026–2027',
        description:
          c.admissionPopupDescription ||
          'Schedule a campus visit, enquire about our academic curriculum, or request an admissions counselor callback.',
        frequency: c.admissionPopupFrequency || 'ONCE_PER_SESSION',
      },
      classes: classes.length > 0 ? classes : [
        { id: 'cls-def-8', name: 'Grade 8', code: 'GR-08', stage: 'Middle' },
        { id: 'cls-def-9', name: 'Grade 9', code: 'GR-09', stage: 'Secondary' },
        { id: 'cls-def-10', name: 'Grade 10', code: 'GR-10', stage: 'Secondary' },
        { id: 'cls-def-11s', name: 'Grade 11 - Science', code: 'GR-11-SCI', stage: 'Senior Secondary' },
        { id: 'cls-def-11c', name: 'Grade 11 - Commerce', code: 'GR-11-COM', stage: 'Senior Secondary' },
      ],
      requiredDocuments,
    };
  }

  /**
   * Submit Public Admission Enquiry (e.g. from Website Popup or Enquiry Form).
   */
  async submitAdmissionEnquiry(schoolIdentifier: string, data: CreateAdmissionEnquiryDTO) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) {
      throw new AppError('School tenant not found.', 404, 'NOT_FOUND');
    }

    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();

    // Spam defense: check if exact same enquiry submitted within last 60 seconds
    const recent = await prisma.admissionEnquiry.findFirst({
      where: {
        schoolId: school.id,
        email,
        phone,
        createdAt: { gte: new Date(Date.now() - 60000) },
      },
    });
    if (recent) {
      return {
        id: recent.id,
        enquiryNumber: recent.enquiryNumber,
        status: recent.status,
        message: 'Your enquiry was already received by our admissions committee. Reference: ' + recent.enquiryNumber,
        createdAt: recent.createdAt.toISOString(),
      };
    }

    // Generate unique enquiry reference: ENQ-2026-XXXX
    let enquiryNumber = `ENQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const collision = await prisma.admissionEnquiry.findUnique({ where: { enquiryNumber } });
    if (collision) {
      enquiryNumber = `ENQ-2026-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    }

    const enquiry = await prisma.admissionEnquiry.create({
      data: {
        schoolId: school.id,
        enquiryNumber,
        parentName: data.parentName.trim(),
        studentName: data.studentName.trim(),
        email,
        phone,
        applyingClass: data.applyingClass.trim(),
        message: data.message?.trim() || null,
        status: 'NEW',
        source: data.source || 'WEBSITE_POPUP',
      },
    });

    // Centralized Section 15 Notification Dispatch
    notificationsService.dispatchNotification(school.id, 'ADMISSION_ENQUIRY_RECEIVED', {
      title: `New Admission Enquiry: ${data.studentName}`,
      priority: 'HIGH',
      link: '/admin/admissions',
      variables: {
        studentName: data.studentName,
        parentName: data.parentName,
        className: data.applyingClass,
        admissionNumber: enquiry.enquiryNumber,
        message: `New admission enquiry for ${data.studentName} (${data.applyingClass}) received from ${data.parentName}.`,
      },
    }).catch(() => {});

    return {
      id: enquiry.id,
      enquiryNumber: enquiry.enquiryNumber,
      parentName: enquiry.parentName,
      studentName: enquiry.studentName,
      status: enquiry.status,
      message: 'Admission enquiry submitted successfully. Our counseling bureau will contact you shortly.',
      createdAt: enquiry.createdAt.toISOString(),
    };
  }

  /**
   * Submit Online Admission Application (Full multi-step form).
   */
  async submitOnlineApplication(schoolIdentifier: string, data: SubmitOnlineApplicationDTO) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) {
      throw new AppError('School tenant not found.', 404, 'NOT_FOUND');
    }

    const studentFirstName = data.studentFirstName.trim();
    const studentLastName = data.studentLastName.trim();
    const guardianEmail = data.guardianEmail.trim().toLowerCase();
    const guardianPhone = data.guardianPhone.trim();
    const applyingClass = data.applyingClass.trim();

    // Generate unique persistent application number: APP-2026-XXXX
    let applicationNumber = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const collision = await prisma.admissionApplication.findUnique({ where: { applicationNumber } });
    if (collision) {
      applicationNumber = `APP-2026-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    }

    const app = await prisma.admissionApplication.create({
      data: {
        schoolId: school.id,
        applicationNumber,
        studentFirstName,
        studentLastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        bloodGroup: data.bloodGroup || null,
        studentEmail: data.studentEmail ? data.studentEmail.trim().toLowerCase() : null,
        residentialAddress: data.residentialAddress.trim(),
        guardianName: data.guardianName.trim(),
        guardianRelationship: data.guardianRelationship.trim(),
        guardianEmail,
        guardianPhone,
        applyingClass,
        academicSession: data.academicSession || '2026-2027',
        previousSchool: data.previousSchool?.trim() || null,
        previousMarksPercentage: data.previousMarksPercentage ? Number(data.previousMarksPercentage) : null,
        documents: data.documents || [],
        status: ApplicationStatus.SUBMITTED,
      },
    });

    return {
      id: app.id,
      applicationNumber: app.applicationNumber,
      studentName: `${app.studentFirstName} ${app.studentLastName}`.trim(),
      applyingClass: app.applyingClass,
      academicSession: app.academicSession,
      status: app.status,
      submissionDate: app.createdAt.toISOString(),
      instructions:
        'Please save your application reference number. You can track your admission status at any time using this reference and your registered contact details.',
    };
  }

  /**
   * Track Application Status securely without exposing private PII.
   */
  async trackApplicationStatus(
    schoolIdentifier: string,
    applicationNumber: string,
    verificationContact: string
  ) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) {
      throw new AppError('School tenant not found.', 404, 'NOT_FOUND');
    }

    const cleanAppNum = applicationNumber.trim().toUpperCase();
    const cleanContact = verificationContact.trim().toLowerCase();

    const app = await prisma.admissionApplication.findFirst({
      where: {
        schoolId: school.id,
        applicationNumber: cleanAppNum,
      },
    });

    if (!app) {
      throw new AppError('No admission application found matching the provided reference number.', 404, 'NOT_FOUND');
    }

    // Security check: verify contact email or phone matches registered guardian credentials
    const emailMatch = app.guardianEmail.toLowerCase() === cleanContact;
    const phoneClean = app.guardianPhone.replace(/[^0-9]/g, '');
    const contactPhoneClean = cleanContact.replace(/[^0-9]/g, '');
    const phoneMatch = contactPhoneClean.length >= 6 && phoneClean.includes(contactPhoneClean);

    if (!emailMatch && !phoneMatch) {
      throw new AppError(
        'The verification email or phone number does not match the records for this application.',
        401,
        'VERIFICATION_FAILED'
      );
    }

    // Safe, non-PII status payload
    return {
      applicationNumber: app.applicationNumber,
      studentName: `${app.studentFirstName} ${app.studentLastName}`,
      studentInitials: `${app.studentFirstName.charAt(0)}. ${app.studentLastName}`,
      applyingClass: app.applyingClass,
      academicSession: app.academicSession || '2026-2027',
      status: app.status,
      submissionDate: app.createdAt.toISOString().split('T')[0],
      lastUpdated: app.updatedAt.toISOString().split('T')[0],
      missingDocuments: (app.missingDocuments as any[]) || [],
      documentsSubmittedCount: Array.isArray(app.documents) ? (app.documents as any[]).length : 0,
      instructions:
        app.status === 'DOCUMENTS_REQUIRED'
          ? 'Additional verification documents are required. Please review the missing documents list.'
          : app.status === 'APPROVED'
          ? 'Congratulations! Your application has been approved. Please report to the school office for enrollment finalization.'
          : app.status === 'REJECTED'
          ? 'We regret to inform you that we are unable to offer admission for this academic cycle.'
          : 'Your application is actively undergoing review by the admissions committee.',
    };
  }

  // ==========================================================================
  // SCHOOL ADMIN ADMISSION DASHBOARD & MANAGEMENT APIS
  // ==========================================================================

  /**
   * Get database-derived admission statistics.
   */
  async getAdminAdmissionStats(schoolId: string) {
    const [
      totalApplications,
      submittedApps,
      underReviewApps,
      documentsRequiredApps,
      approvedApps,
      rejectedApps,
      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
    ] = await Promise.all([
      prisma.admissionApplication.count({ where: { schoolId } }),
      prisma.admissionApplication.count({ where: { schoolId, status: 'SUBMITTED' } }),
      prisma.admissionApplication.count({ where: { schoolId, status: 'UNDER_REVIEW' } }),
      prisma.admissionApplication.count({ where: { schoolId, status: 'DOCUMENTS_REQUIRED' } }),
      prisma.admissionApplication.count({ where: { schoolId, status: 'APPROVED' } }),
      prisma.admissionApplication.count({ where: { schoolId, status: 'REJECTED' } }),
      prisma.admissionEnquiry.count({ where: { schoolId } }),
      prisma.admissionEnquiry.count({ where: { schoolId, status: 'NEW' } }),
      prisma.admissionEnquiry.count({ where: { schoolId, status: 'CONTACTED' } }),
    ]);

    return {
      applications: {
        total: totalApplications,
        submitted: submittedApps,
        underReview: underReviewApps,
        documentsRequired: documentsRequiredApps,
        approved: approvedApps,
        rejected: rejectedApps,
        enrolled: approvedApps, // All approved applications are enrolled into the SIS
      },
      enquiries: {
        total: totalEnquiries,
        new: newEnquiries,
        contacted: contactedEnquiries,
      },
    };
  }

  /**
   * List Enquiries with search and status filtering.
   */
  async listAdminEnquiries(
    schoolId: string,
    query: { status?: string; search?: string; page?: number; limit?: number } = {}
  ) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { enquiryNumber: { contains: q, mode: 'insensitive' } },
        { parentName: { contains: q, mode: 'insensitive' } },
        { studentName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.admissionEnquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.admissionEnquiry.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update Enquiry status and internal notes.
   */
  async updateAdminEnquiry(schoolId: string, id: string, data: UpdateAdmissionEnquiryDTO) {
    const enquiry = await prisma.admissionEnquiry.findFirst({
      where: { id, schoolId },
    });
    if (!enquiry) {
      throw new AppError('Admission enquiry not found.', 404, 'NOT_FOUND');
    }

    return prisma.admissionEnquiry.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status as any } : {}),
        ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      },
    });
  }

  /**
   * Delete Enquiry.
   */
  async deleteAdminEnquiry(schoolId: string, id: string) {
    const enquiry = await prisma.admissionEnquiry.findFirst({
      where: { id, schoolId },
    });
    if (!enquiry) {
      throw new AppError('Admission enquiry not found.', 404, 'NOT_FOUND');
    }

    await prisma.admissionEnquiry.delete({ where: { id } });
    return { success: true, message: 'Enquiry record deleted successfully.' };
  }

  /**
   * List Admission Applications with filtering, pagination, and search.
   */
  async listAdminApplications(
    schoolId: string,
    query: { status?: string; search?: string; page?: number; limit?: number } = {}
  ) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (status && status !== 'ALL') {
      where.status = status as ApplicationStatus;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { applicationNumber: { contains: q, mode: 'insensitive' } },
        { studentFirstName: { contains: q, mode: 'insensitive' } },
        { studentLastName: { contains: q, mode: 'insensitive' } },
        { guardianName: { contains: q, mode: 'insensitive' } },
        { guardianEmail: { contains: q, mode: 'insensitive' } },
        { guardianPhone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.admissionApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.admissionApplication.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single application details with document records.
   */
  async getAdminApplicationById(schoolId: string, id: string) {
    const app = await prisma.admissionApplication.findFirst({
      where: {
        schoolId,
        OR: [{ id }, { applicationNumber: id }],
      },
    });

    if (!app) {
      throw new AppError('Admission application not found.', 404, 'NOT_FOUND');
    }

    let enrolledStudent = null;
    if (app.enrolledStudentProfileId) {
      enrolledStudent = await prisma.studentProfile.findUnique({
        where: { id: app.enrolledStudentProfileId },
        include: {
          membership: { include: { user: true } },
          enrollments: { include: { class: true, section: true } },
        },
      });
    }

    return {
      ...app,
      enrolledStudent,
    };
  }

  /**
   * Review Admission Application: Approve, Reject, Under Review, Documents Required.
   * If APPROVED, creates Student & Parent records safely in PostgreSQL.
   */
  async reviewApplication(
    schoolId: string,
    id: string,
    review: AdmissionReviewDecisionDTO,
    reviewerUserId?: string
  ) {
    const app = await prisma.admissionApplication.findFirst({
      where: {
        schoolId,
        OR: [{ id }, { applicationNumber: id }],
      },
    });

    if (!app) {
      throw new AppError('Admission application not found.', 404, 'NOT_FOUND');
    }

    if (app.status === 'APPROVED' && review.decision === 'APPROVED') {
      throw new AppError(
        `Application '${app.applicationNumber}' is already approved and enrolled. Duplicate student creation is prevented.`,
        400,
        'ALREADY_APPROVED'
      );
    }

    let enrolledStudentResult: any = null;
    let enrolledStudentProfileId: string | null = app.enrolledStudentProfileId;

    // If APPROVED, provision student through existing coreService
    if (review.decision === 'APPROVED') {
      const admissionNum = `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const rand = Math.floor(1000 + Math.random() * 9000);
      const studentEmail =
        app.studentEmail ||
        `${app.studentFirstName.toLowerCase()}.${app.studentLastName.toLowerCase()}.${rand}@student.apex.edu`;

      // Find passport photo if attached in application documents
      const passportDoc = (app.documents as any[])?.find(
        (d: any) => d.type === 'STUDENT_PHOTO' || d.type === 'PASSPORT_PHOTO' || d.type === 'PHOTO'
      );
      const photoUrl = passportDoc?.fileUrl || undefined;

      enrolledStudentResult = await coreSchoolService.createStudent(schoolId, {
        firstName: app.studentFirstName,
        lastName: app.studentLastName,
        email: studentEmail,
        admissionNumber: admissionNum,
        photoUrl,
        dateOfBirth: app.dateOfBirth.toISOString().split('T')[0],
        gender: app.gender as any,
        bloodGroup: app.bloodGroup || undefined,
        address: app.residentialAddress || 'Campus Resident Address',
        emergencyPhone: app.guardianPhone,
        className: review.assignedClass || app.applyingClass,
        sectionName: review.assignedSection || 'A',
        guardianName: app.guardianName,
        guardianRelationship: app.guardianRelationship || 'Parent',
        guardianEmail: app.guardianEmail,
        guardianPhone: app.guardianPhone,
        sendInvitation: true,
        isAssistedActivation: false,
      });

      enrolledStudentProfileId =
        enrolledStudentResult?.student?.id || enrolledStudentResult?.studentProfile?.id || null;
    }

    const updatedApp = await prisma.admissionApplication.update({
      where: { id: app.id },
      data: {
        status: review.decision as ApplicationStatus,
        reviewNotes: review.reviewNotes || null,
        reviewedByUserId: reviewerUserId || null,
        missingDocuments: (review.missingDocuments as any) ?? Prisma.JsonNull,
        enrolledStudentProfileId,
      },
    });

    // Centralized Section 15 Notification Dispatch
    notificationsService.dispatchNotification(schoolId, 'ADMISSION_STATUS_UPDATED', {
      title: `Admission Application ${updatedApp.applicationNumber}: ${updatedApp.status}`,
      priority: 'HIGH',
      recipientEmails: [app.guardianEmail],
      recipientPhones: [app.guardianPhone],
      variables: {
        studentName: `${app.studentFirstName} ${app.studentLastName}`,
        parentName: app.guardianName,
        className: app.applyingClass,
        admissionNumber: updatedApp.applicationNumber,
        applicationStatus: updatedApp.status,
        message: `The admission application for ${app.studentFirstName} ${app.studentLastName} has been updated to ${updatedApp.status}.`,
      },
    }).catch(() => {});

    return {
      application: updatedApp,
      enrolledStudent: enrolledStudentResult,
    };
  }

  /**
   * Update Admission Configuration (popup settings, required documents, admission deadlines).
   */
  async updateAdmissionConfig(schoolId: string, data: UpdateAdmissionConfigDTO) {
    const updateData: any = {};
    if (data.admissionNoticeOpen !== undefined) updateData.admissionNoticeOpen = data.admissionNoticeOpen;
    if (data.admissionNoticeTitle !== undefined) {
      updateData.admissionNoticeTitle = data.admissionNoticeTitle;
      updateData.admissionHeading = data.admissionNoticeTitle;
    }
    if (data.admissionNoticeDesc !== undefined) {
      updateData.admissionNoticeDesc = data.admissionNoticeDesc;
      updateData.admissionDescription = data.admissionNoticeDesc;
    }
    if (data.admissionSession !== undefined) updateData.admissionSession = data.admissionSession;
    if (data.admissionDates !== undefined) updateData.admissionDates = data.admissionDates;
    if (data.admissionEligibility !== undefined) updateData.admissionEligibility = data.admissionEligibility;
    if (data.admissionProcedure !== undefined) updateData.admissionProcedure = data.admissionProcedure;
    if (data.admissionFormTitle !== undefined) updateData.admissionFormTitle = data.admissionFormTitle;
    if (data.admissionFormDescription !== undefined) updateData.admissionFormDescription = data.admissionFormDescription;
    if (data.admissionFormUrl !== undefined) updateData.admissionFormUrl = data.admissionFormUrl;
    if (data.admissionPopupEnabled !== undefined) updateData.admissionPopupEnabled = data.admissionPopupEnabled;
    if (data.admissionPopupHeading !== undefined) updateData.admissionPopupHeading = data.admissionPopupHeading;
    if (data.admissionPopupDescription !== undefined) updateData.admissionPopupDescription = data.admissionPopupDescription;
    if (data.admissionPopupFrequency !== undefined) updateData.admissionPopupFrequency = data.admissionPopupFrequency;
    if (data.requiredDocumentsConfig !== undefined) updateData.requiredDocumentsConfig = data.requiredDocumentsConfig;

    return prisma.websiteContent.upsert({
      where: { schoolId },
      update: updateData,
      create: {
        schoolId,
        ...updateData,
      },
    });
  }
}

export const admissionsService = new AdmissionsService();
