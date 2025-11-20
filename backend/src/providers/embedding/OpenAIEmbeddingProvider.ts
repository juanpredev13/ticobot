import OpenAI from 'openai';
import type {
  IEmbeddingProvider,
  EmbeddingResponse,
  BatchEmbeddingResponse,
} from '@ticobot/shared';
import type { Env } from '../../config/env.js';

/**
 * OpenAI Embedding Provider
 * Implements IEmbeddingProvider using OpenAI's embedding models
 */
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private dimension: number;
  private maxInputLength: number;

  constructor(env: Env) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI embedding provider');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    this.model = env.OPENAI_EMBEDDING_MODEL;

    // Set dimensions based on model
    // text-embedding-3-small: 1536, text-embedding-3-large: 3072
    this.dimension = this.model.includes('large') ? 3072 : 1536;
    this.maxInputLength = 8191; // tokens
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

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
        `OpenAI embedding generation failed: ${error instanceof Error ? error.message : String(error)}`
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
        `OpenAI batch embedding generation failed: ${error instanceof Error ? error.message : String(error)}`
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
