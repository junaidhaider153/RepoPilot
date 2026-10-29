/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountSettingsPage from "@/app/app/settings/account/page";
import {
  createEmailVerificationToken,
  createEmailVerificationTokenAndCode,
  consumeEmailVerificationToken,
  consumeEmailVerificationCode,
} from "@/lib/email/tokens";
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
    user: { id: "u-test-1", email: "developer@example.com" },
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
const mockSendMail = vi.fn().mockResolvedValue({ messageId: "<msg-test-template-123@repopilot>" });
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: (...args: unknown[]) => mockSendMail(...args),
    }),
  },
}));

describe("Sweep 3 Group 8: New Email Template & 6-Digit Verification Code Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Verification Code Generation & Validation", () => {
    it("generates both token and 6-digit numeric verification code", () => {
      const { token, code } = createEmailVerificationTokenAndCode("u-user-1", "test@repopilot.local");
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(10);
      expect(typeof code).toBe("string");
      expect(code).toMatch(/^\d{6}$/);
    });

    it("validates and consumes 6-digit code with or without formatting dashes", () => {
      const { code } = createEmailVerificationTokenAndCode("u-user-2", "passcode@repopilot.local");
      const formatted = `${code.slice(0, 3)}-${code.slice(3, 6)}`;

      // Consuming formatted code should succeed
      const result = consumeEmailVerificationCode(formatted, "u-user-2");
      expect(result.valid).toBe(true);
      expect(result.newEmail).toBe("passcode@repopilot.local");
      expect(result.userId).toBe("u-user-2");

      // Second consumption should fail (single-use)
      const secondTry = consumeEmailVerificationCode(code, "u-user-2");
      expect(secondTry.valid).toBe(false);
    });
  });

  describe("2. Email Template Faithful Implementation (code.html & screen.png)", () => {
    it("renders the exact RepoPilot email template with 6-digit code, CTA button, and copy link fallback", async () => {
      process.env.SMTP_HOST = "smtp.gmail.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "auth@repopilot.com";
      process.env.SMTP_PASS = "abcdefghijklmnop";

      await sendVerificationEmail({
        toEmail: "user@example.com",
        token: "token-abc-123",
        code: "849216",
        origin: "https://repopilot.app",
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      const html = callArgs.html;

      // Brand header & wordmark
      expect(html).toContain("RepoPilot");
      // Title
      expect(html).toContain("Confirm your email address");
      // Primary button
      expect(html).toContain("Confirm Email Address");
      expect(html).toContain("https://repopilot.app/api/account/email/verify?token=token-abc-123");
      // 6-digit verification code formatted
      expect(html).toContain("VERIFICATION PASSCODE");
      expect(html).toContain("849 - 216");
      // Manual entry divider
      expect(html).toContain("OR ENTER CODE MANUALLY");
      // 24 hour expiry notice
      expect(html).toMatch(/expires in 24 hours/i);
      // Footer
      expect(html).toContain("Powered by RepoPilot");
    });
  });

  describe("3. Account Settings UI 6-Digit Passcode Input", () => {
    it("allows entering the 6-digit passcode directly on the settings page to verify email", async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: { method?: string; body?: string }) => {
        if (url === "/api/account/email") {
          return {
            ok: true,
            json: async () => ({
              success: true,
              message: "Verification email sent.",
            }),
          };
        }
        if (url === "/api/account/email/verify" && opts?.method === "POST") {
          const body = JSON.parse(opts.body || "{}");
          if (body.code === "849216" || body.code === "849-216") {
            return {
              ok: true,
              json: async () => ({
                success: true,
                newEmail: "codeverified@gmail.com",
                message: "Email verified successfully!",
              }),
            };
          }
          return {
            ok: false,
            json: async () => ({ error: { message: "Invalid passcode." } }),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      try {
        render(<AccountSettingsPage />);

        // Request email update
        const emailInput = screen.getByPlaceholderText("name@company.com");
        fireEvent.change(emailInput, { target: { value: "codeverified@gmail.com" } });
        fireEvent.click(screen.getByRole("button", { name: /update email address/i }));

        // Wait for pending banner
        const codeInput = await screen.findByPlaceholderText(/e\.g\. 849-216|849216|6-digit code/i);
        expect(codeInput).toBeDefined();

        // Enter 6-digit passcode
        fireEvent.change(codeInput, { target: { value: "849-216" } });

        // Click Verify Code button
        const verifyCodeBtn = screen.getByRole("button", { name: /verify code|submit code/i });
        fireEvent.click(verifyCodeBtn);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            "/api/account/email/verify",
            expect.objectContaining({
              method: "POST",
              body: expect.stringContaining("849-216"),
            })
          );
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              type: "success",
              title: expect.stringMatching(/email verified/i),
            })
          );
        });
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});

