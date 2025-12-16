import OpenAI from 'openai';
import type {
  IEmbeddingProvider,
  EmbeddingResponse,
  BatchEmbeddingResponse,
} from '@ticobot/shared';
import type { Env } from '../../config/env.js';

/**
 * DeepSeek Embedding Provider
 * Implements IEmbeddingProvider using DeepSeek's API (OpenAI-compatible)
 * 
 * Note: DeepSeek API is OpenAI-compatible, so we use the OpenAI client
 * with a custom base URL pointing to DeepSeek's API.
 */
export class DeepSeekEmbeddingProvider implements IEmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private dimension: number;
  private maxInputLength: number;

  constructor(env: Env) {
    if (!env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is required for DeepSeek embedding provider');
    }

    // DeepSeek API is OpenAI-compatible, so we use the OpenAI client
    this.client = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    });

    // DeepSeek uses 'text-embedding' model for embeddings
    // If DEEPSEEK_EMBEDDING_MODEL is not set, use default
    this.model = (env as any).DEEPSEEK_EMBEDDING_MODEL || 'text-embedding';

    // DeepSeek embeddings are typically 1536 dimensions (similar to OpenAI text-embedding-3-small)
    // This may need adjustment based on actual DeepSeek API documentation
    this.dimension = 1536;
    this.maxInputLength = 8191; // tokens (same as OpenAI)
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      // Update dimension based on actual response if different
      if (response.data[0]?.embedding) {
        this.dimension = response.data[0].embedding.length;
      }

      return {
        embedding: response.data[0].embedding,
        model: this.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      throw new Error(
        `DeepSeek embedding generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async generateBatch(texts: string[]): Promise<BatchEmbeddingResponse> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      });

      // Update dimension based on actual response if different
      if (response.data[0]?.embedding) {
        this.dimension = response.data[0].embedding.length;
      }

      return {
        embeddings: response.data.map((item) => item.embedding),
        model: this.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      throw new Error(
        `DeepSeek batch embedding generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getDimension(): number {
    return this.dimension;
  }

  getMaxInputLength(): number {
    return this.maxInputLength;
  }

  getModelName(): string {
    return this.model;
  }
}

