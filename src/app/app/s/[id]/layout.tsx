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
import { useMobileNav } from "@/components/shell/AppShellContainer";

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
  const { openMobileMenu } = useMobileNav();
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

  // Ensure session exists on server (self-healing after process reboots)
  useEffect(() => {
    let isMounted = true;
    let clientSession = getSession(sessionId) || session;

    if (!clientSession && typeof window !== "undefined") {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("repopilot_sessions")) {
            const raw = window.localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const match = list.find((it: any) => it.id === sessionId);
                if (match) {
                  clientSession = match;
                  break;
                }
              }
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    fetch(`/api/sessions/${sessionId}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
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
              analysisResult: data.snapshot?.analysis_json || clientSession?.analysisResult,
            };
            addOrUpdateSession(extended);
            setSession(extended);
          }
          return;
        }

        // Server returned 404 (e.g. server restarted in memory mode)
        // If client already has this session from localStorage, re-register on server
        if (clientSession && clientSession.repoUrl) {
          try {
            const reRegRes = await fetch("/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: clientSession.id,
                repoUrl: clientSession.repoUrl,
                owner: clientSession.owner,
                repo: clientSession.repo,
                title: clientSession.title,
              }),
            });

            if (reRegRes.ok) {
              // Also re-cache snapshot if client has it
              if (clientSession.analysisResult) {
                await fetch("/api/repository/analyze", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    url: clientSession.repoUrl,
                    sessionId: clientSession.id,
                  }),
                }).catch(() => {});
              }
              return;
            }
          } catch {
            // Ignore
          }
        }

        if (isMounted) setHasNotFound(true);
      })
      .catch(() => {
        if (!clientSession && isMounted) setHasNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsFetchingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, session, getSession, addOrUpdateSession]);

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

  async function handleExportAll() {
    if (!session) return;

    try {
      // Fetch session chat, documents, and blueprint in parallel
      const [msgRes, docRes, bpRes] = await Promise.all([
        fetch(`/api/sessions/${session.id}/messages`).then((r) => (r.ok ? r.json() : { messages: [] })),
        fetch(`/api/sessions/${session.id}/documents`).then((r) => (r.ok ? r.json() : { documents: [] })),
        fetch(`/api/sessions/${session.id}/blueprint`).then((r) => (r.ok ? r.json() : {})) as Promise<any>,
      ]);

      const messages: any[] = msgRes?.messages || [];
      const documents: any[] = docRes?.documents || [];
      const blueprint: any = bpRes?.blueprint || {};

      let exportText = `# RepoPilot Full Session Export: ${session.title}
- **Repository:** ${session.repoUrl}
- **Owner / Repo:** ${session.owner}/${session.repo}
- **Session ID:** \`${session.id}\`
- **Exported At:** ${new Date().toISOString()}

---

## 1. Architectural Summary
`;

      if (session.analysisResult) {
        const ar = session.analysisResult;
        exportText += `\n### Purpose\n${ar.analysis?.purposeSummary || "N/A"}\n`;
        exportText += `\n### Architecture Overview\n${ar.analysis?.architectureOverview || "N/A"}\n`;
        if (ar.detectedTechnologies?.length) {
          exportText += `\n### Detected Technologies\n${ar.detectedTechnologies.map((t: string) => `- ${t}`).join("\n")}\n`;
        }
      } else {
        exportText += `\nNo cached architectural snapshot found.\n`;
      }

      exportText += `\n---\n\n## 2. Conversation & Grounded Q&A (${messages.length} messages)\n\n`;
      if (messages.length === 0) {
        exportText += `_No messages recorded in this session._\n\n`;
      } else {
        for (const m of messages) {
          const roleLabel = m.role === "user" ? "**User**" : "**Assistant (RepoPilot)**";
          exportText += `### ${roleLabel}\n\n${m.content}\n\n`;
          if (m.evidence_json && Array.isArray(m.evidence_json) && m.evidence_json.length > 0) {
            exportText += `**Evidence Citations:**\n`;
            for (const ev of m.evidence_json) {
              exportText += `- \`${ev.path}\`: ${ev.reason || ""}\n`;
            }
            exportText += `\n`;
          }
        }
      }

      exportText += `\n---\n\n## 3. Project Specifications & Documents\n\n`;
      if (documents.length === 0) {
        exportText += `_No project documents generated for this session._\n\n`;
      } else {
        const prd = documents.find((d: any) => d.kind === "prd");
        const trd = documents.find((d: any) => d.kind === "trd");
        const tdd = documents.find((d: any) => d.kind === "tdd");
        const prompt = documents.find((d: any) => d.kind === "prompt");

        if (prd) exportText += `### Product Requirements Document (PRD)\n\n${prd.content_md}\n\n`;
        if (trd) exportText += `### Technical Requirements Document (TRD)\n\n${trd.content_md}\n\n`;
        if (tdd) exportText += `### Test-Driven Development Plan (TDD)\n\n${tdd.content_md}\n\n`;
        if (prompt) exportText += `### Coding Agent Implementation Prompt\n\n\`\`\`markdown\n${prompt.content_md}\n\`\`\`\n\n`;
      }

      exportText += `\n---\n\n## 4. Innovation Blueprint\n\n`;
      if (blueprint.plan_json) {
        exportText += `### Implementation Plan: ${blueprint.plan_json.title || "Selected Opportunity"}\n\n`;
        if (blueprint.plan_json.architectureNotes) {
          exportText += `**Architecture Notes:**\n${blueprint.plan_json.architectureNotes}\n\n`;
        }
        if (blueprint.plan_json.phases && Array.isArray(blueprint.plan_json.phases)) {
          exportText += `**Phases:**\n`;
          blueprint.plan_json.phases.forEach((p: any, idx: number) => {
            exportText += `#### Phase ${idx + 1}: ${p.name || p.phaseTitle || "Execution"}\n`;
            if (p.tasks && Array.isArray(p.tasks)) {
              p.tasks.forEach((task: string) => {
                exportText += `- [ ] ${task}\n`;
              });
            }
            exportText += `\n`;
          });
        }
      } else if (blueprint.opportunities_json && blueprint.opportunities_json.length > 0) {
        exportText += `### Identified Opportunities\n\n`;
        blueprint.opportunities_json.forEach((opp: any, idx: number) => {
          exportText += `${idx + 1}. **${opp.title || opp.name}**\n   - Problem: ${opp.problem || ""}\n   - Solution: ${opp.proposedSolution || ""}\n\n`;
        });
      } else {
        exportText += `_No innovation opportunities or blueprint generated for this session._\n\n`;
      }

      const blob = new Blob([exportText], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `repopilot-${session.owner}-${session.repo}-full.md`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Ready",
        message: `Downloaded ${session.title} full session bundle as Markdown.`,
        type: "success",
      });
    } catch {
      toast({
        title: "Export Failed",
        message: "Failed to compile full session export package.",
        type: "error",
      });
    }
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
          onOpenMobileMenu={openMobileMenu}
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
