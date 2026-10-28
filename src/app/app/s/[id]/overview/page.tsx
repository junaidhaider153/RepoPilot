"use client";

import React, { use, useState, useEffect } from "react";
import { useSessionContext } from "@/context/SessionContext";
import { OverviewPanel } from "@/components/analysis/OverviewPanel";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
import { Skeleton } from "@/components/ui/Skeleton";
import { Loader2, AlertCircle } from "lucide-react";

export default function SessionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const { getSession, updateSession } = useSessionContext();
  const session = getSession(sessionId);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If analysisResult is not yet cached in session, fetch it automatically
  useEffect(() => {
    if (!session || session.analysisResult || isLoading || error) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch("/api/repository/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.repoUrl }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Failed to load repository overview.");
        }
        return res.json();
      })
      .then((data: CompleteAnalysisResult) => {
        if (isMounted) {
          updateSession(session.id, { analysisResult: data });
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load repository overview.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session, updateSession, isLoading, error]);

  if (!session) {
    return (
      <div className="max-w-[1000px] mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto p-12 text-center space-y-3 font-mono text-xs text-[#666666]">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#171717]" />
        <p>Synthesizing repository architectural overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1000px] mx-auto p-6">
        <div className="p-4 rounded border border-[#fecaca] bg-[#fef2f2] text-xs text-[#991b1b] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626] mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to Load Overview</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session.analysisResult) {
    return (
      <div className="max-w-[1000px] mx-auto p-12 text-center space-y-3 font-mono text-xs text-[#666666]">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#171717]" />
        <p>Synthesizing repository architectural overview...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-6">
      <OverviewPanel data={session.analysisResult} />
    </div>
  );
}
