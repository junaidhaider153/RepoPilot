"use client";

import React, { useState, useEffect } from "react";
import { InnovationOpportunity } from "@/lib/ai/schemas";
import { GeneratedBlueprintResult } from "@/lib/innovation/generate-blueprint";
import { Badge } from "@/components/ui/Badge";
import {
  Lightbulb,
  ArrowRight,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import { useSessionWorkspaceOptional } from "@/context/SessionWorkspaceContext";
import { useToast } from "@/components/ui/Toast";

interface InnovationPanelProps {
  repoUrl: string;
  sessionId?: string;
}

export function InnovationPanel({ repoUrl, sessionId }: InnovationPanelProps) {
  const { toast } = useToast();
  const workspace = useSessionWorkspaceOptional();
  const [localOpps, setLocalOpps] = useState<InnovationOpportunity[] | null>(null);
  const [localSelectedOpp, setLocalSelectedOpp] = useState<InnovationOpportunity | null>(null);
  const [localBlueprintResult, setLocalBlueprintResult] = useState<GeneratedBlueprintResult | null>(null);

  const opportunities = workspace ? workspace.opportunities : localOpps;
  const setOpportunities = workspace ? workspace.setOpportunities : setLocalOpps;
  const selectedOpp = workspace ? workspace.selectedOpportunity : localSelectedOpp;
  const setSelectedOpp = workspace ? workspace.setSelectedOpportunity : setLocalSelectedOpp;
  const blueprintResult = workspace ? workspace.blueprintResult : localBlueprintResult;
  const setBlueprintResult = workspace ? workspace.setBlueprintResult : setLocalBlueprintResult;

  const [isLoadingOpps, setIsLoadingOpps] = useState(false);
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Restore previous blueprint on mount if standalone without workspace provider
  useEffect(() => {
    if (workspace || !sessionId) return;
    let isMounted = true;

    fetch(`/api/sessions/${sessionId}/blueprint`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (!isMounted || !resData?.blueprint) return;
        const bp = resData.blueprint;
        if (bp.opportunities_json && Array.isArray(bp.opportunities_json) && bp.opportunities_json.length > 0) {
          setOpportunities(bp.opportunities_json as InnovationOpportunity[]);
          const selected = bp.opportunities_json[bp.selected_index || 0] || bp.opportunities_json[0];
          setSelectedOpp(selected);
        }
        if (bp.plan_json) {
          setBlueprintResult(bp.plan_json as GeneratedBlueprintResult);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [sessionId, workspace, setOpportunities, setSelectedOpp, setBlueprintResult]);

  async function handleLoadOpportunities() {
    setIsLoadingOpps(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/innovation/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl, sessionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to generate opportunities.");
      }

      setOpportunities(data.opportunities);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error contacting server.";
      setErrorMsg(msg);
      toast({
        title: "Could not save opportunities",
        message: msg,
        type: "error",
      });
    } finally {
      setIsLoadingOpps(false);
    }
  }

  async function handleSelectOpportunity(opp: InnovationOpportunity) {
    setSelectedOpp(opp);
    setIsLoadingBlueprint(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/innovation/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: repoUrl,
          opportunity: opp,
          sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to generate blueprint.");
      }

      setBlueprintResult(data as GeneratedBlueprintResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating blueprint.";
      setErrorMsg(msg);
      toast({
        title: "Could not save blueprint",
        message: msg,
        type: "error",
      });
    } finally {
      setIsLoadingBlueprint(false);
    }
  }

  async function handleCopyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1500);
    }
  }

  function handleDownloadMarkdown(content: string, filename: string) {
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
    <div className="space-y-8">
      {/* Disclaimer and overview */}
      <div className="p-4 rounded border border-[#ebebeb] bg-[#fafafa] flex items-center justify-between gap-4">
        <div className="text-xs font-mono text-[#666666]">
          <span className="font-semibold text-[#171717]">Innovation Policy:</span> Opportunities are grounded in inspected repository files. Differentiation statements and priority scores are AI-assisted hypotheses, not guaranteed market facts.
        </div>

        {opportunities && !blueprintResult && (
          <button
            onClick={handleLoadOpportunities}
            disabled={isLoadingOpps}
            className="text-xs font-mono text-[#171717] hover:underline flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Regenerate Proposals
          </button>
        )}
      </div>

      {/* Initial load trigger */}
      {!opportunities && !isLoadingOpps && (
        <div className="p-8 rounded border border-[#ebebeb] bg-white text-center space-y-4">
          <Lightbulb className="w-6 h-6 mx-auto text-[#171717]" />
          <h3 className="text-base font-normal text-[#171717]">
            Generate 3 Evidence-Aware Improvement Opportunities
          </h3>
          <p className="text-xs text-[#666666] max-w-lg mx-auto leading-relaxed">
            RepoPilot identifies gaps, architectural opportunities, or developer experience pain points directly visible in the inspected codebase, then formulates 3 distinct proposals.
          </p>
          <button
            onClick={handleLoadOpportunities}
            className="px-5 py-2.5 bg-[#171717] text-white text-xs font-medium rounded hover:bg-[#000000] transition-colors"
          >
            Discover Opportunities
          </button>
        </div>
      )}

      {isLoadingOpps && (
        <div className="p-8 rounded border border-[#ebebeb] bg-white text-center space-y-3">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#171717]" />
          <h4 className="text-sm font-medium text-[#171717]">Analyzing Architecture &amp; Synthesizing Opportunities</h4>
          <p className="text-xs font-mono text-[#666666]">
            Evaluating inspected files for enhancement hypotheses...
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded border border-[#fae29c] bg-[#fff9e6] text-xs text-[#7d5700] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3 Opportunities Grid */}
      {opportunities && !blueprintResult && !isLoadingBlueprint && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-normal text-[#171717]">
              Prioritized Opportunities (Select One to Blueprint)
            </h3>
            <span className="text-xs font-mono text-[#8f8f8f]">
              3 proposals generated
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-5 rounded border border-[#ebebeb] bg-white flex flex-col justify-between space-y-5 hover:border-[#8f8f8f] transition-all"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <Badge variant="default">Priority #{opp.suggestedPriority}</Badge>
                    <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">
                      Complexity: {opp.complexity}
                    </span>
                  </div>

                  <h4 className="text-base font-medium text-[#171717] leading-tight">
                    {opp.title}
                  </h4>

                  {/* Problem & Value */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-mono text-[#8f8f8f] uppercase block text-[10px]">
                        User Problem:
                      </span>
                      <p className="text-[#4d4d4d] leading-relaxed">{opp.problem}</p>
                    </div>

                    <div>
                      <span className="font-mono text-[#8f8f8f] uppercase block text-[10px]">
                        Expected Value:
                      </span>
                      <p className="text-[#171717] leading-relaxed font-normal">
                        {opp.expectedValue}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[#8f8f8f] uppercase block text-[10px]">
                        Differentiation Hypothesis:
                      </span>
                      <p className="text-[#666666] italic leading-relaxed">
                        &ldquo;{opp.differentiationHypothesis}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Evidence from Files */}
                  {opp.evidence && opp.evidence.length > 0 && (
                    <div className="pt-2 border-t border-[#ebebeb] space-y-1">
                      <span className="font-mono text-[#8f8f8f] uppercase block text-[10px]">
                        Inspected Evidence:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {opp.evidence.map((ev, i) => (
                          <span
                            key={i}
                            title={ev.reason}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#f5f5f5] text-[#4d4d4d] border border-[#ebebeb] truncate max-w-full"
                          >
                            <FileCode className="w-2.5 h-2.5 text-[#8f8f8f]" />
                            <span className="truncate">{ev.path}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks & Assumptions */}
                  <div className="pt-2 border-t border-[#ebebeb] space-y-1 text-xs text-[#666666]">
                    <span className="font-mono text-[#8f8f8f] uppercase block text-[10px]">
                      Key Risk:
                    </span>
                    <p className="text-[11px] text-[#4d4d4d]">
                      {opp.risks[0] || "None identified"}
                    </p>
                  </div>
                </div>

                {/* Selection Action */}
                <button
                  onClick={() => handleSelectOpportunity(opp)}
                  className="w-full mt-4 py-2 px-3 bg-[#171717] text-white text-xs font-medium rounded hover:bg-[#000000] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Build Implementation Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blueprint Loading */}
      {isLoadingBlueprint && (
        <div className="p-12 rounded border border-[#ebebeb] bg-white text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#171717]" />
          <h4 className="text-base font-normal text-[#171717]">
            Expanding Selected Opportunity into Implementation Blueprint
          </h4>
          <p className="text-xs font-mono text-[#666666]">
            Architecting phases, acceptance tests, API changes, and coding-agent prompt...
          </p>
        </div>
      )}

      {/* Selected Blueprint View */}
      {blueprintResult && selectedOpp && !isLoadingBlueprint && (
        <div className="space-y-6">
          {/* Back toolbar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 rounded border border-[#ebebeb] bg-white">
            <button
              onClick={() => {
                setBlueprintResult(null);
                setSelectedOpp(null);
              }}
              className="text-xs font-mono text-[#171717] hover:underline flex items-center gap-1"
            >
              &larr; Return to Opportunity Selection
            </button>

            <button
              onClick={() =>
                handleDownloadMarkdown(
                  blueprintResult.markdown,
                  `blueprint-${blueprintResult.blueprint.opportunityId}.md`
                )
              }
              className="px-3 py-1.5 rounded border border-[#ebebeb] text-xs font-mono text-[#171717] hover:bg-[#fafafa] flex items-center gap-1 transition-colors"
            >
              <Download className="w-3 h-3" />
              Download Blueprint (.md)
            </button>
          </div>

          {/* Blueprint Detail Card */}
          <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#8f8f8f] uppercase">
                  Selected Blueprint
                </span>
                <Badge variant="success">Implementation Ready</Badge>
              </div>
              <h3 className="text-2xl font-normal text-[#171717]">
                {blueprintResult.blueprint.title}
              </h3>
              <p className="text-sm text-[#4d4d4d] leading-relaxed">
                {blueprintResult.blueprint.summary}
              </p>
            </div>

            {/* Requirements & Component Changes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#ebebeb]">
              <div className="space-y-3">
                <span className="text-xs font-mono text-[#8f8f8f] uppercase">
                  Technical Requirements
                </span>
                <ul className="text-xs text-[#4d4d4d] space-y-1.5 list-disc list-inside">
                  {blueprintResult.blueprint.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono text-[#8f8f8f] uppercase">
                  Affected Components &amp; Architecture
                </span>
                <div className="space-y-2 text-xs text-[#4d4d4d]">
                  <div className="flex flex-wrap gap-1">
                    {blueprintResult.blueprint.affectedComponents.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#171717] font-mono text-[11px] border border-[#ebebeb]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {blueprintResult.blueprint.architectureChanges.map((arch, i) => (
                    <p key={i} className="text-[#666666]">
                      &bull; {arch}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Phased Roadmap */}
            <div className="space-y-4 pt-4 border-t border-[#ebebeb]">
              <h4 className="text-sm font-medium text-[#171717]">
                Phased Implementation Roadmap
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {blueprintResult.blueprint.implementationPhases.map((phase, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-4 rounded border border-[#ebebeb] bg-[#fafafa] space-y-3"
                  >
                    <div className="text-xs font-mono text-[#171717] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#297a3a]" />
                      <span>{phase.name}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#8f8f8f] uppercase">
                        Tasks:
                      </span>
                      <ul className="text-[11px] text-[#4d4d4d] space-y-1 list-disc list-inside">
                        {phase.tasks.map((task, tIdx) => (
                          <li key={tIdx}>{task}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#8f8f8f] uppercase">
                        Acceptance Criteria:
                      </span>
                      <ul className="text-[11px] text-[#4d4d4d] space-y-1 list-disc list-inside">
                        {phase.acceptanceCriteria.map((crit, cIdx) => (
                          <li key={cIdx}>{crit}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-[#ebebeb]">
                      <span className="text-[10px] font-mono text-[#8f8f8f] uppercase">
                        Verification Tests:
                      </span>
                      <div className="text-[11px] font-mono bg-white p-2 rounded border border-[#ebebeb] text-[#171717]">
                        {phase.tests.join(" && ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="pt-4 border-t border-[#ebebeb] space-y-2">
              <span className="text-xs font-mono text-[#8f8f8f] uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#7d5700]" />
                Identified Engineering Risks:
              </span>
              <ul className="text-xs text-[#4d4d4d] space-y-1 list-disc list-inside">
                {blueprintResult.blueprint.risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>

            {/* Coding Agent Implementation Prompt */}
            <div className="pt-4 border-t border-[#ebebeb] space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#171717]" />
                  <span className="text-xs font-mono text-[#171717] font-semibold">
                    Autonomous Coding-Agent Implementation Prompt
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleCopyPrompt(blueprintResult.blueprint.codingAgentPrompt)
                  }
                  className="px-2.5 py-1 rounded border border-[#ebebeb] text-xs font-mono text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] flex items-center gap-1 transition-colors"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3 h-3 text-[#297a3a]" />
                      <span className="text-[#297a3a]">Prompt Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Agent Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded border border-[#ebebeb] bg-[#fafafa] font-mono text-xs text-[#171717] max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {blueprintResult.blueprint.codingAgentPrompt}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

