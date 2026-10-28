"use client";

import React, { use } from "react";
import { useSessionContext } from "@/context/SessionContext";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SessionChatPage({
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
      <div className="max-w-[768px] mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-[768px] w-full mx-auto px-4 py-6">
      <ChatPanel repoUrl={session.repoUrl} />
    </div>
  );
}

