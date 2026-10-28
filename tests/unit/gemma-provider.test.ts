import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GemmaProvider } from "@/lib/ai/gemma-provider";
import { AIProviderError } from "@/lib/ai/types";
import { extractAndParseJson, RepositoryAnalysisSchema } from "@/lib/ai/schemas";

describe("GemmaProvider", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GEMMA_API_BASE_URL;
    delete process.env.GEMMA_API_KEY;
    delete process.env.GEMMA_MODEL;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("identifies unconfigured state and throws clear AI_NOT_CONFIGURED error without silent fallback", async () => {
    const provider = new GemmaProvider();
    expect(provider.isConfigured()).toBe(false);

    await expect(
      provider.generateCompletion({
        messages: [{ role: "user", content: "hello" }],
      })
    ).rejects.toThrowError(AIProviderError);

    await expect(
      provider.generateCompletion({
        messages: [{ role: "user", content: "hello" }],
      })
    ).rejects.toThrow(/Gemma AI inference provider is not configured/);
  });

  it("sends standard chat completions request when configured", async () => {
    const mockJson = {
      choices: [
        {
          message: {
            content: '{"repositoryName": "test-repo", "purposeSummary": "Demo", "architectureOverview": "Next.js"}',
          },
          finish_reason: "stop",
        },
      ],
      model: "gemma2-9b-it",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockJson,
      headers: new Headers(),
    });

    const provider = new GemmaProvider({
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: "test-key-123",
      model: "gemma2-9b-it",
    });

    expect(provider.isConfigured()).toBe(true);

    const result = await provider.generateCompletion({
      messages: [{ role: "user", content: "Analyze" }],
      responseFormat: "json_object",
    });

    expect(result.content).toBe(mockJson.choices[0].message.content);
    expect(result.model).toBe("gemma2-9b-it");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key-123",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("handles 401 authentication error gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
      headers: new Headers(),
    });

    const provider = new GemmaProvider({
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: "invalid-key",
      model: "gemma2-9b-it",
    });

    await expect(
      provider.generateCompletion({
        messages: [{ role: "user", content: "test" }],
      })
    ).rejects.toThrow(/Authentication failed/);
  });

  it("handles 429 rate limit gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
      headers: new Headers(),
    });

    const provider = new GemmaProvider({
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: "test-key",
      model: "gemma2-9b-it",
    });

    await expect(
      provider.generateCompletion({
        messages: [{ role: "user", content: "test" }],
      })
    ).rejects.toThrow(/rate limit exceeded/);
  });

  it("extractAndParseJson extracts clean JSON from markdown fences and prose", () => {
    const rawWithMarkdown = `
Here is the analysis you requested:
\`\`\`json
{
  "repositoryName": "valid-app",
  "purposeSummary": "A test app",
  "architectureOverview": "Monolith architecture",
  "keyComponents": [],
  "observedFacts": [],
  "inferences": [],
  "unknowns": []
}
\`\`\`
Hope this helps!`;

    const parsed = extractAndParseJson(rawWithMarkdown, RepositoryAnalysisSchema);
    expect(parsed.repositoryName).toBe("valid-app");
    expect(parsed.purposeSummary).toBe("A test app");
  });
});

