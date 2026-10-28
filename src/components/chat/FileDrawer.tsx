"use client";

import React, { useEffect, useRef } from "react";
import { X, FileCode, Copy, Check, ExternalLink } from "lucide-react";
import { EvidenceReference } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";

export interface FileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceReference | null;
  repoUrl?: string;
}

export function FileDrawer({
  isOpen,
  onClose,
  evidence,
  repoUrl,
}: FileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Close on Escape & trap scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !evidence) return null;

  const githubFileUrl = repoUrl
    ? `${repoUrl.replace(/\/+$/, "")}/blob/main/${evidence.path}`
    : null;

  async function handleCopy() {
    if (!evidence?.excerpt) return;
    try {
      await navigator.clipboard.writeText(evidence.excerpt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Evidence File Inspector"
          className="w-screen max-w-md sm:max-w-lg bg-white border-l border-[#ebebeb] shadow-xl flex flex-col animate-slideInRight"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#ebebeb] flex items-center justify-between bg-[#fafafa]">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="w-4 h-4 text-[#171717] shrink-0" />
              <span className="text-xs font-mono font-semibold text-[#171717] truncate">
                {evidence.path}
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close evidence inspector"
              className="p-1 rounded text-[#666666] hover:text-[#171717] hover:bg-[#ebebeb] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {/* Citation Reason Card */}
            <div className="p-3.5 rounded border border-[#ebebeb] bg-[#fafafa] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8f8f8f] font-semibold tracking-wider block">
                Citing Evidence Reason
              </span>
              <p className="text-xs text-[#171717] leading-relaxed">
                {evidence.reason}
              </p>
            </div>

            {/* Excerpt Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#8f8f8f] font-semibold tracking-wider">
                  Inspected File Excerpt
                </span>

                {evidence.excerpt && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#666666] hover:text-[#171717] px-2 py-0.5 rounded border border-[#ebebeb] bg-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-[#16a34a]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy snippet</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {evidence.excerpt ? (
                <div className="rounded border border-[#ebebeb] bg-[#fafafa] p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-[#171717] leading-relaxed whitespace-pre-wrap">
                    <code>{evidence.excerpt}</code>
                  </pre>
                </div>
              ) : (
                <div className="p-4 rounded border border-dashed border-[#ebebeb] text-center text-[#8f8f8f] font-mono text-xs">
                  Full file excerpt was not cached in the bounded context snapshot.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#ebebeb] bg-[#fafafa] flex items-center justify-between text-xs font-mono">
            {githubFileUrl ? (
              <a
                href={githubFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#666666] hover:text-[#171717] hover:underline"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[#8f8f8f]">Grounded in repository snapshot</span>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-white border border-[#ebebeb] text-[#171717] hover:bg-[#f0f0f0] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

