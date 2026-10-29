"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { useAuth } from "@/context/AuthContext";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
import {
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const SAMPLE_REPOS = [
  { label: "spec-kit", url: "https://github.com/github/spec-kit", owner: "github", repo: "spec-kit" },
  { label: "Hello-World", url: "https://github.com/octocat/Hello-World", owner: "octocat", repo: "Hello-World" },
  { label: "react", url: "https://github.com/facebook/react", owner: "facebook", repo: "react" },
  { label: "next.js", url: "https://github.com/vercel/next.js", owner: "vercel", repo: "next.js" },
];

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createSession } = useSessionContext();

  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleStartSession(targetUrl?: string) {
    const rawUrl = (targetUrl || urlInput).trim();
    if (!rawUrl || isLoading) return;

    // Basic client validation
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      setErrorMessage("Please enter a valid GitHub URL (e.g. https://github.com/owner/repo)");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage("Validating repository and fetching structure...");

    try {
      // 1. Parse repository owner and name
      const cleaned = rawUrl.trim().replace(/\/+$/, "").replace(/\.git$/, "");
      const parts = cleaned.split("/");
      const repo = parts[parts.length - 1] || "repository";
      const owner = parts[parts.length - 2] || "owner";
      const title = `${owner}/${repo}`;

      // 2. Persist session on server first
      const sessRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: rawUrl,
          owner,
          repo,
          title,
        }),
      });

      const sessData = await sessRes.json().catch(() => null);

      if (!sessRes.ok) {
        throw new Error(
          sessData?.error?.message ||
          sessData?.error ||
          "Failed to initialize session on server. Please try again."
        );
      }

      const serverSessionId = sessData?.session?.id;
      if (!serverSessionId) {
        throw new Error("Server did not return a valid session ID.");
      }

      // 3. Analyze codebase with sessionId so server caches the snapshot
      const res = await fetch("/api/repository/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: rawUrl,
          sessionId: serverSessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to analyze repository.");
      }

      const analysisResult = data as CompleteAnalysisResult;
      const targetSessionId = createSession(rawUrl, analysisResult, serverSessionId, title);

      // Navigate directly into the session workspace
      router.push(`/app/s/${targetSessionId}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while analyzing the repository. Please verify the URL and try again."
      );
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center min-h-full bg-neutral-100/60 antialiased">
      <div className="w-full max-w-2xl space-y-6 animate-fadeIn">
        
        {/* Workspace Card Container (580px - 680px Obsidian card inspired by code.html) */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-email-card overflow-hidden transition-all">
          
          {/* Obsidian Header Banner */}
          <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 px-6 sm:px-8 pt-7 pb-6 text-center relative overflow-hidden border-b border-neutral-800">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="inline-flex items-center justify-center space-x-2.5 mb-3 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-inner overflow-hidden border border-neutral-200">
                <span className="text-black font-black text-sm">▲</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">RepoPilot</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                WORKSPACE
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white relative z-10 leading-snug">
              Hello {user?.displayName || "Developer"}, which repository should we explore?
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mt-1.5 relative z-10">
              Provide any public GitHub repository URL to initiate bounded file ingestion, architectural synthesis, and interactive blueprint discovery.
            </p>
          </div>

          {/* Form and Actions */}
          <div className="p-6 sm:p-8 space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartSession();
              }}
              className="space-y-4"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  disabled={isLoading}
                  aria-label="GitHub Repository URL"
                  className="w-full text-xs sm:text-sm font-mono pl-10 pr-4 py-3 bg-neutral-50/70 border border-neutral-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Public GitHub repos &bull; Safe static inspection</span>
                </span>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  disabled={!urlInput.trim() || isLoading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-semibold text-xs shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{isLoading ? "Analyzing..." : "Analyze Codebase"}</span>
                  {!isLoading && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                </Button>
              </div>
            </form>

            {/* Loading status progress */}
            {isLoading && (
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center gap-2.5 text-xs font-mono text-neutral-700 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Error Banner with Retry */}
            {errorMessage && (
              <div
                role="alert"
                className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">Analysis Failed</p>
                    <p className="leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <div className="pl-6">
                  <button
                    type="button"
                    onClick={() => handleStartSession()}
                    className="font-mono underline text-xs hover:text-red-950 font-semibold"
                  >
                    Retry with this URL
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <span className="bg-white px-3 text-[11px] font-mono text-neutral-400 uppercase tracking-wider relative flex justify-center mx-auto w-max font-semibold">
                sample repositories
              </span>
            </div>

            {/* Sample Repositories */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SAMPLE_REPOS.map((sample) => (
                <button
                  key={sample.url}
                  type="button"
                  onClick={() => {
                    setUrlInput(sample.url);
                    handleStartSession(sample.url);
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:border-neutral-900 hover:bg-neutral-50 text-xs font-mono text-neutral-800 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 shadow-xs disabled:opacity-50"
                >
                  <GitBranch className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{sample.owner}/{sample.repo}</span>
                </button>
              ))}
            </div>

          </div>

          {/* Bottom Policy & Grounding Callout */}
          <footer className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-start gap-3 text-xs text-neutral-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <span className="font-semibold text-neutral-900 block">
                Evidence-Grounded Analysis Policy
              </span>
              <p className="text-neutral-500">
                Every claim, architectural insight, and generated specification points to inspected repository files. Code is never executed. Full repository contents are not persisted to database storage.
              </p>
            </div>
          </footer>

        </div>

      </div>
    </div>
  );
}
