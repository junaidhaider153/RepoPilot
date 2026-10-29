// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "@/app/page";
import { ToastProvider } from "@/components/ui/Toast";
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockUser: { id: string; email: string; displayName?: string } | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isConfigured: true,
    signOut: vi.fn(),
  }),
  useOptionalAuth: () => ({
    user: mockUser,
    isConfigured: true,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mockUser },
      }),
    },
  }),
}));

describe("Group 6 Regression Tests: Landing Page Redesign (Issues 1 & 2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUser = null;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  describe("Requirement 1: Logged-in users redirect to /app", () => {
    it("redirects authenticated users opening / to /app on the client", async () => {
      mockUser = { id: "u-logged-in-1", email: "user@example.com", displayName: "Logged User" };

      render(
        <ToastProvider>
          <HomePage />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/app");
      });
    });
  });

  describe("Requirement 2: Chat-first guest entry layout", () => {
    it("renders slim top bar with Product, How it works, Open workspace, and Log in", () => {
      render(
        <ToastProvider>
          <HomePage />
        </ToastProvider>
      );

      expect(screen.getByRole("link", { name: /RepoPilot/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /How it works/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /Open workspace/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /Log in/i })).toBeDefined();
    });

    it("renders centered composer with 'Paste a GitHub URL to start', sample chips, and How it works section", () => {
      render(
        <ToastProvider>
          <HomePage />
        </ToastProvider>
      );

      const input = screen.getByPlaceholderText(/Paste a GitHub URL to start/i);
      expect(input).toBeDefined();

      // Sample repos chips
      expect(screen.getByText("Hello-World")).toBeDefined();
      expect(screen.getByText("react")).toBeDefined();

      // How it works section strip
      expect(screen.getByText(/How RepoPilot Works/i)).toBeDefined();

      // The old 4-tab monolith navigation buttons must NOT be rendered initially
      expect(screen.queryByText("01 / Overview")).toBeNull();
      expect(screen.queryByText("02 / Ask Codebase")).toBeNull();
    });
  });

  describe("Requirement 3: Guest workspace submission and banner", () => {
    it("shows banner to sign in and displays chat-first workspace upon submitting URL", async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === "/api/repository/analyze") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              repository: {
                fullName: "octocat/Hello-World",
                htmlUrl: "https://github.com/octocat/Hello-World",
                starsCount: 100,
                forksCount: 50,
                openIssuesCount: 2,
                defaultBranch: "master",
                description: "Sample repo",
              },
              analysis: {
                summary: "Simple repository",
                architectureDescription: "Single entrypoint",
                boundedContextSummary: "README and entry file",
              },
              detectedTechnologies: ["JavaScript"],
              analyzedFiles: [{ path: "README.md", size: 100, excerpt: "Hello World repo" }],
              coverageNotes: ["Complete coverage"],
              aiDisclosure: { configured: true, model: "Gemma 2" },
            }),
          };
        }
        if (url.includes("/messages")) {
          return { ok: true, status: 200, json: async () => ({ messages: [] }) };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      render(
        <ToastProvider>
          <HomePage />
        </ToastProvider>
      );

      const input = screen.getByPlaceholderText(/Paste a GitHub URL to start/i);
      fireEvent.change(input, { target: { value: "https://github.com/octocat/Hello-World" } });

      const submitBtn = screen.getByRole("button", { name: /Start Exploring|Analyze/i });
      fireEvent.click(submitBtn);

      // Verify sign in banner appears
      await waitFor(() => {
        expect(screen.getByText(/Guest Workspace:/i)).toBeDefined();
        expect(
          screen.getByRole("link", { name: /Sign in to save this session/i })
        ).toBeDefined();
      });

      // Verify it is chat-first (Chat is active and visible)
      expect(
        screen.getByPlaceholderText(/Ask a question about the repository/i)
      ).toBeDefined();
    });
  });
});
