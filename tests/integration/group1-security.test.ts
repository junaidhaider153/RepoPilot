import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthUser } from "@/lib/auth/get-user";
import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest } from "next/server";
import { sanitizeRedirectPath } from "@/lib/security/redirect";
import { POST as chatHandler } from "@/app/api/repository/chat/route";
import { POST as documentsHandler } from "@/app/api/documents/generate/route";
import { POST as blueprintHandler } from "@/app/api/innovation/blueprint/route";
import { POST as opportunitiesHandler } from "@/app/api/innovation/opportunities/route";
import { insertSession } from "@/lib/persistence/store";

describe("Group 1 Regression Tests: Security (L-03, L-19, L-14)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = originalEnv;
  });

  describe("L-03: Fail-Closed Authentication in Production", () => {
    it("never returns demo user in production when Supabase is not configured", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.DEMO_MODE;

      const user = await getAuthUser();
      // Must fail closed (return null), never return u-demo-1
      expect(user).toBeNull();
    });

    it("middleware fails closed in production when Supabase is not configured", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.DEMO_MODE;

      const req = new NextRequest("http://localhost:3000/app/s/secret-session-1");
      const res = await updateSession(req);

      // Must NOT allow request through with 200/next in production when unconfigured
      expect(res.status).toBe(503);
    });
  });

  describe("L-19: Open Redirect Prevention", () => {
    it("sanitizes malicious open redirect targets", () => {
      expect(sanitizeRedirectPath("https://evil.example")).toBe("/app");
      expect(sanitizeRedirectPath("//evil.example")).toBe("/app");
      expect(sanitizeRedirectPath("/\\evil.example")).toBe("/app");
      expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/app");
      expect(sanitizeRedirectPath("data:text/html,<script>alert(1)</script>")).toBe("/app");
      expect(sanitizeRedirectPath("")).toBe("/app");
      expect(sanitizeRedirectPath(null)).toBe("/app");
      expect(sanitizeRedirectPath(undefined)).toBe("/app");

      // Valid paths are preserved
      expect(sanitizeRedirectPath("/app")).toBe("/app");
      expect(sanitizeRedirectPath("/app/s/session-123")).toBe("/app/s/session-123");
      expect(sanitizeRedirectPath("/app/settings/account")).toBe("/app/settings/account");
    });
  });

  describe("L-14: Ownership Verification on AI Routes", () => {
    const ownerUserId = "legitimate-owner-1";
    const attackerUserId = "attacker-user-2";
    let targetSessionId: string;

    beforeEach(async () => {
      const session = await insertSession(ownerUserId, {
        id: `sess-owned-${Date.now()}`,
        repoUrl: "https://github.com/github/spec-kit",
        owner: "github",
        repo: "spec-kit",
        title: "Owner Session",
      });
      targetSessionId = session.id;
    });

    it("rejects unauthorized user B from chatting on user A's session", async () => {
      // Mock auth to return attacker user
      const getUserModule = await import("@/lib/auth/get-user");
      vi.spyOn(getUserModule, "getAuthUser").mockResolvedValue({
        id: attackerUserId,
        email: "attacker@example.com",
        displayName: "Attacker",
      });

      const req = new NextRequest("http://localhost:3000/api/repository/chat", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/github/spec-kit",
          question: "Exfiltrate proprietary snapshot info?",
          sessionId: targetSessionId,
        }),
      });

      const res = await chatHandler(req);
      // Must be 403 or 404, never 200
      expect([403, 404]).toContain(res.status);
    });

    it("rejects unauthorized user B from generating documents on user A's session", async () => {
      const getUserModule = await import("@/lib/auth/get-user");
      vi.spyOn(getUserModule, "getAuthUser").mockResolvedValue({
        id: attackerUserId,
        email: "attacker@example.com",
        displayName: "Attacker",
      });

      const req = new NextRequest("http://localhost:3000/api/documents/generate", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/github/spec-kit",
          sessionId: targetSessionId,
        }),
      });

      const res = await documentsHandler(req);
      expect([403, 404]).toContain(res.status);
    });

    it("rejects unauthorized user B from generating blueprints on user A's session", async () => {
      const getUserModule = await import("@/lib/auth/get-user");
      vi.spyOn(getUserModule, "getAuthUser").mockResolvedValue({
        id: attackerUserId,
        email: "attacker@example.com",
        displayName: "Attacker",
      });

      const req = new NextRequest("http://localhost:3000/api/innovation/blueprint", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/github/spec-kit",
          opportunity: { title: "Test Opp" },
          sessionId: targetSessionId,
        }),
      });

      const res = await blueprintHandler(req);
      expect([403, 404]).toContain(res.status);
    });

    it("rejects unauthorized user B from generating opportunities on user A's session", async () => {
      const getUserModule = await import("@/lib/auth/get-user");
      vi.spyOn(getUserModule, "getAuthUser").mockResolvedValue({
        id: attackerUserId,
        email: "attacker@example.com",
        displayName: "Attacker",
      });

      const req = new NextRequest("http://localhost:3000/api/innovation/opportunities", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/github/spec-kit",
          sessionId: targetSessionId,
        }),
      });

      const res = await opportunitiesHandler(req);
      expect([403, 404]).toContain(res.status);
    });
  });
});
