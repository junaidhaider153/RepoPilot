"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updateUserPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const isLengthValid = password.length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLengthValid) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await updateUserPassword(password);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    } else {
      setErrorMessage(result.error || "Failed to update password. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-4">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="text-sm font-mono tracking-tight text-[#000000] font-semibold flex items-center gap-1.5 justify-center"
        >
          <span>▲</span> RepoPilot
        </Link>
      </div>

      <div className="w-full max-w-[400px] bg-white border border-[#ebebeb] rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
        {isSuccess ? (
          <div className="text-center space-y-4 py-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#16a34a] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-[#171717]">Password updated</h1>
              <p className="text-xs text-[#666666] leading-relaxed">
                Your password has been changed successfully. Redirecting you to workspace...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-[#171717]">
                Set new password
              </h1>
              <p className="text-xs text-[#666666]">
                Enter a secure password with at least 10 characters.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded border border-[#fecaca] bg-[#fef2f2] text-xs text-[#991b1b] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626] mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="new-password"
                  className="text-xs font-medium text-[#171717]"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-[#ebebeb] rounded focus:outline-none focus:border-[#171717] disabled:opacity-50 transition-colors pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-2.5 text-[#8f8f8f] hover:text-[#171717] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-mono">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 transition-colors ${
                      isLengthValid ? "text-[#16a34a]" : "text-[#d4d4d4]"
                    }`}
                  />
                  <span className={isLengthValid ? "text-[#16a34a]" : "text-[#8f8f8f]"}>
                    Minimum 10 characters
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={isLoading || !isLengthValid}
                className="w-full justify-center"
              >
                {isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

