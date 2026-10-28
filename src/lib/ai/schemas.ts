import { z } from "zod";

/**
 * Coerces string or array values into string arrays to gracefully handle
 * LLMs that output lists as newlines or single strings instead of JSON arrays.
 */
export const StringArrayCoerce = z.preprocess((val) => {
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === "string" ? item : String(item)))
      .filter((s) => s.trim().length > 0);
  }
  if (typeof val === "string") {
    const lines = val
      .split(/\r?\n|;/)
      .map((line) => line.replace(/^[\s*\-•0-9.)]+/, "").trim())
      .filter((line) => line.length > 0);
    return lines.length > 0 ? lines : [val.trim()];
  }
  return [];
}, z.array(z.string()));

export const StringArrayMin1 = z.preprocess((val) => {
  if (Array.isArray(val)) {
    const arr = val
      .map((item) => (typeof item === "string" ? item : String(item)))
      .filter((s) => s.trim().length > 0);
    return arr.length > 0 ? arr : ["General"];
  }
  if (typeof val === "string") {
    const lines = val
      .split(/\r?\n|;/)
      .map((line) => line.replace(/^[\s*\-•0-9.)]+/, "").trim())
      .filter((line) => line.length > 0);
    return lines.length > 0 ? lines : [val.trim()];
  }
  return ["General"];
}, z.array(z.string()).min(1));

export const EvidenceReferenceSchema = z.object({
  path: z.string().min(1, "Path must not be empty"),
  reason: z.string().min(1, "Reason must not be empty"),
  excerpt: z.string().optional(),
});

export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;

export const RepositoryAnalysisSchema = z.object({
  repositoryName: z.string().min(1),
  description: z.string().default(""),
  detectedTechnologies: StringArrayCoerce.default([]),
  purposeSummary: z.string().min(1),
  architectureOverview: z.string().min(1),
  keyComponents: z.array(
    z.object({
      name: z.string().default("Component"),
      purpose: z.string().default(""),
      evidence: z.array(EvidenceReferenceSchema).default([]),
    })
  ).default([]),
  observedFacts: StringArrayCoerce.default([]),
  inferences: StringArrayCoerce.default([]),
  unknowns: StringArrayCoerce.default([]),
});

export type RepositoryAnalysis = z.infer<typeof RepositoryAnalysisSchema>;

export const ChatAnswerSchema = z.object({
  answer: z.string().min(1),
  evidence: z.array(EvidenceReferenceSchema).default([]),
  insufficientEvidence: z.boolean().default(false),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export type ChatAnswer = z.infer<typeof ChatAnswerSchema>;

export const SharedProjectSpecSchema = z.object({
  projectName: z.string(),
  coreConcept: z.string(),
  targetAudience: StringArrayCoerce.default([]),
  keyDifferentiators: StringArrayCoerce.default([]),
  suggestedStack: StringArrayCoerce.default([]),
  coreCapabilities: StringArrayCoerce.default([]),
});

export type SharedProjectSpec = z.infer<typeof SharedProjectSpecSchema>;

export const ProjectDocumentsSchema = z.object({
  prd: z.object({
    title: z.string(),
    tagline: z.string(),
    problemStatement: z.string(),
    targetUsers: StringArrayCoerce.default([]),
    goals: StringArrayCoerce.default([]),
    userStories: StringArrayCoerce.default([]),
    acceptanceCriteria: StringArrayCoerce.default([]),
  }),
  trd: z.object({
    title: z.string(),
    technologyStack: StringArrayCoerce.default([]),
    architecturePattern: z.string(),
    constraintsAndLimits: StringArrayCoerce.default([]),
    securityAndPrivacy: StringArrayCoerce.default([]),
    testingStrategy: StringArrayCoerce.default([]),
  }),
  tdd: z.object({
    title: z.string(),
    components: z.array(
      z.object({
        name: z.string().default("Component"),
        role: z.preprocess((val) => (typeof val === "string" ? val : JSON.stringify(val)), z.string()).default(""),
        interface: z.preprocess((val) => (typeof val === "string" ? val : JSON.stringify(val)), z.string()).default(""),
      })
    ).default([]),
    dataModels: StringArrayCoerce.default([]),
    requestFlows: StringArrayCoerce.default([]),
    risksAndMitigations: StringArrayCoerce.default([]),
  }),
  codingAgentPrompt: z.string().min(10),
});

export type ProjectDocuments = z.infer<typeof ProjectDocumentsSchema>;

export const InnovationOpportunitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  problem: z.string().min(1),
  targetUsers: StringArrayMin1,
  proposedSolution: z.string().min(1),
  expectedValue: z.string().min(1),
  complexity: z.enum(["low", "medium", "high"]),
  differentiationHypothesis: z.string().min(1),
  evidence: z.array(EvidenceReferenceSchema).default([]),
  assumptions: StringArrayCoerce.default([]),
  risks: StringArrayCoerce.default([]),
  suggestedPriority: z.number().int().min(1).max(3),
});

export type InnovationOpportunity = z.infer<typeof InnovationOpportunitySchema>;

export const InnovationOpportunitiesSchema = z.object({
  opportunities: z.array(InnovationOpportunitySchema).length(3),
});

export const ImplementationPhaseSchema = z.object({
  name: z.string().min(1),
  tasks: StringArrayMin1,
  acceptanceCriteria: StringArrayMin1,
  tests: StringArrayMin1,
});

export const InnovationBlueprintSchema = z.object({
  opportunityId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  requirements: StringArrayMin1,
  affectedComponents: StringArrayMin1,
  architectureChanges: StringArrayCoerce.default([]),
  dataModelChanges: StringArrayCoerce.default([]),
  apiChanges: StringArrayCoerce.default([]),
  implementationPhases: z.array(ImplementationPhaseSchema).min(1),
  risks: StringArrayMin1,
  codingAgentPrompt: z.string().min(10),
});

export type InnovationBlueprint = z.infer<typeof InnovationBlueprintSchema>;

/**
 * Helper to safely parse and extract JSON from model responses that might contain markdown fences.
 */
export function extractAndParseJson<T>(rawText: string, schema: z.ZodType<T, any, any>): T {
  let cleaned = rawText.trim();

  // Strip thinking tags if emitted by model (e.g. <thought>...</thought> or <think>...</think>)
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift();
    }
    if (lines.length > 0 && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop();
    }
    cleaned = lines.join("\n").trim();
  }

  // Also handle leading text before `{` or `[`
  const jsonStart = cleaned.indexOf("{");
  const jsonArrayStart = cleaned.indexOf("[");
  let startIndex = -1;

  if (jsonStart !== -1 && jsonArrayStart !== -1) {
    startIndex = Math.min(jsonStart, jsonArrayStart);
  } else if (jsonStart !== -1) {
    startIndex = jsonStart;
  } else if (jsonArrayStart !== -1) {
    startIndex = jsonArrayStart;
  }

  if (startIndex > 0) {
    cleaned = cleaned.slice(startIndex);
  }

  const jsonEnd = cleaned.lastIndexOf("}");
  const jsonArrayEnd = cleaned.lastIndexOf("]");
  let endIndex = -1;

  if (jsonEnd !== -1 && jsonArrayEnd !== -1) {
    endIndex = Math.max(jsonEnd, jsonArrayEnd);
  } else if (jsonEnd !== -1) {
    endIndex = jsonEnd;
  } else if (jsonArrayEnd !== -1) {
    endIndex = jsonArrayEnd;
  }

  if (endIndex !== -1 && endIndex < cleaned.length - 1) {
    cleaned = cleaned.slice(0, endIndex + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: unknown) {
    throw new Error(
      `Model response is not valid JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return schema.parse(parsed);
}
