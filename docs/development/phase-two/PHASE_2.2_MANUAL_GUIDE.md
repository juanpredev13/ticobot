# Phase 2.2 Manual Implementation Guide

**Time Required:** 13-19 hours over 2-3 days
**Difficulty:** Intermediate
**Prerequisites:** Phase 2.1 completed, provider interfaces implemented

## Overview

This guide walks you through implementing the complete RAG (Retrieval-Augmented Generation) query pipeline. You'll build:

1. QueryEmbedder (convert queries to vectors)
2. SemanticSearcher (find relevant chunks)
3. ContextBuilder (format context for LLM)
4. ResponseGenerator (generate answers)
5. RAGPipeline (orchestrate everything)

## Prerequisites

Before starting Phase 2.2, ensure:
- ✅ Phase 2.1 completed (ingestion pipeline working)
- ✅ Documents ingested into vector database
- ✅ Provider interfaces implemented (`ProviderFactory`)
- ✅ Environment variables configured

## Step 1: Verify Prerequisites (30 min)

### 1.1 Check Environment Configuration

Open `backend/.env` and verify:

```bash
# LLM Provider
LLM_PROVIDER=deepseek        # or openai

# DeepSeek
DEEPSEEK_API_KEY=sk-xxxxx
DEEPSEEK_MODEL=deepseek-chat

# OpenAI (alternative/A-B testing)
OPENAI_API_KEY=sk-xxxxx
OPENAI_LLM_MODEL=gpt-4o-mini

# Embedding
EMBEDDING_PROVIDER=openai
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Vector Store
VECTOR_STORE=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
```

### 1.2 Verify ProviderFactory

Check that `backend/src/factory/ProviderFactory.ts` exists and has methods:
- `getEmbeddingProvider()`
- `getVectorStore()`
- `getLLMProvider()`

**Test it:**
```bash
pnpm --filter backend tsx -e "
import { ProviderFactory } from './src/factory/ProviderFactory';
(async () => {
  const embedding = await ProviderFactory.getEmbeddingProvider();
  const vectorStore = await ProviderFactory.getVectorStore();
  const llm = await ProviderFactory.getLLMProvider();
  console.log('✅ All providers initialized');
})();
"
```

## Step 2: Implement QueryEmbedder (1-2 hours)

### 2.1 Create QueryEmbedder.ts

Create file: `backend/src/rag/components/QueryEmbedder.ts`

```typescript
import { ProviderFactory } from '../../factory/ProviderFactory';
import { Logger } from '../../../shared/src/utils/Logger';

export class QueryEmbedder {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('QueryEmbedder');
    }

    /**
     * Generate embedding for a search query
     * @param query - User's search query
     * @returns Embedding vector
     */
    async embed(query: string): Promise<number[]> {
        this.logger.info(`Generating embedding for query: "${query.substring(0, 50)}..."`);

        try {
            // Get embedding provider from factory
            const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

            // Generate embedding
            const result = await embeddingProvider.generateEmbedding(query);

            this.logger.info(`Embedding generated (${result.embedding.length} dimensions)`);

            return result.embedding;

        } catch (error) {
            this.logger.error('Failed to generate query embedding', error);
            throw new Error(`Query embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Batch embed multiple queries
     * @param queries - Array of queries
     * @returns Array of embeddings
     */
    async embedBatch(queries: string[]): Promise<number[][]> {
        this.logger.info(`Generating embeddings for ${queries.length} queries`);

        const embeddings: number[][] = [];

        for (const query of queries) {
            const embedding = await this.embed(query);
            embeddings.push(embedding);

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return embeddings;
    }

    /**
     * Preprocess query before embedding
     * @param query - Raw query
     * @returns Cleaned query
     */
    preprocessQuery(query: string): string {
        return query
            // Convert to lowercase
            .toLowerCase()
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Trim
            .trim();
    }
}
```

### 2.2 Test QueryEmbedder

Create test file: `backend/src/rag/components/__tests__/QueryEmbedder.test.ts`

```typescript
import { QueryEmbedder } from '../QueryEmbedder';

describe('QueryEmbedder', () => {
    let embedder: QueryEmbedder;

    beforeEach(() => {
        embedder = new QueryEmbedder();
    });

    it('should generate embedding for query', async () => {
        const query = '¿Cuáles son las propuestas de educación?';
        const embedding = await embedder.embed(query);

        expect(embedding).toBeDefined();
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBeGreaterThan(0);
    });

    it('should preprocess queries', () => {
        const raw = '  MULTIPLE   SPACES  ';
        const processed = embedder.preprocessQuery(raw);

        expect(processed).toBe('multiple spaces');
    });

    it('should handle batch embedding', async () => {
        const queries = [
            '¿Educación?',
            '¿Salud?',
            '¿Economía?'
        ];

        const embeddings = await embedder.embedBatch(queries);

        expect(embeddings.length).toBe(3);
        expect(embeddings[0].length).toBeGreaterThan(0);
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- QueryEmbedder.test.ts
```

## Step 3: Implement SemanticSearcher (2-3 hours)

### 3.1 Create SemanticSearcher.ts

Create file: `backend/src/rag/components/SemanticSearcher.ts`

```typescript
import { ProviderFactory } from '../../factory/ProviderFactory';
import { Logger } from '../../../shared/src/utils/Logger';

export interface SearchFilters {
    documentId?: string;
    party?: string;
    minScore?: number;
    dateRange?: {
        from: Date;
        to: Date;
    };
}

export interface SearchResult {
    chunkId: string;
    documentId: string;
    content: string;
    score: number;
    metadata: Record<string, any>;
}

export class SemanticSearcher {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('SemanticSearcher');
    }

    /**
     * Search for similar chunks using vector similarity
     * @param embedding - Query embedding vector
     * @param topK - Number of results to return
     * @param filters - Optional filters
     * @returns Relevant chunks with scores
     */
    async search(
        embedding: number[],
        topK: number = 5,
        filters?: SearchFilters
    ): Promise<SearchResult[]> {
        this.logger.info(`Searching for ${topK} similar chunks`);

        try {
            // Get vector store from factory
            const vectorStore = await ProviderFactory.getVectorStore();

            // Build filter object for vector store
            const vectorFilters = this.buildVectorFilters(filters);

            // Perform similarity search
            const results = await vectorStore.similaritySearch(
                embedding,
                topK,
                vectorFilters
            );

            // Map results to SearchResult format
            const searchResults: SearchResult[] = results.map((result: any) => ({
                chunkId: result.id,
                documentId: result.metadata?.documentId || 'unknown',
                content: result.metadata?.content || '',
                score: result.score || 0,
                metadata: result.metadata || {}
            }));

            // Apply additional filtering if needed
            const filteredResults = this.applyFilters(searchResults, filters);

            this.logger.info(`Found ${filteredResults.length} results`);

            return filteredResults;

        } catch (error) {
            this.logger.error('Search failed', error);
            throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Build vector store filter object
     */
    private buildVectorFilters(filters?: SearchFilters): any {
        if (!filters) return undefined;

        const vectorFilters: any = {};

        // Document ID filter
        if (filters.documentId) {
            vectorFilters.documentId = filters.documentId;
        }

        // Party filter
        if (filters.party) {
            vectorFilters.party = filters.party;
        }

        return Object.keys(vectorFilters).length > 0 ? vectorFilters : undefined;
    }

    /**
     * Apply post-search filters
     */
    private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
        if (!filters) return results;

        let filtered = results;

        // Min score filter
        if (filters.minScore !== undefined) {
            filtered = filtered.filter(r => r.score >= filters.minScore!);
        }

        return filtered;
    }

    /**
     * Re-rank results using additional criteria
     */
    async rerank(results: SearchResult[], query: string): Promise<SearchResult[]> {
        // TODO: Implement cross-encoder reranking if needed
        // For now, just return results as-is
        return results;
    }

    /**
     * Get search statistics
     */
    getSearchStats(results: SearchResult[]) {
        const scores = results.map(r => r.score);

        return {
            totalResults: results.length,
            avgScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3) : 0,
            minScore: scores.length > 0 ? Math.min(...scores).toFixed(3) : 0,
            maxScore: scores.length > 0 ? Math.max(...scores).toFixed(3) : 0,
        };
    }
}
```

### 3.2 Test SemanticSearcher

Create test file: `backend/src/rag/components/__tests__/SemanticSearcher.test.ts`

```typescript
import { SemanticSearcher } from '../SemanticSearcher';

describe('SemanticSearcher', () => {
    let searcher: SemanticSearcher;

    beforeEach(() => {
        searcher = new SemanticSearcher();
    });

    it('should search with embedding vector', async () => {
        // Mock embedding (you'll need real embedding in actual test)
        const mockEmbedding = new Array(1536).fill(0.1);

        const results = await searcher.search(mockEmbedding, 5);

        expect(Array.isArray(results)).toBe(true);
        // Results may be empty if no data in vector DB yet
    });

    it('should apply filters correctly', async () => {
        const mockEmbedding = new Array(1536).fill(0.1);

        const results = await searcher.search(mockEmbedding, 5, {
            minScore: 0.5,
            documentId: 'pln-2026'
        });

        // All results should meet min score requirement
        results.forEach(result => {
            expect(result.score).toBeGreaterThanOrEqual(0.5);
        });
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- SemanticSearcher.test.ts
```

## Step 4: Implement ContextBuilder (2-3 hours)

### 4.1 Create ContextBuilder.ts

Create file: `backend/src/rag/components/ContextBuilder.ts`

```typescript
import { SearchResult } from './SemanticSearcher';
import { Logger } from '../../../shared/src/utils/Logger';

export interface ContextOptions {
    maxLength?: number;           // Max context length in characters
    includeSources?: boolean;      // Include source citations
    includeScores?: boolean;       // Include relevance scores
    template?: 'default' | 'concise' | 'detailed';
}

export class ContextBuilder {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('ContextBuilder');
    }

    /**
     * Build context string from search results
     * @param chunks - Retrieved chunks
     * @param query - Original query
     * @param options - Context building options
     * @returns Formatted context
     */
    build(
        chunks: SearchResult[],
        query: string,
        options: ContextOptions = {}
    ): string {
        const {
            maxLength = 4000,
            includeSources = true,
            includeScores = false,
            template = 'default'
        } = options;

        this.logger.info(`Building context from ${chunks.length} chunks (max: ${maxLength} chars)`);

        if (chunks.length === 0) {
            return this.buildEmptyContext(query);
        }

        // Select template
        let context: string;
        switch (template) {
            case 'concise':
                context = this.buildConciseContext(chunks, query, includeScores);
                break;
            case 'detailed':
                context = this.buildDetailedContext(chunks, query, includeSources, includeScores);
                break;
            default:
                context = this.buildDefaultContext(chunks, query, includeSources, includeScores);
        }

        // Truncate if necessary
        if (context.length > maxLength) {
            this.logger.warn(`Context truncated from ${context.length} to ${maxLength} chars`);
            context = context.substring(0, maxLength) + '\n\n[Context truncated]';
        }

        this.logger.info(`Context built (${context.length} chars)`);

        return context;
    }

    /**
     * Default context template
     */
    private buildDefaultContext(
        chunks: SearchResult[],
        query: string,
        includeSources: boolean,
        includeScores: boolean
    ): string {
        const formattedChunks = chunks.map((chunk, i) => {
            let header = `[${i + 1}]`;

            if (includeSources) {
                header += ` (${chunk.documentId})`;
            }

            if (includeScores) {
                header += ` [Score: ${chunk.score.toFixed(3)}]`;
            }

            return `${header}\n${chunk.content}`;
        }).join('\n\n');

        return `Context from government plans:\n\n${formattedChunks}\n\nQuestion: ${query}`;
    }

    /**
     * Concise context template (minimal formatting)
     */
    private buildConciseContext(
        chunks: SearchResult[],
        query: string,
        includeScores: boolean
    ): string {
        const formattedChunks = chunks.map((chunk, i) => {
            const score = includeScores ? ` (${chunk.score.toFixed(2)})` : '';
            return `${i + 1}. ${chunk.content}${score}`;
        }).join('\n\n');

        return `${formattedChunks}\n\nQ: ${query}`;
    }

    /**
     * Detailed context template (with metadata)
     */
    private buildDetailedContext(
        chunks: SearchResult[],
        query: string,
        includeSources: boolean,
        includeScores: boolean
    ): string {
        const formattedChunks = chunks.map((chunk, i) => {
            let section = `--- Source ${i + 1} ---\n`;

            if (includeSources) {
                section += `Document: ${chunk.documentId}\n`;
                section += `Chunk ID: ${chunk.chunkId}\n`;
            }

            if (includeScores) {
                section += `Relevance: ${chunk.score.toFixed(3)}\n`;
            }

            section += `\nContent:\n${chunk.content}`;

            return section;
        }).join('\n\n');

        return `Retrieved information from Costa Rica 2026 Government Plans:\n\n${formattedChunks}\n\n---\n\nUser Question: ${query}\n\nProvide a comprehensive answer based on the information above.`;
    }

    /**
     * Context when no chunks found
     */
    private buildEmptyContext(query: string): string {
        return `No relevant information found in the government plans database.\n\nQuestion: ${query}\n\nPlease inform the user that no relevant information was found for their query.`;
    }

    /**
     * Extract document IDs from chunks
     */
    extractSources(chunks: SearchResult[]): string[] {
        return [...new Set(chunks.map(c => c.documentId))];
    }

    /**
     * Get context statistics
     */
    getContextStats(context: string, chunks: SearchResult[]) {
        return {
            contextLength: context.length,
            chunkCount: chunks.length,
            uniqueSources: this.extractSources(chunks).length,
            avgScore: chunks.length > 0
                ? (chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length).toFixed(3)
                : 0
        };
    }
}
```

### 4.2 Test ContextBuilder

Create test file: `backend/src/rag/components/__tests__/ContextBuilder.test.ts`

```typescript
import { ContextBuilder } from '../ContextBuilder';
import { SearchResult } from '../SemanticSearcher';

describe('ContextBuilder', () => {
    let builder: ContextBuilder;

    beforeEach(() => {
        builder = new ContextBuilder();
    });

    const mockChunks: SearchResult[] = [
        {
            chunkId: 'chunk-1',
            documentId: 'pln-2026',
            content: 'Propuestas de educación...',
            score: 0.95,
            metadata: {}
        },
        {
            chunkId: 'chunk-2',
            documentId: 'pac-2026',
            content: 'Planes de salud...',
            score: 0.87,
            metadata: {}
        }
    ];

    it('should build default context', () => {
        const context = builder.build(mockChunks, '¿Educación?');

        expect(context).toContain('[1]');
        expect(context).toContain('educación');
        expect(context).toContain('Question: ¿Educación?');
    });

    it('should build concise context', () => {
        const context = builder.build(mockChunks, '¿Educación?', {
            template: 'concise'
        });

        expect(context).toContain('1.');
        expect(context).not.toContain('[1]');
    });

    it('should include scores when requested', () => {
        const context = builder.build(mockChunks, '¿Educación?', {
            includeScores: true
        });

        expect(context).toContain('0.95');
        expect(context).toContain('0.87');
    });

    it('should truncate long context', () => {
        const longChunk = {
            ...mockChunks[0],
            content: 'A'.repeat(5000)
        };

        const context = builder.build([longChunk], '¿Educación?', {
            maxLength: 1000
        });

        expect(context.length).toBeLessThanOrEqual(1020); // Some margin for truncation message
        expect(context).toContain('[Context truncated]');
    });

    it('should handle empty chunks', () => {
        const context = builder.build([], '¿Educación?');

        expect(context).toContain('No relevant information found');
    });

    it('should extract unique sources', () => {
        const sources = builder.extractSources(mockChunks);

        expect(sources).toHaveLength(2);
        expect(sources).toContain('pln-2026');
        expect(sources).toContain('pac-2026');
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- ContextBuilder.test.ts
```

## Step 5: Implement ResponseGenerator (3-4 hours)

### 5.1 Create ResponseGenerator.ts

Create file: `backend/src/rag/components/ResponseGenerator.ts`

```typescript
import { ProviderFactory } from '../../factory/ProviderFactory';
import { Logger } from '../../../shared/src/utils/Logger';

export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

export interface GeneratedResponse {
    answer: string;
    confidence: number;
    tokensUsed?: number;
    model?: string;
}

export class ResponseGenerator {
    private logger: Logger;
    private defaultSystemPrompt: string;

    constructor() {
        this.logger = new Logger('ResponseGenerator');
        this.defaultSystemPrompt = `You are an expert assistant for Costa Rica's 2026 presidential election government plans.

Your role is to:
1. Answer questions based ONLY on the provided context
2. Cite sources when possible
3. Be objective and balanced when comparing parties
4. Admit when information is not in the context
5. Respond in Spanish (the user's question language)

Guidelines:
- Do not add information not present in the context
- If comparing parties, present all viewpoints fairly
- Use clear, concise language
- Format responses with bullet points when appropriate`;
    }

    /**
     * Generate answer using LLM
     * @param context - Formatted context from ContextBuilder
     * @param query - User's question
     * @param options - Generation options
     * @returns Generated response
     */
    async generate(
        context: string,
        query: string,
        options: GenerationOptions = {}
    ): Promise<GeneratedResponse> {
        const {
            temperature = 0.7,
            maxTokens = 500,
            systemPrompt = this.defaultSystemPrompt
        } = options;

        this.logger.info(`Generating response for query: "${query.substring(0, 50)}..."`);

        try {
            // Get LLM provider from factory
            const llmProvider = await ProviderFactory.getLLMProvider();

            // Build messages
            const messages = [
                {
                    role: 'system' as const,
                    content: systemPrompt
                },
                {
                    role: 'user' as const,
                    content: `${context}\n\nAnswer the question above.`
                }
            ];

            // Generate completion
            const response = await llmProvider.generateCompletion(messages, {
                temperature,
                maxTokens
            });

            // Calculate confidence (basic heuristic)
            const confidence = this.calculateConfidence(response, context);

            this.logger.info(`Response generated (${response.content.length} chars, confidence: ${confidence.toFixed(2)})`);

            return {
                answer: response.content,
                confidence,
                tokensUsed: response.tokensUsed,
                model: response.model
            };

        } catch (error) {
            this.logger.error('Response generation failed', error);
            throw new Error(`Response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate streaming response
     */
    async *generateStream(
        context: string,
        query: string,
        options: GenerationOptions = {}
    ): AsyncGenerator<string> {
        const {
            temperature = 0.7,
            maxTokens = 500,
            systemPrompt = this.defaultSystemPrompt
        } = options;

        this.logger.info(`Generating streaming response for query: "${query.substring(0, 50)}..."`);

        try {
            const llmProvider = await ProviderFactory.getLLMProvider();

            const messages = [
                {
                    role: 'system' as const,
                    content: systemPrompt
                },
                {
                    role: 'user' as const,
                    content: `${context}\n\nAnswer the question above.`
                }
            ];

            // Check if provider supports streaming
            if ('generateCompletionStream' in llmProvider) {
                const stream = llmProvider.generateCompletionStream(messages, {
                    temperature,
                    maxTokens
                });

                for await (const chunk of stream) {
                    yield chunk.content;
                }
            } else {
                // Fallback to non-streaming
                const response = await llmProvider.generateCompletion(messages, {
                    temperature,
                    maxTokens
                });
                yield response.content;
            }

        } catch (error) {
            this.logger.error('Streaming response generation failed', error);
            throw new Error(`Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Calculate confidence score based on response quality
     */
    private calculateConfidence(response: any, context: string): number {
        // Basic heuristics for confidence
        let confidence = 0.5; // Base confidence

        // Check response length (too short = low confidence)
        if (response.content.length > 50) {
            confidence += 0.1;
        }

        // Check if response references context
        if (response.content.includes('plan') || response.content.includes('propuesta')) {
            confidence += 0.15;
        }

        // Check if response admits uncertainty
        const uncertaintyPhrases = ['no se menciona', 'no está claro', 'no hay información'];
        if (uncertaintyPhrases.some(phrase => response.content.toLowerCase().includes(phrase))) {
            confidence -= 0.2;
        }

        // Cap between 0 and 1
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Extract source citations from response
     */
    extractCitations(response: string): string[] {
        // Look for [1], [2], etc.
        const citationRegex = /\[(\d+)\]/g;
        const matches = response.matchAll(citationRegex);
        return Array.from(matches, m => m[1]);
    }

    /**
     * Validate response quality
     */
    validateResponse(response: string, minLength: number = 20): boolean {
        return (
            response.length >= minLength &&
            !response.toLowerCase().includes('error') &&
            response.trim().length > 0
        );
    }
}
```

### 5.2 Test ResponseGenerator

Create test file: `backend/src/rag/components/__tests__/ResponseGenerator.test.ts`

```typescript
import { ResponseGenerator } from '../ResponseGenerator';

describe('ResponseGenerator', () => {
    let generator: ResponseGenerator;

    beforeEach(() => {
        generator = new ResponseGenerator();
    });

    it('should generate response from context', async () => {
        const context = `Context:
[1] El plan de educación incluye...

Question: ¿Qué proponen en educación?`;

        const response = await generator.generate(context, '¿Educación?');

        expect(response.answer).toBeDefined();
        expect(response.answer.length).toBeGreaterThan(0);
        expect(response.confidence).toBeGreaterThanOrEqual(0);
        expect(response.confidence).toBeLessThanOrEqual(1);
    });

    it('should extract citations from response', () => {
        const response = 'Según [1] y [2], las propuestas incluyen...';
        const citations = generator.extractCitations(response);

        expect(citations).toEqual(['1', '2']);
    });

    it('should validate response quality', () => {
        expect(generator.validateResponse('Short')).toBe(false);
        expect(generator.validateResponse('This is a valid response with enough content')).toBe(true);
        expect(generator.validateResponse('Error occurred')).toBe(false);
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- ResponseGenerator.test.ts
```

## Step 6: Create RAGPipeline Orchestrator (2-3 hours)

### 6.1 Create RAGPipeline.ts

Create file: `backend/src/rag/RAGPipeline.ts`

```typescript
import { QueryEmbedder } from './components/QueryEmbedder';
import { SemanticSearcher, SearchFilters, SearchResult } from './components/SemanticSearcher';
import { ContextBuilder, ContextOptions } from './components/ContextBuilder';
import { ResponseGenerator, GenerationOptions, GeneratedResponse } from './components/ResponseGenerator';
import { Logger } from '../../shared/src/utils/Logger';

export interface RAGOptions {
    topK?: number;
    filters?: SearchFilters;
    contextOptions?: ContextOptions;
    generationOptions?: GenerationOptions;
}

export interface RAGResponse {
    answer: string;
    sources: Array<{
        documentId: string;
        excerpt: string;
        score: number;
    }>;
    confidence: number;
    metadata: {
        queryTime: number;
        chunksRetrieved: number;
        tokensUsed?: number;
        model?: string;
    };
}

export class RAGPipeline {
    private embedder: QueryEmbedder;
    private searcher: SemanticSearcher;
    private contextBuilder: ContextBuilder;
    private generator: ResponseGenerator;
    private logger: Logger;

    constructor() {
        this.embedder = new QueryEmbedder();
        this.searcher = new SemanticSearcher();
        this.contextBuilder = new ContextBuilder();
        this.generator = new ResponseGenerator();
        this.logger = new Logger('RAGPipeline');
    }

    /**
     * Run complete RAG pipeline
     * @param question - User's question
     * @param options - Pipeline options
     * @returns Generated answer with sources
     */
    async query(question: string, options: RAGOptions = {}): Promise<RAGResponse> {
        const startTime = Date.now();
        const { topK = 5, filters, contextOptions, generationOptions } = options;

        this.logger.info(`RAG query: "${question.substring(0, 100)}..."`);

        try {
            // Step 1: Preprocess and embed query
            const preprocessedQuery = this.embedder.preprocessQuery(question);
            const embedding = await this.embedder.embed(preprocessedQuery);

            // Step 2: Search vector database
            const chunks = await this.searcher.search(embedding, topK, filters);

            if (chunks.length === 0) {
                this.logger.warn('No chunks found for query');
                return this.buildEmptyResponse(question, Date.now() - startTime);
            }

            // Step 3: Build context
            const context = this.contextBuilder.build(chunks, question, contextOptions);

            // Step 4: Generate answer
            const response = await this.generator.generate(context, question, generationOptions);

            // Step 5: Format response
            const ragResponse = this.buildResponse(
                response,
                chunks,
                Date.now() - startTime
            );

            this.logger.info(`RAG query completed (${ragResponse.metadata.queryTime}ms)`);

            return ragResponse;

        } catch (error) {
            this.logger.error('RAG query failed', error);
            throw new Error(`RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Stream RAG response
     */
    async *queryStream(question: string, options: RAGOptions = {}): AsyncGenerator<string> {
        const { topK = 5, filters, contextOptions, generationOptions } = options;

        this.logger.info(`RAG streaming query: "${question.substring(0, 100)}..."`);

        try {
            // Embed and search (same as non-streaming)
            const preprocessedQuery = this.embedder.preprocessQuery(question);
            const embedding = await this.embedder.embed(preprocessedQuery);
            const chunks = await this.searcher.search(embedding, topK, filters);

            if (chunks.length === 0) {
                yield 'No se encontró información relevante para tu pregunta.';
                return;
            }

            // Build context
            const context = this.contextBuilder.build(chunks, question, contextOptions);

            // Stream response
            const stream = this.generator.generateStream(context, question, generationOptions);

            for await (const chunk of stream) {
                yield chunk;
            }

        } catch (error) {
            this.logger.error('RAG streaming query failed', error);
            throw error;
        }
    }

    /**
     * Build RAG response object
     */
    private buildResponse(
        generatedResponse: GeneratedResponse,
        chunks: SearchResult[],
        queryTime: number
    ): RAGResponse {
        return {
            answer: generatedResponse.answer,
            sources: chunks.map(chunk => ({
                documentId: chunk.documentId,
                excerpt: chunk.content.substring(0, 200) + '...',
                score: chunk.score
            })),
            confidence: generatedResponse.confidence,
            metadata: {
                queryTime,
                chunksRetrieved: chunks.length,
                tokensUsed: generatedResponse.tokensUsed,
                model: generatedResponse.model
            }
        };
    }

    /**
     * Build empty response when no results found
     */
    private buildEmptyResponse(question: string, queryTime: number): RAGResponse {
        return {
            answer: 'No se encontró información relevante en los planes de gobierno para responder tu pregunta.',
            sources: [],
            confidence: 0,
            metadata: {
                queryTime,
                chunksRetrieved: 0
            }
        };
    }

    /**
     * Get pipeline statistics
     */
    async getStats() {
        return {
            embedder: 'QueryEmbedder',
            searcher: 'SemanticSearcher',
            contextBuilder: 'ContextBuilder',
            generator: 'ResponseGenerator'
        };
    }
}
```

### 6.2 Test RAGPipeline

Create test file: `backend/src/rag/__tests__/RAGPipeline.test.ts`

```typescript
import { RAGPipeline } from '../RAGPipeline';

describe('RAGPipeline', () => {
    let pipeline: RAGPipeline;

    beforeEach(() => {
        pipeline = new RAGPipeline();
    });

    it('should answer question with sources', async () => {
        const question = '¿Cuáles son las propuestas de educación?';

        const response = await pipeline.query(question);

        expect(response).toBeDefined();
        expect(response.answer).toBeTruthy();
        expect(Array.isArray(response.sources)).toBe(true);
        expect(response.confidence).toBeGreaterThanOrEqual(0);
        expect(response.metadata.queryTime).toBeGreaterThan(0);
    }, 30000); // 30 second timeout

    it('should handle queries with filters', async () => {
        const question = '¿Propuestas de salud?';

        const response = await pipeline.query(question, {
            topK: 3,
            filters: {
                documentId: 'pln-2026'
            }
        });

        expect(response).toBeDefined();
        // All sources should be from specified document
        response.sources.forEach(source => {
            expect(source.documentId).toBe('pln-2026');
        });
    }, 30000);

    it('should handle empty results gracefully', async () => {
        const question = 'gibberish nonsense query xyzabc';

        const response = await pipeline.query(question);

        expect(response.confidence).toBe(0);
        expect(response.sources.length).toBe(0);
    }, 30000);

    it('should calculate confidence score', async () => {
        const question = '¿Economía?';

        const response = await pipeline.query(question);

        expect(response.confidence).toBeGreaterThanOrEqual(0);
        expect(response.confidence).toBeLessThanOrEqual(1);
    }, 30000);
});
```

**Run tests:**
```bash
pnpm --filter backend test -- RAGPipeline.test.ts
```

## Step 7: Integration Testing (3-4 hours)

### 7.1 Create Integration Test Script

Create file: `backend/src/scripts/testRAG.ts`

```typescript
import { RAGPipeline } from '../rag/RAGPipeline';
import dotenv from 'dotenv';

dotenv.config();

const testQuestions = [
    '¿Cuáles son las propuestas en educación?',
    '¿Qué partidos proponen mejorar la salud pública?',
    '¿Cuál es el plan económico del PLN?',
    'Compara las propuestas de seguridad entre partidos',
    '¿Hay propuestas sobre energías renovables?'
];

async function main() {
    const pipeline = new RAGPipeline();

    console.log('=== RAG PIPELINE TEST ===\n');

    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];

        console.log(`\n[${ i + 1}/${testQuestions.length}] Question: ${question}`);
        console.log('-'.repeat(80));

        try {
            const response = await pipeline.query(question, {
                topK: 5
            });

            console.log(`\nAnswer: ${response.answer}\n`);
            console.log(`Sources (${response.sources.length}):`);
            response.sources.forEach((source, idx) => {
                console.log(`  [${idx + 1}] ${source.documentId} (score: ${source.score.toFixed(3)})`);
                console.log(`      ${source.excerpt.substring(0, 100)}...`);
            });

            console.log(`\nMetadata:`);
            console.log(`  Query Time: ${response.metadata.queryTime}ms`);
            console.log(`  Chunks: ${response.metadata.chunksRetrieved}`);
            console.log(`  Confidence: ${response.confidence.toFixed(3)}`);
            console.log(`  Model: ${response.metadata.model || 'N/A'}`);

        } catch (error) {
            console.error(`Error: ${error instanceof Error ? error.message : error}`);
        }

        // Delay between queries
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n=== TEST COMPLETED ===');
}

main().catch(console.error);
```

**Run integration test:**
```bash
pnpm --filter backend tsx src/scripts/testRAG.ts
```

### 7.2 Performance Testing

Create file: `backend/src/scripts/benchmarkRAG.ts`

```typescript
import { RAGPipeline } from '../rag/RAGPipeline';
import dotenv from 'dotenv';

dotenv.config();

async function benchmark() {
    const pipeline = new RAGPipeline();
    const iterations = 10;
    const question = '¿Cuáles son las propuestas en educación?';

    console.log(`Running ${iterations} iterations...\n`);

    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await pipeline.query(question);
        const elapsed = Date.now() - start;
        times.push(elapsed);

        console.log(`Iteration ${i + 1}: ${elapsed}ms`);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`\n=== BENCHMARK RESULTS ===`);
    console.log(`Average: ${avg.toFixed(2)}ms`);
    console.log(`Min: ${min}ms`);
    console.log(`Max: ${max}ms`);
    console.log(`Target: < 3000ms`);
    console.log(`Status: ${avg < 3000 ? '✅ PASS' : '❌ FAIL'}`);
}

benchmark().catch(console.error);
```

**Run benchmark:**
```bash
pnpm --filter backend tsx src/scripts/benchmarkRAG.ts
```

## Step 8: Create API Endpoints (1-2 hours)

### 8.1 Add RAG Endpoints

Create file: `backend/src/api/routes/rag.ts`

```typescript
import { Router } from 'express';
import { RAGPipeline } from '../../rag/RAGPipeline';

const router = Router();

/**
 * POST /api/rag/query
 * Answer a question using RAG
 */
router.post('/query', async (req, res) => {
    const { question, options } = req.body;

    if (!question) {
        return res.status(400).json({
            error: 'Missing required field: question'
        });
    }

    const pipeline = new RAGPipeline();

    try {
        const response = await pipeline.query(question, options);
        res.json(response);

    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Query failed'
        });
    }
});

/**
 * POST /api/rag/query/stream
 * Stream RAG response
 */
router.post('/query/stream', async (req, res) => {
    const { question, options } = req.body;

    if (!question) {
        return res.status(400).json({
            error: 'Missing required field: question'
        });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const pipeline = new RAGPipeline();

    try {
        const stream = pipeline.queryStream(question, options);

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        res.write(`data: ${JSON.stringify({
            error: error instanceof Error ? error.message : 'Streaming failed'
        })}\n\n`);
        res.end();
    }
});

export default router;
```

Register routes in `backend/src/api/server.ts`:
```typescript
import ragRoutes from './routes/rag';

// ... other imports and setup

app.use('/api/rag', ragRoutes);
```

### 8.2 Test API

**Start server:**
```bash
pnpm --filter backend dev
```

**Test query endpoint:**
```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Cuáles son las propuestas de educación del PLN?",
    "options": {
      "topK": 5,
      "filters": {
        "documentId": "pln-2026"
      }
    }
  }'
```

**Test streaming endpoint:**
```bash
curl -X POST http://localhost:3000/api/rag/query/stream \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Propuestas de salud?"
  }'
```

## Step 9: Documentation and Cleanup (1 hour)

### 9.1 Update README

Update `backend/src/rag/README.md`:

```markdown
# RAG Pipeline

Complete Retrieval-Augmented Generation pipeline for TicoBot.

## Components

- **QueryEmbedder**: Convert queries to embeddings
- **SemanticSearcher**: Search vector database
- **ContextBuilder**: Format context for LLM
- **ResponseGenerator**: Generate answers with LLM
- **RAGPipeline**: Orchestrator

## Usage

javascript
import { RAGPipeline } from './rag/RAGPipeline';

const pipeline = new RAGPipeline();

const response = await pipeline.query('¿Educación?', {
  topK: 5,
  filters: { documentId: 'pln-2026' }
});

console.log(response.answer);
console.log(response.sources);


## Performance

- Target latency: < 3 seconds
- Average confidence: > 0.7
- Source diversity: Multiple documents

## Configuration

Set in .env:
- LLM_PROVIDER=deepseek
- EMBEDDING_PROVIDER=openai
- VECTOR_STORE=supabase
```

### 9.2 Run Final Tests

```bash
# All RAG tests
pnpm --filter backend test src/rag/

# Full build
pnpm --filter backend build

# Integration test
pnpm --filter backend tsx src/scripts/testRAG.ts

# Benchmark
pnpm --filter backend tsx src/scripts/benchmarkRAG.ts
```

## Troubleshooting

### Common Issues

**1. Embedding API rate limits**
```bash
# Add retry logic in QueryEmbedder
# Or add delays between requests
await new Promise(r => setTimeout(r, 100));
```

**2. Vector search returns no results**
```bash
# Verify data was ingested
# Check vector dimensions match
# Verify filters are correct
```

**3. LLM responses are too long**
```bash
# Reduce maxTokens in generation options
options: { generationOptions: { maxTokens: 300 } }
```

**4. Low confidence scores**
```bash
# Increase topK to get more context
# Adjust context template
# Fine-tune search filters
```

## Next Steps

After completing Phase 2.2:

1. **Update Obsidian vault** with progress
2. **Close GitHub Issue #18**
3. **Move to Phase 2.3** - Frontend Implementation
4. **Perform end-to-end testing** with real user queries

## Reference

- Design doc: `docs/development/phase-one/06 - RAG Pipeline Design.md`
- API docs: `docs/api/rag-endpoints.md`
- Provider interfaces: `shared/src/interfaces/`
- GitHub Issue: https://github.com/juanpredev13/ticobot/issues/18
