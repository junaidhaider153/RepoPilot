/**
 * Shared in-memory sliding-window rate limiter for Vercel/Node edge & serverless routes.
 * Keys on authenticated user ID when logged in, with client IP fallback for unauthenticated guests.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  identifier: string,
  maxRequests = 30,
  windowMs = 60000
): RateLimitResult {
  const now = Date.now();
  purgeExpiredRecords(now);

  const record = rateLimitMap.get(identifier);

  // Clean expired record or initialize
  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(identifier, newRecord);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }

  // Increment existing window
  record.count += 1;

  if (record.count > maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

export function getRateLimitIdentifier(
  headers: Headers,
  userId?: string | null
): { identifier: string; isGuest: boolean; limit: number } {
  if (userId) {
    return {
      identifier: `user:${userId}`,
      isGuest: false,
      limit: 60, // Authenticated users get 60 requests/minute
    };
  }

  // Extract client IP from proxy headers
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const cfIp = headers.get("cf-connecting-ip");

  const clientIp =
    cfIp ||
    (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
    realIp ||
    "127.0.0.1";

  return {
    identifier: `guest:${clientIp}`,
    isGuest: true,
    limit: 15, // Unauthenticated guests get 15 requests/minute
  };
}
