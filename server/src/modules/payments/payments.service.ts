import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { env } from '../../config/env.js';
import { razorpayService } from '../../services/razorpay.service.js';
import {
  PlatformRole,
  CreateRazorpayOrderDTO,
  VerifyRazorpayPaymentDTO,
  RazorpayOrderResponse,
  RazorpayVerifyResponse,
  PaymentTransactionRecord,
  FeePaymentStatus,
  PaymentTxnStatus,
} from '@edunexa/shared';

export class PaymentsService {
  /**
   * Create an official Razorpay Order for a fee invoice.
   */
  async createRazorpayOrder(
    schoolId: string,
    userId: string,
    userRole: string,
    data: CreateRazorpayOrderDTO
  ): Promise<RazorpayOrderResponse> {
    // 1. Locate fee invoice
    const invoice = await prisma.feeInvoice.findFirst({
      where: {
        OR: [{ id: data.invoiceId }, { invoiceNumber: data.invoiceId }],
        feeStructure: { schoolId },
      },
      include: {
        feeStructure: { include: { school: true, class: true } },
        student: {
          include: {
            membership: { include: { user: true } },
            parentLinks: {
              include: {
                parentMembership: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(
        `Fee invoice '${data.invoiceId}' not found in the current school tenant.`,
        404,
        'RECORD_NOT_FOUND'
      );
    }

    // 2. Access control and horizontal privilege check
    if (userRole === PlatformRole.PARENT) {
      const isLinkedParent = invoice.student.parentLinks.some(
        (link: any) => link.parentMembership.userId === userId
      );

      if (!isLinkedParent) {
        throw new AppError(
          'Horizontal privilege violation: Parents may only pay invoices for their registered children.',
          403,
          'FORBIDDEN_RESOURCE'
        );
      }
    } else if (userRole === PlatformRole.STUDENT) {
      if (invoice.student.membership.userId !== userId) {
        throw new AppError(
          'Access violation: Students may only access their personal fee invoices.',
          403,
          'FORBIDDEN_RESOURCE'
        );
      }
    }

    // 3. Balance verification
    const remainingDue = Math.max(
      0,
      invoice.amountDue - invoice.amountPaid - invoice.discountApplied
    );

    if (remainingDue <= 0) {
      throw new AppError(
        `Invoice '${invoice.invoiceNumber}' is already fully paid with zero balance outstanding.`,
        400,
        'INVOICE_ALREADY_PAID'
      );
    }

    let targetAmount = remainingDue;
    if (data.amount !== undefined && data.amount !== null) {
      if (data.amount <= 0) {
        throw new AppError('Payment amount must be greater than zero.', 400, 'INVALID_AMOUNT');
      }
      if (data.amount > remainingDue) {
        throw new AppError(
          `Payment amount (₹ ${data.amount}) exceeds remaining outstanding balance of ₹ ${remainingDue}.`,
          400,
          'OVERPAYMENT_REJECTED'
        );
      }
      targetAmount = data.amount;
    }

    // 4. Create Razorpay order (amount in paise)
    const amountInPaise = Math.round(targetAmount * 100);
    const receiptTag = `INV-${invoice.invoiceNumber.slice(-6)}-${Date.now().toString().slice(-4)}`;

    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt: receiptTag,
      notes: {
        schoolId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        studentProfileId: invoice.studentProfileId,
        paidByUserId: userId,
        ...(data.notes || {}),
      },
    });

    // 5. Persist PaymentTransaction record
    await prisma.paymentTransaction.create({
      data: {
        schoolId,
        feeInvoiceId: invoice.id,
        userId,
        orderId: rzpOrder.orderId,
        amount: targetAmount,
        currency: 'INR',
        status: PaymentTxnStatus.CREATED,
        metadata: {
          isMock: rzpOrder.isMock,
          userRole,
          receiptTag,
          originalAmountDue: invoice.amountDue,
          remainingDueBeforePayment: remainingDue,
        },
      },
    });

    const studentName = `${invoice.student.membership.user.firstName} ${invoice.student.membership.user.lastName}`.trim();
    const schoolName = invoice.feeStructure.school.name;

    return {
      orderId: rzpOrder.orderId,
      amount: amountInPaise,
      amountInRupees: targetAmount,
      currency: 'INR',
      keyId: env.razorpayKeyId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentName,
      studentAdmissionNo: invoice.student.admissionNumber,
      schoolName,
      notes: {
        feeHead: invoice.feeStructure.feeHead,
        className: invoice.feeStructure.class.name,
      },
    };
  }

  /**
   * Verify Razorpay Payment Signature and execute atomic database settlement.
   */
  async verifyRazorpayPayment(
    schoolId: string,
    userId: string,
    data: VerifyRazorpayPaymentDTO
  ): Promise<RazorpayVerifyResponse> {
    const { invoiceId, orderId, paymentId, signature } = data;

    // 1. Cryptographically verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValidSignature) {
      await prisma.paymentTransaction.updateMany({
        where: { orderId },
        data: {
          status: PaymentTxnStatus.FAILED,
          paymentId,
          signature,
          errorCode: 'INVALID_PAYMENT_SIGNATURE',
          errorDescription: 'Razorpay cryptographic HMAC-SHA256 signature verification failed.',
        },
      });

      throw new AppError(
        'Razorpay cryptographic signature verification failed. Tampered or invalid payment payload.',
        400,
        'INVALID_PAYMENT_SIGNATURE'
      );
    }

    // 2. Perform atomic database settlement
    return prisma.$transaction(async (tx: any) => {
      // Find the payment transaction
      const txn = await tx.paymentTransaction.findUnique({
        where: { orderId },
        include: {
          feeInvoice: {
            include: {
              feeStructure: { include: { school: true, class: true } },
              student: { include: { membership: { include: { user: true } } } },
            },
          },
        },
      });

      if (!txn) {
        throw new AppError(
          `Payment transaction for order '${orderId}' not found in database.`,
          404,
          'TRANSACTION_NOT_FOUND'
        );
      }

      // Check tenant scoping
      if (txn.schoolId !== schoolId && txn.feeInvoice.feeStructure.schoolId !== schoolId) {
        throw new AppError('Cross-tenant payment verification violation.', 403, 'FORBIDDEN_RESOURCE');
      }

      const invoice = txn.feeInvoice;

      // Idempotency: If transaction is already marked SUCCESS, return existing receipt
      if (txn.status === PaymentTxnStatus.SUCCESS && txn.receiptNumber) {
        const remaining = Math.max(0, invoice.amountDue - invoice.amountPaid - invoice.discountApplied);
        return {
          success: true,
          orderId: txn.orderId,
          paymentId: txn.paymentId || paymentId,
          receiptNumber: txn.receiptNumber,
          amountPaid: txn.amount,
          invoiceStatus: invoice.status as any,
          remainingBalance: remaining,
          paidAt: txn.updatedAt.toISOString(),
          schoolName: invoice.feeStructure.school.name,
          studentName: `${invoice.student.membership.user.firstName} ${invoice.student.membership.user.lastName}`.trim(),
          invoiceNumber: invoice.invoiceNumber,
        };
      }

      // Calculate new paid amount and status
      const paymentAmount = txn.amount;
      const newAmountPaid = invoice.amountPaid + paymentAmount;
      const isFullyPaid = newAmountPaid + invoice.discountApplied >= invoice.amountDue;
      const newStatus = isFullyPaid ? FeePaymentStatus.PAID : FeePaymentStatus.PARTIALLY_PAID;
      const remainingBalance = Math.max(0, invoice.amountDue - newAmountPaid - invoice.discountApplied);

      const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Update audit trail
      const auditTrail = Array.isArray(invoice.auditTrail) ? [...(invoice.auditTrail as any[])] : [];
      auditTrail.unshift({
        action: 'RAZORPAY_PAYMENT_CAPTURED',
        amount: paymentAmount,
        authorizedByUserId: userId,
        orderId,
        paymentId,
        receiptNumber,
        timestamp: new Date().toISOString(),
        verified: true,
      });

      // Update invoice
      await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus as any,
          auditTrail,
        },
      });

      // Create FeePayment record
      await tx.feePayment.create({
        data: {
          feeInvoiceId: invoice.id,
          receiptNumber,
          amountPaid: paymentAmount,
          paymentMethod: 'RAZORPAY_ONLINE',
          transactionRef: paymentId,
          orderId,
          paymentId,
          isSimulated: false,
          collectedBy: userId,
          notes: `Official Razorpay Payment Settlement. Order: ${orderId}, Payment ID: ${paymentId}`,
        },
      });

      // Update PaymentTransaction to SUCCESS
      await tx.paymentTransaction.update({
        where: { id: txn.id },
        data: {
          status: PaymentTxnStatus.SUCCESS,
          paymentId,
          signature,
          paymentMethod: 'RAZORPAY_ONLINE',
          receiptNumber,
          updatedAt: new Date(),
        },
      });

      const studentName = `${invoice.student.membership.user.firstName} ${invoice.student.membership.user.lastName}`.trim();
      const schoolName = invoice.feeStructure.school.name;

      return {
        success: true,
        orderId,
        paymentId,
        receiptNumber,
        amountPaid: paymentAmount,
        invoiceStatus: newStatus as any,
        remainingBalance,
        paidAt: new Date().toISOString(),
        schoolName,
        studentName,
        invoiceNumber: invoice.invoiceNumber,
      };
    });
  }

  /**
   * Handle Razorpay Webhooks idempotently.
   */
  async handleWebhook(rawBody: string | Buffer, signature: string, payload: any): Promise<any> {
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new AppError(
        'Razorpay webhook signature verification failed.',
        400,
        'INVALID_WEBHOOK_SIGNATURE'
      );
    }

    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    if (!orderId) {
      return { received: true, ignored: true, reason: 'No order_id in event payload' };
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      const txn = await prisma.paymentTransaction.findUnique({
        where: { orderId },
        include: { feeInvoice: true },
      });

      if (!txn) {
        return { received: true, status: 'ORDER_NOT_FOUND_LOCALLY' };
      }

      if (txn.status === PaymentTxnStatus.SUCCESS) {
        return { received: true, status: 'ALREADY_SETTLED_IDEMPOTENT' };
      }

      // Settle payment idempotently
      await prisma.$transaction(async (tx: any) => {
        const invoice = await tx.feeInvoice.findUnique({
          where: { id: txn.feeInvoiceId },
        });

        if (!invoice) return;

        const paymentAmount = txn.amount;
        const newAmountPaid = invoice.amountPaid + paymentAmount;
        const newStatus =
          newAmountPaid + invoice.discountApplied >= invoice.amountDue
            ? FeePaymentStatus.PAID
            : FeePaymentStatus.PARTIALLY_PAID;

        const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const auditTrail = Array.isArray(invoice.auditTrail) ? [...(invoice.auditTrail as any[])] : [];
        auditTrail.unshift({
          action: 'RAZORPAY_WEBHOOK_PAYMENT_CAPTURED',
          amount: paymentAmount,
          orderId,
          paymentId: paymentId || txn.paymentId,
          receiptNumber,
          timestamp: new Date().toISOString(),
        });

        await tx.feeInvoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newAmountPaid,
            status: newStatus as any,
            auditTrail,
          },
        });

        await tx.feePayment.create({
          data: {
            feeInvoiceId: invoice.id,
            receiptNumber,
            amountPaid: paymentAmount,
            paymentMethod: 'RAZORPAY_WEBHOOK',
            transactionRef: paymentId || orderId,
            orderId,
            paymentId,
            isSimulated: false,
            notes: `Asynchronously settled via Razorpay Webhook [${event}]`,
          },
        });

        await tx.paymentTransaction.update({
          where: { id: txn.id },
          data: {
            status: PaymentTxnStatus.SUCCESS,
            paymentId: paymentId || txn.paymentId,
            receiptNumber,
            paymentMethod: paymentEntity?.method || 'RAZORPAY_WEBHOOK',
            updatedAt: new Date(),
          },
        });
      });

      return { received: true, settled: true, orderId };
    } else if (event === 'payment.failed') {
      const errorCode = paymentEntity?.error_code || 'PAYMENT_FAILED';
      const errorDescription = paymentEntity?.error_description || 'Payment execution failed';

      await prisma.paymentTransaction.updateMany({
        where: { orderId },
        data: {
          status: PaymentTxnStatus.FAILED,
          paymentId,
          errorCode,
          errorDescription,
          updatedAt: new Date(),
        },
      });

      return { received: true, status: 'PAYMENT_FAILURE_LOGGED', orderId };
    }

    return { received: true, unhandledEvent: event };
  }

  /**
   * Retrieve payment transaction history for the authenticated user and tenant.
   */
  async getPaymentTransactions(
    schoolId: string,
    userId: string,
    userRole: string,
    invoiceId?: string
  ): Promise<PaymentTransactionRecord[]> {
    let whereCondition: any = { schoolId };

    if (invoiceId) {
      whereCondition.feeInvoiceId = invoiceId;
    }

    if (userRole === PlatformRole.PARENT) {
      // Find parent's children
      const parentMembership = await prisma.userMembership.findFirst({
        where: { userId, schoolId, role: PlatformRole.PARENT },
        include: { parentLinks: true },
      });

      const allowedStudentProfileIds = (parentMembership?.parentLinks || []).map(
        (l: any) => l.studentProfileId
      );

      whereCondition.feeInvoice = {
        studentProfileId: { in: allowedStudentProfileIds },
      };
    } else if (userRole === PlatformRole.STUDENT) {
      const studentProfile = await prisma.studentProfile.findFirst({
        where: { membership: { userId, schoolId } },
      });

      whereCondition.feeInvoice = {
        studentProfileId: studentProfile?.id || 'none',
      };
    }

    const txns = await prisma.paymentTransaction.findMany({
      where: whereCondition,
      include: {
        feeInvoice: {
          include: {
            student: { include: { membership: { include: { user: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return txns.map((t: any) => ({
      id: t.id,
      schoolId: t.schoolId,
      feeInvoiceId: t.feeInvoiceId,
      userId: t.userId,
      orderId: t.orderId,
      paymentId: t.paymentId,
      amount: t.amount,
      currency: t.currency,
      status: t.status as any,
      paymentMethod: t.paymentMethod,
      receiptNumber: t.receiptNumber,
      invoiceNumber: t.feeInvoice?.invoiceNumber,
      studentName: t.feeInvoice?.student?.membership?.user
        ? `${t.feeInvoice.student.membership.user.firstName} ${t.feeInvoice.student.membership.user.lastName}`.trim()
        : undefined,
      errorCode: t.errorCode,
      errorDescription: t.errorDescription,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  }

  /**
   * Get full printable receipt by receiptNumber or paymentId.
   */
  async getReceipt(
    schoolId: string,
    identifier: string,
    userId: string,
    userRole: string
  ): Promise<any> {
    const payment = await prisma.feePayment.findFirst({
      where: {
        OR: [{ receiptNumber: identifier }, { id: identifier }, { transactionRef: identifier }],
        invoice: { feeStructure: { schoolId } },
      },
      include: {
        invoice: {
          include: {
            feeStructure: { include: { school: true, class: true } },
            student: { include: { membership: { include: { user: true } } } },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError(`Receipt '${identifier}' not found.`, 404, 'RECORD_NOT_FOUND');
    }

    const inv = payment.invoice;

    // RBAC validation
    if (userRole === PlatformRole.PARENT) {
      const parentLink = await prisma.parentStudentLink.findFirst({
        where: {
          parentMembership: { userId, schoolId },
          studentProfileId: inv.studentProfileId,
        },
      });
      if (!parentLink) {
        throw new AppError('Horizontal privilege violation.', 403, 'FORBIDDEN_RESOURCE');
      }
    } else if (userRole === PlatformRole.STUDENT) {
      if (inv.student.membership.userId !== userId) {
        throw new AppError('Horizontal privilege violation.', 403, 'FORBIDDEN_RESOURCE');
      }
    }

    return {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.id,
      transactionRef: payment.transactionRef,
      orderId: payment.orderId,
      date: payment.paidAt.toISOString().split('T')[0],
      paidAt: payment.paidAt.toISOString(),
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      isSimulated: payment.isSimulated,
      notes: payment.notes,
      invoiceNumber: inv.invoiceNumber,
      feeHead: inv.feeStructure.feeHead,
      className: inv.feeStructure.class.name,
      schoolName: inv.feeStructure.school.name,
      studentName: `${inv.student.membership.user.firstName} ${inv.student.membership.user.lastName}`.trim(),
      admissionNumber: inv.student.admissionNumber,
      balanceRemaining: Math.max(0, inv.amountDue - inv.amountPaid - inv.discountApplied),
    };
  }
}

export const paymentsService = new PaymentsService();
