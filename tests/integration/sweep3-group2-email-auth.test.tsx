/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountSettingsPage from "@/app/app/settings/account/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock AuthContext
const mockSignOut = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-test-1", email: "tester@example.com" },
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

describe("Sweep 3 Group 2: Honest Email & Authentication Settings (E-04)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fails honestly when SMTP is not configured instead of pretending email was sent", async () => {
    // Mock fetch to simulate API returning SMTP not configured error
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === "/api/account/email") {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              code: "SMTP_NOT_CONFIGURED",
              message:
                "SMTP is not configured. To send verification emails via Gmail, enable 2-Step Verification and configure a 16-character Google App Password in .env.local (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).",
            },
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<AccountSettingsPage />);

    const emailInput = screen.getByPlaceholderText("name@company.com");
    fireEvent.change(emailInput, { target: { value: "newemail@gmail.com" } });

    const submitBtn = screen.getByRole("button", { name: /Update Email Address/i });
    fireEvent.click(submitBtn);

    // It MUST call /api/account/email
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/email",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ newEmail: "newemail@gmail.com" }),
        })
      );
    });

    // It MUST surface the honest error toast, NOT a fake "Verification email sent"
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("SMTP is not configured"),
        })
      );
    });

    // Verify it did not show fake success
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Verification email sent",
      })
    );
  });

  it("updates password by calling /api/account/password instead of fake setTimeout", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === "/api/account/password") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: "Password updated successfully." }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<AccountSettingsPage />);

    const currentPwdInput = screen.getByLabelText(/Current Password/i);
    const newPwdInput = screen.getByLabelText(/^New Password/i);
    const confirmPwdInput = screen.getByLabelText(/Confirm New Password/i);

    fireEvent.change(currentPwdInput, { target: { value: "OldPassword123!" } });
    fireEvent.change(newPwdInput, { target: { value: "NewSecurePassword456!" } });
    fireEvent.change(confirmPwdInput, { target: { value: "NewSecurePassword456!" } });

    const updatePwdBtn = screen.getByRole("button", { name: /Update Password/i });
    fireEvent.click(updatePwdBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
            newPassword: "NewSecurePassword456!",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Password updated",
        })
      );
    });
  });

  it("revokes other sessions by calling /api/account/sessions instead of fake setTimeout", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === "/api/account/sessions") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: "Sessions revoked" }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<AccountSettingsPage />);

    const revokeBtn = screen.getByRole("button", { name: /Sign Out Other Devices/i });
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/sessions",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "Sessions revoked",
        })
      );
    });
  });

  it("creates and consumes email verification tokens with single-use semantics", async () => {
    const { createEmailVerificationToken, consumeEmailVerificationToken } = await import("@/lib/email/tokens");

    const token = createEmailVerificationToken("user-123", "new@gmail.com");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);

    // First consumption succeeds
    const result1 = consumeEmailVerificationToken(token);
    expect(result1.valid).toBe(true);
    expect(result1.userId).toBe("user-123");
    expect(result1.newEmail).toBe("new@gmail.com");

    // Second consumption fails (token already used)
    const result2 = consumeEmailVerificationToken(token);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain("Invalid or expired");
  });

  it("mailer fails honestly with clear instructions when SMTP is unconfigured", async () => {
    const { isSmtpConfigured, sendEmail } = await import("@/lib/email/mailer");

    const oldHost = process.env.SMTP_HOST;
    const oldUser = process.env.SMTP_USER;
    const oldPass = process.env.SMTP_PASS;

    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    try {
      expect(isSmtpConfigured()).toBe(false);

      await expect(
        sendEmail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Hello</p>",
        })
      ).rejects.toThrow(/SMTP is not configured.*Google App Password/i);
    } finally {
      if (oldHost) process.env.SMTP_HOST = oldHost;
      if (oldUser) process.env.SMTP_USER = oldUser;
      if (oldPass) process.env.SMTP_PASS = oldPass;
    }
  });
});
