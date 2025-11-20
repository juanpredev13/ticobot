/**
 * Interface for database providers
 * Supports basic CRUD operations and metadata storage
 */

export interface Document {
  id: string;
  title: string;
  source: string;
  url: string;
  pageCount?: number;
  publicationDate?: Date;
  party?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface IDatabaseProvider {
  /**
   * Document operations
   */
  createDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document>;
  getDocumentById(id: string): Promise<Document | null>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  listDocuments(options?: QueryOptions): Promise<Document[]>;

  /**
   * Chunk operations
   */
  createChunk(chunk: Omit<Chunk, 'id' | 'createdAt'>): Promise<Chunk>;
  createChunks(chunks: Omit<Chunk, 'id' | 'createdAt'>[]): Promise<Chunk[]>;
  getChunkById(id: string): Promise<Chunk | null>;
  getChunksByDocumentId(documentId: string, options?: QueryOptions): Promise<Chunk[]>;
  deleteChunk(id: string): Promise<void>;
  deleteChunksByDocumentId(documentId: string): Promise<void>;

  /**
   * Connection and health
   */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}
