"use client";

import React, { useState } from "react";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
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
} from "lucide-react";

type ActiveTab = "overview" | "chat" | "documents" | "innovation";

const DEMO_REPOSITORIES = [
  { label: "Hello-World", url: "https://github.com/octocat/Hello-World" },
  { label: "React", url: "https://github.com/facebook/react" },
  { label: "Next.js", url: "https://github.com/vercel/next.js" },
];

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CompleteAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setActiveTab("overview");
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
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero / Header Section */}
      {!analysisResult && (
        <div className="space-y-4 text-center sm:text-left py-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-[#ebebeb] text-[11px] font-mono text-[#666666]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]"></span>
            <span>RepoPilot Active &bull; Gemma 2 Powered</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#171717] leading-tight">
            From codebase to blueprint.
          </h1>
          <p className="text-base sm:text-lg text-[#666666] max-w-2xl font-normal leading-relaxed">
            Ingest public GitHub repositories with bounded context extraction, grounded repository Q&amp;A with citations, automated PRD/TRD/TDD specifications, and actionable innovation blueprints.
          </p>
        </div>
      )}

      {/* Repository Input Section */}
      <section
        aria-labelledby="repo-input-heading"
        className="p-6 rounded border border-[#ebebeb] bg-white space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h2 id="repo-input-heading" className="text-xs font-mono uppercase tracking-wider text-[#8f8f8f]">
            {analysisResult ? "Active Repository" : "Target Repository"}
          </h2>
          {analysisResult && (
            <button
              onClick={handleReset}
              className="text-xs font-mono text-[#171717] hover:underline self-start sm:self-auto"
            >
              &larr; Analyze a different repository
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8f8f8f] absolute left-3 top-3" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#ebebeb] rounded text-[#171717] placeholder-[#a8a8a8] font-mono focus:border-[#171717] focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !repoUrl.trim()}
            className="px-5 py-2 bg-[#171717] text-white text-xs font-medium rounded hover:bg-[#000000] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Codebase</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Repositories */}
        {!analysisResult && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ebebeb] text-xs font-mono">
            <span className="text-[#8f8f8f]">Try sample repository:</span>
            {DEMO_REPOSITORIES.map((repo) => (
              <button
                key={repo.label}
                onClick={() => {
                  setRepoUrl(repo.url);
                  handleAnalyze(repo.url);
                }}
                disabled={isLoading}
                className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#171717] hover:bg-[#ebebeb] border border-[#ebebeb] transition-colors"
              >
                {repo.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading status message */}
        {isLoading && (
          <div className="p-3 rounded bg-[#fafafa] border border-[#ebebeb] flex items-center gap-2 text-xs font-mono text-[#666666]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#171717]" />
            <span>{statusMessage || "Processing repository..."}</span>
          </div>
        )}

        {/* Error alert */}
        {errorMessage && (
          <div className="p-4 rounded border border-[#fae29c] bg-[#fff9e6] text-xs text-[#7d5700] flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}
      </section>

      {/* Feature Navigation Tabs when analyzed */}
      {analysisResult && analyzedUrl && (
        <div className="space-y-6">
          <div className="border-b border-[#ebebeb] flex flex-wrap gap-2 sm:gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "overview"
                  ? "border-[#171717] text-[#171717] font-medium"
                  : "border-transparent text-[#666666] hover:text-[#171717]"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>01 / Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "chat"
                  ? "border-[#171717] text-[#171717] font-medium"
                  : "border-transparent text-[#666666] hover:text-[#171717]"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>02 / Ask Codebase</span>
            </button>

            <button
              onClick={() => setActiveTab("documents")}
              className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "documents"
                  ? "border-[#171717] text-[#171717] font-medium"
                  : "border-transparent text-[#666666] hover:text-[#171717]"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>03 / Project Documents</span>
            </button>

            <button
              onClick={() => setActiveTab("innovation")}
              className={`pb-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "innovation"
                  ? "border-[#171717] text-[#171717] font-medium"
                  : "border-transparent text-[#666666] hover:text-[#171717]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>04 / Innovation Blueprint</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeTab === "overview" && <OverviewPanel data={analysisResult} />}
            {activeTab === "chat" && <ChatPanel repoUrl={analyzedUrl} />}
            {activeTab === "documents" && <DocumentsPanel repoUrl={analyzedUrl} />}
            {activeTab === "innovation" && <InnovationPanel repoUrl={analyzedUrl} />}
          </div>
        </div>
      )}

      {/* Feature Overview Grid when idle */}
      {!analysisResult && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="p-5 rounded border border-[#ebebeb] bg-white space-y-2">
            <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">01 / Overview</span>
            <h3 className="text-sm font-medium text-[#171717]">Repository Overview</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Automated tech stack detection, bounded tree file selection, key architecture components, and evidence notes.
            </p>
          </div>
          <div className="p-5 rounded border border-[#ebebeb] bg-white space-y-2">
            <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">02 / Chat</span>
            <h3 className="text-sm font-medium text-[#171717]">Ask the Codebase</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Factual Q&amp;A grounded strictly in retrieved files with exact file path citations and uncertainty disclosure.
            </p>
          </div>
          <div className="p-5 rounded border border-[#ebebeb] bg-white space-y-2">
            <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">03 / Specs</span>
            <h3 className="text-sm font-medium text-[#171717]">Project Documents</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              PRD, TRD, TDD, and phased coding-agent prompts derived from a single cohesive specification with 1-click Markdown export.
            </p>
          </div>
          <div className="p-5 rounded border border-[#ebebeb] bg-white space-y-2">
            <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">04 / Blueprint</span>
            <h3 className="text-sm font-medium text-[#171717]">Innovation Blueprint</h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Three evidence-backed improvement proposals and an actionable implementation plan with acceptance tests.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
