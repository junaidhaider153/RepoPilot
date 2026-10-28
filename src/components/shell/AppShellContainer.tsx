"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { useSessionContext } from "@/context/SessionContext";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const {
    sessions,
    user,
    createSession,
    renameSession,
    togglePinSession,
    deleteSession,
    restoreSession,
  } = useSessionContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Extract active session ID from URL path: /app/s/[id]...
  const sessionMatch = pathname.match(/^\/app\/s\/([^/]+)/);
  const activeSessionId = sessionMatch ? sessionMatch[1] : undefined;

  const handleSelectSession = useCallback(
    (id: string) => {
      router.push(`/app/s/${id}`);
    },
    [router]
  );

  const handleNewSession = useCallback(() => {
    router.push("/app");
    setIsMobileMenuOpen(false);
  }, [router]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      const deleted = deleteSession(id);
      if (deleted) {
        toast({
          title: "Session Deleted",
          message: `Removed ${deleted.owner}/${deleted.repo}`,
          type: "info",
          action: {
            label: "Undo",
            onClick: () => {
              restoreSession(deleted);
              toast({
                title: "Restored",
                message: `Restored ${deleted.title}`,
                type: "success",
              });
            },
          },
        });

        // If user deleted the active session, navigate to /app
        if (activeSessionId === id) {
          router.push("/app");
        }
      }
    },
    [deleteSession, restoreSession, activeSessionId, router, toast]
  );

  const handleExportSession = useCallback(
    (id: string) => {
      const target = sessions.find((s) => s.id === id);
      if (!target) return;

      const exportText = `# RepoPilot Session Export: ${target.title}
Repository: ${target.repoUrl}
Session ID: ${target.id}
Exported At: ${new Date().toISOString()}

---
(Evidence-grounded analysis exported from RepoPilot)
`;
      const blob = new Blob([exportText], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `repopilot-${target.owner}-${target.repo}-session.md`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Ready",
        message: `Downloaded ${target.title} as Markdown.`,
        type: "success",
      });
    },
    [sessions, toast]
  );

  // Keyboard shortcut listener (N: new session, [: toggle sidebar)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafafa] text-[#171717] font-sans">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onRenameSession={renameSession}
          onTogglePinSession={togglePinSession}
          onDeleteSession={handleDeleteSession}
          onExportSession={handleExportSession}
          user={user}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id: string) => {
            handleSelectSession(id);
            setIsMobileMenuOpen(false);
          }}
          onNewSession={handleNewSession}
          onRenameSession={renameSession}
          onTogglePinSession={togglePinSession}
          onDeleteSession={handleDeleteSession}
          onExportSession={handleExportSession}
          user={user}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      </MobileDrawer>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}

export function AppShellContainer({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppShellInner>{children}</AppShellInner>
    </ToastProvider>
  );
}
