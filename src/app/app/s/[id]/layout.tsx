"use client";

import React, { use, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionContext, ExtendedSessionItem } from "@/context/SessionContext";
import { SessionWorkspaceProvider } from "@/context/SessionWorkspaceContext";
import { TopBar } from "@/components/shell/TopBar";
import { SessionTab } from "@/components/shell/types";
import { Button } from "@/components/ui/Button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { getSession, sessions, updateSession, addOrUpdateSession } = useSessionContext();

  const [session, setSession] = useState<ExtendedSessionItem | undefined>(() => getSession(sessionId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingSession, setIsFetchingSession] = useState(!session);
  const [hasNotFound, setHasNotFound] = useState(false);

  // Sync session when store updates
  useEffect(() => {
    const s = getSession(sessionId);
    if (s) {
      setSession(s);
      setIsFetchingSession(false);
    }
  }, [sessionId, getSession, sessions]);

  // If not found in memory, try fetching from server before showing 404
  useEffect(() => {
    if (session) return;
    let isMounted = true;

    setIsFetchingSession(true);
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data?.session) {
          const s = data.session;
          const extended: ExtendedSessionItem = {
            id: s.id,
            repoUrl: s.repo_url,
            owner: s.owner,
            repo: s.repo,
            title: s.title,
            pinned: s.pinned,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            analysisResult: data.snapshot?.analysis_json,
          };
          addOrUpdateSession(extended);
          setSession(extended);
        } else {
          setHasNotFound(true);
        }
      })
      .catch(() => {
        if (isMounted) setHasNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsFetchingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, session, addOrUpdateSession]);

  // Determine active tab from pathname
  const activeTab: SessionTab = pathname.endsWith("/overview")
    ? "overview"
    : pathname.endsWith("/documents")
    ? "documents"
    : pathname.endsWith("/blueprint")
    ? "blueprint"
    : "chat";

  function handleTabChange(tab: SessionTab) {
    if (tab === "chat") {
      router.push(`/app/s/${sessionId}`);
    } else {
      router.push(`/app/s/${sessionId}/${tab}`);
    }
  }

  async function handleRefresh() {
    if (!session || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/refresh`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Refresh failed");

      if (data.snapshot?.analysis_json) {
        updateSession(session.id, { analysisResult: data.snapshot.analysis_json });
      }

      toast({
        title: "Repository Refreshed",
        message: "Fetched latest files from GitHub and updated architectural snapshot.",
        type: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Refresh Error",
        message: err instanceof Error ? err.message : "Failed to refresh repository.",
        type: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleExportAll() {
    if (!session) return;
    const exportText = `# RepoPilot Full Session Export: ${session.title}
Repository: ${session.repoUrl}
Session ID: ${session.id}
Exported At: ${new Date().toISOString()}

---
(Evidence-grounded analysis exported from RepoPilot)
`;
    const blob = new Blob([exportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repopilot-${session.owner}-${session.repo}-full.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Ready",
      message: `Downloaded ${session.title} package as Markdown.`,
      type: "success",
    });
  }

  if (isFetchingSession && !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#171717]" />
        <p className="text-xs font-mono text-[#666666]">Loading session workspace...</p>
      </div>
    );
  }

  if (!session || hasNotFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 rounded-full bg-[#fef2f2] text-[#dc2626]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#171717]">Session Not Found</h2>
          <p className="text-xs text-[#666666] max-w-sm">
            The session you requested does not exist or may have been deleted.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/app")}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Return to Workspace</span>
        </Button>
      </div>
    );
  }

  return (
    <SessionWorkspaceProvider sessionId={session.id} repoUrl={session.repoUrl}>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 48px Top Bar */}
        <TopBar
          session={session}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenMobileMenu={() => {
            const mobileTrigger = document.querySelector<HTMLButtonElement>(
              '[aria-label="Open sidebar menu"]'
            );
            mobileTrigger?.click();
          }}
          onExportAll={handleExportAll}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Tab Viewport */}
        <div className="flex-1 overflow-y-auto bg-[#fafafa]">
          {children}
        </div>
      </div>
    </SessionWorkspaceProvider>
  );
}
