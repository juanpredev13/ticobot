import OpenAI from 'openai';
import type {
  ILLMProvider,
  LLMMessage,
  GenerationOptions,
  LLMResponse,
} from '@ticobot/shared';
import type { Env } from '../../config/env.js';

/**
 * OpenAI LLM Provider
 * Implements ILLMProvider using OpenAI's chat models
 */
export class OpenAILLMProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;
  private contextWindow: number;

  constructor(env: Env) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI LLM provider');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    this.model = env.OPENAI_LLM_MODEL;
    this.contextWindow = this.getContextWindowForModel(this.model);
  }

  private getContextWindowForModel(model: string): number {
    if (model.includes('gpt-4-turbo') || model.includes('gpt-4-1106')) {
      return 128000;
    } else if (model.includes('gpt-4')) {
      return 8192;
    } else if (model.includes('gpt-3.5-turbo-16k')) {
      return 16384;
    } else if (model.includes('gpt-3.5-turbo')) {
      return 4096;
    }
    return 4096;
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
        throw new Error('No completion returned from OpenAI');
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
        `OpenAI completion failed: ${error instanceof Error ? error.message : String(error)}`
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
        `OpenAI streaming completion failed: ${error instanceof Error ? error.message : String(error)}`
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
    return this.model.includes('gpt-4') || this.model.includes('gpt-3.5-turbo');
  }
}
