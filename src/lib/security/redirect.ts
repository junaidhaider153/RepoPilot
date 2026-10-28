/**
 * Validates and sanitizes a redirect path to prevent open redirect vulnerabilities.
 * Ensures the destination is strictly a relative application path (starts with a single `/`),
 * and does not begin with protocol-relative `//`, backslash `/\`, or scheme indicators.
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/app"
): string {
  if (!path || typeof path !== "string") {
    return fallback;
  }

  const trimmed = path.trim();

  // Must start with a single `/`, and cannot start with `//` or `/\`
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  // Reject URLs with embedded schemes or dangerous pseudo-protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("vbscript:") ||
    /^\/[a-z0-9+.-]+:/i.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}
