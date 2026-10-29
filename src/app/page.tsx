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
  ShieldCheck,
  CheckCircle2,
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-100/60">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
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
    <div className="min-h-screen flex flex-col bg-neutral-100/60 text-neutral-900 antialiased">
      <MarketingHeader />

      {/* Guest Session Persistent Banner when workspace active */}
      {analysisResult && (
        <div className="bg-sky-50 border-b border-sky-200 px-4 py-2.5 text-xs text-sky-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-sky-600" />
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
              className="text-xs font-semibold text-sky-900 hover:underline"
            >
              Sign in to save this session →
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-32">
        {!analysisResult || !analyzedUrl ? (
          /* ============================================================ */
          /* Initial Chat-First Guest Entry & Centered Composer           */
          /* ============================================================ */
          <div className="max-w-3xl mx-auto space-y-12 py-6 sm:py-10 text-center animate-fadeIn">
            {/* Hero Heading */}
            <div className="space-y-4">
              <div className="flex justify-center mb-1">
                <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-neutral-200/90 shadow-email-card overflow-hidden hover:scale-105 transition-transform duration-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/icon.jpg" alt="RepoPilot Robot Mascot" className="w-full h-full object-contain rounded-xl" />
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-mono text-neutral-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>RepoPilot • Evidence-Grounded AI</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 leading-[1.15]">
                From codebase to blueprint.
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto font-normal leading-relaxed">
                Inspect public GitHub repositories with bounded context extraction, verified citations, and actionable innovation blueprints.
              </p>
            </div>

            {/* Centered Composer Card (styled like code.html 580px container) */}
            <div className="p-6 sm:p-8 rounded-2xl border border-neutral-200/90 bg-white shadow-email-card space-y-5 text-left transition-all">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="Paste a GitHub URL to start"
                    aria-label="GitHub Repository URL"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-neutral-50/70 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 font-mono focus:bg-white focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !repoUrl.trim()}
                  className="px-6 py-3 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
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
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-xs font-mono">
                <span className="text-neutral-500 font-medium">Try sample repository:</span>
                {DEMO_REPOSITORIES.map((repo) => (
                  <button
                    key={repo.label}
                    onClick={() => {
                      setRepoUrl(repo.url);
                      handleAnalyze(repo.url);
                    }}
                    disabled={isLoading}
                    className="px-3 py-1 rounded-lg bg-neutral-50 text-neutral-800 hover:bg-neutral-100 border border-neutral-200 transition-colors shadow-2xs font-mono text-xs"
                  >
                    {repo.label}
                  </button>
                ))}
              </div>

              {/* Loading status message */}
              {isLoading && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-2.5 text-xs font-mono text-neutral-700 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900" />
                  <span>{statusMessage || "Processing repository..."}</span>
                </div>
              )}

              {/* Error alert */}
              {errorMessage && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* How it works strip */}
            <section id="how-it-works" className="pt-8 text-left space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-semibold">
                  How RepoPilot Works
                </h2>
                <p className="text-base font-bold text-neutral-900">
                  Evidence-grounded code intelligence in three steps
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-mono font-bold text-neutral-900">
                    01 / Ingest
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Bounded context extraction parses GitHub trees, detects frameworks, and extracts real code excerpts.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-mono font-bold text-neutral-900">
                    02 / Ground
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Ask questions grounded in inspected files with verified file citations and explicit confidence indicators.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-mono font-bold text-neutral-900">
                    03 / Blueprint
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
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
          <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
            {/* Slim Guest Workspace Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 bg-white border border-neutral-200/90 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral-900">
                  {repoTitle || "Active Repository"}
                </span>
                <a
                  href={analyzedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-neutral-200 bg-neutral-50 text-[11px] font-mono text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 transition-all"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={handleReset}
                className="text-xs font-mono text-neutral-500 hover:text-neutral-900 hover:underline self-start sm:self-auto"
              >
                &larr; Analyze a different repository
              </button>
            </div>

            {/* Session Tabs (Chat is primary / default) */}
            <div className="border-b border-neutral-200 flex flex-wrap gap-2 sm:gap-4 pb-1">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === "chat"
                    ? "bg-neutral-900 text-white shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === "overview"
                    ? "bg-neutral-900 text-white shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === "documents"
                    ? "bg-neutral-900 text-white shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documents</span>
              </button>

              <button
                onClick={() => setActiveTab("innovation")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === "innovation"
                    ? "bg-neutral-900 text-white shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
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
