"use client";

import React, { use, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { TopBar } from "@/components/shell/TopBar";
import { SessionTab } from "@/components/shell/types";
import { Button } from "@/components/ui/Button";
import { AlertCircle, ArrowLeft } from "lucide-react";
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
  const { getSession, sessions } = useSessionContext();

  const [session, setSession] = useState(() => getSession(sessionId));

  // Sync session when store updates
  useEffect(() => {
    const s = getSession(sessionId);
    if (s) {
      setSession(s);
    }
  }, [sessionId, getSession, sessions]);

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

  if (!session) {
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 48px Top Bar */}
      <TopBar
        session={session}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenMobileMenu={() => {
          // Triggers mobile menu in AppShellContainer
          const mobileTrigger = document.querySelector<HTMLButtonElement>(
            '[aria-label="Open sidebar menu"]'
          );
          mobileTrigger?.click();
        }}
        onExportAll={handleExportAll}
      />

      {/* Tab Viewport */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa]">
        {children}
      </div>
    </div>
  );
}

