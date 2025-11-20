/**
 * @ticobot/shared
 * Shared types and interfaces for TicoBot
 */

// Export all types
export type {
  VectorDocument,
  SearchResult,
  LLMMessage,
  GenerationOptions,
  LLMResponse,
  EmbeddingResponse,
  BatchEmbeddingResponse,
} from './types/common.js';

// Export all interfaces
export type { IEmbeddingProvider } from './interfaces/IEmbeddingProvider.js';
export type { IVectorStore } from './interfaces/IVectorStore.js';
export type { ILLMProvider } from './interfaces/ILLMProvider.js';
export type {
  IDatabaseProvider,
  Document,
  Chunk,
  QueryOptions,
} from './interfaces/IDatabaseProvider.js';
