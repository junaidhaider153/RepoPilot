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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your RepoPilot Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f4f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;">
          
          <!-- Obsidian Header with Gemini Accent -->
          <tr>
            <td style="background: linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%); padding: 36px 36px 30px; text-align: left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Spark badge + Logo -->
                    <div style="display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; font-size: 11px; font-weight: 600; color: #93c5fd; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                      ✦ Gemini Intelligence · RepoPilot
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em; line-height: 1.2;">
                      Confirm your new email address
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8; line-height: 1.4;">
                      Verify your account credentials to keep your repository workspace secure.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #334155;">
                We received a request to update the primary email address for your RepoPilot account to:
              </p>

              <!-- Target Email Highlight Pill -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
                <span style="font-size: 12px; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px; font-weight: 600;">Target Email</span>
                <span style="font-size: 16px; font-weight: 600; color: #0f172a; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;">${toEmail}</span>
              </div>

              <!-- Call to Action Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 32px; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); letter-spacing: -0.01em;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Warning Pill -->
              <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 10px 14px; margin-bottom: 28px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #854d0e; font-weight: 500;">
                  ⏱ This secure verification link will expire in <strong>24 hours</strong>.
                </p>
              </div>

              <!-- Fallback Direct URL Box -->
              <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; font-weight: 500;">
                Button not working? Copy and paste this URL directly into your browser:
              </p>
              <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 24px; word-break: break-all; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #334155; line-height: 1.5;">
                ${verifyUrl}
              </div>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                If you did not request this email change, please ignore this message. Your RepoPilot account credentials will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafbfc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #475569; letter-spacing: 0.02em;">
                RepoPilot · AI-Powered Repository Reverse Engineering
              </p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                Built with Google Gemini & Next.js · Confidential Security Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
RepoPilot · Gemini Intelligence
Confirm your new email address

Hello,

We received a request to update the primary email address for your RepoPilot account to:
${toEmail}

Please open the following link in your browser to verify this email address:
${verifyUrl}

⏱ This link will expire in 24 hours.

If you did not request this change, you can safely ignore this email. Your current account credentials will remain unchanged.

---
RepoPilot · AI-Powered Repository Reverse Engineering
  `.trim();

  return sendEmail({
    to: toEmail,
    subject: "Verify your new RepoPilot email address",
    html,
    text,
  });
}

