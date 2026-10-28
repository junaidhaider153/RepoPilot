import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  insertSessionMessage,
  upsertSessionDocument,
  upsertSessionBlueprint,
  upsertRepoSnapshot,
  getUserSessions,
  insertSession,
} from "@/lib/persistence/store";

// Mock Supabase modules
let mockSupabaseInsert: any;
let mockSupabaseUpsert: any;
let mockSupabaseSelect: any;
let mockSupabaseSingle: any;

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => ({
      insert: (...args: any[]) => mockSupabaseInsert(table, ...args),
      upsert: (...args: any[]) => mockSupabaseUpsert(table, ...args),
      select: (...args: any[]) => mockSupabaseSelect(table, ...args),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: () => mockSupabaseSingle(table),
    }),
  }),
}));

describe("Group 3 Regression Tests: Honest Persistence & ID Generation (L-02, L-04)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    mockSupabaseInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: "11111111-1111-4111-8111-111111111111" }, error: null }),
      }),
    });

    mockSupabaseUpsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: "22222222-2222-4222-8222-222222222222" }, error: null }),
      }),
    });

    mockSupabaseSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: () => Promise.resolve({ data: null, error: null }),
    });

    mockSupabaseSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  });

  describe("L-02: Database-Generated UUIDs (No invalid msg-* or doc-* IDs passed to Postgres)", () => {
    it("omits manual non-UUID id when inserting messages to Supabase", async () => {
      await insertSessionMessage("sess-1", {
        role: "user",
        content: "Hello RepoPilot",
      });

      expect(mockSupabaseInsert).toHaveBeenCalled();
      const [table, payload] = mockSupabaseInsert.mock.calls[0];
      expect(table).toBe("messages");
      // Must NOT send string like 'msg-1730...' to UUID primary key
      expect(payload.id).toBeUndefined();
    });

    it("omits manual non-UUID id when upserting documents to Supabase", async () => {
      await upsertSessionDocument("sess-1", {
        kind: "prd",
        contentMd: "# Test PRD",
      });

      expect(mockSupabaseInsert).toHaveBeenCalled();
      const [table, payload] = mockSupabaseInsert.mock.calls[0];
      expect(table).toBe("documents");
      expect(payload.id).toBeUndefined();
    });

    it("omits manual non-UUID id when upserting blueprints to Supabase", async () => {
      await upsertSessionBlueprint("sess-1", {
        opportunities: [],
        selectedIndex: 0,
      });

      expect(mockSupabaseUpsert).toHaveBeenCalled();
      const [table, payload] = mockSupabaseUpsert.mock.calls[0];
      expect(table).toBe("blueprints");
      expect(payload.id).toBeUndefined();
    });

    it("omits manual non-UUID id when upserting repo snapshots to Supabase", async () => {
      await upsertRepoSnapshot("sess-1", {
        defaultBranch: "main",
        selectedPaths: [],
        analysisResult: {
          repository: { owner: "octocat", name: "Hello-World" },
          analyzedFiles: [],
          detectedTechnologies: [],
          coverageNotes: [],
        } as any,
        coverageNotes: [],
      });

      expect(mockSupabaseUpsert).toHaveBeenCalled();
      const [table, payload] = mockSupabaseUpsert.mock.calls[0];
      expect(table).toBe("repo_snapshots");
      expect(payload.id).toBeUndefined();
    });
  });

  describe("L-04: No Silent Fallback to In-Memory Map on Database Error", () => {
    it("throws real error when Supabase fails on insertSessionMessage instead of falling through to memory", async () => {
      const dbError = new Error("Database connection terminated (Postgres error 57P01)");
      mockSupabaseInsert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: dbError }),
        }),
      });

      // Must throw or reject with the database error, NOT silently return a fallback object
      await expect(
        insertSessionMessage("sess-error-test", {
          role: "user",
          content: "Will this fail honestly?",
        })
      ).rejects.toThrow(/Database connection terminated/i);
    });

    it("throws real error when Supabase fails on insertSession", async () => {
      const dbError = new Error("duplicate key value violates unique constraint 'sessions_pkey'");
      mockSupabaseInsert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: dbError }),
        }),
      });

      await expect(
        insertSession("user-1", {
          id: "s-dup",
          repoUrl: "https://github.com/test/dup",
          owner: "test",
          repo: "dup",
          title: "Duplicate",
        })
      ).rejects.toThrow(/violates unique constraint/i);
    });

    it("throws real error when Supabase fails on getUserSessions", async () => {
      const dbError = new Error("permission denied for table sessions (RLS)");
      mockSupabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
        }),
      });

      await expect(getUserSessions("user-blocked")).rejects.toThrow(/permission denied/i);
    });
  });
});

