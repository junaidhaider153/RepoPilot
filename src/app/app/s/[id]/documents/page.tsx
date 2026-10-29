"use client";

import React, { use } from "react";
import { useSessionContext } from "@/context/SessionContext";
import { DocumentsPanel } from "@/components/documents/DocumentsPanel";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SessionDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const { getSession } = useSessionContext();
  const session = getSession(sessionId);

  if (!session) {
    return (
      <div className="max-w-[1000px] mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-6 pb-24">
      <DocumentsPanel repoUrl={session.repoUrl} sessionId={session.id} />
    </div>
  );
}

