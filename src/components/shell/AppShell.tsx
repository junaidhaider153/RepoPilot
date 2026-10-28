"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileDrawer } from "./MobileDrawer";
import { SessionItemData, SessionTab, UserProfileData } from "./types";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const INITIAL_MOCK_SESSIONS: SessionItemData[] = [
  {
    id: "s-1",
    repoUrl: "https://github.com/github/spec-kit",
    owner: "github",
    repo: "spec-kit",
    title: "Spec-Kit Core Architecture",
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "s-2",
    repoUrl: "https://github.com/vercel/next.js",
    owner: "vercel",
    repo: "next.js",
    title: "Next.js App Router Ingestion",
    pinned: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "s-3",
    repoUrl: "https://github.com/facebook/react",
    owner: "facebook",
    repo: "react",
    title: "React Fiber Reconciler",
    pinned: false,
    createdAt: new Date(Date.now() - 90000000).toISOString(),
    updatedAt: new Date(Date.now() - 90000000).toISOString(),
  },
  {
    id: "s-4",
    repoUrl: "https://github.com/tailwindlabs/tailwindcss",
    owner: "tailwindlabs",
    repo: "tailwindcss",
    title: "Tailwind CSS v4 Engine",
    pinned: false,
    createdAt: new Date(Date.now() - 300000000).toISOString(),
    updatedAt: new Date(Date.now() - 300000000).toISOString(),
  },
];

export interface AppShellProps {
  children?: React.ReactNode;
  initialSessionId?: string;
  initialTab?: SessionTab;
  user?: UserProfileData;
  className?: string;
}

export function AppShell(props: AppShellProps) {
  return (
    <ToastProvider>
      <AppShellInner {...props} />
    </ToastProvider>
  );
}

function AppShellInner({
  children,
  initialSessionId = "s-1",
  initialTab = "chat",
  user,
  className,
}: AppShellProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionItemData[]>(INITIAL_MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSessionId);
  const [activeTab, setActiveTab] = useState<SessionTab>(initialTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleNewSession = useCallback(() => {
    const newId = `s-${Date.now()}`;
    const newSession: SessionItemData = {
      id: newId,
      repoUrl: "https://github.com/octocat/Hello-World",
      owner: "octocat",
      repo: "Hello-World",
      title: "New Analysis Session",
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActiveTab("chat");
    setIsMobileMenuOpen(false);

    toast({
      title: "New Session Created",
      message: "Started exploration for octocat/Hello-World",
      type: "success",
    });
  }, [toast]);

  // Global Keyboard Shortcuts (N: new session, [: toggle sidebar)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleNewSession();
      } else if (e.key === "[") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewSession]);

  function handleRenameSession(id: string, newTitle: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    );
    toast({
      message: "Session renamed successfully",
      type: "info",
    });
  }

  function handleTogglePin(id: string) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextPinned = !s.pinned;
          toast({
            message: nextPinned ? "Session pinned to top" : "Session unpinned",
            type: "info",
          });
          return { ...s, pinned: nextPinned };
        }
        return s;
      })
    );
  }

  function handleDeleteSession(id: string) {
    const deletedSession = sessions.find((s) => s.id === id);
    if (!deletedSession) return;

    // Filter out
    setSessions((prev) => prev.filter((s) => s.id !== id));

    // If active session was deleted, select next available
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      }
    }

    // Show undo toast
    toast({
      title: "Session Deleted",
      message: `Deleted "${deletedSession.title}"`,
      type: "info",
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          setSessions((prev) => [deletedSession, ...prev]);
          setActiveSessionId(deletedSession.id);
        },
      },
    });
  }

  function handleExportAll() {
    toast({
      title: "Markdown Bundle Exported",
      message: `Exported all documents for ${activeSession?.owner}/${activeSession?.repo}`,
      type: "success",
    });
  }

  return (
    <div className={cn("flex h-screen w-screen overflow-hidden bg-[#fafafa]", className)}>
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
          }}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          onTogglePinSession={handleTogglePin}
          onDeleteSession={handleDeleteSession}
          onExportSession={handleExportAll}
          user={user}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer (visible only < 768px when opened) */}
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setIsMobileMenuOpen(false);
          }}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          onTogglePinSession={handleTogglePin}
          onDeleteSession={handleDeleteSession}
          onExportSession={handleExportAll}
          user={user}
          isCollapsed={false}
          onToggleCollapse={() => setIsMobileMenuOpen(false)}
          className="border-r-0 w-full"
        />
      </MobileDrawer>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar */}
        <TopBar
          session={activeSession}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onExportAll={handleExportAll}
        />

        {/* Dynamic Content Canvas */}
        <main
          role="main"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center scrollbar-thin"
        >
          <div
            className={cn(
              "w-full transition-all",
              activeTab === "chat" ? "max-w-[768px]" : "max-w-[1000px]"
            )}
          >
            {children ? (
              children
            ) : (
              /* Fallback view when no children passed */
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 rounded border border-[#ebebeb] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8f8f8f]">Active Session</span>
                    <span className="text-xs font-mono text-[#297a3a]">● Ready</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#171717]">{activeSession?.title}</h2>
                  <p className="text-xs text-[#666666]">
                    Repository:{" "}
                    <a
                      href={activeSession?.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#171717] underline"
                    >
                      {activeSession?.owner}/{activeSession?.repo}
                    </a>
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
                    <span className="px-2 py-1 rounded bg-[#fafafa] border border-[#ebebeb] text-[#4d4d4d]">
                      Tab: {activeTab.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 rounded bg-[#fafafa] border border-[#ebebeb] text-[#4d4d4d]">
                      Context: 25 files (Bounded)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
