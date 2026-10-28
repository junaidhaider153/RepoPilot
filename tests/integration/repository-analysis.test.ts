import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { analyzeRepository } from "@/lib/analysis/analyze-repository";
import { setTestAIProvider, MockProvider } from "@/lib/ai";
import { BoundedContext } from "@/lib/github/types";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/repository/analyze/route";

describe("Repository Analysis Service & API Route", () => {
  const mockContext: BoundedContext = {
    repository: {
      name: "demo-app",
      fullName: "test-org/demo-app",
      description: "A demonstration application",
      defaultBranch: "main",
      starsCount: 88,
      forksCount: 12,
      openIssuesCount: 3,
      license: "MIT",
      language: "TypeScript",
      htmlUrl: "https://github.com/test-org/demo-app",
    },
    files: [
      {
        path: "README.md",
        content: "# Demo App\nA full-stack Next.js project.",
        sizeBytes: 40,
        category: "readme",
      },
      {
        path: "package.json",
        content: JSON.stringify({ dependencies: { next: "15.0.0", react: "19.0.0" } }),
        sizeBytes: 70,
        category: "manifest",
      },
    ],
    totalChars: 110,
    treeTruncated: false,
    totalTreeBlobs: 2,
    analyzedFilesCount: 2,
    detectedTechnologies: ["Next.js", "React", "Node.js"],
    coverageNotes: ["2 files analyzed"],
  };

  const sampleModelJson = JSON.stringify({
    repositoryName: "demo-app",
    description: "A demonstration application",
    detectedTechnologies: ["Next.js", "React"],
    purposeSummary: "Demonstrates full-stack development patterns.",
    architectureOverview: "Server-rendered Next.js app using App Router.",
    keyComponents: [
      {
        name: "Web UI",
        purpose: "Renders application pages",
        evidence: [{ path: "README.md", reason: "Documented in readme" }],
      },
      {
        name: "Database Connector",
        purpose: "Handles storage",
        evidence: [{ path: "src/db/client.ts", reason: "Tree indicates db directory" }], // path not in retrieved files!
      },
    ],
    observedFacts: ["Uses Next.js 15", "Has README"],
    inferences: ["Follows standard React patterns"],
    unknowns: ["Database schema not verified"],
  });

  afterEach(() => {
    setTestAIProvider(null);
  });

  it("analyzes repository and flags unretrieved evidence paths accurately", async () => {
    const mock = new MockProvider({
      mockResponse: sampleModelJson,
    });
    setTestAIProvider(mock);

    const result = await analyzeRepository("https://github.com/test-org/demo-app", mockContext);

    expect(result.repository.name).toBe("demo-app");
    expect(result.analysis.purposeSummary).toContain("full-stack");
    expect(result.analysis.keyComponents.length).toBe(2);

    // Verified path in retrieved files remains intact
    expect(result.analysis.keyComponents[0].evidence[0].reason).toBe("Documented in readme");

    // Unretrieved path receives note
    expect(result.analysis.keyComponents[1].evidence[0].reason).toContain(
      "file contents not retrieved in bounded subset"
    );
  });

  it("handles malformed model JSON with AI_OUTPUT_INVALID error", async () => {
    const mock = new MockProvider({
      mockResponse: "Not a JSON output at all {corrupted",
    });
    setTestAIProvider(mock);

    await expect(
      analyzeRepository("https://github.com/test-org/demo-app", mockContext)
    ).rejects.toThrow(/produced invalid or malformed analysis JSON/);
  });

  it("POST /api/repository/analyze returns 400 for invalid or missing body", async () => {
    const req = new NextRequest("http://localhost:3000/api/repository/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_REQUEST");
  });

  it("POST /api/repository/analyze returns 400 for non-GitHub URL", async () => {
    const req = new NextRequest("http://localhost:3000/api/repository/analyze", {
      method: "POST",
      body: JSON.stringify({ url: "https://gitlab.com/owner/repo" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_REPOSITORY_URL");
  });
});
