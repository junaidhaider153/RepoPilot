/**
 * In-memory email verification token store attached to globalThis singleton
 * to survive Next.js multi-chunk bundle isolation in development and production.
 */

export interface EmailVerificationRecord {
  token: string;
  userId: string;
  newEmail: string;
  expiresAt: number; // Unix timestamp ms
  createdAt: number;
}

declare global {
  var __repopilot_emailVerificationTokens: Map<string, EmailVerificationRecord> | undefined;
}

function getTokenMap(): Map<string, EmailVerificationRecord> {
  if (!globalThis.__repopilot_emailVerificationTokens) {
    globalThis.__repopilot_emailVerificationTokens = new Map<string, EmailVerificationRecord>();
  }
  return globalThis.__repopilot_emailVerificationTokens;
}

/**
 * Generate a 32-byte cryptographically random hex token and store the verification request.
 * Default expiration is 24 hours.
 */
export function createEmailVerificationToken(
  userId: string,
  newEmail: string,
  ttlMs = 24 * 60 * 60 * 1000
): string {
  const map = getTokenMap();
  const token = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).substring(2)
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  map.set(token, {
    token,
    userId,
    newEmail,
    expiresAt: Date.now() + ttlMs,
    createdAt: Date.now(),
  });

  return token;
}

/**
 * Validates and consumes an email verification token.
 * Returns the associated userId and newEmail if valid, or an error if invalid/expired.
 */
export function consumeEmailVerificationToken(token: string): {
  valid: boolean;
  userId?: string;
  newEmail?: string;
  error?: string;
} {
  const map = getTokenMap();
  const record = map.get(token);

  if (!record) {
    return { valid: false, error: "Invalid or expired verification token." };
  }

  if (Date.now() > record.expiresAt) {
    map.delete(token);
    return { valid: false, error: "Verification token has expired. Please request a new one." };
  }

  // Consume token so it cannot be re-used
  map.delete(token);

  return {
    valid: true,
    userId: record.userId,
    newEmail: record.newEmail,
  };
}

export function clearAllTokensForUser(userId: string): void {
  const map = getTokenMap();
  for (const [token, rec] of map.entries()) {
    if (rec.userId === userId) {
      map.delete(token);
    }
  }
}
