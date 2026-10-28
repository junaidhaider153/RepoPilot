import { validateGitHubRepoUrl } from "@/lib/github/validate-repo-url";
import { ingestRepository } from "@/lib/github/client";
import { BoundedContext } from "@/lib/github/types";
import {
  getAIProvider,
  buildBlueprintPrompt,
  extractAndParseJson,
  InnovationBlueprintSchema,
  InnovationBlueprint,
  InnovationOpportunity,
} from "@/lib/ai";
import { AIProviderError } from "@/lib/ai/types";
import { formatBlueprintToMarkdown } from "@/lib/export/markdown";

export interface GenerateBlueprintInput {
  url: string;
  opportunity: InnovationOpportunity;
  context?: BoundedContext;
}

export interface GeneratedBlueprintResult {
  blueprint: InnovationBlueprint;
  markdown: string;
  referenceRepo: string;
}

export async function generateInnovationBlueprint({
  url,
  opportunity,
  context: existingContext,
}: GenerateBlueprintInput): Promise<GeneratedBlueprintResult> {
  const repoInput = validateGitHubRepoUrl(url);
  const context = existingContext || (await ingestRepository(repoInput));
  const provider = getAIProvider();

  const prompt = buildBlueprintPrompt(opportunity, context);

  let rawContent: string;
  try {
    const completion = await provider.generateCompletion({
      messages: prompt,
      temperature: 0.1,
      responseFormat: "json_object",
    });
    rawContent = completion.content;
  } catch (err: unknown) {
    if (err instanceof AIProviderError) throw err;
    throw new AIProviderError(
      "AI_PROVIDER_ERROR",
      `Failed to generate innovation blueprint: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let blueprint: InnovationBlueprint;
  try {
    blueprint = extractAndParseJson(rawContent, InnovationBlueprintSchema);
  } catch (err: unknown) {
    throw new AIProviderError(
      "AI_OUTPUT_INVALID",
      `The AI model produced invalid innovation blueprint JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const markdown = formatBlueprintToMarkdown(
    blueprint,
    opportunity,
    context.repository.fullName
  );

  return {
    blueprint,
    markdown,
    referenceRepo: context.repository.fullName,
  };
}
