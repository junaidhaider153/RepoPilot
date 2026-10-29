/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "@/app/signup/page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockSignUpWithEmail = vi.fn();
const mockResendSignUpEmail = vi.fn();
const mockVerifySignUpOtp = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    signUpWithEmail: mockSignUpWithEmail,
    resendSignUpEmail: mockResendSignUpEmail,
    verifySignUpOtp: mockVerifySignUpOtp,
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    isLoaded: true,
  }),
}));

describe("Sweep 3 Group 9: Signup Passcode Verification Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders verification passcode input on signup confirmation and verifies code with Supabase", async () => {
    mockSignUpWithEmail.mockResolvedValueOnce({
      success: true,
      requiresConfirmation: true,
    });
    mockVerifySignUpOtp.mockResolvedValueOnce({
      success: true,
    });

    render(<SignupPage />);

    // Fill and submit form
    fireEvent.change(screen.getByPlaceholderText("Ada Lovelace"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("developer@example.com"), {
      target: { value: "pakfaisalabadofficial@gmail.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 10 characters"), {
      target: { value: "SecurePass1234!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Confirmation view should show
    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeDefined();
    });

    // Verification Passcode input must be present
    const codeInput = screen.getByPlaceholderText(/e\.g\. 38510924/i);
    expect(codeInput).toBeDefined();

    const verifyBtn = screen.getByRole("button", { name: /confirm account|verify code/i });
    expect(verifyBtn).toBeDefined();

    // Type the passcode from the email
    fireEvent.change(codeInput, { target: { value: "38510924" } });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(mockVerifySignUpOtp).toHaveBeenCalledWith(
        "pakfaisalabadofficial@gmail.com",
        "38510924"
      );
      expect(screen.getByText(/Account verified successfully/i)).toBeDefined();
    });
  });

  it("surfaces an error message when passcode is invalid", async () => {
    mockSignUpWithEmail.mockResolvedValueOnce({
      success: true,
      requiresConfirmation: true,
    });
    mockVerifySignUpOtp.mockResolvedValueOnce({
      success: false,
      error: "Invalid or expired passcode.",
    });

    render(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText("Ada Lovelace"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("developer@example.com"), {
      target: { value: "pakfaisalabadofficial@gmail.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 10 characters"), {
      target: { value: "SecurePass1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e\.g\. 38510924/i)).toBeDefined();
    });

    const codeInput = screen.getByPlaceholderText(/e\.g\. 38510924/i);
    fireEvent.change(codeInput, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm account|verify code/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid or expired passcode/i)).toBeDefined();
    });
  });
});
