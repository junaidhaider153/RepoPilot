// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { SessionProvider, useSessionContext } from "@/context/SessionContext";
import { TopBar } from "@/components/shell/TopBar";
import { SessionItemData } from "@/components/shell/types";

const mockSession: SessionItemData = {
  id: "session-abc",
  repoUrl: "https://github.com/github/spec-kit",
  owner: "github",
  repo: "spec-kit",
  title: "github/spec-kit",
  pinned: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Module 10 - Route Split and Session State", () => {
  describe("SessionContext Store", () => {
    it("creates a new session with correct owner and repo parsing", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionProvider>{children}</SessionProvider>
      );
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      let createdId = "";
      act(() => {
        createdId = result.current.createSession("https://github.com/octocat/Spoon-Knife");
      });

      expect(createdId).toMatch(/^s-/);
      const found = result.current.getSession(createdId);
      expect(found).toBeDefined();
      expect(found?.owner).toBe("octocat");
      expect(found?.repo).toBe("Spoon-Knife");
      expect(found?.title).toBe("octocat/Spoon-Knife");
    });

    it("toggles pin status and renames session", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionProvider>{children}</SessionProvider>
      );
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      let sessionId = "";
      act(() => {
        sessionId = result.current.createSession("https://github.com/test-org/test-repo");
      });

      // Pin
      act(() => {
        result.current.togglePinSession(sessionId);
      });
      expect(result.current.getSession(sessionId)?.pinned).toBe(true);

      // Rename
      act(() => {
        result.current.renameSession(sessionId, "Custom Analysis Title");
      });
      expect(result.current.getSession(sessionId)?.title).toBe("Custom Analysis Title");
    });

    it("deletes session and allows restoration via undo", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionProvider>{children}</SessionProvider>
      );
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      let sessionId = "";
      act(() => {
        sessionId = result.current.createSession("https://github.com/temp/delete-me");
      });

      let removed: SessionItemData | undefined;
      act(() => {
        removed = result.current.deleteSession(sessionId);
      });

      expect(removed?.id).toBe(sessionId);
      expect(result.current.getSession(sessionId)).toBeUndefined();

      // Restore
      act(() => {
        if (removed) result.current.restoreSession(removed);
      });
      expect(result.current.getSession(sessionId)).toBeDefined();
    });
  });

  describe("TopBar Tab Links", () => {
    it("renders real link hrefs for each workspace tab", () => {
      render(
        <TopBar
          session={mockSession}
          activeTab="overview"
          onTabChange={vi.fn()}
          onOpenMobileMenu={vi.fn()}
          onExportAll={vi.fn()}
        />
      );

      // Verify each tab has a valid href attribute
      const chatLink = screen.getByRole("tab", { name: /Chat/i });
      expect(chatLink.getAttribute("href")).toBe("/app/s/session-abc");

      const overviewLink = screen.getByRole("tab", { name: /Overview/i });
      expect(overviewLink.getAttribute("href")).toBe("/app/s/session-abc/overview");
      expect(overviewLink.getAttribute("aria-selected")).toBe("true");

      const docsLink = screen.getByRole("tab", { name: /Documents/i });
      expect(docsLink.getAttribute("href")).toBe("/app/s/session-abc/documents");

      const blueprintLink = screen.getByRole("tab", { name: /Blueprint/i });
      expect(blueprintLink.getAttribute("href")).toBe("/app/s/session-abc/blueprint");
    });

    it("invokes onTabChange when tab link is clicked", () => {
      const handleTabChange = vi.fn();
      render(
        <TopBar
          session={mockSession}
          activeTab="chat"
          onTabChange={handleTabChange}
          onOpenMobileMenu={vi.fn()}
          onExportAll={vi.fn()}
        />
      );

      const docsLink = screen.getByRole("tab", { name: /Documents/i });
      fireEvent.click(docsLink);
      expect(handleTabChange).toHaveBeenCalledWith("documents");
    });
  });
});
