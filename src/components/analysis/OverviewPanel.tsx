"use client";

import React, { useState } from "react";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
import { Badge } from "@/components/ui/Badge";
import {
  ExternalLink,
  Star,
  GitFork,
  AlertCircle,
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface OverviewPanelProps {
  data: CompleteAnalysisResult;
}

export function OverviewPanel({ data }: OverviewPanelProps) {
  const [showFileInventory, setShowFileInventory] = useState(false);
  const repository = data?.repository || {
    fullName: "Repository",
    htmlUrl: "#",
    starsCount: 0,
    forksCount: 0,
    defaultBranch: "main",
    description: "",
  };
  const analysis = {
    purposeSummary: data?.analysis?.purposeSummary || "",
    architectureOverview: data?.analysis?.architectureOverview || "",
    keyComponents: data?.analysis?.keyComponents || [],
    observedFacts: data?.analysis?.observedFacts || [],
    inferences: data?.analysis?.inferences || [],
    unknowns: data?.analysis?.unknowns || [],
  };
  const detectedTechnologies = data?.detectedTechnologies || [];
  const analyzedFiles = data?.analyzedFiles || [];
  const coverageNotes = data?.coverageNotes || [];
  const aiDisclosure = data?.aiDisclosure || { configured: true, model: "Gemma 2" };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Repository Identity Card */}
      <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8f8f8f] uppercase">Repository</span>
              <Badge variant={aiDisclosure?.configured ? "success" : "muted"}>
                {aiDisclosure?.model || "Gemma 2"}
              </Badge>
            </div>
            <h2 className="text-2xl font-normal text-[#171717] tracking-tight flex items-center gap-2">
              {repository.fullName}
              <a
                href={repository.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#8f8f8f] hover:text-[#171717] transition-colors"
                title="Open repository on GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono text-[#666666]">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#8f8f8f]" />
              {repository.starsCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-[#8f8f8f]" />
              {repository.forksCount.toLocaleString()}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#4d4d4d]">
              branch: {repository.defaultBranch}
            </span>
            {repository.license && (
              <span className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#4d4d4d]">
                {repository.license}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-[#4d4d4d] leading-relaxed">
          {repository.description || "No repository description provided."}
        </p>

        {/* Detected Tech Stack */}
        {detectedTechnologies.length > 0 && (
          <div className="pt-3 border-t border-[#ebebeb] flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-[#8f8f8f] mr-1">Detected Stack:</span>
            {detectedTechnologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded text-xs font-mono bg-[#f5f5f5] text-[#171717] border border-[#ebebeb]"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Purpose & Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-3">
          <div className="text-xs font-mono text-[#8f8f8f] uppercase tracking-wider">
            Purpose Summary
          </div>
          <p className="text-sm text-[#171717] leading-relaxed whitespace-pre-line">
            {analysis.purposeSummary}
          </p>
        </div>

        <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-3">
          <div className="text-xs font-mono text-[#8f8f8f] uppercase tracking-wider">
            Architecture Overview
          </div>
          <p className="text-sm text-[#171717] leading-relaxed whitespace-pre-line">
            {analysis.architectureOverview}
          </p>
        </div>
      </div>

      {/* Key Components with File Evidence */}
      {analysis.keyComponents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-normal text-[#171717]">
              Key System Components ({analysis.keyComponents.length})
            </h3>
            <span className="text-xs font-mono text-[#8f8f8f]">
              Citations linked to retrieved files
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.keyComponents.map((comp, idx) => (
              <div
                key={idx}
                className="p-4 rounded border border-[#ebebeb] bg-white space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-[#8f8f8f] uppercase">
                    Component 0{idx + 1}
                  </span>
                  <h4 className="text-sm font-medium text-[#171717]">{comp.name}</h4>
                  <p className="text-xs text-[#666666] leading-relaxed">{comp.purpose}</p>
                </div>

                {comp.evidence && comp.evidence.length > 0 && (
                  <div className="pt-2 border-t border-[#ebebeb] space-y-1">
                    <span className="text-[10px] font-mono text-[#8f8f8f] uppercase">Evidence:</span>
                    <div className="flex flex-wrap gap-1">
                      {comp.evidence.map((ev, evIdx) => (
                        <span
                          key={evIdx}
                          title={ev.reason}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[#f5f5f5] text-[#4d4d4d] border border-[#ebebeb] truncate max-w-full"
                        >
                          <FileCode className="w-3 h-3 text-[#8f8f8f] shrink-0" />
                          <span className="truncate">{ev.path}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observed Facts vs Inferences vs Unknowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Observed Facts */}
        <div className="p-5 rounded border border-[#ebebeb] bg-white space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#297a3a] uppercase font-semibold">
            <ShieldCheck className="w-4 h-4" /> Observed Facts
          </div>
          <ul className="text-xs text-[#4d4d4d] space-y-2 list-disc list-inside">
            {analysis.observedFacts.map((fact, i) => (
              <li key={i} className="leading-relaxed">
                {fact}
              </li>
            ))}
            {analysis.observedFacts.length === 0 && (
              <li className="text-[#8f8f8f] italic list-none">None noted.</li>
            )}
          </ul>
        </div>

        {/* Inferences */}
        <div className="p-5 rounded border border-[#ebebeb] bg-white space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#7d5700] uppercase font-semibold">
            <AlertCircle className="w-4 h-4" /> Architectural Inferences
          </div>
          <ul className="text-xs text-[#4d4d4d] space-y-2 list-disc list-inside">
            {analysis.inferences.map((inf, i) => (
              <li key={i} className="leading-relaxed">
                {inf}
              </li>
            ))}
            {analysis.inferences.length === 0 && (
              <li className="text-[#8f8f8f] italic list-none">None noted.</li>
            )}
          </ul>
        </div>

        {/* Unknowns */}
        <div className="p-5 rounded border border-[#ebebeb] bg-white space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8f8f8f] uppercase font-semibold">
            <AlertCircle className="w-4 h-4" /> Unobserved / Unknowns
          </div>
          <ul className="text-xs text-[#4d4d4d] space-y-2 list-disc list-inside">
            {analysis.unknowns.map((unk, i) => (
              <li key={i} className="leading-relaxed">
                {unk}
              </li>
            ))}
            {analysis.unknowns.length === 0 && (
              <li className="text-[#8f8f8f] italic list-none">None noted.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Coverage & Limitations Note */}
      <div className="p-5 rounded border border-[#ebebeb] bg-[#fafafa] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-[#666666] uppercase tracking-wider">
            Analysis Coverage &amp; Bounds
          </div>
          <button
            onClick={() => setShowFileInventory(!showFileInventory)}
            className="text-xs font-mono text-[#171717] hover:underline flex items-center gap-1"
          >
            {showFileInventory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {showFileInventory ? "Hide inspected files" : `View inspected files (${analyzedFiles.length})`}
          </button>
        </div>

        <ul className="text-xs text-[#666666] font-mono space-y-1 list-disc list-inside">
          {coverageNotes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>

        {/* Expandable File Inventory */}
        {showFileInventory && (
          <div className="pt-3 border-t border-[#ebebeb] max-h-60 overflow-y-auto space-y-1">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#8f8f8f] border-b border-[#ebebeb]">
                  <th className="py-1">File Path</th>
                  <th className="py-1">Category</th>
                  <th className="py-1 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]/50">
                {analyzedFiles.map((file, idx) => (
                  <tr key={idx} className="hover:bg-white">
                    <td className="py-1 text-[#171717]">{file.path}</td>
                    <td className="py-1 text-[#666666]">{file.category}</td>
                    <td className="py-1 text-right text-[#8f8f8f]">
                      {(file.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

