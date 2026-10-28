"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft } from "lucide-react";

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
        {isSubmitted ? (
          <div className="text-center space-y-4 py-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#16a34a] mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-[#171717]">Check your email</h1>
              <p className="text-xs text-[#666666] leading-relaxed">
                If an account exists for <span className="font-mono text-[#171717]">{email}</span>, we&apos;ve sent instructions to reset your password.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#171717] underline hover:text-[#000000]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to log in</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-[#171717]">
                Reset your password
              </h1>
              <p className="text-xs text-[#666666]">
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
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={isLoading || !email.trim()}
                className="w-full justify-center"
              >
                {isLoading ? "Sending link..." : "Send reset link"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#666666] hover:text-[#171717]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to log in</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
