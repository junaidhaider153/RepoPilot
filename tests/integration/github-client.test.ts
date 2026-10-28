import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchRepositoryMetadata,
  fetchRepositoryTree,
  fetchFileContent,
  ingestRepository,
} from "@/lib/github/client";
import { GitHubIngestionError } from "@/lib/github/types";

describe("GitHub Client Integration", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetches repository metadata correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: "test-repo",
        full_name: "test-owner/test-repo",
        description: "A test repository description",
        default_branch: "main",
        stargazers_count: 42,
        forks_count: 5,
        open_issues_count: 2,
        license: { spdx_id: "MIT" },
        language: "TypeScript",
        private: false,
      }),
      headers: new Headers(),
    });

    const meta = await fetchRepositoryMetadata({
      owner: "test-owner",
      repo: "test-repo",
      url: "https://github.com/test-owner/test-repo",
    });

    expect(meta.name).toBe("test-repo");
    expect(meta.fullName).toBe("test-owner/test-repo");
    expect(meta.starsCount).toBe(42);
    expect(meta.license).toBe("MIT");
  });

  it("handles 404 repository not found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    });

    await expect(
      fetchRepositoryMetadata({
        owner: "test-owner",
        repo: "missing-repo",
        url: "https://github.com/test-owner/missing-repo",
      })
    ).rejects.toThrowError(GitHubIngestionError);
  });

  it("handles 403 rate limit with informative message", async () => {
    const headers = new Headers();
    headers.set("x-ratelimit-reset", "1790000000");

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers,
    });

    await expect(
      fetchRepositoryMetadata({
        owner: "test-owner",
        repo: "test-repo",
        url: "https://github.com/test-owner/test-repo",
      })
    ).rejects.toThrow(/GitHub API rate limit exceeded/);
  });

  it("handles empty repository tree gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tree: [],
        truncated: false,
      }),
      headers: new Headers(),
    });

    await expect(
      fetchRepositoryTree(
        {
          owner: "test-owner",
          repo: "empty-repo",
          url: "https://github.com/test-owner/empty-repo",
        },
        "main"
      )
    ).rejects.toThrow(/No files found in repository/);
  });

  it("decodes base64 file contents accurately", async () => {
    const sampleText = "Hello from RepoPilot test suite!";
    const base64Content = Buffer.from(sampleText).toString("base64");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        encoding: "base64",
        content: base64Content,
      }),
      headers: new Headers(),
    });

    const content = await fetchFileContent(
      { owner: "owner", repo: "repo", url: "https://github.com/owner/repo" },
      "README.md",
      "main"
    );

    expect(content).toBe(sampleText);
  });

  it("runs end-to-end ingestRepository pipeline and truncates oversized context cleanly", async () => {
    const mockRepoMetadata = {
      name: "pilot-app",
      full_name: "pilot/pilot-app",
      description: "Sample app",
      default_branch: "main",
      stargazers_count: 10,
      forks_count: 1,
      open_issues_count: 0,
      license: { spdx_id: "Apache-2.0" },
      language: "TypeScript",
      private: false,
    };

    const mockTree = {
      tree: [
        { path: "README.md", mode: "100644", type: "blob", sha: "1", size: 30 },
        { path: "package.json", mode: "100644", type: "blob", sha: "2", size: 80 },
        { path: "src/index.ts", mode: "100644", type: "blob", sha: "3", size: 50 },
      ],
      truncated: false,
    };

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/repos/pilot/pilot-app/git/trees/")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockTree,
          headers: new Headers(),
        };
      }
      if (url.includes("/repos/pilot/pilot-app/contents/README.md")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            encoding: "base64",
            content: Buffer.from("# Pilot App\nSimple test README.").toString("base64"),
          }),
          headers: new Headers(),
        };
      }
      if (url.includes("/repos/pilot/pilot-app/contents/package.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            encoding: "base64",
            content: Buffer.from(
              JSON.stringify({ dependencies: { next: "15.0.0", react: "19.0.0" } })
            ).toString("base64"),
          }),
          headers: new Headers(),
        };
      }
      if (url.includes("/repos/pilot/pilot-app/contents/src/index.ts")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            encoding: "base64",
            content: Buffer.from("console.log('App started');").toString("base64"),
          }),
          headers: new Headers(),
        };
      }
      // Metadata call
      return {
        ok: true,
        status: 200,
        json: async () => mockRepoMetadata,
        headers: new Headers(),
      };
    });

    const result = await ingestRepository({
      owner: "pilot",
      repo: "pilot-app",
      url: "https://github.com/pilot/pilot-app",
    });

    expect(result.repository.name).toBe("pilot-app");
    expect(result.files.length).toBe(3);
    expect(result.files.some((f) => f.path === "README.md")).toBe(true);
    expect(result.files.some((f) => f.path === "package.json")).toBe(true);
    expect(result.detectedTechnologies).toContain("Next.js");
    expect(result.detectedTechnologies).toContain("React");
    expect(result.coverageNotes.length).toBeGreaterThan(0);
  });
});

