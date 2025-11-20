# Technical Implementation Guide - Provider Abstraction Layer

## Overview

This document provides a comprehensive technical reference for the Provider Abstraction Layer implementation in TicoBot. This layer is the foundation of the backend architecture, enabling vendor-independent integration of AI services, vector databases, and data storage.

## Architecture Pattern

### Design Patterns Used

1. **Dependency Inversion Principle (SOLID)**
   - High-level modules (use cases) depend on abstractions (interfaces)
   - Low-level modules (providers) implement abstractions
   - Enables loose coupling and testability

2. **Adapter Pattern**
   - Each provider is an adapter that implements a common interface
   - External APIs are adapted to our internal contracts
   - Example: `OpenAILLMProvider` adapts OpenAI SDK to `ILLMProvider`

3. **Factory Pattern**
   - `ProviderFactory` centralizes provider instantiation
   - Runtime provider selection based on environment configuration
   - Singleton pattern for resource efficiency

4. **Ports & Adapters (Hexagonal Architecture)**
   - **Ports**: Interfaces defined in `@ticobot/shared`
   - **Adapters**: Concrete implementations in `backend/src/providers/`
   - Business logic depends only on ports, not adapters

## Project Structure

### Monorepo Organization

```
ticobot/
├── shared/                          # Shared types and interfaces
│   ├── src/
│   │   ├── interfaces/             # Provider contracts (Ports)
│   │   │   ├── ILLMProvider.ts
│   │   │   ├── IEmbeddingProvider.ts
│   │   │   ├── IVectorStore.ts
│   │   │   └── IDatabaseProvider.ts
│   │   ├── types/
│   │   │   └── common.ts           # Shared type definitions
│   │   └── index.ts                # Public API
│   ├── package.json                # ESM, composite project
│   └── tsconfig.json
├── backend/                         # Backend implementation
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # Zod schema validation
│   │   ├── factory/
│   │   │   ├── ProviderFactory.ts  # Provider factory
│   │   │   └── ProviderFactory.test.ts
│   │   ├── providers/              # Adapter implementations
│   │   │   ├── embedding/
│   │   │   │   └── OpenAIEmbeddingProvider.ts
│   │   │   ├── llm/
│   │   │   │   ├── OpenAILLMProvider.ts
│   │   │   │   └── DeepSeekLLMProvider.ts
│   │   │   ├── vector/
│   │   │   │   └── SupabaseVectorStore.ts
│   │   │   └── database/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── pnpm-workspace.yaml             # Monorepo workspace config
├── package.json                     # Root package
└── .gitignore
```

## Technical Decisions

### 1. ESM Modules (Not CommonJS)

**Decision**: Use ECMAScript Modules exclusively

**Rationale**:
- Modern JavaScript standard
- Better tree-shaking and code splitting
- Native async module loading
- Future-proof for Deno/Bun compatibility

**Implementation**:
```json
// package.json
{
  "type": "module"
}
```

```typescript
// Always use .js extension in imports (TypeScript ESM requirement)
import { ILLMProvider } from '@ticobot/shared';
import { env } from '../config/env.js';  // Note the .js extension
```

### 2. TypeScript Configuration

**Decision**: Strict TypeScript with composite projects

**Rationale**:
- Catch errors at compile time
- Better IDE support
- Composite projects enable incremental builds
- Shared types prevent duplication

**Key Settings**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "composite": true,              // For project references
    "strict": true,                 // All strict checks
    "isolatedModules": true,        // Required for ESM
    "skipLibCheck": true,           // Faster builds
    "declaration": true,            // Generate .d.ts files
    "sourceMap": true              // For debugging
  }
}
```

### 3. Environment Configuration with Zod

**Decision**: Use Zod for runtime validation

**Rationale**:
- Type-safe at runtime, not just compile time
- Clear error messages for misconfiguration
- Single source of truth for env schema
- Automatic TypeScript type inference

**Implementation**:
```typescript
const envSchema = z.object({
  LLM_PROVIDER: z.enum(['openai', 'deepseek', 'anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  // ... more fields
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
```

**Benefits**:
- If env validation fails, app crashes early with clear error
- `env` variable is fully typed
- No need to manually write TypeScript types

### 4. Dynamic Imports in Factory

**Decision**: Use dynamic imports for provider loading

**Rationale**:
- Only load providers that are actually configured
- Reduces initial bundle size
- Faster application startup
- Prevents loading unused dependencies

**Implementation**:
```typescript
static async getLLMProvider(): Promise<ILLMProvider> {
  switch (env.LLM_PROVIDER) {
    case 'openai': {
      const { OpenAILLMProvider } = await import('../providers/llm/OpenAILLMProvider.js');
      this.llmProviderInstance = new OpenAILLMProvider(env);
      return this.llmProviderInstance;
    }
    // ... other cases
  }
}
```

**Trade-off**: Methods become async, but the benefits outweigh this minor inconvenience.

### 5. Singleton Pattern for Providers

**Decision**: Reuse provider instances across application

**Rationale**:
- API clients should not be recreated on every request
- Connection pooling and caching work better with singletons
- Reduced memory footprint
- Consistent configuration

**Implementation**:
```typescript
export class ProviderFactory {
  private static llmProviderInstance: ILLMProvider | null = null;

  static async getLLMProvider(): Promise<ILLMProvider> {
    if (this.llmProviderInstance) {
      return this.llmProviderInstance;  // Return cached instance
    }
    // ... create and cache instance
  }

  static resetInstances(): void {
    // For testing purposes
    this.llmProviderInstance = null;
  }
}
```

## Interface Contracts (Ports)

### ILLMProvider

**Purpose**: Abstract language model capabilities

**Key Methods**:
```typescript
interface ILLMProvider {
  generateCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): Promise<LLMResponse>;

  generateStreamingCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): AsyncIterableIterator<string>;

  getContextWindow(): number;
  getModelName(): string;
  supportsFunctionCalling(): boolean;
}
```

**Design Notes**:
- Supports both streaming and non-streaming
- Returns normalized response format regardless of provider
- Metadata methods for capability discovery

### IEmbeddingProvider

**Purpose**: Generate vector embeddings from text

**Key Methods**:
```typescript
interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<EmbeddingResponse>;
  generateBatch(texts: string[]): Promise<BatchEmbeddingResponse>;
  getDimension(): number;
  getMaxInputLength(): number;
  getModelName(): string;
}
```

**Design Notes**:
- Batch operations for efficiency
- Dimension info needed for vector store configuration
- Token limits prevent API errors

### IVectorStore

**Purpose**: Store and search vector embeddings

**Key Methods**:
```typescript
interface IVectorStore {
  upsert(documents: VectorDocument[]): Promise<void>;
  similaritySearch(
    queryEmbedding: number[],
    k: number,
    filters?: Record<string, any>
  ): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  getById(id: string): Promise<VectorDocument | null>;
  count(filters?: Record<string, any>): Promise<number>;
  initialize(): Promise<void>;
}
```

**Design Notes**:
- CRUD operations for vector documents
- Similarity search is the core operation
- Metadata filtering for advanced queries
- Initialization for schema setup

### IDatabaseProvider

**Purpose**: Persist application data (documents, chunks, metadata)

**Key Methods**:
```typescript
interface IDatabaseProvider {
  // Document operations
  createDocument(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document>;
  getDocumentById(id: string): Promise<Document | null>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  listDocuments(options?: QueryOptions): Promise<Document[]>;

  // Chunk operations
  createChunk(chunk: Omit<Chunk, 'id' | 'createdAt'>): Promise<Chunk>;
  createChunks(chunks: Omit<Chunk, 'id' | 'createdAt'>[]): Promise<Chunk[]>;
  // ... more methods

  // Health
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

**Design Notes**:
- Separate operations for documents and chunks
- Batch chunk creation for PDF processing
- Connection management for resource cleanup
- QueryOptions for pagination and filtering

## Provider Implementations (Adapters)

### OpenAILLMProvider

**Technology**: OpenAI SDK v4.28.0

**Key Implementation Details**:

1. **Client Initialization**:
```typescript
this.client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
```

2. **Completion Generation**:
```typescript
const response = await this.client.chat.completions.create({
  model: this.model,
  messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
  temperature: options?.temperature,
  max_tokens: options?.maxTokens,
  // ... other options
});
```

3. **Response Normalization**:
```typescript
return {
  content: choice.message.content,
  model: response.model,
  usage: {
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
  },
  finishReason: choice.finish_reason as LLMResponse['finishReason'],
};
```

4. **Context Window Detection**:
```typescript
private getContextWindowForModel(model: string): number {
  if (model.includes('gpt-4-turbo')) return 128000;
  if (model.includes('gpt-4')) return 8192;
  if (model.includes('gpt-3.5-turbo-16k')) return 16384;
  return 4096;
}
```

**Error Handling**:
```typescript
try {
  // API call
} catch (error) {
  throw new Error(
    `OpenAI completion failed: ${error instanceof Error ? error.message : String(error)}`
  );
}
```

### DeepSeekLLMProvider

**Technology**: OpenAI-compatible API

**Key Implementation Details**:

1. **Using OpenAI SDK with Custom Base URL**:
```typescript
this.client = new OpenAI({
  apiKey: env.DEEPSEEK_API_KEY,
  baseURL: env.DEEPSEEK_BASE_URL,  // https://api.deepseek.com
});
```

2. **Why This Works**:
   - DeepSeek API is OpenAI-compatible
   - Same request/response format
   - Can reuse OpenAI SDK infrastructure
   - Only need to change base URL and API key

3. **Context Window**:
```typescript
this.contextWindow = 64000;  // DeepSeek-V3 has 64K context
```

**Benefits**:
- Minimal code duplication
- Same error handling as OpenAI
- Easy to add more OpenAI-compatible providers

### OpenAIEmbeddingProvider

**Technology**: OpenAI Embeddings API

**Key Implementation Details**:

1. **Single Embedding**:
```typescript
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
```

2. **Batch Embeddings**:
```typescript
const response = await this.client.embeddings.create({
  model: this.model,
  input: texts,  // Array of strings
  encoding_format: 'float',
});

return {
  embeddings: response.data.map((item) => item.embedding),
  model: this.model,
  usage: { /* ... */ },
};
```

3. **Dimension Detection**:
```typescript
// text-embedding-3-small: 1536
// text-embedding-3-large: 3072
this.dimension = this.model.includes('large') ? 3072 : 1536;
```

**Optimization Notes**:
- Batch API calls are more efficient than individual calls
- Use `encoding_format: 'float'` for pgvector compatibility
- Cache dimension to avoid recalculation

### SupabaseVectorStore

**Technology**: Supabase Client + pgvector

**Key Implementation Details**:

1. **Client Setup**:
```typescript
this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,  // Server-side, no need for refresh
    persistSession: false,    // Server-side, no session
  },
});
```

2. **Upsert Documents**:
```typescript
const { error } = await this.client.from(this.tableName).upsert(
  documents.map((doc) => ({
    id: doc.id,
    content: doc.content,
    embedding: doc.embedding,
    metadata: doc.metadata,
  })),
  { onConflict: 'id' }  // Update if exists
);
```

3. **Similarity Search**:
```typescript
// Uses custom RPC function for vector similarity
const { data, error } = await this.client.rpc('match_documents', {
  query_embedding: queryEmbedding,
  match_count: k,
  filter: filters || {},
});
```

**Database Schema Required**:
```sql
CREATE TABLE vector_documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),  -- Dimension must match embedding model
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ON vector_documents USING ivfflat (embedding vector_cosine_ops);

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count INT,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vector_documents.id,
    vector_documents.content,
    vector_documents.embedding,
    vector_documents.metadata,
    1 - (vector_documents.embedding <=> query_embedding) AS similarity
  FROM vector_documents
  WHERE (filter = '{}'::jsonb OR metadata @> filter)
  ORDER BY vector_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Performance Considerations**:
- IVFFlat index for fast similarity search
- Cosine similarity operator `<=>`
- Metadata filtering with JSONB containment `@>`

## Configuration Management

### Environment Variables

**Structure**:
```bash
# Provider Selection (REQUIRED)
LLM_PROVIDER=openai|deepseek|anthropic|google|ollama
EMBEDDING_PROVIDER=openai|cohere|huggingface
VECTOR_STORE=supabase|pinecone|qdrant|weaviate
DATABASE_PROVIDER=supabase|postgresql

# Provider-specific Configuration
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
SUPABASE_URL=https://...
```

### Validation with Zod

**Schema Definition**:
```typescript
const envSchema = z.object({
  LLM_PROVIDER: z.enum(['openai', 'deepseek']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  // ... more fields
});
```

**Runtime Validation**:
```typescript
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}
```

**Benefits**:
- App crashes early if misconfigured
- Clear error messages
- No runtime surprises
- Type-safe configuration access

## Testing Strategy

### Unit Tests for Factory

**Test Coverage**:
1. Provider selection based on environment
2. Singleton pattern behavior
3. Error handling for missing configuration
4. Instance reset for test isolation

**Example Test**:
```typescript
describe('ProviderFactory', () => {
  beforeEach(() => {
    ProviderFactory.resetInstances();
  });

  it('should select DeepSeek when LLM_PROVIDER=deepseek', async () => {
    process.env.LLM_PROVIDER = 'deepseek';
    process.env.DEEPSEEK_API_KEY = 'test-key';

    const provider = await ProviderFactory.getLLMProvider();
    expect(provider.getModelName()).toContain('deepseek');
  });

  it('should return same instance on subsequent calls', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';

    const provider1 = await ProviderFactory.getLLMProvider();
    const provider2 = await ProviderFactory.getLLMProvider();

    expect(provider1).toBe(provider2);  // Same object reference
  });
});
```

### Integration Tests for Providers

**Test Coverage**:
1. API call success scenarios
2. Error handling
3. Response format validation
4. Streaming behavior

**Example Test**:
```typescript
describe('OpenAILLMProvider', () => {
  it('should generate completion with correct format', async () => {
    const provider = new OpenAILLMProvider(testEnv);

    const response = await provider.generateCompletion([
      { role: 'user', content: 'Hello' }
    ]);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('model');
    expect(response).toHaveProperty('usage');
    expect(response.usage).toHaveProperty('totalTokens');
  });
});
```

## Performance Considerations

### 1. Lazy Loading

**Problem**: Loading all provider SDKs increases bundle size and startup time

**Solution**: Dynamic imports in factory
```typescript
case 'openai': {
  const { OpenAILLMProvider } = await import('../providers/llm/OpenAILLMProvider.js');
  // Only loaded if LLM_PROVIDER=openai
}
```

**Impact**:
- Faster startup time
- Smaller initial bundle
- Only load what you use

### 2. Singleton Pattern

**Problem**: Creating new API clients on every request wastes resources

**Solution**: Reuse provider instances
```typescript
if (this.llmProviderInstance) {
  return this.llmProviderInstance;
}
```

**Impact**:
- Connection pooling works correctly
- SDK internal caching effective
- Reduced memory usage

### 3. Batch Operations

**Problem**: Individual API calls for each embedding waste tokens and time

**Solution**: Batch embedding generation
```typescript
async generateBatch(texts: string[]): Promise<BatchEmbeddingResponse> {
  const response = await this.client.embeddings.create({
    model: this.model,
    input: texts,  // Array instead of single string
  });
  return { embeddings: response.data.map(item => item.embedding) };
}
```

**Impact**:
- Fewer API calls
- Lower latency
- Cost savings

## Error Handling Patterns

### 1. Provider-Specific Error Wrapping

**Pattern**:
```typescript
try {
  // Provider API call
} catch (error) {
  throw new Error(
    `OpenAI completion failed: ${error instanceof Error ? error.message : String(error)}`
  );
}
```

**Benefits**:
- Clear error context
- Easier debugging
- Consistent error format

### 2. Early Validation

**Pattern**:
```typescript
constructor(env: Env) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for OpenAI LLM provider');
  }
  // ... initialization
}
```

**Benefits**:
- Fail fast
- Clear configuration errors
- Prevent runtime surprises

### 3. Graceful Degradation

**Pattern**:
```typescript
const choice = response.choices[0];
if (!choice || !choice.message.content) {
  throw new Error('No completion returned from OpenAI');
}
```

**Benefits**:
- Handle edge cases
- Prevent null pointer errors
- Better error messages

## Future Extensibility

### Adding New Providers

**Steps**:
1. Update `env.ts` enum
2. Create provider class implementing interface
3. Add case to factory
4. Install dependencies
5. Update documentation

**Time Estimate**: 30-60 minutes for most providers

### Current Roadmap

**LLM Providers**:
- ✅ OpenAI
- ✅ DeepSeek
- ⏳ Anthropic Claude
- ⏳ Google Gemini
- ⏳ Ollama (local)

**Embedding Providers**:
- ✅ OpenAI
- ⏳ Cohere
- ⏳ HuggingFace

**Vector Stores**:
- ✅ Supabase pgvector
- ⏳ Pinecone
- ⏳ Qdrant
- ⏳ Weaviate

## Common Pitfalls and Solutions

### 1. Forgetting .js Extensions in Imports

**Problem**:
```typescript
import { env } from '../config/env';  // ❌ Won't work with ESM
```

**Solution**:
```typescript
import { env } from '../config/env.js';  // ✅ Correct
```

### 2. Using CommonJS Patterns

**Problem**:
```typescript
const { OpenAI } = require('openai');  // ❌ CommonJS
module.exports = { ... };  // ❌ CommonJS
```

**Solution**:
```typescript
import OpenAI from 'openai';  // ✅ ESM
export { ... };  // ✅ ESM
```

### 3. Not Handling Async Factory Methods

**Problem**:
```typescript
const provider = ProviderFactory.getLLMProvider();  // ❌ Missing await
```

**Solution**:
```typescript
const provider = await ProviderFactory.getLLMProvider();  // ✅ Await async
```

### 4. Missing Environment Variables

**Problem**: App crashes with cryptic errors

**Solution**: Use `.env.example` and validate with Zod
```bash
cp backend/.env.example backend/.env
# Edit .env with your keys
```

## Deployment Considerations

### Environment Variables in Production

**Best Practices**:
1. Never commit `.env` to git
2. Use secret management (AWS Secrets Manager, Vault, etc.)
3. Validate on startup with Zod
4. Use different keys for dev/staging/prod

**Example CI/CD**:
```yaml
# GitHub Actions
env:
  LLM_PROVIDER: ${{ secrets.LLM_PROVIDER }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

### Database Migrations

**Supabase Vector Store Requirement**:
- Must create table and RPC function before using
- Use Supabase migrations or SQL scripts
- Document required schema in deployment guide

## Monitoring and Observability

### Recommended Metrics

1. **Provider Usage**:
   - API call counts by provider
   - Error rates by provider
   - Response times by provider

2. **Cost Tracking**:
   - Tokens used per provider
   - API costs per request
   - Cost attribution by feature

3. **Performance**:
   - P50/P95/P99 latencies
   - Batch vs individual call ratios
   - Cache hit rates

### Logging Best Practices

```typescript
console.log('Using LLM provider:', env.LLM_PROVIDER);
console.log('Model:', this.model);
// ... API call ...
console.log('Tokens used:', response.usage.totalTokens);
```

## Conclusion

The Provider Abstraction Layer is a critical architectural component that enables:

- ✅ **Vendor Independence**: Switch providers via configuration
- ✅ **Cost Optimization**: Test different providers for cost/performance
- ✅ **Future-Proof**: Easy to add new providers as they emerge
- ✅ **Testability**: Mock providers for unit tests
- ✅ **Maintainability**: Changes to one provider don't affect others

This implementation follows industry best practices and SOLID principles, providing a solid foundation for the TicoBot platform.

## References

- [TypeScript ESM Guide](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Zod Documentation](https://zod.dev/)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-columns)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [DeepSeek API](https://platform.deepseek.com/api-docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
