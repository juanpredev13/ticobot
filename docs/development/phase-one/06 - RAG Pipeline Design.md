# TASK: RAG Pipeline Design & Implementation

#ticobot #backlog

## Description

Design and implement both the ingestion and query pipelines for the RAG system:
- Ingestion phase: PDF → cleaned text → chunks → embeddings → vector DB
- Query phase: Question → embedding → vector search → context → LLM → answer

## Why?

The RAG pipeline is the core of the system:
- Enables semantic search over government plans
- Provides context-aware answers
- Ensures data quality through proper ingestion
- Delivers accurate, sourced responses to users

## Deliverables

### Ingestion Phase
- [ ] PDF scraper for TSE website
- [ ] PDF downloader
- [ ] Text extraction (page-by-page)
- [ ] Text cleaning and normalization
- [ ] Chunking algorithm (800-1500 chars, with overlap)
- [ ] Embedding generation (batch processing)
- [ ] Vector database insertion with metadata
- [ ] Progress tracking and error handling

### Query Phase
- [ ] Question embedding generation
- [ ] Vector similarity search (Top-k retrieval)
- [ ] Optional re-ranking implementation
- [ ] Context prompt builder
- [ ] LLM answer generation
- [ ] Response formatter (answer + sources + metadata)
- [ ] Error handling and fallbacks

## Related Documentation

- `Development/Phase 1 Architecture Analysis & System Design.md` - Section 1.6
- `Notes/Cost Analysis - F1Bot at Scale.md`

## Pipeline Flow

### Ingestion
```
TSE Website → Scrape URLs → Download PDFs → Extract Text
    ↓
Clean & Normalize → Chunk Text → Generate Embeddings
    ↓
Insert into Vector DB with Metadata
```

### Query
```
User Question → Generate Embedding → Vector Search (Top-5)
    ↓
Optional Re-ranking → Build Context Prompt
    ↓
LLM Generation → Format Response (answer + sources)
```

## Notes

Key considerations:
- Chunk overlap: 100-200 characters for context preservation
- Batch size for embeddings: 50-100 chunks per batch
- Error handling: Retry logic for API failures
- Progress tracking: Log each step for debugging

## Testing

- [ ] Ingestion pipeline tested with sample PDFs
- [ ] Text extraction quality validated
- [ ] Chunking produces meaningful segments
- [ ] Embeddings generated successfully
- [ ] Vector DB insertion working
- [ ] Query pipeline returns relevant results
- [ ] Answer quality is acceptable
- [ ] Sources are correctly attributed

## Dependencies

- Task 1.2: Dataset Specification
- Task 1.4: Provider Abstraction Layer
- Task 1.5: Backend Folder Structure

## Next Steps

After completion, proceed to:
- Task 1.7: Technology Decisions (finalize stack)
- Frontend implementation (Next.js UI)
- Performance optimization
