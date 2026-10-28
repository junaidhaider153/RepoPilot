import { validateGitHubRepoUrl } from "@/lib/github/validate-repo-url";
import { ingestRepository } from "@/lib/github/client";
import { BoundedContext } from "@/lib/github/types";
import {
  getAIProvider,
  buildSharedSpecPrompt,
  buildDocumentsPrompt,
  extractAndParseJson,
  SharedProjectSpecSchema,
  ProjectDocumentsSchema,
  SharedProjectSpec,
  ProjectDocuments,
} from "@/lib/ai";
import { AIProviderError } from "@/lib/ai/types";
import {
  formatPrdToMarkdown,
  formatTrdToMarkdown,
  formatTddToMarkdown,
  formatCodingPromptToMarkdown,
  formatFullBundleToMarkdown,
} from "@/lib/export/markdown";

export interface GenerateDocumentsInput {
  url: string;
  userIdea?: string;
  context?: BoundedContext;
}

export interface GeneratedDocumentsResult {
  spec: SharedProjectSpec;
  documents: ProjectDocuments;
  markdown: {
    prd: string;
    trd: string;
    tdd: string;
    prompt: string;
    fullBundle: string;
  };
  referenceRepo: string;
}

export async function generateProjectDocuments({
  url,
  userIdea = "Modernize and enhance features with superior developer experience",
  context: existingContext,
}: GenerateDocumentsInput): Promise<GeneratedDocumentsResult> {
  const repoInput = validateGitHubRepoUrl(url);
  const context = existingContext || (await ingestRepository(repoInput));
  const provider = getAIProvider();

  // STAGE 1: Synthesize Unified Shared Project Specification
  const specPrompt = buildSharedSpecPrompt(context, userIdea);
  let rawSpec: string;
  try {
    const specCompletion = await provider.generateCompletion({
      messages: specPrompt,
      temperature: 0.2,
      responseFormat: "json_object",
    });
    rawSpec = specCompletion.content;
  } catch (err: unknown) {
    if (err instanceof AIProviderError) throw err;
    throw new AIProviderError(
      "AI_PROVIDER_ERROR",
      `Failed to generate shared project specification: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let sharedSpec: SharedProjectSpec;
  try {
    sharedSpec = extractAndParseJson(rawSpec, SharedProjectSpecSchema);
  } catch (err: unknown) {
    throw new AIProviderError(
      "AI_OUTPUT_INVALID",
      `The AI model produced invalid shared specification JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // STAGE 2: Derive Consistent PRD, TRD, TDD, and Coding Agent Prompt from Shared Spec
  const docsPrompt = buildDocumentsPrompt(sharedSpec, context);
  let rawDocs: string;
  try {
    const docsCompletion = await provider.generateCompletion({
      messages: docsPrompt,
      temperature: 0.1,
      responseFormat: "json_object",
    });
    rawDocs = docsCompletion.content;
  } catch (err: unknown) {
    if (err instanceof AIProviderError) throw err;
    throw new AIProviderError(
      "AI_PROVIDER_ERROR",
      `Failed to generate project documents: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let documents: ProjectDocuments;
  try {
    documents = extractAndParseJson(rawDocs, ProjectDocumentsSchema);
  } catch (err: unknown) {
    throw new AIProviderError(
      "AI_OUTPUT_INVALID",
      `The AI model produced invalid project documents JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Format safe, portable Markdown outputs
  const prdMd = formatPrdToMarkdown(documents, sharedSpec);
  const trdMd = formatTrdToMarkdown(documents);
  const tddMd = formatTddToMarkdown(documents);
  const promptMd = formatCodingPromptToMarkdown(documents);
  const fullBundleMd = formatFullBundleToMarkdown(
    documents,
    sharedSpec,
    context.repository.fullName
  );

  return {
    spec: sharedSpec,
    documents,
    markdown: {
      prd: prdMd,
      trd: trdMd,
      tdd: tddMd,
      prompt: promptMd,
      fullBundle: fullBundleMd,
    },
    referenceRepo: context.repository.fullName,
  };
}

