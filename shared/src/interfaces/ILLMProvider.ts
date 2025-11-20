import type { LLMMessage, GenerationOptions, LLMResponse } from '../types/common.js';

/**
 * Interface for Large Language Model providers
 * Supports text generation with various AI models
 */
export interface ILLMProvider {
  /**
   * Generate a completion based on input messages
   * @param messages - Array of conversation messages
   * @param options - Optional generation parameters
   * @returns Promise with the generated response
   */
  generateCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): Promise<LLMResponse>;

  /**
   * Generate a streaming completion (for real-time responses)
   * @param messages - Array of conversation messages
   * @param options - Optional generation parameters
   * @returns AsyncIterator that yields response chunks
   */
  generateStreamingCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): AsyncIterableIterator<string>;

  /**
   * Get the context window size (maximum tokens) for this model
   * @returns Maximum number of tokens in context window
   */
  getContextWindow(): number;

  /**
   * Get the model name/identifier used by this provider
   * @returns Model name (e.g., "gpt-4", "claude-3-sonnet")
   */
  getModelName(): string;

  /**
   * Check if the model supports function calling
   * @returns True if function calling is supported
   */
  supportsFunctionCalling(): boolean;
}
