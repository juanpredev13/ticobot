# TASK: Provider Abstraction Layer (CRITICAL)

#ticobot #backlog

## Description

Implement the provider abstraction layer using Dependency Inversion + Adapter + Factory Pattern:
- Define TypeScript interfaces for all providers
- Implement factory pattern for provider instantiation
- Create adapter implementations for initial providers
- Environment-based provider configuration

## Why?

This is CRITICAL because it:
- Prevents vendor lock-in
- Enables cost optimization by switching providers
- Allows testing with different providers
- Future-proofs the application
- Follows SOLID principles

## Deliverables

- [ ] Interface definitions:
  - [ ] `IEmbeddingProvider` interface
  - [ ] `IVectorStore` interface
  - [ ] `ILLMProvider` interface
- [ ] Provider factory implementation:
  - [ ] `ProviderFactory.ts` with factory methods
  - [ ] Environment variable configuration
- [ ] Initial adapter implementations:
  - [ ] OpenAI embedding adapter
  - [ ] Supabase vector store adapter
  - [ ] OpenAI LLM adapter
- [ ] Provider configuration validation
- [ ] Documentation for adding new providers

## Related Documentation

- `Development/Phase 1 Architecture Analysis & System Design.md` - Section 1.4
- `Notes/Vector Database Alternatives for RAG.md`
- `Notes/LLM Providers Comparison - Cost & Performance.md`

## Code Structure

```typescript
// IEmbeddingProvider.ts
export interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatch(texts: string[]): Promise<number[][]>;
}

// IVectorStore.ts
export interface IVectorStore {
  upsert(documents: VectorDocument[]): Promise<void>;
  similaritySearch(queryEmbedding: number[], k: number, filters?: any): Promise<VectorDocument[]>;
}

// ILLMProvider.ts
export interface ILLMProvider {
  generateAnswer(prompt: string): Promise<string>;
}
```

Environment variables:
```
EMBEDDING_PROVIDER=openai
VECTOR_STORE=supabase
LLM_PROVIDER=openai
```

## Testing

- [ ] Unit tests for each interface
- [ ] Factory pattern tested with multiple providers
- [ ] Environment variable configuration tested
- [ ] Provider switching tested
- [ ] Error handling validated

## Dependencies

- Task 1.3: System Architecture Overview
- Task 1.5: Backend Folder Structure (can be done in parallel)

## Next Steps

After completion, proceed to:
- Task 1.6: RAG Pipeline Design
- Implement additional provider adapters (Groq, Claude, etc.)
