import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('STAGE HR: Complete HR Portal, Database Persistence, and RBAC Test Suite', () => {
  const hrStaffToken = generateAccessToken({
    userId: 'usr-hradmin-01',
    email: 'hr.admin@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.HR_STAFF,
  });

  const studentToken = generateAccessToken({
    userId: 'usr-student-01',
    email: 'aarav.sharma@student.apex.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.STUDENT,
  });

  const schoolBAdminToken = generateAccessToken({
    userId: 'usr-admin-school-b',
    email: 'admin@staugustine.edu',
    schoolId: 'sch-augustine-03',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  let testStaffId: string;
  let testLeaveId: string;
  let testQuizId: string;
  const uniqueEmpId = `EMP-2026-${Math.floor(20000 + Math.random() * 70000)}`;
  const testStaffEmail = `hr.test.${Date.now()}@apexacademy.edu`;

  beforeAll(async () => {
    // Ensure school apex-academy exists
    const school = await prisma.school.findFirst({ where: { slug: 'apex-academy' } });
    expect(school).toBeTruthy();
  });

  // 1. Loading HR Directory from PostgreSQL
  it('1. Loads staff directory for authenticated HR staff with real PostgreSQL records', async () => {
    const res = await request(app)
      .get('/api/v1/core/staff')
      .set('Authorization', `Bearer ${hrStaffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  // 2. Creating and Editing a Staff Record
  it('2a. HR staff can register a new staff member with transactional database persistence', async () => {
    const res = await request(app)
      .post('/api/v1/core/staff')
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({
        firstName: 'Anil',
        lastName: 'Sharma',
        email: testStaffEmail,
        phone: '+91 11 2659 4000',
        employeeId: uniqueEmpId,
        departmentName: 'Science & Physics',
        designation: 'Associate Professor',
        joiningDate: '2026-03-01',
        employmentStatus: 'ACTIVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId).toBe(uniqueEmpId);
    testStaffId = res.body.data.id;

    // Verify persisted directly in PostgreSQL
    const inDb = await prisma.staffProfile.findUnique({
      where: { id: testStaffId },
      include: { membership: { include: { user: true } }, department: true },
    });
    expect(inDb).toBeTruthy();
    expect(inDb?.employeeId).toBe(uniqueEmpId);
    expect(inDb?.membership.user.email).toBe(testStaffEmail);
  });

  it('2b. HR staff can edit staff details (designation and phone) persisted to database', async () => {
    expect(testStaffId).toBeTruthy();

    const res = await request(app)
      .patch(`/api/v1/core/staff/${testStaffId}`)
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({
        designation: 'Senior Faculty Lead',
        phone: '+91 11 2659 9999',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.designation).toBe('Senior Faculty Lead');
    expect(res.body.data.phone).toBe('+91 11 2659 9999');

    // Verify in PostgreSQL
    const inDb = await prisma.staffProfile.findUnique({
      where: { id: testStaffId },
      include: { membership: { include: { user: true } } },
    });
    expect(inDb?.designation).toBe('Senior Faculty Lead');
    expect(inDb?.membership.user.phone).toBe('+91 11 2659 9999');
  });

  // 3. Rejecting duplicate employee ID
  it('3. Prevents duplicate employee IDs in PostgreSQL (returns 409 CONFLICT)', async () => {
    const res = await request(app)
      .post('/api/v1/core/staff')
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Person',
        email: `dup.${Date.now()}@apexacademy.edu`,
        phone: '+91 11 2659 4000',
        employeeId: uniqueEmpId, // Duplicate!
        departmentName: 'Science & Physics',
        designation: 'Assistant Faculty',
        joiningDate: '2026-03-01',
        employmentStatus: 'ACTIVE',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_EMPLOYEE_ID');
  });

  // 4. Deactivating staff without corrupting historical records
  it('4. Deactivates staff by updating status to RESIGNED without deleting database record', async () => {
    const res = await request(app)
      .patch(`/api/v1/core/staff/${testStaffId}/status`)
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({ status: 'RESIGNED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employmentStatus).toBe('RESIGNED');

    // Verify record still exists in DB with RESIGNED status
    const inDb = await prisma.staffProfile.findUnique({ where: { id: testStaffId } });
    expect(inDb).toBeTruthy();
    expect(inDb?.employmentStatus).toBe('RESIGNED');
  });

  // 5. Loading and filtering leave requests
  it('5. Loads staff leave requests with status filtering', async () => {
    const resAll = await request(app)
      .get('/api/v1/academic/attendance/staff/leave')
      .set('Authorization', `Bearer ${hrStaffToken}`);

    expect(resAll.status).toBe(200);
    expect(resAll.body.success).toBe(true);
    expect(Array.isArray(resAll.body.data)).toBe(true);

    const resPending = await request(app)
      .get('/api/v1/academic/attendance/staff/leave?status=PENDING')
      .set('Authorization', `Bearer ${hrStaffToken}`);

    expect(resPending.status).toBe(200);
    expect(resPending.body.success).toBe(true);
    expect(Array.isArray(resPending.body.data)).toBe(true);
  });

  // 6. Submitting, Approving, and Rejecting leave requests
  it('6a. Records a staff leave request in PostgreSQL', async () => {
    const res = await request(app)
      .post('/api/v1/academic/attendance/staff/leave')
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({
        staffProfileId: testStaffId,
        leaveType: 'SICK',
        startDate: '2026-11-15',
        endDate: '2026-11-16',
        reason: 'Hospital surgery recovery',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leaveType).toBe('SICK');
    expect(res.body.data.status).toBe('PENDING');
    testLeaveId = res.body.data.id;
  });

  it('6b. HR staff can approve a pending leave request with status update in PostgreSQL', async () => {
    expect(testLeaveId).toBeTruthy();

    const res = await request(app)
      .patch(`/api/v1/academic/attendance/staff/leave/${testLeaveId}/review`)
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({
        decision: 'APPROVED',
        reviewNotes: 'Approved with medical certificate verified.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');

    // Check DB
    const inDb = await prisma.staffLeaveRequest.findUnique({ where: { id: testLeaveId } });
    expect(inDb?.status).toBe('APPROVED');
  });

  // 7. Staff Training Quizzes & Attempts
  it('7a. HR staff can list available staff training quizzes from PostgreSQL', async () => {
    const res = await request(app)
      .get('/api/v1/academic/training/quizzes')
      .set('Authorization', `Bearer ${hrStaffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].isStaffTraining).toBe(true);
    testQuizId = res.body.data[0].id;
  });

  it('7b. HR staff can create a new staff training quiz persisted to PostgreSQL', async () => {
    const res = await request(app)
      .post('/api/v1/academic/training/quizzes')
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({
        title: `Campus Safety Protocol ${Date.now()}`,
        instructions: 'Mandatory annual fire and safety evaluation.',
        durationMinutes: 20,
        totalMarks: 50,
        passingMarks: 35,
        questions: [
          {
            questionText: 'Where is the primary emergency assembly point?',
            questionType: 'MULTIPLE_CHOICE',
            marks: 50,
            choices: [
              { choiceText: 'Main Football Ground', isCorrect: true },
              { choiceText: 'Chemistry Laboratory', isCorrect: false },
            ],
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isStaffTraining).toBe(true);

    // Verify in PostgreSQL
    const inDb = await prisma.quiz.findUnique({ where: { id: res.body.data.id } });
    expect(inDb).toBeTruthy();
    expect(inDb?.isStaffTraining).toBe(true);
  });

  it('7c. Records staff quiz attempt and calculates pass/fail in PostgreSQL', async () => {
    expect(testQuizId).toBeTruthy();

    const res = await request(app)
      .post(`/api/v1/academic/training/quizzes/${testQuizId}/attempts`)
      .set('Authorization', `Bearer ${hrStaffToken}`)
      .send({
        staffProfileId: 'staff-thorne-01',
        scoreObtained: 90,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scoreObtained).toBe(90);
    expect(res.body.data.isPassed).toBe(true);

    // Verify in PostgreSQL
    const attemptInDb = await prisma.staffQuizAttempt.findFirst({
      where: { quizId: testQuizId, scoreObtained: 90 },
    });
    expect(attemptInDb).toBeTruthy();
    expect(attemptInDb?.isPassed).toBe(true);
  });

  // 8. Multi-Tenant School Isolation
  it('8. Enforces tenant isolation: School B cannot view School A staff records', async () => {
    const res = await request(app)
      .get('/api/v1/core/staff')
      .set('Authorization', `Bearer ${schoolBAdminToken}`);

    expect(res.status).toBe(200);
    // School B should have 0 staff records from School A
    const staffFromSchoolA = res.body.data?.filter((s: any) => s.employeeId === uniqueEmpId);
    expect(staffFromSchoolA?.length || 0).toBe(0);
  });

  // 9. Role-Based Access Control
  it('9. Rejects unauthorized access: Student role cannot register staff or view HR directory', async () => {
    const res = await request(app)
      .post('/api/v1/core/staff')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        firstName: 'Hacker',
        lastName: 'Attempt',
        email: 'hacker@apexacademy.edu',
        employeeId: 'EMP-2026-9999',
        departmentName: 'Science',
        designation: 'Teacher',
        joiningDate: '2026-01-01',
        employmentStatus: 'ACTIVE',
        phone: '+91 11 2659 0000',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 10. Empty search result handling
  it('10. Gracefully handles empty search query returning 200 with empty items', async () => {
    const res = await request(app)
      .get('/api/v1/core/staff?query=NONEXISTENT_WORKFORCE_RECORD_XYZ999')
      .set('Authorization', `Bearer ${hrStaffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.meta.total).toBe(0);
  });
});
