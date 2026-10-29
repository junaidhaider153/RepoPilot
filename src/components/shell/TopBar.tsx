"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  ExternalLink,
  Download,
  Share2,
  MessageSquare,
  Compass,
  FileText,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { ModelBadge } from "@/components/ui/ModelBadge";
import { SessionItemData, SessionTab } from "./types";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  session?: SessionItemData;
  activeTab: SessionTab;
  onTabChange: (tab: SessionTab) => void;
  onOpenMobileMenu: () => void;
  onExportAll: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  modelName?: string;
  className?: string;
}

export function TopBar({
  session,
  activeTab,
  onTabChange,
  onOpenMobileMenu,
  onExportAll,
  onRefresh,
  isRefreshing = false,
  modelName = "gemini-flash-lite-latest",
  className,
}: TopBarProps) {
  const tabs = [
    { id: "chat" as SessionTab, label: "Chat", icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: "overview" as SessionTab, label: "Overview", icon: <Compass className="w-3.5 h-3.5" /> },
    { id: "documents" as SessionTab, label: "Documents", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "blueprint" as SessionTab, label: "Blueprint", icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <header
      className={cn(
        "h-12 bg-white/85 backdrop-blur-md border-b border-[#ebebeb]/80 px-3 sm:px-4 flex items-center justify-between shrink-0 z-10 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all",
        className
      )}
    >
      {/* Left: Mobile Menu Trigger + Session Title & Repo Chip */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar menu"
          className="md:hidden p-1.5 text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] rounded transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {session && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-[#171717] truncate max-w-[120px] sm:max-w-[200px]">
              {session.title}
            </span>

            {/* Repo Chip */}
            <a
              href={session.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`View ${session.owner}/${session.repo} on GitHub`}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#ebebeb] bg-[#fafafa] text-[11px] font-mono text-[#666666] hover:text-[#171717] hover:border-[#8f8f8f] transition-colors"
            >
              <span>
                {session.owner}/{session.repo}
              </span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>

      {/* Center: Tabs Strip */}
      {session && (
        <nav
          aria-label="Session Workspace Tabs"
          className="flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none h-full"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const tabHref =
              tab.id === "chat"
                ? `/app/s/${session.id}`
                : `/app/s/${session.id}/${tab.id}`;

            return (
              <Link
                key={tab.id}
                href={tabHref}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "h-full px-2 sm:px-3 text-xs sm:text-sm font-mono tracking-tight flex items-center gap-1.5 border-b-2 transition-all duration-200 -mb-px focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-600",
                  isActive
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-[#666666] hover:text-[#171717] hover:border-slate-300"
                )}
              >
                {tab.icon}
                <span className="hidden xs:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Right: Actions & Model Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <ModelBadge modelName={modelName} className="hidden lg:inline-flex" />

        {session && (
          <>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh repository files and architectural snapshot"
                className="p-1.5 sm:px-2.5 sm:py-1 rounded border border-[#ebebeb] text-xs font-mono text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            )}

            <button
              onClick={onExportAll}
              title="Export all documents as Markdown"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded border border-[#ebebeb] text-xs font-mono text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              disabled
              title="Share session (Phase 3)"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded border border-[#ebebeb] text-xs font-mono text-[#a8a8a8] bg-[#fafafa] cursor-not-allowed hidden sm:flex items-center gap-1.5 opacity-60"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Share</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

