import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DbSession,
  DbRepoSnapshot,
  DbMessage,
  DbDocument,
  DbBlueprint,
} from "./types";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";

// In-memory fallback stores for offline/mock development and tests
const memorySessions = new Map<string, DbSession>();
const memorySnapshots = new Map<string, DbRepoSnapshot>();
const memoryMessages = new Map<string, DbMessage[]>();
const memoryDocuments = new Map<string, DbDocument[]>();
const memoryBlueprints = new Map<string, DbBlueprint>();

// Seed sample sessions in fallback memory store
const nowIso = new Date().toISOString();
memorySessions.set("s-1", {
  id: "s-1",
  user_id: "u-demo-1",
  repo_url: "https://github.com/github/spec-kit",
  owner: "github",
  repo: "spec-kit",
  title: "Spec-Kit Core Architecture",
  pinned: true,
  created_at: nowIso,
  updated_at: nowIso,
});

memorySessions.set("s-2", {
  id: "s-2",
  user_id: "u-demo-1",
  repo_url: "https://github.com/facebook/react",
  owner: "facebook",
  repo: "react",
  title: "React Concurrent Runtime",
  pinned: false,
  created_at: nowIso,
  updated_at: nowIso,
});

export async function getUserSessions(userId: string): Promise<DbSession[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data as DbSession[]) || [];
    } catch {
      // Fall through to memory store on network error
    }
  }

  // Fallback store
  return Array.from(memorySessions.values())
    .filter((s) => s.user_id === userId || userId === "u-demo-1")
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
}

export async function getSessionById(
  userId: string,
  sessionId: string
): Promise<DbSession | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (error) return null;
      return data as DbSession;
    } catch {
      // Fall through to memory store
    }
  }

  const s = memorySessions.get(sessionId);
  if (!s) return null;
  if (s.user_id !== userId && userId !== "u-demo-1") return null;
  return s;
}

export async function insertSession(
  userId: string,
  params: {
    id: string;
    repoUrl: string;
    owner: string;
    repo: string;
    title: string;
  }
): Promise<DbSession> {
  const newSession: DbSession = {
    id: params.id,
    user_id: userId,
    repo_url: params.repoUrl,
    owner: params.owner,
    repo: params.repo,
    title: params.title,
    pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("sessions")
        .insert(newSession)
        .select()
        .single();

      if (error) throw error;
      return data as DbSession;
    } catch {
      // Fall through to memory store
    }
  }

  memorySessions.set(newSession.id, newSession);
  return newSession;
}

export async function updateSessionData(
  userId: string,
  sessionId: string,
  updates: Partial<Pick<DbSession, "title" | "pinned">>
): Promise<DbSession | null> {
  const updatedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("sessions")
        .update({ ...updates, updated_at: updatedAt })
        .eq("id", sessionId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) return null;
      return data as DbSession;
    } catch {
      // Fall through to memory store
    }
  }

  const existing = memorySessions.get(sessionId);
  if (!existing) return null;
  const updated: DbSession = {
    ...existing,
    ...updates,
    updated_at: updatedAt,
  };
  memorySessions.set(sessionId, updated);
  return updated;
}

export async function deleteSessionData(
  userId: string,
  sessionId: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", userId);

      if (error) return false;
      return true;
    } catch {
      // Fall through to memory store
    }
  }

  const existing = memorySessions.get(sessionId);
  if (!existing) return false;
  memorySessions.delete(sessionId);
  memorySnapshots.delete(sessionId);
  memoryMessages.delete(sessionId);
  memoryDocuments.delete(sessionId);
  memoryBlueprints.delete(sessionId);
  return true;
}

// ---------------- Repo Snapshots ----------------

export async function getRepoSnapshot(sessionId: string): Promise<DbRepoSnapshot | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("repo_snapshots")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (error) return null;
      return data as DbRepoSnapshot;
    } catch {
      // Fall through
    }
  }

  return memorySnapshots.get(sessionId) || null;
}

export async function upsertRepoSnapshot(
  sessionId: string,
  snapshot: {
    defaultBranch: string;
    selectedPaths: string[];
    analysisResult: CompleteAnalysisResult;
    coverageNotes: string[];
  }
): Promise<DbRepoSnapshot> {
  const record: DbRepoSnapshot = {
    id: `snap-${Date.now()}`,
    session_id: sessionId,
    default_branch: snapshot.defaultBranch,
    selected_paths: snapshot.selectedPaths,
    analysis_json: snapshot.analysisResult,
    coverage_notes: snapshot.coverageNotes,
    fetched_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("repo_snapshots")
        .upsert(
          {
            session_id: sessionId,
            default_branch: record.default_branch,
            selected_paths: record.selected_paths,
            analysis_json: record.analysis_json,
            coverage_notes: record.coverage_notes,
            fetched_at: record.fetched_at,
          },
          { onConflict: "session_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as DbRepoSnapshot;
    } catch {
      // Fall through
    }
  }

  memorySnapshots.set(sessionId, record);
  return record;
}

// ---------------- Messages ----------------

export async function getSessionMessages(sessionId: string): Promise<DbMessage[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) return [];
      return (data as DbMessage[]) || [];
    } catch {
      // Fall through
    }
  }

  return memoryMessages.get(sessionId) || [];
}

export async function insertSessionMessage(
  sessionId: string,
  message: {
    role: "user" | "assistant";
    content: string;
    evidence?: unknown[];
    confidence?: string;
  }
): Promise<DbMessage> {
  const newMsg: DbMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    session_id: sessionId,
    role: message.role,
    content: message.content,
    evidence_json: (message.evidence || []) as any,
    confidence: message.confidence || "medium",
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("messages")
        .insert(newMsg)
        .select()
        .single();

      if (error) throw error;
      return data as DbMessage;
    } catch {
      // Fall through
    }
  }

  const existing = memoryMessages.get(sessionId) || [];
  existing.push(newMsg);
  memoryMessages.set(sessionId, existing);
  return newMsg;
}

// ---------------- Documents ----------------

export async function getSessionDocuments(sessionId: string): Promise<DbDocument[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("session_id", sessionId);

      if (error) return [];
      return (data as DbDocument[]) || [];
    } catch {
      // Fall through
    }
  }

  return memoryDocuments.get(sessionId) || [];
}

export async function upsertSessionDocument(
  sessionId: string,
  doc: {
    kind: "prd" | "trd" | "tdd" | "prompt" | "all";
    contentMd: string;
    version?: number;
  }
): Promise<DbDocument> {
  const newDoc: DbDocument = {
    id: `doc-${Date.now()}`,
    session_id: sessionId,
    kind: doc.kind,
    content_md: doc.contentMd,
    version: doc.version || 1,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("documents")
        .insert(newDoc)
        .select()
        .single();

      if (error) throw error;
      return data as DbDocument;
    } catch {
      // Fall through
    }
  }

  const existing = memoryDocuments.get(sessionId) || [];
  const filtered = existing.filter((d) => d.kind !== doc.kind);
  filtered.push(newDoc);
  memoryDocuments.set(sessionId, filtered);
  return newDoc;
}

// ---------------- Blueprints ----------------

export async function getSessionBlueprint(sessionId: string): Promise<DbBlueprint | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("blueprints")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (error) return null;
      return data as DbBlueprint;
    } catch {
      // Fall through
    }
  }

  return memoryBlueprints.get(sessionId) || null;
}

export async function upsertSessionBlueprint(
  sessionId: string,
  blueprint: {
    opportunities: unknown[];
    selectedIndex: number;
    planJson?: unknown;
  }
): Promise<DbBlueprint> {
  const record: DbBlueprint = {
    id: `bp-${Date.now()}`,
    session_id: sessionId,
    opportunities_json: blueprint.opportunities,
    selected_index: blueprint.selectedIndex,
    plan_json: blueprint.planJson || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("blueprints")
        .upsert(
          {
            session_id: sessionId,
            opportunities_json: record.opportunities_json,
            selected_index: record.selected_index,
            plan_json: record.plan_json,
            created_at: record.created_at,
          },
          { onConflict: "session_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as DbBlueprint;
    } catch {
      // Fall through
    }
  }

  memoryBlueprints.set(sessionId, record);
  return record;
}

