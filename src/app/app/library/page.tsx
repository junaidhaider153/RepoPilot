"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Download,
  Trash2,
  ExternalLink,
  BookOpen,
  Filter,
  Plus,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { LibraryDocumentItem } from "@/lib/persistence/store";

export default function LibraryPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<LibraryDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch("/api/documents/library")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.documents) {
          setDocuments(data.documents);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Unique repos for filter dropdown
  const uniqueRepos = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => set.add(d.repoName));
    return Array.from(set);
  }, [documents]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // Type filter
        if (typeFilter !== "all" && doc.kind !== typeFilter) return false;
        // Repo filter
        if (selectedRepo !== "all" && doc.repoName !== selectedRepo) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            doc.sessionTitle.toLowerCase().includes(q) ||
            doc.repoName.toLowerCase().includes(q) ||
            doc.kind.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [documents, typeFilter, selectedRepo, searchQuery, sortAsc]);

  function handleDownloadSingle(doc: LibraryDocumentItem) {
    const blob = new Blob([doc.contentMd], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.repoName.replace("/", "-")}-${doc.kind}-v${doc.version}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Document downloaded",
      message: `Downloaded ${doc.kind.toUpperCase()} for ${doc.repoName}.`,
      type: "success",
    });
  }

  function handleBulkDownload() {
    if (filteredDocuments.length === 0) return;

    let bundle = `# RepoPilot Document Export Archive\n\n`;
    bundle += `Exported: ${new Date().toISOString()}  \n`;
    bundle += `Total Documents: ${filteredDocuments.length}\n\n---\n\n`;

    for (const doc of filteredDocuments) {
      bundle += `## ${doc.sessionTitle} — ${doc.kind.toUpperCase()}\n`;
      bundle += `- **Repository**: ${doc.repoName} (${doc.repoUrl})\n`;
      bundle += `- **Generated At**: ${doc.createdAt}\n\n`;
      bundle += `${doc.contentMd}\n\n---\n\n`;
    }

    const blob = new Blob([bundle], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repopilot-library-bundle-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Bulk export downloaded",
      message: `Downloaded ${filteredDocuments.length} specifications in a single archive.`,
      type: "success",
    });
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/documents/library?id=${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document.");

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast({
        title: "Document removed",
        message: "The specification document has been removed from your library.",
        type: "info",
      });
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ebebeb] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-[#171717]" />
            <h1 className="text-xl font-bold tracking-tight text-[#171717]">
              Document Library
            </h1>
          </div>
          <p className="text-xs text-[#666666]">
            Every project specification (PRD, TRD, TDD, Prompt) generated across all your repository sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredDocuments.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleBulkDownload}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Bulk Download ({filteredDocuments.length})
            </Button>
          )}

          <Link href="/app">
            <Button className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#ebebeb] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8f8f8f] absolute left-3 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by repository, title, or specification type..."
              className="pl-9"
            />
          </div>

          {/* Repository Dropdown */}
          {uniqueRepos.length > 1 && (
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="px-3 py-2 text-xs font-mono rounded border border-[#ebebeb] bg-white text-[#171717] focus:outline-none focus:border-[#171717]"
              aria-label="Filter by repository"
            >
              <option value="all">All Repositories ({uniqueRepos.length})</option>
              {uniqueRepos.map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          )}

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono rounded border border-[#ebebeb] bg-white hover:bg-[#fafafa] text-[#666666] hover:text-[#171717] transition-colors"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortAsc ? "Oldest First" : "Newest First"}</span>
          </button>
        </div>

        {/* Kind Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#f5f5f5] text-xs font-mono">
          <span className="text-[#8f8f8f] mr-1 text-[11px] uppercase flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Type:
          </span>
          {["all", "prd", "trd", "tdd", "prompt"].map((kind) => {
            const isSelected = typeFilter === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setTypeFilter(kind)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  isSelected
                    ? "bg-[#171717] text-white"
                    : "bg-[#fafafa] text-[#666666] hover:bg-[#ebebeb] hover:text-[#171717]"
                }`}
              >
                {kind.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table / List View */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-[#8f8f8f] bg-white rounded-lg border border-[#ebebeb]">
          Loading document library...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-[#ebebeb] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center mx-auto text-[#8f8f8f]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">No documents found</h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto mt-1">
              {searchQuery || typeFilter !== "all" || selectedRepo !== "all"
                ? "No specifications match your search or filter criteria. Try clearing filters."
                : "Generate PRDs, TRDs, and TDDs by exploring a codebase in your workspace."}
            </p>
          </div>
          <Link href="/app">
            <Button className="mt-2 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Explore a Repository
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#ebebeb] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] border-b border-[#ebebeb] text-[11px] font-mono uppercase text-[#8f8f8f]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Specification</th>
                  <th className="py-3 px-4 font-semibold">Repository</th>
                  <th className="py-3 px-4 font-semibold">Version</th>
                  <th className="py-3 px-4 font-semibold">Generated Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {filteredDocuments.map((doc) => {
                  const typeLabel =
                    doc.kind === "prd"
                      ? "Product Requirements Document (PRD)"
                      : doc.kind === "trd"
                      ? "Technical Requirements Document (TRD)"
                      : doc.kind === "tdd"
                      ? "Technical Design Document (TDD)"
                      : "Coding Agent Phased Prompt";

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-[#fafafa] transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium text-[#171717]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#f0f0f0] border border-[#d6d6d6] text-[#171717] shrink-0">
                            {doc.kind}
                          </span>
                          <span className="truncate max-w-xs sm:max-w-md font-sans">
                            {typeLabel}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666]">
                        <Link
                          href={`/app/s/${doc.sessionId}/documents`}
                          className="hover:text-[#171717] hover:underline"
                        >
                          {doc.repoName}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#8f8f8f]">
                        v{doc.version}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#8f8f8f]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/app/s/${doc.sessionId}/documents`}
                            title="Open in Workspace"
                            className="p-1.5 rounded hover:bg-[#ebebeb] text-[#666666] hover:text-[#171717] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(doc)}
                            title="Download Markdown"
                            className="p-1.5 rounded hover:bg-[#ebebeb] text-[#666666] hover:text-[#171717] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete Document"
                            className="p-1.5 rounded hover:bg-[#fef2f2] text-[#8f8f8f] hover:text-[#dc2626] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
