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
  maxRetries?: number;
}

function cleanErrorMessage(rawText: string, status: number): string {
  try {
    const parsed = JSON.parse(rawText);
    const errObj = Array.isArray(parsed) ? parsed[0]?.error : parsed?.error;
    if (errObj?.message) {
      return errObj.message;
    }
  } catch {
    // Not valid JSON
  }
  if (status === 503) {
    return "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again in a moment.";
  }
  return rawText.slice(0, 300) || `HTTP error ${status}`;
}

export class GemmaProvider implements InferenceProvider {
  public name = "Gemma Inference Provider";
  public modelId: string;
  private baseUrl: string;
  private apiKey?: string;
  private defaultTimeoutMs: number;
  private maxRetries: number;

  constructor(config: GemmaConfig = {}) {
    this.maxRetries = config.maxRetries ?? 3;
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
    this.modelId = (config.model || process.env.GEMMA_MODEL || "gemini-3.5-flash").trim();
    this.defaultTimeoutMs =
      config.timeoutMs ||
      parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "90000", 10);
  }

  public isConfigured(): boolean {
    return Boolean(
      this.baseUrl &&
      this.modelId &&
      (this.apiKey || this.baseUrl.includes("localhost") || this.baseUrl.includes("127.0.0.1"))
    );
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

    const isGoogleEndpoint = this.baseUrl.includes("generativelanguage.googleapis.com");
    const candidateModels = isGoogleEndpoint
      ? [this.modelId, "gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"].filter(
          (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
        )
      : [this.modelId];

    try {
      let res: Response | null = null;
      let lastErrorText = "";
      let lastStatus = 500;

      for (const currentModel of candidateModels) {
        const payload: Record<string, unknown> = {
          model: currentModel,
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 4096,
        };

        if (options.responseFormat === "json_object") {
          payload.response_format = { type: "json_object" };
        }

        const maxRetries = this.maxRetries;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          res = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (res.ok) {
            break;
          }

          // Retry on transient 503 (high demand) or 429 (rate limit)
          if ((res.status === 503 || res.status === 429) && attempt < maxRetries) {
            const delay = attempt * 1500;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          lastErrorText = await res.text().catch(() => "");
          lastStatus = res.status;
          break;
        }

        if (res && res.ok) {
          break;
        }

        // If this model hit quota (429), persistent 503, or not found (404), try next candidate model
        if (candidateModels.length > 1 && (lastStatus === 429 || lastStatus === 503 || lastStatus === 404)) {
          continue;
        }
        break;
      }

      if (!res || !res.ok) {
        const status = res?.status || lastStatus;
        const userMsg = cleanErrorMessage(lastErrorText, status);

        if (status === 401 || status === 403) {
          throw new AIProviderError(
            "AI_PROVIDER_ERROR",
            `Authentication failed with AI inference provider: ${userMsg}`,
            status
          );
        }

        if (status === 429) {
          throw new AIProviderError(
            "AI_RATE_LIMITED",
            `Inference provider rate limit exceeded: ${userMsg}`,
            429
          );
        }

        throw new AIProviderError(
          "AI_PROVIDER_ERROR",
          `AI provider error (HTTP ${status}): ${userMsg}`,
          status
        );
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== "string") {
        throw new AIProviderError(
          "AI_OUTPUT_INVALID",
          "Inference provider returned an empty or malformed completion message.",
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
          `Inference request timed out after ${timeout}ms.`,
          504
        );
      }
      throw new AIProviderError(
        "AI_PROVIDER_ERROR",
        `Failed to reach AI inference provider: ${err instanceof Error ? err.message : String(err)}`,
        502
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
