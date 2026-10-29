import { env } from '../config/env.js';

export interface SendInvitationEmailOptions {
  to: string;
  recipientName: string;
  schoolName: string;
  role: string;
  activationUrl: string;
  expiresAt: Date;
}

export interface EmailDeliveryResult {
  success: boolean;
  deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED' | 'ASSISTED_MANUAL';
  deliveryError?: string;
  messageId?: string;
}

export class EmailService {
  private resendApiKey?: string;
  private fromEmail: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'EduNexa Access <onboarding@edunexa.org>';
  }

  /**
   * Generates clean HTML template for institutional account activation
   */
  private generateActivationHtml(options: SendInvitationEmailOptions): string {
    const roleFormatted = options.role.replace(/_/g, ' ');
    const expiryDateStr = options.expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
    .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 800; color: #38bdf8; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 12px; margin-bottom: 8px; }
    .content { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
    .role-badge { display: inline-block; background-color: #0284c7; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; margin: 6px 0; }
    .btn-container { text-align: center; margin: 32px 0; }
    .button { background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; }
    .footer { border-top: 1px solid #334155; padding-top: 20px; margin-top: 32px; font-size: 12px; color: #64748b; line-height: 1.5; }
    .warning { background-color: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; font-size: 13px; color: #fbbf24; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">EduNexa ERP</div>
      <div class="title">Institutional Account Invitation</div>
    </div>
    <div class="content">
      <p>Dear <strong>${options.recipientName}</strong>,</p>
      <p>An institutional account has been provisioned for you at <strong>${options.schoolName}</strong> with the following assigned role:</p>
      <div><span class="role-badge">${roleFormatted}</span></div>
      <p>To access your school ERP portal, please activate your account and set your secure password by clicking the button below:</p>
      <div class="btn-container">
        <a href="${options.activationUrl}" class="button" target="_blank">Activate Your Account & Set Password</a>
      </div>
      <div class="warning">
        ⚠️ <strong>Security Notice:</strong> This activation link is unique to you and will expire on <strong>${expiryDateStr}</strong>. Do not share this link with anyone.
      </div>
      <p style="margin-top: 20px; font-size: 13px; color: #94a3b8;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <span style="color: #38bdf8; word-break: break-all;">${options.activationUrl}</span>
      </p>
    </div>
    <div class="footer">
      This is an automated administrative notification sent by EduNexa Multi-Tenant ERP.<br>
      © 2026 EduNexa Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Dispatches invitation email with activation token link
   */
  async sendInvitationEmail(options: SendInvitationEmailOptions): Promise<EmailDeliveryResult> {
    if (!options.to || !options.to.includes('@')) {
      return {
        success: false,
        deliveryStatus: 'FAILED',
        deliveryError: 'Invalid recipient email address.',
      };
    }

    // 1. If Resend API key is available, dispatch via Resend REST API
    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: [options.to],
            subject: `Activate your institutional account at ${options.schoolName}`,
            html: this.generateActivationHtml(options),
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.error('[EmailService] Resend API delivery error:', errBody);
          return {
            success: false,
            deliveryStatus: 'FAILED',
            deliveryError: `Provider error: ${response.statusText} (${errBody})`,
          };
        }

        const data = await response.json() as any;
        return {
          success: true,
          deliveryStatus: 'SENT',
          messageId: data?.id,
        };
      } catch (err: any) {
        console.error('[EmailService] Network exception during email dispatch:', err);
        return {
          success: false,
          deliveryStatus: 'FAILED',
          deliveryError: err?.message || 'Network error connecting to email provider.',
        };
      }
    }

    // 2. Safe development / fallback provider
    // Never logs activation tokens or passwords; logs safe operational telemetry
    console.log(`[EmailService Development Mode] Invitation email prepared for ${options.to} (${options.role}) at ${options.schoolName}`);
    return {
      success: true,
      deliveryStatus: 'SENT',
      messageId: `dev-msg-${Date.now()}`,
    };
  }
}

export const emailService = new EmailService();

