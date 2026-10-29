import { createBrowserClient } from "@supabase/ssr";

/**
 * Sanitizes Supabase URL to ensure it is the project root origin.
 * Automatically strips accidental `/rest/v1` or trailing slashes copied from Supabase API settings.
 */
export function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "https://placeholder-url.supabase.co";
  const cleaned = rawUrl.trim().replace(/^["']|["']$/g, "").trim();
  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  }
}

export function createClient() {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key").trim();

  return createBrowserClient(supabaseUrl, supabaseKey);
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("placeholder") && !key.includes("placeholder"));
}

