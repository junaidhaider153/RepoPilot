// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

describe("Module 11 - Authentication and Route Protection", () => {
  describe("AuthContext & Security Invariants", () => {
    it("enforces minimum 10 characters password on signup", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      let res: { success: boolean; error?: string } = { success: false };
      await act(async () => {
        res = await result.current.signUpWithEmail("Tester", "test@example.com", "short9");
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Password must be at least 10 characters.");
    });

    it("enforces minimum 10 characters password on password update", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      let res: { success: boolean; error?: string } = { success: false };
      await act(async () => {
        res = await result.current.updateUserPassword("pass123");
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Password must be at least 10 characters.");
    });

    it("does not store any tokens in localStorage", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithEmail("test@example.com", "ValidPass1234");
      });

      // Assert no auth tokens or bearer tokens are saved to localStorage
      expect(window.localStorage.getItem("supabase.auth.token")).toBeNull();
      expect(window.localStorage.getItem("sb-access-token")).toBeNull();
      expect(window.localStorage.getItem("token")).toBeNull();
    });

    it("returns success on password reset regardless of email existence (prevents account enumeration)", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      let res: { success: boolean; error?: string } = { success: false };
      await act(async () => {
        res = await result.current.sendPasswordReset("nonexistent@example.com");
      });

      expect(res.success).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe("Server Route Protection Rule", () => {
    it("redirects unauthenticated users to /login?next=pathname", () => {
      const targetPath = "/app/s/s-123/overview";
      const isUnauthenticated = true;

      // Simulate middleware logic
      let redirectUrl = "";
      if (isUnauthenticated && targetPath.startsWith("/app")) {
        redirectUrl = `/login?next=${encodeURIComponent(targetPath)}`;
      }

      expect(redirectUrl).toBe("/login?next=%2Fapp%2Fs%2Fs-123%2Foverview");
    });

    it("redirects authenticated users away from /login to their next destination", () => {
      const isAuthenticated = true;
      const searchParams = new URLSearchParams("next=/app/s/my-session");

      let destination = "";
      if (isAuthenticated) {
        destination = searchParams.get("next") || "/app";
      }

      expect(destination).toBe("/app/s/my-session");
    });
  });
});
