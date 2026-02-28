import { Resend } from 'resend';
import config from '../config/index.js';

const resend = new Resend(config.resendApiKey);

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: 'PickNPack — Verify your email',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 460px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #3b82f6; margin-bottom: 16px;">
            <span style="color: white; font-weight: 700; font-size: 18px;">P</span>
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Verify your email</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">Enter this code in PickNPack to verify your account</p>
        </div>
        <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
        </div>
        <p style="text-align: center; font-size: 13px; color: #94a3b8; margin: 0;">
          This code expires in 10 minutes. If you didn't create a PickNPack account, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[Email] Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}
