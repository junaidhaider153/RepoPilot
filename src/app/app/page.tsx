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
  FileCode,
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
    <div className="flex-1 overflow-y-auto px-4 py-12 flex flex-col items-center justify-center min-h-full">
      <div className="w-full max-w-2xl space-y-8">
        {/* Greeting Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ffffff] border border-[#ebebeb] text-[11px] font-mono text-[#666666]">
            <Sparkles className="w-3 h-3 text-[#171717]" />
            <span>RepoPilot Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#171717]">
            Hello {user?.displayName || "Developer"}, which repository should we explore?
          </h1>
          <p className="text-sm text-[#666666] max-w-lg mx-auto">
            Provide any public GitHub repository URL to initiate bounded file ingestion, architectural synthesis, and interactive blueprint discovery.
          </p>
        </div>

        {/* Composer Card */}
        <div className="bg-white border border-[#ebebeb] rounded-lg shadow-sm p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStartSession();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-[#8f8f8f] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={isLoading}
                aria-label="GitHub Repository URL"
                className="w-full text-sm font-mono pl-10 pr-4 py-3 bg-[#fafafa] border border-[#ebebeb] rounded focus:bg-white focus:outline-none focus:border-[#171717] transition-all disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <span className="text-[11px] font-mono text-[#8f8f8f]">
                Public GitHub repositories only &bull; Safe static analysis
              </span>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={!urlInput.trim() || isLoading}
                className="w-full sm:w-auto"
              >
                <span>{isLoading ? "Analyzing..." : "Analyze Codebase"}</span>
                {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </form>

          {/* Loading status progress */}
          {isLoading && (
            <div className="p-3.5 rounded border border-[#ebebeb] bg-[#fafafa] flex items-center gap-2.5 text-xs font-mono text-[#666666]">
              <Loader2 className="w-4 h-4 animate-spin text-[#171717]" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Banner with Retry */}
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded border border-[#fecaca] bg-[#fef2f2] text-xs text-[#991b1b] space-y-2"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626] mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">Analysis Failed</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <div className="pl-6">
                <button
                  type="button"
                  onClick={() => handleStartSession()}
                  className="font-mono underline text-xs hover:text-[#7f1d1d]"
                >
                  Retry with this URL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sample Repository Chips */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-[#8f8f8f] uppercase tracking-wider block">
            Sample repositories
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_REPOS.map((sample) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => {
                  setUrlInput(sample.url);
                  handleStartSession(sample.url);
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#ebebeb] bg-white hover:border-[#171717] hover:bg-[#fafafa] text-xs font-mono text-[#171717] transition-all disabled:opacity-50"
              >
                <GitBranch className="w-3 h-3 text-[#666666]" />
                <span>{sample.owner}/{sample.repo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Policy & Grounding Card */}
        <div className="p-4 rounded border border-[#ebebeb] bg-white flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#297a3a] shrink-0 mt-0.5" />
          <div className="text-xs text-[#666666] space-y-1 leading-relaxed">
            <span className="font-medium text-[#171717] block">
              Evidence-grounded analysis policy
            </span>
            <p>
              Every claim, architectural insight, and generated specification points to inspected repository files. Code is never executed. Full repository contents are not persisted to database storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

