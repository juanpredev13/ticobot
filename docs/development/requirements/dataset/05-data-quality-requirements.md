# Data Quality Requirements

## Overview

This document defines the data quality standards for all stages of the TicoBot pipeline, from PDF ingestion through to RAG responses.

**Goal**: Ensure high-quality, accurate, and reliable data that produces trustworthy search results and answers.

---

## Quality Dimensions

### 1. Accuracy
Data must correctly represent the source PDFs

### 2. Completeness
All required data must be present

### 3. Consistency
Data must follow defined schemas and conventions

### 4. Timeliness
Data must be current and up-to-date

### 5. Validity
Data must conform to defined rules and constraints

### 6. Integrity
Relationships between data entities must be maintained

---

## PDF Download Quality

### Requirements

**Completeness**:
- ✅ All 20 party PDFs downloaded successfully
- ✅ Zero missing or corrupted downloads
- ✅ File sizes match expected ranges

**Integrity**:
- ✅ Checksums generated and verified
- ✅ Downloads match TSE source files exactly
- ✅ No truncated or partial downloads

**Validation**:
```typescript
function validateDownload(pdf: DownloadedPDF): boolean {
  // File exists
  if (!fs.existsSync(pdf.local_path)) return false;

  // Size is reasonable (> 100KB, < 20MB)
  const stats = fs.statSync(pdf.local_path);
  if (stats.size < 100 * 1024 || stats.size > 20 * 1024 * 1024) {
    return false;
  }

  // Is valid PDF
  const buffer = fs.readFileSync(pdf.local_path, { encoding: null, flag: 'r' });
  if (!buffer.toString('ascii', 0, 4).startsWith('%PDF')) {
    return false;
  }

  // Checksum matches
  const computed = crypto.createHash('sha256').update(buffer).digest('hex');
  if (computed !== pdf.checksum) return false;

  return true;
}
```

### Quality Metrics
- Download success rate: 100%
- Checksum verification rate: 100%
- Average download time: < 5 seconds per file

---

## Text Extraction Quality

### Requirements

**Accuracy**:
- ✅ Text extraction accuracy > 95%
- ✅ Correct character encoding (Spanish with accents)
- ✅ Minimal extraction artifacts (headers/footers/page numbers)

**Completeness**:
- ✅ All pages extracted
- ✅ No missing content
- ✅ Tables and lists preserved where possible

**Validation**:
```typescript
interface ExtractionQuality {
  char_count: number;
  word_count: number;
  has_spanish_chars: boolean;
  artifact_ratio: number;
  whitespace_ratio: number;
  quality_level: 'high' | 'medium' | 'low';
}

function assessExtractionQuality(text: string): ExtractionQuality {
  const char_count = text.length;
  const word_count = text.split(/\s+/).filter(w => w.length > 0).length;

  // Check for Spanish characters
  const has_spanish_chars = /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(text);

  // Detect common artifacts
  const artifacts = [
    /Página\s+\d+/g,
    /\d+\s*\|\s*\d+/g,
    /_{5,}/g,  // Long underscores
    /\.{5,}/g  // Long dot sequences
  ];
  const artifact_matches = artifacts.reduce((count, regex) => {
    return count + (text.match(regex) || []).length;
  }, 0);
  const artifact_ratio = artifact_matches / word_count;

  // Whitespace ratio
  const whitespace_count = (text.match(/\s/g) || []).length;
  const whitespace_ratio = whitespace_count / char_count;

  // Determine quality level
  let quality_level: 'high' | 'medium' | 'low' = 'high';
  if (artifact_ratio > 0.05 || whitespace_ratio > 0.4) {
    quality_level = 'medium';
  }
  if (artifact_ratio > 0.1 || whitespace_ratio > 0.5 || char_count < 200) {
    quality_level = 'low';
  }

  return {
    char_count,
    word_count,
    has_spanish_chars,
    artifact_ratio,
    whitespace_ratio,
    quality_level
  };
}
```

### Quality Thresholds

| Metric | High | Medium | Low |
|--------|------|--------|-----|
| Artifact ratio | < 5% | 5-10% | > 10% |
| Whitespace ratio | < 30% | 30-40% | > 40% |
| Min chars/page | > 500 | 200-500 | < 200 |
| Spanish chars | Yes | Yes | No |

### Quality Metrics
- High quality pages: > 80%
- Medium quality pages: < 15%
- Low quality pages: < 5%
- Pages requiring OCR: Document and flag

---

## Text Cleaning Quality

### Requirements

**Artifact Removal**:
- ✅ Headers and footers removed
- ✅ Page numbers removed
- ✅ Excessive whitespace normalized
- ✅ Hyphenation across lines fixed

**Content Preservation**:
- ✅ No loss of meaningful content
- ✅ Spanish characters preserved (á, é, í, ó, ú, ñ, ¿, ¡)
- ✅ Numbers and punctuation intact
- ✅ List formatting preserved

**Validation**:
```typescript
function validateCleaning(raw: string, cleaned: string): ValidationResult {
  const errors: string[] = [];

  // Should not increase length significantly
  if (cleaned.length > raw.length * 1.1) {
    errors.push('Cleaned text unexpectedly longer than raw');
  }

  // Should not lose too much content (>30% loss is suspicious)
  if (cleaned.length < raw.length * 0.7) {
    errors.push(`Excessive content loss: ${raw.length} -> ${cleaned.length}`);
  }

  // Should preserve Spanish characters
  const raw_spanish = (raw.match(/[áéíóúñÁÉÍÓÚÑ]/g) || []).length;
  const cleaned_spanish = (cleaned.match(/[áéíóúñÁÉÍÓÚÑ]/g) || []).length;
  if (cleaned_spanish < raw_spanish * 0.9) {
    errors.push('Lost Spanish characters during cleaning');
  }

  // Should have reduced artifacts
  const raw_artifacts = (raw.match(/Página\s+\d+/g) || []).length;
  const cleaned_artifacts = (cleaned.match(/Página\s+\d+/g) || []).length;
  if (cleaned_artifacts >= raw_artifacts) {
    errors.push('Artifacts not removed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Quality Metrics
- Content preservation: > 90% of meaningful text retained
- Artifact reduction: > 80% of artifacts removed
- Character integrity: 100% of Spanish chars preserved

---

## Chunking Quality

### Requirements

**Size Compliance**:
- ✅ All chunks 400-2000 characters
- ✅ Target size 800-1500 characters
- ✅ Overlap 100-200 characters

**Semantic Integrity**:
- ✅ Chunks are semantically coherent
- ✅ No mid-sentence breaks (where possible)
- ✅ Context preserved at boundaries

**Completeness**:
- ✅ All page text chunked (no orphaned content)
- ✅ Chunk sequence continuous
- ✅ Previous/next links maintained

**Validation**:
```typescript
function validateChunks(chunks: Chunk[]): ChunkValidation {
  const issues: Issue[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Size check
    if (chunk.char_count < 400 || chunk.char_count > 2000) {
      issues.push({
        chunk_id: chunk.id,
        type: 'size_violation',
        severity: 'error',
        message: `Size ${chunk.char_count} outside 400-2000 range`
      });
    }

    // Actual length matches metadata
    if (chunk.content.length !== chunk.char_count) {
      issues.push({
        chunk_id: chunk.id,
        type: 'metadata_mismatch',
        severity: 'error',
        message: `char_count mismatch`
      });
    }

    // Semantic integrity
    if (!chunk.content.match(/[.!?:]$/)) {
      issues.push({
        chunk_id: chunk.id,
        type: 'incomplete_sentence',
        severity: 'warning',
        message: 'Does not end with sentence terminator'
      });
    }

    // Link integrity
    if (i > 0 && chunk.previous_chunk_id !== chunks[i - 1].id) {
      issues.push({
        chunk_id: chunk.id,
        type: 'broken_link',
        severity: 'error',
        message: 'Previous chunk link incorrect'
      });
    }

    // Overlap check
    if (i > 0 && chunk.overlap_chars === 0) {
      issues.push({
        chunk_id: chunk.id,
        type: 'missing_overlap',
        severity: 'warning',
        message: 'No overlap with previous chunk'
      });
    }
  }

  return {
    total_chunks: chunks.length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    issues
  };
}
```

### Quality Thresholds
- Size compliance: 100% within 400-2000 chars
- Semantic coherence: > 90% end with sentence terminators
- Link integrity: 100% previous/next links correct
- Overlap rate: > 95% of non-first chunks have overlap

### Quality Metrics
- Average chunk size: 1000-1400 chars
- Chunk size std deviation: < 400
- Chunks with quality score > 0.7: > 90%
- Rejected chunks: < 5%

---

## Embedding Quality

### Requirements

**Completeness**:
- ✅ All chunks have embeddings
- ✅ No null or undefined embeddings

**Dimension Consistency**:
- ✅ All embeddings same dimension
- ✅ Dimension matches model specification

**Value Validity**:
- ✅ All values are valid floats (not NaN, not Infinity)
- ✅ Values within reasonable range

**Validation**:
```typescript
function validateEmbedding(
  chunk_id: string,
  embedding: number[],
  expected_dim: number
): ValidationResult {
  const errors: string[] = [];

  // Dimension check
  if (embedding.length !== expected_dim) {
    errors.push(`Dimension ${embedding.length} != expected ${expected_dim}`);
  }

  // Value validity
  for (let i = 0; i < embedding.length; i++) {
    if (!Number.isFinite(embedding[i])) {
      errors.push(`Invalid value at index ${i}: ${embedding[i]}`);
      break;
    }
  }

  // Magnitude check (normalized embeddings should be around -1 to 1)
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  if (magnitude < 0.1 || magnitude > 10) {
    errors.push(`Unusual magnitude: ${magnitude}`);
  }

  return {
    chunk_id,
    valid: errors.length === 0,
    errors
  };
}
```

### Quality Metrics
- Embedding coverage: 100%
- Dimension consistency: 100%
- Valid values: 100%
- Average embedding generation time: < 50ms per chunk

---

## Metadata Quality

### Requirements

**Completeness**:
- ✅ All required fields present
- ✅ No null values for required fields

**Accuracy**:
- ✅ Party codes match official TSE codes
- ✅ Page numbers within document range
- ✅ Source URLs valid and accessible

**Consistency**:
- ✅ Timestamps in ISO 8601 format
- ✅ IDs follow naming conventions
- ✅ Foreign keys reference existing records

**Validation**:
```typescript
const VALID_PARTIES = [
  'CR1', 'ACRM', 'PA', 'CDS', 'CAC', 'PDLCT', 'PEN', 'PEL',
  'FA', 'PIN', 'PJSC', 'PLN', 'PLP', 'PNG', 'PNR', 'PSD',
  'PPSO', 'PUSC', 'UP', 'PUCD'
];

function validateMetadata(chunk: Chunk, document: Document): ValidationResult {
  const errors: string[] = [];

  // Party code valid
  if (!VALID_PARTIES.includes(chunk.party_code)) {
    errors.push(`Invalid party code: ${chunk.party_code}`);
  }

  // Year correct
  if (chunk.year !== 2026) {
    errors.push(`Invalid year: ${chunk.year}`);
  }

  // Page number within range
  if (chunk.page_number < 1 || chunk.page_number > document.page_count) {
    errors.push(`Page ${chunk.page_number} outside range 1-${document.page_count}`);
  }

  // ID format
  const id_pattern = /^[A-Z0-9]+_\d{4}_p\d{3}_c\d{3}$/;
  if (!id_pattern.test(chunk.id)) {
    errors.push(`Invalid ID format: ${chunk.id}`);
  }

  // URL format
  try {
    new URL(chunk.source_url);
  } catch {
    errors.push(`Invalid source URL: ${chunk.source_url}`);
  }

  // Timestamp format
  if (!chunk.created_at.match(/^\d{4}-\d{2}-\d{2}T/)) {
    errors.push(`Invalid timestamp format: ${chunk.created_at}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Quality Metrics
- Metadata completeness: 100%
- Party code validity: 100%
- URL validity: 100%
- Timestamp validity: 100%

---

## Database Integrity

### Requirements

**Referential Integrity**:
- ✅ All chunk.document_id references exist in documents table
- ✅ All chunk.page_id references exist in pages table
- ✅ No orphaned records

**Uniqueness**:
- ✅ All IDs are unique
- ✅ No duplicate chunks

**Constraints**:
- ✅ All foreign key constraints satisfied
- ✅ All check constraints satisfied

**Validation**:
```sql
-- Check for orphaned chunks (no parent document)
SELECT c.id FROM chunks c
LEFT JOIN documents d ON c.document_id = d.id
WHERE d.id IS NULL;
-- Should return 0 rows

-- Check for duplicate chunk IDs
SELECT id, COUNT(*) FROM chunks
GROUP BY id HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check for invalid page numbers
SELECT c.id, c.page_number, d.page_count
FROM chunks c
JOIN documents d ON c.document_id = d.id
WHERE c.page_number > d.page_count;
-- Should return 0 rows

-- Check for missing embeddings
SELECT id FROM chunks WHERE embedding IS NULL;
-- Should return 0 rows
```

### Quality Metrics
- Referential integrity: 100%
- Uniqueness: 100%
- Constraint satisfaction: 100%

---

## Search Quality

### Requirements

**Relevance**:
- ✅ Top-5 results contain relevant content > 80% of time
- ✅ Correct party attribution 100% of time
- ✅ Source citations accurate

**Performance**:
- ✅ Search completes in < 2 seconds (p95)
- ✅ Supports concurrent queries

**Testing**:
```typescript
interface SearchQualityTest {
  query: string;
  expected_parties: string[];
  expected_keywords: string[];
  min_relevance: number;
}

const quality_tests: SearchQualityTest[] = [
  {
    query: 'educación',
    expected_parties: ['PLN', 'PUSC', 'PAC'],
    expected_keywords: ['educación', 'escuelas', 'docentes'],
    min_relevance: 0.7
  },
  {
    query: 'salud pública',
    expected_parties: ['PLN', 'FA'],
    expected_keywords: ['salud', 'hospitales', 'CCSS'],
    min_relevance: 0.6
  }
];

async function testSearchQuality() {
  for (const test of quality_tests) {
    const results = await search(test.query, { limit: 5 });

    // Check relevance
    assert(results[0].similarity_score >= test.min_relevance);

    // Check keywords present
    const combined_content = results.map(r => r.content).join(' ');
    for (const keyword of test.expected_keywords) {
      assert(combined_content.toLowerCase().includes(keyword));
    }
  }
}
```

### Quality Metrics
- Relevance (top-5): > 80%
- Response time p50: < 500ms
- Response time p95: < 2000ms
- Citation accuracy: 100%

---

## RAG Answer Quality

### Requirements

**Groundedness**:
- ✅ All claims in answer are supported by retrieved context
- ✅ No hallucinations or fabricated information
- ✅ Clear "I don't know" when evidence lacking

**Accuracy**:
- ✅ Facts correct according to source PDFs
- ✅ Numbers and statistics accurate
- ✅ Party names and candidates correct

**Citation**:
- ✅ All sources properly cited
- ✅ Page numbers correct
- ✅ Links to original PDFs work

**Language Quality**:
- ✅ Proper Spanish grammar
- ✅ Clear and understandable
- ✅ Appropriate tone (neutral, informative)

**Testing**:
```typescript
interface AnswerQualityTest {
  question: string;
  required_sources: string[];  // Required party codes
  forbidden_phrases: string[];  // Phrases that indicate hallucination
  required_citations: number;   // Min citations
}

async function testAnswerQuality(test: AnswerQualityTest) {
  const response = await chat(test.question);

  // Check sources
  const source_parties = response.sources.map(s => s.party);
  for (const party of test.required_sources) {
    assert(source_parties.includes(party), `Missing source from ${party}`);
  }

  // Check for hallucinations
  for (const phrase of test.forbidden_phrases) {
    assert(
      !response.answer.toLowerCase().includes(phrase),
      `Answer contains forbidden phrase: ${phrase}`
    );
  }

  // Check citations
  assert(
    response.sources.length >= test.required_citations,
    `Insufficient citations: ${response.sources.length} < ${test.required_citations}`
  );

  // Verify all facts are grounded
  const context = response.sources.map(s => s.excerpt).join('\n');
  // Manual review or LLM-as-judge to verify groundedness
}
```

### Quality Metrics
- Groundedness: 100% (no hallucinations)
- Citation accuracy: 100%
- Citation completeness: > 95%
- Spanish grammar: > 95% correct
- User satisfaction: > 4/5

---

## Overall Dataset Quality Scorecard

### Metrics Summary

| Stage | Metric | Target | Current |
|-------|--------|--------|---------|
| Download | Success rate | 100% | TBD |
| Extraction | High quality pages | > 80% | TBD |
| Cleaning | Content preservation | > 90% | TBD |
| Chunking | Size compliance | 100% | TBD |
| Chunking | Semantic coherence | > 90% | TBD |
| Embedding | Coverage | 100% | TBD |
| Metadata | Completeness | 100% | TBD |
| Search | Relevance (top-5) | > 80% | TBD |
| RAG | Groundedness | 100% | TBD |

### Quality Gates

**Before Production**:
- [ ] All downloads validated
- [ ] Extraction quality > 80% high
- [ ] Chunk quality > 90% score > 0.7
- [ ] Embedding coverage 100%
- [ ] Metadata validation 100% pass
- [ ] Search quality tests pass
- [ ] RAG answer tests pass
- [ ] Manual review of 100 random chunks passed

---

## Continuous Monitoring

### Automated Checks (Daily)

- Check for new PDF versions on TSE site
- Validate database integrity
- Monitor chunk count consistency
- Check for null embeddings
- Verify search performance

### Manual Reviews (Weekly)

- Review sample of search results
- Evaluate RAG answer quality
- Check for new error patterns
- Review user feedback

### Quality Reports (Monthly)

- Comprehensive quality scorecard
- Trend analysis
- Issue summary
- Improvement recommendations
