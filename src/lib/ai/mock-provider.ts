import {
  InferenceProvider,
  CompletionOptions,
  CompletionResult,
} from "./types";

export interface MockProviderOptions {
  mockResponse?: string;
  mockError?: Error;
  delayMs?: number;
}

export class MockProvider implements InferenceProvider {
  public name = "Mock Gemma Provider (Test Seam)";
  public modelId = "gemma2-mock-test";
  private responseGenerator?: (options: CompletionOptions) => string;
  private mockResponse?: string;
  private mockError?: Error;
  private delayMs: number;
  public recordedCalls: CompletionOptions[] = [];

  constructor(options: MockProviderOptions = {}) {
    this.mockResponse = options.mockResponse;
    this.mockError = options.mockError;
    this.delayMs = options.delayMs || 0;
  }

  public setCustomGenerator(fn: (options: CompletionOptions) => string) {
    this.responseGenerator = fn;
  }

  public setMockResponse(response: string) {
    this.mockResponse = response;
  }

  public setMockError(error: Error) {
    this.mockError = error;
  }

  public isConfigured(): boolean {
    return true;
  }

  public getDisclosure() {
    return {
      providerName: this.name,
      model: this.modelId,
      configured: true,
    };
  }

  public async generateCompletion(
    options: CompletionOptions
  ): Promise<CompletionResult> {
    this.recordedCalls.push(options);

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.mockError) {
      throw this.mockError;
    }

    let text = this.mockResponse;

    if (this.responseGenerator) {
      text = this.responseGenerator(options);
    }

    if (!text) {
      // Default fallback mock JSON if none explicitly provided
      text = JSON.stringify({
        mock: true,
        message: "Default mock response",
      });
    }

    return {
      content: text,
      model: this.modelId,
      finishReason: "stop",
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };
  }
}
