"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Mail, ArrowLeft, KeyRound, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    await sendPasswordReset(email);
    setIsLoading(false);
    // Always show confirmation to prevent account enumeration
    setIsSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 antialiased py-8 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-[480px] bg-white border border-neutral-200/90 rounded-2xl shadow-email-card overflow-hidden transition-all">
        {/* Obsidian Header Banner matching code.html */}
        <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 px-6 sm:px-8 pt-7 pb-6 text-center relative overflow-hidden border-b border-neutral-800">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <Link href="/" className="inline-flex items-center justify-center space-x-2.5 mb-4 relative z-10 group">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-inner overflow-hidden border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/icon.jpg" alt="RepoPilot" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">RepoPilot</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
              RECOVERY
            </span>
          </Link>

          <div className="relative z-10 flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-white shadow-sm backdrop-blur-sm">
              <KeyRound className="w-6 h-6 text-neutral-100" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-6 sm:px-8 py-7">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-2 animate-fadeIn">
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">Check your email</h1>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  If an account exists for <span className="font-mono text-neutral-900 font-semibold px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 inline-block mt-1">{email}</span>, we&apos;ve sent instructions to reset your password.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-left text-xs text-neutral-600">
                <p className="font-semibold text-neutral-900 mb-1">Security Notice</p>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  Password reset links remain valid for 1 hour. If you do not see the email, please check your Spam folder.
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-900 underline hover:text-black"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to log in</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                  Reset your password
                </h1>
                <p className="text-xs text-neutral-500">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="reset-email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className="rounded-xl border-neutral-300 focus:border-neutral-900"
                />

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span>Sending link...</span>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to log in</span>
                </Link>
              </div>
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
