"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, Github } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextDestination = searchParams.get("next") || "/app";

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
      setErrorMessage(result.error || "Failed to initiate GitHub authentication.");
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] bg-white border border-[#ebebeb] rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-[#171717]">
          Log in to RepoPilot
        </h1>
        <p className="text-xs text-[#666666]">
          Explore repositories, save sessions, and generate blueprints.
        </p>
      </div>

      {/* Generic Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          id="login-error"
          className="p-3 rounded border border-[#fecaca] bg-[#fef2f2] text-xs text-[#991b1b] flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626] mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* GitHub OAuth */}
      <div>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full justify-center gap-2 font-mono text-xs"
          onClick={handleGitHubSignIn}
          disabled={isLoading}
        >
          <Github className="w-4 h-4" />
          <span>Continue with GitHub</span>
        </Button>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#ebebeb] w-full" />
        <span className="bg-white px-3 text-[11px] font-mono text-[#8f8f8f] uppercase absolute">
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
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-xs font-medium text-[#171717]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-mono text-[#666666] hover:text-[#171717] hover:underline"
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
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={isLoading || !email.trim() || !password}
          className="w-full justify-center"
        >
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      {/* Footer link */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#666666]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-[#171717] hover:underline font-mono"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="text-sm font-mono tracking-tight text-[#000000] font-semibold flex items-center gap-1.5 justify-center"
        >
          <span>▲</span> RepoPilot
        </Link>
      </div>

      <Suspense fallback={<div className="text-xs font-mono text-[#8f8f8f]">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
