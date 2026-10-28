import { describe, it, expect } from "vitest";
import { MockProvider } from "@/lib/ai/mock-provider";
import { GemmaProvider } from "@/lib/ai/gemma-provider";

describe("Gemma Provider Integration & Smoke Seam", () => {
  it("verifies MockProvider seam behaves predictably for tests", async () => {
    const mock = new MockProvider({
      mockResponse: JSON.stringify({ status: "ok", answer: "test answer" }),
    });

    expect(mock.isConfigured()).toBe(true);
    expect(mock.getDisclosure().configured).toBe(true);

    const res = await mock.generateCompletion({
      messages: [{ role: "user", content: "test" }],
    });

    expect(res.content).toContain("test answer");
    expect(mock.recordedCalls.length).toBe(1);
  });

  // Explicit live Gemma smoke test that executes ONLY if GEMMA_API_KEY is configured
  it("executes live Gemma smoke test if credentials exist in environment", async () => {
    const apiKey = process.env.GEMMA_API_KEY;
    const baseUrl = process.env.GEMMA_API_BASE_URL;

    if (!apiKey || !baseUrl) {
      // Credentials not in environment: skip live network call safely as planned
      expect(true).toBe(true);
      return;
    }

    const provider = new GemmaProvider({
      apiKey,
      baseUrl,
      model: process.env.GEMMA_MODEL || "gemma-4-31b-it",
      timeoutMs: 45000,
    });

    const completion = await provider.generateCompletion({
      messages: [{ role: "user", content: "Reply with the word 'PONG' only." }],
      temperature: 0.1,
    });

    expect(completion.content).toBeDefined();
    expect(completion.content.length).toBeGreaterThan(0);
  }, 50000);

  it("runs live analyzeRepository for octocat/Hello-World if credentials exist", async () => {
    if (!process.env.GEMMA_API_KEY) return;
    const { analyzeRepository } = await import("@/lib/analysis/analyze-repository");
    const result = await analyzeRepository("https://github.com/octocat/Hello-World");
    expect(result.repository.name).toBe("Hello-World");
    expect(result.analysis.purposeSummary).toBeDefined();
    expect(result.analyzedFiles.length).toBeGreaterThan(0);
  }, 60000);
});

