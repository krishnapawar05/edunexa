import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('STAGE 6: School Operations and Reporting Test Suite', () => {
  // Tokens
  const schoolAdminToken = generateAccessToken({
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  const accountsToken = generateAccessToken({
    userId: 'usr-accounts-01',
    email: 'accounts@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.ACCOUNTS,
  });

  const teacherToken = generateAccessToken({
    userId: 'usr-thorne-01',
    email: 'dr.thorne@apexacademy.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.TEACHER,
  });

  const studentAaravToken = generateAccessToken({
    userId: 'usr-aarav-01',
    email: 'aarav.sharma@student.apex.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.STUDENT,
  });

  const parentSunilToken = generateAccessToken({
    userId: 'usr-parent-01',
    email: 'sunil.sharma@parent.apex.edu',
    schoolId: 'sch-apex-01',
    role: PlatformRole.PARENT,
  });

  const otherSchoolAdminToken = generateAccessToken({
    userId: 'usr-gw-admin',
    email: 'admin@greenwood.edu',
    schoolId: 'sch-greenwood-02',
    role: PlatformRole.SCHOOL_ADMIN,
  });

  let createdAssignmentId: string;
  let createdSubmissionId: string;
  let createdNoticeId: string;
  let createdFeeStructureId: string;

  // ==========================================================================
  // 1. TIMETABLES & CONFLICT MANAGEMENT
  // ==========================================================================

  it('1a. Teacher or Admin can schedule a timetable slot', async () => {
    const res = await request(app)
      .post('/api/v1/operations/timetables')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        className: 'Grade 10',
        sectionName: 'A',
        dayOfWeek: 2, // Tuesday
        startTime: '10:30',
        endTime: '11:20',
        subjectName: 'Chemistry Practical',
        roomNumber: 'Science Lab 2',
        teacherName: 'Dr. Julian Thorne',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roomNumber).toBe('Science Lab 2');
  });

  it('1b. Timetable slot rejects room double-booking collision with 409 ROOM_SCHEDULE_CONFLICT', async () => {
    // Attempt to book same room (Science Lab 2) at overlapping time on Tuesday
    const res = await request(app)
      .post('/api/v1/operations/timetables')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        className: 'Grade 9',
        sectionName: 'B',
        dayOfWeek: 2, // Tuesday
        startTime: '10:45',
        endTime: '11:30', // Overlaps 10:30-11:20
        subjectName: 'Biology Practical',
        roomNumber: 'Science Lab 2',
        teacherName: 'Mrs. Rebecca Vance',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROOM_SCHEDULE_CONFLICT');
  });

  it('1c. Timetable slot rejects teacher double-booking collision with 409 TEACHER_SCHEDULE_CONFLICT', async () => {
    // Attempt to book same teacher (Dr. Julian Thorne) in a different room at overlapping time on Tuesday
    const res = await request(app)
      .post('/api/v1/operations/timetables')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        className: 'Grade 11',
        sectionName: 'Sci',
        dayOfWeek: 2, // Tuesday
        startTime: '10:30',
        endTime: '11:20',
        subjectName: 'Advanced Physics',
        roomNumber: 'Room 301',
        teacherName: 'Dr. Julian Thorne',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('TEACHER_SCHEDULE_CONFLICT');
  });

  it('1d. Users can retrieve section weekly timetable sorted by day and time', async () => {
    const res = await request(app)
      .get('/api/v1/operations/timetables?className=Grade 10&sectionName=A')
      .set('Authorization', `Bearer ${studentAaravToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // ==========================================================================
  // 2. ASSIGNMENTS & HOMEWORK SUBMISSIONS
  // ==========================================================================

  it('2a. Teacher can create a new homework assignment', async () => {
    const res = await request(app)
      .post('/api/v1/operations/assignments')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        className: 'Grade 10',
        sectionName: 'A',
        subjectCode: 'MATH-10',
        title: 'Trigonometric Identities & Proofs',
        description: 'Prove standard trigonometric identities (Questions 1 to 10 from Chapter 8).',
        dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        maxMarks: 25,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Trigonometric');
    createdAssignmentId = res.body.data.id;
  });

  it('2b. Student assignment submission rejects files exceeding 10 MB with 400 FILE_TOO_LARGE', async () => {
    const res = await request(app)
      .post('/api/v1/operations/assignments/submit')
      .set('Authorization', `Bearer ${studentAaravToken}`)
      .send({
        assignmentId: createdAssignmentId,
        studentProfileId: 'stu-aarav-01',
        fileUrl: 'https://storage.edunexa.com/huge_file.pdf',
        fileName: 'huge_file.pdf',
        fileSizeBytes: 12 * 1024 * 1024, // 12 MB (Exceeds limit)
        fileType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('2c. Student can submit valid PDF assignment and system tracks timeliness', async () => {
    const res = await request(app)
      .post('/api/v1/operations/assignments/submit')
      .set('Authorization', `Bearer ${studentAaravToken}`)
      .send({
        assignmentId: createdAssignmentId,
        studentProfileId: 'stu-aarav-01',
        submissionText: 'All trigonometric derivation steps completed.',
        fileUrl: 'https://storage.edunexa.com/aarav_trig_hw.pdf',
        fileName: 'aarav_trig_hw.pdf',
        fileSizeBytes: 2 * 1024 * 1024, // 2 MB
        fileType: 'application/pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isLate).toBe(false);
    createdSubmissionId = res.body.data.id;
  });

  it('2d. Teacher can grade student assignment submission with marks and feedback', async () => {
    const res = await request(app)
      .patch('/api/v1/operations/assignments/grade')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        submissionId: createdSubmissionId,
        marksAwarded: 24,
        feedback: 'Clean step-by-step algebraic manipulation.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.marksAwarded).toBe(24);
  });

  // ==========================================================================
  // 3. LEARNING RESOURCES REPOSITORY
  // ==========================================================================

  it('3a. Teacher can publish a learning resource with size validation', async () => {
    const res = await request(app)
      .post('/api/v1/operations/resources')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectCode: 'MATH-10',
        className: 'Grade 10',
        title: 'Formula Handbook: Coordinate Geometry & Trigonometry',
        topic: 'Formula Reference',
        fileUrl: 'https://storage.edunexa.com/math_formula_handbook.pdf',
        fileType: 'PDF',
        fileSizeBytes: 3500000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.topic).toBe('Formula Reference');
  });

  it('3b. Students can list learning resources for their grade', async () => {
    const res = await request(app)
      .get('/api/v1/operations/resources?className=Grade 10')
      .set('Authorization', `Bearer ${studentAaravToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // ==========================================================================
  // 4. NOTICES, ANNOUNCEMENTS & TARGETED COMMUNICATIONS
  // ==========================================================================

  it('4a. School Admin can broadcast an audience-targeted notice (PARENTS_ONLY)', async () => {
    const res = await request(app)
      .post('/api/v1/operations/notices')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        title: 'Parent-Teacher Conference (PTM) Schedule - Term 2',
        content: 'Individual academic counseling sessions scheduled for this Saturday starting at 09:00 AM.',
        audience: 'PARENTS_ONLY',
        isUrgent: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdNoticeId = res.body.data.id;
  });

  it('4b. Audience Targeting: Parent receives PARENTS_ONLY notice', async () => {
    const res = await request(app)
      .get('/api/v1/operations/notices')
      .set('Authorization', `Bearer ${parentSunilToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.data.map((n: any) => n.title);
    expect(titles).toContain('Parent-Teacher Conference (PTM) Schedule - Term 2');
  });

  it('4c. Audience Targeting: Student is strictly shielded from PARENTS_ONLY and STAFF_ONLY notices', async () => {
    const res = await request(app)
      .get('/api/v1/operations/notices')
      .set('Authorization', `Bearer ${studentAaravToken}`);

    expect(res.status).toBe(200);
    const audiences = res.body.data.map((n: any) => n.audience);
    expect(audiences).not.toContain('PARENTS_ONLY');
    expect(audiences).not.toContain('STAFF_ONLY');
  });

  it('4d. Users can view scheduled school calendar events', async () => {
    const res = await request(app)
      .get('/api/v1/operations/events')
      .set('Authorization', `Bearer ${studentAaravToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // ==========================================================================
  // 5. IN-APP NOTIFICATIONS WORKFLOW
  // ==========================================================================

  it('5a. Student can retrieve their in-app notifications with unread count', async () => {
    const res = await request(app)
      .get('/api/v1/operations/notifications')
      .set('Authorization', `Bearer ${studentAaravToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('unreadCount');
    expect(res.body.data).toHaveProperty('notifications');
  });

  it('5b. Student can mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/operations/notifications/read-all')
      .set('Authorization', `Bearer ${studentAaravToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updated).toBe(true);
  });

  // ==========================================================================
  // 6. FINANCIAL OPERATIONS: FEE STRUCTURES, INVOICES, PAYMENTS & AUDIT
  // ==========================================================================

  it('6a. Accounts Officer can create a new fee structure head', async () => {
    const res = await request(app)
      .post('/api/v1/operations/fees/structures')
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({
        className: 'Grade 10',
        feeHead: 'Computer Science & AI Lab Fee',
        amount: 8500,
        frequency: 'TERM',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(8500);
    createdFeeStructureId = res.body.data.id;
  });

  it('6b. Simulated Fee Payment processes atomically and generates verifiable receipt', async () => {
    const res = await request(app)
      .post('/api/v1/operations/fees/payments')
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({
        invoiceId: 'inv-ananya-02',
        amountPaid: 15000,
        paymentMethod: 'UPI',
        transactionRef: 'UPI-SIM-77123-AXIS',
        isSimulated: true,
        notes: 'Simulated UPI payment at Accounts desk',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('receiptNumber');
    expect(res.body.data.receiptNumber).toMatch(/^REC-2026-\d{4}$/);
    expect(res.body.data.isSimulated).toBe(true);
    expect(res.body.data.amountPaid).toBe(15000);
  });

  it('6c. Fee payment rejects overpayment exceeding due balance with 400 OVERPAYMENT_REJECTED', async () => {
    const res = await request(app)
      .post('/api/v1/operations/fees/payments')
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({
        invoiceId: 'inv-ananya-02',
        amountPaid: 50000, // Exceeds remaining 10,000 balance
        paymentMethod: 'CASH',
        transactionRef: 'CSH-001',
        isSimulated: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OVERPAYMENT_REJECTED');
  });

  it('6d. Accounts Officer can apply fee concession with auditable rationale', async () => {
    const res = await request(app)
      .patch('/api/v1/operations/fees/concessions')
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({
        invoiceId: 'inv-ananya-02',
        concessionAmount: 5000,
        reason: 'Merit scholarship awarded by Academic Council for state rank',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.discountApplied).toBe(5000);
    expect(res.body.data.auditTrail.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.auditTrail[0].reason).toContain('Merit scholarship');
  });

  it('6e. Accounts Officer can process fee refund with reason', async () => {
    const res = await request(app)
      .patch('/api/v1/operations/fees/refunds')
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({
        invoiceId: 'inv-ananya-02',
        refundAmount: 2000,
        reason: 'Refund for cancelled optional excursion activity',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.auditTrail.some((a: any) => a.action === 'REFUND_PROCESSED')).toBe(true);
  });

  // ==========================================================================
  // 7. FINANCIAL PRIVACY & AUTHORIZED LEDGER EXPORT
  // ==========================================================================

  it('7a. Accounts Officer can view comprehensive financial summary report', async () => {
    const res = await request(app)
      .get('/api/v1/operations/fees/summary')
      .set('Authorization', `Bearer ${accountsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalInvoiced');
    expect(res.body.data).toHaveProperty('totalCollected');
    expect(res.body.data).toHaveProperty('collectionRatePercentage');
    expect(res.body.data.recentTransactions.length).toBeGreaterThanOrEqual(1);
  });

  it('7b. Financial Privacy: Student or Teacher querying financial summary returns 403 FORBIDDEN_ROLE', async () => {
    const resStudent = await request(app)
      .get('/api/v1/operations/fees/summary')
      .set('Authorization', `Bearer ${studentAaravToken}`);

    expect(resStudent.status).toBe(403);
    expect(resStudent.body.error.code).toBe('FORBIDDEN_ROLE');

    const resTeacher = await request(app)
      .get('/api/v1/operations/fees/summary')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(resTeacher.status).toBe(403);
    expect(resTeacher.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('7c. Authorized Accounts personnel can export fee ledger CSV report', async () => {
    const res = await request(app)
      .get('/api/v1/operations/fees/export-csv')
      .set('Authorization', `Bearer ${accountsToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Invoice Number');
    expect(res.text).toContain('INV-2026-0412');
  });

  it('7d. Unauthorized role (Parent) attempting to export fee ledger CSV returns 403 FORBIDDEN_ROLE', async () => {
    const res = await request(app)
      .get('/api/v1/operations/fees/export-csv')
      .set('Authorization', `Bearer ${parentSunilToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('7e. Cross-tenant isolation: Admin from another school has zero visibility into School A financial summary', async () => {
    const res = await request(app)
      .get('/api/v1/operations/fees/summary')
      .set('Authorization', `Bearer ${otherSchoolAdminToken}`);

    expect(res.status).toBe(200);
    // School B has 0 invoices in School A's scope
    expect(res.body.data.invoicesCount).toBe(0);
    expect(res.body.data.totalInvoiced).toBe(0);
  });
});
