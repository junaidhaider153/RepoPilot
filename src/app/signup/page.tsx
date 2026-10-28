"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Github, Mail } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithOAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

      <div className="w-full max-w-[400px] bg-white border border-[#ebebeb] rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
        {isSubmitted ? (
          /* Confirmation State */
          <div className="text-center space-y-4 py-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#16a34a] mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[#171717]">Check your email</h2>
              <p className="text-xs text-[#666666] leading-relaxed">
                We&apos;ve sent a confirmation link to <span className="font-mono text-[#171717]">{email}</span>. Please click the link to activate your account.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="text-xs font-mono text-[#171717] underline hover:text-[#000000]"
              >
                Return to log in
              </Link>
            </div>
          </div>
        ) : (
          /* Sign Up Form */
          <>
            <div className="text-center space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-[#171717]">
                Create your account
              </h1>
              <p className="text-xs text-[#666666]">
                Save repository explorations and manage project blueprints.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                id="signup-error"
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
                onClick={handleGitHubSignUp}
                disabled={isLoading}
              >
                <Github className="w-4 h-4" />
                <span>Continue with GitHub</span>
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#ebebeb] w-full" />
              <span className="bg-white px-3 text-[11px] font-mono text-[#8f8f8f] uppercase absolute">
                or details
              </span>
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
              />

              <div className="space-y-1">
                <label
                  htmlFor="signup-password"
                  className="text-xs font-medium text-[#171717]"
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

                {/* Live Password Guidance */}
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
                disabled={isLoading || !name.trim() || !email.trim() || !isLengthValid}
                className="w-full justify-center"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            {/* Footer link */}
            <div className="text-center pt-2">
              <p className="text-xs text-[#666666]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#171717] hover:underline font-mono"
                >
                  Log in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
