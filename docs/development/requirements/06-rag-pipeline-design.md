# RAG Pipeline Design & Implementation

## Overview

This document provides a comprehensive design for the Retrieval-Augmented Generation (RAG) system that powers TicoBot's ability to answer questions about Costa Rica's 2026 Government Plans using official TSE PDFs as the authoritative source.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Ingestion Pipeline](#ingestion-pipeline)
- [Query Pipeline](#query-pipeline)
- [Component Specifications](#component-specifications)
- [Error Handling & Monitoring](#error-handling--monitoring)
- [Performance Optimization](#performance-optimization)
- [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Two-Phase Architecture

The RAG system is divided into two distinct phases:

1. **Ingestion Phase** (Offline/Batch Processing)
   - Downloads and processes PDF documents
   - Extracts, cleans, and chunks text
   - Generates embeddings
   - Stores vectors in database

2. **Query Phase** (Online/Real-time Processing)
   - Receives user questions
   - Performs semantic search
   - Retrieves relevant context
   - Generates answers using LLM

### High-Level Data Flow

```
INGESTION PHASE:
TSE Website → PDF Download → Text Extraction → Cleaning → Chunking → Embedding → Vector DB

QUERY PHASE:
User Question → Embedding → Vector Search → Re-ranking → Context Building → LLM → Answer
```

### Design Principles

1. **Provider Independence**: All external services (LLM, embedding, vector DB) are abstracted
2. **Batch Processing**: Ingestion handles large datasets efficiently
3. **Streaming Responses**: Query phase supports streaming for better UX
4. **Metadata-Rich**: Every chunk carries comprehensive metadata for filtering and attribution
5. **Observability**: Every stage is instrumented for monitoring and debugging
6. **Resilience**: Graceful degradation and retry logic throughout

---

## Ingestion Pipeline

### Pipeline Stages

```
Stage 1: PDF Discovery & Download
  ↓
Stage 2: Text Extraction
  ↓
Stage 3: Text Cleaning & Normalization
  ↓
Stage 4: Semantic Chunking
  ↓
Stage 5: Embedding Generation
  ↓
Stage 6: Vector Storage
  ↓
Stage 7: Metadata Indexing
```

### Stage 1: PDF Discovery & Download

**Component**: `PDFDownloader`

**Responsibilities**:
- Scrape TSE website for government plan PDFs
- Validate PDF URLs and metadata
- Download PDFs to local storage
- Track download progress and failures

**Input**:
- TSE website URL or list of PDF URLs
- Download configuration (parallel downloads, retry policy)

**Output**:
- Downloaded PDF files
- Document metadata (party, candidate, year, source URL)

**Implementation Details**:

```typescript
interface PDFDownloadConfig {
  maxConcurrentDownloads: number;  // Default: 3
  retryAttempts: number;            // Default: 3
  retryDelayMs: number;             // Default: 1000
  downloadTimeout: number;          // Default: 30000ms
  storageProvider: IStorageProvider;
}

interface DownloadResult {
  documentId: string;
  filePath: string;
  fileSize: number;
  downloadedAt: Date;
  metadata: DocumentMetadata;
  status: 'success' | 'failed';
  error?: string;
}
```

**Error Handling**:
- Retry failed downloads with exponential backoff
- Log all download attempts
- Skip corrupted/inaccessible PDFs
- Continue batch processing if individual downloads fail

---

### Stage 2: Text Extraction

**Component**: `PDFParser`

**Responsibilities**:
- Extract text from PDF pages
- Preserve page boundaries
- Detect document structure (headings, sections)
- Handle multi-column layouts

**Input**:
- PDF file path
- Parsing configuration

**Output**:
- Array of page texts with metadata
- Document structure information

**Implementation Details**:

```typescript
interface PageText {
  pageNumber: number;
  content: string;
  metadata: {
    hasImages: boolean;
    hasTables: boolean;
    hasMultipleColumns: boolean;
    wordCount: number;
    characterCount: number;
  };
}

interface ParsedDocument {
  documentId: string;
  pages: PageText[];
  totalPages: number;
  detectedStructure: {
    sections: Section[];
    headings: Heading[];
  };
}
```

**Technology Options**:
- **pdf-parse**: Node.js library for simple text extraction
- **pdfjs-dist**: Mozilla's PDF.js for complex layouts
- **Apache Tika** (via API): Enterprise-grade extraction

**Quality Checks**:
- Verify extracted text is not empty
- Check for garbled characters (encoding issues)
- Validate page count matches PDF metadata
- Flag pages with suspected extraction issues

---

### Stage 3: Text Cleaning & Normalization

**Component**: `TextCleaner`

**Responsibilities**:
- Remove page headers/footers/page numbers
- Normalize whitespace
- Fix encoding issues
- Remove extraction artifacts
- Standardize special characters

**Input**:
- Raw page text array

**Output**:
- Cleaned text array

**Implementation Details**:

```typescript
interface CleaningConfig {
  removePageNumbers: boolean;          // Default: true
  removeHeadersFooters: boolean;       // Default: true
  normalizeWhitespace: boolean;        // Default: true
  fixEncodingIssues: boolean;          // Default: true
  removeRepeatedSections: boolean;     // Default: true
  minPageLength: number;               // Skip pages shorter than this
}

interface CleaningResult {
  cleanedText: string;
  removedArtifacts: string[];
  appliedTransformations: string[];
  qualityScore: number;  // 0-1 score
}
```

**Cleaning Rules**:

1. **Page Number Removal**:
   - Pattern: `\d{1,3}\s*\|\s*Página`
   - Pattern: `Página \d+ de \d+`

2. **Header/Footer Detection**:
   - Identify repeated content at top/bottom of pages
   - Remove if appears in >50% of pages

3. **Whitespace Normalization**:
   - Replace multiple spaces with single space
   - Replace tabs with spaces
   - Normalize line breaks to `\n`
   - Remove trailing/leading whitespace

4. **Encoding Fixes**:
   - Fix common UTF-8 issues
   - Replace smart quotes with regular quotes
   - Normalize diacritics (á, é, í, ó, ú, ñ)

5. **Artifact Removal**:
   - Remove watermarks
   - Remove image placeholders
   - Remove table of contents page markers

---

### Stage 4: Semantic Chunking

**Component**: `TextChunker`

**Responsibilities**:
- Split cleaned text into semantic chunks
- Preserve context with overlapping chunks
- Maintain document structure
- Enrich chunks with metadata

**Input**:
- Cleaned page texts
- Document metadata

**Output**:
- Array of text chunks with metadata

**Implementation Details**:

See [Chunking Strategy Specification](./dataset/03-chunking-strategy.md) for detailed algorithm.

```typescript
interface ChunkingConfig {
  targetChunkSize: number;        // Default: 1200 chars
  minChunkSize: number;           // Default: 400 chars
  maxChunkSize: number;           // Default: 2000 chars
  overlapSize: number;            // Default: 150 chars
  preferredBreakpoints: string[]; // ['section', 'paragraph', 'sentence']
}

interface Chunk {
  id: string;                     // Format: {docId}_p{page}_c{index}
  documentId: string;
  content: string;
  metadata: {
    page: number;
    section?: string;
    heading?: string;
    party: string;
    candidate: string;
    year: number;
    chunkIndex: number;
    totalChunks: number;
    characterCount: number;
    wordCount: number;
    overlapChars: number;
    previousChunkId?: string;
    nextChunkId?: string;
    containsTable: boolean;
    containsList: boolean;
    qualityScore: number;
  };
}
```

**Quality Assurance**:
- Calculate quality score for each chunk (0-1)
- Reject chunks with score < 0.3
- Log quality distribution for monitoring
- Flag chunks requiring manual review

---

### Stage 5: Embedding Generation

**Component**: `EmbeddingGenerator`

**Responsibilities**:
- Generate vector embeddings for chunks
- Batch process for efficiency
- Handle rate limiting
- Cache embeddings

**Input**:
- Array of text chunks

**Output**:
- Chunks with embeddings attached

**Implementation Details**:

```typescript
interface EmbeddingConfig {
  provider: IEmbeddingProvider;
  batchSize: number;              // Default: 50
  maxRetries: number;             // Default: 3
  retryDelayMs: number;           // Default: 1000
  cacheEnabled: boolean;          // Default: true
}

interface EmbeddedChunk extends Chunk {
  embedding: number[];
  embeddingMetadata: {
    model: string;
    dimension: number;
    generatedAt: Date;
    processingTimeMs: number;
  };
}
```

**Batch Processing Strategy**:

1. Group chunks into batches (default: 50 chunks)
2. Send batch to embedding provider
3. Handle rate limits with exponential backoff
4. Retry failed batches up to 3 times
5. Cache successful embeddings
6. Log progress and failures

**Provider-Specific Considerations**:

- **OpenAI**: 8,191 token limit per text, 3,000 RPM limit
- **Cohere**: 96 texts per batch, multilingual support
- **Local models**: No rate limits, slower processing

---

### Stage 6: Vector Storage

**Component**: `VectorStoreWriter`

**Responsibilities**:
- Batch upsert embeddings to vector database
- Handle conflicts (update vs insert)
- Maintain metadata indexes
- Verify insertion success

**Input**:
- Array of embedded chunks

**Output**:
- Storage confirmation with IDs

**Implementation Details**:

```typescript
interface VectorStorageConfig {
  vectorStore: IVectorStore;
  upsertBatchSize: number;        // Default: 100
  enableIndexing: boolean;        // Default: true
  verifyInsertion: boolean;       // Default: true
}

interface StorageResult {
  documentsStored: number;
  documentsUpdated: number;
  documentsFailed: number;
  indexesCreated: string[];
  storageTimeMs: number;
  errors?: StorageError[];
}
```

**Indexing Strategy**:

Create indexes on:
- `party` (for filtering by political party)
- `year` (for filtering by election year)
- `section` (for filtering by document section)
- `documentId` (for document-level queries)

**Batch Upsert Logic**:

```typescript
async function batchUpsert(chunks: EmbeddedChunk[]): Promise<StorageResult> {
  const batches = chunkArray(chunks, config.upsertBatchSize);

  for (const batch of batches) {
    try {
      await vectorStore.upsert(batch);
      logProgress(batch.length);
    } catch (error) {
      // Retry individual chunks if batch fails
      await retryIndividually(batch, error);
    }
  }

  if (config.verifyInsertion) {
    await verifyStoredChunks(chunks);
  }

  return buildResult();
}
```

---

### Stage 7: Metadata Indexing

**Component**: `MetadataIndexer`

**Responsibilities**:
- Store document metadata in primary database
- Create searchable indexes
- Track processing status
- Enable document management UI

**Input**:
- Document metadata
- Processing results

**Output**:
- Database records

**Implementation Details**:

```typescript
interface DocumentRecord {
  id: string;
  party: string;
  candidate: string;
  year: number;
  sourceUrl: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalPages: number;
  totalChunks: number;
  embeddingsGenerated: number;
  processingStarted?: Date;
  processingCompleted?: Date;
  processingError?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### Ingestion Pipeline Orchestration

**Component**: `IngestPipeline`

**Responsibilities**:
- Orchestrate all ingestion stages
- Manage pipeline state
- Handle errors gracefully
- Report progress

**Implementation**:

```typescript
class IngestPipeline {
  async ingestDocument(pdfUrl: string): Promise<IngestResult> {
    const documentId = generateDocumentId(pdfUrl);

    try {
      // Stage 1: Download
      await this.updateStatus(documentId, 'downloading');
      const pdfFile = await this.downloader.download(pdfUrl);

      // Stage 2: Parse
      await this.updateStatus(documentId, 'parsing');
      const parsedDoc = await this.parser.parse(pdfFile);

      // Stage 3: Clean
      await this.updateStatus(documentId, 'cleaning');
      const cleanedPages = await this.cleaner.clean(parsedDoc.pages);

      // Stage 4: Chunk
      await this.updateStatus(documentId, 'chunking');
      const chunks = await this.chunker.chunk(cleanedPages);

      // Stage 5: Embed
      await this.updateStatus(documentId, 'embedding');
      const embeddedChunks = await this.embedder.generateEmbeddings(chunks);

      // Stage 6: Store
      await this.updateStatus(documentId, 'storing');
      const storageResult = await this.storer.store(embeddedChunks);

      // Stage 7: Index metadata
      await this.updateStatus(documentId, 'indexing');
      await this.indexer.index(documentId, parsedDoc, chunks);

      await this.updateStatus(documentId, 'completed');

      return {
        documentId,
        chunksCreated: chunks.length,
        embeddingsGenerated: storageResult.documentsStored,
        status: 'success',
      };

    } catch (error) {
      await this.updateStatus(documentId, 'failed', error.message);
      return {
        documentId,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        status: 'failed',
        error: error.message,
      };
    }
  }

  async ingestBatch(pdfUrls: string[]): Promise<IngestResult[]> {
    const results = await Promise.allSettled(
      pdfUrls.map(url => this.ingestDocument(url))
    );

    return results.map(r =>
      r.status === 'fulfilled' ? r.value : this.buildErrorResult(r.reason)
    );
  }
}
```

---

## Query Pipeline

### Pipeline Stages

```
Stage 1: Query Understanding
  ↓
Stage 2: Embedding Generation
  ↓
Stage 3: Vector Similarity Search
  ↓
Stage 4: Re-ranking (Optional)
  ↓
Stage 5: Context Building
  ↓
Stage 6: LLM Answer Generation
  ↓
Stage 7: Response Formatting
```

### Stage 1: Query Understanding

**Component**: `QueryProcessor`

**Responsibilities**:
- Validate user query
- Detect query intent
- Extract filters from query
- Expand query if needed

**Input**:
- User question string
- Optional filters

**Output**:
- Processed query object

**Implementation Details**:

```typescript
interface ProcessedQuery {
  originalQuery: string;
  processedQuery: string;        // May be expanded or refined
  intent: 'factual' | 'comparison' | 'opinion' | 'clarification';
  detectedFilters: {
    party?: string[];
    section?: string[];
    year?: number;
  };
  queryComplexity: 'simple' | 'medium' | 'complex';
}
```

**Query Enhancement**:

```typescript
// Example: Expand abbreviations
"PLN education plan" → "Partido Liberación Nacional education plan"

// Example: Detect implicit filters
"What does the government plan say about healthcare?"
→ filters: { section: ['salud', 'healthcare', 'medicina'] }
```

---

### Stage 2: Query Embedding

**Component**: `QueryEmbedder`

**Responsibilities**:
- Generate embedding for processed query
- Cache query embeddings
- Handle multi-query scenarios

**Input**:
- Processed query string

**Output**:
- Query embedding vector

**Implementation Details**:

```typescript
class QueryEmbedder {
  async embed(query: string): Promise<number[]> {
    // Check cache first
    const cached = await this.cache.get(query);
    if (cached) return cached;

    // Generate embedding
    const embedding = await this.embeddingProvider.generateEmbedding(query);

    // Cache for future queries
    await this.cache.set(query, embedding, TTL_HOURS);

    return embedding;
  }
}
```

---

### Stage 3: Vector Similarity Search

**Component**: `SemanticSearcher`

**Responsibilities**:
- Perform vector similarity search
- Apply metadata filters
- Return top-k results
- Track search metrics

**Input**:
- Query embedding
- Search parameters (k, filters)

**Output**:
- Ranked search results

**Implementation Details**:

```typescript
interface SearchConfig {
  topK: number;                   // Default: 5
  minSimilarity: number;          // Default: 0.7
  filters?: SearchFilters;
  includeMetadata: boolean;       // Default: true
}

interface SearchFilters {
  party?: string[];
  year?: number;
  section?: string[];
  documentId?: string;
}

interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;             // Cosine similarity score (0-1)
  metadata: {
    party: string;
    candidate: string;
    page: number;
    section?: string;
    heading?: string;
  };
}
```

**Search Algorithm**:

```typescript
async function search(
  queryEmbedding: number[],
  config: SearchConfig
): Promise<SearchResult[]> {
  // 1. Perform vector similarity search
  const results = await vectorStore.similaritySearch(
    queryEmbedding,
    config.topK * 2,  // Over-fetch for re-ranking
    config.filters
  );

  // 2. Filter by minimum similarity threshold
  const filtered = results.filter(r => r.similarity >= config.minSimilarity);

  // 3. Return top-k results
  return filtered.slice(0, config.topK);
}
```

---

### Stage 4: Re-ranking (Optional)

**Component**: `ResultReranker`

**Responsibilities**:
- Re-rank results using cross-encoder
- Improve relevance beyond embedding similarity
- Diversify results (avoid redundancy)

**Input**:
- Initial search results
- Original query

**Output**:
- Re-ranked results

**Implementation Details**:

```typescript
interface RerankConfig {
  enabled: boolean;               // Default: false (v1)
  rerankerModel: string;          // e.g., 'cross-encoder/ms-marco-MiniLM-L-6-v2'
  diversityWeight: number;        // 0-1, higher = more diversity
}

async function rerank(
  query: string,
  results: SearchResult[],
  config: RerankConfig
): Promise<SearchResult[]> {
  if (!config.enabled) return results;

  // Calculate cross-encoder scores
  const scores = await rerankerModel.score(
    results.map(r => ({ query, passage: r.content }))
  );

  // Combine with original similarity
  const reranked = results.map((r, i) => ({
    ...r,
    rerankScore: scores[i],
    finalScore: (r.similarity + scores[i]) / 2,
  }));

  // Sort by final score
  return reranked.sort((a, b) => b.finalScore - a.finalScore);
}
```

**Note**: Re-ranking is optional for v1. Can be added later for improved quality.

---

### Stage 5: Context Building

**Component**: `ContextBuilder`

**Responsibilities**:
- Format search results into LLM context
- Apply context window limits
- Include relevant metadata
- Structure for optimal LLM performance

**Input**:
- Search results
- Query
- LLM context window size

**Output**:
- Formatted context string

**Implementation Details**:

```typescript
interface ContextConfig {
  maxContextTokens: number;       // Default: 4000
  includeMetadata: boolean;       // Default: true
  includeSources: boolean;        // Default: true
  contextTemplate: string;
}

const DEFAULT_TEMPLATE = `
Use the following context from Costa Rica's 2026 Government Plans to answer the question.
If the answer is not in the context, say "I don't have enough information to answer that."

CONTEXT:
{context}

QUESTION: {question}

ANSWER:
`;

class ContextBuilder {
  async buildContext(
    query: string,
    results: SearchResult[],
    config: ContextConfig
  ): Promise<string> {
    let context = '';
    let tokenCount = 0;

    for (const result of results) {
      const chunk = this.formatChunk(result, config);
      const chunkTokens = this.estimateTokens(chunk);

      // Stop if adding this chunk exceeds limit
      if (tokenCount + chunkTokens > config.maxContextTokens) {
        break;
      }

      context += chunk + '\n\n';
      tokenCount += chunkTokens;
    }

    return this.applyTemplate(query, context, config.contextTemplate);
  }

  private formatChunk(result: SearchResult, config: ContextConfig): string {
    let formatted = result.content;

    if (config.includeMetadata) {
      formatted = `[${result.metadata.party} - ${result.metadata.section || 'General'}]\n${formatted}`;
    }

    if (config.includeSources) {
      formatted += `\n(Fuente: ${result.metadata.party}, Página ${result.metadata.page})`;
    }

    return formatted;
  }
}
```

---

### Stage 6: LLM Answer Generation

**Component**: `ResponseGenerator`

**Responsibilities**:
- Send context + query to LLM
- Generate answer
- Support streaming responses
- Track token usage

**Input**:
- Query
- Context
- Generation parameters

**Output**:
- LLM-generated answer

**Implementation Details**:

```typescript
interface GenerationConfig {
  llmProvider: ILLMProvider;
  temperature: number;            // Default: 0.3 (factual answers)
  maxTokens: number;              // Default: 500
  streaming: boolean;             // Default: false
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = `
You are a helpful assistant that answers questions about Costa Rica's 2026 Government Plans.

Guidelines:
- Base your answers ONLY on the provided context
- Be factual and objective
- If information is not in the context, say so explicitly
- Cite the political party when referencing their proposals
- Keep answers concise and well-structured
- Use Spanish when appropriate, given the source documents are in Spanish
`;

class ResponseGenerator {
  async generate(
    query: string,
    context: string,
    config: GenerationConfig
  ): Promise<string> {
    const messages = [
      { role: 'system', content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
      { role: 'user', content: context }
    ];

    const response = await config.llmProvider.generateCompletion(messages, {
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    return response.content;
  }

  async *generateStream(
    query: string,
    context: string,
    config: GenerationConfig
  ): AsyncGenerator<string> {
    // Implementation depends on provider's streaming API
    // Yields chunks of the response as they're generated
  }
}
```

---

### Stage 7: Response Formatting

**Component**: `ResponseFormatter`

**Responsibilities**:
- Format final response
- Include sources and citations
- Add confidence scores
- Structure metadata

**Input**:
- LLM answer
- Search results
- Processing metrics

**Output**:
- Formatted RAG response

**Implementation Details**:

```typescript
interface FormattedResponse {
  answer: string;
  sources: Source[];
  confidence: number;               // 0-1 score
  processingTime: number;           // milliseconds
  metadata: {
    model: string;
    tokensUsed: number;
    chunksRetrieved: number;
    avgSimilarity: number;
  };
}

interface Source {
  party: string;
  candidate: string;
  section?: string;
  page: number;
  excerpt: string;                  // Short excerpt from chunk
  relevanceScore: number;
}

class ResponseFormatter {
  format(
    answer: string,
    searchResults: SearchResult[],
    metrics: ProcessingMetrics
  ): FormattedResponse {
    return {
      answer: this.formatAnswer(answer),
      sources: this.formatSources(searchResults),
      confidence: this.calculateConfidence(searchResults, answer),
      processingTime: metrics.totalTimeMs,
      metadata: {
        model: metrics.modelUsed,
        tokensUsed: metrics.tokensUsed,
        chunksRetrieved: searchResults.length,
        avgSimilarity: this.avgSimilarity(searchResults),
      },
    };
  }

  private calculateConfidence(
    results: SearchResult[],
    answer: string
  ): number {
    // Confidence based on:
    // - Average similarity score of retrieved chunks
    // - Number of high-quality results
    // - Answer length and completeness

    if (results.length === 0) return 0;

    const avgSim = this.avgSimilarity(results);
    const highQualityCount = results.filter(r => r.similarity > 0.85).length;
    const qualityRatio = highQualityCount / results.length;

    // Simple confidence formula
    return (avgSim * 0.6) + (qualityRatio * 0.4);
  }
}
```

---

### Query Pipeline Orchestration

**Component**: `RAGPipeline`

**Responsibilities**:
- Orchestrate all query stages
- Handle errors gracefully
- Track performance metrics
- Support streaming responses

**Implementation**:

```typescript
class RAGPipeline {
  async query(request: QueryRequest): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // Stage 1: Process query
      const processed = await this.queryProcessor.process(
        request.query,
        request.filters
      );

      // Stage 2: Generate query embedding
      const embedding = await this.queryEmbedder.embed(processed.processedQuery);

      // Stage 3: Semantic search
      const searchResults = await this.searcher.search(embedding, {
        topK: request.topK || 5,
        filters: { ...processed.detectedFilters, ...request.filters },
      });

      // Stage 4: Re-rank (optional)
      const reranked = await this.reranker.rerank(
        processed.processedQuery,
        searchResults
      );

      // Stage 5: Build context
      const context = await this.contextBuilder.buildContext(
        processed.processedQuery,
        reranked
      );

      // Stage 6: Generate answer
      const answer = await this.responseGenerator.generate(
        processed.processedQuery,
        context
      );

      // Stage 7: Format response
      const response = this.formatter.format(answer, reranked, {
        totalTimeMs: Date.now() - startTime,
        modelUsed: this.config.llmProvider.getModelName(),
        tokensUsed: /* extracted from LLM response */,
      });

      return response;

    } catch (error) {
      // Log error and return graceful failure response
      this.logger.error('RAG pipeline failed', error);
      return this.buildErrorResponse(error);
    }
  }

  async *queryStream(request: QueryRequest): AsyncGenerator<RAGStreamChunk> {
    // Similar to query(), but yields chunks as they're generated
    // Useful for real-time UI updates
  }
}
```

---

## Component Specifications

### Shared Interfaces

All components use interfaces defined in the Provider Abstraction Layer:

- `IEmbeddingProvider` - For generating embeddings
- `IVectorStore` - For vector storage and search
- `ILLMProvider` - For answer generation
- `IDatabaseProvider` - For metadata storage
- `IStorageProvider` - For file storage

See [Provider Abstraction Requirements](./04-provider-abstraction-requirements.md) for detailed specifications.

---

## Error Handling & Monitoring

### Error Categories

1. **Transient Errors** (retryable)
   - Network timeouts
   - Rate limiting
   - Temporary service unavailability

2. **Permanent Errors** (not retryable)
   - Invalid API keys
   - Malformed input
   - Unsupported operations

3. **Data Quality Errors**
   - Extraction failures
   - Invalid chunk quality
   - Missing metadata

### Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: number;              // Default: 3
  initialDelayMs: number;           // Default: 1000
  maxDelayMs: number;               // Default: 10000
  backoffMultiplier: number;        // Default: 2
  retryableErrors: ErrorType[];
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error, config.retryableErrors)) {
        throw error;  // Don't retry permanent errors
      }

      if (attempt < config.maxAttempts) {
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
      }
    }
  }

  throw lastError;
}
```

### Monitoring & Observability

**Key Metrics to Track**:

**Ingestion Pipeline**:
- Documents processed per hour
- Average processing time per document
- Chunk quality score distribution
- Embedding generation rate
- Storage success rate
- Error rate by stage

**Query Pipeline**:
- Queries per second
- Average query latency
- P95/P99 latency
- Average similarity scores
- LLM token usage
- Error rate by stage
- Cache hit rate

**Implementation**:

```typescript
interface PipelineMetrics {
  stage: string;
  operation: string;
  durationMs: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

class MetricsCollector {
  async trackOperation<T>(
    operation: () => Promise<T>,
    context: { stage: string; operation: string }
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();

      this.emit({
        ...context,
        durationMs: Date.now() - startTime,
        success: true,
      });

      return result;

    } catch (error) {
      this.emit({
        ...context,
        durationMs: Date.now() - startTime,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }
}
```

### Logging Strategy

**Log Levels**:
- **DEBUG**: Detailed execution flow
- **INFO**: Important milestones (document processed, query completed)
- **WARN**: Recoverable errors, quality issues
- **ERROR**: Unrecoverable errors, system failures

**Structured Logging**:

```typescript
logger.info('Document ingestion completed', {
  documentId: 'PLN_2026',
  chunksCreated: 245,
  processingTimeMs: 12500,
  provider: 'openai',
});

logger.error('Embedding generation failed', {
  documentId: 'PLN_2026',
  chunkId: 'PLN_2026_p012_c003',
  error: error.message,
  attempt: 3,
});
```

---

## Performance Optimization

### Caching Strategy

**What to Cache**:
1. **Query Embeddings**: Cache frequently asked questions
2. **Search Results**: Cache results for common queries
3. **Document Metadata**: Cache metadata to avoid DB queries
4. **Provider Responses**: Cache LLM responses for identical contexts

**Cache Configuration**:

```typescript
interface CacheConfig {
  enabled: boolean;
  provider: 'redis' | 'memory' | 'none';
  ttl: {
    queryEmbeddings: number;      // Default: 24 hours
    searchResults: number;        // Default: 1 hour
    llmResponses: number;         // Default: 6 hours
    metadata: number;             // Default: 24 hours
  };
}
```

### Batch Processing

**Ingestion**:
- Process multiple documents in parallel (max 5 concurrent)
- Batch embed chunks (50-100 per batch)
- Batch upsert vectors (100-500 per batch)

**Query**:
- Batch embed multiple queries if needed
- Parallel search across indexes
- Pre-fetch popular queries

### Database Optimization

**Vector Database**:
- Use appropriate index type (HNSW for Supabase pgvector)
- Tune index parameters for speed/accuracy tradeoff
- Partition by year or party for faster filtering

**Metadata Database**:
- Index on frequently queried fields (party, year, status)
- Use connection pooling
- Implement read replicas if needed

### Cost Optimization

**Embedding Costs**:
- Cache embeddings aggressively
- Use cheaper models for less critical operations
- Batch requests to maximize throughput

**LLM Costs**:
- Use appropriate model for query complexity
- Implement caching for repeated questions
- Limit max tokens based on expected answer length
- Consider using cheaper models for simple queries

**Vector Database Costs**:
- Monitor storage usage
- Implement data retention policies
- Use appropriate instance size

---

## Testing Strategy

### Unit Tests

Test each component independently:

```typescript
describe('TextChunker', () => {
  it('should split text at paragraph boundaries', () => {
    const text = 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.';
    const chunks = chunker.chunk(text, { targetSize: 20 });

    expect(chunks.length).toBe(3);
    expect(chunks[0].content).toContain('Paragraph 1');
  });

  it('should maintain overlap between chunks', () => {
    const chunks = chunker.chunk(longText, { overlapSize: 100 });

    const lastChars = chunks[0].content.slice(-100);
    const firstChars = chunks[1].content.slice(0, 100);

    expect(lastChars).toBe(firstChars);
  });
});
```

### Integration Tests

Test components working together:

```typescript
describe('Ingestion Pipeline', () => {
  it('should ingest a PDF end-to-end', async () => {
    const result = await pipeline.ingestDocument(testPdfPath);

    expect(result.status).toBe('success');
    expect(result.chunksCreated).toBeGreaterThan(0);

    // Verify chunks are in vector store
    const stored = await vectorStore.getByDocumentId(result.documentId);
    expect(stored.length).toBe(result.chunksCreated);
  });
});

describe('RAG Pipeline', () => {
  it('should answer a question using ingested documents', async () => {
    const response = await pipeline.query({
      query: '¿Qué propone el PLN sobre educación?',
    });

    expect(response.answer).toBeTruthy();
    expect(response.sources.length).toBeGreaterThan(0);
    expect(response.sources[0].party).toBe('PLN');
  });
});
```

### Quality Tests

Test answer quality:

```typescript
describe('Answer Quality', () => {
  const testCases = [
    {
      query: '¿Cuál es la propuesta del PLN sobre salud?',
      expectedParty: 'PLN',
      expectedSection: 'salud',
      minConfidence: 0.7,
    },
    // More test cases...
  ];

  testCases.forEach(({ query, expectedParty, expectedSection, minConfidence }) => {
    it(`should answer: "${query}"`, async () => {
      const response = await pipeline.query({ query });

      expect(response.sources[0].party).toBe(expectedParty);
      expect(response.sources[0].section).toContain(expectedSection);
      expect(response.confidence).toBeGreaterThan(minConfidence);
    });
  });
});
```

### Performance Tests

Benchmark pipeline performance:

```typescript
describe('Performance', () => {
  it('should process queries within SLA', async () => {
    const queries = generateTestQueries(100);
    const startTime = Date.now();

    await Promise.all(queries.map(q => pipeline.query({ query: q })));

    const avgLatency = (Date.now() - startTime) / queries.length;

    expect(avgLatency).toBeLessThan(2000);  // < 2s average
  });

  it('should handle concurrent queries', async () => {
    const queries = Array(50).fill('test query');

    await expect(
      Promise.all(queries.map(q => pipeline.query({ query: q })))
    ).resolves.toBeTruthy();
  });
});
```

---

## Success Criteria

### Ingestion Pipeline

- ✅ Successfully process 100% of TSE PDFs
- ✅ Maintain average chunk quality score > 0.7
- ✅ Process documents at >10 pages/minute
- ✅ Error rate < 1% per stage
- ✅ Generate embeddings for all valid chunks

### Query Pipeline

- ✅ Average query latency < 2 seconds (P95)
- ✅ Return relevant results for >90% of queries
- ✅ Average confidence score > 0.6
- ✅ Support 10+ concurrent queries
- ✅ Proper source attribution in all answers

### System Quality

- ✅ 95%+ uptime
- ✅ Graceful degradation on provider failures
- ✅ Comprehensive error logging
- ✅ Cost per query < target threshold
- ✅ All components have >80% test coverage

---

## Future Enhancements

### Phase 2+

1. **Advanced Re-ranking**: Implement cross-encoder re-ranking
2. **Hybrid Search**: Combine vector search with keyword search
3. **Multi-turn Conversations**: Maintain conversation context
4. **Answer Caching**: Intelligent caching of common queries
5. **Query Expansion**: Automatic query refinement
6. **Multilingual Support**: Handle English and Spanish queries
7. **Streaming Responses**: Real-time answer streaming
8. **A/B Testing Framework**: Test different retrieval strategies
9. **User Feedback Loop**: Learn from user ratings
10. **Advanced Analytics**: Track query patterns and insights
