import { validateGitHubRepoUrl } from "@/lib/github/validate-repo-url";
import { ingestRepository } from "@/lib/github/client";
import { BoundedContext } from "@/lib/github/types";
import {
  getAIProvider,
  buildOpportunitiesPrompt,
  extractAndParseJson,
  InnovationOpportunitiesSchema,
  InnovationOpportunity,
} from "@/lib/ai";
import { AIProviderError } from "@/lib/ai/types";

export interface GenerateOpportunitiesInput {
  url: string;
  context?: BoundedContext;
}

export async function generateInnovationOpportunities({
  url,
  context: existingContext,
}: GenerateOpportunitiesInput): Promise<InnovationOpportunity[]> {
  const repoInput = validateGitHubRepoUrl(url);
  const context = existingContext || (await ingestRepository(repoInput));
  const provider = getAIProvider();

  const prompt = buildOpportunitiesPrompt(context);

  let rawContent: string;
  try {
    const completion = await provider.generateCompletion({
      messages: prompt,
      temperature: 0.2,
      responseFormat: "json_object",
    });
    rawContent = completion.content;
  } catch (err: unknown) {
    if (err instanceof AIProviderError) throw err;
    throw new AIProviderError(
      "AI_PROVIDER_ERROR",
      `Failed to generate innovation opportunities: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let parsed: { opportunities: InnovationOpportunity[] };
  try {
    parsed = extractAndParseJson(rawContent, InnovationOpportunitiesSchema);
  } catch (err: unknown) {
    throw new AIProviderError(
      "AI_OUTPUT_INVALID",
      `The AI model produced invalid innovation opportunities JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Cross-reference evidence paths with retrieved files
  const validFilePaths = new Set(context.files.map((f) => f.path));

  const validatedOpportunities = parsed.opportunities.map((opp) => ({
    ...opp,
    evidence: opp.evidence.map((ev) => {
      const isRetrieved = validFilePaths.has(ev.path);
      return {
        ...ev,
        reason: isRetrieved
          ? ev.reason
          : `${ev.reason} (Path inferred from repository tree structure; full file was not in bounded retrieval)`,
      };
    }),
  }));

  return validatedOpportunities;
}
