import { describe, it, expect, afterEach } from "vitest";
import { generateInnovationOpportunities } from "@/lib/innovation/generate-opportunities";
import { generateInnovationBlueprint } from "@/lib/innovation/generate-blueprint";
import { setTestAIProvider, MockProvider } from "@/lib/ai";
import { BoundedContext } from "@/lib/github/types";
import { NextRequest } from "next/server";
import { POST as postOpps } from "@/app/api/innovation/opportunities/route";
import { POST as postBlueprint } from "@/app/api/innovation/blueprint/route";
import { InnovationOpportunity } from "@/lib/ai/schemas";

describe("Innovation Opportunities & Blueprint Generation", () => {
  const mockContext: BoundedContext = {
    repository: {
      name: "data-pipeline",
      fullName: "stream/data-pipeline",
      description: "ETL pipeline service",
      defaultBranch: "main",
      starsCount: 150,
      forksCount: 20,
      openIssuesCount: 2,
      license: "Apache-2.0",
      language: "TypeScript",
      htmlUrl: "https://github.com/stream/data-pipeline",
    },
    files: [
      {
        path: "README.md",
        content: "# Data Pipeline\nStream processing engine.",
        sizeBytes: 40,
        category: "readme",
      },
      {
        path: "src/worker.ts",
        content: "export function processBatch() { /* single threaded batch */ }",
        sizeBytes: 60,
        category: "source",
      },
    ],
    totalChars: 100,
    treeTruncated: false,
    totalTreeBlobs: 2,
    analyzedFilesCount: 2,
    detectedTechnologies: ["TypeScript"],
    coverageNotes: ["2 files analyzed"],
  };

  const sampleOpportunities = {
    opportunities: [
      {
        id: "opp-1",
        title: "Parallel Worker Pool",
        problem: "Batch processing in worker.ts blocks single event loop thread.",
        targetUsers: ["Data engineers"],
        proposedSolution: "Introduce worker threads pool for parallel chunk processing.",
        expectedValue: "4x throughput improvement on multicore CPUs.",
        complexity: "medium" as const,
        differentiationHypothesis: "Hypothesized 75% latency reduction compared to synchronous loops.",
        evidence: [{ path: "src/worker.ts", reason: "Synchronous processBatch loop found" }],
        assumptions: ["Node worker_threads module is available"],
        risks: ["Memory overhead with high thread count"],
        suggestedPriority: 1,
      },
      {
        id: "opp-2",
        title: "Stream Backpressure Control",
        problem: "No backpressure throttling detected in worker input queue.",
        targetUsers: ["System administrators"],
        proposedSolution: "Add reactive pull streams with bounded buffer.",
        expectedValue: "Eliminate out-of-memory crashes under traffic spikes.",
        complexity: "high" as const,
        differentiationHypothesis: "Hypothesized stability guarantee during peak loads.",
        evidence: [{ path: "src/worker.ts", reason: "Unbounded queue in memory" }],
        assumptions: ["Underlying streams support pause/resume"],
        risks: ["Slow consumers could delay pipeline"],
        suggestedPriority: 2,
      },
      {
        id: "opp-3",
        title: "Dead-Letter Queue Telemetry",
        problem: "Failed events are dropped without persistent logging or retry.",
        targetUsers: ["On-call engineers"],
        proposedSolution: "Implement dead-letter file sink and retry backoff.",
        expectedValue: "Zero data loss for transient pipeline errors.",
        complexity: "low" as const,
        differentiationHypothesis: "Hypothesized 100% audit trail compliance.",
        evidence: [{ path: "README.md", reason: "No DLQ mentioned in documentation" }],
        assumptions: ["Local disk or queue is writable"],
        risks: ["Disk consumption if failures cascade"],
        suggestedPriority: 3,
      },
    ],
  };

  const sampleBlueprint = {
    opportunityId: "opp-1",
    title: "Parallel Worker Pool",
    summary: "Refactor synchronous batch processing to Node worker threads.",
    requirements: [
      "Worker thread pool manager",
      "Task serialization and error propagation",
      "Graceful pool shutdown hook",
    ],
    affectedComponents: ["src/worker.ts", "src/pool.ts"],
    architectureChanges: ["Split synchronous loop into isolated thread channels"],
    dataModelChanges: [],
    apiChanges: [],
    implementationPhases: [
      {
        name: "Phase 1: Worker Pool Manager",
        tasks: ["Implement WorkerPool class", "Add unit tests for thread lifecycle"],
        acceptanceCriteria: ["Can spawn and terminate threads safely"],
        tests: ["npm test tests/pool.test.ts"],
      },
      {
        name: "Phase 2: Pipeline Integration",
        tasks: ["Route batches through WorkerPool", "Handle thread timeouts"],
        acceptanceCriteria: ["Batches processed concurrently without crash"],
        tests: ["npm test tests/worker.test.ts"],
      },
    ],
    risks: ["Thread startup latency on cold boots"],
    codingAgentPrompt: "Build the WorkerPool class using Node worker_threads with full unit test coverage.",
  };

  afterEach(() => {
    setTestAIProvider(null);
  });

  it("generates exactly 3 evidence-aware opportunities", async () => {
    const mock = new MockProvider({
      mockResponse: JSON.stringify(sampleOpportunities),
    });
    setTestAIProvider(mock);

    const opps = await generateInnovationOpportunities({
      url: "https://github.com/stream/data-pipeline",
      context: mockContext,
    });

    expect(opps.length).toBe(3);
    expect(opps[0].id).toBe("opp-1");
    expect(opps[0].evidence[0].path).toBe("src/worker.ts");
    expect(opps[0].differentiationHypothesis).toContain("Hypothesized");
  });

  it("expands selected opportunity into implementation blueprint with phased tests", async () => {
    const mock = new MockProvider({
      mockResponse: JSON.stringify(sampleBlueprint),
    });
    setTestAIProvider(mock);

    const result = await generateInnovationBlueprint({
      url: "https://github.com/stream/data-pipeline",
      opportunity: sampleOpportunities.opportunities[0] as InnovationOpportunity,
      context: mockContext,
    });

    expect(result.blueprint.title).toBe("Parallel Worker Pool");
    expect(result.blueprint.implementationPhases.length).toBe(2);
    expect(result.blueprint.implementationPhases[0].tests).toContain("npm test tests/pool.test.ts");
    expect(result.markdown).toContain("# Innovation Blueprint: Parallel Worker Pool");
    expect(result.markdown).toContain("Autonomous Coding-Agent Implementation Prompt");
  });

  it("POST /api/innovation/opportunities returns 400 for missing url", async () => {
    const req = new NextRequest("http://localhost:3000/api/innovation/opportunities", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await postOpps(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_REQUEST");
  });

  it("POST /api/innovation/blueprint returns 400 for missing opportunity", async () => {
    const req = new NextRequest("http://localhost:3000/api/innovation/blueprint", {
      method: "POST",
      body: JSON.stringify({ url: "https://github.com/stream/data-pipeline" }),
    });

    const res = await postBlueprint(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_REQUEST");
  });
});
