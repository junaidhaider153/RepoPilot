"use client";

import React, { useState, useEffect } from "react";
import { GeneratedDocumentsResult } from "@/lib/documents/generate-documents";
import { Copy, Check, Download, FileText, Terminal, Layers, Sparkles, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { useSessionWorkspaceOptional } from "@/context/SessionWorkspaceContext";
import { useToast } from "@/components/ui/Toast";

interface DocumentsPanelProps {
  repoUrl: string;
  sessionId?: string;
}

type DocTab = "prd" | "trd" | "tdd" | "prompt";

export function DocumentsPanel({ repoUrl, sessionId }: DocumentsPanelProps) {
  const { toast } = useToast();
  const workspace = useSessionWorkspaceOptional();
  const [activeTab, setActiveTab] = useState<DocTab>("prd");
  const [localData, setLocalData] = useState<GeneratedDocumentsResult | null>(null);
  const data = workspace ? workspace.documentsData : localData;
  const setData = workspace ? workspace.setDocumentsData : setLocalData;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userIdea, setUserIdea] = useState("");
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null);

  // Restore previously generated documents on mount if standalone without workspace provider
  useEffect(() => {
    if (workspace || !sessionId) return;
    let isMounted = true;

    fetch(`/api/sessions/${sessionId}/documents`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (!isMounted || !resData?.documents || !Array.isArray(resData.documents)) return;
        const docs = resData.documents;
        if (docs.length > 0) {
          const allDoc = docs.find((d: any) => d.kind === "all");
          if (allDoc?.content_md) {
            try {
              const parsed = JSON.parse(allDoc.content_md);
              if (parsed?.markdown && parsed?.spec && parsed?.documents) {
                setData(parsed);
                return;
              }
            } catch {
              // Fall through to manual markdown assembly
            }
          }

          const prdDoc = docs.find((d: any) => d.kind === "prd");
          const trdDoc = docs.find((d: any) => d.kind === "trd");
          const tddDoc = docs.find((d: any) => d.kind === "tdd");
          const promptDoc = docs.find((d: any) => d.kind === "prompt");

          setData({
            markdown: {
              prd: prdDoc?.content_md || "",
              trd: trdDoc?.content_md || "",
              tdd: tddDoc?.content_md || "",
              prompt: promptDoc?.content_md || "",
              fullBundle: [
                prdDoc?.content_md,
                trdDoc?.content_md,
                tddDoc?.content_md,
                promptDoc?.content_md,
              ]
                .filter(Boolean)
                .join("\n\n---\n\n"),
            },
            spec: {
              projectName: "Project Specification",
              coreConcept: "",
              targetAudience: [],
              keyDifferentiators: [],
              suggestedStack: [],
              coreCapabilities: [],
            },
            documents: {
              prd: { title: "PRD", tagline: "", problemStatement: "", targetUsers: [], goals: [], userStories: [], acceptanceCriteria: [] },
              trd: { title: "TRD", technologyStack: [], architecturePattern: "", constraintsAndLimits: [], securityAndPrivacy: [], testingStrategy: [] },
              tdd: { title: "TDD", components: [], dataModels: [], requestFlows: [], risksAndMitigations: [] },
              codingAgentPrompt: promptDoc?.content_md || "",
            },
            referenceRepo: repoUrl,
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [sessionId, repoUrl, workspace, setData]);

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
          sessionId,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || "Failed to generate documents.");
      }

      setData(resData as GeneratedDocumentsResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to server.";
      setErrorMsg(msg);
      toast({
        title: "Could not save document",
        message: msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDoc(label);
      setTimeout(() => setCopiedDoc(null), 2500);
    } catch {
      // Fallback for non-HTTPS or restricted iframe permissions
      setCopiedDoc(label);
      setTimeout(() => setCopiedDoc(null), 1500);
    }
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
        <div className="p-6 rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm space-y-4 transition-all duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <h3 className="text-sm font-semibold gemini-spark">
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
              className="w-full text-sm font-mono px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-xs font-medium rounded-lg hover:opacity-95 hover:shadow-md hover:shadow-blue-500/20 active:scale-[0.98] flex items-center gap-2 transition-all duration-200"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate PRD, TRD, TDD &amp; Coding Prompt
          </button>
        </div>
      )}

      {isLoading && (
        <div className="relative overflow-hidden p-8 rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30 shadow-xs text-center space-y-3">
          <div className="absolute top-0 left-0 right-0 h-0.5 animate-shimmer" />
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" />
          <h4 className="text-sm font-semibold text-slate-900">Generating Unified Project Package</h4>
          <p className="text-xs font-mono text-slate-600 max-w-md mx-auto">
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
            <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-50 border border-slate-200">
              <button
                onClick={() => setActiveTab("prd")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "prd"
                    ? "bg-blue-600 text-white shadow-xs font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <FileText className="w-3 h-3" />
                PRD
              </button>
              <button
                onClick={() => setActiveTab("trd")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "trd"
                    ? "bg-blue-600 text-white shadow-xs font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <Layers className="w-3 h-3" />
                TRD
              </button>
              <button
                onClick={() => setActiveTab("tdd")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "tdd"
                    ? "bg-blue-600 text-white shadow-xs font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <FileText className="w-3 h-3" />
                TDD
              </button>
              <button
                onClick={() => setActiveTab("prompt")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "prompt"
                    ? "bg-blue-600 text-white shadow-xs font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <Terminal className="w-3 h-3" />
                Coding Prompt
              </button>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setData(null)}
                className="px-3 py-1.5 rounded border border-[#ebebeb] text-xs font-mono text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] flex items-center gap-1 transition-colors"
                title="Synthesize new documents with a different concept"
              >
                <RotateCcw className="w-3 h-3" />
                New Concept
              </button>
              <button
                onClick={() =>
                  handleDownload(
                    data.markdown?.fullBundle || "",
                    `${(data.spec?.projectName || "project").toLowerCase().replace(/\s+/g, "-")}-full-bundle.md`
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

