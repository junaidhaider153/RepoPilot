import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Sweep 3 Group 3: Performance & Cache Optimization (E-05, E-06)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("E-05: Ingestion pipeline caches bounded context on globalThis, avoiding duplicate GitHub network calls", async () => {
    const { ingestRepository, getIngestionCacheKey, clearIngestionCache } = await import(
      "@/lib/github/client"
    );

    clearIngestionCache();

    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      fetchCount++;
      if (url.includes("/repos/testowner/testrepo/git/trees/main")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            sha: "tree-sha-123",
            truncated: false,
            tree: [
              { path: "package.json", type: "blob", size: 100 },
              { path: "README.md", type: "blob", size: 200 },
            ],
          }),
        };
      }
      if (url.includes("/repos/testowner/testrepo/contents")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            encoding: "base64",
            content: Buffer.from("console.log('hello');").toString("base64"),
          }),
        };
      }
      // repo metadata
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          name: "testrepo",
          full_name: "testowner/testrepo",
          default_branch: "main",
          stargazers_count: 42,
          forks_count: 5,
          open_issues_count: 2,
          pushed_at: "2026-01-01T00:00:00Z",
          size: 1000,
          private: false,
        }),
      };
    });

    const input = {
      owner: "testowner",
      repo: "testrepo",
      url: "https://github.com/testowner/testrepo",
    };

    // First ingestion: should call GitHub API
    const context1 = await ingestRepository(input);
    expect(context1).toBeDefined();
    expect(context1.repository.name).toBe("testrepo");
    const initialFetchCount = fetchCount;
    expect(initialFetchCount).toBeGreaterThan(0);

    // Second ingestion with same input: MUST hit cache, zero additional network calls
    const context2 = await ingestRepository(input);
    expect(context2).toBeDefined();
    expect(context2.repository.name).toBe("testrepo");
    expect(fetchCount).toBe(initialFetchCount);
  });

  it("E-06: localStorage session serialization strips heavy analysisResult to prevent QuotaExceededError", async () => {
    const { sanitizeSessionForStorage } = await import("@/context/SessionContext");

    const heavySession = {
      id: "s-123",
      repoUrl: "https://github.com/testowner/testrepo",
      owner: "testowner",
      repo: "testrepo",
      title: "testowner/testrepo",
      pinned: false,
      createdAt: "2026-10-29T00:00:00Z",
      updatedAt: "2026-10-29T00:00:00Z",
      analysisResult: {
        repository: { name: "testrepo" } as any,
        analysis: { summary: "massive analysis payload ".repeat(50000) } as any,
        detectedTechnologies: ["TypeScript"],
        analyzedFiles: [],
        coverageNotes: [],
        aiDisclosure: { providerName: "Gemma", model: "gemma-3-27b", configured: true },
      },
    };

    const sanitized = sanitizeSessionForStorage(heavySession);

    // Metadata is preserved
    expect(sanitized.id).toBe("s-123");
    expect(sanitized.repoUrl).toBe("https://github.com/testowner/testrepo");
    expect(sanitized.title).toBe("testowner/testrepo");

    // Heavy analysisResult payload MUST be omitted from localStorage serialization
    expect(sanitized.analysisResult).toBeUndefined();
    expect(JSON.stringify(sanitized).length).toBeLessThan(500);
  });
});
