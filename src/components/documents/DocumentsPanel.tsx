"use client";

import React, { useState } from "react";
import { GeneratedDocumentsResult } from "@/lib/documents/generate-documents";
import { Copy, Check, Download, FileText, Terminal, Layers, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface DocumentsPanelProps {
  repoUrl: string;
}

type DocTab = "prd" | "trd" | "tdd" | "prompt";

export function DocumentsPanel({ repoUrl }: DocumentsPanelProps) {
  const [activeTab, setActiveTab] = useState<DocTab>("prd");
  const [data, setData] = useState<GeneratedDocumentsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userIdea, setUserIdea] = useState("");
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: repoUrl,
          userIdea: userIdea.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || "Failed to generate documents.");
      }

      setData(resData as GeneratedDocumentsResult);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedDoc(label);
    setTimeout(() => setCopiedDoc(null), 2500);
  }

  function handleDownload(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Acronyms disclosure guide */}
      <div className="p-4 rounded border border-[#ebebeb] bg-[#fafafa] flex flex-wrap gap-4 text-xs font-mono text-[#666666]">
        <div>
          <span className="font-semibold text-[#171717]">PRD:</span> Product Requirements Document
        </div>
        <div>
          <span className="font-semibold text-[#171717]">TRD:</span> Technical Requirements Document
        </div>
        <div>
          <span className="font-semibold text-[#171717]">TDD:</span> Technical Design Document
        </div>
        <div>
          <span className="font-semibold text-[#171717]">Agent Prompt:</span> Phased coding instructions
        </div>
      </div>

      {/* Idea input & generation trigger */}
      {!data && !isLoading && (
        <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#171717]" />
            <h3 className="text-sm font-medium text-[#171717]">
              Synthesize Consistent Project Planning Package
            </h3>
          </div>
          <p className="text-xs text-[#666666] leading-relaxed">
            RepoPilot will first generate a unified Shared Project Specification from the reference codebase, and then derive all four documents from that shared specification to eliminate architectural contradictions.
          </p>

          <div className="space-y-2">
            <label htmlFor="user-idea" className="text-xs font-mono text-[#8f8f8f] uppercase">
              Project Concept or Goal (Optional):
            </label>
            <input
              id="user-idea"
              type="text"
              value={userIdea}
              onChange={(e) => setUserIdea(e.target.value)}
              placeholder="e.g. Build an ultra-fast lightweight alternative with SQLite storage and clean REST API"
              className="w-full text-sm font-mono px-3 py-2 bg-white border border-[#ebebeb] rounded text-[#171717] placeholder-[#a8a8a8] focus:border-[#171717] focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 bg-[#171717] text-white text-xs font-medium rounded hover:bg-[#000000] flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate PRD, TRD, TDD &amp; Coding Prompt
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-8 rounded border border-[#ebebeb] bg-white text-center space-y-3">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#171717]" />
          <h4 className="text-sm font-medium text-[#171717]">Generating Unified Project Package</h4>
          <p className="text-xs font-mono text-[#666666] max-w-md mx-auto">
            1. Synthesizing shared project specification...<br />
            2. Deriving PRD, TRD, TDD, and coding-agent prompt with Gemma...
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded border border-[#fae29c] bg-[#fff9e6] text-xs text-[#7d5700] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 rounded border border-[#ebebeb] bg-white">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1 rounded bg-[#fafafa] border border-[#ebebeb]">
              <button
                onClick={() => setActiveTab("prd")}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                  activeTab === "prd"
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-[#666666] hover:text-[#171717]"
                }`}
              >
                <FileText className="w-3 h-3" />
                PRD
              </button>
              <button
                onClick={() => setActiveTab("trd")}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                  activeTab === "trd"
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-[#666666] hover:text-[#171717]"
                }`}
              >
                <Layers className="w-3 h-3" />
                TRD
              </button>
              <button
                onClick={() => setActiveTab("tdd")}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                  activeTab === "tdd"
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-[#666666] hover:text-[#171717]"
                }`}
              >
                <FileText className="w-3 h-3" />
                TDD
              </button>
              <button
                onClick={() => setActiveTab("prompt")}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                  activeTab === "prompt"
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-[#666666] hover:text-[#171717]"
                }`}
              >
                <Terminal className="w-3 h-3" />
                Coding Prompt
              </button>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleDownload(
                    data.markdown.fullBundle,
                    `${data.spec.projectName.toLowerCase().replace(/\s+/g, "-")}-full-bundle.md`
                  )
                }
                className="px-3 py-1.5 rounded border border-[#ebebeb] text-xs font-mono text-[#171717] hover:bg-[#fafafa] flex items-center gap-1 transition-colors"
                title="Download all documents in a unified markdown file"
              >
                <Download className="w-3 h-3" />
                Download Bundle (.md)
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-4">
            <div className="flex justify-between items-center border-b border-[#ebebeb] pb-3">
              <span className="text-xs font-mono text-[#8f8f8f] uppercase">
                {activeTab.toUpperCase()} Markdown Preview
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text =
                      activeTab === "prd"
                        ? data.markdown.prd
                        : activeTab === "trd"
                        ? data.markdown.trd
                        : activeTab === "tdd"
                        ? data.markdown.tdd
                        : data.markdown.prompt;
                    handleCopy(text, activeTab);
                  }}
                  className="px-2.5 py-1 rounded border border-[#ebebeb] text-xs font-mono text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] flex items-center gap-1 transition-colors"
                >
                  {copiedDoc === activeTab ? (
                    <>
                      <Check className="w-3 h-3 text-[#297a3a]" />
                      <span className="text-[#297a3a]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const text =
                      activeTab === "prd"
                        ? data.markdown.prd
                        : activeTab === "trd"
                        ? data.markdown.trd
                        : activeTab === "tdd"
                        ? data.markdown.tdd
                        : data.markdown.prompt;
                    handleDownload(text, `${activeTab.toUpperCase()}.md`);
                  }}
                  className="px-2.5 py-1 rounded border border-[#ebebeb] text-xs font-mono text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Document display area */}
            <div className="font-mono text-xs text-[#171717] bg-[#fafafa] p-4 rounded border border-[#ebebeb] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {activeTab === "prd" && data.markdown.prd}
              {activeTab === "trd" && data.markdown.trd}
              {activeTab === "tdd" && data.markdown.tdd}
              {activeTab === "prompt" && data.markdown.prompt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
