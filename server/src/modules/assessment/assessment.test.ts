import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('SECTION 6: EXAMINATION, QUESTION PAPER & ONLINE QUIZ MANAGEMENT TEST SUITE', () => {
  let teacherToken: string;
  let studentToken: string;
  let adminToken: string;
  let otherSchoolTeacherToken: string;

  let targetSchoolId: string;
  let otherSchoolId: string;
  let testSubjectId: string;
  let testClassId: string;
  let testStudentProfileId: string;
  let testExamScheduleId: string;

  let createdBankQuestionId: string;
  let createdPaperId: string;
  let activeAttemptId: string;

  beforeAll(async () => {
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    // Locate primary school
    const school =
      (await prisma.school.findFirst({ where: { slug: 'apex-academy' } })) ||
      (await prisma.school.findFirst());
    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    // Locate or create second school for tenant isolation
    let otherSchool = await prisma.school.findFirst({
      where: { id: { not: targetSchoolId } },
    });
    if (!otherSchool) {
      otherSchool = await prisma.school.create({
        data: {
          slug: 'isolation-assessment-school',
          name: 'Isolation Assessment School',
          code: 'ISO-ASSESS-001',
          email: 'admin@isolationassess.edu',
          phone: '+91 99999 88888',
          address: '456 Isolated Way',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400002',
          status: 'ACTIVE',
        },
      });
    }
    otherSchoolId = otherSchool.id;

    // Locate subject and class
    const subject = await prisma.subject.findFirst({
      where: { class: { schoolId: targetSchoolId } },
      include: { class: true },
    });
    expect(subject).toBeDefined();
    testSubjectId = subject!.id;
    testClassId = subject!.classId;

    // Locate student profile
    const student = await prisma.studentProfile.findFirst({
      where: {
        membership: { schoolId: targetSchoolId },
      },
      include: {
        membership: true,
      },
    });
    expect(student).toBeDefined();
    testStudentProfileId = student!.id;

    // Locate or create an exam schedule
    let examSchedule = await prisma.examSchedule.findFirst({
      where: { subjectId: testSubjectId },
    });
    if (!examSchedule) {
      const session = await prisma.academicSession.findFirst({
        where: { schoolId: targetSchoolId },
      });
      examSchedule = await prisma.examSchedule.create({
        data: {
          academicSessionId: session!.id,
          subjectId: testSubjectId,
          name: 'Mid-Term Assessment 2026',
          examType: 'MID_TERM',
          examDate: new Date('2026-12-10'),
          startTime: '09:00 AM',
          durationMinutes: 60,
          maxMarks: 50,
          passMarks: 20,
        },
      });
    }
    testExamScheduleId = examSchedule.id;

    // Generate tokens
    adminToken = generateAccessToken({
      userId: 'usr-admin-sec6',
      email: 'admin@apexacademy.edu',
      role: PlatformRole.SCHOOL_ADMIN,
      schoolId: targetSchoolId,
    });

    teacherToken = generateAccessToken({
      userId: 'usr-teacher-sec6',
      email: 'teacher@apexacademy.edu',
      role: PlatformRole.TEACHER,
      schoolId: targetSchoolId,
    });

    studentToken = generateAccessToken({
      userId: student!.membership.userId,
      email: 'student@apexacademy.edu',
      role: PlatformRole.STUDENT,
      schoolId: targetSchoolId,
      studentProfileId: testStudentProfileId,
    });

    otherSchoolTeacherToken = generateAccessToken({
      userId: 'usr-iso-teacher',
      email: 'teacher@isolationassess.edu',
      role: PlatformRole.TEACHER,
      schoolId: otherSchoolId,
    });
  });

  // ==========================================================================
  // PHASE 2 & 3: QUESTION BANK MANAGEMENT (ALL 10 QUESTION TYPES)
  // ==========================================================================

  it('1. Teacher can create question bank items across multiple question types', async () => {
    // 1A. Multiple Choice Question
    const mcqRes = await request(app)
      .post('/api/v1/assessments/bank')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId: testSubjectId,
        classId: testClassId,
        chapter: 'Kinematics',
        topic: 'Acceleration',
        difficulty: 'EASY',
        questionType: 'MULTIPLE_CHOICE',
        questionText: 'What is the SI unit of acceleration?',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'SI unit of acceleration is meters per second squared (m/s^2).',
        metadata: {
          choices: [
            { id: 'c1', choiceText: 'm/s', isCorrect: false },
            { id: 'c2', choiceText: 'm/s²', isCorrect: true },
            { id: 'c3', choiceText: 'km/h', isCorrect: false },
            { id: 'c4', choiceText: 'N/m', isCorrect: false },
          ],
        },
      });

    expect(mcqRes.status).toBe(201);
    expect(mcqRes.body.success).toBe(true);
    expect(mcqRes.body.data.questionType).toBe('MULTIPLE_CHOICE');
    createdBankQuestionId = mcqRes.body.data.id;

    // 1B. Fill in the Blanks Question
    const fibRes = await request(app)
      .post('/api/v1/assessments/bank')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId: testSubjectId,
        classId: testClassId,
        chapter: 'Optics',
        difficulty: 'MEDIUM',
        questionType: 'FILL_IN_BLANKS',
        questionText: 'Light travels fastest in a [___]. The speed of light is approximately 3 x 10^[___] m/s.',
        marks: 2.0,
        metadata: {
          blanks: [
            { index: 0, acceptedAnswers: ['vacuum', 'a vacuum'] },
            { index: 1, acceptedAnswers: ['8', '8th'] },
          ],
        },
      });
    expect(fibRes.status).toBe(201);
    expect(fibRes.body.data.questionType).toBe('FILL_IN_BLANKS');

    // 1C. Match the Following Question
    const matchRes = await request(app)
      .post('/api/v1/assessments/bank')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId: testSubjectId,
        classId: testClassId,
        chapter: 'Thermodynamics',
        difficulty: 'HARD',
        questionType: 'MATCH_THE_FOLLOWING',
        questionText: 'Match each thermodynamic process with its constant property:',
        marks: 4.0,
        metadata: {
          matchPairs: {
            leftItems: ['Isothermal', 'Isobaric', 'Isochoric', 'Adiabatic'],
            rightItems: ['Constant Pressure', 'No Heat Exchange', 'Constant Temperature', 'Constant Volume'],
            correctPairs: [
              { leftIndex: 0, rightIndex: 2 },
              { leftIndex: 1, rightIndex: 0 },
              { leftIndex: 2, rightIndex: 3 },
              { leftIndex: 3, rightIndex: 1 },
            ],
          },
        },
      });
    expect(matchRes.status).toBe(201);

    // 1D. Numerical Question
    const numRes = await request(app)
      .post('/api/v1/assessments/bank')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId: testSubjectId,
        classId: testClassId,
        chapter: 'Gravitation',
        difficulty: 'MEDIUM',
        questionType: 'NUMERICAL',
        questionText: 'Calculate the acceleration due to gravity on the surface of the Earth in m/s² (to 1 decimal place).',
        marks: 3.0,
        metadata: {
          numerical: {
            expectedNumber: 9.8,
            tolerance: 0.1,
            unit: 'm/s²',
          },
        },
      });
    expect(numRes.status).toBe(201);
  });

  it('2. Teacher can filter and search Question Bank items', async () => {
    const res = await request(app)
      .get(`/api/v1/assessments/bank?subjectId=${testSubjectId}&difficulty=EASY`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].difficulty).toBe('EASY');
  });

  // ==========================================================================
  // PHASE 4 & 5: QUESTION PAPER CREATION & RANDOMIZATION SETTINGS
  // ==========================================================================

  it('3. Teacher can build a Question Paper with sections, max marks, and multiple question types', async () => {
    const res = await request(app)
      .post('/api/v1/assessments/papers')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Physics Comprehensive Mid-Term Paper 2026',
        subjectId: testSubjectId,
        classId: testClassId,
        examScheduleId: testExamScheduleId,
        durationMinutes: 45,
        totalMarks: 20.0,
        passingMarks: 8.0,
        status: 'PUBLISHED',
        randomizeQuestions: false,
        randomizeOptions: false,
        instructions: 'Read all questions carefully. Negative marking applies to objective questions.',
        sections: [
          { id: 'sec-a', name: 'Section A - Objective Questions', marks: 10 },
          { id: 'sec-b', name: 'Section B - Subjective Questions', marks: 10 },
        ],
        items: [
          // Item 1: MCQ (Objective)
          {
            sectionName: 'Section A',
            orderIndex: 0,
            questionText: 'What is the SI unit of acceleration?',
            questionType: 'MULTIPLE_CHOICE',
            marks: 2.0,
            negativeMarks: 0.5,
            metadata: {
              choices: [
                { id: 'opt-1', choiceText: 'm/s', isCorrect: false },
                { id: 'opt-2', choiceText: 'm/s²', isCorrect: true },
              ],
            },
          },
          // Item 2: True/False (Objective)
          {
            sectionName: 'Section A',
            orderIndex: 1,
            questionText: 'Sound waves can propagate through a complete vacuum.',
            questionType: 'TRUE_FALSE',
            marks: 2.0,
            negativeMarks: 0.0,
            metadata: {
              choices: [
                { id: 'tf-1', choiceText: 'true', isCorrect: false },
                { id: 'tf-2', choiceText: 'false', isCorrect: true },
              ],
            },
          },
          // Item 3: Fill in Blanks (Objective)
          {
            sectionName: 'Section A',
            orderIndex: 2,
            questionText: 'Light travels fastest in a [___].',
            questionType: 'FILL_IN_BLANKS',
            marks: 2.0,
            metadata: {
              blanks: [{ index: 0, acceptedAnswers: ['vacuum', 'a vacuum'] }],
            },
          },
          // Item 4: Numerical (Objective)
          {
            sectionName: 'Section A',
            orderIndex: 3,
            questionText: 'What is g at Earth surface (m/s²)?',
            questionType: 'NUMERICAL',
            marks: 4.0,
            metadata: {
              numerical: {
                expectedNumber: 9.8,
                tolerance: 0.1,
                unit: 'm/s²',
              },
            },
          },
          // Item 5: Short Answer (Subjective)
          {
            sectionName: 'Section B',
            orderIndex: 4,
            questionText: 'State Newton\'s First Law of Motion and explain inertia.',
            questionType: 'SHORT_ANSWER',
            marks: 5.0,
            metadata: {
              sampleAnswer: 'An object remains at rest or in uniform motion unless acted upon by a net external force.',
            },
          },
          // Item 6: Descriptive (Subjective)
          {
            sectionName: 'Section B',
            orderIndex: 5,
            questionText: 'Describe the working principle of an electric generator with a neat diagram.',
            questionType: 'DESCRIPTIVE',
            marks: 5.0,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Physics Comprehensive Mid-Term Paper 2026');
    expect(res.body.data.items.length).toBe(6);
    createdPaperId = res.body.data.id;
  });

  // ==========================================================================
  // PHASE 6 & 7: ONLINE EXAM ENGINE, COUNTDOWN & AUTOSAVE
  // ==========================================================================

  it('4. Student can start an online exam and receives sanitized questions (correct answers hidden)', async () => {
    const res = await request(app)
      .post(`/api/v1/assessments/papers/${createdPaperId}/attempts/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attempt.status).toBe('IN_PROGRESS');
    activeAttemptId = res.body.data.attempt.id;

    // Security Verification: Correct answer keys MUST NOT leak to student
    const items = res.body.data.paper.items;
    for (const item of items) {
      if (item.choices) {
        for (const choice of item.choices) {
          expect(choice.isCorrect).toBeUndefined();
        }
      }
      if (item.numerical) {
        expect(item.numerical.expectedNumber).toBeUndefined();
        expect(item.numerical.tolerance).toBeUndefined();
      }
    }
  });

  it('5. Student can autosave progress as they answer questions', async () => {
    const paper = (await request(app).get(`/api/v1/assessments/papers/${createdPaperId}`).set('Authorization', `Bearer ${teacherToken}`)).body.data;
    const mcqItem = paper.items.find((i: any) => i.questionType === 'MULTIPLE_CHOICE');
    const tfItem = paper.items.find((i: any) => i.questionType === 'TRUE_FALSE');
    const fibItem = paper.items.find((i: any) => i.questionType === 'FILL_IN_BLANKS');
    const numItem = paper.items.find((i: any) => i.questionType === 'NUMERICAL');
    const saItem = paper.items.find((i: any) => i.questionType === 'SHORT_ANSWER');

    // 5A. Autosave MCQ answer
    const saveRes = await request(app)
      .post('/api/v1/assessments/attempts/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId: activeAttemptId,
        paperItemId: mcqItem.id,
        studentAnswer: {
          selectedChoiceIds: ['opt-2'], // correct answer
        },
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);

    // 5B. Autosave True/False answer
    await request(app)
      .post('/api/v1/assessments/attempts/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId: activeAttemptId,
        paperItemId: tfItem.id,
        studentAnswer: {
          selectedChoiceIds: ['tf-2'], // correct: false
        },
      });

    // 5C. Autosave Fill in blanks answer
    await request(app)
      .post('/api/v1/assessments/attempts/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId: activeAttemptId,
        paperItemId: fibItem.id,
        studentAnswer: {
          blankAnswers: ['Vacuum'], // correct case-insensitive
        },
      });

    // 5D. Autosave Numerical answer
    await request(app)
      .post('/api/v1/assessments/attempts/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId: activeAttemptId,
        paperItemId: numItem.id,
        studentAnswer: {
          numericalValue: 9.81, // within 0.1 tolerance of 9.8
        },
      });

    // 5E. Autosave Subjective Short Answer
    await request(app)
      .post('/api/v1/assessments/attempts/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId: activeAttemptId,
        paperItemId: saItem.id,
        studentAnswer: {
          textAnswer: 'Newton\'s First Law states that an object continues in its state of rest or uniform motion unless an unbalanced force acts on it.',
        },
      });
  });

  // ==========================================================================
  // PHASE 8 & 9: SUBMISSION & HYBRID AUTO/MANUAL EVALUATION ENGINE
  // ==========================================================================

  it('6. Student submits attempt: objective questions auto-evaluated, subjective flagged for teacher', async () => {
    const res = await request(app)
      .post('/api/v1/assessments/attempts/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId: activeAttemptId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('SUBMITTED');

    // Verify auto-evaluated objective questions
    const answers = res.body.data.answers;
    const evaluatedAnswers = answers.filter((a: any) => a.isAutoEvaluated);
    expect(evaluatedAnswers.length).toBeGreaterThanOrEqual(4);

    // Sum of auto-evaluated marks: 2 (MCQ) + 2 (T/F) + 2 (FIB) + 4 (NUM) = 10
    const autoScore = evaluatedAnswers.reduce((sum: number, a: any) => sum + (a.marksAwarded || 0), 0);
    expect(autoScore).toBe(10.0);
  });

  it('7. Idempotent submission: submitting already submitted exam returns current record without re-calculating', async () => {
    const duplicateRes = await request(app)
      .post('/api/v1/assessments/attempts/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId: activeAttemptId,
      });

    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.data.id).toBe(activeAttemptId);
    expect(duplicateRes.body.data.status).toBe('SUBMITTED');
  });

  it('8. Teacher manually evaluates subjective questions and provides feedback', async () => {
    const paper = (await request(app).get(`/api/v1/assessments/papers/${createdPaperId}`).set('Authorization', `Bearer ${teacherToken}`)).body.data;
    const saItem = paper.items.find((i: any) => i.questionType === 'SHORT_ANSWER');
    const descItem = paper.items.find((i: any) => i.questionType === 'DESCRIPTIVE');

    const evalRes = await request(app)
      .post('/api/v1/assessments/attempts/evaluate')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        attemptId: activeAttemptId,
        status: 'EVALUATED',
        teacherFeedback: 'Outstanding performance in both conceptual physics and numerical accuracy.',
        itemEvaluations: [
          {
            paperItemId: saItem.id,
            marksAwarded: 4.5,
            teacherRemarks: 'Excellent explanation of inertia and external force.',
          },
          {
            paperItemId: descItem.id,
            marksAwarded: 3.5,
            teacherRemarks: 'Clear working principle outlined.',
          },
        ],
      });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.success).toBe(true);
    expect(evalRes.body.data.status).toBe('EVALUATED');
    // Total: 10 (auto) + 4.5 + 3.5 = 18 / 20 = 90%
    expect(evalRes.body.data.scoreObtained).toBe(18.0);
    expect(evalRes.body.data.percentage).toBe(90.0);
    expect(evalRes.body.data.isPassed).toBe(true);
  });

  // ==========================================================================
  // PHASE 10 & 11: RESULT APPROVAL, PUBLICATION & EXAM MARK SYNC
  // ==========================================================================

  it('9. School Admin publishes assessment results and syncs directly to ExamMark database', async () => {
    const pubRes = await request(app)
      .post(`/api/v1/assessments/papers/${createdPaperId}/publish-results`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        publish: true,
        syncToExamMarks: true,
      });

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.success).toBe(true);
    expect(pubRes.body.data.status).toBe('PUBLISHED');
    expect(pubRes.body.data.syncedMarksCount).toBeGreaterThanOrEqual(1);

    // Verify persistence in ExamMark model
    const examMark = await prisma.examMark.findFirst({
      where: {
        examScheduleId: testExamScheduleId,
        studentProfileId: testStudentProfileId,
      },
    });

    expect(examMark).toBeDefined();
    expect(examMark!.marksObtained).toBe(18.0);
    expect(examMark!.grade).toBe('A+');
  });

  it('10. Student and Parent can view finalized assessment results and report breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/assessments/results/student?studentProfileId=${testStudentProfileId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const publishedRecord = res.body.data.find((r: any) => r.id === activeAttemptId);
    expect(publishedRecord).toBeDefined();
    expect(publishedRecord.status).toBe('PUBLISHED');
    expect(publishedRecord.scoreObtained).toBe(18.0);
  });

  // ==========================================================================
  // TENANT ISOLATION & ACCESS CONTROL
  // ==========================================================================

  it('11. Multi-Tenant Isolation: teacher from another school cannot access or evaluate question paper', async () => {
    const getRes = await request(app)
      .get(`/api/v1/assessments/papers/${createdPaperId}`)
      .set('Authorization', `Bearer ${otherSchoolTeacherToken}`);

    expect(getRes.status).toBe(404);
    expect(getRes.body.success).toBe(false);
  });
});
