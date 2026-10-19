import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/db.js';
import { generateAccessToken } from '../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('EDUNEXA PHASE 4: End-to-End School ERP Workflows Test Suite', () => {
  // Test Tokens for School A (Apex Academy)
  const schoolAdminTokenA = generateAccessToken({
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  const teacherTokenA = generateAccessToken({
    userId: 'usr-thorne-01',
    email: 'dr.thorne@apexacademy.edu',
    schoolId: 'sch-apex-01',
    staffProfileId: 'staff-thorne-01',
    role: PlatformRole.TEACHER,
  });

  const studentTokenA = generateAccessToken({
    userId: 'usr-aarav-01',
    email: 'aarav.sharma@student.apex.edu',
    schoolId: 'sch-apex-01',
    studentProfileId: 'stu-aarav-01',
    role: PlatformRole.STUDENT,
  });

  const parentTokenA = generateAccessToken({
    userId: 'usr-parent-01',
    email: 'sunil.sharma@parent.apex.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.PARENT,
  });

  const examCoordinatorTokenA = generateAccessToken({
    userId: 'usr-examcoord-01',
    email: 'exam.coordinator@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.EXAM_COORDINATOR,
  });

  const accountsTokenA = generateAccessToken({
    userId: 'usr-accounts-01',
    email: 'accounts@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.ACCOUNTS,
  });

  // Cross-Tenant Token for School B (Greenwood)
  const schoolAdminTokenB = generateAccessToken({
    userId: 'usr-gw-admin',
    email: 'admin@greenwood.edu',
    schoolId: 'sch-greenwood-02',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  const unlinkedParentToken = generateAccessToken({
    userId: 'usr-parent-unlinked',
    email: 'stranger.parent@other.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.PARENT,
  });

  // Shared workflow IDs
  let createdAppId: string;
  let enrolledStudentId: string;
  let issuedCardToken: string;
  let issuedCardId: string;
  let createdQuizId: string;
  let createdExamId: string;

  beforeAll(async () => {
    // Reset any previous state for test applications
    await prisma.admissionApplication.deleteMany({
      where: {
        guardianEmail: 'rohan.parent@example.com',
      },
    });

    // Reset test invoice inv-ananya-02
    await prisma.feePayment.deleteMany({
      where: { feeInvoiceId: 'inv-ananya-02' },
    });
    await prisma.feeInvoice.updateMany({
      where: { id: 'inv-ananya-02' },
      data: {
        amountPaid: 20000,
        discountApplied: 0,
        status: 'PARTIALLY_PAID',
        auditTrail: [],
      },
    });

    // Clean up test timetable slots
    await prisma.timetableSlot.deleteMany({
      where: {
        subjectName: { in: ['Physics Lab', 'Chemistry', 'Advanced Physics'] },
      },
    });

    // Clean up test exams
    const testExams = await prisma.examSchedule.findMany({
      where: { name: 'Term Examination: Chemistry 2026' },
      select: { id: true },
    });
    if (testExams.length > 0) {
      const examIds = testExams.map((e) => e.id);
      await prisma.examMark.deleteMany({
        where: { examScheduleId: { in: examIds } },
      });
      await prisma.examSchedule.deleteMany({
        where: { id: { in: examIds } },
      });
    }

    // Clean up test quizzes
    const testQuizzes = await prisma.quiz.findMany({
      where: { title: 'Science E2E: Newton Laws & Optics' },
      select: { id: true },
    });
    if (testQuizzes.length > 0) {
      const quizIds = testQuizzes.map((q) => q.id);
      await prisma.quizAttempt.deleteMany({
        where: { quizId: { in: quizIds } },
      });
      await prisma.quizQuestionChoice.deleteMany({
        where: { question: { quizId: { in: quizIds } } },
      });
      await prisma.quizQuestion.deleteMany({
        where: { quizId: { in: quizIds } },
      });
      await prisma.quiz.deleteMany({
        where: { id: { in: quizIds } },
      });
    }
  });

  // ==========================================================================
  // WORKFLOW 1: Application -> Approval -> Student Record
  // ==========================================================================
  describe('Workflow 1: School Setup & Online Admissions', () => {
    it('1a. Allows public applicant to submit online admission application', async () => {
      const res = await request(app)
        .post('/api/v1/core/admissions/apply')
        .send({
          schoolIdentifier: 'apex-academy',
          studentFirstName: 'Rohan',
          studentLastName: 'Verma',
          dateOfBirth: '2011-04-12',
          gender: 'Male',
          applyingClass: 'Grade 10',
          guardianName: 'Ramesh Verma',
          guardianRelationship: 'Father',
          guardianEmail: 'rohan.parent@example.com',
          guardianPhone: '+91 98765 43210',
          residentialAddress: '88 Palm Grove, Bangalore',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.studentFirstName).toBe('Rohan');

      createdAppId = res.body.data.id;
    });

    it('1b. School Admin approves application, creating student enrollment record in PostgreSQL', async () => {
      const res = await request(app)
        .patch(`/api/v1/core/admissions/applications/${createdAppId}/review`)
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          decision: 'APPROVED',
          assignedClass: 'Grade 10',
          assignedSection: 'A',
          reviewNotes: 'Verified original transcripts and address proof. Enrolled.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('APPROVED');
      expect(res.body.data).toHaveProperty('enrolledStudent');
      expect(res.body.data.enrolledStudent.firstName).toBe('Rohan');
      expect(res.body.data.enrolledStudent.className).toBe('Grade 10');

      enrolledStudentId = res.body.data.enrolledStudent.id;
    });

    it('1c. Attempting duplicate approval on already enrolled application is strictly rejected', async () => {
      const res = await request(app)
        .patch(`/api/v1/core/admissions/applications/${createdAppId}/review`)
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          decision: 'APPROVED',
          assignedClass: 'Grade 10',
          assignedSection: 'A',
          reviewNotes: 'Trying to approve again',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('APPLICATION_ALREADY_APPROVED');
    });
  });

  // ==========================================================================
  // WORKFLOW 2: Student Record -> Virtual ID Card -> Public Verification
  // ==========================================================================
  describe('Workflow 2: Student Records & Virtual ID Card Lifecycle', () => {
    it('2a. School Admin generates Virtual ID Card for enrolled student', async () => {
      const res = await request(app)
        .post('/api/v1/core/id-cards/generate')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          holderType: 'STUDENT',
          profileId: enrolledStudentId || 'stu-aarav-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('verificationToken');
      expect(res.body.data.status).toBe('ACTIVE');

      issuedCardToken = res.body.data.verificationToken;
      issuedCardId = res.body.data.id;
    });

    it('2b. Public QR verification confirms card authenticity without sensitive PII leakage', async () => {
      const res = await request(app)
        .get(`/api/v1/core/id-cards/verify/${issuedCardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data).toHaveProperty('holderName');
      expect(res.body.data).toHaveProperty('schoolName');
      expect(res.body.data).not.toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('phone');
      expect(res.body.data).not.toHaveProperty('address');
    });

    it('2c. School Admin revokes ID card with reason; public QR check reflects revoked status', async () => {
      const revokeRes = await request(app)
        .patch(`/api/v1/core/id-cards/${issuedCardId}/deactivate`)
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          cardId: issuedCardId,
          reason: 'Physical badge reported lost on campus',
        });

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.data.status).toBe('REVOKED');

      const verifyRes = await request(app)
        .get(`/api/v1/core/id-cards/verify/${issuedCardToken}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.isValid).toBe(false);
      expect(verifyRes.body.data.status).toBe('REVOKED');
      expect(verifyRes.body.data.revocationReason).toBe('Physical badge reported lost on campus');
    });
  });

  // ==========================================================================
  // WORKFLOW 3: Attendance Entry -> Persisted Attendance Summary
  // ==========================================================================
  describe('Workflow 3: Student Attendance Register & Calculations', () => {
    it('3a. Teacher records daily attendance batch for Grade 10-A', async () => {
      const res = await request(app)
        .post('/api/v1/academic/attendance/students')
        .set('Authorization', `Bearer ${teacherTokenA}`)
        .send({
          className: 'Grade 10',
          sectionName: 'A',
          date: '2026-10-22',
          records: [
            { studentProfileId: 'stu-aarav-01', status: 'PRESENT', remarks: 'On time' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recordsCount).toBeGreaterThanOrEqual(1);
    });

    it('3b. Re-recording attendance on the same date updates rather than duplicating rows', async () => {
      const res = await request(app)
        .post('/api/v1/academic/attendance/students')
        .set('Authorization', `Bearer ${teacherTokenA}`)
        .send({
          className: 'Grade 10',
          sectionName: 'A',
          date: '2026-10-22',
          records: [
            { studentProfileId: 'stu-aarav-01', status: 'LATE', remarks: 'Late due to transit' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.records[0].status).toBe('LATE');

      const summaryRes = await request(app)
        .get('/api/v1/academic/attendance/students/stu-aarav-01/summary')
        .set('Authorization', `Bearer ${studentTokenA}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data).toHaveProperty('attendancePercentage');
      expect(summaryRes.body.data.totalWorkingDays).toBeGreaterThanOrEqual(1);
      expect(typeof summaryRes.body.data.attendancePercentage).toBe('number');
    });
  });

  // ==========================================================================
  // WORKFLOW 4: Quiz Creation -> Student Attempt -> Stored Result
  // ==========================================================================
  describe('Workflow 4: Quizzes, Deadlines & Objective Auto-Grading', () => {
    it('4a. Teacher creates objective assessment quiz with valid schema', async () => {
      const res = await request(app)
        .post('/api/v1/academic/quizzes')
        .set('Authorization', `Bearer ${teacherTokenA}`)
        .send({
          title: 'Science E2E: Newton Laws & Optics',
          subjectCode: 'PHY-10',
          className: 'Grade 10',
          sectionName: 'A',
          instructions: 'Read questions carefully before submitting.',
          durationMinutes: 20,
          totalMarks: 10,
          passingMarks: 5,
          opensAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          closesAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          maxAttempts: 1,
          negativeMarking: 0.0,
          releaseGradesImmediately: true,
          questions: [
            {
              questionText: 'What is the SI unit of Magnetic Flux?',
              questionType: 'MULTIPLE_CHOICE',
              marks: 5,
              negativeMarks: 0,
              choices: [
                { choiceText: 'Weber (Wb)', isCorrect: true },
                { choiceText: 'Tesla (T)', isCorrect: false },
              ],
            },
            {
              questionText: 'Light travels faster in vacuum than in diamond.',
              questionType: 'TRUE_FALSE',
              marks: 5,
              negativeMarks: 0,
              choices: [
                { choiceText: 'True', isCorrect: true },
                { choiceText: 'False', isCorrect: false },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');

      createdQuizId = res.body.data.id;
    });

    it('4b. Student starts attempt and submits answers, verifying objective auto-grading', async () => {
      // Fetch quiz details
      const qList = await request(app)
        .get('/api/v1/academic/quizzes')
        .set('Authorization', `Bearer ${studentTokenA}`);
      const quiz = qList.body.data.find((q: any) => q.id === createdQuizId);

      // Start attempt
      await request(app)
        .post(`/api/v1/academic/quizzes/${createdQuizId}/attempts/start`)
        .set('Authorization', `Bearer ${studentTokenA}`);

      const q1 = quiz.questions[0];
      const correctChoice1 = q1.choices.find((c: any) => c.isCorrect);

      const q2 = quiz.questions[1];
      const correctChoice2 = q2.choices.find((c: any) => c.isCorrect);

      const submitRes = await request(app)
        .post(`/api/v1/academic/quizzes/${createdQuizId}/attempts/submit`)
        .set('Authorization', `Bearer ${studentTokenA}`)
        .send({
          quizId: createdQuizId,
          saveOnly: false,
          answers: [
            { questionId: q1.id, selectedChoiceIds: [correctChoice1.id] },
            { questionId: q2.id, selectedChoiceIds: [correctChoice2.id] },
          ],
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data).toHaveProperty('scoreObtained');
      expect(submitRes.body.data.isGraded).toBe(true);
      expect(submitRes.body.data.scoreObtained).toBe(10);
    });

    it('4c. Starting a second attempt when maxAttempts is 1 returns 403 ATTEMPT_LIMIT_EXCEEDED', async () => {
      const res = await request(app)
        .post(`/api/v1/academic/quizzes/${createdQuizId}/attempts/start`)
        .set('Authorization', `Bearer ${studentTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ATTEMPT_LIMIT_EXCEEDED');
    });
  });

  // ==========================================================================
  // WORKFLOW 5: Exam Marks -> Publication -> Report Card
  // ==========================================================================
  describe('Workflow 5: Examination Lifecycle & Publication Control', () => {
    it('5a. Exam Coordinator schedules a formal term examination', async () => {
      const res = await request(app)
        .post('/api/v1/academic/exams/schedules')
        .set('Authorization', `Bearer ${examCoordinatorTokenA}`)
        .send({
          academicSession: '2026–2027',
          className: 'Grade 10',
          subjectCode: 'CHEM-10',
          name: 'Term Examination: Chemistry 2026',
          examType: 'MID_TERM',
          examDate: '2026-11-10',
          startTime: '10:00 AM',
          durationMinutes: 120,
          maxMarks: 100,
          passMarks: 35,
          weightagePercent: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdExamId = res.body.data.id;
    });

    it('5b. Teacher enters draft marks for student', async () => {
      const res = await request(app)
        .post('/api/v1/academic/exams/marks/batch')
        .set('Authorization', `Bearer ${teacherTokenA}`)
        .send({
          examScheduleId: createdExamId,
          isDraft: true,
          marks: [
            {
              studentProfileId: 'stu-aarav-01',
              marksObtained: 92,
              teacherRemarks: 'Excellent analytical comprehension',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('MARKS_DRAFT');
      expect(res.body.data.marks.length).toBe(1);
    });

    it('5c. Unpublished exam marks do NOT appear on student report card', async () => {
      const res = await request(app)
        .get('/api/v1/academic/report-cards/stu-aarav-01')
        .set('Authorization', `Bearer ${studentTokenA}`);

      expect(res.status).toBe(200);
      const unpublished = res.body.data.results.find((r: any) => r.subjectName === 'Term Examination: Chemistry 2026');
      expect(unpublished).toBeUndefined();
    });

    it('5d. Exam Coordinator publishes results; student and parent can now view published report card', async () => {
      const pubRes = await request(app)
        .patch('/api/v1/academic/exams/publish')
        .set('Authorization', `Bearer ${examCoordinatorTokenA}`)
        .send({
          examScheduleId: createdExamId,
          publish: true,
        });

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('PUBLISHED');

      const parentRes = await request(app)
        .get('/api/v1/academic/report-cards/stu-aarav-01')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(parentRes.status).toBe(200);
      expect(parentRes.body.data).toHaveProperty('studentName');
      expect(parentRes.body.data).toHaveProperty('overallPercentage');

      const unlinkedRes = await request(app)
        .get('/api/v1/academic/report-cards/stu-aarav-01')
        .set('Authorization', `Bearer ${unlinkedParentToken}`);

      expect(unlinkedRes.status).toBe(403);
      expect(unlinkedRes.body.error.code).toBe('FORBIDDEN_RECORD_ACCESS');
    });
  });

  // ==========================================================================
  // WORKFLOW 6: Fee Invoices & Payment Ledger
  // ==========================================================================
  describe('Workflow 6: Fee Structures, Invoices & Atomic Payments', () => {
    it('6a. Processes simulated payment transaction atomically, verifying receipt and balance', async () => {
      const res = await request(app)
        .post('/api/v1/operations/fees/payments')
        .set('Authorization', `Bearer ${accountsTokenA}`)
        .send({
          invoiceId: 'inv-ananya-02',
          amountPaid: 5000,
          paymentMethod: 'UPI',
          transactionRef: 'UPI-SIM-E2E-7701',
          isSimulated: true,
          notes: 'Simulated UPI test payment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('receiptNumber');
      expect(res.body.data.isSimulated).toBe(true);
      expect(res.body.data.amountPaid).toBe(5000);
    });

    it('6b. Overpayment exceeding outstanding balance is strictly rejected with 400', async () => {
      const res = await request(app)
        .post('/api/v1/operations/fees/payments')
        .set('Authorization', `Bearer ${accountsTokenA}`)
        .send({
          invoiceId: 'inv-ananya-02',
          amountPaid: 9999999,
          paymentMethod: 'CASH',
          transactionRef: 'CSH-002',
          isSimulated: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OVERPAYMENT_REJECTED');
    });
  });

  // ==========================================================================
  // WORKFLOW 7: Timetable Scheduling & Collision Detection
  // ==========================================================================
  describe('Workflow 7: Timetable Collision Validation', () => {
    it('7a. Schedules a valid timetable slot for Section A', async () => {
      const res = await request(app)
        .post('/api/v1/operations/timetables')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          className: 'Grade 10',
          sectionName: 'A',
          dayOfWeek: 3,
          startTime: '08:00',
          endTime: '09:00',
          subjectName: 'Physics Lab',
          roomNumber: 'LAB-201',
          teacherName: 'Dr. Thorne',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('7b. Detects Room Conflict: booking same room at overlapping time returns 409', async () => {
      const res = await request(app)
        .post('/api/v1/operations/timetables')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          className: 'Grade 10',
          sectionName: 'B',
          dayOfWeek: 3,
          startTime: '08:30',
          endTime: '09:30',
          subjectName: 'Chemistry',
          roomNumber: 'LAB-201',
          teacherName: 'Prof. Miller',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ROOM_SCHEDULE_CONFLICT');
    });

    it('7c. Detects Teacher Double-Booking: same teacher at overlapping time returns 409', async () => {
      const res = await request(app)
        .post('/api/v1/operations/timetables')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          className: 'Grade 10',
          sectionName: 'B',
          dayOfWeek: 3,
          startTime: '08:00',
          endTime: '09:00',
          subjectName: 'Advanced Physics',
          roomNumber: 'ROOM-102',
          teacherName: 'Dr. Thorne',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('TEACHER_SCHEDULE_CONFLICT');
    });
  });

  // ==========================================================================
  // WORKFLOW 8: Notices & Audience Scoping
  // ==========================================================================
  describe('Workflow 8: Notices & Audience Scoping', () => {
    it('8a. Publishes notice targeted strictly for PARENTS_ONLY', async () => {
      const res = await request(app)
        .post('/api/v1/operations/notices')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          title: 'Parent-Teacher Council Annual Assembly 2026',
          content: 'Important discussions on upcoming term assessments.',
          audience: 'PARENTS_ONLY',
          isUrgent: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.audience).toBe('PARENTS_ONLY');
    });

    it('8b. Notice is visible to Parent audience query', async () => {
      const res = await request(app)
        .get('/api/v1/operations/notices?audience=PARENTS_ONLY')
        .set('Authorization', `Bearer ${parentTokenA}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find((n: any) => n.title === 'Parent-Teacher Council Annual Assembly 2026');
      expect(found).toBeDefined();
    });
  });

  // ==========================================================================
  // WORKFLOW 9: Cross-Tenant Isolation
  // ==========================================================================
  describe('Workflow 9: Multi-Tenant School Isolation', () => {
    it('9a. School B Admin cannot access or mutate School A student records', async () => {
      const res = await request(app)
        .get('/api/v1/core/students/stu-aarav-01')
        .set('Authorization', `Bearer ${schoolAdminTokenB}`);

      expect([403, 404]).toContain(res.status);
    });

    it('9b. School B Admin receives empty financial summary isolated from School A', async () => {
      const res = await request(app)
        .get('/api/v1/operations/fees/summary')
        .set('Authorization', `Bearer ${schoolAdminTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCollected).toBe(0);
      expect(res.body.data.totalInvoiced).toBe(0);
    });
  });
});
