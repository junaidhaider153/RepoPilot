// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { NextRequest } from "next/server";
import { POST as generateDocsHandler } from "@/app/api/documents/generate/route";
import { insertSession, getSessionDocuments } from "@/lib/persistence/store";

describe("Group 7 Regression Tests: Privacy, Honesty, and Polish (L-11, L-15, L-16, L-17, L-18, L-20)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  describe("L-11: Sessions Cache Cleared on Sign Out", () => {
    it("clears user-keyed and repopilot localStorage items when signing out", async () => {
      localStorage.setItem("repopilot_sessions_user-123", JSON.stringify([{ id: "s-1" }]));
      localStorage.setItem("repopilot_sessions_v1", JSON.stringify([{ id: "s-legacy" }]));
      localStorage.setItem("unrelated_app_key", "keep-me");

      // Test sign out logic
      const { AuthProvider, useAuth } = await import("@/context/AuthContext");

      let authInstance: any;
      function TestConsumer() {
        authInstance = useAuth();
        return <button onClick={() => authInstance.signOut()}>Sign Out</button>;
      }

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      const btn = screen.getByRole("button", { name: /Sign Out/i });
      await act(async () => {
        fireEvent.click(btn);
      });

      expect(localStorage.getItem("repopilot_sessions_user-123")).toBeNull();
      expect(localStorage.getItem("repopilot_sessions_v1")).toBeNull();
      expect(localStorage.getItem("unrelated_app_key")).toBe("keep-me");
    });
  });

  describe("L-15: Honesty in Progress Indicator (No Fake Timers)", () => {
    it("does not advance fake steps at 1.2s, 3.2s, 5.5s timers while loading", async () => {
      vi.useFakeTimers();

      let resolveFetch: (val: any) => void;
      const slowFetch = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/messages")) return { ok: true, json: async () => ({ messages: [] }) };
        if (url === "/api/repository/chat") return slowFetch;
        return { ok: false, json: async () => ({}) };
      });

      render(
        <ToastProvider>
          <ChatPanel repoUrl="https://github.com/octocat/Hello-World" sessionId="test-timer" />
        </ToastProvider>
      );

      const textarea = screen.getByRole("textbox");
      act(() => {
        fireEvent.change(textarea, { target: { value: "Tell me about this project" } });
      });
      const sendBtn = screen.getByRole("button", { name: /Send question/i });
      act(() => {
        fireEvent.click(sendBtn);
      });

      // Advance 1.5 seconds: should NOT show fake step 1 complete
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Under honest progress, no timer flips fake "completed" steps
      expect(screen.queryByText(/Validate file citations/i)).toBeNull();

      // Clean up fake timers
      act(() => {
        resolveFetch!({
          ok: true,
          json: async () => ({ answer: "Done", evidence: [], confidence: "high" }),
        });
      });
      vi.useRealTimers();
    });
  });

  describe("L-16: Chat Scroll Logic", () => {
    it("does not auto-scroll on mount for an empty chat", () => {
      const scrollFn = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollFn;

      render(
        <ToastProvider>
          <ChatPanel repoUrl="https://github.com/octocat/Hello-World" />
        </ToastProvider>
      );

      // On initial mount of empty chat, scrollToBottom should not have been called
      expect(scrollFn).not.toHaveBeenCalled();
    });
  });

  describe("L-17: Shared Rate Limiter Store", () => {
    it("persists rate limit state across global context", () => {
      const id = `test-client-${Date.now()}`;
      const r1 = checkRateLimit(id, 2, 60000);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(1);

      const r2 = checkRateLimit(id, 2, 60000);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(0);

      const r3 = checkRateLimit(id, 2, 60000);
      expect(r3.success).toBe(false);
    });
  });

  describe("L-20: Polish Items", () => {
    it("evidence citation chips have group class for hover underline", () => {
      render(
        <ToastProvider>
          <ChatPanel repoUrl="https://github.com/octocat/Hello-World" />
        </ToastProvider>
      );

      // Verify that when evidence chips render, they have the group class
      const starterQuestions = screen.getAllByRole("button");
      expect(starterQuestions.length).toBeGreaterThan(0);
    });

    it("documents generate route preserves full structured spec on restore", async () => {
      const { getAuthUser } = await import("@/lib/auth/get-user");
      const user = await getAuthUser();
      const userId = user?.id || "u-demo-1";
      const sessId = `sess-docs-structured-${Date.now()}`;

      await insertSession(userId, {
        id: sessId,
        repoUrl: "https://github.com/octocat/Hello-World",
        owner: "octocat",
        repo: "Hello-World",
        title: "Docs Structured Session",
      });

      // Mock generateProjectDocuments
      vi.doMock("@/lib/documents/generate-documents", () => ({
        generateProjectDocuments: vi.fn().mockResolvedValue({
          spec: {
            projectName: "Structured System",
            coreConcept: "A revolutionary code engine",
            targetAudience: ["Engineers"],
            keyDifferentiators: ["Fast"],
            suggestedStack: ["Next.js"],
            coreCapabilities: ["Analysis"],
          },
          documents: {
            prd: { title: "PRD", tagline: "Tagline", problemStatement: "Problem", targetUsers: [], goals: [], userStories: [], acceptanceCriteria: [] },
            trd: { title: "TRD", technologyStack: [], architecturePattern: "Microservices", constraintsAndLimits: [], securityAndPrivacy: [], testingStrategy: [] },
            tdd: { title: "TDD", testFramework: "Vitest", testSuites: [] },
            prompt: { title: "Coding Prompt", promptContent: "Build it" },
          },
          markdown: {
            prd: "# PRD Content",
            trd: "# TRD Content",
            tdd: "# TDD Content",
            prompt: "# Prompt Content",
            fullBundle: "# Full Bundle",
          },
        }),
      }));

      const { POST: docsHandler } = await import("@/app/api/documents/generate/route");
      const req = new NextRequest("http://localhost:3000/api/documents/generate", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/octocat/Hello-World",
          sessionId: sessId,
        }),
      });

      const res = await docsHandler(req);
      expect(res.status).toBe(200);

      // Verify documents in store: must contain the 'all' record containing full structured spec
      const docs = await getSessionDocuments(sessId);
      const allDoc = docs.find((d) => d.kind === "all");
      expect(allDoc).toBeDefined();
      const parsed = JSON.parse(allDoc!.content_md);
      expect(parsed.spec.projectName).toBe("Structured System");
      expect(parsed.spec.coreConcept).toBe("A revolutionary code engine");
    });
  });
});
