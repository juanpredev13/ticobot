# Interface Definitions

## Overview

This document defines all critical interfaces (ports) for the TicoBot system. These interfaces enable the **Ports & Adapters** pattern, allowing different implementations to be swapped without changing business logic.

---

## Core Entities

### Document

```typescript
interface Document {
  id: string;                    // Unique identifier (e.g., "PLN_2026")
  party: string;                 // Political party name (e.g., "PLN")
  candidate: string;             // Presidential candidate name
  year: number;                  // Election year (2026)
  title: string;                 // Document title
  pdfUrl: string;                // Original TSE PDF URL
  storageUrl?: string;           // Cloud storage URL
  fileSize: number;              // File size in bytes
  pageCount: number;             // Number of pages
  extractedText?: string;        // Full extracted text
  createdAt: Date;               // Ingestion timestamp
  updatedAt: Date;               // Last update timestamp
  metadata: Record<string, any>; // Additional metadata
}
```

### Chunk

```typescript
interface Chunk {
  id: string;                    // Unique identifier (e.g., "PLN_2026_pg12_chunk003")
  documentId: string;            // Parent document ID
  content: string;               // Chunk text content
  chunkIndex: number;            // Position in document (0-based)
  charStart: number;             // Start position in original text
  charEnd: number;               // End position in original text
  embedding?: number[];          // Vector embedding (1536 dimensions)
  metadata: ChunkMetadata;       // Rich metadata
  createdAt: Date;               // Creation timestamp
}

interface ChunkMetadata {
  party: string;                 // Political party
  candidate: string;             // Candidate name
  year: number;                  // Election year
  page: number;                  // Page number in PDF
  section?: string;              // Section/topic (if detected)
  source: string;                // Source URL
  chunkSize: number;             // Character count
  embeddingModel?: string;       // Model used for embedding
  [key: string]: any;            // Additional metadata
}
```

### SearchResult

```typescript
interface SearchResult {
  chunk: Chunk;                  // The matched chunk
  score: number;                 // Similarity score (0-1)
  rank: number;                  // Result rank (1-based)
  highlights?: string[];         // Text highlights/snippets
}

interface SearchResponse {
  query: string;                 // Original query
  results: SearchResult[];       // Search results
  totalResults: number;          // Total matches
  processingTimeMs: number;      // Query processing time
  metadata?: {
    embeddingModel: string;
    vectorProvider: string;
    filters?: Record<string, any>;
  };
}
```

### Message (Chat)

```typescript
interface Message {
  id: string;                    // Unique message ID
  role: 'user' | 'assistant' | 'system';
  content: string;               // Message content
  sources?: SearchResult[];      // RAG sources (for assistant messages)
  timestamp: Date;               // Message timestamp
  metadata?: {
    model?: string;              // LLM model used
    tokensUsed?: number;         // Token count
    processingTimeMs?: number;   // Generation time
  };
}

interface ChatSession {
  id: string;                    // Session ID
  messages: Message[];           // Conversation history
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Provider Interfaces (Ports)

### LLMProvider

Interface for language model providers (OpenAI, Claude, Gemini, Ollama).

```typescript
interface LLMProvider {
  /**
   * Generate text completion for a prompt
   */
  generateText(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * Generate streaming text completion
   */
  streamText(prompt: string, options?: LLMOptions): AsyncGenerator<string, void, void>;

  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Get model name
   */
  getModel(): string;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

interface LLMOptions {
  temperature?: number;          // Randomness (0-1, default: 0.7)
  maxTokens?: number;            // Max output tokens (default: 1000)
  topP?: number;                 // Nucleus sampling (default: 1)
  frequencyPenalty?: number;     // Repetition penalty (default: 0)
  presencePenalty?: number;      // Topic diversity (default: 0)
  stop?: string[];               // Stop sequences
  systemPrompt?: string;         // System message
}

interface LLMResponse {
  text: string;                  // Generated text
  model: string;                 // Model used
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: 'stop' | 'length' | 'error';
  metadata?: Record<string, any>;
}
```

### EmbeddingProvider

Interface for embedding generation providers.

```typescript
interface EmbeddingProvider {
  /**
   * Generate embeddings for text(s)
   */
  generateEmbeddings(texts: string[]): Promise<EmbeddingResponse>;

  /**
   * Generate single embedding
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Get embedding dimensions
   */
  getDimensions(): number;

  /**
   * Get model name
   */
  getModel(): string;

  /**
   * Get provider name
   */
  getName(): string;
}

interface EmbeddingResponse {
  embeddings: number[][];        // Array of vectors
  model: string;                 // Model used
  dimensions: number;            // Vector dimensions
  tokensUsed: number;            // Total tokens processed
  metadata?: Record<string, any>;
}
```

### VectorProvider

Interface for vector database providers (Supabase, Pinecone, Qdrant, Weaviate).

```typescript
interface VectorProvider {
  /**
   * Insert or update vectors
   */
  upsertVectors(chunks: Chunk[]): Promise<UpsertResponse>;

  /**
   * Search for similar vectors
   */
  search(query: number[], options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Delete vectors by filter
   */
  deleteByFilter(filter: Filter): Promise<DeleteResponse>;

  /**
   * Delete vectors by IDs
   */
  deleteByIds(ids: string[]): Promise<DeleteResponse>;

  /**
   * Get vector by ID
   */
  getById(id: string): Promise<Chunk | null>;

  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

interface SearchOptions {
  topK?: number;                 // Number of results (default: 5)
  minScore?: number;             // Minimum similarity score (0-1)
  filter?: Filter;               // Metadata filters
  includeMetadata?: boolean;     // Include metadata (default: true)
  includeVectors?: boolean;      // Include vectors (default: false)
}

interface Filter {
  party?: string | string[];     // Filter by party
  year?: number;                 // Filter by year
  section?: string;              // Filter by section
  page?: number | { min: number; max: number }; // Filter by page
  [key: string]: any;            // Custom filters
}

interface UpsertResponse {
  success: boolean;
  upsertedCount: number;
  failedCount: number;
  errors?: Array<{ id: string; error: string }>;
}

interface DeleteResponse {
  success: boolean;
  deletedCount: number;
}
```

### DatabaseProvider

Interface for general database operations (metadata storage).

```typescript
interface DatabaseProvider {
  /**
   * Save document metadata
   */
  saveDocument(document: Document): Promise<Document>;

  /**
   * Get document by ID
   */
  getDocument(id: string): Promise<Document | null>;

  /**
   * List all documents
   */
  listDocuments(filter?: DocumentFilter): Promise<Document[]>;

  /**
   * Update document
   */
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;

  /**
   * Delete document
   */
  deleteDocument(id: string): Promise<boolean>;

  /**
   * Save chunks (batch)
   */
  saveChunks(chunks: Chunk[]): Promise<Chunk[]>;

  /**
   * Get chunks by document ID
   */
  getChunksByDocumentId(documentId: string): Promise<Chunk[]>;

  /**
   * Get provider name
   */
  getName(): string;
}

interface DocumentFilter {
  party?: string | string[];
  year?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  [key: string]: any;
}
```

### StorageProvider

Interface for file storage providers (Supabase Storage, AWS S3, etc.).

```typescript
interface StorageProvider {
  /**
   * Upload file
   */
  uploadFile(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResponse>;

  /**
   * Download file
   */
  downloadFile(path: string): Promise<Buffer>;

  /**
   * Delete file
   */
  deleteFile(path: string): Promise<boolean>;

  /**
   * Get file URL
   */
  getFileUrl(path: string): Promise<string>;

  /**
   * Check if file exists
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Get provider name
   */
  getName(): string;
}

interface UploadOptions {
  contentType?: string;          // MIME type
  metadata?: Record<string, string>; // Custom metadata
  isPublic?: boolean;            // Public access (default: false)
}

interface UploadResponse {
  success: boolean;
  path: string;                  // Stored file path
  url: string;                   // Access URL
  size: number;                  // File size in bytes
}
```

---

## Use Case Interfaces

### IngestPDFUseCase

```typescript
interface IngestPDFUseCase {
  /**
   * Ingest a single PDF
   */
  execute(pdfUrl: string): Promise<IngestResult>;

  /**
   * Ingest multiple PDFs
   */
  executeBatch(pdfUrls: string[]): Promise<BatchIngestResult>;
}

interface IngestResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  processingTimeMs: number;
  errors?: string[];
  metadata: {
    pdfUrl: string;
    party: string;
    fileSize: number;
    pageCount: number;
  };
}

interface BatchIngestResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: IngestResult[];
  totalProcessingTimeMs: number;
}
```

### SearchUseCase

```typescript
interface SearchUseCase {
  /**
   * Execute semantic search
   */
  execute(query: string, options?: SearchOptions): Promise<SearchResponse>;
}
```

### ChatUseCase

```typescript
interface ChatUseCase {
  /**
   * Send message and get RAG-enhanced response
   */
  execute(message: string, sessionId?: string): Promise<ChatResponse>;

  /**
   * Get chat session history
   */
  getSession(sessionId: string): Promise<ChatSession>;
}

interface ChatResponse {
  message: Message;              // Assistant's response
  sessionId: string;             // Chat session ID
  sources: SearchResult[];       // RAG sources used
  metadata: {
    model: string;
    tokensUsed: number;
    processingTimeMs: number;
    relevantChunks: number;
  };
}
```

---

## Provider Registry Interface

### ProviderRegistry

```typescript
interface ProviderRegistry {
  /**
   * Register LLM provider
   */
  registerLLM(name: string, provider: LLMProvider): void;

  /**
   * Get LLM provider by name
   */
  getLLM(name: string): LLMProvider;

  /**
   * Get current LLM provider
   */
  getCurrentLLM(): LLMProvider;

  /**
   * Set current LLM provider
   */
  setCurrentLLM(name: string): void;

  /**
   * Register embedding provider
   */
  registerEmbedding(name: string, provider: EmbeddingProvider): void;

  /**
   * Get embedding provider
   */
  getEmbedding(name: string): EmbeddingProvider;

  /**
   * Register vector provider
   */
  registerVector(name: string, provider: VectorProvider): void;

  /**
   * Get vector provider
   */
  getVector(name: string): VectorProvider;

  /**
   * Get current vector provider
   */
  getCurrentVector(): VectorProvider;

  /**
   * Set current vector provider
   */
  setCurrentVector(name: string): void;

  /**
   * Register database provider
   */
  registerDatabase(name: string, provider: DatabaseProvider): void;

  /**
   * Get database provider
   */
  getDatabase(name: string): DatabaseProvider;

  /**
   * Register storage provider
   */
  registerStorage(name: string, provider: StorageProvider): void;

  /**
   * Get storage provider
   */
  getStorage(name: string): StorageProvider;

  /**
   * List all registered providers
   */
  listProviders(): ProviderList;
}

interface ProviderList {
  llm: string[];
  embedding: string[];
  vector: string[];
  database: string[];
  storage: string[];
}
```

---

## Configuration Interfaces

### AppConfig

```typescript
interface AppConfig {
  environment: 'development' | 'staging' | 'production';

  providers: {
    llm: {
      default: string;           // Default LLM provider name
      openai?: OpenAIConfig;
      claude?: ClaudeConfig;
      gemini?: GeminiConfig;
      ollama?: OllamaConfig;
    };

    embedding: {
      default: string;
      openai?: OpenAIEmbeddingConfig;
    };

    vector: {
      default: string;
      supabase?: SupabaseVectorConfig;
      pinecone?: PineconeConfig;
      qdrant?: QdrantConfig;
      weaviate?: WeaviateConfig;
    };

    database: {
      default: string;
      postgres?: PostgresConfig;
    };

    storage: {
      default: string;
      supabase?: SupabaseStorageConfig;
      s3?: S3Config;
    };
  };

  rag: {
    chunkSize: number;           // Target chunk size
    chunkOverlap: number;        // Overlap size
    topK: number;                // Default search results
    minScore: number;            // Minimum similarity score
  };

  api: {
    port: number;
    corsOrigins: string[];
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
}
```

### Provider-Specific Configs

```typescript
interface OpenAIConfig {
  apiKey: string;
  model: string;                 // e.g., "gpt-4.1-turbo"
  baseUrl?: string;
}

interface ClaudeConfig {
  apiKey: string;
  model: string;                 // e.g., "claude-3-5-sonnet-20241022"
}

interface SupabaseVectorConfig {
  url: string;
  apiKey: string;
  tableName?: string;            // Default: "chunks"
}

interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
}
```

---

## Validation Interfaces

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}
```

---

## Next Steps

These interfaces will be implemented in:
1. **Task 1.4**: Provider Abstraction Layer (interface definitions in `shared/types`)
2. **Task 1.5**: Backend Folder Structure (organize by layer)
3. **Task 1.6**: RAG Pipeline Design (implement use cases)

All concrete implementations (adapters) must conform to these interfaces.
