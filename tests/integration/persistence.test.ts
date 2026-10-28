import { describe, it, expect, beforeEach } from "vitest";
import {
  getUserSessions,
  getSessionById,
  insertSession,
  updateSessionData,
  deleteSessionData,
  upsertRepoSnapshot,
  getRepoSnapshot,
  insertSessionMessage,
  getSessionMessages,
  upsertSessionDocument,
  getSessionDocuments,
  upsertSessionBlueprint,
  getSessionBlueprint,
} from "@/lib/persistence/store";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { CompleteAnalysisResult } from "@/lib/analysis/analyze-repository";

const mockAnalysis: CompleteAnalysisResult = {
  repository: {
    name: "spec-kit",
    fullName: "github/spec-kit",
    defaultBranch: "main",
    description: "Specification toolkit",
    starsCount: 1500,
    forksCount: 200,
    openIssuesCount: 10,
    htmlUrl: "https://github.com/github/spec-kit",
  },
  analysis: {
    repositoryName: "github/spec-kit",
    description: "Specification toolkit",
    detectedTechnologies: ["TypeScript", "Node.js"],
    purposeSummary: "Toolkit for specification-driven development.",
    architectureOverview: "Modular CLI and TypeScript library.",
    keyComponents: [],
    observedFacts: [],
    inferences: [],
    unknowns: [],
  },
  detectedTechnologies: ["TypeScript", "Node.js"],
  analyzedFiles: [
    {
      path: "src/index.ts",
      category: "entrypoint",
      sizeBytes: 1024,
    },
  ],
  coverageNotes: ["Analyzed 1 core file."],
  aiDisclosure: {
    providerName: "Gemma",
    model: "gemini-flash-lite-latest",
    configured: true,
  },
};

describe("Module 12 - Persistence & Row-Level Security Isolation", () => {
  const testUserId = `user-${Date.now()}`;
  const otherUserId = `other-user-${Date.now()}`;
  const testSessionId = `session-test-${Date.now()}`;

  it("inserts and retrieves session scoped to owner", async () => {
    const session = await insertSession(testUserId, {
      id: testSessionId,
      repoUrl: "https://github.com/github/spec-kit",
      owner: "github",
      repo: "spec-kit",
      title: "github/spec-kit",
    });

    expect(session.id).toBe(testSessionId);
    expect(session.user_id).toBe(testUserId);

    // Owner can retrieve
    const retrieved = await getSessionById(testUserId, testSessionId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe("github/spec-kit");

    // Another user cannot retrieve by guessing ID (Row-Level Security isolation)
    const unauthorized = await getSessionById(otherUserId, testSessionId);
    expect(unauthorized).toBeNull();
  });

  it("updates session title and pin status", async () => {
    const updated = await updateSessionData(testUserId, testSessionId, {
      title: "Updated Toolkit Title",
      pinned: true,
    });

    expect(updated?.title).toBe("Updated Toolkit Title");
    expect(updated?.pinned).toBe(true);

    const check = await getSessionById(testUserId, testSessionId);
    expect(check?.pinned).toBe(true);
  });

  it("persists repository snapshots to avoid redundant re-ingestion", async () => {
    const snapshot = await upsertRepoSnapshot(testSessionId, {
      defaultBranch: "main",
      selectedPaths: ["src/index.ts"],
      analysisResult: mockAnalysis,
      coverageNotes: ["Analyzed 1 core file."],
    });

    expect(snapshot.session_id).toBe(testSessionId);
    expect(snapshot.selected_paths).toContain("src/index.ts");

    const cached = await getRepoSnapshot(testSessionId);
    expect(cached).not.toBeNull();
    expect(cached?.analysis_json.analysis.purposeSummary).toBe(
      "Toolkit for specification-driven development."
    );
  });

  it("persists chat message thread", async () => {
    await insertSessionMessage(testSessionId, {
      role: "user",
      content: "How is routing handled?",
    });

    await insertSessionMessage(testSessionId, {
      role: "assistant",
      content: "Routing is handled via Next.js App Router.",
      confidence: "high",
    });

    const messages = await getSessionMessages(testSessionId);
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
    expect(messages[1].confidence).toBe("high");
  });

  it("persists generated documents and blueprints", async () => {
    const doc = await upsertSessionDocument(testSessionId, {
      kind: "prd",
      contentMd: "# Product Requirements Document\n\nGoals and acceptance criteria.",
    });

    expect(doc.kind).toBe("prd");

    const docs = await getSessionDocuments(testSessionId);
    expect(docs.some((d) => d.kind === "prd")).toBe(true);

    const bp = await upsertSessionBlueprint(testSessionId, {
      opportunities: [{ id: "opp-1", title: "SQLite Storage Alternative" }],
      selectedIndex: 0,
      planJson: { title: "Implementation Plan" },
    });

    expect(bp.opportunities_json.length).toBe(1);

    const retrievedBp = await getSessionBlueprint(testSessionId);
    expect(retrievedBp?.selected_index).toBe(0);
  });

  it("cascading delete: deleting a session removes all associated snapshots, messages, docs and blueprints", async () => {
    const deleted = await deleteSessionData(testUserId, testSessionId);
    expect(deleted).toBe(true);

    // Session is gone
    const checkSession = await getSessionById(testUserId, testSessionId);
    expect(checkSession).toBeNull();

    // Cascaded sub-resources are cleaned
    const checkSnapshot = await getRepoSnapshot(testSessionId);
    expect(checkSnapshot).toBeNull();

    const checkMessages = await getSessionMessages(testSessionId);
    expect(checkMessages.length).toBe(0);

    const checkDocs = await getSessionDocuments(testSessionId);
    expect(checkDocs.length).toBe(0);

    const checkBp = await getSessionBlueprint(testSessionId);
    expect(checkBp).toBeNull();
  });

  describe("Rate Limiting: User Keyed vs Guest IP Fallback", () => {
    it("keys by user id when authenticated with 60 requests limit", () => {
      const headers = new Headers();
      const authResult = getRateLimitIdentifier(headers, "user-authenticated-456");

      expect(authResult.identifier).toBe("user:user-authenticated-456");
      expect(authResult.isGuest).toBe(false);
      expect(authResult.limit).toBe(60);
    });

    it("keys by client IP with 15 requests limit for unauthenticated guests", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "198.51.100.42, 10.0.0.1");

      const guestResult = getRateLimitIdentifier(headers, null);

      expect(guestResult.identifier).toBe("guest:198.51.100.42");
      expect(guestResult.isGuest).toBe(true);
      expect(guestResult.limit).toBe(15);
    });
  });
});
