/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import SettingsLayout from "@/app/app/settings/layout";
import LibraryPage from "@/app/app/library/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/settings/account",
  useSearchParams: () => new URLSearchParams("email_updated=true&email=verified@gmail.com"),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock ToastContext
const mockToast = vi.fn();
vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-123", email: "user@example.com" },
    signOut: vi.fn(),
  }),
}));

// Mock nodemailer
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: mockSendMail,
    }),
  },
}));

describe("Sweep 3 - Group 5: Viewport Scrolling, Gmail 2FA Sanitization & Verification Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Test 1: SettingsLayout includes overflow-y-auto and h-full so all settings options are scrollable", () => {
    const { container } = render(
      <SettingsLayout>
        <div data-testid="settings-child">Settings Content</div>
      </SettingsLayout>
    );

    // The root wrapper must have overflow-y-auto and h-full or flex-1 to allow vertical scrolling
    const rootWrapper = container.firstElementChild as HTMLElement;
    expect(rootWrapper).not.toBeNull();
    expect(rootWrapper.className).toMatch(/overflow-y-auto/);
    expect(rootWrapper.className).toMatch(/h-full|flex-1/);
  });

  it("Test 2: LibraryPage includes overflow-y-auto and h-full so documents are scrollable", () => {
    const { container } = render(<LibraryPage />);

    const rootWrapper = container.firstElementChild as HTMLElement;
    expect(rootWrapper).not.toBeNull();
    expect(rootWrapper.className).toMatch(/overflow-y-auto/);
    expect(rootWrapper.className).toMatch(/h-full|flex-1/);
  });

  it("Test 3: mailer sanitizes Google App Passwords by removing all spaces", async () => {
    const { getSmtpConfig } = await import("@/lib/email/mailer");

    const originalHost = process.env.SMTP_HOST;
    const originalUser = process.env.SMTP_USER;
    const originalPass = process.env.SMTP_PASS;

    try {
      process.env.SMTP_HOST = "smtp.gmail.com";
      process.env.SMTP_USER = "user@gmail.com";
      // Google displays passwords with spaces: 'abcd efgh ijkl mnop'
      process.env.SMTP_PASS = "abcd efgh ijkl mnop";

      const config = getSmtpConfig();
      expect(config).not.toBeNull();
      // Must be stripped of spaces to avoid 535 Bad Credentials
      expect(config?.auth.pass).toBe("abcdefghijklmnop");
    } finally {
      process.env.SMTP_HOST = originalHost;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    }
  });

  it("Test 4: mailer catches Gmail 535 Bad Credentials and formats an actionable message", async () => {
    const { sendEmail } = await import("@/lib/email/mailer");

    mockSendMail.mockRejectedValueOnce(
      new Error("Invalid login: 535-5.7.8 Username and Password not accepted. https://support.google.com/mail/?p=BadCredentials")
    );

    const originalHost = process.env.SMTP_HOST;
    const originalUser = process.env.SMTP_USER;
    const originalPass = process.env.SMTP_PASS;

    try {
      process.env.SMTP_HOST = "smtp.gmail.com";
      process.env.SMTP_USER = "user@gmail.com";
      process.env.SMTP_PASS = "apppasswordtoken";

      await expect(
        sendEmail({
          to: "recipient@gmail.com",
          subject: "Test",
          html: "<p>Hello</p>",
        })
      ).rejects.toThrow(/Gmail authentication failed.*16-character Google App Password/i);
    } finally {
      process.env.SMTP_HOST = originalHost;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    }
  });

  it("Test 5: AccountSettingsPage parses ?email_updated=true and displays confirmed success toast", async () => {
    const AccountSettingsPage = (await import("@/app/app/settings/account/page")).default;

    render(<AccountSettingsPage />);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Email verified & updated",
        message: expect.stringContaining("verified@gmail.com"),
      })
    );
  });
});
