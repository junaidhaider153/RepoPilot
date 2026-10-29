/**
 * In-memory email verification token and 6-digit passcode store attached to globalThis singleton
 * to survive Next.js multi-chunk bundle isolation in development and production.
 */

export interface EmailVerificationRecord {
  token: string;
  code: string; // 6-digit verification code e.g. "849216"
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
 * Generates a 6-digit cryptographically secure numeric passcode (100000 - 999999).
 */
export function generateVerificationPasscode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const num = 100000 + (array[0] % 900000);
    return num.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate both a URL-safe token and a 6-digit numeric passcode and store the verification request.
 * Default expiration is 24 hours.
 */
export function createEmailVerificationTokenAndCode(
  userId: string,
  newEmail: string,
  ttlMs = 24 * 60 * 60 * 1000
): { token: string; code: string } {
  const map = getTokenMap();
  const token =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).substring(2)
      : Math.random().toString(36).substring(2) + Date.now().toString(36);

  const code = generateVerificationPasscode();

  const record: EmailVerificationRecord = {
    token,
    code,
    userId,
    newEmail,
    expiresAt: Date.now() + ttlMs,
    createdAt: Date.now(),
  };

  // Store indexed by token
  map.set(token, record);

  return { token, code };
}

/**
 * Backwards-compatible wrapper generating token and passcode, returning the token string.
 */
export function createEmailVerificationToken(
  userId: string,
  newEmail: string,
  ttlMs = 24 * 60 * 60 * 1000
): string {
  const { token } = createEmailVerificationTokenAndCode(userId, newEmail, ttlMs);
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

/**
 * Validates and consumes a 6-digit numeric verification passcode (ignoring spaces and dashes e.g. '849-216' or '849216').
 */
export function consumeEmailVerificationCode(
  rawCode: string,
  userId?: string
): {
  valid: boolean;
  userId?: string;
  newEmail?: string;
  error?: string;
} {
  const cleanCode = (rawCode || "").replace(/\D/g, "").trim();

  if (!cleanCode || cleanCode.length !== 6) {
    return { valid: false, error: "Verification passcode must be a 6-digit number." };
  }

  const map = getTokenMap();
  let matchedKey: string | null = null;
  let matchedRecord: EmailVerificationRecord | null = null;

  for (const [key, record] of map.entries()) {
    if (record.code === cleanCode) {
      if (!userId || record.userId === userId) {
        matchedKey = key;
        matchedRecord = record;
        break;
      }
    }
  }

  if (!matchedRecord || !matchedKey) {
    return { valid: false, error: "Invalid or expired verification passcode." };
  }

  if (Date.now() > matchedRecord.expiresAt) {
    map.delete(matchedKey);
    return { valid: false, error: "Verification passcode has expired. Please request a new one." };
  }

  // Consume token and code so it cannot be re-used
  map.delete(matchedKey);

  return {
    valid: true,
    userId: matchedRecord.userId,
    newEmail: matchedRecord.newEmail,
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
