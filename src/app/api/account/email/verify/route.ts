import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerificationToken, consumeEmailVerificationCode } from "@/lib/email/tokens";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/get-user";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const code = req.nextUrl.searchParams.get("code");

  if (!token && !code) {
    return NextResponse.redirect(
      new URL("/app/settings/account?error=missing_token", req.url)
    );
  }

  const result = token
    ? consumeEmailVerificationToken(token)
    : consumeEmailVerificationCode(code!);

  if (!result.valid || !result.userId || !result.newEmail) {
    return NextResponse.redirect(
      new URL(
        `/app/settings/account?error=${encodeURIComponent(result.error || "invalid_token")}`,
        req.url
      )
    );
  }

  // If Supabase is configured, update auth/profile
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      await supabase.auth.updateUser({ email: result.newEmail });
    } catch {
      // Ignore or log error
    }
  }

  return NextResponse.redirect(
    new URL(
      `/app/settings/account?email_updated=true&email=${encodeURIComponent(result.newEmail)}`,
      req.url
    )
  );
}

export async function POST(req: NextRequest) {
  let body: { code?: string; token?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON request payload." } },
      { status: 400 }
    );
  }

  const rawCode = body.code?.trim();
  const rawToken = body.token?.trim();

  if (!rawCode && !rawToken) {
    return NextResponse.json(
      { error: { message: "Please provide either a 6-digit verification code or token." } },
      { status: 400 }
    );
  }

  const user = await getAuthUser();
  const result = rawCode
    ? consumeEmailVerificationCode(rawCode, user?.id)
    : consumeEmailVerificationToken(rawToken!);

  if (!result.valid || !result.newEmail) {
    return NextResponse.json(
      { error: { message: result.error || "Invalid or expired verification passcode." } },
      { status: 400 }
    );
  }

  // If Supabase is configured, update auth user email
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      await supabase.auth.updateUser({ email: result.newEmail });
    } catch {
      // Ignore or log error
    }
  }

  return NextResponse.json({
    success: true,
    newEmail: result.newEmail,
    message: `Email verified successfully! Your account email has been updated to ${result.newEmail}.`,
  });
}
