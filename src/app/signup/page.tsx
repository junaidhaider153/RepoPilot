"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Github, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail, resendSignUpEmail, signInWithOAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Resend state
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResend() {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);
    setResendStatus(null);

    const res = await resendSignUpEmail(email);
    setIsResending(false);
    if (res.success) {
      setResendStatus("Confirmation email resent successfully! Please check your inbox and Spam folder.");
      setResendCooldown(60);
    } else {
      setResendStatus(res.error || "Failed to resend confirmation email.");
    }
  }

  // Live password checklist (minimum 10 characters per Pages_UI.md §5.3)
  const isLengthValid = password.length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !isLengthValid) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await signUpWithEmail(name, email, password);

    if (result.success) {
      if (result.requiresConfirmation) {
        setIsSubmitted(true);
      } else {
        router.push("/app");
      }
    } else {
      setErrorMessage(result.error || "Unable to complete registration. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleGitHubSignUp() {
    setIsLoading(true);
    setErrorMessage(null);
    const result = await signInWithOAuth("github");
    if (!result.success) {
      setErrorMessage(result.error || "Failed to initiate GitHub registration.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 antialiased py-8 px-4 sm:px-6 flex flex-col justify-center items-center">
      {/* 580px Obsidian Container inspired by code.html & screen.png */}
      <div className="w-full max-w-[480px] bg-white border border-neutral-200/90 rounded-2xl shadow-email-card overflow-hidden transition-all">
        
        {/* Obsidian Header Banner */}
        <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 px-6 sm:px-8 pt-7 pb-6 text-center relative overflow-hidden border-b border-neutral-800">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <Link href="/" className="inline-flex items-center justify-center space-x-2.5 mb-4 relative z-10 group">
            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-inner overflow-hidden border border-neutral-200">
              <span className="text-black font-black text-sm">▲</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">RepoPilot</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
              AUTH
            </span>
          </Link>

          <div className="relative z-10 flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-white shadow-sm backdrop-blur-sm">
              <Mail className="w-6 h-6 text-neutral-100" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-6 sm:px-8 py-7">
          {isSubmitted ? (
            /* Confirmation State with Resend Option */
            <div className="text-center space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900">Check your email</h2>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  We&apos;ve sent a confirmation link to <span className="font-mono text-neutral-900 font-semibold px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 inline-block mt-1">{email}</span>. Please click the link to activate your account.
                </p>
              </div>

              {/* Callout Notice */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-left text-xs text-neutral-600 space-y-1.5">
                <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Didn&apos;t receive the email?</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-neutral-500">
                  <li>Check your <strong>Spam / Junk</strong> folder or <strong>Promotions</strong> tab.</li>
                  <li>Free tier authentication mailers may take up to 2 minutes to deliver.</li>
                </ul>
              </div>

              {resendStatus && (
                <p
                  role="status"
                  className={cn(
                    "text-xs font-mono p-3 rounded-xl text-left",
                    resendStatus.includes("success")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  )}
                >
                  {resendStatus}
                </p>
              )}

              <div className="space-y-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  aria-label="Resend confirmation email"
                  className="w-full justify-center text-xs font-mono rounded-xl border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-800 transition-colors shadow-sm"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  isLoading={isResending}
                >
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Resend confirmation email"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setResendStatus(null);
                  }}
                  className="text-xs font-mono text-neutral-500 hover:text-neutral-900 underline block mx-auto pt-1"
                >
                  Use a different email address
                </button>
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <Link
                  href="/login"
                  className="text-xs font-mono font-medium text-neutral-900 underline hover:text-black"
                >
                  Return to log in
                </Link>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                  Create your account
                </h1>
                <p className="text-xs text-neutral-500">
                  Save repository explorations and manage project blueprints.
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div
                  role="alert"
                  id="signup-error"
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* GitHub OAuth Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGitHubSignUp}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-xl border border-neutral-300 shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <Github className="w-4 h-4 text-neutral-900" />
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-white px-3 text-[11px] font-mono text-neutral-400 font-semibold">
                    or details
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="signup-name"
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  autoComplete="name"
                  disabled={isLoading}
                  className="rounded-xl border-neutral-300 focus:border-neutral-900"
                />

                <Input
                  id="signup-email"
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

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-password"
                    className="text-xs font-medium text-neutral-900"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
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

                  {/* Live Password Guidance */}
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
                  disabled={isLoading || !name.trim() || !email.trim() || !isLengthValid}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span>Creating account...</span>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer link */}
              <div className="text-center pt-2">
                <p className="text-xs text-neutral-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-neutral-900 hover:underline font-mono"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cohesive Footer matching code.html */}
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
