import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as analyzeHandler } from "@/app/api/repository/analyze/route";
import { POST as chatHandler } from "@/app/api/repository/chat/route";
import { POST as documentsHandler } from "@/app/api/documents/generate/route";
import { POST as opportunitiesHandler } from "@/app/api/innovation/opportunities/route";
import { insertSession } from "@/lib/persistence/store";

let ingestCallCount = 0;
let lastPromptPassedToModel: any = null;

// Mock GitHub ingestion
vi.mock("@/lib/github/client", () => ({
  ingestRepository: vi.fn().mockImplementation(async (repoInput) => {
    ingestCallCount++;
    return {
      repository: {
        owner: repoInput.owner,
        name: repoInput.repo,
        fullName: `${repoInput.owner}/${repoInput.repo}`,
        defaultBranch: "main",
        description: "Test repository for excerpt caching",
        starsCount: 100,
        forksCount: 20,
        openIssuesCount: 2,
        license: "MIT",
        htmlUrl: `https://github.com/${repoInput.owner}/${repoInput.repo}`,
      },
      files: [
        {
          path: "src/server.ts",
          category: "entrypoint",
          content: "import express from 'express';\nexport const app = express();\n// CRITICAL_REAL_EXCERPT_SIGNATURE: authentication middleware mounted on /api/auth",
          sizeBytes: 150,
        },
        {
          path: "README.md",
          category: "documentation",
          content: "# Hello World\nWelcome to Octocat repository with real documentation text.",
          sizeBytes: 100,
        },
      ],
      totalChars: 250,
      treeTruncated: false,
      totalTreeBlobs: 2,
      analyzedFilesCount: 2,
      detectedTechnologies: ["TypeScript", "Express"],
      coverageNotes: ["Analyzed 2 test files"],
    };
  }),
}));

// Mock AI provider
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getAIProvider: () => ({
      getDisclosure: () => ({ providerName: "Gemma", model: "gemini-flash-lite", configured: true }),
      generateCompletion: vi.fn().mockImplementation(async (opts) => {
        lastPromptPassedToModel = opts.messages;
        // If analysis prompt
        const contentStr = JSON.stringify(opts.messages);
        if (contentStr.includes("architecture overview") || contentStr.includes("structured architecture")) {
          return {
            content: JSON.stringify({
              repositoryName: "octocat/Hello-World",
              description: "Test repo",
              detectedTechnologies: ["TypeScript", "Express"],
              purposeSummary: "A testing codebase",
              architectureOverview: "Express backend",
              keyComponents: [],
              observedFacts: ["Has server.ts"],
              inferences: ["Uses TypeScript"],
              unknowns: [],
            }),
          };
        }
        if (contentStr.includes("We are planning a new project inspired by")) {
          return {
            content: JSON.stringify({
              projectName: "Project Specification",
              coreConcept: "A TypeScript Express service",
              targetAudience: ["Developers"],
              keyDifferentiators: ["Fast"],
              suggestedStack: ["Node.js", "Express"],
              coreCapabilities: ["API routing"],
            }),
          };
        }
        if (contentStr.includes("generate complete, consistent project planning documents")) {
          return {
            content: JSON.stringify({
              prd: {
                title: "NextEngine PRD",
                tagline: "Serverless workflows simplified",
                problemStatement: "Legacy task runners are complex and costly.",
                targetUsers: ["DevOps Engineers"],
                goals: ["Simple deployment", "Zero-config queues"],
                userStories: ["As an engineer I want to run cron jobs"],
                acceptanceCriteria: ["Jobs trigger on schedule"],
              },
              trd: {
                title: "NextEngine TRD",
                technologyStack: ["Next.js", "TypeScript"],
                architecturePattern: "Event-driven serverless",
                constraintsAndLimits: ["Max timeout 60s"],
                securityAndPrivacy: ["No secrets stored"],
                testingStrategy: ["Vitest unit tests"],
              },
              tdd: {
                title: "NextEngine TDD",
                components: [{ name: "Runner", purpose: "Execute jobs" }],
                dataModels: [{ name: "Job", fields: ["id", "status"] }],
                requestFlows: ["POST /jobs -> queue"],
                risksAndMitigations: [{ risk: "Crash", mitigation: "Retry" }],
              },
              codingAgentPrompt: "Build the NextEngine distributed runner according to specification.",
            }),
          };
        }
        if (contentStr.includes("distinct, high-value improvement opportunities") || contentStr.includes("innovation opportunities")) {
          const makeOpp = (id: string, prio: number) => ({
            id,
            title: `Opportunity ${id}`,
            problem: "Current system lacks performance optimization",
            targetUsers: ["Developers"],
            proposedSolution: "Add caching layer",
            expectedValue: "10x speedup",
            complexity: "medium" as const,
            differentiationHypothesis: "Hypothesis: caching reduces latency by 90%",
            evidence: [{ path: "src/server.ts", reason: "Found server.ts" }],
            assumptions: ["Node memory is sufficient"],
            risks: ["Cache invalidation"],
            suggestedPriority: prio,
          });

          return {
            content: JSON.stringify({
              opportunities: [makeOpp("opp-1", 1), makeOpp("opp-2", 2), makeOpp("opp-3", 3)],
            }),
          };
        }
        // Chat prompt
        return {
          content: JSON.stringify({
            answer: "The application initializes Express in src/server.ts.",
            evidence: [{ path: "src/server.ts", reason: "Express initialized here" }],
            confidence: "high",
            insufficientEvidence: false,
          }),
        };
      }),
    }),
  };
});

describe("Group 4 Regression Tests: Cache with Real Excerpts & Zero Re-Ingestion (L-05)", () => {
  const testUserId = "cache-test-user-1";
  const testSessionId = `session-cache-${Date.now()}`;

  beforeEach(async () => {
    ingestCallCount = 0;
    lastPromptPassedToModel = null;
    vi.clearAllMocks();

    const { getAuthUser } = await import("@/lib/auth/get-user");
    const authUser = await getAuthUser();
    const userId = authUser?.id || "u-demo-1";

    // Create session in persistence
    await insertSession(userId, {
      id: testSessionId,
      repoUrl: "https://github.com/octocat/Hello-World",
      owner: "octocat",
      repo: "Hello-World",
      title: "Octocat Session",
    });
  });

  it("stores real file excerpts during analyze and uses them in chat with ZERO GitHub re-ingestion", async () => {
    // 1. Run analyze API with sessionId
    const analyzeReq = new NextRequest("http://localhost:3000/api/repository/analyze", {
      method: "POST",
      body: JSON.stringify({
        url: "https://github.com/octocat/Hello-World",
        sessionId: testSessionId,
      }),
    });

    const analyzeRes = await analyzeHandler(analyzeReq);
    expect(analyzeRes.status).toBe(200);
    const analyzeData = await analyzeRes.json();

    // Verification: analyzedFiles must include real file excerpts, not just path and size
    expect(analyzeData.analyzedFiles).toBeDefined();
    expect(analyzeData.analyzedFiles.length).toBeGreaterThan(0);
    const serverFile = analyzeData.analyzedFiles.find((f: any) => f.path === "src/server.ts");
    expect(serverFile).toBeDefined();
    expect(serverFile.excerpt).toBeDefined();
    expect(serverFile.excerpt).toContain("CRITICAL_REAL_EXCERPT_SIGNATURE");

    expect(ingestCallCount).toBe(1);

    // 2. Now run chat API with the same sessionId
    const chatReq = new NextRequest("http://localhost:3000/api/repository/chat", {
      method: "POST",
      body: JSON.stringify({
        url: "https://github.com/octocat/Hello-World",
        question: "How is authentication middleware configured?",
        sessionId: testSessionId,
      }),
    });

    const chatRes = await chatHandler(chatReq);
    expect(chatRes.status).toBe(200);

    // ZERO additional GitHub requests during chat!
    expect(ingestCallCount).toBe(1);

    // Verification: the prompt passed to the AI model must contain the real file excerpt,
    // NOT the placeholder string "File: src/server.ts"
    const promptString = JSON.stringify(lastPromptPassedToModel);
    expect(promptString).toContain("CRITICAL_REAL_EXCERPT_SIGNATURE");
    expect(promptString).not.toContain("File: src/server.ts\n--- END FILE");
    // 3. Document generation with the same sessionId makes ZERO additional GitHub requests
    const docReq = new NextRequest("http://localhost:3000/api/documents/generate", {
      method: "POST",
      body: JSON.stringify({
        url: "https://github.com/octocat/Hello-World",
        sessionId: testSessionId,
      }),
    });

    const docRes = await documentsHandler(docReq);
    expect(docRes.status).toBe(200);
    expect(ingestCallCount).toBe(1);

    // 4. Opportunity generation with the same sessionId makes ZERO additional GitHub requests
    const oppReq = new NextRequest("http://localhost:3000/api/innovation/opportunities", {
      method: "POST",
      body: JSON.stringify({
        url: "https://github.com/octocat/Hello-World",
        sessionId: testSessionId,
      }),
    });

    const oppRes = await opportunitiesHandler(oppReq);
    expect(oppRes.status).toBe(200);
    expect(ingestCallCount).toBe(1);
  });
});
