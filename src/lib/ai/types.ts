export type AIErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "AI_OUTPUT_INVALID"
  | "AI_RATE_LIMITED";

export class AIProviderError extends Error {
  public code: AIErrorCode;
  public status: number;
  public details?: unknown;

  constructor(code: AIErrorCode, message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
  timeoutMs?: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface InferenceProvider {
  name: string;
  modelId: string;
  generateCompletion(options: CompletionOptions): Promise<CompletionResult>;
  isConfigured(): boolean;
  getDisclosure(): { providerName: string; model: string; configured: boolean };
}

