import { GemmaProvider } from "./gemma-provider";
import { MockProvider } from "./mock-provider";
import { InferenceProvider } from "./types";

let currentProvider: InferenceProvider | null = null;

export function getAIProvider(): InferenceProvider {
  if (currentProvider) {
    return currentProvider;
  }
  return new GemmaProvider();
}

export function setTestAIProvider(provider: InferenceProvider | null): void {
  currentProvider = provider;
}

export * from "./types";
export * from "./schemas";
export * from "./prompts";
export * from "./gemma-provider";
export * from "./mock-provider";
