# Provider Abstraction Requirements

## Why Provider Abstraction?

Provider abstraction is **CRITICAL** for TicoBot because it:

1. **Prevents Vendor Lock-in**: Avoid dependency on any single LLM or database provider
2. **Enables Cost Optimization**: Switch to cheaper providers when appropriate
3. **Improves Reliability**: Implement fallback providers for resilience
4. **Facilitates Testing**: Compare different providers' quality and performance
5. **Future-Proofs the System**: Easily adopt new providers as they emerge
6. **Supports Development**: Use free/cheap providers in dev, premium in production

---

## Architecture Pattern

### Dependency Inversion Principle
- High-level modules (RAG pipeline) depend on abstractions, not concrete implementations
- Both high-level and low-level modules depend on interfaces
- Interfaces defined by business needs, not provider capabilities

### Adapter Pattern
- Each provider has an adapter that implements the standard interface
- Adapters translate between provider-specific APIs and our interfaces
- Swapping providers requires no changes to business logic

### Factory Pattern
- Centralized factory creates provider instances based on configuration
- Runtime selection via environment variables
- Type-safe provider instantiation

---

## Required Provider Interfaces

### 1. IEmbeddingProvider

**Purpose**: Generate vector embeddings from text

**Interface**:
```typescript
interface IEmbeddingProvider {
  /**
   * Generate embedding for a single text string
   * @param text - Input text to embed
   * @returns Vector embedding as number array
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts (batch operation)
   * @param texts - Array of input texts
   * @returns Array of vector embeddings
   */
  generateBatch(texts: string[]): Promise<number[][]>;

  /**
   * Get the dimension of embeddings produced by this provider
   * @returns Embedding dimension (e.g., 1536 for OpenAI)
   */
  getDimension(): number;

  /**
   * Get the maximum input length supported
   * @returns Max tokens/characters
   */
  getMaxInputLength(): number;
}
```

**Required Implementations**:
- OpenAI (text-embedding-3-small, text-embedding-3-large)
- Cohere (embed-multilingual-v3.0)

**Nice-to-Have**:
- Voyage AI
- Local embeddings (sentence-transformers)

---

### 2. IVectorStore

**Purpose**: Store and search vector embeddings

**Interface**:
```typescript
interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
}

interface SearchFilters {
  party?: string;
  year?: number;
  section?: string;
  [key: string]: any;
}

interface SearchResult extends VectorDocument {
  similarity: number;
}

interface IVectorStore {
  /**
   * Insert or update documents in vector store
   * @param documents - Documents with embeddings and metadata
   */
  upsert(documents: VectorDocument[]): Promise<void>;

  /**
   * Search for similar vectors
   * @param queryEmbedding - Query vector
   * @param k - Number of results to return
   * @param filters - Optional metadata filters
   * @returns Top-k similar documents with similarity scores
   */
  similaritySearch(
    queryEmbedding: number[],
    k: number,
    filters?: SearchFilters
  ): Promise<SearchResult[]>;

  /**
   * Delete documents by ID or filters
   * @param ids - Document IDs to delete
   */
  delete(ids: string[]): Promise<void>;

  /**
   * Get document by ID
   * @param id - Document ID
   */
  getById(id: string): Promise<VectorDocument | null>;

  /**
   * Count total documents
   * @param filters - Optional filters
   */
  count(filters?: SearchFilters): Promise<number>;
}
```

**Required Implementations**:
- Supabase (pgvector)

**Nice-to-Have**:
- Pinecone
- Qdrant
- Weaviate
- Chroma (local development)

---

### 3. ILLMProvider

**Purpose**: Generate answers using language models

**Interface**:
```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

interface ILLMProvider {
  /**
   * Generate completion from messages
   * @param messages - Conversation messages
   * @param options - Generation options (temperature, max_tokens, etc.)
   */
  generateCompletion(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
    }
  ): Promise<LLMResponse>;

  /**
   * Get the context window size
   * @returns Maximum tokens in context window
   */
  getContextWindow(): number;

  /**
   * Get the model name/identifier
   */
  getModelName(): string;
}
```

**Required Implementations**:
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic Claude (3.5 Sonnet)
- Google Gemini (Flash, Pro)
- Groq (Llama 3.1 70B)

**Nice-to-Have**:
- Local models via Ollama
- Mistral
- Cohere

---

### 4. IDatabaseProvider

**Purpose**: Store application metadata (not vectors)

**Interface**:
```typescript
interface Document {
  id: string;
  party: string;
  candidate: string;
  year: number;
  source_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  page_count?: number;
  chunk_count?: number;
  created_at: Date;
  updated_at: Date;
}

interface IDatabaseProvider {
  /**
   * Store or update document metadata
   */
  upsertDocument(doc: Document): Promise<void>;

  /**
   * Get document by ID
   */
  getDocument(id: string): Promise<Document | null>;

  /**
   * List all documents with optional filters
   */
  listDocuments(filters?: Partial<Document>): Promise<Document[]>;

  /**
   * Update document status
   */
  updateStatus(id: string, status: Document['status']): Promise<void>;
}
```

**Required Implementations**:
- Supabase (PostgreSQL)

**Nice-to-Have**:
- SQLite (local development)
- MongoDB

---

## Provider Configuration

### Environment-Based Selection

```bash
# Embedding Provider
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Vector Store
VECTOR_STORE=supabase
SUPABASE_URL=https://...
SUPABASE_KEY=...

# LLM Provider
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_PROVIDER=supabase
```

### Provider Factory

```typescript
class ProviderFactory {
  static createEmbeddingProvider(): IEmbeddingProvider {
    const provider = process.env.EMBEDDING_PROVIDER;
    switch (provider) {
      case 'openai':
        return new OpenAIEmbeddingAdapter();
      case 'cohere':
        return new CohereEmbeddingAdapter();
      default:
        throw new Error(`Unknown embedding provider: ${provider}`);
    }
  }

  static createVectorStore(): IVectorStore {
    // Similar logic
  }

  static createLLMProvider(): ILLMProvider {
    // Similar logic
  }
}
```

---

## Provider Requirements

### For All Providers

1. **Error Handling**: Graceful handling of API failures, rate limits, network issues
2. **Retry Logic**: Exponential backoff for transient failures
3. **Logging**: Detailed logs for debugging
4. **Metrics**: Track usage, costs, latency
5. **Validation**: Validate inputs and outputs
6. **Type Safety**: Full TypeScript type coverage

### For Embedding Providers

- Support batch processing (50-100 texts per batch)
- Handle rate limiting appropriately
- Return consistent embedding dimensions
- Validate input length against model limits

### For Vector Stores

- Support efficient similarity search (< 100ms for 10K vectors)
- Enable metadata filtering
- Handle concurrent writes safely
- Support batch upserts

### For LLM Providers

- Streaming support (nice-to-have)
- Proper token counting
- Cost tracking per request
- Context window management

---

## Testing Requirements

### Unit Tests
- Test each adapter independently
- Mock external API calls
- Validate interface compliance

### Integration Tests
- Test with real provider APIs (dev accounts)
- Verify end-to-end functionality
- Compare results across providers

### Provider Switching Tests
- Verify seamless switching between providers
- Ensure no data loss during switches
- Validate configuration changes work correctly

---

## Documentation Requirements

### For Each Provider
- Setup instructions (API keys, configuration)
- Cost analysis (per operation)
- Rate limits and quotas
- Known limitations
- Performance characteristics

### For Adding New Providers
- Step-by-step guide
- Template adapter code
- Checklist for interface compliance
- Testing instructions
