import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  previewUrl?: string | null;
  provider: 'resend' | 'smtp' | 'test-ethereal';
}

let testTransporter: Transporter | null = null;

async function getTransporter(): Promise<{
  transporter: Transporter;
  provider: 'resend' | 'smtp' | 'test-ethereal';
}> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  if (host && user && pass) {
    const smtpTransport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    return { transporter: smtpTransport, provider: 'smtp' };
  }

  // Use cached or create an Ethereal / simulated test transporter
  if (!testTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📬 Initialized Ethereal test mailer for simulated sandbox dispatch.');
    } catch {
      // Fallback in-memory mailer
      testTransporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  return { transporter: testTransporter, provider: 'test-ethereal' };
}

/**
 * Sanitizes headers to prevent header injection attacks
 */
function sanitizeHeader(val: string): string {
  return val.replace(/[\r\n]/g, '').trim();
}

/**
 * Dispatches transactional email reports with resilient fallback & sandbox support
 */
export async function sendEmailReport(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, from } = params;

  // Sanitize header parameters
  const cleanSubject = sanitizeHeader(subject);
  const cleanFrom = sanitizeHeader(from || process.env.SYSTEM_FROM_EMAIL || 'reports@researchflow.ai');
  const validRecipients = to.map(r => sanitizeHeader(r)).filter(Boolean);
  if (validRecipients.length === 0) {
    validRecipients.push(process.env.DEFAULT_RECIPIENT || 'operator@researchflow.ai');
  }

  // 1. Resend API Integration check
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.includes('placeholder')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: cleanFrom,
          to: validRecipients,
          subject: cleanSubject,
          html: html
        })
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          messageId: data.id || `resend_${Date.now()}`,
          provider: 'resend'
        };
      } else {
        const errorText = await res.text();
        console.warn('Resend API dispatch failed, falling back to Nodemailer test transport:', errorText);
      }
    } catch (err: any) {
      console.warn('Resend request error:', err.message);
    }
  }

  // 2. Nodemailer transport dispatch
  const { transporter, provider } = await getTransporter();

  const info = await transporter.sendMail({
    from: cleanFrom,
    to: validRecipients.join(', '),
    subject: cleanSubject,
    html: html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  return {
    success: true,
    messageId: info.messageId || `msg_${Date.now()}`,
    previewUrl: previewUrl ? String(previewUrl) : null,
    provider
  };
}
