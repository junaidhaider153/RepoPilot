import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./client";
import { sanitizeRedirectPath } from "@/lib/security/redirect";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Fail closed in production if Supabase is unconfigured
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
      const pathname = request.nextUrl.pathname;
      if (
        pathname.startsWith("/app") ||
        pathname.startsWith("/api/sessions") ||
        pathname.startsWith("/api/account") ||
        pathname.startsWith("/api/profile")
      ) {
        return new NextResponse(
          JSON.stringify({
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Authentication service is not configured in this production environment.",
            },
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          })
        );
      },
    },
  });

  // IMPORTANT: Do not run any code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection rules:
  // If user is not signed in and trying to access /app/*, redirect to /login?next=...
  const pathname = request.nextUrl.pathname;
  if (!user && pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If user is already signed in and trying to access /login or /signup, redirect to /app
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const nextDestination = sanitizeRedirectPath(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    url.pathname = nextDestination;
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

