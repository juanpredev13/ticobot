# Phase 2.2: Backend RAG Query Pipeline Implementation

**GitHub Issue:** [#18](https://github.com/juanpredev13/ticobot/issues/18)
**Status:** Pending (starts after 2.1)
**Priority:** Critical (MVP)

## Overview

Implement the RAG query pipeline to search documents and generate answers.

## Pipeline Flow

```
User Query → Embed Query → Vector Search → Build Context → Generate Answer
```

## Components to Build

### 1. QueryEmbedder

**File:** `backend/src/rag/components/QueryEmbedder.ts`

```typescript
import { ProviderFactory } from '../../factory/ProviderFactory';

export class QueryEmbedder {
    async embed(query: string): Promise<number[]> {
        const embeddingProvider = await ProviderFactory.getEmbeddingProvider();
        const result = await embeddingProvider.generateEmbedding(query);
        return result.embedding;
    }
}
```

### 2. SemanticSearcher

**File:** `backend/src/rag/components/SemanticSearcher.ts`

```typescript
import { ProviderFactory } from '../../factory/ProviderFactory';

export class SemanticSearcher {
    async search(embedding: number[], topK: number = 5, filters?: any) {
        const vectorStore = await ProviderFactory.getVectorStore();

        const results = await vectorStore.similaritySearch(
            embedding,
            topK,
            filters
        );

        return results;
    }
}
```

### 3. ContextBuilder

**File:** `backend/src/rag/components/ContextBuilder.ts`

```typescript
export class ContextBuilder {
    build(chunks: any[], query: string): string {
        // Build context from retrieved chunks
        const context = chunks
            .map((chunk, i) => `[${i+1}] ${chunk.content}`)
            .join('\n\n');

        return `Context:\n${context}\n\nQuestion: ${query}`;
    }
}
```

### 4. ResponseGenerator

**File:** `backend/src/rag/components/ResponseGenerator.ts`

```typescript
import { ProviderFactory } from '../../factory/ProviderFactory';

export class ResponseGenerator {
    async generate(context: string, query: string) {
        const llmProvider = await ProviderFactory.getLLMProvider();

        const messages = [
            {
                role: 'system',
                content: 'You are an expert on Costa Rica government plans. Answer based on the provided context.'
            },
            {
                role: 'user',
                content: `${context}\n\nAnswer this question: ${query}`
            }
        ];

        const response = await llmProvider.generateCompletion(messages);

        return {
            answer: response.content,
            sources: this.extractSources(context),
            confidence: this.calculateConfidence(response)
        };
    }

    private extractSources(context: string) {
        // Extract source citations
        return [];
    }

    private calculateConfidence(response: any) {
        // Calculate confidence score
        return 0.85;
    }
}
```

### 5. RAGPipeline (Orchestrator)

**File:** `backend/src/rag/RAGPipeline.ts`

```typescript
import { QueryEmbedder } from './components/QueryEmbedder';
import { SemanticSearcher } from './components/SemanticSearcher';
import { ContextBuilder } from './components/ContextBuilder';
import { ResponseGenerator } from './components/ResponseGenerator';

export class RAGPipeline {
    private embedder: QueryEmbedder;
    private searcher: SemanticSearcher;
    private contextBuilder: ContextBuilder;
    private generator: ResponseGenerator;

    constructor() {
        this.embedder = new QueryEmbedder();
        this.searcher = new SemanticSearcher();
        this.contextBuilder = new ContextBuilder();
        this.generator = new ResponseGenerator();
    }

    async query(question: string, filters?: any) {
        // 1. Embed query
        const embedding = await this.embedder.embed(question);

        // 2. Search vector DB
        const chunks = await this.searcher.search(embedding, 5, filters);

        // 3. Build context
        const context = this.contextBuilder.build(chunks, question);

        // 4. Generate answer
        const response = await this.generator.generate(context, question);

        return {
            answer: response.answer,
            sources: chunks.map(c => ({
                documentId: c.documentId,
                excerpt: c.content,
                score: c.score
            })),
            confidence: response.confidence
        };
    }
}
```

## Implementation Order

1. QueryEmbedder (1-2 hours)
2. SemanticSearcher (2-3 hours)
3. ContextBuilder (2-3 hours)
4. ResponseGenerator (3-4 hours)
5. RAGPipeline orchestrator (2-3 hours)
6. Integration tests (3-4 hours)

**Total:** 13-19 hours

## Testing

```typescript
// RAGPipeline.test.ts
describe('RAGPipeline', () => {
    it('should answer question with sources');
    it('should filter by party');
    it('should handle no results');
    it('should calculate confidence');
});
```

## Configuration

Add to `.env`:
```bash
# LLM Provider (deepseek or openai)
LLM_PROVIDER=deepseek

# DeepSeek
DEEPSEEK_API_KEY=your_key
DEEPSEEK_MODEL=deepseek-chat

# OpenAI (for A/B testing)
OPENAI_API_KEY=your_key
OPENAI_LLM_MODEL=gpt-4o-mini

# Embedding
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Vector Store
VECTOR_STORE=supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

## Performance Targets

- Query latency: < 3 seconds
- Relevance: > 90% accuracy
- Cost: $20-140 per 10K users

## References

- Design: `docs/development/phase-one/06 - RAG Pipeline Design.md`
- Requirements: `docs/development/requirements/06-rag-pipeline-design.md`
- Provider interfaces: `shared/src/interfaces/`
