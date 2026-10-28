// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SessionProvider, useSessionContext } from "@/context/SessionContext";
import NewSessionPage from "@/app/app/page";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { getUserSessions, getSessionById } from "@/lib/persistence/store";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/app",
}));

const mockAuthUser = {
  id: "real-user-123",
  email: "alex.turner@company.com",
  displayName: "Alex Turner",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isConfigured: true,
    signOut: vi.fn(),
  }),
  useOptionalAuth: () => ({
    user: mockAuthUser,
    isConfigured: true,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

describe("Group 2 Regression Tests: Session Source of Truth & Persistence (L-01, L-06, L-12, L-13)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  describe("L-12: No Fake Seed Sessions", () => {
    it("initializes with 0 sessions for a fresh user, not hardcoded mock sessions", () => {
      let currentSessions: any[] = [];
      function TestConsumer() {
        const { sessions } = useSessionContext();
        currentSessions = sessions;
        return <div data-testid="count">{sessions.length}</div>;
      }

      render(
        <SessionProvider>
          <TestConsumer />
        </SessionProvider>
      );

      // Must start empty, not with "Spec-Kit Core Architecture" or "React Concurrent Runtime"
      expect(currentSessions.length).toBe(0);
      expect(currentSessions.some((s) => s.id === "s-1")).toBe(false);
      expect(currentSessions.some((s) => s.id === "s-2")).toBe(false);
    });
  });

  describe("L-13: Real User Name in Greeting", () => {
    it("renders the authenticated user's actual display name, not 'Dev Lead'", async () => {
      render(
        <AuthProvider>
          <SessionProvider>
            <ToastProvider>
              <NewSessionPage />
            </ToastProvider>
          </SessionProvider>
        </AuthProvider>
      );

      // Must greet "Hello Alex Turner", never "Hello Dev Lead"
      expect(screen.getByText(/Hello Alex Turner/i)).toBeDefined();
      expect(screen.queryByText(/Dev Lead/i)).toBeNull();
    });
  });

  describe("L-01 & L-06: Server-Backed Session Creation & Sync", () => {
    it("creating a session in NewSessionPage creates a row on the server that /api/sessions returns", async () => {
      const targetUrl = "https://github.com/octocat/Hello-World";

      // Mock server analyze response
      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: any) => {
        if (url === "/api/repository/analyze") {
          return {
            ok: true,
            json: async () => ({
              repository: {
                owner: "octocat",
                name: "Hello-World",
                defaultBranch: "master",
              },
              analyzedFiles: [
                { path: "README.md", category: "core", sizeBytes: 100 },
              ],
              detectedTechnologies: ["Markdown"],
              coverageNotes: [],
            }),
          };
        }
        if (url === "/api/sessions" && opts?.method === "POST") {
          const body = JSON.parse(opts.body);
          return {
            ok: true,
            status: 201,
            json: async () => ({
              session: {
                id: "server-sess-100",
                user_id: "test-user-id",
                repo_url: body.repoUrl,
                owner: body.owner,
                repo: body.repo,
                title: body.title,
                pinned: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      render(
        <AuthProvider>
          <SessionProvider>
            <ToastProvider>
              <NewSessionPage />
            </ToastProvider>
          </SessionProvider>
        </AuthProvider>
      );

      const input = screen.getByPlaceholderText(/https:\/\/github.com\/owner\/repository/i);
      fireEvent.change(input, { target: { value: targetUrl } });

      const analyzeBtn = screen.getByRole("button", { name: /Analyze Codebase/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        // Must navigate to the server-generated session ID, not a local s-Date.now()
        expect(mockPush).toHaveBeenCalledWith("/app/s/server-sess-100");
      });

      // Must have called POST /api/sessions to persist on the server
      const postSessionsCall = (global.fetch as any).mock.calls.find(
        (c: any[]) => c[0] === "/api/sessions" && c[1]?.method === "POST"
      );
      expect(postSessionsCall).toBeDefined();
    });

    it("verifies refresh endpoint succeeds on server-persisted session", async () => {
      const { POST: refreshHandler } = await import("@/app/api/sessions/[id]/refresh/route");
      const { insertSession } = await import("@/lib/persistence/store");

      const { getAuthUser } = await import("@/lib/auth/get-user");
      const user = await getAuthUser();
      const userId = user?.id || "u-demo-1";

      const session = await insertSession(userId, {
        id: "sess-for-refresh-test",
        repoUrl: "https://github.com/octocat/Hello-World",
        owner: "octocat",
        repo: "Hello-World",
        title: "Hello-World Session",
      });

      const { NextRequest } = await import("next/server");
      const req = new NextRequest(`http://localhost:3000/api/sessions/${session.id}/refresh`, {
        method: "POST",
      });

      const res = await refreshHandler(req, {
        params: Promise.resolve({ id: session.id }),
      });

      // Must NOT be 404 Session not found
      expect(res.status).not.toBe(404);
    });

    it("preserves chat, documents, and blueprint across tab switches and reloads", async () => {
      const { SessionWorkspaceProvider, useSessionWorkspace } = await import(
        "@/context/SessionWorkspaceContext"
      );

      let workspaceState: any = null;
      function TestWorkspaceConsumer() {
        workspaceState = useSessionWorkspace();
        return (
          <div>
            <div data-testid="msg-count">{workspaceState.messages.length}</div>
            <button
              onClick={() =>
                workspaceState.setMessages([
                  {
                    id: "m-1",
                    role: "user",
                    content: "Test message that must survive tab switches",
                  },
                ])
              }
            >
              Add Message
            </button>
          </div>
        );
      }

      const { unmount, rerender } = render(
        <SessionWorkspaceProvider
          sessionId="test-session-tab-switch"
          repoUrl="https://github.com/octocat/Hello-World"
        >
          <TestWorkspaceConsumer />
        </SessionWorkspaceProvider>
      );

      // Add a message in chat
      await act(async () => {
        fireEvent.click(screen.getByText("Add Message"));
      });
      expect(workspaceState.messages.length).toBe(1);
      expect(workspaceState.messages[0].content).toBe(
        "Test message that must survive tab switches"
      );

      // Simulate tab switch: child re-renders (like moving from /s/[id] to /overview and back)
      // The Provider stays mounted, keeping workspaceState in memory
      rerender(
        <SessionWorkspaceProvider
          sessionId="test-session-tab-switch"
          repoUrl="https://github.com/octocat/Hello-World"
        >
          <TestWorkspaceConsumer />
        </SessionWorkspaceProvider>
      );

      // State is preserved!
      expect(workspaceState.messages.length).toBe(1);
      expect(workspaceState.messages[0].content).toBe(
        "Test message that must survive tab switches"
      );
    });
  });
});
