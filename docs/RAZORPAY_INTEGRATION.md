# EduNexa Razorpay Payment Gateway Integration (Test Mode)

## 1. Architectural Overview

EduNexa integrates **Razorpay Payment Gateway** in **Test Mode** to provide end-to-end, cryptographically verified school fee remittance across parents, students, accounts staff, and school administrators.

### Core Security & Isolation Principles

1. **Zero-Trust Financial Architecture**:
   - The frontend never dictates the remittance amount or balance. All order amounts and remaining balances are derived directly from the PostgreSQL `FeeInvoice` record on the server.
   - Overpayment beyond outstanding dues is strictly rejected with `400 OVERPAYMENT_REJECTED`.
   - Invoices with zero outstanding balances reject order creation with `400 INVOICE_ALREADY_PAID`.

2. **Cryptographic Integrity & Verification**:
   - Invoices are **never** marked as paid based solely on frontend callback success.
   - Every transaction requires an HMAC-SHA256 signature verification via `POST /api/v1/payments/razorpay/verify` using `RAZORPAY_KEY_SECRET`:
     $$\text{expectedSignature} = \text{HMAC-SHA256}(\text{order\_id} + \text{"|"} + \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
   - Tampered signatures immediately mark the `PaymentTransaction` as `FAILED` with `400 INVALID_PAYMENT_SIGNATURE`.

3. **Secret Isolation**:
   - `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are strictly quarantined on the server.
   - Only the public `RAZORPAY_KEY_ID` and configuration metadata are exposed via `GET /api/v1/payments/config`.

4. **Multi-Tenant & Parent-Child Authorization**:
   - Cross-tenant payment creation is strictly blocked: an actor in School A cannot initiate or verify payments for an invoice in School B.
   - Parents can only initiate payments for their verified wards linked through `ParentStudentLink`. Unauthorized attempts trigger `403 FORBIDDEN_RESOURCE`.

5. **Atomic Settlement & Idempotency**:
   - All state transitions (`PaymentTransaction -> SUCCESS`, `FeeInvoice.amountPaid += amount`, `FeeInvoice.status -> PAID | PARTIALLY_PAID`, and `FeePayment` creation) execute within an atomic Prisma database transaction.
   - Submitting duplicate verification requests or replay webhooks returns the existing receipt without double-crediting balances or duplicating audit logs.

---

## 2. PostgreSQL Database Schema

```prisma
enum PaymentTxnStatus {
  CREATED
  ATTEMPTED
  SUCCESS
  FAILED
  REFUNDED
}

model PaymentTransaction {
  id               String           @id @default(uuid())
  schoolId         String
  feeInvoiceId     String
  userId           String
  orderId          String           @unique
  paymentId        String?          @unique
  signature        String?
  amount           Float
  currency         String           @default("INR")
  status           PaymentTxnStatus @default(CREATED)
  paymentMethod    String?
  receiptNumber    String?
  errorCode        String?
  errorDescription String?
  metadata         Json?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  feeInvoice       FeeInvoice       @relation(fields: [feeInvoiceId], references: [id], onDelete: Cascade)
  school           School           @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([schoolId, status])
  @@index([feeInvoiceId])
  @@index([orderId])
  @@index([paymentId])
}

model FeePayment {
  id             String       @id @default(uuid())
  feeInvoiceId   String
  receiptNumber  String       @unique
  amountPaid     Float
  paidAt         DateTime     @default(now())
  paymentMethod  String
  transactionRef String?
  isSimulated    Boolean      @default(true)
  collectedBy    String?
  notes          String?
  orderId        String?
  paymentId      String?

  invoice        FeeInvoice   @relation(fields: [feeInvoiceId], references: [id], onDelete: Cascade)

  @@index([receiptNumber])
  @@index([orderId])
  @@index([paymentId])
}
```

---

## 3. API Specification

| Method | Endpoint | Access / Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/payments/config` | Authenticated | Retrieves public client config (`keyId`, `mode: 'test'`, `currency: 'INR'`). |
| `POST` | `/api/v1/payments/razorpay/create-order` | PARENT, STUDENT, ADMIN, ACCOUNTS | Validates tenant & parent-ward privileges, calculates balance, creates Razorpay Order in paise, persists `PaymentTransaction` (`CREATED`). |
| `POST` | `/api/v1/payments/razorpay/verify` | PARENT, STUDENT, ADMIN, ACCOUNTS | Cryptographically validates HMAC-SHA256 signature, executes atomic Prisma transaction, creates `FeePayment` & updates invoice status. |
| `POST` | `/api/v1/payments/razorpay/webhook` | Public (Signature Verified) | Validates raw payload HMAC signature against `RAZORPAY_WEBHOOK_SECRET`, idempotently processes `payment.captured` and `payment.failed`. |
| `GET` | `/api/v1/payments/transactions` | Authenticated | Lists payment transactions scoped by school tenant and parent/student privileges. |
| `GET` | `/api/v1/payments/receipts/:identifier` | Authenticated | Retrieves full printable receipt data by receipt number or payment ID. |

---

## 4. Frontend Experience & Checkout Workflow

1. **Dynamic SDK Loader (`client/src/utils/razorpay.ts`)**:
   - `loadRazorpayScript()` dynamically loads the official `https://checkout.razorpay.com/v1/checkout.js` on demand.
   - `launchRazorpayModal()` wraps the SDK checkout workflow in a Promise-based API with timeout and dismissal handlers.

2. **Parent Portal (`ParentFeesPage.tsx`)**:
   - Select ward tab dynamically updates fee invoices from PostgreSQL.
   - Clicking **Pay Online** opens the checkout dialog with Razorpay Test Mode option.
   - Clicking **Launch Razorpay** triggers server order generation, displays Razorpay checkout modal styled with EduNexa institutional emerald theme (`#047857`).
   - On completion, backend validates HMAC signature and immediately transitions to a verified clearance screen with receipt reference and **Download PDF Receipt** button.

3. **Student Portal (`StudentFeesPage.tsx`)**:
   - Students can review their term fee ledger, download verified receipts, and submit Razorpay payments.

4. **Accounts Staff & School Admin (`AccountsInvoicesPage.tsx`)**:
   - Displays real-time transactions with Razorpay Order ID, Payment ID, payment channel, and verification badge (`Razorpay Verified`).
   - Instant PDF and print receipts.

---

## 5. Environment Variables & Setup

Configure the following in `server/.env`:

```env
# Razorpay Payment Gateway (Test Mode)
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=rzp_test_secret_placeholder
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret_placeholder
RAZORPAY_MODE=test
```

### Razorpay Dashboard Webhook Configuration

When hosting or testing with webhook forwarding:
1. Log into [Razorpay Dashboard](https://dashboard.razorpay.com/) in **Test Mode**.
2. Navigate to **Settings -> Webhooks -> Add New Webhook**.
3. **Webhook URL**: `https://<YOUR_DOMAIN>/api/v1/payments/razorpay/webhook`
4. **Secret**: Value configured in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

---

## 6. Automated Vitest Verification

The test suite in `server/src/modules/payments/razorpay.test.ts` executes 15 end-to-end integration tests:

1. **1a.** Client configuration retrieval without secret leakage.
2. **2a.** Parent order creation with paise conversion and DB persistence.
3. **2b.** Overpayment rejection (`400 OVERPAYMENT_REJECTED`).
4. **2c.** Settled invoice rejection (`400 INVOICE_ALREADY_PAID`).
5. **2d.** Horizontal privilege violation rejection for unlinked parents (`403 FORBIDDEN_RESOURCE`).
6. **2e.** Cross-tenant isolation verification (`404 RECORD_NOT_FOUND`).
7. **3a.** Tampered signature rejection & transaction failure marking (`400 INVALID_PAYMENT_SIGNATURE`).
8. **3b.** Cryptographic signature verification with atomic database settlement & receipt generation.
9. **3c.** Idempotent re-submission (no double counting or duplicate receipts).
10. **4a.** Webhook invalid signature rejection (`400 INVALID_WEBHOOK_SIGNATURE`).
11. **4b.** Webhook `payment.captured` asynchronous idempotent settlement.
12. **4c.** Webhook `payment.failed` audit logging in PostgreSQL.
13. **5a.** Accounts Officer transaction history retrieval.
14. **5b.** Parent ward transaction history retrieval.
15. **5c.** Official receipt retrieval by receipt number.

