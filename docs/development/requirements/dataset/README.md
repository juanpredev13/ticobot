# Dataset Specification - Complete Reference

## Overview

This folder contains the complete dataset specification for TicoBot's 2026 Costa Rica Government Plans RAG system.

**Data Source**: 20 political party government plan PDFs from TSE (Tribunal Supremo de Elecciones)
**Total Size**: 52 MB
**Estimated Pages**: 1,000-2,000
**Estimated Chunks**: 5,000-15,000

---

## Documentation Structure

### [01 - TSE PDF Sources](./01-tse-pdf-sources.md)
Complete catalog of all 20 government plan PDFs.

**Contents**:
- Full party list with PDF URLs
- File sizes and metadata
- Download metadata schema
- Update detection strategy

**Key Info**:
- Base URL: `https://www.tse.go.cr/2026/docus/planesgobierno/`
- Parties: CR1, ACRM, PA, CDS, CAC, PDLCT, PEN, PEL, FA, PIN, PJSC, PLN, PLP, PNG, PNR, PSD, PPSO, PUSC, UP, PUCD
- Smallest: PUCD (238 KB)
- Largest: PNG (7.1 MB)

### [02 - Metadata Schema](./02-metadata-schema.md)
TypeScript type definitions for all metadata layers.

**Contents**:
- `DocumentMetadata` - PDF-level metadata
- `PageMetadata` - Page-level metadata
- `ChunkMetadata` - Chunk-level metadata (RAG)
- `SearchResultMetadata` - Search result metadata
- PostgreSQL table schemas
- Validation rules

**Key Types**:
```typescript
interface ChunkMetadata {
  id: string;
  content: string;
  party_code: string;
  year: number;
  page_number: number;
  embedding: number[];
  // ... 20+ fields
}
```

### [03 - Chunking Strategy](./03-chunking-strategy.md)
Detailed specification for text chunking algorithm.

**Contents**:
- Chunk size specifications (400-2000 chars)
- Break point detection algorithm
- Overlap strategy (100-200 chars)
- Quality scoring
- Special cases (tables, lists, headings)

**Key Specs**:
- **Target size**: 800-1500 characters
- **Overlap**: 100-200 characters
- **Minimum**: 400 characters
- **Maximum**: 2000 characters

### [04 - Output Formats and Validation](./04-output-formats-and-validation.md)
JSON schemas and validation rules for all outputs.

**Contents**:
- Output format for each pipeline stage
- JSON schema definitions
- Validation scripts
- Search/query response formats
- Export formats (CSV, Parquet)

**Pipeline Stages**:
1. PDF Download → JSON metadata
2. PDF Extraction → JSONL pages
3. Chunking → JSONL chunks
4. Embedding → JSONL embeddings
5. Vector DB → SQL inserts
6. Search → JSON responses

### [05 - Data Quality Requirements](./05-data-quality-requirements.md)
Comprehensive quality standards and validation.

**Contents**:
- Quality dimensions (accuracy, completeness, consistency)
- Stage-by-stage quality requirements
- Validation code examples
- Quality metrics and thresholds
- Testing strategies

**Quality Gates**:
- Extraction quality: > 95% accuracy
- Chunk quality: > 90% score > 0.7
- Embedding coverage: 100%
- Search relevance: > 80% (top-5)
- RAG groundedness: 100% (no hallucinations)

---

## Quick Reference

### Data Flow

```
TSE Website
  ↓ (Download)
PDF Files (20 parties, 52 MB)
  ↓ (Extract)
Pages (~1,000-2,000 pages)
  ↓ (Clean & Normalize)
Cleaned Text
  ↓ (Chunk)
Chunks (5,000-15,000 chunks, 800-1500 chars each)
  ↓ (Embed)
Vectors (1536-dim embeddings)
  ↓ (Index)
Vector Database (Supabase pgvector)
  ↓ (Query)
Search Results + RAG Answers
```

### Key Specifications

| Aspect | Specification |
|--------|--------------|
| **Source** | TSE 2026 government plan PDFs |
| **Parties** | 20 registered parties |
| **Language** | Spanish (Costa Rican) |
| **Total Size** | 52 MB |
| **Chunk Size** | 800-1500 chars (target) |
| **Chunk Overlap** | 100-200 chars |
| **Embedding Model** | text-embedding-3-small (or configurable) |
| **Embedding Dim** | 1536 (depends on model) |
| **Vector DB** | Supabase pgvector |
| **Estimated Chunks** | 5,000-15,000 |

### Metadata Fields (Chunk Level)

**Identifiers**: `id`, `document_id`, `page_id`, `chunk_index`
**Content**: `content`, `char_count`, `word_count`
**Party**: `party_code`, `party_full_name`, `presidential_candidate`
**Source**: `year`, `page_number`, `source_url`, `local_filename`
**Semantic**: `section`, `subsection`, `topic_tags`
**Features**: `contains_numbers`, `contains_bullet_list`, `is_heading`
**Embedding**: `embedding`, `embedding_model`, `embedding_dimension`
**Context**: `previous_chunk_id`, `next_chunk_id`, `overlap_chars`
**Quality**: `quality_score`, `language_detected`
**Timestamps**: `created_at`, `indexed_at`

### Quality Targets

| Stage | Metric | Target |
|-------|--------|--------|
| Download | Success rate | 100% |
| Extraction | High quality pages | > 80% |
| Cleaning | Content preservation | > 90% |
| Chunking | Size compliance | 100% |
| Chunking | Semantic coherence | > 90% |
| Embedding | Coverage | 100% |
| Metadata | Completeness | 100% |
| Search | Relevance (top-5) | > 80% |
| RAG | Groundedness | 100% |

---

## Implementation Checklist

### Data Preparation
- [ ] Download all 20 PDFs from TSE
- [ ] Verify checksums and file integrity
- [ ] Extract party names and candidate info
- [ ] Store download metadata

### Text Extraction
- [ ] Extract text from all PDFs page-by-page
- [ ] Assess extraction quality
- [ ] Identify pages requiring OCR
- [ ] Store page metadata

### Text Processing
- [ ] Clean extracted text (remove artifacts)
- [ ] Normalize whitespace and encoding
- [ ] Validate cleaning quality
- [ ] Store cleaned text

### Chunking
- [ ] Implement chunking algorithm
- [ ] Apply to all cleaned pages
- [ ] Generate chunk metadata
- [ ] Validate chunk quality
- [ ] Link chunks (previous/next)

### Embedding
- [ ] Generate embeddings for all chunks
- [ ] Validate embedding dimensions
- [ ] Store embeddings with metadata
- [ ] Verify 100% coverage

### Database
- [ ] Create PostgreSQL tables
- [ ] Enable pgvector extension
- [ ] Insert all chunks with embeddings
- [ ] Create indexes (vector + metadata)
- [ ] Verify referential integrity

### Quality Assurance
- [ ] Run all validation scripts
- [ ] Review quality scorecard
- [ ] Manual review of sample chunks
- [ ] Test search quality
- [ ] Test RAG answer quality

### Documentation
- [ ] Document any deviations from spec
- [ ] Record quality metrics achieved
- [ ] Note any problematic PDFs/pages
- [ ] Create dataset versioning system

---

## Data Access Examples

### Query Chunks by Party

```sql
SELECT id, content, page_number, section
FROM chunks
WHERE party_code = 'PLN'
ORDER BY page_number, chunk_index
LIMIT 10;
```

### Vector Similarity Search

```sql
SELECT
  id,
  content,
  party_code,
  page_number,
  1 - (embedding <=> query_embedding) AS similarity
FROM chunks
WHERE party_code = 'PLN'
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

### Get Document Statistics

```sql
SELECT
  d.party_code,
  d.page_count,
  COUNT(c.id) as chunk_count,
  AVG(c.char_count) as avg_chunk_size
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
GROUP BY d.id, d.party_code, d.page_count
ORDER BY d.party_code;
```

---

## Testing Dataset Quality

### Automated Tests

```bash
# Run full validation suite
npm run validate:dataset

# Validate specific stages
npm run validate:downloads
npm run validate:extraction
npm run validate:chunks
npm run validate:embeddings
npm run validate:metadata
```

### Manual Validation

```bash
# Sample random chunks for review
npm run sample:chunks --count 100

# Generate quality report
npm run quality:report

# Test search quality
npm run test:search

# Test RAG quality
npm run test:rag
```

---

## Versioning and Updates

### Dataset Versioning

```
ticobot_dataset_v1.0.0
├─ downloaded: 2025-11-18
├─ indexed: 2025-11-19
├─ parties: 20
├─ chunks: 12,450
├─ embedding_model: text-embedding-3-small
└─ quality_score: 0.92
```

### Update Procedure

1. Monitor TSE website for PDF updates
2. Download updated PDFs
3. Re-extract and re-chunk changed documents
4. Regenerate embeddings for changed chunks
5. Update vector database
6. Increment dataset version
7. Run full validation suite
8. Document changes

---

## Related Documentation

- `/docs/development/requirements/` - Parent requirements folder
- `/docs/development/phase-one/02 - Dataset Specification.md` - Original task definition
- `/CLAUDE.md` - Project overview

---

**Status**: ✅ Dataset specification complete
**Last Updated**: 2025-11-18
**Next Phase**: Implementation (Data Pipeline Development)
