"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
import { SessionItemData, UserProfileData } from "@/components/shell/types";
import { useOptionalAuth } from "@/context/AuthContext";

export interface ExtendedSessionItem extends SessionItemData {
  analysisResult?: CompleteAnalysisResult;
}

const DEFAULT_SESSIONS: ExtendedSessionItem[] = [];

const FALLBACK_USER: UserProfileData = {
  id: "guest",
  email: "developer@example.com",
  displayName: "Developer",
};

interface SessionContextType {
  sessions: ExtendedSessionItem[];
  user: UserProfileData;
  getSession: (id: string) => ExtendedSessionItem | undefined;
  createSession: (
    repoUrl: string,
    analysisResult?: CompleteAnalysisResult,
    serverSessionId?: string,
    customTitle?: string
  ) => string;
  addOrUpdateSession: (session: ExtendedSessionItem) => void;
  updateSession: (id: string, updates: Partial<ExtendedSessionItem>) => void;
  renameSession: (id: string, newTitle: string) => void;
  togglePinSession: (id: string) => void;
  deleteSession: (id: string) => ExtendedSessionItem | undefined;
  restoreSession: (session: ExtendedSessionItem) => void;
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

function parseRepoUrl(url: string): { owner: string; repo: string } {
  try {
    const cleaned = url.trim().replace(/\/+$/, "").replace(/\.git$/, "");
    const parts = cleaned.split("/");
    const repo = parts[parts.length - 1] || "repository";
    const owner = parts[parts.length - 2] || "owner";
    return { owner, repo };
  } catch {
    return { owner: "owner", repo: "repository" };
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const auth = useOptionalAuth();
  const userId = auth?.user?.id || "guest";
  const storageKey = `repopilot_sessions_${userId}`;

  const [sessions, setSessions] = useState<ExtendedSessionItem[]>(DEFAULT_SESSIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted cache on mount or when user changes
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
        }
      } else {
        setSessions([]);
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Sync sessions to user-keyed localStorage cache
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(sessions));
    } catch {
      // Ignore storage errors (quota, etc.)
    }
  }, [sessions, isLoaded, storageKey]);

  // Hydrate sessions from server
  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && Array.isArray(data.sessions)) {
          const mapped: ExtendedSessionItem[] = data.sessions.map((s: any) => ({
            id: s.id,
            repoUrl: s.repo_url,
            owner: s.owner,
            repo: s.repo,
            title: s.title,
            pinned: s.pinned,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));

          setSessions((prev) => {
            // Keep existing in-memory analysisResult if present
            return mapped.map((m) => {
              const existing = prev.find((p) => p.id === m.id);
              return existing?.analysisResult
                ? { ...m, analysisResult: existing.analysisResult }
                : m;
            });
          });
        }
      }
    } catch {
      // Ignore network errors during background sync
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions, userId]);

  const getSession = useCallback(
    (id: string) => {
      return sessions.find((s) => s.id === id);
    },
    [sessions]
  );

  const addOrUpdateSession = useCallback((session: ExtendedSessionItem) => {
    setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
  }, []);

  const createSession = useCallback(
    (
      repoUrl: string,
      analysisResult?: CompleteAnalysisResult,
      serverSessionId?: string,
      customTitle?: string
    ): string => {
      const { owner, repo } = parseRepoUrl(repoUrl);
      const newId = serverSessionId || `s-${Date.now()}`;
      const title = customTitle || `${owner}/${repo}`;

      const newSession: ExtendedSessionItem = {
        id: newId,
        repoUrl,
        owner,
        repo,
        title,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analysisResult,
      };

      setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newId)]);
      return newId;
    },
    []
  );

  const updateSession = useCallback(
    (id: string, updates: Partial<ExtendedSessionItem>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, ...updates, updatedAt: new Date().toISOString() }
            : s
        )
      );
    },
    []
  );

  const renameSession = useCallback(
    (id: string, newTitle: string) => {
      updateSession(id, { title: newTitle.trim() });
      fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      }).catch(() => {});
    },
    [updateSession]
  );

  const togglePinSession = useCallback(
    (id: string) => {
      const current = sessions.find((s) => s.id === id);
      const nextPinned = current ? !current.pinned : true;
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, pinned: nextPinned } : s))
      );
      fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinned }),
      }).catch(() => {});
    },
    [sessions]
  );

  const deleteSession = useCallback(
    (id: string): ExtendedSessionItem | undefined => {
      const target = sessions.find((s) => s.id === id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      }).catch(() => {});
      return target;
    },
    [sessions]
  );

  const restoreSession = useCallback((session: ExtendedSessionItem) => {
    setSessions((prev) => [session, ...prev]);
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      user: auth?.user || FALLBACK_USER,
      getSession,
      createSession,
      addOrUpdateSession,
      updateSession,
      renameSession,
      togglePinSession,
      deleteSession,
      restoreSession,
      refreshSessions,
    }),
    [
      sessions,
      auth?.user,
      getSession,
      createSession,
      addOrUpdateSession,
      updateSession,
      renameSession,
      togglePinSession,
      deleteSession,
      restoreSession,
      refreshSessions,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return ctx;
}
