"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";
import { SessionItemData, UserProfileData } from "@/components/shell/types";

export interface ExtendedSessionItem extends SessionItemData {
  analysisResult?: CompleteAnalysisResult;
}

const STORAGE_KEY = "repopilot_sessions_v1";

const DEFAULT_SESSIONS: ExtendedSessionItem[] = [
  {
    id: "s-1",
    repoUrl: "https://github.com/github/spec-kit",
    owner: "github",
    repo: "spec-kit",
    title: "Spec-Kit Core Architecture",
    pinned: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "s-2",
    repoUrl: "https://github.com/facebook/react",
    owner: "facebook",
    repo: "react",
    title: "React Concurrent Runtime",
    pinned: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const DEFAULT_USER: UserProfileData = {
  id: "u-1",
  email: "developer@example.com",
  displayName: "Dev Lead",
};

interface SessionContextType {
  sessions: ExtendedSessionItem[];
  user: UserProfileData;
  getSession: (id: string) => ExtendedSessionItem | undefined;
  createSession: (repoUrl: string, analysisResult?: CompleteAnalysisResult) => string;
  updateSession: (id: string, updates: Partial<ExtendedSessionItem>) => void;
  renameSession: (id: string, newTitle: string) => void;
  togglePinSession: (id: string) => void;
  deleteSession: (id: string) => ExtendedSessionItem | undefined;
  restoreSession: (session: ExtendedSessionItem) => void;
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
  const [sessions, setSessions] = useState<ExtendedSessionItem[]>(DEFAULT_SESSIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted sessions on client mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync sessions to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Ignore storage errors (quota, etc.)
    }
  }, [sessions, isLoaded]);

  const getSession = useCallback(
    (id: string) => {
      return sessions.find((s) => s.id === id);
    },
    [sessions]
  );

  const createSession = useCallback(
    (repoUrl: string, analysisResult?: CompleteAnalysisResult): string => {
      const { owner, repo } = parseRepoUrl(repoUrl);
      const newId = `s-${Date.now()}`;
      const title = `${owner}/${repo}`;

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

      setSessions((prev) => [newSession, ...prev]);
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
    },
    [updateSession]
  );

  const togglePinSession = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  }, []);

  const deleteSession = useCallback(
    (id: string): ExtendedSessionItem | undefined => {
      const target = sessions.find((s) => s.id === id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
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
      user: DEFAULT_USER,
      getSession,
      createSession,
      updateSession,
      renameSession,
      togglePinSession,
      deleteSession,
      restoreSession,
    }),
    [
      sessions,
      getSession,
      createSession,
      updateSession,
      renameSession,
      togglePinSession,
      deleteSession,
      restoreSession,
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
