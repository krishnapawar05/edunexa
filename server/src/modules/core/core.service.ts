import { randomUUID } from 'crypto';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateStudentDTO,
  CreateStaffDTO,
  TeacherAssignmentDTO,
  AdmissionReviewDTO,
  PublicIdCardVerificationResponse,
  CardStatus,
  ApplicationStatus,
} from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

// Realistic synthetic data store for offline testing and fast verification
export interface SyntheticStudent {
  id: string;
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergencyPhone: string;
  className: string;
  sectionName: string;
  rollNumber: number;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'INACTIVE';
  guardians: Array<{
    name: string;
    relationship: string;
    email: string;
    phone: string;
  }>;
  createdAt: string;
}

export interface SyntheticStaff {
  id: string;
  schoolId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string;
  designation: string;
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'RESIGNED';
  phone: string;
  assignments: Array<{
    className: string;
    sectionName: string;
    subjectCode: string;
    isLeadTeacher: boolean;
  }>;
  createdAt: string;
}

export interface SyntheticIdCard {
  id: string;
  schoolId: string;
  holderType: 'STUDENT' | 'STAFF';
  profileId: string;
  cardNumber: string;
  verificationToken: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOST';
  issuedAt: string;
  expiresAt: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
}

export interface SyntheticAdmission {
  id: string;
  schoolId: string;
  applicationNumber: string;
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: string;
  applyingClass: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
}

// In-Memory Seed Store
const MOCK_STUDENTS: SyntheticStudent[] = [
  {
    id: 'stu-aarav-01',
    schoolId: 'sch-apex-01',
    admissionNumber: 'ADM-2026-0042',
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav.sharma@student.apex.edu',
    gender: 'Male',
    dateOfBirth: '2010-04-12',
    bloodGroup: 'O+',
    address: 'Sector 14, Institutional Area, New Delhi',
    emergencyPhone: '+91 (11) 2840-9199',
    className: 'Grade 10',
    sectionName: 'A',
    rollNumber: 1,
    status: 'ACTIVE',
    guardians: [
      {
        name: 'Sunil Sharma',
        relationship: 'Father',
        email: 'sunil.sharma@parent.apex.edu',
        phone: '+91 98100 23456',
      },
    ],
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'stu-ananya-02',
    schoolId: 'sch-apex-01',
    admissionNumber: 'ADM-2026-0089',
    firstName: 'Ananya',
    lastName: 'Deshmukh',
    email: 'ananya.d@student.apex.edu',
    gender: 'Female',
    dateOfBirth: '2010-09-21',
    bloodGroup: 'B+',
    address: 'Vasant Vihar, New Delhi',
    emergencyPhone: '+91 98200 45678',
    className: 'Grade 10',
    sectionName: 'A',
    rollNumber: 2,
    status: 'ACTIVE',
    guardians: [
      {
        name: 'Priya Deshmukh',
        relationship: 'Mother',
        email: 'priya.d@parent.apex.edu',
        phone: '+91 98200 45678',
      },
    ],
    createdAt: '2026-01-12T11:00:00.000Z',
  },
  {
    id: 'stu-rohan-other',
    schoolId: 'sch-greenwood-02',
    admissionNumber: 'ADM-2026-0104',
    firstName: 'Rohan',
    lastName: 'Patel',
    email: 'rohan.p@greenwood.edu',
    gender: 'Male',
    dateOfBirth: '2011-02-14',
    bloodGroup: 'A+',
    address: 'MG Road, Bangalore',
    emergencyPhone: '+91 99000 11223',
    className: 'Grade 9',
    sectionName: 'B',
    rollNumber: 14,
    status: 'ACTIVE',
    guardians: [
      {
        name: 'Ketan Patel',
        relationship: 'Father',
        email: 'ketan.p@parent.greenwood.edu',
        phone: '+91 99000 11223',
      },
    ],
    createdAt: '2026-01-15T09:00:00.000Z',
  },
];

const MOCK_STAFF: SyntheticStaff[] = [
  {
    id: 'staff-thorne-01',
    schoolId: 'sch-apex-01',
    employeeId: 'EMP-2026-0012',
    firstName: 'Julian',
    lastName: 'Thorne',
    email: 'dr.thorne@apexacademy.edu',
    departmentName: 'Science & Physics',
    designation: 'Senior Faculty & Dept Head',
    joiningDate: '2021-06-01',
    employmentStatus: 'ACTIVE',
    phone: '+91 (11) 2840-9112',
    assignments: [
      {
        className: 'Grade 10',
        sectionName: 'A',
        subjectCode: 'PHY-10',
        isLeadTeacher: true,
      },
    ],
    createdAt: '2021-06-01T09:00:00.000Z',
  },
  {
    id: 'staff-vance-02',
    schoolId: 'sch-apex-01',
    employeeId: 'EMP-2026-0015',
    firstName: 'Rebecca',
    lastName: 'Vance',
    email: 'r.vance@apexacademy.edu',
    departmentName: 'Mathematics',
    designation: 'Secondary Mathematics Lead',
    joiningDate: '2022-08-15',
    employmentStatus: 'ACTIVE',
    phone: '+91 (11) 2840-9115',
    assignments: [
      {
        className: 'Grade 10',
        sectionName: 'A',
        subjectCode: 'MATH-10',
        isLeadTeacher: true,
      },
    ],
    createdAt: '2022-08-15T09:00:00.000Z',
  },
];

const MOCK_ID_CARDS: SyntheticIdCard[] = [
  {
    id: 'card-aarav-01',
    schoolId: 'sch-apex-01',
    holderType: 'STUDENT',
    profileId: 'stu-aarav-01',
    cardNumber: 'CR80-2026-0042',
    verificationToken: 'v-tok-8f2c-49a1-9b7e-e214',
    status: 'ACTIVE',
    issuedAt: '2026-02-01T10:00:00.000Z',
    expiresAt: '2027-03-31T23:59:59.000Z',
  },
  {
    id: 'card-thorne-01',
    schoolId: 'sch-apex-01',
    holderType: 'STAFF',
    profileId: 'staff-thorne-01',
    cardNumber: 'CR80-2026-0012',
    verificationToken: 'v-tok-7a1b-3c4d-5e6f-9912',
    status: 'ACTIVE',
    issuedAt: '2026-01-15T10:00:00.000Z',
    expiresAt: '2028-06-30T23:59:59.000Z',
  },
];

const MOCK_ADMISSIONS: SyntheticAdmission[] = [
  {
    id: 'adm-app-01',
    schoolId: 'sch-apex-01',
    applicationNumber: 'APP-2026-0091',
    studentFirstName: 'Meera',
    studentLastName: 'Nambiar',
    dateOfBirth: '2011-05-18',
    gender: 'Female',
    applyingClass: 'Grade 9',
    guardianName: 'Ramesh Nambiar',
    guardianEmail: 'r.nambiar@example.com',
    guardianPhone: '+91 98450 12345',
    status: 'SUBMITTED',
    createdAt: '2026-10-15T08:30:00.000Z',
  },
];

export class CoreSchoolService {
  /**
   * Academic Structure: Sessions, Departments, Classes, Sections, Subjects
   */
  async getAcademicStructure(schoolId: string) {
    return {
      sessions: [
        { id: 'sess-2026', name: '2026–2027', isCurrent: true, startDate: '2026-04-01', endDate: '2027-03-31' },
      ],
      departments: [
        { id: 'dept-sci', name: 'Science & Physics', description: 'Physics, Chemistry, Biology' },
        { id: 'dept-math', name: 'Mathematics', description: 'Pure & Applied Mathematics' },
        { id: 'dept-hum', name: 'Humanities & Social Sciences', description: 'History, Civics, Geography' },
        { id: 'dept-cs', name: 'Computer Science & AI', description: 'ICT, Python, Machine Learning' },
      ],
      classes: [
        {
          id: 'cls-10',
          name: 'Grade 10',
          code: 'G10',
          sections: [
            { id: 'sec-10a', name: 'A', capacity: 35 },
            { id: 'sec-10b', name: 'B', capacity: 35 },
          ],
          subjects: [
            { id: 'sub-phy10', code: 'PHY-10', name: 'Physics' },
            { id: 'sub-mat10', code: 'MATH-10', name: 'Mathematics' },
            { id: 'sub-chem10', code: 'CHEM-10', name: 'Chemistry' },
            { id: 'sub-eng10', code: 'ENG-10', name: 'English Literature' },
          ],
        },
        {
          id: 'cls-9',
          name: 'Grade 9',
          code: 'G9',
          sections: [
            { id: 'sec-9a', name: 'A', capacity: 35 },
            { id: 'sec-9b', name: 'B', capacity: 35 },
          ],
          subjects: [
            { id: 'sub-sci9', code: 'SCI-09', name: 'General Science' },
            { id: 'sub-mat9', code: 'MATH-09', name: 'Mathematics' },
          ],
        },
      ],
    };
  }

  /**
   * List Students with Search, Grade Filter & Pagination (Scoped by Tenant)
   */
  async listStudents(
    schoolId: string,
    params: { query?: string; className?: string; page?: number; limit?: number }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const q = (params.query || '').toLowerCase().trim();

    // Filter strictly by schoolId
    let filtered = MOCK_STUDENTS.filter((s) => s.schoolId === schoolId);

    if (params.className && params.className !== 'ALL') {
      filtered = filtered.filter((s) => s.className.toLowerCase() === params.className!.toLowerCase());
    }

    if (q) {
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create Student & Enroll with Unique Admission Number Enforcement
   */
  async createStudent(schoolId: string, data: CreateStudentDTO) {
    // 1. Prevent duplicate admission number within the school tenant scope
    const existingAdmission = MOCK_STUDENTS.find(
      (s) => s.schoolId === schoolId && s.admissionNumber.toLowerCase() === data.admissionNumber.toLowerCase()
    );

    if (existingAdmission) {
      throw new AppError(
        `Admission number '${data.admissionNumber}' is already registered in this school. Duplicate admission numbers are strictly forbidden.`,
        409,
        'DUPLICATE_ADMISSION_NUMBER'
      );
    }

    const studentId = `stu-${randomUUID().slice(0, 8)}`;
    const newStudent: SyntheticStudent = {
      id: studentId,
      schoolId,
      admissionNumber: data.admissionNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      bloodGroup: data.bloodGroup || 'O+',
      address: data.address,
      emergencyPhone: data.emergencyPhone,
      className: data.className,
      sectionName: data.sectionName,
      rollNumber: data.rollNumber || MOCK_STUDENTS.filter((s) => s.schoolId === schoolId).length + 1,
      status: 'ACTIVE',
      guardians: [
        {
          name: data.guardianName,
          relationship: data.guardianRelationship,
          email: data.guardianEmail,
          phone: data.guardianPhone,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    MOCK_STUDENTS.unshift(newStudent);
    return newStudent;
  }

  /**
   * Get Student Profile & Guardian Dossier
   */
  async getStudentById(schoolId: string, studentId: string) {
    const student = MOCK_STUDENTS.find((s) => s.id === studentId && s.schoolId === schoolId);
    if (!student) {
      throw new AppError(`Student record '${studentId}' not found in this school.`, 404, 'RECORD_NOT_FOUND');
    }

    // Attach card details if issued
    const idCard = MOCK_ID_CARDS.find((c) => c.profileId === studentId && c.schoolId === schoolId);

    return {
      ...student,
      idCard: idCard || null,
    };
  }

  /**
   * List Staff & Faculty (Scoped by Tenant)
   */
  async listStaff(schoolId: string, params: { department?: string; query?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const q = (params.query || '').toLowerCase().trim();

    let filtered = MOCK_STAFF.filter((s) => s.schoolId === schoolId);

    if (params.department && params.department !== 'ALL') {
      filtered = filtered.filter((s) => s.departmentName.toLowerCase().includes(params.department!.toLowerCase()));
    }

    if (q) {
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.employeeId.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create Staff Profile with Unique Employee ID Enforcement
   */
  async createStaff(schoolId: string, data: CreateStaffDTO) {
    // 1. Prevent duplicate employeeId in school scope
    const existingEmp = MOCK_STAFF.find(
      (s) => s.schoolId === schoolId && s.employeeId.toLowerCase() === data.employeeId.toLowerCase()
    );

    if (existingEmp) {
      throw new AppError(
        `Employee ID '${data.employeeId}' is already registered in this school. Duplicate employee IDs are strictly forbidden.`,
        409,
        'DUPLICATE_EMPLOYEE_ID'
      );
    }

    const staffId = `staff-${randomUUID().slice(0, 8)}`;
    const newStaff: SyntheticStaff = {
      id: staffId,
      schoolId,
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      departmentName: data.departmentName,
      designation: data.designation,
      joiningDate: data.joiningDate,
      employmentStatus: data.employmentStatus as any,
      phone: data.phone,
      assignments: [],
      createdAt: new Date().toISOString(),
    };

    MOCK_STAFF.unshift(newStaff);
    return newStaff;
  }

  /**
   * Assign Teacher to Class and Subject
   */
  async assignTeacher(schoolId: string, data: TeacherAssignmentDTO) {
    const staff = MOCK_STAFF.find((s) => s.id === data.staffProfileId && s.schoolId === schoolId);
    if (!staff) {
      throw new AppError(`Staff member '${data.staffProfileId}' not found in this school.`, 404, 'RECORD_NOT_FOUND');
    }

    const newAssignment = {
      className: data.className,
      sectionName: data.sectionName,
      subjectCode: data.subjectCode,
      isLeadTeacher: data.isLeadTeacher,
    };

    // Remove prior identical assignment if present
    staff.assignments = staff.assignments.filter(
      (a) => !(a.className === data.className && a.sectionName === data.sectionName && a.subjectCode === data.subjectCode)
    );
    staff.assignments.push(newAssignment);

    return {
      staffProfileId: staff.id,
      assignments: staff.assignments,
    };
  }

  /**
   * Virtual ID Card Generation with Cryptographic Revocable Verification Token
   */
  async generateIdCard(schoolId: string, holderType: 'STUDENT' | 'STAFF', profileId: string) {
    let holderName = '';
    let identifierNumber = '';

    if (holderType === 'STUDENT') {
      const student = MOCK_STUDENTS.find((s) => s.id === profileId && s.schoolId === schoolId);
      if (!student) {
        throw new AppError(`Student profile '${profileId}' not found. Cannot issue ID card.`, 404, 'RECORD_NOT_FOUND');
      }
      holderName = `${student.firstName} ${student.lastName}`;
      identifierNumber = student.admissionNumber;
    } else {
      const staff = MOCK_STAFF.find((s) => s.id === profileId && s.schoolId === schoolId);
      if (!staff) {
        throw new AppError(`Staff profile '${profileId}' not found. Cannot issue ID card.`, 404, 'RECORD_NOT_FOUND');
      }
      holderName = `${staff.firstName} ${staff.lastName}`;
      identifierNumber = staff.employeeId;
    }

    // Revoke previous active card if reissuing
    const priorCard = MOCK_ID_CARDS.find((c) => c.profileId === profileId && c.schoolId === schoolId && c.status === 'ACTIVE');
    if (priorCard) {
      priorCard.status = 'REVOKED';
      priorCard.revokedAt = new Date().toISOString();
      priorCard.revocationReason = 'Reissued with updated credentials';
    }

    const verificationToken = `v-tok-${randomUUID()}`;
    const cardNumber = `CR80-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCard: SyntheticIdCard = {
      id: `card-${randomUUID().slice(0, 8)}`,
      schoolId,
      holderType,
      profileId,
      cardNumber,
      verificationToken,
      status: 'ACTIVE',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    MOCK_ID_CARDS.unshift(newCard);

    return {
      ...newCard,
      holderName,
      identifierNumber,
    };
  }

  /**
   * Deactivate / Revoke Virtual ID Card
   */
  async deactivateIdCard(schoolId: string, cardId: string, reason: string) {
    const card = MOCK_ID_CARDS.find((c) => c.id === cardId && c.schoolId === schoolId);
    if (!card) {
      throw new AppError(`Virtual ID card '${cardId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    card.status = 'REVOKED';
    card.revokedAt = new Date().toISOString();
    card.revocationReason = reason;

    return card;
  }

  /**
   * Public QR Verification Endpoint (PRD Requirement: Zero sensitive PII)
   */
  async verifyIdCardPublic(verificationToken: string): Promise<PublicIdCardVerificationResponse> {
    const card = MOCK_ID_CARDS.find((c) => c.verificationToken === verificationToken);
    if (!card) {
      throw new AppError('Verification token is invalid or does not exist.', 404, 'INVALID_VERIFICATION_TOKEN');
    }

    let holderName = 'Anonymous Member';
    let identifierNumber = 'ID-XXXX';

    if (card.holderType === 'STUDENT') {
      const student = MOCK_STUDENTS.find((s) => s.id === card.profileId);
      if (student) {
        holderName = `${student.firstName} ${student.lastName}`;
        identifierNumber = student.admissionNumber;
      }
    } else {
      const staff = MOCK_STAFF.find((s) => s.id === card.profileId);
      if (staff) {
        holderName = `${staff.firstName} ${staff.lastName}`;
        identifierNumber = staff.employeeId;
      }
    }

    return {
      isValid: card.status === 'ACTIVE',
      status: card.status as any,
      holderType: card.holderType,
      holderName,
      identifierNumber,
      schoolName: 'Apex Academy of Sciences & Arts',
      schoolCode: 'APX-01',
      academicSession: '2026–2027',
      issuedAt: card.issuedAt,
      expiresAt: card.expiresAt,
      revokedAt: card.revokedAt,
      revocationReason: card.revocationReason,
    };
  }

  /**
   * List Admissions Applications
   */
  async listAdmissions(schoolId: string, status?: string) {
    let filtered = MOCK_ADMISSIONS.filter((a) => a.schoolId === schoolId);
    if (status && status !== 'ALL') {
      filtered = filtered.filter((a) => a.status === status);
    }
    return filtered;
  }

  /**
   * Review Admission Application (Approve / Reject)
   */
  async reviewAdmission(schoolId: string, applicationId: string, review: AdmissionReviewDTO) {
    const app = MOCK_ADMISSIONS.find((a) => a.id === applicationId && a.schoolId === schoolId);
    if (!app) {
      throw new AppError(`Admission application '${applicationId}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    app.status = review.decision as any;
    app.reviewNotes = review.reviewNotes;

    // If approved, automatically enroll student into the SIS directory
    let enrolledStudent: SyntheticStudent | null = null;
    if (review.decision === 'APPROVED') {
      const admissionNum = `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      enrolledStudent = await this.createStudent(schoolId, {
        firstName: app.studentFirstName,
        lastName: app.studentLastName,
        email: `${app.studentFirstName.toLowerCase()}.${app.studentLastName.toLowerCase()}@student.apex.edu`,
        admissionNumber: admissionNum,
        dateOfBirth: app.dateOfBirth,
        gender: app.gender as any,
        address: 'Residential Campus Address',
        emergencyPhone: app.guardianPhone,
        className: review.assignedClass || app.applyingClass,
        sectionName: review.assignedSection || 'A',
        guardianName: app.guardianName,
        guardianRelationship: 'Parent',
        guardianEmail: app.guardianEmail,
        guardianPhone: app.guardianPhone,
      });
    }

    return {
      application: app,
      enrolledStudent,
    };
  }
}

export const coreSchoolService = new CoreSchoolService();
