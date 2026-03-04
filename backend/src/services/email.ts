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

interface POEmailData {
  poNumber: string;
  supplier: string;
  expectedDate: string | null;
  notes: string | null;
  items: { sku: string; productName: string; orderedQty: number; unitCost: string | null }[];
}

export async function sendPurchaseOrderEmail(
  to: string,
  po: POEmailData,
  pdfBuffer: Buffer,
  companyName: string
): Promise<void> {
  const totalCost = po.items.reduce((sum, item) => {
    if (!item.unitCost) return sum;
    return sum + parseFloat(item.unitCost) * item.orderedQty;
  }, 0);

  const totalItems = po.items.reduce((sum, item) => sum + item.orderedQty, 0);

  const itemRows = po.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${item.sku}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">${item.productName}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; text-align: center;">${item.orderedQty}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; text-align: right;">${item.unitCost ? '$' + parseFloat(item.unitCost).toFixed(2) : '\u2014'}</td>
        </tr>`
    )
    .join('');

  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: `Purchase Order ${po.poNumber} from ${companyName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #3b82f6; margin-bottom: 16px;">
            <span style="color: white; font-weight: 700; font-size: 18px;">P</span>
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Purchase Order ${po.poNumber}</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">From ${companyName}</p>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Supplier</td>
              <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">${po.supplier}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Total Items</td>
              <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">${totalItems} units (${po.items.length} SKUs)</td>
            </tr>
            ${totalCost > 0 ? `<tr>
              <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Total Cost</td>
              <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">$${totalCost.toFixed(2)}</td>
            </tr>` : ''}
            ${po.expectedDate ? `<tr>
              <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Expected Delivery</td>
              <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">${new Date(po.expectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
            </tr>` : ''}
          </table>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">SKU</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Product</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        ${po.notes ? `<div style="background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; padding: 12px 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Notes:</strong> ${po.notes}</p>
        </div>` : ''}
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          The full purchase order PDF is attached to this email. Please confirm receipt and expected delivery timeline.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${po.poNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    console.error('[Email] Failed to send purchase order email:', error);
    throw new Error('Failed to send purchase order email');
  }
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: 'PickNPack — Reset your password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 460px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #3b82f6; margin-bottom: 16px;">
            <span style="color: white; font-weight: 700; font-size: 18px;">P</span>
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Reset your password</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">Enter this code in PickNPack to set a new password</p>
        </div>
        <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
        </div>
        <p style="text-align: center; font-size: 13px; color: #94a3b8; margin: 0;">
          This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[Email] Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}
