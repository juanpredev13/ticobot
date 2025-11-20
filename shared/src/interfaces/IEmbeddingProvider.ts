import type { EmbeddingResponse, BatchEmbeddingResponse } from '../types/common.js';

/**
 * Interface for embedding providers
 * Supports generating embeddings for text using various AI models
 */
export interface IEmbeddingProvider {
  /**
   * Generate embedding for a single text
   * @param text - The input text to embed
   * @returns Promise with embedding vector and metadata
   */
  generateEmbedding(text: string): Promise<EmbeddingResponse>;

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts - Array of input texts to embed
   * @returns Promise with array of embedding vectors and metadata
   */
  generateBatch(texts: string[]): Promise<BatchEmbeddingResponse>;

  /**
   * Get the dimension size of embeddings produced by this provider
   * @returns The embedding dimension (e.g., 1536 for OpenAI text-embedding-3-small)
   */
  getDimension(): number;

  /**
   * Get the maximum input length (in tokens) supported by this provider
   * @returns Maximum number of tokens that can be embedded at once
   */
  getMaxInputLength(): number;

  /**
   * Get the model name/identifier used by this provider
   * @returns Model name (e.g., "text-embedding-3-small")
   */
  getModelName(): string;
}
