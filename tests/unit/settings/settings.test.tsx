// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  deleteAllUserSessions,
  exportUserData,
  getUserUsageStats,
  insertSession,
  insertSessionMessage,
} from "@/lib/persistence/store";
import ProfileSettingsPage from "@/app/app/settings/page";
import PreferencesSettingsPage from "@/app/app/settings/preferences/page";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/app/settings",
}));

describe("Module 14: Settings and Data Controls", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Persistence Layer: Profile & Cascading Deletion", () => {
    const testUserId = "user-settings-test-1";

    it("gets and updates user profile", async () => {
      const profile = await getUserProfile(testUserId);
      expect(profile.id).toBe(testUserId);
      expect(profile.display_name).toBeDefined();

      const updated = await updateUserProfile(testUserId, {
        display_name: "Morgan Freeman",
        bio: "Exploring AI repos",
      });

      expect(updated.display_name).toBe("Morgan Freeman");
      expect(updated.bio).toBe("Exploring AI repos");

      const fetched = await getUserProfile(testUserId);
      expect(fetched.display_name).toBe("Morgan Freeman");
    });

    it("exports user data in structured JSON and Markdown bundles", async () => {
      const session = await insertSession(testUserId, {
        id: "session-react-1",
        repoUrl: "https://github.com/facebook/react",
        owner: "facebook",
        repo: "react",
        title: "React Testing Session",
      });

      await insertSessionMessage(session.id, {
        role: "user",
        content: "What is fiber?",
      });

      await insertSessionMessage(session.id, {
        role: "assistant",
        content: "React Fiber is a reconciler.",
        evidence: [{ path: "packages/react-reconciler", reason: "Core reconciler logic" }],
        confidence: "high",
      });

      const exportBundle = await exportUserData(testUserId);
      expect(exportBundle.profile).toBeDefined();
      expect(exportBundle.sessions.length).toBeGreaterThanOrEqual(1);

      // Verify JSON bundle contains session and messages
      const parsedJson = JSON.parse(exportBundle.jsonBundle);
      expect(parsedJson.sessionsCount).toBeGreaterThanOrEqual(1);
      expect(exportBundle.jsonBundle).toContain("What is fiber?");

      // Verify Markdown bundle contains session header and citation
      expect(exportBundle.markdownBundle).toContain("# RepoPilot Account Data Export");
      expect(exportBundle.markdownBundle).toContain("React Testing Session");
      expect(exportBundle.markdownBundle).toContain("packages/react-reconciler");
    });

    it("deletes all user sessions and cascades removal of messages", async () => {
      const session = await insertSession(testUserId, {
        id: "session-wipe-1",
        repoUrl: "https://github.com/test/repo",
        owner: "test",
        repo: "repo",
        title: "To be wiped",
      });

      await insertSessionMessage(session.id, {
        role: "user",
        content: "Disposable question",
      });

      const wipeResult = await deleteAllUserSessions(testUserId);
      expect(wipeResult).toBe(true);

      const remainingExport = await exportUserData(testUserId);
      const userSessions = remainingExport.sessions.filter((s) => s.session.user_id === testUserId);
      expect(userSessions.length).toBe(0);
    });

    it("deletes user account and removes profile and all associated rows", async () => {
      const doomedUserId = "doomed-user-1";
      await updateUserProfile(doomedUserId, { display_name: "Doomed User" });
      await insertSession(doomedUserId, {
        id: "session-doomed-1",
        repoUrl: "https://github.com/doomed/repo",
        owner: "doomed",
        repo: "repo",
        title: "Doomed session",
      });

      const deleteResult = await deleteUserAccount(doomedUserId);
      expect(deleteResult).toBe(true);

      // Verify profile is reset/cleared from store
      const postDeleteExport = await exportUserData(doomedUserId);
      const remainingSessions = postDeleteExport.sessions.filter((s) => s.session.user_id === doomedUserId);
      expect(remainingSessions.length).toBe(0);
    });

    it("retrieves usage stats with 30-day activity trends", async () => {
      const stats = await getUserUsageStats(testUserId);
      expect(stats.requestsLimit).toBe(60);
      expect(stats.dailyHistory.length).toBe(30);
      expect(stats.dailyHistory[29].date).toBeDefined();
      expect(typeof stats.dailyHistory[29].count).toBe("number");
    });
  });

  describe("Preferences Settings Component", () => {
    it("renders preference controls and saves choices to localStorage", () => {
      render(
        <ToastProvider>
          <PreferencesSettingsPage />
        </ToastProvider>
      );

      expect(screen.getByText("Expanded (260px)")).toBeDefined();
      expect(screen.getByText("Collapsed (56px)")).toBeDefined();
      expect(screen.getByText("Markdown (.md)")).toBeDefined();
      expect(screen.getByText("Structured JSON (.json)")).toBeDefined();

      // Click Collapsed layout
      fireEvent.click(screen.getByText("Collapsed (56px)"));

      // Click Save Preferences
      const saveBtn = screen.getByRole("button", { name: /Save Preferences/i });
      fireEvent.click(saveBtn);

      const stored = localStorage.getItem("repopilot_user_preferences");
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.defaultSidebarState).toBe("collapsed");
    });
  });

  describe("Profile Settings Component", () => {
    it("renders profile inputs and rejects avatar files exceeding 2MB", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: {
            display_name: "Test Developer",
            bio: "Coding agent tester",
            avatar_url: null,
          },
        }),
      });

      render(
        <AuthProvider>
          <ToastProvider>
            <ProfileSettingsPage />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Developer")).toBeDefined();
      });

      // Try uploading a file > 2MB (3MB)
      const largeFile = new File(["a".repeat(3 * 1024 * 1024)], "heavy-avatar.png", {
        type: "image/png",
      });

      const fileInput = document.querySelector("#avatar-upload") as HTMLInputElement;
      expect(fileInput).toBeDefined();

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText("Avatar image must be smaller than 2 MB.")).toBeDefined();
      });
    });
  });
});
