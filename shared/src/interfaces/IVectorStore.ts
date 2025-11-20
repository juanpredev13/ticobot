import type { VectorDocument, SearchResult } from '../types/common.js';

/**
 * Interface for vector database providers
 * Supports storing and searching vector embeddings
 */
export interface IVectorStore {
  /**
   * Insert or update documents in the vector store
   * @param documents - Array of documents with embeddings to upsert
   * @returns Promise that resolves when operation completes
   */
  upsert(documents: VectorDocument[]): Promise<void>;

  /**
   * Perform similarity search using a query embedding
   * @param queryEmbedding - The embedding vector to search with
   * @param k - Number of results to return
   * @param filters - Optional metadata filters to apply
   * @returns Promise with array of search results sorted by similarity
   */
  similaritySearch(
    queryEmbedding: number[],
    k: number,
    filters?: Record<string, any>
  ): Promise<SearchResult[]>;

  /**
   * Delete documents by IDs
   * @param ids - Array of document IDs to delete
   * @returns Promise that resolves when operation completes
   */
  delete(ids: string[]): Promise<void>;

  /**
   * Get a document by ID
   * @param id - The document ID
   * @returns Promise with the document or null if not found
   */
  getById(id: string): Promise<VectorDocument | null>;

  /**
   * Count total documents in the vector store
   * @param filters - Optional metadata filters to apply
   * @returns Promise with the count
   */
  count(filters?: Record<string, any>): Promise<number>;

  /**
   * Initialize the vector store (create indexes, tables, etc.)
   * @returns Promise that resolves when initialization completes
   */
  initialize(): Promise<void>;
}
