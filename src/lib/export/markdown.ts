import { ProjectDocuments, SharedProjectSpec, InnovationBlueprint, InnovationOpportunity } from "@/lib/ai/schemas";

function sanitizeMarkdown(str: string): string {
  // Strip dangerous html script tags or event handlers
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

export function formatPrdToMarkdown(docs: ProjectDocuments, spec?: SharedProjectSpec): string {
  const { prd } = docs;
  const dateStr = new Date().toISOString().split("T")[0];

  return `# ${sanitizeMarkdown(prd.title)}
> **Tagline**: ${sanitizeMarkdown(prd.tagline)}  
> **Generated on**: ${dateStr} via RepoPilot (Gemma Model)

---

## 1. Problem Statement
${sanitizeMarkdown(prd.problemStatement)}

## 2. Target Users
${prd.targetUsers.map((u) => `- ${sanitizeMarkdown(u)}`).join("\n")}

## 3. Product Goals
${prd.goals.map((g) => `- ${sanitizeMarkdown(g)}`).join("\n")}

## 4. User Stories
${prd.userStories.map((s, i) => `${i + 1}. ${sanitizeMarkdown(s)}`).join("\n")}

## 5. Acceptance Criteria
${prd.acceptanceCriteria.map((c) => `- [ ] ${sanitizeMarkdown(c)}`).join("\n")}
`;
}

export function formatTrdToMarkdown(docs: ProjectDocuments): string {
  const { trd } = docs;
  const dateStr = new Date().toISOString().split("T")[0];

  return `# ${sanitizeMarkdown(trd.title)}
> **Generated on**: ${dateStr} via RepoPilot (Gemma Model)

---

## 1. Technology Stack
${trd.technologyStack.map((t) => `- **${sanitizeMarkdown(t)}**`).join("\n")}

## 2. Architectural Pattern
${sanitizeMarkdown(trd.architecturePattern)}

## 3. Constraints & Operational Limits
${trd.constraintsAndLimits.map((c) => `- ${sanitizeMarkdown(c)}`).join("\n")}

## 4. Security & Privacy Model
${trd.securityAndPrivacy.map((s) => `- ${sanitizeMarkdown(s)}`).join("\n")}

## 5. Testing & Quality Strategy
${trd.testingStrategy.map((t) => `- ${sanitizeMarkdown(t)}`).join("\n")}
`;
}

export function formatTddToMarkdown(docs: ProjectDocuments): string {
  const { tdd } = docs;
  const dateStr = new Date().toISOString().split("T")[0];

  const componentsMd = tdd.components
    .map(
      (c, idx) => `### Component 0${idx + 1}: ${sanitizeMarkdown(c.name)}
- **Role**: ${sanitizeMarkdown(c.role)}
- **Interface / Contract**:
\`\`\`ts
${sanitizeMarkdown(c.interface)}
\`\`\``
    )
    .join("\n\n");

  return `# ${sanitizeMarkdown(tdd.title)}
> **Generated on**: ${dateStr} via RepoPilot (Gemma Model)

---

## 1. Architecture Components
${componentsMd}

## 2. Core Data Models
${tdd.dataModels.map((m) => `- ${sanitizeMarkdown(m)}`).join("\n")}

## 3. Request & Data Flows
${tdd.requestFlows.map((f, i) => `${i + 1}. ${sanitizeMarkdown(f)}`).join("\n")}

## 4. Technical Risks & Mitigations
${tdd.risksAndMitigations.map((r) => `- ${sanitizeMarkdown(r)}`).join("\n")}
`;
}

export function formatCodingPromptToMarkdown(docs: ProjectDocuments): string {
  const dateStr = new Date().toISOString().split("T")[0];

  return `# Phased Coding-Agent Execution Prompt
> **Generated on**: ${dateStr} via RepoPilot  
> **Instructions**: Provide this prompt to your autonomous AI coding agent (e.g. Claude Code, Cursor, GitHub Copilot Workspace, Antigravity).

---

${sanitizeMarkdown(docs.codingAgentPrompt)}
`;
}

export function formatFullBundleToMarkdown(
  docs: ProjectDocuments,
  spec: SharedProjectSpec,
  referenceRepo: string
): string {
  const dateStr = new Date().toISOString().split("T")[0];

  return `# Project Specification Package: ${sanitizeMarkdown(spec.projectName)}
> Reference Base: ${referenceRepo}  
> Generated: ${dateStr} by RepoPilot  
> Model: Gemma Inference Provider

---

# PART 1: SHARED SPECIFICATION
- **Core Concept**: ${sanitizeMarkdown(spec.coreConcept)}
- **Target Audience**: ${spec.targetAudience.join(", ")}
- **Key Differentiators**: ${spec.keyDifferentiators.join(", ")}
- **Recommended Stack**: ${spec.suggestedStack.join(", ")}

---

${formatPrdToMarkdown(docs, spec)}

---

${formatTrdToMarkdown(docs)}

---

${formatTddToMarkdown(docs)}

---

${formatCodingPromptToMarkdown(docs)}
`;
}

export function formatBlueprintToMarkdown(
  blueprint: InnovationBlueprint,
  opportunity?: InnovationOpportunity,
  referenceRepo = ""
): string {
  const dateStr = new Date().toISOString().split("T")[0];

  const phasesMd = blueprint.implementationPhases
    .map(
      (phase, idx) => `### Phase ${idx + 1}: ${sanitizeMarkdown(phase.name)}
**Tasks**:
${phase.tasks.map((t) => `- [ ] ${sanitizeMarkdown(t)}`).join("\n")}

**Acceptance Criteria**:
${phase.acceptanceCriteria.map((a) => `- ${sanitizeMarkdown(a)}`).join("\n")}

**Verification Tests**:
${phase.tests.map((t) => `\`\`\`bash\n${sanitizeMarkdown(t)}\n\`\`\``).join("\n")}`
    )
    .join("\n\n");

  return `# Innovation Blueprint: ${sanitizeMarkdown(blueprint.title)}
> **Target Repository**: ${referenceRepo}  
> **Generated on**: ${dateStr} via RepoPilot  
> **Status**: Ready for Implementation

---

## Executive Summary
${sanitizeMarkdown(blueprint.summary)}

${
  opportunity
    ? `> **Differentiation Hypothesis**: ${sanitizeMarkdown(opportunity.differentiationHypothesis)}\n> **Complexity**: ${opportunity.complexity}`
    : ""
}

## 1. Functional & Technical Requirements
${blueprint.requirements.map((r) => `- ${sanitizeMarkdown(r)}`).join("\n")}

## 2. Affected Components & Architecture Changes
**Affected Components**:
${blueprint.affectedComponents.map((c) => `- \`${sanitizeMarkdown(c)}\``).join("\n")}

**Architecture Adjustments**:
${blueprint.architectureChanges.map((a) => `- ${sanitizeMarkdown(a)}`).join("\n")}

${
  blueprint.apiChanges.length > 0
    ? `**API / Data Changes**:\n${blueprint.apiChanges.map((api) => `- ${sanitizeMarkdown(api)}`).join("\n")}`
    : ""
}

## 3. Phased Implementation Roadmap
${phasesMd}

## 4. Key Risks & Edge Cases
${blueprint.risks.map((risk) => `- ${sanitizeMarkdown(risk)}`).join("\n")}

---

## 5. Autonomous Coding-Agent Implementation Prompt
\`\`\`markdown
${sanitizeMarkdown(blueprint.codingAgentPrompt)}
\`\`\`
`;
}
