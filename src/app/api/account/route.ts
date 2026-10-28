import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { deleteUserAccount } from "@/lib/persistence/store";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized." } }, { status: 401 });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const { confirmEmail } = body;
    if (confirmEmail && user.email && confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: { message: "Confirmation email does not match your account email." } },
        { status: 400 }
      );
    }

    // Delete user account data and cascade relations
    await deleteUserAccount(user.id);

    // If Supabase is configured, delete or sign out the user
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabase();
        await supabase.auth.signOut();
      } catch {
        // Continue
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account and all associated session data permanently deleted.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete account.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

