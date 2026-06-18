import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { decrypt } from "@/lib/crypto";

type LLMConfig = {
  provider: string;
  model: string;
  apiKey: string | null;
};

export function getLLMModel(config: LLMConfig) {
  const apiKey = config.apiKey ? decrypt(config.apiKey) : undefined;

  switch (config.provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(config.model || "gpt-4o-mini");
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(config.model || "claude-haiku-4-5-20251001");
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(config.model || "gemini-2.0-flash");
    }
    default:
      throw new Error(`Proveedor LLM no soportado: ${config.provider}`);
  }
}

export function getEmbeddingModel(apiKey: string) {
  const openai = createOpenAI({ apiKey });
  return openai.embedding("text-embedding-3-small");
}
