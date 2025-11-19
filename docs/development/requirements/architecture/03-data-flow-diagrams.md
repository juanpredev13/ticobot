# Data Flow Diagrams

## Overview

This document provides comprehensive data flow diagrams for all major workflows in the TicoBot system.

---

## 1. PDF Ingestion Flow

### High-Level Flow

```mermaid
graph TD
    Start([Start Ingestion]) --> FetchURLs[Fetch TSE PDF URLs]
    FetchURLs --> Download[Download PDFs]
    Download --> Validate[Validate PDFs]
    Validate --> Extract[Extract Text]
    Extract --> Clean[Clean & Normalize Text]
    Clean --> Chunk[Split into Chunks]
    Chunk --> Embed[Generate Embeddings]
    Embed --> Store[Store in Vector DB]
    Store --> SaveMeta[Save Metadata to DB]
    SaveMeta --> End([Ingestion Complete])
```

### Detailed Ingestion Flow with Components

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant IngestUC as IngestPDFUseCase
    participant Pipeline as PDF Pipeline
    participant Cleaner as Text Cleaner
    participant Chunker as Chunking Module
    participant Embedder as Embedding Generator
    participant VectorDB as Vector Store
    participant DB as Database
    participant Storage as File Storage

    Admin->>API: POST /ingest/pdfs
    API->>IngestUC: execute(pdfUrls)

    loop For each PDF
        IngestUC->>Pipeline: downloadAndExtract(url)
        Pipeline->>Storage: uploadPDF(file)
        Storage-->>Pipeline: fileUrl
        Pipeline->>Pipeline: extractText(pdf)
        Pipeline-->>IngestUC: rawText

        IngestUC->>Cleaner: clean(rawText)
        Cleaner-->>IngestUC: cleanedText

        IngestUC->>Chunker: chunk(cleanedText)
        Chunker-->>IngestUC: chunks[]

        IngestUC->>Embedder: generateEmbeddings(chunks)
        Embedder-->>IngestUC: chunksWithEmbeddings[]

        IngestUC->>VectorDB: upsertVectors(chunksWithEmbeddings)
        VectorDB-->>IngestUC: success

        IngestUC->>DB: saveDocument(metadata)
        DB-->>IngestUC: documentId
    end

    IngestUC-->>API: IngestionResult
    API-->>Admin: 200 OK + Stats
```

### Data Transformations

```mermaid
graph LR
    A[PDF File<br/>52 MB total] --> B[Raw Text<br/>~500K chars]
    B --> C[Cleaned Text<br/>~475K chars]
    C --> D[Chunks<br/>~300 chunks]
    D --> E[Embeddings<br/>300 x 1536 vectors]
    E --> F[Stored Vectors<br/>+ Metadata]

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#e8f5e9
    style D fill:#f3e5f5
    style E fill:#fce4ec
    style F fill:#e0f2f1
```

---

## 2. Search Query Flow

### Semantic Search Flow

```mermaid
graph TD
    Start([User enters query]) --> Embed[Embed Query]
    Embed --> VectorSearch[Vector Similarity Search]
    VectorSearch --> Retrieve[Retrieve Top-K Chunks]
    Retrieve --> Rank[Rank by Relevance]
    Rank --> Format[Format Results]
    Format --> Return([Return to User])
```

### Detailed Search Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant SearchUC as SearchUseCase
    participant Embedder as Embedding Generator
    participant VectorDB as Vector Store
    participant DB as Database

    User->>UI: Enter search query
    UI->>API: GET /search?q="educación"
    API->>SearchUC: execute(query, options)

    SearchUC->>Embedder: generateEmbedding(query)
    Embedder-->>SearchUC: queryVector[1536]

    SearchUC->>VectorDB: search(queryVector, topK=5)
    VectorDB-->>SearchUC: searchResults[]

    SearchUC->>DB: enrichMetadata(results)
    DB-->>SearchUC: enrichedResults[]

    SearchUC-->>API: SearchResponse
    API-->>UI: 200 OK + Results
    UI-->>User: Display results
```

### Search Result Structure

```typescript
{
  query: "¿Qué proponen sobre educación?",
  results: [
    {
      chunk_id: "PLN_2026_pg12_chunk003",
      content: "Proponemos invertir 8% del PIB en educación...",
      score: 0.87,
      metadata: {
        party: "PLN",
        candidate: "José María Figueres",
        page: 12,
        section: "Educación",
        source: "https://www.tse.go.cr/2026/planesgobierno/pln.pdf"
      }
    },
    // ... 4 more results
  ],
  totalResults: 5,
  processingTimeMs: 87
}
```

---

## 3. RAG Chat Flow

### RAG Pipeline Flow

```mermaid
graph TD
    Start([User asks question]) --> Embed[Embed Question]
    Embed --> VectorSearch[Vector Search]
    VectorSearch --> Retrieve[Retrieve Top-K Chunks]
    Retrieve --> BuildContext[Build Context Prompt]
    BuildContext --> LLM[Generate Answer via LLM]
    LLM --> Cite[Add Citations]
    Cite --> Return([Return Answer + Sources])
```

### Detailed RAG Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant ChatUC as ChatUseCase
    participant Embedder as Embedding Generator
    participant VectorDB as Vector Store
    participant LLM as LLM Provider

    User->>UI: Ask: "¿Qué propone el PLN sobre salud?"
    UI->>API: POST /chat/message
    API->>ChatUC: execute(question)

    ChatUC->>Embedder: generateEmbedding(question)
    Embedder-->>ChatUC: queryVector[1536]

    ChatUC->>VectorDB: search(queryVector, topK=5)
    VectorDB-->>ChatUC: relevantChunks[]

    ChatUC->>ChatUC: buildPrompt(question, chunks)

    ChatUC->>LLM: generateText(prompt)
    LLM-->>ChatUC: answer

    ChatUC->>ChatUC: addCitations(answer, chunks)

    ChatUC-->>API: ChatResponse
    API-->>UI: 200 OK + Answer
    UI-->>User: Display answer with sources
```

### Context Building Process

```mermaid
graph LR
    Q[User Question] --> E[Embed]
    E --> S[Search]
    S --> C1[Chunk 1<br/>Score: 0.92]
    S --> C2[Chunk 2<br/>Score: 0.88]
    S --> C3[Chunk 3<br/>Score: 0.85]
    S --> C4[Chunk 4<br/>Score: 0.81]
    S --> C5[Chunk 5<br/>Score: 0.78]

    C1 --> Context[Build Context]
    C2 --> Context
    C3 --> Context
    C4 --> Context
    C5 --> Context

    Context --> Prompt[Full Prompt]
    Q --> Prompt
    Prompt --> LLM[LLM]
    LLM --> Answer[Answer + Citations]

    style C1 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style C3 fill:#fff9c4
    style C4 fill:#fff9c4
    style C5 fill:#ffccbc
```

### RAG Prompt Template

```
System: Eres un asistente experto en planes de gobierno de Costa Rica 2026.

Usa SOLO la información del contexto para responder la pregunta.
Si no encuentras la respuesta en el contexto, di "No encuentro esa información en los planes de gobierno".

CONTEXTO:
[1] PLN - Salud
Proponemos fortalecer el sistema de salud mediante...
Source: PLN Plan de Gobierno 2026, pág. 15

[2] PUSC - Salud
Nuestro plan de salud incluye...
Source: PUSC Plan de Gobierno 2026, pág. 22

[... más chunks ...]

PREGUNTA:
¿Qué propone el PLN sobre salud?

RESPUESTA:
```

---

## 4. Provider Switching Flow

### Runtime Provider Switching

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant ChatUC as ChatUseCase
    participant Registry as Provider Registry
    participant Provider1 as OpenAI Provider
    participant Provider2 as Claude Provider

    User->>UI: Select Claude as LLM
    UI->>API: PUT /settings/provider {llm: "claude"}
    API->>Registry: setLLMProvider("claude")
    Registry-->>API: Provider updated
    API-->>UI: 200 OK

    User->>UI: Ask question
    UI->>API: POST /chat/message
    API->>ChatUC: execute(question)
    ChatUC->>Registry: getLLMProvider()
    Registry-->>ChatUC: ClaudeProvider
    ChatUC->>Provider2: generateText(prompt)
    Provider2-->>ChatUC: answer
    ChatUC-->>API: ChatResponse
    API-->>UI: Display answer
```

### Multi-Provider Comparison Flow

```mermaid
graph TD
    Start([User enables A/B testing]) --> Question[User asks question]
    Question --> Embed[Embed Question]
    Embed --> Search[Vector Search]
    Search --> Chunks[Retrieve Chunks]

    Chunks --> BuildPrompt[Build Prompt]

    BuildPrompt --> LLM1[OpenAI GPT-4]
    BuildPrompt --> LLM2[Claude 3.5 Sonnet]
    BuildPrompt --> LLM3[Gemini 1.5 Flash]

    LLM1 --> Answer1[Answer A]
    LLM2 --> Answer2[Answer B]
    LLM3 --> Answer3[Answer C]

    Answer1 --> Compare[Compare Answers]
    Answer2 --> Compare
    Answer3 --> Compare

    Compare --> Display([Display side-by-side])
```

---

## 5. Batch Processing Flow

### Bulk PDF Ingestion

```mermaid
graph TD
    Start([Start Batch]) --> Queue[Add PDFs to Queue]
    Queue --> Worker1[Worker 1<br/>Process PDF 1-7]
    Queue --> Worker2[Worker 2<br/>Process PDF 8-14]
    Queue --> Worker3[Worker 3<br/>Process PDF 15-20]

    Worker1 --> Process1[Extract, Clean, Chunk, Embed]
    Worker2 --> Process2[Extract, Clean, Chunk, Embed]
    Worker3 --> Process3[Extract, Clean, Chunk, Embed]

    Process1 --> Store[Store in Vector DB]
    Process2 --> Store
    Process3 --> Store

    Store --> Progress[Update Progress]
    Progress --> Complete{All done?}
    Complete -->|No| Queue
    Complete -->|Yes| Report([Generate Report])
```

### Batch Progress Tracking

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant BatchJob as Batch Job
    participant Queue as Job Queue
    participant Worker as Worker Process
    participant DB

    Admin->>API: POST /batch/ingest
    API->>BatchJob: createJob(pdfs)
    BatchJob->>Queue: enqueue(job)
    Queue-->>API: jobId
    API-->>Admin: 202 Accepted {jobId}

    loop For each PDF
        Worker->>Queue: dequeue()
        Queue-->>Worker: pdf
        Worker->>Worker: process(pdf)
        Worker->>DB: updateProgress(jobId)
    end

    Admin->>API: GET /batch/status/{jobId}
    API->>DB: getJobStatus(jobId)
    DB-->>API: status
    API-->>Admin: {processed: 15/20, status: "processing"}
```

---

## 6. Error Handling Flow

### Retry Logic for Failed Embeddings

```mermaid
graph TD
    Start([Generate Embeddings]) --> API[Call Embedding API]
    API --> Success{Success?}
    Success -->|Yes| Store[Store Embeddings]
    Success -->|No| CheckRetry{Retries < 3?}

    CheckRetry -->|Yes| Wait[Exponential Backoff]
    Wait --> API

    CheckRetry -->|No| Log[Log Error]
    Log --> Skip[Skip Chunk]
    Skip --> Continue[Continue Processing]

    Store --> Complete([Complete])
    Continue --> Complete
```

### Graceful Degradation

```mermaid
graph TD
    Start([User Query]) --> Primary[Try Primary Vector DB]
    Primary --> Check1{Success?}
    Check1 -->|Yes| Return([Return Results])

    Check1 -->|No| Fallback1[Try Fallback Vector DB]
    Fallback1 --> Check2{Success?}
    Check2 -->|Yes| Return

    Check2 -->|No| Cache[Check Cache]
    Cache --> Check3{Cache Hit?}
    Check3 -->|Yes| Return

    Check3 -->|No| Error([Return Error + Retry Info])
```

---

## 7. Caching Flow

### Query Result Caching

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Cache
    participant SearchUC as SearchUseCase
    participant VectorDB

    User->>API: Search query: "educación"
    API->>Cache: get("educación")
    Cache-->>API: MISS

    API->>SearchUC: execute(query)
    SearchUC->>VectorDB: search(vector)
    VectorDB-->>SearchUC: results
    SearchUC-->>API: response

    API->>Cache: set("educación", response, ttl=3600)
    API-->>User: Display results

    Note over User,Cache: 5 minutes later...

    User->>API: Search query: "educación"
    API->>Cache: get("educación")
    Cache-->>API: HIT - cached results
    API-->>User: Display results (from cache)
```

### Cache Invalidation

```mermaid
graph TD
    Start([Data Update Event]) --> Type{Update Type}

    Type -->|New PDF Ingested| InvalidateAll[Invalidate All Caches]
    Type -->|Chunk Updated| InvalidateChunk[Invalidate Related Queries]
    Type -->|Provider Changed| InvalidateProvider[Invalidate Provider Cache]

    InvalidateAll --> Notify[Notify Cache Manager]
    InvalidateChunk --> Notify
    InvalidateProvider --> Notify

    Notify --> Clear[Clear Cache Entries]
    Clear --> Log[Log Cache Stats]
    Log --> End([Cache Invalidated])
```

---

## Data Flow Summary

### Complete System Data Flow

```mermaid
graph TB
    subgraph "Ingestion"
        TSE[TSE PDFs] --> Download[Download]
        Download --> Extract[Extract Text]
        Extract --> Clean[Clean Text]
        Clean --> Chunk[Chunk Text]
        Chunk --> Embed1[Generate Embeddings]
        Embed1 --> VectorDB[(Vector Database)]
    end

    subgraph "Query Processing"
        Question[User Question] --> Embed2[Embed Question]
        Embed2 --> Search[Vector Search]
        Search --> VectorDB
        VectorDB --> Results[Top-K Results]
    end

    subgraph "RAG Generation"
        Results --> Context[Build Context]
        Context --> Prompt[Build Prompt]
        Question --> Prompt
        Prompt --> LLM[LLM Provider]
        LLM --> Answer[Generated Answer]
        Answer --> Citations[Add Citations]
        Results --> Citations
    end

    subgraph "User Interface"
        Citations --> UI[Next.js UI]
        UI --> Display[Display to User]
    end

    style TSE fill:#e3f2fd
    style VectorDB fill:#fff3e0
    style LLM fill:#f3e5f5
    style UI fill:#e8f5e9
```

---

## Performance Considerations

### Bottleneck Analysis

| Component | Expected Latency | Optimization Strategy |
|-----------|------------------|----------------------|
| PDF Download | 1-5s per PDF | Parallel downloads (3 workers) |
| Text Extraction | 0.5-2s per PDF | Use fast parser (pdfjs-dist) |
| Embedding Generation | 0.1-0.5s per batch | Batch 100 chunks at a time |
| Vector Search | <100ms | HNSW indexing, query caching |
| LLM Generation | 2-10s | Streaming responses, caching |

### Data Volume Estimates

```
Input:  20 PDFs × 2.6 MB avg = 52 MB
Text:   ~500K characters total
Chunks: ~300 chunks × 1.5KB avg = 450 KB
Vectors: 300 × 1536 dimensions × 4 bytes = 1.8 MB
Storage: 52 MB (PDFs) + 1.8 MB (vectors) + 0.5 MB (metadata) = ~54 MB
```

---

## Next Steps

After understanding these data flows, proceed to:
1. **Task 1.4**: Implement provider interfaces based on these flows
2. **Task 1.5**: Structure backend folders to support these flows
3. **Task 1.6**: Implement RAG pipeline following these diagrams
