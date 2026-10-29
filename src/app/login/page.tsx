"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, AlertCircle, Github, Lock, ArrowRight } from "lucide-react";
import { sanitizeRedirectPath } from "@/lib/security/redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextDestination = sanitizeRedirectPath(searchParams.get("next"));

  const { signInWithEmail, signInWithOAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await signInWithEmail(email, password);

    if (result.success) {
      router.push(nextDestination);
    } else {
      setErrorMessage(result.error || "Invalid email or password.");
      setIsLoading(false);
    }
  }

  async function handleGitHubSignIn() {
    setIsLoading(true);
    setErrorMessage(null);
    const result = await signInWithOAuth("github");
    if (!result.success) {
      setErrorMessage(
        result.error?.includes("Unsupported provider") || result.error?.includes("not enabled")
          ? "GitHub authentication is not enabled in your Supabase project. Please enable GitHub in Supabase Dashboard → Authentication → Providers, or log in with Email below."
          : result.error || "Failed to initiate GitHub authentication."
      );
      setIsLoading(false);
    }
  }

  return (
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
            LOGIN
          </span>
        </Link>

        <div className="relative z-10 flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-white shadow-sm backdrop-blur-sm">
            <Lock className="w-6 h-6 text-neutral-100" />
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="px-6 sm:px-8 py-7 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Log in to RepoPilot
          </h1>
          <p className="text-xs text-neutral-500">
            Explore repositories, save sessions, and generate blueprints.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            id="login-error"
            className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* GitHub OAuth */}
        <div>
          <button
            type="button"
            onClick={handleGitHubSignIn}
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
          <span className="bg-white px-3 text-[11px] font-mono text-neutral-400 uppercase tracking-wider relative flex justify-center mx-auto w-max font-semibold">
            or email
          </span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
            aria-describedby={errorMessage ? "login-error" : undefined}
            className="rounded-xl border-neutral-300 focus:border-neutral-900"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-xs font-medium text-neutral-900"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-mono text-neutral-500 hover:text-neutral-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
                disabled={isLoading}
                aria-describedby={errorMessage ? "login-error" : undefined}
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
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Log in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="text-center pt-2">
          <p className="text-xs text-neutral-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-neutral-900 hover:underline font-mono"
            >
              Create an account
            </Link>
          </p>
        </div>
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
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 antialiased py-8 px-4 sm:px-6 flex flex-col justify-center items-center">
      <Suspense fallback={<div className="text-xs font-mono text-neutral-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
