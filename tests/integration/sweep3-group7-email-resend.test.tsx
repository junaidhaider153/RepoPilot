/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "@/app/signup/page";
import AccountSettingsPage from "@/app/app/settings/account/page";

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
const mockSignUpWithEmail = vi.fn();
const mockResendSignUpEmail = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-test-1", email: "developer@example.com" },
    signUpWithEmail: mockSignUpWithEmail,
    resendSignUpEmail: mockResendSignUpEmail,
    signInWithOAuth: vi.fn(),
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

describe("Sweep 3 Group 7: Email Delivery Diagnostics & Resend Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Signup Page Resend Option", () => {
    it("renders a Resend confirmation email button and invokes resendSignUpEmail", async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({
        success: true,
        requiresConfirmation: true,
      });
      mockResendSignUpEmail.mockResolvedValueOnce({
        success: true,
      });

      render(<SignupPage />);

      // Fill in signup form
      fireEvent.change(screen.getByPlaceholderText("Ada Lovelace"), {
        target: { value: "Test User" },
      });
      fireEvent.change(screen.getByPlaceholderText("developer@example.com"), {
        target: { value: "newuser@gmail.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("At least 10 characters"), {
        target: { value: "supersecret123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      // Wait for confirmation view
      await waitFor(() => {
        expect(screen.getByText("Check your email")).toBeDefined();
      });

      // Verify Resend button is visible
      const resendBtn = screen.getByRole("button", { name: /resend confirmation email|resend email/i });
      expect(resendBtn).toBeDefined();

      // Click Resend
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(mockResendSignUpEmail).toHaveBeenCalledWith("newuser@gmail.com");
      });
    });
  });

  describe("2. Account Settings Email Change Resend Option", () => {
    it("provides a Resend verification email button when an email change is in progress", async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === "/api/account/email") {
          return {
            ok: true,
            json: async () => ({
              success: true,
              message: "Verification email sent.",
            }),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      try {
        render(<AccountSettingsPage />);

        const newEmailInput = screen.getByPlaceholderText("name@company.com");
        fireEvent.change(newEmailInput, { target: { value: "updatedemail@gmail.com" } });

        const submitBtn = screen.getByRole("button", { name: /update email address/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            "/api/account/email",
            expect.objectContaining({ method: "POST" })
          );
        });

        // The pending banner should now be visible with a Resend button
        const resendBtn = await screen.findByRole("button", {
          name: /resend verification email|resend email/i,
        });
        expect(resendBtn).toBeDefined();

        // Clicking resend should call /api/account/email again
        fireEvent.click(resendBtn);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(2);
        });
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
