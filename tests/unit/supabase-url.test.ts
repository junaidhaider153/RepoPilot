import { describe, it, expect } from "vitest";
import { sanitizeSupabaseUrl } from "@/lib/supabase/client";

describe("Supabase URL Sanitization", () => {
  it("strips /rest/v1/ suffix from Project REST URL to get clean Supabase Project Origin", () => {
    const rawRestUrl = "https://lpdoklzyxjcqkfcyanui.supabase.co/rest/v1/";
    expect(sanitizeSupabaseUrl(rawRestUrl)).toBe("https://lpdoklzyxjcqkfcyanui.supabase.co");
  });

  it("strips /rest/v1 without trailing slash", () => {
    const rawRestUrl = "https://lpdoklzyxjcqkfcyanui.supabase.co/rest/v1";
    expect(sanitizeSupabaseUrl(rawRestUrl)).toBe("https://lpdoklzyxjcqkfcyanui.supabase.co");
  });

  it("strips trailing slash from base origin", () => {
    const rawUrl = "https://lpdoklzyxjcqkfcyanui.supabase.co/";
    expect(sanitizeSupabaseUrl(rawUrl)).toBe("https://lpdoklzyxjcqkfcyanui.supabase.co");
  });

  it("handles clean origin without changes", () => {
    const cleanUrl = "https://lpdoklzyxjcqkfcyanui.supabase.co";
    expect(sanitizeSupabaseUrl(cleanUrl)).toBe("https://lpdoklzyxjcqkfcyanui.supabase.co");
  });

  it("handles whitespace and surrounding quotes", () => {
    const quotedUrl = ' "https://lpdoklzyxjcqkfcyanui.supabase.co/rest/v1" ';
    expect(sanitizeSupabaseUrl(quotedUrl)).toBe("https://lpdoklzyxjcqkfcyanui.supabase.co");
  });
});

