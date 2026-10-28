import { validateGitHubRepoUrl } from "@/lib/github/validate-repo-url";
import { ingestRepository } from "@/lib/github/client";
import { BoundedContext } from "@/lib/github/types";
import {
  getAIProvider,
  buildChatPrompt,
  extractAndParseJson,
  ChatAnswerSchema,
  ChatAnswer,
  ChatMessage,
} from "@/lib/ai";
import { AIProviderError } from "@/lib/ai/types";

export interface AnswerQuestionInput {
  url: string;
  question: string;
  history?: ChatMessage[];
  context?: BoundedContext;
}

export async function answerRepositoryQuestion({
  url,
  question,
  history = [],
  context: existingContext,
}: AnswerQuestionInput): Promise<ChatAnswer> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error("Question cannot be empty.");
  }

  if (trimmedQuestion.length > 1000) {
    throw new Error("Question exceeds maximum allowed length of 1000 characters.");
  }

  const repoInput = validateGitHubRepoUrl(url);
  const context = existingContext || (await ingestRepository(repoInput));

  const provider = getAIProvider();
  const messages = buildChatPrompt(context, trimmedQuestion, history);

  let rawContent: string;
  try {
    const completion = await provider.generateCompletion({
      messages,
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
      `Failed to generate answer from AI provider: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let parsed: ChatAnswer;
  try {
    parsed = extractAndParseJson(rawContent, ChatAnswerSchema);
  } catch (err: unknown) {
    throw new AIProviderError(
      "AI_OUTPUT_INVALID",
      `The AI model produced invalid answer JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Cross-reference evidence paths with retrieved files
  const validFilePaths = new Set(context.files.map((f) => f.path));

  parsed.evidence = parsed.evidence.map((ev) => {
    const isRetrieved = validFilePaths.has(ev.path);
    return {
      ...ev,
      reason: isRetrieved
        ? ev.reason
        : `${ev.reason} (Path inferred from project structure; full file was not in bounded retrieval)`,
    };
  });

  return parsed;
}

