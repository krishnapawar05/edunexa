import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';

export interface CreateOrderParams {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  isMock: boolean;
}

export class RazorpayService {
  private razorpayClient: Razorpay | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    try {
      const isPlaceholder =
        !env.razorpayKeyId ||
        env.razorpayKeyId === 'rzp_test_placeholder' ||
        !env.razorpayKeySecret ||
        env.razorpayKeySecret === 'rzp_test_secret_placeholder';

      if (!isPlaceholder) {
        this.razorpayClient = new Razorpay({
          key_id: env.razorpayKeyId,
          key_secret: env.razorpayKeySecret,
        });
      }
    } catch (err) {
      console.warn('⚠️ Razorpay client initialization error, operating in test sandbox mode:', err);
      this.razorpayClient = null;
    }
  }

  /**
   * Create an official Razorpay Order.
   * If real keys are present and reachable, invokes Razorpay API.
   * Otherwise gracefully falls back to deterministic test mode order ID generation.
   */
  async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
    const { amountInPaise, currency = 'INR', receipt, notes } = params;

    if (this.razorpayClient) {
      try {
        const order = await this.razorpayClient.orders.create({
          amount: amountInPaise,
          currency,
          receipt,
          notes: notes || {},
        });

        return {
          orderId: order.id,
          amount: typeof order.amount === 'number' ? order.amount : amountInPaise,
          currency: order.currency || currency,
          receipt: (order.receipt as string) || receipt,
          isMock: false,
        };
      } catch (error: any) {
        console.warn('⚠️ Razorpay API order creation failed, generating local test order:', error?.message || error);
      }
    }

    // Deterministic or sandbox test order creation
    const suffix = crypto.randomBytes(8).toString('hex');
    const orderId = `order_test_${suffix}`;

    return {
      orderId,
      amount: amountInPaise,
      currency,
      receipt,
      isMock: true,
    };
  }

  /**
   * Cryptographically verify payment signature with HMAC-SHA256.
   * Signature payload: `${orderId}|${paymentId}`
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    try {
      const secret = env.razorpayKeySecret;
      const payload = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (expectedSignature.length !== signature.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Cryptographically verify Razorpay Webhook signature using raw request body.
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!rawBody || !signature) {
      return false;
    }

    try {
      const secret = env.razorpayWebhookSecret;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature.length !== signature.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Test helper to generate valid payment signature for test suites.
   */
  generateTestSignature(orderId: string, paymentId: string): string {
    const payload = `${orderId}|${paymentId}`;
    return crypto.createHmac('sha256', env.razorpayKeySecret).update(payload).digest('hex');
  }

  /**
   * Test helper to generate valid webhook signature for test suites.
   */
  generateTestWebhookSignature(payload: string | Buffer): string {
    return crypto.createHmac('sha256', env.razorpayWebhookSecret).update(payload).digest('hex');
  }
}

export const razorpayService = new RazorpayService();

