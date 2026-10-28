"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  Download,
  Trash2,
  FileJson,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function DataAndPrivacyPage() {
  const { toast } = useToast();
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingMd, setIsExportingMd] = useState(false);

  // Delete all sessions modal
  const [isDeleteSessionsOpen, setIsDeleteSessionsOpen] = useState(false);
  const [isDeletingSessions, setIsDeletingSessions] = useState(false);

  async function handleExport(format: "json" | "markdown") {
    if (format === "json") setIsExportingJson(true);
    else setIsExportingMd(true);

    try {
      const res = await fetch(`/api/account/export?format=${format}`);
      if (!res.ok) throw new Error("Failed to export data.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `repopilot-data-export.${format === "json" ? "json" : "md"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Data exported",
        message: `Successfully downloaded your ${format.toUpperCase()} export package.`,
        type: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Export failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    } finally {
      setIsExportingJson(false);
      setIsExportingMd(false);
    }
  }

  async function handleDeleteAllSessions() {
    setIsDeletingSessions(true);
    try {
      const res = await fetch("/api/account/sessions", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete sessions.");

      toast({
        title: "Sessions cleared",
        message: "All repository sessions and cached snapshots have been deleted.",
        type: "info",
      });

      setIsDeleteSessionsOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Deletion failed",
        message: err instanceof Error ? err.message : "Error contacting server.",
        type: "error",
      });
    } finally {
      setIsDeletingSessions(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Export Your Data</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Download an exhaustive archive of all your repository analyses, chat conversations, and generated project specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg pt-2">
          <div className="p-4 rounded border border-[#ebebeb] bg-[#fafafa] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-[#171717]" />
                <span className="text-xs font-semibold text-[#171717]">Structured JSON</span>
              </div>
              <p className="text-[11px] text-[#666666] leading-relaxed">
                Complete relational data dump containing profiles, sessions, messages, documents, and snapshots.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleExport("json")}
              isLoading={isExportingJson}
              disabled={isExportingJson || isExportingMd}
              className="w-full text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download JSON
            </Button>
          </div>

          <div className="p-4 rounded border border-[#ebebeb] bg-[#fafafa] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#171717]" />
                <span className="text-xs font-semibold text-[#171717]">Formatted Markdown</span>
              </div>
              <p className="text-[11px] text-[#666666] leading-relaxed">
                Human-readable compilation with all PRDs, TRDs, TDDs, prompts, and conversation transcripts.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleExport("markdown")}
              isLoading={isExportingMd}
              disabled={isExportingJson || isExportingMd}
              className="w-full text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Markdown
            </Button>
          </div>
        </div>
      </div>

      {/* Storage and AI Privacy Disclosure */}
      <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Data Storage & AI Privacy</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Transparent disclosure of data retention boundaries and AI provider integrations.
          </p>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          <div className="p-3.5 rounded border border-[#ebebeb] bg-[#fafafa] space-y-1">
            <p className="font-semibold text-[#171717] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
              <span>What We Store</span>
            </p>
            <p className="text-[#666666]">
              RepoPilot stores repository analysis summaries, detected technology tags, selected file paths, and short evidence excerpts. We deliberately <strong>do NOT store full repository source file contents</strong> in the database. Full files are re-fetched only on demand or upon clicking Refresh.
            </p>
          </div>

          <div className="p-3.5 rounded border border-[#ebebeb] bg-[#fafafa] space-y-1">
            <p className="font-semibold text-[#171717] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#171717]" />
              <span>What Is Sent to AI Providers</span>
            </p>
            <p className="text-[#666666]">
              When running repository ingestion, asking questions in chat, or synthesizing project specifications, selected file excerpts are transmitted over TLS to Google Generative Language endpoints for inference. No code is executed on RepoPilot servers or sandbox environments.
            </p>
          </div>
        </div>
      </div>

      {/* Delete All Sessions */}
      <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Wipe Repository Sessions</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Remove all saved sessions, messages, documents, and snapshots while keeping your user account active.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="danger"
            onClick={() => setIsDeleteSessionsOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete All Sessions
          </Button>
        </div>
      </div>

      {/* Delete Sessions Modal */}
      <Modal
        isOpen={isDeleteSessionsOpen}
        onClose={() => setIsDeleteSessionsOpen(false)}
        title="Delete All Sessions"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b] space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Are you sure you want to delete all sessions?</span>
            </p>
            <p className="leading-relaxed">
              This will permanently delete all your previous codebase sessions, conversation histories, and generated documentation packages. Your account will remain open.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebebeb]">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteSessionsOpen(false)}
              disabled={isDeletingSessions}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAllSessions}
              isLoading={isDeletingSessions}
              disabled={isDeletingSessions}
            >
              Yes, Delete All Sessions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
