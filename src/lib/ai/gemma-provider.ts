import {
  InferenceProvider,
  CompletionOptions,
  CompletionResult,
  AIProviderError,
} from "./types";

export interface GemmaConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

export class GemmaProvider implements InferenceProvider {
  public name = "Gemma Inference Provider";
  public modelId: string;
  private baseUrl: string;
  private apiKey?: string;
  private defaultTimeoutMs: number;

  constructor(config: GemmaConfig = {}) {
    this.baseUrl = (
      config.baseUrl ||
      process.env.GEMMA_API_BASE_URL ||
      ""
    ).trim();

    // Remove trailing slashes
    if (this.baseUrl.endsWith("/")) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }

    this.apiKey = (config.apiKey || process.env.GEMMA_API_KEY || "").trim();
    this.modelId = (config.model || process.env.GEMMA_MODEL || "gemma2-9b-it").trim();
    this.defaultTimeoutMs =
      config.timeoutMs ||
      parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "30000", 10);
  }

  public isConfigured(): boolean {
    return Boolean(this.baseUrl && this.modelId && (this.apiKey || this.baseUrl.includes("localhost") || this.baseUrl.includes("127.0.0.1")));
  }

  public getDisclosure() {
    return {
      providerName: this.name,
      model: this.modelId,
      configured: this.isConfigured(),
    };
  }

  public async generateCompletion(
    options: CompletionOptions
  ): Promise<CompletionResult> {
    if (!this.isConfigured()) {
      const missing: string[] = [];
      if (!this.baseUrl) missing.push("GEMMA_API_BASE_URL");
      if (!this.modelId) missing.push("GEMMA_MODEL");
      if (!this.apiKey && !this.baseUrl.includes("localhost") && !this.baseUrl.includes("127.0.0.1")) {
        missing.push("GEMMA_API_KEY");
      }

      throw new AIProviderError(
        "AI_NOT_CONFIGURED",
        `Gemma AI inference provider is not configured. Missing environment variables: ${missing.join(", ")}. Please configure them in .env.local to enable AI analysis.`,
        503
      );
    }

    const timeout = options.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    // Determine completions endpoint
    const endpoint = this.baseUrl.endsWith("/chat/completions")
      ? this.baseUrl
      : `${this.baseUrl}/chat/completions`;

    const payload: Record<string, unknown> = {
      model: this.modelId,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 4096,
    };

    if (options.responseFormat === "json_object") {
      payload.response_format = { type: "json_object" };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        throw new AIProviderError(
          "AI_PROVIDER_ERROR",
          `Authentication failed with Gemma inference provider (HTTP ${res.status}). Please check your GEMMA_API_KEY.`,
          res.status
        );
      }

      if (res.status === 429) {
        throw new AIProviderError(
          "AI_RATE_LIMITED",
          "Gemma inference provider rate limit exceeded. Please wait a moment before trying again.",
          429
        );
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new AIProviderError(
          "AI_PROVIDER_ERROR",
          `Gemma provider returned error HTTP ${res.status}: ${errorText.slice(0, 300)}`,
          res.status
        );
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== "string") {
        throw new AIProviderError(
          "AI_OUTPUT_INVALID",
          "Gemma provider returned an empty or malformed completion message.",
          502
        );
      }

      return {
        content,
        model: data.model || this.modelId,
        finishReason: choice?.finish_reason,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
      };
    } catch (err: unknown) {
      if (err instanceof AIProviderError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new AIProviderError(
          "AI_PROVIDER_TIMEOUT",
          `Gemma inference request timed out after ${timeout}ms.`,
          504
        );
      }
      throw new AIProviderError(
        "AI_PROVIDER_ERROR",
        `Failed to reach Gemma inference provider: ${err instanceof Error ? err.message : String(err)}`,
        502
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

