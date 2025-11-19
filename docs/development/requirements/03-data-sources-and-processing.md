# Data Sources and Processing Requirements

## Primary Data Source

### TSE 2026 Government Plans

**Source URL**: https://www.tse.go.cr/2026/planesgobierno.html

**Description**: Official government plan PDFs submitted by political parties to the Supreme Electoral Tribunal (Tribunal Supremo de Elecciones) for Costa Rica's 2026 elections.

**Characteristics**:
- Format: PDF documents
- Language: Spanish
- Size: Varies by party (typically 20-200 pages)
- Structure: Varies by party (no standardized format)
- Updates: May be updated before election deadlines
- Official Status: Legally binding campaign documents

---

## Data Extraction Requirements

### PDF Download
- **Automated Discovery**: Scrape TSE website to find all government plan PDF URLs
- **Download Management**: Download PDFs to local storage
- **Error Handling**: Retry failed downloads, handle network issues
- **Metadata Capture**: Store download timestamp, file size, checksum
- **Version Tracking**: Detect and handle PDF updates

### Text Extraction
- **Page-by-Page Processing**: Extract text maintaining page context
- **Encoding Handling**: Support various character encodings
- **Table Extraction**: Handle tabular data (budget tables, statistics)
- **Image/OCR Handling**: Extract text from scanned PDFs if needed
- **Structure Preservation**: Maintain headings, sections, lists where possible

---

## Data Cleaning & Normalization

### Text Cleaning
- Remove PDF artifacts (headers, footers, page numbers)
- Fix encoding issues (accented characters, special symbols)
- Normalize whitespace (multiple spaces, line breaks)
- Remove duplicate content
- Handle hyphenation across line breaks

### Content Normalization
- Standardize party name references
- Normalize section headings
- Fix common OCR errors
- Standardize numerical formats
- Remove boilerplate content

### Quality Validation
- Minimum character threshold per page
- Detect and flag low-quality extractions
- Identify pages with excessive artifacts
- Validate Spanish language content
- Flag potential OCR failures

---

## Data Chunking Strategy

### Chunk Specifications
- **Target Size**: 800-1500 characters per chunk
- **Overlap**: 100-200 characters between adjacent chunks
- **Boundaries**: Prefer sentence or paragraph boundaries
- **Minimum Size**: 400 characters (avoid tiny fragments)
- **Maximum Size**: 2000 characters (hard limit)

### Chunking Logic
- Prioritize semantic coherence over strict size limits
- Keep related content together (don't split mid-paragraph)
- Preserve context at chunk boundaries with overlap
- Include section headings in chunks when relevant
- Handle lists and bullet points appropriately

---

## Metadata Schema

Each chunk must include the following metadata:

### Required Metadata
```json
{
  "id": "string",              // Unique chunk identifier
  "party": "string",           // Political party abbreviation (e.g., "PLN", "PUSC")
  "party_full_name": "string", // Full party name
  "candidate": "string",       // Presidential candidate name
  "year": 2026,               // Election year
  "page": "number",           // Source page number
  "chunk_index": "number",    // Chunk sequence number within page
  "source_url": "string",     // Original PDF URL
  "source_file": "string",    // Downloaded PDF filename
  "section": "string",        // Section or topic (if detectable)
  "content": "string",        // The actual text content
  "char_count": "number",     // Character count
  "created_at": "timestamp",  // When chunk was created
  "embedding": "number[]"     // Vector embedding
}
```

### Optional Metadata
- `subsection`: Finer-grained topic classification
- `proposal_type`: Category (education, health, economy, etc.)
- `contains_numbers`: Boolean flag for quantitative proposals
- `confidence_score`: Quality/reliability indicator

---

## Data Storage Requirements

### Raw PDF Storage
- Store original PDFs for reference and re-processing
- Cloud storage or local filesystem
- Organize by party and election year
- Include checksums for integrity verification

### Extracted Text Storage
- Store raw extracted text before chunking
- Keep for debugging and re-chunking
- Include extraction metadata

### Vector Database Storage
- Store embeddings with full metadata
- Support efficient similarity search
- Enable filtering by metadata fields
- Scale to 10K+ chunks initially

### Metadata Database
- Store document-level metadata
- Track ingestion status and errors
- Enable reporting and analytics
- Support admin dashboard queries

---

## Data Processing Pipeline

### Ingestion Flow
```
1. Discover PDFs on TSE website
   ↓
2. Download PDFs to storage
   ↓
3. Extract text page-by-page
   ↓
4. Clean and normalize text
   ↓
5. Split into semantic chunks
   ↓
6. Generate embeddings (batch)
   ↓
7. Store in vector database
   ↓
8. Update status in metadata DB
```

### Processing Requirements
- **Batch Processing**: Process multiple PDFs in parallel
- **Progress Tracking**: Monitor each step's completion
- **Error Recovery**: Resume from failures without restarting
- **Idempotency**: Re-running ingestion should be safe
- **Logging**: Detailed logs for debugging

---

## Data Quality Requirements

### Accuracy
- Text extraction accuracy > 95%
- Proper character encoding preservation
- Correct party/candidate attribution

### Completeness
- All pages extracted from each PDF
- No missing sections or content
- All metadata fields populated

### Consistency
- Uniform chunking strategy across all documents
- Consistent metadata schema
- Standardized formatting

### Freshness
- Detect and ingest PDF updates within 24 hours
- Track version history
- Clear indicators of last update time
