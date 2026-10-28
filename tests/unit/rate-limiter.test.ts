import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limiter";

describe("Rate Limiter", () => {
  it("allows requests under the threshold and decrements remaining", () => {
    const id = "test-client-1";
    const res1 = checkRateLimit(id, 5, 10000);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(4);

    const res2 = checkRateLimit(id, 5, 10000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("blocks requests once the threshold is exceeded", () => {
    const id = "test-client-blocked";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(id, 3, 10000);
    }

    const blocked = checkRateLimit(id, 3, 10000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});

