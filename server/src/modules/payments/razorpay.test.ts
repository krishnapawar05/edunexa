import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole, PaymentTxnStatus, FeePaymentStatus } from '@edunexa/shared';
import { prisma } from '../../config/db.js';
import { razorpayService } from '../../services/razorpay.service.js';

describe('EduNexa Razorpay Payment Gateway Integration Test Suite', () => {
  const app = createApp();

  let schoolA: any;
  let schoolB: any;
  let testClass: any;
  let testFeeStructure: any;
  let studentUser: any;
  let studentProfile: any;
  let parentUser: any;
  let parentMembership: any;
  let unlinkedParentUser: any;
  let unlinkedParentMembership: any;
  let accountsUser: any;
  let schoolAdminUser: any;
  let crossTenantUser: any;

  let parentToken: string;
  let unlinkedParentToken: string;
  let studentToken: string;
  let accountsToken: string;
  let schoolAdminToken: string;
  let crossTenantToken: string;

  let testInvoice1: any;
  let testInvoice2: any;

  beforeAll(async () => {
    // 1. Setup School A (Apex Academy)
    schoolA = await prisma.school.upsert({
      where: { code: 'SCH-RZP-A' },
      update: {},
      create: {
        code: 'SCH-RZP-A',
        slug: 'rzp-academy-a',
        name: 'Apex Razorpay Academy',
        email: 'info@rzp-academy.edu',
        phone: '+91 9876543210',
        address: '100 Gateway Way',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        status: 'ACTIVE',
      },
    });

    // 2. Setup School B (Cross-Tenant School)
    schoolB = await prisma.school.upsert({
      where: { code: 'SCH-RZP-B' },
      update: {},
      create: {
        code: 'SCH-RZP-B',
        slug: 'rzp-academy-b',
        name: 'Horizon Razorpay School',
        email: 'info@rzp-horizon.edu',
        phone: '+91 9876543211',
        address: '200 Isolation Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        status: 'ACTIVE',
      },
    });

    // 3. Class and Fee Structure
    testClass = await prisma.class.upsert({
      where: {
        schoolId_code: {
          schoolId: schoolA.id,
          code: 'CLS-RZP-10',
        },
      },
      update: {},
      create: {
        schoolId: schoolA.id,
        name: 'Grade 10 RZP',
        code: 'CLS-RZP-10',
      },
    });

    testFeeStructure = await prisma.feeStructure.create({
      data: {
        schoolId: schoolA.id,
        classId: testClass.id,
        feeHead: 'Tuition & Development Fee',
        amount: 25000,
        frequency: 'TERM',
      },
    });

    // 4. Users & Memberships
    studentUser = await prisma.user.upsert({
      where: { email: 'student.rzp@apex.edu' },
      update: {},
      create: {
        email: 'student.rzp@apex.edu',
        passwordHash: 'dummy-hash',
        firstName: 'Rahul',
        lastName: 'Verma',
        phone: '+91 9123456780',
      },
    });

    const studentMembership = await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: studentUser.id,
          schoolId: schoolA.id,
          role: PlatformRole.STUDENT,
        },
      },
      update: {},
      create: {
        userId: studentUser.id,
        schoolId: schoolA.id,
        role: PlatformRole.STUDENT,
      },
    });

    studentProfile = await prisma.studentProfile.upsert({
      where: { admissionNumber: 'ADM-RZP-001' },
      update: {},
      create: {
        membershipId: studentMembership.id,
        admissionNumber: 'ADM-RZP-001',
        dateOfBirth: new Date('2010-05-15'),
        gender: 'Male',
        emergencyPhone: '+91 9123456780',
      },
    });

    // Parent User linked to student
    parentUser = await prisma.user.upsert({
      where: { email: 'parent.rzp@apex.edu' },
      update: {},
      create: {
        email: 'parent.rzp@apex.edu',
        passwordHash: 'dummy-hash',
        firstName: 'Suresh',
        lastName: 'Verma',
        phone: '+91 9123456781',
      },
    });

    parentMembership = await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: parentUser.id,
          schoolId: schoolA.id,
          role: PlatformRole.PARENT,
        },
      },
      update: {},
      create: {
        userId: parentUser.id,
        schoolId: schoolA.id,
        role: PlatformRole.PARENT,
      },
    });

    await prisma.parentStudentLink.upsert({
      where: {
        parentMembershipId_studentProfileId: {
          parentMembershipId: parentMembership.id,
          studentProfileId: studentProfile.id,
        },
      },
      update: {},
      create: {
        parentMembershipId: parentMembership.id,
        studentProfileId: studentProfile.id,
        relationship: 'Father',
        isPrimaryContact: true,
      },
    });

    // Unlinked Parent (belongs to school A but has NO link to this student)
    unlinkedParentUser = await prisma.user.upsert({
      where: { email: 'unlinked.parent@apex.edu' },
      update: {},
      create: {
        email: 'unlinked.parent@apex.edu',
        passwordHash: 'dummy-hash',
        firstName: 'Vikram',
        lastName: 'Kapoor',
      },
    });

    unlinkedParentMembership = await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: unlinkedParentUser.id,
          schoolId: schoolA.id,
          role: PlatformRole.PARENT,
        },
      },
      update: {},
      create: {
        userId: unlinkedParentUser.id,
        schoolId: schoolA.id,
        role: PlatformRole.PARENT,
      },
    });

    // Accounts User
    accountsUser = await prisma.user.upsert({
      where: { email: 'accounts.rzp@apex.edu' },
      update: {},
      create: {
        email: 'accounts.rzp@apex.edu',
        passwordHash: 'dummy-hash',
        firstName: 'Ramesh',
        lastName: 'Gupta',
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: accountsUser.id,
          schoolId: schoolA.id,
          role: PlatformRole.ACCOUNTS,
        },
      },
      update: {},
      create: {
        userId: accountsUser.id,
        schoolId: schoolA.id,
        role: PlatformRole.ACCOUNTS,
      },
    });

    // School Admin
    schoolAdminUser = await prisma.user.upsert({
      where: { email: 'admin.rzp@apex.edu' },
      update: {},
      create: {
        email: 'admin.rzp@apex.edu',
        passwordHash: 'dummy-hash',
        firstName: 'Admin',
        lastName: 'Officer',
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: schoolAdminUser.id,
          schoolId: schoolA.id,
          role: PlatformRole.SCHOOL_ADMIN,
        },
      },
      update: {},
      create: {
        userId: schoolAdminUser.id,
        schoolId: schoolA.id,
        role: PlatformRole.SCHOOL_ADMIN,
      },
    });

    // Cross-tenant User (School B)
    crossTenantUser = await prisma.user.upsert({
      where: { email: 'admin.rzp@horizon.edu' },
      update: {},
      create: {
        email: 'admin.rzp@horizon.edu',
        passwordHash: 'dummy-hash',
        firstName: 'Horizon',
        lastName: 'Admin',
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: crossTenantUser.id,
          schoolId: schoolB.id,
          role: PlatformRole.SCHOOL_ADMIN,
        },
      },
      update: {},
      create: {
        userId: crossTenantUser.id,
        schoolId: schoolB.id,
        role: PlatformRole.SCHOOL_ADMIN,
      },
    });

    // Generate JWT access tokens
    parentToken = generateAccessToken({
      userId: parentUser.id,
      email: parentUser.email,
      schoolId: schoolA.id,
      role: PlatformRole.PARENT,
    });

    unlinkedParentToken = generateAccessToken({
      userId: unlinkedParentUser.id,
      email: unlinkedParentUser.email,
      schoolId: schoolA.id,
      role: PlatformRole.PARENT,
    });

    studentToken = generateAccessToken({
      userId: studentUser.id,
      email: studentUser.email,
      schoolId: schoolA.id,
      role: PlatformRole.STUDENT,
    });

    accountsToken = generateAccessToken({
      userId: accountsUser.id,
      email: accountsUser.email,
      schoolId: schoolA.id,
      role: PlatformRole.ACCOUNTS,
    });

    schoolAdminToken = generateAccessToken({
      userId: schoolAdminUser.id,
      email: schoolAdminUser.email,
      schoolId: schoolA.id,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    crossTenantToken = generateAccessToken({
      userId: crossTenantUser.id,
      email: crossTenantUser.email,
      schoolId: schoolB.id,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    // Create Test Invoices
    testInvoice1 = await prisma.feeInvoice.create({
      data: {
        feeStructureId: testFeeStructure.id,
        studentProfileId: studentProfile.id,
        invoiceNumber: `INV-RZP-${Date.now().toString().slice(-6)}`,
        amountDue: 25000,
        amountPaid: 0,
        dueDate: new Date('2026-12-31'),
        status: FeePaymentStatus.UNPAID,
      },
    });

    testInvoice2 = await prisma.feeInvoice.create({
      data: {
        feeStructureId: testFeeStructure.id,
        studentProfileId: studentProfile.id,
        invoiceNumber: `INV-RZP-${(Date.now() + 1).toString().slice(-6)}`,
        amountDue: 10000,
        amountPaid: 10000,
        dueDate: new Date('2026-12-31'),
        status: FeePaymentStatus.PAID,
      },
    });
  });

  // ==========================================================================
  // 1. GATEWAY CONFIG & METADATA
  // ==========================================================================

  it('1a. Authenticated user can fetch Razorpay client configuration without secret leakage', async () => {
    const res = await request(app)
      .get('/api/v1/payments/config')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('keyId');
    expect(res.body.data.mode).toBe('test');
    expect(res.body.data.currency).toBe('INR');
    expect(res.body.data).not.toHaveProperty('keySecret');
    expect(res.body.data).not.toHaveProperty('webhookSecret');
  });

  // ==========================================================================
  // 2. ORDER CREATION & ACCESS CONTROL
  // ==========================================================================

  let createdOrderId: string;
  let targetAmountPaise: number;

  it('2a. Parent can create Razorpay Order for linked child invoice and amount converts to paise', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: testInvoice1.id,
        amount: 15000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toMatch(/^order_/);
    expect(res.body.data.amount).toBe(1500000); // 15000 * 100 paise
    expect(res.body.data.amountInRupees).toBe(15000);
    expect(res.body.data.currency).toBe('INR');
    expect(res.body.data.invoiceNumber).toBe(testInvoice1.invoiceNumber);
    expect(res.body.data.studentName).toContain('Rahul Verma');

    createdOrderId = res.body.data.orderId;
    targetAmountPaise = res.body.data.amount;

    // Verify PaymentTransaction created in PostgreSQL
    const txn = await prisma.paymentTransaction.findUnique({
      where: { orderId: createdOrderId },
    });
    expect(txn).toBeDefined();
    expect(txn?.status).toBe(PaymentTxnStatus.CREATED);
    expect(txn?.amount).toBe(15000);
    expect(txn?.schoolId).toBe(schoolA.id);
  });

  it('2b. Order creation rejects overpayment exceeding due balance with 400 OVERPAYMENT_REJECTED', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: testInvoice1.id,
        amount: 35000, // Exceeds 25000 total balance
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OVERPAYMENT_REJECTED');
  });

  it('2c. Order creation rejects already settled invoice with 400 INVOICE_ALREADY_PAID', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: testInvoice2.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVOICE_ALREADY_PAID');
  });

  it('2d. Horizontal privilege violation: Unlinked Parent cannot create order for non-ward student invoice (403)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${unlinkedParentToken}`)
      .send({
        invoiceId: testInvoice1.id,
        amount: 5000,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_RESOURCE');
  });

  it('2e. Cross-tenant isolation: User from School B cannot create order for School A invoice (404)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${crossTenantToken}`)
      .send({
        invoiceId: testInvoice1.id,
        amount: 5000,
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  // ==========================================================================
  // 3. CRYPTOGRAPHIC SIGNATURE VERIFICATION & ATOMIC SETTLEMENT
  // ==========================================================================

  const testPaymentId = `pay_test_${Date.now().toString().slice(-8)}`;

  it('3a. Payment verification rejects tampered / invalid HMAC signature with 400 INVALID_PAYMENT_SIGNATURE', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: testInvoice1.id,
        orderId: createdOrderId,
        paymentId: testPaymentId,
        signature: 'invalid_tampered_signature_1234567890abcdef',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAYMENT_SIGNATURE');

    // Confirm transaction status is marked FAILED in PostgreSQL
    const txn = await prisma.paymentTransaction.findUnique({
      where: { orderId: createdOrderId },
    });
    expect(txn?.status).toBe(PaymentTxnStatus.FAILED);
  });

  it('3b. Payment verification succeeds with valid HMAC signature and settles PostgreSQL invoice atomically', async () => {
    // Generate valid HMAC-SHA256 signature
    const validSignature = razorpayService.generateTestSignature(createdOrderId, testPaymentId);

    const res = await request(app)
      .post('/api/v1/payments/razorpay/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: testInvoice1.id,
        orderId: createdOrderId,
        paymentId: testPaymentId,
        signature: validSignature,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(createdOrderId);
    expect(res.body.data.paymentId).toBe(testPaymentId);
    expect(res.body.data.amountPaid).toBe(15000);
    expect(res.body.data.invoiceStatus).toBe(FeePaymentStatus.PARTIALLY_PAID);
    expect(res.body.data.remainingBalance).toBe(10000);
    expect(res.body.data).toHaveProperty('receiptNumber');
    expect(res.body.data.receiptNumber).toMatch(/^REC-2026-\d{4}$/);

    // Verify PostgreSQL persistence
    const updatedInvoice = await prisma.feeInvoice.findUnique({
      where: { id: testInvoice1.id },
      include: { payments: true },
    });
    expect(updatedInvoice?.amountPaid).toBe(15000);
    expect(updatedInvoice?.status).toBe(FeePaymentStatus.PARTIALLY_PAID);

    const feePayment = updatedInvoice?.payments.find((p) => p.paymentId === testPaymentId);
    expect(feePayment).toBeDefined();
    expect(feePayment?.isSimulated).toBe(false);
    expect(feePayment?.paymentMethod).toBe('RAZORPAY_ONLINE');

    const updatedTxn = await prisma.paymentTransaction.findUnique({
      where: { orderId: createdOrderId },
    });
    expect(updatedTxn?.status).toBe(PaymentTxnStatus.SUCCESS);
    expect(updatedTxn?.receiptNumber).toBe(res.body.data.receiptNumber);
  });

  it('3c. Idempotency: Re-submitting identical verification does not double-credit balance or duplicate receipts', async () => {
    const validSignature = razorpayService.generateTestSignature(createdOrderId, testPaymentId);

    const res = await request(app)
      .post('/api/v1/payments/razorpay/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: testInvoice1.id,
        orderId: createdOrderId,
        paymentId: testPaymentId,
        signature: validSignature,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify invoice amountPaid was NOT increased again
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: testInvoice1.id },
    });
    expect(invoice?.amountPaid).toBe(15000); // Still 15,000, not 30,000
  });

  // ==========================================================================
  // 4. WEBHOOKS & ASYNCHRONOUS RECONCILIATION
  // ==========================================================================

  let webhookOrderId: string;
  let webhookPaymentId: string;

  it('4a. Webhook rejects requests with invalid x-razorpay-signature with 400 INVALID_WEBHOOK_SIGNATURE', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/webhook')
      .set('x-razorpay-signature', 'forged_webhook_signature')
      .send({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_dummy' } } },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('4b. Webhook successfully processes payment.captured and marks transaction paid', async () => {
    // First create an order via API
    const orderRes = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: testInvoice1.id,
        amount: 10000, // Pays the rest of the 10000 remaining
      });

    expect(orderRes.status).toBe(201);
    webhookOrderId = orderRes.body.data.orderId;
    webhookPaymentId = `pay_wh_${Date.now().toString().slice(-8)}`;

    const webhookBody = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: webhookPaymentId,
            order_id: webhookOrderId,
            amount: 1000000,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
          },
        },
      },
    };

    const rawString = JSON.stringify(webhookBody);
    const validSignature = razorpayService.generateTestWebhookSignature(rawString);

    const res = await request(app)
      .post('/api/v1/payments/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validSignature)
      .send(webhookBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify invoice is now fully PAID (15,000 + 10,000 = 25,000)
    const finalizedInvoice = await prisma.feeInvoice.findUnique({
      where: { id: testInvoice1.id },
    });
    expect(finalizedInvoice?.amountPaid).toBe(25000);
    expect(finalizedInvoice?.status).toBe(FeePaymentStatus.PAID);

    const txn = await prisma.paymentTransaction.findUnique({
      where: { orderId: webhookOrderId },
    });
    expect(txn?.status).toBe(PaymentTxnStatus.SUCCESS);
  });

  it('4c. Webhook handles payment.failed and logs failure in PostgreSQL', async () => {
    // Create new invoice and order for failure test
    const failInvoice = await prisma.feeInvoice.create({
      data: {
        feeStructureId: testFeeStructure.id,
        studentProfileId: studentProfile.id,
        invoiceNumber: `INV-FAIL-${Date.now().toString().slice(-6)}`,
        amountDue: 5000,
        amountPaid: 0,
        dueDate: new Date('2026-12-31'),
        status: FeePaymentStatus.UNPAID,
      },
    });

    const orderRes = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        invoiceId: failInvoice.id,
        amount: 5000,
      });

    const failedPaymentId = `pay_failed_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const failedOrderId = orderRes.body.data.orderId;
    const webhookBody = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: failedPaymentId,
            order_id: failedOrderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Payment was declined by issuing bank',
          },
        },
      },
    };

    const rawString = JSON.stringify(webhookBody);
    const validSignature = razorpayService.generateTestWebhookSignature(rawString);

    const res = await request(app)
      .post('/api/v1/payments/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validSignature)
      .send(webhookBody);

    expect(res.status).toBe(200);

    const txn = await prisma.paymentTransaction.findUnique({
      where: { orderId: failedOrderId },
    });
    expect(txn?.status).toBe(PaymentTxnStatus.FAILED);
    expect(txn?.errorCode).toBe('BAD_REQUEST_ERROR');
    expect(txn?.errorDescription).toContain('declined by issuing bank');
  });

  // ==========================================================================
  // 5. TRANSACTIONS LISTING & AUDIT HISTORY
  // ==========================================================================

  it('5a. Accounts Officer can retrieve school payment transactions history', async () => {
    const res = await request(app)
      .get('/api/v1/payments/transactions')
      .set('Authorization', `Bearer ${accountsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const hasCreatedOrder = res.body.data.some((t: any) => t.orderId === createdOrderId);
    expect(hasCreatedOrder).toBe(true);
  });

  it('5b. Parent can retrieve transactions for their linked child', async () => {
    const res = await request(app)
      .get('/api/v1/payments/transactions')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('5c. Official printable receipt can be fetched by receiptNumber', async () => {
    // Get receipt number from settled transaction
    const txn = await prisma.paymentTransaction.findUnique({
      where: { orderId: createdOrderId },
    });

    const res = await request(app)
      .get(`/api/v1/payments/receipts/${txn?.receiptNumber}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.receiptNumber).toBe(txn?.receiptNumber);
    expect(res.body.data.amountPaid).toBe(15000);
    expect(res.body.data.isSimulated).toBe(false);
    expect(res.body.data.studentName).toContain('Rahul Verma');
    expect(res.body.data.schoolName).toBe('Apex Razorpay Academy');
  });
});
