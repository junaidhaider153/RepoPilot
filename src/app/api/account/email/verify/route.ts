import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/email/tokens";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/app/settings/account?error=missing_token", req.url)
    );
  }

  const result = consumeEmailVerificationToken(token);
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

