"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { OverviewPanel } from "@/components/analysis/OverviewPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { InnovationPanel } from "@/components/innovation/InnovationPanel";
import {
  Search,
  Loader2,
  AlertCircle,
  FileText,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Shield,
  Zap,
} from "lucide-react";

type ActiveTab = "chat" | "overview" | "documents" | "innovation";

const DEMO_REPOSITORIES = [
  { label: "Hello-World", url: "https://github.com/octocat/Hello-World" },
  { label: "react", url: "https://github.com/facebook/react" },
  { label: "next.js", url: "https://github.com/vercel/next.js" },
  { label: "spec-kit", url: "https://github.com/github/spec-kit" },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [repoUrl, setRepoUrl] = useState("");
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CompleteAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect authenticated users to /app
  useEffect(() => {
    if (user) {
      router.replace("/app");
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-2 text-xs font-mono text-[#666666]">
          <Loader2 className="w-4 h-4 animate-spin text-[#171717]" />
          <span>Redirecting to your workspace...</span>
        </div>
      </div>
    );
  }

  async function handleAnalyze(urlToAnalyze?: string) {
    const target = (urlToAnalyze || repoUrl).trim();
    if (!target || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage("Validating repository URL & fetching GitHub tree...");

    try {
      const res = await fetch("/api/repository/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to analyze repository.");
      }

      setAnalysisResult(data as CompleteAnalysisResult);
      setAnalyzedUrl(target);
      setActiveTab("chat"); // Default to Chat panel
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while analyzing the repository."
      );
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  }

  function handleReset() {
    setAnalysisResult(null);
    setAnalyzedUrl(null);
    setRepoUrl("");
    setErrorMessage(null);
    setActiveTab("chat");
  }

  // Parse repo title for guest workspace header
  const repoTitle = analyzedUrl
    ? analyzedUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\/+$/, "")
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <MarketingHeader />

      {/* Guest Session Persistent Banner when workspace active */}
      {analysisResult && (
        <div className="bg-[#f0f9ff] border-b border-[#bae6fd] px-4 py-2.5 text-xs text-[#0369a1] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-[#0284c7]" />
            <span>
              <strong>Guest Workspace:</strong> This temporary session is kept in your browser.{" "}
              <span className="hidden sm:inline">
                Sign in to save this session, chat history, documents, and blueprints across devices.
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#0369a1] hover:underline"
            >
              Sign in to save this session →
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysisResult || !analyzedUrl ? (
          /* ============================================================ */
          /* Initial Chat-First Guest Entry & Centered Composer           */
          /* ============================================================ */
          <div className="max-w-3xl mx-auto space-y-12 py-8 sm:py-16 text-center">
            {/* Hero Heading */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#ebebeb] text-[11px] font-mono text-[#666666] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]"></span>
                <span>RepoPilot • Evidence-Grounded AI</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#171717] leading-tight">
                From codebase to blueprint.
              </h1>
              <p className="text-base sm:text-lg text-[#666666] max-w-xl mx-auto font-normal leading-relaxed">
                Inspect public GitHub repositories with bounded context extraction, citations, and actionable innovation blueprints.
              </p>
            </div>

            {/* Centered Composer Card */}
            <div className="p-4 sm:p-6 rounded-xl border border-[#ebebeb] bg-white shadow-xs space-y-4 text-left">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8f8f8f] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="Paste a GitHub URL to start"
                    aria-label="GitHub Repository URL"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-[#ebebeb] rounded-lg text-[#171717] placeholder-[#a8a8a8] font-mono focus:border-[#171717] focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !repoUrl.trim()}
                  className="px-5 py-2.5 bg-[#171717] text-white text-xs font-medium rounded-lg hover:bg-[#000000] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Exploring</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Sample-repo chips directly under composer */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f5f5f5] text-xs font-mono">
                <span className="text-[#8f8f8f]">Try sample repository:</span>
                {DEMO_REPOSITORIES.map((repo) => (
                  <button
                    key={repo.label}
                    onClick={() => {
                      setRepoUrl(repo.url);
                      handleAnalyze(repo.url);
                    }}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded bg-[#fafafa] text-[#171717] hover:bg-[#ebebeb] border border-[#ebebeb] transition-colors"
                  >
                    {repo.label}
                  </button>
                ))}
              </div>

              {/* Loading status message */}
              {isLoading && (
                <div className="p-3 rounded-lg bg-[#fafafa] border border-[#ebebeb] flex items-center gap-2 text-xs font-mono text-[#666666]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#171717]" />
                  <span>{statusMessage || "Processing repository..."}</span>
                </div>
              )}

              {/* Error alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-lg border border-[#fae29c] bg-[#fff9e6] text-xs text-[#7d5700] flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* How it works strip */}
            <section id="how-it-works" className="pt-8 text-left space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#8f8f8f]">
                  How RepoPilot Works
                </h2>
                <p className="text-sm font-medium text-[#171717]">
                  Evidence-grounded code intelligence in three steps
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-lg border border-[#ebebeb] bg-white space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#171717]">
                    <Layers className="w-4 h-4 text-[#666666]" />
                    <span>01 / Ingest</span>
                  </div>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    Bounded context extraction parses GitHub trees, detects frameworks, and extracts real code excerpts.
                  </p>
                </div>

                <div className="p-5 rounded-lg border border-[#ebebeb] bg-white space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#171717]">
                    <MessageSquare className="w-4 h-4 text-[#666666]" />
                    <span>02 / Ground</span>
                  </div>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    Ask questions grounded in inspected files with verified file citations and explicit confidence indicators.
                  </p>
                </div>

                <div className="p-5 rounded-lg border border-[#ebebeb] bg-white space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#171717]">
                    <Sparkles className="w-4 h-4 text-[#666666]" />
                    <span>03 / Blueprint</span>
                  </div>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    Generate cohesive PRD, TRD, and TDD specifications alongside actionable 3-phase innovation blueprints.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* ============================================================ */
          /* Guest Workspace (Shared components, Chat-first)             */
          /* ============================================================ */
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Slim Guest Workspace Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 bg-white border border-[#ebebeb] rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#171717]">
                  {repoTitle || "Active Repository"}
                </span>
                <a
                  href={analyzedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#ebebeb] bg-[#fafafa] text-[11px] font-mono text-[#666666] hover:text-[#171717] transition-colors"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={handleReset}
                className="text-xs font-mono text-[#666666] hover:text-[#171717] hover:underline self-start sm:self-auto"
              >
                &larr; Analyze a different repository
              </button>
            </div>

            {/* Session Tabs (Chat is primary / default) */}
            <div className="border-b border-[#ebebeb] flex flex-wrap gap-2 sm:gap-6">
              <button
                onClick={() => setActiveTab("chat")}
                className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "chat"
                    ? "border-[#171717] text-[#171717] font-semibold"
                    : "border-transparent text-[#666666] hover:text-[#171717]"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "overview"
                    ? "border-[#171717] text-[#171717] font-semibold"
                    : "border-transparent text-[#666666] hover:text-[#171717]"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "documents"
                    ? "border-[#171717] text-[#171717] font-semibold"
                    : "border-transparent text-[#666666] hover:text-[#171717]"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Documents</span>
              </button>

              <button
                onClick={() => setActiveTab("innovation")}
                className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === "innovation"
                    ? "border-[#171717] text-[#171717] font-semibold"
                    : "border-transparent text-[#666666] hover:text-[#171717]"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Blueprint</span>
              </button>
            </div>

            {/* Shared Workspace Panels */}
            <div>
              <div className={activeTab === "chat" ? "block" : "hidden"}>
                <ChatPanel key={analyzedUrl} repoUrl={analyzedUrl} />
              </div>
              <div className={activeTab === "overview" ? "block" : "hidden"}>
                <OverviewPanel key={analyzedUrl} data={analysisResult} />
              </div>
              <div className={activeTab === "documents" ? "block" : "hidden"}>
                <DocumentsPanel key={analyzedUrl} repoUrl={analyzedUrl} />
              </div>
              <div className={activeTab === "innovation" ? "block" : "hidden"}>
                <InnovationPanel key={analyzedUrl} repoUrl={analyzedUrl} />
              </div>
            </div>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
