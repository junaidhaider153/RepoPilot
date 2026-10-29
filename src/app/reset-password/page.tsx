"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Key, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 antialiased py-8 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-[480px] bg-white border border-neutral-200/90 rounded-2xl shadow-email-card overflow-hidden transition-all">
        {/* Obsidian Header Banner matching code.html */}
        <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 px-6 sm:px-8 pt-7 pb-6 text-center relative overflow-hidden border-b border-neutral-800">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <Link href="/" className="inline-flex items-center justify-center space-x-2.5 mb-4 relative z-10 group">
            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-inner overflow-hidden border border-neutral-200">
              <span className="text-black font-black text-sm">▲</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">RepoPilot</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
              SECURITY
            </span>
          </Link>

          <div className="relative z-10 flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-white shadow-sm backdrop-blur-sm">
              <Key className="w-6 h-6 text-neutral-100" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-6 sm:px-8 py-7">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">Password updated</h1>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Your password has been changed successfully. Redirecting you to your workspace...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                  Set new password
                </h1>
                <p className="text-xs text-neutral-500">
                  Enter a secure password with at least 10 characters.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-password"
                    className="text-xs font-medium text-neutral-900"
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
                      className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 disabled:opacity-50 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-900 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 transition-colors ${
                        isLengthValid ? "text-emerald-600" : "text-neutral-300"
                      }`}
                    />
                    <span className={isLengthValid ? "text-emerald-600 font-medium" : "text-neutral-500"}>
                      Minimum 10 characters
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isLengthValid}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <span>Update password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-neutral-50/80 border-t border-neutral-200/80 px-6 py-4 text-center text-xs text-neutral-500">
          <div className="flex items-center justify-center space-x-1.5 font-medium text-neutral-700">
            <span>Powered by</span>
            <Link href="/" className="font-bold text-neutral-900 hover:underline">
              RepoPilot
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            © 2026 RepoPilot, Inc. Evidence-grounded code intelligence.
          </p>
        </footer>
      </div>
    </div>
  );
}
