import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('STAGE 4: Core School Management Test Suite', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'krishna.pawar' } },
    });
    await prisma.admissionApplication.updateMany({
      where: {
        OR: [{ id: 'adm-app-01' }, { applicationNumber: 'APP-2026-0091' }],
      },
      data: {
        status: 'SUBMITTED',
        reviewNotes: null,
      },
    });
  });

  const schoolAdminTokenSchoolA = generateAccessToken({
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  const teacherTokenSchoolA = generateAccessToken({
    userId: 'usr-teacher-01',
    email: 'dr.thorne@apexacademy.edu',
    schoolId: 'sch-apex-01',
    staffProfileId: 'staff-thorne-01',
    role: PlatformRole.TEACHER,
  });

  const studentTokenA = generateAccessToken({
    userId: 'usr-student-01',
    email: 'aarav.sharma@student.apex.edu',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    role: PlatformRole.STUDENT,
  });

  let generatedCardToken: string;
  let generatedCardId: string;

  // --------------------------------------------------------------------------
  // 1. Academic Structure & Class/Section Setup
  // --------------------------------------------------------------------------
  it('1. School Admin can retrieve academic sessions, departments, classes & sections', async () => {
    const res = await request(app)
      .get('/api/v1/core/academic/structure')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('sessions');
    expect(res.body.data).toHaveProperty('departments');
    expect(res.body.data).toHaveProperty('classes');
    expect(res.body.data.classes.length).toBeGreaterThanOrEqual(1);
  });

  // --------------------------------------------------------------------------
  // 2. Student Directory & SIS Listing (Tenant Scoped)
  // --------------------------------------------------------------------------
  it('2. School Admin can list students with search, grade filter & pagination', async () => {
    const res = await request(app)
      .get('/api/v1/core/students?className=Grade 10&page=1&limit=5')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('totalPages');
    expect(res.body.data[0].schoolId).toBe('sch-apex-01');
  });

  // --------------------------------------------------------------------------
  // 3. Student Creation & Unique Admission Number Enforcement
  // --------------------------------------------------------------------------
  it('3a. School Admin can enroll a new student with valid admission number format', async () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 899999);
    const newAdmissionNumber = `ADM-2026-${randomSuffix}`;

    const res = await request(app)
      .post('/api/v1/core/students')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        firstName: 'Siddharth',
        lastName: 'Rao',
        email: `siddharth.rao.${randomSuffix}@student.apex.edu`,
        admissionNumber: newAdmissionNumber,
        dateOfBirth: '2010-08-14',
        gender: 'Male',
        bloodGroup: 'O+',
        address: '42 Indiranagar, New Delhi',
        emergencyPhone: '+91 98111 22334',
        className: 'Grade 10',
        sectionName: 'A',
        guardianName: 'Venkatesh Rao',
        guardianRelationship: 'Father',
        guardianEmail: 'v.rao@example.com',
        guardianPhone: '+91 98111 22334',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admissionNumber).toBe(newAdmissionNumber);
    expect(res.body.data.firstName).toBe('Siddharth');
  });

  it('3b. Attempting to register a duplicate admission number in the same school must return 409 CONFLICT', async () => {
    // Attempt to register with Aarav Sharma's existing admission number
    const res = await request(app)
      .post('/api/v1/core/students')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Candidate',
        email: 'duplicate.candidate@student.apex.edu',
        admissionNumber: 'ADM-2026-0042', // Already exists in mock store
        dateOfBirth: '2010-01-01',
        gender: 'Male',
        address: 'Test Address',
        emergencyPhone: '+91 90000 00000',
        className: 'Grade 10',
        sectionName: 'A',
        guardianName: 'Test Guardian',
        guardianRelationship: 'Guardian',
        guardianEmail: 'guardian@test.com',
        guardianPhone: '+91 90000 00000',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_ADMISSION_NUMBER');
  });

  it('3c. School Admin can enroll student with omitted email and auto-assigned admission number', async () => {
    const res = await request(app)
      .post('/api/v1/core/students')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        firstName: 'Krishna',
        lastName: 'Pawar',
        gender: 'Male',
        className: 'Grade 10',
        sectionName: 'A',
        guardianName: 'jkj kjkwj',
        guardianPhone: '+91323232323',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstName).toBe('Krishna');
    expect(res.body.data.lastName).toBe('Pawar');
    expect(res.body.data.admissionNumber).toMatch(/^ADM-2026-\d{3,6}$/);
    expect(res.body.data.email).toContain('krishna.pawar');
  });

  // --------------------------------------------------------------------------
  // 4. Student Profile & Guardian Dossier Retrieval
  // --------------------------------------------------------------------------
  it('4. School Admin can retrieve student dossier including guardian details', async () => {
    const res = await request(app)
      .get('/api/v1/core/students/stu-aarav-01')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstName).toBe('Aarav');
    expect(res.body.data.guardians).toBeInstanceOf(Array);
    expect(res.body.data.guardians[0].name).toBe('Sunil Sharma');
  });

  // --------------------------------------------------------------------------
  // 5. Staff & Faculty Roster Management
  // --------------------------------------------------------------------------
  it('5a. School Admin can list staff members with department filters', async () => {
    const res = await request(app)
      .get('/api/v1/core/staff?department=Science & Physics')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0].employeeId).toBe('EMP-2026-0012');
  });

  it('5b. School Admin can register new faculty member with unique employee ID', async () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newEmpId = `EMP-2026-${randomSuffix}`;

    const res = await request(app)
      .post('/api/v1/core/staff')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        firstName: 'Anand',
        lastName: 'Kapur',
        email: `a.kapur.${randomSuffix}@apexacademy.edu`,
        employeeId: newEmpId,
        departmentName: 'Computer Science & AI',
        designation: 'Senior Robotics Instructor',
        joiningDate: '2026-02-01',
        employmentStatus: 'ACTIVE',
        phone: '+91 (11) 2840-9188',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId).toBe(newEmpId);
  });

  it('5c. Attempting to register a duplicate employee ID must return 409 CONFLICT', async () => {
    // Attempt with Dr. Thorne's existing employee ID
    const res = await request(app)
      .post('/api/v1/core/staff')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Faculty',
        email: 'dup.faculty@apexacademy.edu',
        employeeId: 'EMP-2026-0012', // Already exists
        departmentName: 'Science & Physics',
        designation: 'Instructor',
        joiningDate: '2026-01-01',
        employmentStatus: 'ACTIVE',
        phone: '+91 99999 88888',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_EMPLOYEE_ID');
  });

  // --------------------------------------------------------------------------
  // 6. Teacher Class and Subject Assignments
  // --------------------------------------------------------------------------
  it('6. School Admin can assign teacher to class and subject', async () => {
    const res = await request(app)
      .post('/api/v1/core/staff/assignments')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        staffProfileId: 'staff-thorne-01',
        className: 'Grade 10',
        sectionName: 'B',
        subjectCode: 'PHY-10',
        isLeadTeacher: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignments.some((a: any) => a.sectionName === 'B')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. Virtual ID Card Generation with Secure Random Revocable Token
  // --------------------------------------------------------------------------
  it('7. School Admin can generate a Virtual ID Card for a student', async () => {
    const res = await request(app)
      .post('/api/v1/core/id-cards/generate')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        holderType: 'STUDENT',
        profileId: 'stu-ananya-02',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('verificationToken');
    expect(res.body.data.verificationToken).toMatch(/^v-tok-[0-9a-f-]+$/);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.holderName).toBe('Ananya Deshmukh');

    // Store for subsequent verification and deactivation tests
    generatedCardToken = res.body.data.verificationToken;
    generatedCardId = res.body.data.id;
  });

  // --------------------------------------------------------------------------
  // 8. Public QR Verification Endpoint (Minimal Safe PII)
  // --------------------------------------------------------------------------
  it('8. Public QR verification endpoint confirms active card without revealing sensitive PII', async () => {
    const res = await request(app).get(`/api/v1/core/id-cards/verify/${generatedCardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.holderName).toBe('Ananya Deshmukh');
    expect(res.body.data.schoolName).toBe('Apex Academy of Sciences & Arts');
    expect(res.body.data).toHaveProperty('issuedAt');

    // Verify absence of sensitive PII (passwords, marks, phones, addresses)
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data).not.toHaveProperty('marks');
    expect(res.body.data).not.toHaveProperty('phone');
    expect(res.body.data).not.toHaveProperty('address');
  });

  // --------------------------------------------------------------------------
  // 9. ID Card Deactivation & Public Revocation Check
  // --------------------------------------------------------------------------
  it('9a. School Admin can revoke / deactivate an ID card with reason', async () => {
    const res = await request(app)
      .patch(`/api/v1/core/id-cards/${generatedCardId}/deactivate`)
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        cardId: generatedCardId,
        reason: 'Student reported physical badge lost in transit',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REVOKED');
    expect(res.body.data.revocationReason).toBe('Student reported physical badge lost in transit');
  });

  it('9b. Public QR verification of revoked card reflects revoked status and isValid = false', async () => {
    const res = await request(app).get(`/api/v1/core/id-cards/verify/${generatedCardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(false);
    expect(res.body.data.status).toBe('REVOKED');
    expect(res.body.data.revocationReason).toBe('Student reported physical badge lost in transit');
  });

  // --------------------------------------------------------------------------
  // 10. Admissions Application Review & Automatic SIS Enrollment
  // --------------------------------------------------------------------------
  it('10a. School Admin can review admissions applications queue', async () => {
    const res = await request(app)
      .get('/api/v1/core/admissions/applications')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const targetApp = res.body.data.find((a: any) => a.applicationNumber === 'APP-2026-0091');
    expect(targetApp).toBeDefined();
    expect(targetApp.applicationNumber).toBe('APP-2026-0091');
  });

  it('10b. Approving an admission application enrolls student and assigns class & section', async () => {
    const res = await request(app)
      .patch('/api/v1/core/admissions/applications/adm-app-01/review')
      .set('Authorization', `Bearer ${schoolAdminTokenSchoolA}`)
      .send({
        decision: 'APPROVED',
        reviewNotes: 'Verified entrance assessment scores and transfer certificate.',
        assignedClass: 'Grade 9',
        assignedSection: 'A',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.application.status).toBe('APPROVED');
    expect(res.body.data.enrolledStudent).not.toBeNull();
    expect(res.body.data.enrolledStudent.firstName).toBe('Meera');
    expect(res.body.data.enrolledStudent.admissionNumber).toMatch(/^ADM-2026-\d{4}$/);
  });

  // --------------------------------------------------------------------------
  // 11. Role Authorization Enforcement on Core Operations
  // --------------------------------------------------------------------------
  it('11. Unauthorized role (Student) attempting to enroll students or issue ID cards must return 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .post('/api/v1/core/students')
      .set('Authorization', `Bearer ${studentTokenA}`)
      .send({
        firstName: 'Hacker',
        lastName: 'Attempt',
        email: 'hacker@student.apex.edu',
        admissionNumber: 'ADM-2026-9999',
        dateOfBirth: '2010-01-01',
        gender: 'Male',
        address: 'Hacker Way',
        emergencyPhone: '+91 99999 99999',
        className: 'Grade 10',
        sectionName: 'A',
        guardianName: 'None',
        guardianRelationship: 'None',
        guardianEmail: 'none@none.com',
        guardianPhone: '+91 99999 99999',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });
});
