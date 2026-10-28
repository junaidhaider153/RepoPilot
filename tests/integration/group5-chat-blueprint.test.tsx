// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ToastProvider } from "@/components/ui/Toast";
import { NextRequest } from "next/server";
import { POST as chatHandler } from "@/app/api/repository/chat/route";
import { POST as opportunitiesHandler } from "@/app/api/innovation/opportunities/route";
import { POST as blueprintHandler } from "@/app/api/innovation/blueprint/route";
import {
  insertSession,
  getSessionMessages,
  getSessionBlueprint,
  upsertSessionBlueprint,
} from "@/lib/persistence/store";

describe("Group 5 Regression Tests: Chat & Blueprint Logic Errors (L-07, L-08, L-09, L-10)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  describe("L-09: Retry and Regenerate Do Not Duplicate Messages in ChatPanel", () => {
    it("retry reuses the existing user message without appending a duplicate", async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/messages")) {
          return { ok: true, json: async () => ({ messages: [] }) };
        }
        if (url === "/api/repository/chat") {
          callCount++;
          if (callCount === 1) {
            // First call fails
            return {
              ok: false,
              status: 500,
              json: async () => ({ error: { message: "AI provider timeout on first attempt" } }),
            };
          }
          // Second call (retry) succeeds
          return {
            ok: true,
            status: 200,
            json: async () => ({
              answer: "Success on retry",
              evidence: [],
              confidence: "high",
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      render(
        <ToastProvider>
          <ChatPanel repoUrl="https://github.com/octocat/Hello-World" sessionId="retry-test-sess" />
        </ToastProvider>
      );

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Why did this fail?" } });

      const sendBtn = screen.getByRole("button", { name: /Send question/i });
      fireEvent.click(sendBtn);

      // Wait for error and Retry button
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Retry/i })).toBeDefined();
      });

      // Confirm exactly 1 copy of the user question is in the document
      const userQuestionsBefore = screen.getAllByText("Why did this fail?");
      expect(userQuestionsBefore.length).toBe(1);

      // Click Retry
      const retryBtn = screen.getByRole("button", { name: /Retry/i });
      await act(async () => {
        fireEvent.click(retryBtn);
      });

      // Must NOT append a second "Why did this fail?" user bubble
      await waitFor(() => {
        expect(screen.getByText("Success on retry")).toBeDefined();
      });

      const userQuestionsAfter = screen.getAllByText("Why did this fail?");
      expect(userQuestionsAfter.length).toBe(1);
    });

    it("regenerate replaces or updates the assistant answer without appending a duplicate user question", async () => {
      let asstCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/messages")) {
          return { ok: true, json: async () => ({ messages: [] }) };
        }
        if (url === "/api/repository/chat") {
          asstCount++;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              answer: asstCount === 1 ? "First generated answer" : "Second refreshed answer",
              evidence: [],
              confidence: "high",
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      render(
        <ToastProvider>
          <ChatPanel repoUrl="https://github.com/octocat/Hello-World" sessionId="regen-test-sess" />
        </ToastProvider>
      );

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Tell me about this codebase" } });
      const sendBtn = screen.getByRole("button", { name: /Send question/i });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText("First generated answer")).toBeDefined();
      });

      expect(screen.getAllByText("Tell me about this codebase").length).toBe(1);

      // Click regenerate
      const regenBtn = screen.getByRole("button", { name: /Regenerate answer/i });
      await act(async () => {
        fireEvent.click(regenBtn);
      });

      await waitFor(() => {
        expect(screen.getByText("Second refreshed answer")).toBeDefined();
      });

      // Must NOT have appended a duplicate user message
      expect(screen.getAllByText("Tell me about this codebase").length).toBe(1);
    });
  });

  describe("L-10: No Orphan User Message Saved When AI Call Fails", () => {
    it("does not save user message to persistent store if AI provider call fails", async () => {
      const { getAuthUser } = await import("@/lib/auth/get-user");
      const user = await getAuthUser();
      const userId = user?.id || "u-demo-1";
      const sessId = `sess-orphan-${Date.now()}`;

      await insertSession(userId, {
        id: sessId,
        repoUrl: "https://github.com/octocat/Hello-World",
        owner: "octocat",
        repo: "Hello-World",
        title: "Orphan Test Session",
      });

      // Mock answerRepositoryQuestion to throw an error
      const { answerRepositoryQuestion } = await import("@/lib/chat/answer-question");
      vi.spyOn({ answerRepositoryQuestion }, "answerRepositoryQuestion").mockRejectedValue(
        new Error("AI Model unavailable")
      );

      // Force import mock of answer-question module
      vi.doMock("@/lib/chat/answer-question", () => ({
        answerRepositoryQuestion: vi.fn().mockRejectedValue(new Error("AI Model unavailable")),
      }));

      const { POST: chatRouteHandler } = await import("@/app/api/repository/chat/route");
      const req = new NextRequest("http://localhost:3000/api/repository/chat", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/octocat/Hello-World",
          question: "A question that will fail during AI generation",
          sessionId: sessId,
        }),
      });

      const res = await chatRouteHandler(req);
      expect(res.status).toBe(500);

      // Verify persistence store: must NOT have an orphan user message!
      const messages = await getSessionMessages(sessId);
      expect(messages.length).toBe(0);
    });
  });

  describe("L-07 & L-08: Blueprint Selection and Opportunity Regeneration", () => {
    it("L-08: regenerating opportunities preserves the existing saved plan", async () => {
      const { getAuthUser } = await import("@/lib/auth/get-user");
      const user = await getAuthUser();
      const userId = user?.id || "u-demo-1";
      const sessId = `sess-bp-regen-${Date.now()}`;

      await insertSession(userId, {
        id: sessId,
        repoUrl: "https://github.com/octocat/Hello-World",
        owner: "octocat",
        repo: "Hello-World",
        title: "Blueprint Session",
      });

      // Existing blueprint with a generated plan
      await upsertSessionBlueprint(sessId, {
        opportunities: [{ id: "opp-1", title: "Existing Opportunity" }],
        selectedIndex: 0,
        planJson: {
          title: "Critical Implementation Plan that must survive opportunity refresh",
          phases: [{ name: "Phase 1" }],
        },
      });

      // Mock opportunities generation
      vi.doMock("@/lib/innovation/generate-opportunities", () => ({
        generateInnovationOpportunities: vi.fn().mockResolvedValue([
          { id: "opp-new-1", title: "New Opportunity 1" },
          { id: "opp-new-2", title: "New Opportunity 2" },
          { id: "opp-new-3", title: "New Opportunity 3" },
        ]),
      }));

      const { POST: oppHandler } = await import("@/app/api/innovation/opportunities/route");
      const req = new NextRequest("http://localhost:3000/api/innovation/opportunities", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/octocat/Hello-World",
          sessionId: sessId,
        }),
      });

      const res = await oppHandler(req);
      expect(res.status).toBe(200);

      // Check blueprint in store: plan_json must NOT be null!
      const bp = await getSessionBlueprint(sessId);
      expect(bp).not.toBeNull();
      expect(bp?.plan_json).not.toBeNull();
      expect((bp?.plan_json as any)?.title).toBe(
        "Critical Implementation Plan that must survive opportunity refresh"
      );
    });

    it("L-07: blueprint generation saves and preserves selectedIndex", async () => {
      const { getAuthUser } = await import("@/lib/auth/get-user");
      const user = await getAuthUser();
      const userId = user?.id || "u-demo-1";
      const sessId = `sess-bp-select-${Date.now()}`;

      await insertSession(userId, {
        id: sessId,
        repoUrl: "https://github.com/octocat/Hello-World",
        owner: "octocat",
        repo: "Hello-World",
        title: "Blueprint Selection Session",
      });

      // Mock blueprint generation
      vi.doMock("@/lib/innovation/generate-blueprint", () => ({
        generateInnovationBlueprint: vi.fn().mockResolvedValue({
          title: "Blueprint for Third Opportunity",
          architectureNotes: "Test architecture",
          phases: [{ name: "Phase 1", tasks: ["Task 1"] }],
          codeArtifacts: [],
        }),
      }));

      const { POST: bpHandler } = await import("@/app/api/innovation/blueprint/route");
      const req = new NextRequest("http://localhost:3000/api/innovation/blueprint", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/octocat/Hello-World",
          opportunity: { id: "opp-3", title: "Third Opportunity" },
          sessionId: sessId,
          selectedIndex: 2,
        }),
      });

      const res = await bpHandler(req);
      expect(res.status).toBe(200);

      const bp = await getSessionBlueprint(sessId);
      expect(bp?.selected_index).toBe(2);
    });
  });
});
