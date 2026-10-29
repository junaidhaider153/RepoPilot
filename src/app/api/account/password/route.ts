import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(10, "New password must be at least 10 characters long"),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { message: "Unauthorized. Please sign in." } },
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

  const parsed = PasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message || "Invalid password data." } },
      { status: 400 }
    );
  }

  const { newPassword } = parsed.data;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: 400 }
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password.";
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Password updated successfully.",
  });
}

