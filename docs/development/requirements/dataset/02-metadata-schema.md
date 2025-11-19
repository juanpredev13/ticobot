# Metadata Schema Definition

## Overview

This document defines the complete metadata schema for TicoBot's data pipeline, from raw PDFs through to indexed vector chunks.

---

## Schema Layers

### Layer 1: Document Metadata (PDF Level)
Metadata about the entire government plan document.

### Layer 2: Page Metadata (Page Level)
Metadata for each extracted page.

### Layer 3: Chunk Metadata (Chunk Level)
Metadata for each semantic chunk used in RAG.

---

## TypeScript Type Definitions

### Document Metadata

```typescript
/**
 * Metadata for a complete government plan PDF document
 */
interface DocumentMetadata {
  // Identifiers
  id: string;                    // Unique document ID (e.g., "PLN_2026")
  party_code: string;            // Party abbreviation (e.g., "PLN", "PUSC")
  party_full_name: string;       // Full party name (e.g., "Partido Liberación Nacional")

  // Election Info
  year: number;                  // Election year (2026)
  election_type: 'presidential'; // Type of election

  // Candidates
  presidential_candidate: string;    // Presidential candidate name
  vice_presidential_candidates?: string[]; // VP candidate(s)

  // Source Information
  source_url: string;            // Original TSE URL
  local_filename: string;        // Downloaded filename
  downloaded_at: string;         // ISO 8601 timestamp
  file_size_bytes: number;       // PDF file size
  checksum: string;              // SHA-256 hash for integrity

  // Document Properties
  page_count: number;            // Total pages in PDF
  estimated_word_count?: number; // Estimated words
  language: string;              // ISO 639-1 code ("es")

  // Processing Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_at?: string;         // When text extraction completed
  indexed_at?: string;           // When vector indexing completed
  error_message?: string;        // Error details if failed

  // Statistics
  chunk_count?: number;          // Total chunks created
  embedding_count?: number;      // Total embeddings generated

  // Timestamps
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
}
```

---

### Page Metadata

```typescript
/**
 * Metadata for a single page from a PDF
 */
interface PageMetadata {
  // Identifiers
  id: string;                    // Unique page ID (e.g., "PLN_2026_p012")
  document_id: string;           // Parent document ID
  page_number: number;           // Page number (1-indexed)

  // Content
  raw_text: string;              // Extracted text before cleaning
  cleaned_text: string;          // Text after cleaning
  char_count: number;            // Character count
  word_count: number;            // Word count

  // Quality Metrics
  extraction_quality: 'high' | 'medium' | 'low';
  requires_ocr: boolean;         // Whether OCR was needed
  confidence_score?: number;     // OCR confidence (0-1)

  // Structure Detection
  detected_section?: string;     // Detected section/heading
  contains_table: boolean;       // Has tabular data
  contains_image: boolean;       // Has images

  // Processing
  extracted_at: string;          // ISO 8601
  chunk_ids: string[];           // IDs of chunks from this page
}
```

---

### Chunk Metadata (RAG Vector Store)

```typescript
/**
 * Complete metadata for a semantic chunk stored in vector database
 * This is the primary schema used during RAG retrieval
 */
interface ChunkMetadata {
  // ===== IDENTIFIERS =====
  id: string;                    // Unique chunk ID (e.g., "PLN_2026_p012_c003")
  document_id: string;           // Parent document ID
  page_id: string;               // Parent page ID
  chunk_index: number;           // Sequence number within page (0-indexed)

  // ===== CONTENT =====
  content: string;               // The actual text content of the chunk
  char_count: number;            // Character count
  word_count: number;            // Word count

  // ===== PARTY INFORMATION =====
  party_code: string;            // Party abbreviation (e.g., "PLN")
  party_full_name: string;       // Full party name
  presidential_candidate: string; // Candidate name

  // ===== SOURCE INFORMATION =====
  year: number;                  // Election year (2026)
  page_number: number;           // Source page number
  source_url: string;            // Original PDF URL
  local_filename: string;        // Local PDF filename

  // ===== SEMANTIC INFORMATION =====
  section?: string;              // Detected section/topic
  subsection?: string;           // Finer-grained classification
  topic_tags?: string[];         // Auto-detected topics (e.g., ["education", "budget"])

  // ===== CONTENT CHARACTERISTICS =====
  contains_numbers: boolean;     // Has quantitative data
  contains_bullet_list: boolean; // Has list formatting
  is_heading: boolean;           // Is a heading/title

  // ===== EMBEDDING =====
  embedding: number[];           // Vector embedding
  embedding_model: string;       // Model used (e.g., "text-embedding-3-small")
  embedding_dimension: number;   // Vector dimension

  // ===== CONTEXT =====
  previous_chunk_id?: string;    // Previous chunk for context
  next_chunk_id?: string;        // Next chunk for context
  overlap_chars: number;         // Overlap with adjacent chunks

  // ===== QUALITY =====
  quality_score?: number;        // Quality assessment (0-1)
  language_detected: string;     // ISO 639-1 code

  // ===== TIMESTAMPS =====
  created_at: string;            // ISO 8601
  indexed_at: string;            // When added to vector store
}
```

---

### Search Result Metadata

```typescript
/**
 * Extended metadata returned with search results
 */
interface SearchResultMetadata extends ChunkMetadata {
  // Search-specific fields
  similarity_score: number;      // Cosine similarity (0-1)
  rank: number;                  // Result ranking (1-indexed)

  // Context expansion
  surrounding_chunks?: ChunkMetadata[]; // Adjacent chunks for context
  page_context?: string;         // Full page text if needed

  // Highlighting
  highlighted_content?: string;  // Content with search terms highlighted
}
```

---

## Metadata Storage Strategy

### PostgreSQL (Supabase) - Document & Page Metadata

**documents table**:
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  party_code TEXT NOT NULL,
  party_full_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  presidential_candidate TEXT NOT NULL,
  source_url TEXT NOT NULL,
  local_filename TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL,
  file_size_bytes BIGINT,
  checksum TEXT,
  page_count INTEGER,
  status TEXT NOT NULL,
  chunk_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_party ON documents(party_code);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_year ON documents(year);
```

**pages table**:
```sql
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  cleaned_text TEXT,
  char_count INTEGER,
  extraction_quality TEXT,
  requires_ocr BOOLEAN DEFAULT FALSE,
  extracted_at TIMESTAMPTZ,
  UNIQUE(document_id, page_number)
);

CREATE INDEX idx_pages_document ON pages(document_id);
```

---

### pgvector (Supabase) - Chunk Metadata

**chunks table** with vector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  page_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,

  content TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,

  party_code TEXT NOT NULL,
  party_full_name TEXT NOT NULL,
  presidential_candidate TEXT NOT NULL,

  year INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  source_url TEXT NOT NULL,

  section TEXT,
  topic_tags TEXT[],

  contains_numbers BOOLEAN DEFAULT FALSE,

  embedding vector(1536),  -- Dimension depends on embedding model
  embedding_model TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  indexed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vector search
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);  -- Adjust based on dataset size

-- Indexes for filtering
CREATE INDEX idx_chunks_party ON chunks(party_code);
CREATE INDEX idx_chunks_year ON chunks(year);
CREATE INDEX idx_chunks_document ON chunks(document_id);
CREATE INDEX idx_chunks_section ON chunks(section);

-- Full-text search support
CREATE INDEX idx_chunks_content_fts ON chunks USING gin(to_tsvector('spanish', content));
```

---

## Metadata Validation Rules

### Document Level
- `id` must be unique and match pattern: `{PARTY}_{YEAR}`
- `year` must be 2026
- `status` must be one of the allowed enum values
- `checksum` must be valid SHA-256 hash
- `page_count` must be > 0

### Page Level
- `page_number` must be 1-indexed
- `char_count` must match `cleaned_text.length`
- `extraction_quality` based on char_count and patterns

### Chunk Level
- `id` must match pattern: `{PARTY}_{YEAR}_p{PAGE:03d}_c{CHUNK:03d}`
- `char_count` must be between 400-2000
- `embedding` dimension must match `embedding_dimension`
- `party_code` must exist in documents table
- `page_number` must be ≤ parent document's `page_count`

---

## Metadata Enrichment Pipeline

### Stage 1: Download
- Capture: `url`, `party_code`, `filename`, `downloaded_at`, `file_size_bytes`, `checksum`

### Stage 2: PDF Analysis
- Extract: `page_count`, `language`
- Detect: `requires_ocr` for each page

### Stage 3: Text Extraction
- Generate: `raw_text`, `cleaned_text` per page
- Calculate: `char_count`, `word_count`
- Assess: `extraction_quality`, `confidence_score`

### Stage 4: Chunking
- Create chunks with `chunk_index`
- Generate: `id`, `content`, `char_count`
- Link: `document_id`, `page_id`, `previous_chunk_id`, `next_chunk_id`

### Stage 5: Semantic Analysis
- Detect: `section`, `topic_tags`
- Classify: `contains_numbers`, `contains_bullet_list`, `is_heading`

### Stage 6: Embedding
- Generate: `embedding` vector
- Record: `embedding_model`, `embedding_dimension`
- Timestamp: `indexed_at`

---

## Query-Time Metadata Usage

### Filtering
- Filter by `party_code` for single-party queries
- Filter by `section` or `topic_tags` for topic-specific search
- Filter by `year` for temporal queries

### Ranking
- Use `similarity_score` for relevance
- Boost chunks with `is_heading: true`
- Consider `quality_score` if available

### Context Expansion
- Fetch adjacent chunks using `previous_chunk_id` / `next_chunk_id`
- Retrieve full page using `page_id` if needed

### Citation
- Display: `party_full_name`, `page_number`
- Link to: `source_url`
- Reference: `presidential_candidate`

---

## Future Enhancements

### Additional Metadata (Post-MVP)
- `party_website`: Official party URL
- `party_color`: Brand color for UI
- `party_logo_url`: Logo for display
- `vice_presidential_candidates`: Full VP list
- `proposal_type`: Classification (economic, social, etc.)
- `budget_impact`: Estimated cost if detected
- `sentiment_score`: Sentiment analysis result
- `feasibility_score`: Expert assessment

### External Enrichment
- Link to historical party data
- Connect to candidate profiles
- Map to government structure
- Link to related news articles
