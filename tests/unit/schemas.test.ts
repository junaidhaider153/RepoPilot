import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  RepositoryAnalysisSchema,
  ChatAnswerSchema,
  ProjectDocumentsSchema,
  InnovationOpportunitiesSchema,
  InnovationBlueprintSchema,
  extractAndParseJson,
  StringArrayCoerce,
} from "@/lib/ai/schemas";

describe("AI Runtime Output Schemas", () => {
  it("validates RepositoryAnalysisSchema", () => {
    const valid = {
      repositoryName: "my-repo",
      description: "My project",
      detectedTechnologies: ["TypeScript", "Next.js"],
      purposeSummary: "Testing repo analysis",
      architectureOverview: "Clean Architecture",
      keyComponents: [
        {
          name: "API Gateway",
          purpose: "Handles routing",
          evidence: [{ path: "src/app/api", reason: "Route handlers present" }],
        },
      ],
      observedFacts: ["Uses TypeScript"],
      inferences: ["Modular design"],
      unknowns: ["Database schema not inspected"],
    };

    const result = RepositoryAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("validates ChatAnswerSchema", () => {
    const valid = {
      answer: "Authentication is implemented using JWT tokens in src/auth.ts.",
      evidence: [{ path: "src/auth.ts", reason: "Token verify function found" }],
      insufficientEvidence: false,
      confidence: "high",
    };

    const result = ChatAnswerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("validates ProjectDocumentsSchema", () => {
    const valid = {
      prd: {
        title: "New Project PRD",
        tagline: "Better code",
        problemStatement: "Current tools are slow",
        targetUsers: ["Developers"],
        goals: ["Fast analysis"],
        userStories: ["As a user I want fast feedback"],
        acceptanceCriteria: ["Sub-second responses"],
      },
      trd: {
        title: "New Project TRD",
        technologyStack: ["Next.js", "TypeScript"],
        architecturePattern: "Serverless",
        constraintsAndLimits: ["Max 100 req/s"],
        securityAndPrivacy: ["Data encrypted in transit"],
        testingStrategy: ["Unit + Integration tests"],
      },
      tdd: {
        title: "New Project TDD",
        components: [
          { name: "Parser", role: "Parses input", interface: "parse(str): obj" },
        ],
        dataModels: ["User", "Repository"],
        requestFlows: ["Client -> Edge -> DB"],
        risksAndMitigations: ["Rate limits mitigated via caching"],
      },
      codingAgentPrompt: "Implement the Parser component with 100% test coverage.",
    };

    const result = ProjectDocumentsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("coerces string constraintsAndLimits into an array of strings seamlessly", () => {
    const withStringConstraints = {
      prd: {
        title: "Test",
        tagline: "Test",
        problemStatement: "Test",
        targetUsers: "Developers",
        goals: "Fast",
        userStories: "Story 1",
        acceptanceCriteria: "Criteria 1",
      },
      trd: {
        title: "Test",
        technologyStack: "Next.js\nTypeScript",
        architecturePattern: "Serverless",
        constraintsAndLimits: "1. Rate limit 50 req/s\n2. Bounded context 120KB",
        securityAndPrivacy: "Encrypted",
        testingStrategy: "Unit tests",
      },
      tdd: {
        title: "Test",
        components: [{ name: "Parser", role: "Parses input", interface: "interface" }],
        dataModels: "Model 1",
        requestFlows: "Flow 1",
        risksAndMitigations: "Risk 1",
      },
      codingAgentPrompt: "Implement the component with full coverage.",
    };

    const parsed = ProjectDocumentsSchema.parse(withStringConstraints);
    expect(Array.isArray(parsed.trd.constraintsAndLimits)).toBe(true);
    expect(parsed.trd.constraintsAndLimits.length).toBe(2);
    expect(parsed.trd.constraintsAndLimits[0]).toBe("Rate limit 50 req/s");
    expect(parsed.trd.technologyStack).toContain("Next.js");
  });

  it("strictly enforces exactly three Innovation Opportunities", () => {
    const makeOpp = (id: string, priority: number) => ({
      id,
      title: `Improvement ${id}`,
      problem: `Problem for ${id}`,
      targetUsers: ["Users"],
      proposedSolution: `Solution ${id}`,
      expectedValue: "High efficiency",
      complexity: "medium" as const,
      differentiationHypothesis: "Hypothetical value",
      evidence: [{ path: "src/main.ts", reason: "Found single thread bottleneck" }],
      assumptions: ["Node is used"],
      risks: ["Migration effort"],
      suggestedPriority: priority,
    });

    const validThree = {
      opportunities: [makeOpp("opp-1", 1), makeOpp("opp-2", 2), makeOpp("opp-3", 3)],
    };

    expect(InnovationOpportunitiesSchema.safeParse(validThree).success).toBe(true);

    const invalidTwo = {
      opportunities: [makeOpp("opp-1", 1), makeOpp("opp-2", 2)],
    };
    expect(InnovationOpportunitiesSchema.safeParse(invalidTwo).success).toBe(false);
  });

  it("validates InnovationBlueprintSchema", () => {
    const valid = {
      opportunityId: "opp-1",
      title: "Real-time sync",
      summary: "Add web sockets for instant updates",
      requirements: ["WS server", "Client reconnect logic"],
      affectedComponents: ["Network layer", "UI state"],
      architectureChanges: ["Add WebSocket handler"],
      dataModelChanges: [],
      apiChanges: ["WS /events"],
      implementationPhases: [
        {
          name: "Phase 1: Setup",
          tasks: ["Install WS library", "Write healthcheck"],
          acceptanceCriteria: ["Connection establishes cleanly"],
          tests: ["npm test tests/ws.test.ts"],
        },
      ],
      risks: ["Connection drops"],
      codingAgentPrompt: "Build the WS handler step-by-step.",
    };

    expect(InnovationBlueprintSchema.safeParse(valid).success).toBe(true);
  });

  it("extractAndParseJson handles commentary, markdown fences, and trailing markdown brackets", () => {
    const rawWithCommentary = `Here is the requested specification:
\`\`\`json
{
  "name": "RepoPilot",
  "version": "1.0.0"
}
\`\`\`
Hope this helps! See documentation at [docs link](https://example.com).`;

    const schema = z.object({
      name: z.string(),
      version: z.string(),
    });

    const parsed = extractAndParseJson(rawWithCommentary, schema);
    expect(parsed.name).toBe("RepoPilot");
    expect(parsed.version).toBe("1.0.0");
  });

  it("StringArrayCoerce strips list bullets while preserving version numbers", () => {
    const raw = "1. Node.js 18\n* 3.11 - Python\n- React 19";
    const schema = z.object({ items: StringArrayCoerce });
    const parsed = schema.parse({ items: raw });
    expect(parsed.items).toEqual(["Node.js 18", "3.11 - Python", "React 19"]);
  });
});

