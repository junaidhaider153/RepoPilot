import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  displayName?: string;
}

export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  if (!isSupabaseConfigured()) {
    // Fail closed in production when Supabase is not configured
    if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
      return null;
    }

    // In local demo / test mode, return demo user
    return {
      id: "u-demo-1",
      email: "developer@example.com",
      displayName: "Dev Lead",
    };
  }

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Developer",
    };
  } catch {
    return null;
  }
}

