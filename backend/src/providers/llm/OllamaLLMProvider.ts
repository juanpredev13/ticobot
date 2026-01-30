import OpenAI from 'openai';
import type {
  ILLMProvider,
  LLMMessage,
  GenerationOptions,
  LLMResponse,
} from '@ticobot/shared';
import type { Env } from '../../config/env.js';

/**
 * Context window sizes for common Ollama models
 */
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'qwen2.5:7b': 32768,
  'qwen2.5:14b': 32768,
  'qwen2.5:32b': 32768,
  'llama3.1:8b': 128000,
  'llama3.2:3b': 128000,
  'mistral:7b': 32768,
  'deepseek-r1:14b': 64000,
  'gemma2:9b': 8192,
};

/**
 * Ollama LLM Provider
 * Implements ILLMProvider using Ollama's OpenAI-compatible API
 * Runs locally without API costs or rate limits
 */
export class OllamaLLMProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;
  private contextWindow: number;

  constructor(env: Env) {
    const baseURL = env.OLLAMA_BASE_URL || 'http://localhost:11434';

    // Ollama's OpenAI-compatible endpoint is at /v1
    this.client = new OpenAI({
      apiKey: 'ollama', // Ollama doesn't require an API key, but OpenAI client needs one
      baseURL: `${baseURL}/v1`,
    });

    this.model = env.OLLAMA_MODEL || 'qwen2.5:14b';

    // Get context window for model, default to 32K if unknown
    this.contextWindow = MODEL_CONTEXT_WINDOWS[this.model] || 32768;
  }

  async generateCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No completion returned from Ollama');
      }

      return {
        content: choice.message.content,
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        finishReason: (choice.finish_reason as LLMResponse['finishReason']) ?? 'stop',
      };
    } catch (error) {
      // Provide helpful error message if Ollama isn't running
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error(
          `Ollama connection refused. Make sure Ollama is running:\n` +
          `  1. Start Ollama: ollama serve\n` +
          `  2. Pull the model: ollama pull ${this.model}`
        );
      }
      throw new Error(
        `Ollama completion failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async *generateStreamingCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): AsyncIterableIterator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error(
          `Ollama connection refused. Make sure Ollama is running:\n` +
          `  1. Start Ollama: ollama serve\n` +
          `  2. Pull the model: ollama pull ${this.model}`
        );
      }
      throw new Error(
        `Ollama streaming completion failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getContextWindow(): number {
    return this.contextWindow;
  }

  getModelName(): string {
    return this.model;
  }

  supportsFunctionCalling(): boolean {
    // Most Ollama models support function calling through the OpenAI-compatible API
    return true;
  }
}
