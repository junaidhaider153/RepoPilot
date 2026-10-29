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
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { ModelBadge } from "@/components/ui/ModelBadge";
import { SessionItemData, SessionTab, UserProfileData } from "./types";
import { Dropdown } from "@/components/ui/Dropdown";
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
  user?: UserProfileData;
  onSignOut?: () => void;
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
  user,
  onSignOut,
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
        "h-13 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 px-3 sm:px-5 flex items-center justify-between shrink-0 z-10 select-none shadow-xs transition-all",
        className
      )}
    >
      {/* Left: Mobile Menu Trigger + Session Title & Repo Chip */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar menu"
          className="md:hidden p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {session && (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 truncate max-w-[120px] sm:max-w-[200px]">
              {session.title}
            </span>

            {/* Repo Chip */}
            <a
              href={session.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`View ${session.owner}/${session.repo} on GitHub`}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-neutral-200 bg-neutral-50 text-[11px] font-mono text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:bg-white transition-all shadow-2xs"
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
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none h-full py-1.5"
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
                  "px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
                  isActive
                    ? "bg-neutral-900 text-white shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
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
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            )}

            <button
              onClick={onExportAll}
              title="Export all documents as Markdown"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              disabled
              title="Share session (Phase 3)"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-400 bg-neutral-50 cursor-not-allowed hidden sm:flex items-center gap-1.5 opacity-60"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Share</span>
            </button>
          </>
        )}

        {onSignOut && (
          <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-neutral-200">
            {user && (
              <Dropdown
                align="right"
                width="w-52"
                trigger={
                  <button
                    aria-label={`User profile menu for ${user.displayName || user.email}`}
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <div className="w-6 h-6 rounded-full bg-neutral-950 ring-1 ring-neutral-300 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}
                    </div>
                  </button>
                }
                items={[
                  {
                    id: "user-name",
                    label: user.displayName || user.email,
                    icon: <User className="w-3.5 h-3.5 text-neutral-400" />,
                    onClick: () => {
                      if (typeof window !== "undefined") {
                        window.location.href = "/app/settings";
                      }
                    },
                  },
                  {
                    id: "settings",
                    label: "Account Settings",
                    icon: <Settings className="w-3.5 h-3.5" />,
                    onClick: () => {
                      if (typeof window !== "undefined") {
                        window.location.href = "/app/settings/account";
                      }
                    },
                  },
                  "divider",
                  {
                    id: "signout",
                    label: "Sign out",
                    icon: <LogOut className="w-3.5 h-3.5 text-red-600" />,
                    danger: true,
                    onClick: () => onSignOut(),
                  },
                ]}
              />
            )}

            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out of RepoPilot"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-700 hover:text-red-700 hover:border-red-200 hover:bg-red-50 flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
