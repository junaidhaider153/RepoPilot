// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommandPalette } from "@/components/shell/CommandPalette";
import LibraryPage from "@/app/app/library/page";
import { ToastProvider } from "@/components/ui/Toast";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/app/library",
}));

describe("Module 15: Polish and Release", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  describe("CommandPalette Component", () => {
    const mockSessions = [
      {
        id: "sess-1",
        repoUrl: "https://github.com/facebook/react",
        owner: "facebook",
        repo: "react",
        title: "React Core",
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it("renders search input and commands when open", () => {
      const onClose = vi.fn();
      const onNewSession = vi.fn();

      render(
        <CommandPalette
          isOpen={true}
          onClose={onClose}
          sessions={mockSessions}
          onNewSession={onNewSession}
        />
      );

      expect(screen.getByPlaceholderText(/Type a command or search sessions/i)).toBeDefined();
      expect(screen.getByText("New Repository Session")).toBeDefined();
      expect(screen.getByText("Document Library")).toBeDefined();
      expect(screen.getByText(/React Core/)).toBeDefined();
    });

    it("filters commands based on search query", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={vi.fn()}
          sessions={mockSessions}
          onNewSession={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/Type a command or search sessions/i);
      fireEvent.change(input, { target: { value: "Library" } });

      expect(screen.getByText("Document Library")).toBeDefined();
      expect(screen.queryByText("New Repository Session")).toBeNull();
    });

    it("navigates actions using keyboard arrows and Enter", () => {
      const onClose = vi.fn();
      const onNewSession = vi.fn();

      render(
        <CommandPalette
          isOpen={true}
          onClose={onClose}
          sessions={mockSessions}
          onNewSession={onNewSession}
        />
      );

      const input = screen.getByPlaceholderText(/Type a command or search sessions/i);

      // Press Enter on the first item (New Repository Session)
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onNewSession).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape key", () => {
      const onClose = vi.fn();

      render(
        <CommandPalette
          isOpen={true}
          onClose={onClose}
          sessions={mockSessions}
          onNewSession={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/Type a command or search sessions/i);
      fireEvent.keyDown(input, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Library Page Component", () => {
    const mockLibraryDocs = [
      {
        id: "doc-1",
        sessionId: "sess-1",
        repoUrl: "https://github.com/facebook/react",
        repoName: "facebook/react",
        sessionTitle: "React Session",
        kind: "prd" as const,
        contentMd: "# React PRD Content",
        version: 1,
        createdAt: "2026-10-29T00:00:00.000Z",
      },
      {
        id: "doc-2",
        sessionId: "sess-1",
        repoUrl: "https://github.com/facebook/react",
        repoName: "facebook/react",
        sessionTitle: "React Session",
        kind: "trd" as const,
        contentMd: "# React TRD Content",
        version: 1,
        createdAt: "2026-10-28T00:00:00.000Z",
      },
    ];

    it("fetches and renders specifications in library table", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ documents: mockLibraryDocs }),
      });

      render(
        <ToastProvider>
          <LibraryPage />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Product Requirements Document/i)).toBeDefined();
        expect(screen.getByText(/Technical Requirements Document/i)).toBeDefined();
      });

      expect(screen.getAllByText("facebook/react").length).toBeGreaterThanOrEqual(1);
    });

    it("filters documents by specification type pill", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ documents: mockLibraryDocs }),
      });

      render(
        <ToastProvider>
          <LibraryPage />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Product Requirements Document/i)).toBeDefined();
      });

      // Click TRD filter pill
      const trdBtn = screen.getByRole("button", { name: "TRD" });
      fireEvent.click(trdBtn);

      expect(screen.getByText(/Technical Requirements Document/i)).toBeDefined();
      expect(screen.queryByText(/Product Requirements Document/i)).toBeNull();
    });

    it("renders empty state when no documents match search", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ documents: [] }),
      });

      render(
        <ToastProvider>
          <LibraryPage />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("No documents found")).toBeDefined();
      });

      expect(screen.getByText("Explore a Repository")).toBeDefined();
    });
  });
});
