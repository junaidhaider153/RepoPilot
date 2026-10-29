import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * Returns whether SMTP credentials are fully provided in environment variables.
 * For Gmail, this requires SMTP_HOST (typically smtp.gmail.com), SMTP_USER, and SMTP_PASS
 * (a 16-character Google App Password created with 2-Step Verification).
 */
export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  return Boolean(host && user && pass);
}

/**
 * Parses and returns the active SMTP configuration.
 */
export function getSmtpConfig(): SmtpConfig | null {
  if (!isSmtpConfigured()) return null;

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE.toLowerCase() === "true"
      : port === 465;

  const user = process.env.SMTP_USER!.trim();
  const rawPass = process.env.SMTP_PASS!.trim();
  // Strip surrounding quotes and all internal whitespace (e.g. Google's 4-chunk format "abcd efgh ijkl mnop")
  const pass = rawPass.replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  const from = process.env.SMTP_FROM?.trim() || `RepoPilot <${user}>`;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
  };
}

/**
 * Dispatches an email via configured SMTP (e.g. Gmail 2FA App Password).
 * Throws a descriptive error if SMTP is not configured.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ success: boolean; messageId: string }> {
  const config = getSmtpConfig();

  if (!config) {
    throw new Error(
      "SMTP is not configured. To send verification emails via Gmail, enable 2-Step Verification and configure a 16-character Google App Password in .env.local (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)."
    );
  }

  const isGmail =
    config.host.toLowerCase().includes("gmail") ||
    config.auth.user.toLowerCase().includes("@gmail.com");

  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: "gmail",
          auth: {
            user: config.auth.user,
            pass: config.auth.pass,
          },
        }
      : {
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.auth.user,
            pass: config.auth.pass,
          },
        }
  );

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (
      errMsg.includes("535") ||
      errMsg.includes("BadCredentials") ||
      errMsg.includes("Username and Password not accepted")
    ) {
      throw new Error(
        "Gmail authentication failed (Bad Credentials). If 2-Step Verification is enabled on your Google Account, you must use a 16-character Google App Password (from myaccount.google.com/apppasswords), NOT your normal Gmail password. Also verify that SMTP_USER is your exact Gmail address."
      );
    }
    throw err;
  }
}

/**
 * Composes and dispatches an account email verification email.
 */
export async function sendVerificationEmail({
  toEmail,
  token,
  origin,
}: {
  toEmail: string;
  token: string;
  origin?: string;
}): Promise<{ success: boolean; messageId: string }> {
  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/account/email/verify?token=${encodeURIComponent(token)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your RepoPilot Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 32px 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em;">RepoPilot</h1>
      <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8;">Email Address Verification</p>
    </div>
    <div style="padding: 32px; color: #334155; font-size: 14px; line-height: 1.6;">
      <p style="margin-top: 0;">Hello,</p>
      <p>We received a request to update the primary email address for your RepoPilot account to <strong>${toEmail}</strong>.</p>
      <p>Click the button below to confirm this email change. This link will expire in 24 hours.</p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 500; font-size: 14px; border-radius: 6px; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="font-size: 11px; color: #94a3b8; word-break: break-all; font-family: monospace;">${verifyUrl}</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">If you did not request this change, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
RepoPilot Email Verification

Hello,

We received a request to update the primary email address for your RepoPilot account to ${toEmail}.
Please visit the following URL to verify your email address:

${verifyUrl}

This link will expire in 24 hours. If you did not request this change, you can safely ignore this email.
  `.trim();

  return sendEmail({
    to: toEmail,
    subject: "Verify your new RepoPilot email address",
    html,
    text,
  });
}

