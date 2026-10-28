"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  BookOpen,
  Settings,
  Shield,
  Sliders,
  Activity,
  Database,
  GitBranch,
  X,
  ArrowRight,
} from "lucide-react";
import { SessionItemData } from "./types";
import { cn } from "@/lib/utils";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionItemData[];
  onNewSession: () => void;
}

interface PaletteAction {
  id: string;
  title: string;
  category: "Navigation" | "Settings" | "Sessions";
  shortcut?: string;
  icon: React.ElementType;
  onSelect: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  sessions,
  onNewSession,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Built-in actions
  const defaultActions: PaletteAction[] = [
    {
      id: "action-new-session",
      title: "New Repository Session",
      category: "Navigation",
      shortcut: "N",
      icon: Plus,
      onSelect: () => {
        onNewSession();
        onClose();
      },
    },
    {
      id: "action-library",
      title: "Document Library",
      category: "Navigation",
      icon: BookOpen,
      onSelect: () => {
        router.push("/app/library");
        onClose();
      },
    },
    {
      id: "action-profile",
      title: "Profile Settings",
      category: "Settings",
      icon: Settings,
      onSelect: () => {
        router.push("/app/settings");
        onClose();
      },
    },
    {
      id: "action-account",
      title: "Account & Security",
      category: "Settings",
      icon: Shield,
      onSelect: () => {
        router.push("/app/settings/account");
        onClose();
      },
    },
    {
      id: "action-preferences",
      title: "Workspace Preferences",
      category: "Settings",
      icon: Sliders,
      onSelect: () => {
        router.push("/app/settings/preferences");
        onClose();
      },
    },
    {
      id: "action-usage",
      title: "Usage & Rate Limits",
      category: "Settings",
      icon: Activity,
      onSelect: () => {
        router.push("/app/settings/usage");
        onClose();
      },
    },
    {
      id: "action-data",
      title: "Data & Privacy Controls",
      category: "Settings",
      icon: Database,
      onSelect: () => {
        router.push("/app/settings/data");
        onClose();
      },
    },
  ];

  // Convert sessions to actions
  const sessionActions: PaletteAction[] = sessions.map((s) => ({
    id: `session-${s.id}`,
    title: `${s.title} (${s.owner}/${s.repo})`,
    category: "Sessions",
    icon: GitBranch,
    onSelect: () => {
      router.push(`/app/s/${s.id}`);
      onClose();
    },
  }));

  const allActions = [...defaultActions, ...sessionActions];

  // Filter actions
  const filteredActions = allActions.filter((a) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
  });

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredActions.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].onSelect();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="relative mx-auto max-w-xl transform rounded-lg bg-white border border-[#ebebeb] shadow-2xl transition-all overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#ebebeb] bg-[#fafafa]">
          <Search className="w-4 h-4 text-[#8f8f8f] mr-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search sessions..."
            className="w-full text-xs sm:text-sm font-sans bg-transparent placeholder-[#8f8f8f] focus:outline-none text-[#171717]"
          />
          <kbd className="hidden sm:inline px-1.5 py-0.5 rounded border border-[#d6d6d6] bg-[#f0f0f0] text-[10px] font-mono text-[#8f8f8f]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[#8f8f8f]">
              No matching commands or sessions found.
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded text-xs transition-colors text-left",
                    isSelected
                      ? "bg-[#171717] text-white"
                      : "text-[#171717] hover:bg-[#f5f5f5]"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isSelected ? "text-white" : "text-[#8f8f8f]"
                      )}
                    />
                    <span className="truncate font-medium">{action.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-mono uppercase tracking-wider",
                        isSelected ? "text-[#a3a3a3]" : "text-[#8f8f8f]"
                      )}
                    >
                      {action.category}
                    </span>

                    {action.shortcut && (
                      <kbd
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono",
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#f0f0f0] border border-[#d6d6d6] text-[#8f8f8f]"
                        )}
                      >
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#fafafa] border-t border-[#ebebeb] flex items-center justify-between text-[11px] font-mono text-[#8f8f8f]">
          <span>
            Use <kbd className="px-1 py-0.5 rounded bg-[#f0f0f0] border border-[#d6d6d6] text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-[#f0f0f0] border border-[#d6d6d6] text-[10px]">↓</kbd> to navigate, <kbd className="px-1 py-0.5 rounded bg-[#f0f0f0] border border-[#d6d6d6] text-[10px]">↵</kbd> to select
          </span>
          <span>RepoPilot Palette</span>
        </div>
      </div>
    </div>
  );
}
