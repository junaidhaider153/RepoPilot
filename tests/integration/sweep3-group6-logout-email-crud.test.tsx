/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import AccountSettingsPage from "@/app/app/settings/account/page";
import { SessionItemData, UserProfileData } from "@/components/shell/types";
import { sendVerificationEmail } from "@/lib/email/mailer";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock AuthContext
const mockSignOut = vi.fn().mockResolvedValue(undefined);
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-test-1", email: "developer@example.com", user_metadata: { name: "Developer Lead" } },
    signOut: mockSignOut,
    isLoaded: true,
  }),
}));

// Mock ToastContext
const mockToast = vi.fn();
vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock nodemailer
const mockSendMail = vi.fn().mockResolvedValue({ messageId: "<msg-test-123@repopilot>" });
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: (...args: unknown[]) => mockSendMail(...args),
    }),
  },
}));

const sampleSession: SessionItemData = {
  id: "session-1",
  repoUrl: "https://github.com/facebook/react",
  owner: "facebook",
  repo: "react",
  title: "React Concurrent Engine",
  pinned: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleUser: UserProfileData = {
  id: "user-1",
  displayName: "Dev Lead",
  email: "dev@repopilot.local",
};

describe("Sweep 3 Group 6: Accessible Workspace Logout, CRUD, and Gemini Email Template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Workspace Log Out Affordance", () => {
    it("renders a direct, accessible sign out button in the Sidebar footer", () => {
      const handleSignOut = vi.fn();
      render(
        <Sidebar
          sessions={[sampleSession]}
          activeSessionId="session-1"
          onSelectSession={vi.fn()}
          onNewSession={vi.fn()}
          onRenameSession={vi.fn()}
          onTogglePinSession={vi.fn()}
          onDeleteSession={vi.fn()}
          onExportSession={vi.fn()}
          onToggleCollapse={vi.fn()}
          isCollapsed={false}
          user={sampleUser}
          onSignOut={handleSignOut}
        />
      );

      // Find the direct sign out button in the sidebar footer
      const signOutBtn = screen.getByRole("button", { name: /sign out|log out/i });
      expect(signOutBtn).toBeDefined();

      fireEvent.click(signOutBtn);
      expect(handleSignOut).toHaveBeenCalledTimes(1);
    });

    it("renders user avatar and sign out option in the TopBar", () => {
      const handleSignOut = vi.fn();
      render(
        <TopBar
          session={sampleSession}
          activeTab="chat"
          onTabChange={vi.fn()}
          onOpenMobileMenu={vi.fn()}
          onExportAll={vi.fn()}
          user={sampleUser}
          onSignOut={handleSignOut}
        />
      );

      // TopBar should provide an accessible sign out button
      const topBarSignOutBtn = screen.getByRole("button", { name: /sign out|log out/i });
      expect(topBarSignOutBtn).toBeDefined();

      fireEvent.click(topBarSignOutBtn);
      expect(handleSignOut).toHaveBeenCalledTimes(1);
    });

    it("renders an explicit Sign Out button for the current active session in Account Settings", async () => {
      render(<AccountSettingsPage />);

      // Find the current session sign out button
      const currentSignOutBtn = screen.getByRole("button", { name: /sign out of current session/i });
      expect(currentSignOutBtn).toBeDefined();

      fireEvent.click(currentSignOutBtn);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("2. Gemini-Styled Branded HTML Email Template", () => {
    it("generates an ultra-attractive, responsive HTML email with Gemini aesthetics and security tokens", async () => {
      process.env.SMTP_HOST = "smtp.gmail.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "auth@repopilot.com";
      process.env.SMTP_PASS = "abcdefghijklmnop";

      await sendVerificationEmail({
        toEmail: "developer@gmail.com",
        token: "sample-secure-token-12345",
        origin: "https://repopilot.app",
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];

      expect(callArgs.to).toBe("developer@gmail.com");
      expect(callArgs.subject).toContain("RepoPilot");

      const html = callArgs.html;
      // Check for Gemini-inspired design elements
      expect(html).toContain("RepoPilot");
      expect(html).toContain("developer@gmail.com");
      expect(html).toContain("https://repopilot.app/api/account/email/verify?token=sample-secure-token-12345");
      // Check for styled call to action button
      expect(html).toMatch(/Confirm Email Address|Verify Email Address/i);
      // Check for security notices
      expect(html).toMatch(/expire|24 hours/i);
      expect(html).toMatch(/safely disregard|safely ignore|did not request/i);
    });
  });

  describe("3. Workspace CRUD Operations", () => {
    it("allows renaming a session in the Sidebar", () => {
      const handleRename = vi.fn();
      render(
        <Sidebar
          sessions={[sampleSession]}
          activeSessionId="session-1"
          onSelectSession={vi.fn()}
          onNewSession={vi.fn()}
          onRenameSession={handleRename}
          onTogglePinSession={vi.fn()}
          onDeleteSession={vi.fn()}
          onExportSession={vi.fn()}
          onToggleCollapse={vi.fn()}
          isCollapsed={false}
          user={sampleUser}
        />
      );

      // Open options dropdown for the session
      const moreBtn = screen.getByLabelText(`Session options for ${sampleSession.title}`);
      fireEvent.click(moreBtn);

      // Click Rename
      const renameOption = screen.getByText("Rename");
      fireEvent.click(renameOption);

      // An input field should appear
      const editInput = screen.getByDisplayValue(sampleSession.title);
      expect(editInput).toBeDefined();

      // Change title and press Enter
      fireEvent.change(editInput, { target: { value: "Updated Session Name" } });
      fireEvent.keyDown(editInput, { key: "Enter", code: "Enter" });

      expect(handleRename).toHaveBeenCalledWith("session-1", "Updated Session Name");
    });

    it("allows toggling pin status for a session in the Sidebar", () => {
      const handleTogglePin = vi.fn();
      render(
        <Sidebar
          sessions={[sampleSession]}
          activeSessionId="session-1"
          onSelectSession={vi.fn()}
          onNewSession={vi.fn()}
          onRenameSession={vi.fn()}
          onTogglePinSession={handleTogglePin}
          onDeleteSession={vi.fn()}
          onExportSession={vi.fn()}
          onToggleCollapse={vi.fn()}
          isCollapsed={false}
          user={sampleUser}
        />
      );

      const moreBtn = screen.getByLabelText(`Session options for ${sampleSession.title}`);
      fireEvent.click(moreBtn);

      const pinOption = screen.getByText("Pin to top");
      fireEvent.click(pinOption);

      expect(handleTogglePin).toHaveBeenCalledWith("session-1");
    });

    it("allows deleting a session in the Sidebar", () => {
      const handleDelete = vi.fn();
      render(
        <Sidebar
          sessions={[sampleSession]}
          activeSessionId="session-1"
          onSelectSession={vi.fn()}
          onNewSession={vi.fn()}
          onRenameSession={vi.fn()}
          onTogglePinSession={vi.fn()}
          onDeleteSession={handleDelete}
          onExportSession={vi.fn()}
          onToggleCollapse={vi.fn()}
          isCollapsed={false}
          user={sampleUser}
        />
      );

      const moreBtn = screen.getByLabelText(`Session options for ${sampleSession.title}`);
      fireEvent.click(moreBtn);

      const deleteOption = screen.getByText("Delete Session");
      fireEvent.click(deleteOption);

      expect(handleDelete).toHaveBeenCalledWith("session-1");
    });
  });
});
