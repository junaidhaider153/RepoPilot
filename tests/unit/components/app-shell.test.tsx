// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { SessionItemData, UserProfileData } from "@/components/shell/types";

const mockSessions: SessionItemData[] = [
  {
    id: "s-1",
    repoUrl: "https://github.com/github/spec-kit",
    owner: "github",
    repo: "spec-kit",
    title: "Spec-Kit Core Architecture",
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "s-2",
    repoUrl: "https://github.com/facebook/react",
    owner: "facebook",
    repo: "react",
    title: "React Concurrent Runtime",
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockUser: UserProfileData = {
  id: "u-1",
  email: "developer@example.com",
  displayName: "Dev Lead",
};

describe("App Shell Components - Module 9", () => {
  describe("Sidebar", () => {
    it("renders session list and pinned section", () => {
      render(
        <Sidebar
          sessions={mockSessions}
          activeSessionId="s-1"
          onSelectSession={vi.fn()}
          onNewSession={vi.fn()}
          onRenameSession={vi.fn()}
          onTogglePinSession={vi.fn()}
          onDeleteSession={vi.fn()}
          onExportSession={vi.fn()}
          onToggleCollapse={vi.fn()}
          isCollapsed={false}
          user={mockUser}
        />
      );

      expect(screen.getByText("Spec-Kit Core Architecture")).toBeDefined();
      expect(screen.getByText("React Concurrent Runtime")).toBeDefined();
      expect(screen.getByText("Pinned")).toBeDefined();
    });

    it("filters sessions via search input", () => {
      render(
        <Sidebar
          sessions={mockSessions}
          activeSessionId="s-1"
          onSelectSession={vi.fn()}
          onNewSession={vi.fn()}
          onRenameSession={vi.fn()}
          onTogglePinSession={vi.fn()}
          onDeleteSession={vi.fn()}
          onExportSession={vi.fn()}
          onToggleCollapse={vi.fn()}
          isCollapsed={false}
          user={mockUser}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search sessions...");
      fireEvent.change(searchInput, { target: { value: "Spec-Kit" } });

      expect(screen.getByText("Spec-Kit Core Architecture")).toBeDefined();
      expect(screen.queryByText("React Concurrent Runtime")).toBeNull();
    });

    it("triggers onNewSession when clicking New Session button", () => {
      const handleNew = vi.fn();
      render(
        <Sidebar
          sessions={mockSessions}
          activeSessionId="s-1"
          onSelectSession={vi.fn()}
          onNewSession={handleNew}
          onRenameSession={vi.fn()}
          onTogglePinSession={vi.fn()}
          onDeleteSession={vi.fn()}
          onExportSession={vi.fn()}
          onToggleCollapse={vi.fn()}
          isCollapsed={false}
          user={mockUser}
        />
      );

      const newBtn = screen.getByRole("button", { name: /New Session/i });
      fireEvent.click(newBtn);
      expect(handleNew).toHaveBeenCalledTimes(1);
    });
  });

  describe("TopBar", () => {
    it("renders repo chip and tab navigation", () => {
      const handleTabChange = vi.fn();
      render(
        <TopBar
          session={mockSessions[0]}
          activeTab="chat"
          onTabChange={handleTabChange}
          onOpenMobileMenu={vi.fn()}
          onExportAll={vi.fn()}
          modelName="gemini-flash-lite-latest"
        />
      );

      expect(screen.getByText("github/spec-kit")).toBeDefined();
      expect(screen.getByText("Chat")).toBeDefined();
      expect(screen.getByText("gemini-flash-lite-latest")).toBeDefined();

      const docsTab = screen.getByRole("tab", { name: /Documents/i });
      fireEvent.click(docsTab);
      expect(handleTabChange).toHaveBeenCalledWith("documents");
    });
  });
});
