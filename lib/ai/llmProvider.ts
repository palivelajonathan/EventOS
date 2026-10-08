/**
 * EventOS LLM Provider Abstraction
 * 
 * Clean, provider-agnostic interface powered by official Groq SDK.
 * 
 * ARCHITECTURAL CONSTRAINTS:
 * - Server-side only (throws error if evaluated on client).
 * - Never grants the LLM direct database access.
 * - Ingests ground truth telemetry or RAG documents via prompt context.
 * - Graceful fallback: If GROQ_API_KEY is not configured or network fails, returns null,
 *   enabling route handlers to use deterministic, zero-hallucination tools.
 */

import Groq from "groq-sdk";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMGenerateOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerateResult {
  text: string;
  model: string;
  provider: string;
}

export interface LLMProvider {
  name: string;
  isConfigured(): boolean;
  getModelName(): string;
  generateChat(options: LLMGenerateOptions): Promise<LLMGenerateResult | null>;
}

export class GroqLLMProvider implements LLMProvider {
  name = "GROQ";
  private client: Groq | null = null;
  private model: string;

  constructor() {
    if (typeof window !== "undefined") {
      throw new Error("SECURITY VIOLATION: GroqLLMProvider cannot be instantiated in client-side code.");
    }

    const apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    if (apiKey) {
      this.client = new Groq({ apiKey });
    }
  }

  isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  }

  getModelName(): string {
    return process.env.GROQ_MODEL || this.model;
  }

  async generateChat(options: LLMGenerateOptions): Promise<LLMGenerateResult | null> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return null;
    }

    // Refresh client instance if environment variable was dynamically loaded
    if (!this.client) {
      this.client = new Groq({ apiKey });
    }

    const activeModel = this.getModelName();

    try {
      const response = await this.client.chat.completions.create({
        model: activeModel,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024,
      });

      const choice = response.choices?.[0]?.message?.content;
      if (!choice || !choice.trim()) {
        return null;
      }

      return {
        text: choice.trim(),
        model: response.model || activeModel,
        provider: this.name,
      };
    } catch (error: any) {
      console.warn(`[GroqLLMProvider] Chat completion non-fatal exception (${activeModel}):`, error?.message || error);
      return null;
    }
  }
}

// Export singleton active provider (allows easy swapping or mocking)
export const activeLLMProvider: LLMProvider = new GroqLLMProvider();
