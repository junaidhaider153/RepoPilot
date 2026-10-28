import { validateGitHubRepoUrl } from "@/lib/github/validate-repo-url";
import { ingestRepository } from "@/lib/github/client";
import { BoundedContext, RepositoryMetadata } from "@/lib/github/types";
import { getAIProvider, buildAnalysisPrompt, extractAndParseJson, RepositoryAnalysisSchema, RepositoryAnalysis } from "@/lib/ai";
import { AIProviderError } from "@/lib/ai/types";

export interface CompleteAnalysisResult {
  repository: RepositoryMetadata;
  analysis: RepositoryAnalysis;
  detectedTechnologies: string[];
  analyzedFiles: Array<{ path: string; category: string; sizeBytes: number }>;
  coverageNotes: string[];
  aiDisclosure: {
    providerName: string;
    model: string;
    configured: boolean;
  };
}

export async function analyzeRepository(
  urlOrInput: string,
  existingContext?: BoundedContext
): Promise<CompleteAnalysisResult> {
  const repoInput = validateGitHubRepoUrl(urlOrInput);

  // Ingest repository if context not already provided
  const context = existingContext || (await ingestRepository(repoInput));

  const provider = getAIProvider();
  const prompt = buildAnalysisPrompt(context);

  let rawContent: string;
  try {
    const completion = await provider.generateCompletion({
      messages: prompt,
      temperature: 0.1,
      responseFormat: "json_object",
    });
    rawContent = completion.content;
  } catch (err: unknown) {
    if (err instanceof AIProviderError) {
      throw err;
    }
    throw new AIProviderError(
      "AI_PROVIDER_ERROR",
      `Failed to generate repository analysis: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Parse and validate model output
  let analysis: RepositoryAnalysis;
  try {
    analysis = extractAndParseJson(rawContent, RepositoryAnalysisSchema);
  } catch (err: unknown) {
    throw new AIProviderError(
      "AI_OUTPUT_INVALID",
      `The AI model produced invalid or malformed analysis JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Validate evidence references: verify referenced paths against retrieved files
  const validFilePaths = new Set(context.files.map((f) => f.path));

  analysis.keyComponents = analysis.keyComponents.map((component) => ({
    ...component,
    evidence: component.evidence.map((ev) => {
      const isRetrieved = validFilePaths.has(ev.path);
      return {
        ...ev,
        reason: isRetrieved
          ? ev.reason
          : `${ev.reason} (Note: path referenced based on directory tree inference, file contents not retrieved in bounded subset)`,
      };
    }),
  }));

  // Merge detected technologies
  const allTechnologies = Array.from(
    new Set([...context.detectedTechnologies, ...analysis.detectedTechnologies])
  ).sort();

  return {
    repository: context.repository,
    analysis: {
      ...analysis,
      detectedTechnologies: allTechnologies,
    },
    detectedTechnologies: allTechnologies,
    analyzedFiles: context.files.map((f) => ({
      path: f.path,
      category: f.category,
      sizeBytes: f.sizeBytes,
    })),
    coverageNotes: context.coverageNotes,
    aiDisclosure: provider.getDisclosure(),
  };
}
