import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC / WEBHOOK ROUTES (Signature-verified, no user session token)
// ============================================================================
router.post('/razorpay/webhook', paymentsController.webhook);

// ============================================================================
// 2. AUTHENTICATED PAYMENT & GATEWAY ROUTES
// ============================================================================
router.use(authenticateUser);

// Gateway configuration (client needs Razorpay key ID to mount checkout modal)
router.get('/config', paymentsController.getConfig);

// Razorpay Order Creation
router.post(
  '/razorpay/create-order',
  requireRole(
    PlatformRole.PARENT,
    PlatformRole.STUDENT,
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.ACCOUNTS,
    PlatformRole.SUPER_ADMIN
  ),
  paymentsController.createOrder
);

// Razorpay Payment Cryptographic Verification & Settlement
router.post(
  '/razorpay/verify',
  requireRole(
    PlatformRole.PARENT,
    PlatformRole.STUDENT,
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.ACCOUNTS,
    PlatformRole.SUPER_ADMIN
  ),
  paymentsController.verifyPayment
);

// Payment Transactions History
router.get(
  '/transactions',
  requireRole(
    PlatformRole.PARENT,
    PlatformRole.STUDENT,
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.ACCOUNTS,
    PlatformRole.SUPER_ADMIN
  ),
  paymentsController.listTransactions
);

// Official Printable Receipt Retrieval
router.get(
  '/receipts/:identifier',
  requireRole(
    PlatformRole.PARENT,
    PlatformRole.STUDENT,
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.ACCOUNTS,
    PlatformRole.SUPER_ADMIN
  ),
  paymentsController.getReceipt
);

export default router;

