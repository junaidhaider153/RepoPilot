// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import NewSessionPage from "@/app/app/page";
import { ToastProvider } from "@/components/ui/Toast";
import { SessionProvider } from "@/context/SessionContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/app",
}));

const mockUser = {
  id: "u-demo-1",
  email: "developer@example.com",
  displayName: "Developer",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isConfigured: false,
    signOut: vi.fn(),
  }),
  useOptionalAuth: () => ({
    user: mockUser,
    isConfigured: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

describe("Sweep 3 - Group 1 Regression Tests: Global Persistence & Self-Healing (E-01, E-02, E-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  describe("E-01: Shared Global Store Singletons", () => {
    it("persists in-memory stores on globalThis so isolated route chunks share data", async () => {
      // Import store
      const store = await import("@/lib/persistence/store");

      const testSessId = `sess-shared-${Date.now()}`;
      await store.insertSession("u-demo-1", {
        id: testSessId,
        repoUrl: "https://github.com/octocat/Hello-World",
        owner: "octocat",
        repo: "Hello-World",
        title: "octocat/Hello-World",
      });

      // Verify that globalThis has the singleton store reference
      const globalStore = (globalThis as any).__repopilot_memorySessions;
      expect(globalStore).toBeDefined();
      expect(globalStore.has(testSessId)).toBe(true);

      const found = await store.getSessionById("u-demo-1", testSessId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(testSessId);
    });
  });

  describe("E-02: Honest Error Handling in NewSessionPage (No Silent Fallback)", () => {
    it("surfaces server session creation errors and does not navigate into an unpersisted session", async () => {
      let analyzeCalled = false;

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === "/api/sessions") {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              error: { message: "Database connection failed during session creation." },
            }),
          };
        }
        if (url === "/api/repository/analyze") {
          analyzeCalled = true;
          return { ok: true, json: async () => ({}) };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      render(
        <ToastProvider>
          <SessionProvider>
            <NewSessionPage />
          </SessionProvider>
        </ToastProvider>
      );

      const input = screen.getByLabelText(/GitHub Repository URL/i);
      fireEvent.change(input, { target: { value: "https://github.com/octocat/Hello-World" } });

      const submitBtn = screen.getByRole("button", { name: /Start Session|Analyze/i });
      fireEvent.click(submitBtn);

      // Must display the honest error message
      await waitFor(() => {
        expect(
          screen.getByText(/Database connection failed during session creation/i)
        ).toBeDefined();
      });

      // Must NOT proceed to analyze or navigate to /app/s/...
      expect(analyzeCalled).toBe(false);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("E-03: Self-Healing Session Rehydration", () => {
    it("re-registers session on server when server returns 404 but client holds session", async () => {
      const sessId = "sess-reboot-recover-1";
      localStorage.setItem(
        "repopilot_sessions_u-demo-1",
        JSON.stringify([
          {
            id: sessId,
            repoUrl: "https://github.com/octocat/Hello-World",
            owner: "octocat",
            repo: "Hello-World",
            title: "octocat/Hello-World",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
      );

      let reRegistered = false;
      global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
        if (url === `/api/sessions/${sessId}`) {
          // Server process rebooted: session not in server memory
          return { ok: false, status: 404, json: async () => ({}) };
        }
        if (url === "/api/sessions" && init?.method === "POST") {
          // Self-healing re-registration
          reRegistered = true;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              session: {
                id: sessId,
                repo_url: "https://github.com/octocat/Hello-World",
                owner: "octocat",
                repo: "Hello-World",
                title: "octocat/Hello-World",
              },
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      const SessionLayout = (await import("@/app/app/s/[id]/layout")).default;

      await act(async () => {
        render(
          <ToastProvider>
            <SessionProvider>
              <React.Suspense fallback={<div>Loading...</div>}>
                <SessionLayout params={Promise.resolve({ id: sessId })}>
                  <div>Session Content</div>
                </SessionLayout>
              </React.Suspense>
            </SessionProvider>
          </ToastProvider>
        );
      });

      await waitFor(() => {
        expect(reRegistered).toBe(true);
      });
    });
  });
});

