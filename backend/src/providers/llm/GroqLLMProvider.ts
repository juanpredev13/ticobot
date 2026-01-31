import OpenAI from 'openai';
import type {
  ILLMProvider,
  LLMMessage,
  GenerationOptions,
  LLMResponse,
} from '@ticobot/shared';
import type { Env } from '../../config/env.js';

/**
 * Context window sizes for Groq models
 */
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'llama-3.3-70b-versatile': 128000,
  'llama-3.1-70b-versatile': 128000,
  'llama-3.1-8b-instant': 128000,
  'llama3-70b-8192': 8192,
  'llama3-8b-8192': 8192,
  'mixtral-8x7b-32768': 32768,
  'gemma2-9b-it': 8192,
};

/**
 * Groq LLM Provider
 * Implements ILLMProvider using Groq's OpenAI-compatible API
 * Extremely fast inference with free tier
 */
export class GroqLLMProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;
  private contextWindow: number;

  constructor(env: Env) {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required for Groq provider');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
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
        throw new Error('No completion returned from Groq');
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
      if (error instanceof Error && error.message.includes('rate_limit')) {
        throw new Error(
          'Groq rate limit exceeded. Free tier has limits per minute/day. Wait a moment and try again.'
        );
      }
      throw new Error(
        `Groq completion failed: ${error instanceof Error ? error.message : String(error)}`
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
      if (error instanceof Error && error.message.includes('rate_limit')) {
        throw new Error(
          'Groq rate limit exceeded. Free tier has limits per minute/day. Wait a moment and try again.'
        );
      }
      throw new Error(
        `Groq streaming completion failed: ${error instanceof Error ? error.message : String(error)}`
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
    return true;
  }
}
