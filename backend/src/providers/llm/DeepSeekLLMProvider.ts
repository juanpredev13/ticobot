import OpenAI from 'openai';
import type {
  ILLMProvider,
  LLMMessage,
  GenerationOptions,
  LLMResponse,
} from '@ticobot/shared';
import type { Env } from '../../config/env.js';

/**
 * DeepSeek LLM Provider
 * Implements ILLMProvider using DeepSeek's API (OpenAI-compatible)
 */
export class DeepSeekLLMProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;
  private contextWindow: number;

  constructor(env: Env) {
    if (!env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is required for DeepSeek LLM provider');
    }

    // DeepSeek API is OpenAI-compatible, so we use the OpenAI client
    this.client = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL,
    });

    this.model = env.DEEPSEEK_MODEL;
    // DeepSeek-V3 has 64K context window
    this.contextWindow = 64000;
  }

  async generateCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No completion returned from DeepSeek');
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
      throw new Error(
        `DeepSeek completion failed: ${error instanceof Error ? error.message : String(error)}`
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
        temperature: options?.temperature,
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
      throw new Error(
        `DeepSeek streaming completion failed: ${error instanceof Error ? error.message : String(error)}`
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
    // DeepSeek supports function calling
    return true;
  }
}
