import { describe, it, expect, afterEach } from "vitest";
import { generateProjectDocuments } from "@/lib/documents/generate-documents";
import { setTestAIProvider, MockProvider } from "@/lib/ai";
import { BoundedContext } from "@/lib/github/types";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/documents/generate/route";

describe("Project Document Generation", () => {
  const mockContext: BoundedContext = {
    repository: {
      name: "task-engine",
      fullName: "workflow/task-engine",
      description: "Distributed job runner",
      defaultBranch: "main",
      starsCount: 300,
      forksCount: 50,
      openIssuesCount: 4,
      license: "MIT",
      language: "TypeScript",
      htmlUrl: "https://github.com/workflow/task-engine",
    },
    files: [
      {
        path: "README.md",
        content: "# Task Engine\nA distributed job orchestrator.",
        sizeBytes: 50,
        category: "readme",
      },
    ],
    totalChars: 50,
    treeTruncated: false,
    totalTreeBlobs: 1,
    analyzedFilesCount: 1,
    detectedTechnologies: ["TypeScript"],
    coverageNotes: ["1 file analyzed"],
  };

  const sampleSpec = {
    projectName: "NextEngine",
    coreConcept: "Serverless distributed workflow engine",
    targetAudience: ["DevOps Engineers", "Backend Developers"],
    keyDifferentiators: ["Sub-millisecond cold start", "Local SQLite test mode"],
    suggestedStack: ["Next.js", "TypeScript", "Tailwind CSS"],
    coreCapabilities: ["Cron scheduling", "DAG task execution"],
  };

  const sampleDocs = {
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
      constraintsAndLimits: ["Max 50MB payload"],
      securityAndPrivacy: ["Encrypted at rest"],
      testingStrategy: ["Unit and E2E coverage"],
    },
    tdd: {
      title: "NextEngine TDD",
      components: [
        { name: "Scheduler", role: "Cron scheduler", interface: "schedule(task): void" },
      ],
      dataModels: ["JobRecord", "ExecutionLog"],
      requestFlows: ["Client -> API -> Scheduler"],
      risksAndMitigations: ["Concurrency handled via atomic locks"],
    },
    codingAgentPrompt: "Build the Scheduler module following TDD principles.",
  };

  afterEach(() => {
    setTestAIProvider(null);
  });

  it("generates consistent PRD, TRD, TDD, and coding prompt from shared specification", async () => {
    let callCount = 0;
    const mock = new MockProvider();
    mock.setCustomGenerator((options) => {
      callCount++;
      const systemContent = options.messages[0].content;
      const userContent = options.messages[1].content;

      if (userContent.includes("User Idea / Objective:")) {
        return JSON.stringify(sampleSpec);
      }
      return JSON.stringify(sampleDocs);
    });

    setTestAIProvider(mock);

    const result = await generateProjectDocuments({
      url: "https://github.com/workflow/task-engine",
      context: mockContext,
    });

    expect(callCount).toBe(2);
    expect(result.spec.projectName).toBe("NextEngine");
    expect(result.documents.prd.title).toBe("NextEngine PRD");
    expect(result.documents.trd.technologyStack).toContain("Next.js");
    expect(result.documents.tdd.components.length).toBe(1);

    // Verify markdown formatted outputs
    expect(result.markdown.prd).toContain("# NextEngine PRD");
    expect(result.markdown.trd).toContain("Technology Stack");
    expect(result.markdown.tdd).toContain("Scheduler");
    expect(result.markdown.prompt).toContain("Build the Scheduler");
    expect(result.markdown.fullBundle).toContain("PART 1: SHARED SPECIFICATION");
  });

  it("POST /api/documents/generate returns 400 for missing url", async () => {
    const req = new NextRequest("http://localhost:3000/api/documents/generate", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_REQUEST");
  });
});
