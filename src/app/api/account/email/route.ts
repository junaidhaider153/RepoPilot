import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { isSmtpConfigured, sendVerificationEmail } from "@/lib/email/mailer";
import { createEmailVerificationTokenAndCode } from "@/lib/email/tokens";
import { z } from "zod";

const EmailSchema = z.object({
  newEmail: z.string().email("Invalid email address format"),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { message: "Unauthorized. Please sign in to update your email." } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid request payload." } },
      { status: 400 }
    );
  }

  const parsed = EmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Invalid email address." } },
      { status: 400 }
    );
  }

  const { newEmail } = parsed.data;

  if (user.email && user.email.toLowerCase() === newEmail.toLowerCase()) {
    return NextResponse.json(
      { error: { message: "The new email address cannot be the same as your current email." } },
      { status: 400 }
    );
  }

  // Check SMTP configuration honestly
  if (!isSmtpConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "SMTP_NOT_CONFIGURED",
          message:
            "SMTP is not configured. To send verification emails via Gmail, enable 2-Step Verification and configure a 16-character Google App Password in .env.local (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).",
        },
      },
      { status: 400 }
    );
  }

  try {
    const { token, code } = createEmailVerificationTokenAndCode(user.id, newEmail);
    const origin = req.nextUrl.origin;

    await sendVerificationEmail({
      toEmail: newEmail,
      token,
      code,
      origin,
    });

    return NextResponse.json({
      success: true,
      message: `A verification email with passcode has been sent to ${newEmail}. Please click the link or enter the 6-digit passcode.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to dispatch verification email.";
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}

