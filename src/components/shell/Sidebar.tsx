"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  Pin,
  PinOff,
  MoreHorizontal,
  Edit2,
  Trash2,
  Download,
  BookOpen,
  Settings,
  LogOut,
  User,
  Keyboard,
  GitBranch,
} from "lucide-react";
import { SessionItemData, UserProfileData } from "./types";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  sessions: SessionItemData[];
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onExportSession: (id: string) => void;
  user?: UserProfileData;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut?: () => void;
  className?: string;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onTogglePinSession,
  onDeleteSession,
  onExportSession,
  user = {
    id: "user-1",
    displayName: "Developer",
    email: "dev@repopilot.local",
  },
  isCollapsed,
  onToggleCollapse,
  onSignOut,
  className,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Grouping logic: Pinned, Today, Yesterday, Previous 7 days, Older
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.repo.toLowerCase().includes(q) ||
        s.owner.toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  const { pinned, today, yesterday, last7Days, older } = useMemo(() => {
    const pinnedList: SessionItemData[] = [];
    const todayList: SessionItemData[] = [];
    const yesterdayList: SessionItemData[] = [];
    const last7DaysList: SessionItemData[] = [];
    const olderList: SessionItemData[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7DaysStart = todayStart - 6 * 86400000;

    for (const session of filteredSessions) {
      if (session.pinned) {
        pinnedList.push(session);
        continue;
      }

      const updated = new Date(session.updatedAt).getTime();
      if (updated >= todayStart) {
        todayList.push(session);
      } else if (updated >= yesterdayStart) {
        yesterdayList.push(session);
      } else if (updated >= last7DaysStart) {
        last7DaysList.push(session);
      } else {
        olderList.push(session);
      }
    }

    return {
      pinned: pinnedList,
      today: todayList,
      yesterday: yesterdayList,
      last7Days: last7DaysList,
      older: olderList,
    };
  }, [filteredSessions]);

  function startRename(s: SessionItemData) {
    setEditingSessionId(s.id);
    setEditTitle(s.title);
  }

  function commitRename(id: string) {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  }

  const initials = (user.displayName || "D")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={cn(
        "h-full bg-white border-r border-[#ebebeb] flex flex-col justify-between transition-all duration-200 select-none z-20",
        isCollapsed ? "w-14 min-w-[56px]" : "w-[260px] min-w-[260px]",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-col">
        {/* Wordmark and Collapse toggle */}
        <div className="h-12 border-b border-[#ebebeb] px-3 flex items-center justify-between">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-tight text-[#171717]">
                  ▲ RepoPilot
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border border-[#ebebeb] bg-[#fafafa] text-[#666666]">
                  beta
                </span>
              </div>
              <button
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar (shortcut [)"
                title="Collapse sidebar ([)"
                className="p-1 text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#171717]"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar (shortcut [)"
              title="Expand sidebar ([)"
              className="w-full flex items-center justify-center p-1 text-[#171717] hover:bg-[#fafafa] rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#171717]"
            >
              <span className="font-mono font-bold text-sm">▲</span>
            </button>
          )}
        </div>

        {/* Action Buttons: New Session */}
        <div className="p-2 border-b border-[#ebebeb]">
          {!isCollapsed ? (
            <button
              onClick={onNewSession}
              aria-label="New session (shortcut N)"
              className="w-full h-8 px-3 rounded bg-[#171717] hover:bg-black text-white text-xs font-medium flex items-center justify-between transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#171717]"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>New Session</span>
              </span>
              <kbd className="text-[10px] font-mono text-[#8f8f8f] bg-white/10 px-1 rounded">N</kbd>
            </button>
          ) : (
            <button
              onClick={onNewSession}
              aria-label="New session (N)"
              title="New session (N)"
              className="w-full h-8 rounded bg-[#171717] hover:bg-black text-white flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Search Box */}
          {!isCollapsed && (
            <div className="relative mt-2">
              <Search className="w-3 h-3 text-[#8f8f8f] absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="w-full text-xs font-mono pl-7 pr-2 py-1.5 bg-[#fafafa] border border-[#ebebeb] rounded text-[#171717] placeholder-[#a8a8a8] focus:outline-none focus:border-[#171717] transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* Middle Scrollable Session List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs font-mono">
        {isCollapsed ? (
          /* Collapsed Icon Rail */
          <div className="flex flex-col items-center gap-2">
            {sessions.slice(0, 10).map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                title={`${s.owner}/${s.repo}: ${s.title}`}
                className={cn(
                  "w-8 h-8 rounded flex items-center justify-center transition-colors relative",
                  activeSessionId === s.id
                    ? "bg-[#171717] text-white font-bold"
                    : "text-[#666666] hover:bg-[#fafafa] hover:text-[#171717]"
                )}
              >
                <GitBranch className="w-3.5 h-3.5" />
                {s.pinned && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#171717] rounded-full" />
                )}
              </button>
            ))}
          </div>
        ) : (
          /* Expanded Session Tree */
          <>
            {filteredSessions.length === 0 ? (
              <p className="text-[11px] text-[#8f8f8f] text-center py-4">No sessions found</p>
            ) : (
              <>
                {/* Pinned Group */}
                {pinned.length > 0 && (
                  <SessionGroup
                    title="Pinned"
                    icon={<Pin className="w-3 h-3" />}
                    sessions={pinned}
                    activeSessionId={activeSessionId}
                    editingSessionId={editingSessionId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onCommitRename={commitRename}
                    onStartRename={startRename}
                    onSelect={onSelectSession}
                    onTogglePin={onTogglePinSession}
                    onDelete={onDeleteSession}
                    onExport={onExportSession}
                  />
                )}

                {/* Today */}
                {today.length > 0 && (
                  <SessionGroup
                    title="Today"
                    sessions={today}
                    activeSessionId={activeSessionId}
                    editingSessionId={editingSessionId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onCommitRename={commitRename}
                    onStartRename={startRename}
                    onSelect={onSelectSession}
                    onTogglePin={onTogglePinSession}
                    onDelete={onDeleteSession}
                    onExport={onExportSession}
                  />
                )}

                {/* Yesterday */}
                {yesterday.length > 0 && (
                  <SessionGroup
                    title="Yesterday"
                    sessions={yesterday}
                    activeSessionId={activeSessionId}
                    editingSessionId={editingSessionId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onCommitRename={commitRename}
                    onStartRename={startRename}
                    onSelect={onSelectSession}
                    onTogglePin={onTogglePinSession}
                    onDelete={onDeleteSession}
                    onExport={onExportSession}
                  />
                )}

                {/* Previous 7 Days */}
                {last7Days.length > 0 && (
                  <SessionGroup
                    title="Previous 7 Days"
                    sessions={last7Days}
                    activeSessionId={activeSessionId}
                    editingSessionId={editingSessionId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onCommitRename={commitRename}
                    onStartRename={startRename}
                    onSelect={onSelectSession}
                    onTogglePin={onTogglePinSession}
                    onDelete={onDeleteSession}
                    onExport={onExportSession}
                  />
                )}

                {/* Older */}
                {older.length > 0 && (
                  <SessionGroup
                    title="Older"
                    sessions={older}
                    activeSessionId={activeSessionId}
                    editingSessionId={editingSessionId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onCommitRename={commitRename}
                    onStartRename={startRename}
                    onSelect={onSelectSession}
                    onTogglePin={onTogglePinSession}
                    onDelete={onDeleteSession}
                    onExport={onExportSession}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Footer: Library, Settings & User Menu */}
      <div className="border-t border-[#ebebeb] p-2 space-y-1">
        {/* Navigation links */}
        {!isCollapsed ? (
          <>
            <a
              href="#library"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Library</span>
            </a>
            <Link
              href="/app/settings"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <a
              href="#library"
              title="Library"
              className="p-1.5 rounded text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
            </a>
            <Link
              href="/app/settings"
              title="Settings"
              className="p-1.5 rounded text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* User Menu */}
        <div className="pt-1 border-t border-[#ebebeb]/60">
          <Dropdown
            align="left"
            width="w-56"
            trigger={
              <button
                aria-label="User Account Menu"
                className={cn(
                  "w-full flex items-center gap-2 p-1.5 rounded hover:bg-[#fafafa] transition-colors text-left focus:outline-none focus:ring-1 focus:ring-[#171717]",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <div className="w-7 h-7 rounded-full bg-[#171717] text-white text-[11px] font-mono font-medium flex items-center justify-center shrink-0">
                  {initials}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#171717] truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-[#8f8f8f] truncate font-mono">
                      {user.email}
                    </p>
                  </div>
                )}
              </button>
            }
            items={[
              {
                id: "profile",
                label: "Profile Settings",
                icon: <User className="w-3.5 h-3.5" />,
                onClick: () => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/app/settings";
                  }
                },
              },
              {
                id: "settings",
                label: "Account Preferences",
                icon: <Settings className="w-3.5 h-3.5" />,
                onClick: () => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/app/settings/account";
                  }
                },
              },
              {
                id: "shortcuts",
                label: "Keyboard Shortcuts",
                icon: <Keyboard className="w-3.5 h-3.5" />,
                shortcut: "Ctrl+K",
                onClick: () => {},
              },
              "divider",
              {
                id: "logout",
                label: "Log out",
                icon: <LogOut className="w-3.5 h-3.5" />,
                danger: true,
                onClick: () => {
                  onSignOut?.();
                },
              },
            ]}
          />
        </div>
      </div>
    </aside>
  );
}

// Sub-component for session groups
interface SessionGroupProps {
  title: string;
  icon?: React.ReactNode;
  sessions: SessionItemData[];
  activeSessionId?: string;
  editingSessionId: string | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onCommitRename: (id: string) => void;
  onStartRename: (s: SessionItemData) => void;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

function SessionGroup({
  title,
  icon,
  sessions,
  activeSessionId,
  editingSessionId,
  editTitle,
  setEditTitle,
  onCommitRename,
  onStartRename,
  onSelect,
  onTogglePin,
  onDelete,
  onExport,
}: SessionGroupProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 px-2 text-[10px] font-mono uppercase text-[#8f8f8f] tracking-wider">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-0.5">
        {sessions.map((s) => {
          const isActive = activeSessionId === s.id;
          const isEditing = editingSessionId === s.id;

          return (
            <div
              key={s.id}
              className={cn(
                "group relative flex items-center justify-between rounded px-2 py-1.5 transition-colors cursor-pointer border-l-2",
                isActive
                  ? "bg-[#fafafa] border-[#171717] font-semibold text-[#171717]"
                  : "border-transparent text-[#4d4d4d] hover:bg-[#fafafa] hover:text-[#171717]"
              )}
              onClick={() => !isEditing && onSelect(s.id)}
            >
              <div className="flex-1 min-w-0 pr-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onCommitRename(s.id);
                      if (e.key === "Escape") onCommitRename(s.id);
                    }}
                    onBlur={() => onCommitRename(s.id)}
                    autoFocus
                    className="w-full text-xs font-mono px-1 py-0.5 border border-[#171717] bg-white rounded outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <p className="text-[10px] text-[#8f8f8f] truncate font-mono">
                      {s.owner}/{s.repo}
                    </p>
                    <p className="text-xs truncate font-sans font-normal leading-snug">
                      {s.title}
                    </p>
                  </>
                )}
              </div>

              {/* Actions dropdown button */}
              {!isEditing && (
                <div
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown
                    align="right"
                    width="w-40"
                    trigger={
                      <button
                        aria-label={`Session options for ${s.title}`}
                        className="p-1 text-[#666666] hover:text-[#171717] rounded hover:bg-[#ebebeb] transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    }
                    items={[
                      {
                        id: "rename",
                        label: "Rename",
                        icon: <Edit2 className="w-3 h-3" />,
                        onClick: () => onStartRename(s),
                      },
                      {
                        id: "pin",
                        label: s.pinned ? "Unpin" : "Pin to top",
                        icon: s.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />,
                        onClick: () => onTogglePin(s.id),
                      },
                      {
                        id: "export",
                        label: "Export Markdown",
                        icon: <Download className="w-3 h-3" />,
                        onClick: () => onExport(s.id),
                      },
                      "divider",
                      {
                        id: "delete",
                        label: "Delete Session",
                        icon: <Trash2 className="w-3 h-3" />,
                        danger: true,
                        onClick: () => onDelete(s.id),
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

