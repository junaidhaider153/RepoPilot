import { describe, it, expect } from "vitest";
import {
  RepositoryAnalysisSchema,
  ChatAnswerSchema,
  ProjectDocumentsSchema,
  InnovationOpportunitiesSchema,
  InnovationBlueprintSchema,
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
});
