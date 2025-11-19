# Output Formats and Validation

## Overview

This document defines the exact output formats for each stage of the data pipeline and specifies validation rules to ensure data quality.

---

## Pipeline Outputs

### Stage 1: PDF Download Output

**File**: `{NUMBER}_{PARTY}.json`

```json
{
  "url": "https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf",
  "party": "PLN",
  "filename": "12_PLN.pdf",
  "downloadedAt": "2025-11-18T22:09:19.997Z",
  "fileSizeBytes": 661504,
  "checksum": "sha256:a1b2c3d4..."
}
```

**Validation Rules**:
- ✅ `url` must be valid HTTPS URL
- ✅ `party` must be 2-6 uppercase chars
- ✅ `filename` must match pattern `\d{2}_[A-Z]+\.pdf`
- ✅ `downloadedAt` must be valid ISO 8601 timestamp
- ✅ `fileSizeBytes` must be > 0
- ✅ `checksum` must match `sha256:[a-f0-9]{64}`

---

### Stage 2: PDF Metadata Output

**File**: `{PARTY}_2026_metadata.json`

```json
{
  "id": "PLN_2026",
  "party_code": "PLN",
  "party_full_name": "Partido Liberación Nacional",
  "year": 2026,
  "presidential_candidate": "José María Figueres Olsen",
  "vice_presidential_candidates": ["Candidate VP1", "Candidate VP2"],
  "source_url": "https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf",
  "local_filename": "12_PLN.pdf",
  "downloaded_at": "2025-11-18T22:09:19.997Z",
  "file_size_bytes": 661504,
  "checksum": "sha256:a1b2c3d4...",
  "page_count": 45,
  "estimated_word_count": 12500,
  "language": "es",
  "status": "completed",
  "extracted_at": "2025-11-18T23:15:42.123Z",
  "created_at": "2025-11-18T22:09:19.997Z",
  "updated_at": "2025-11-18T23:15:42.123Z"
}
```

**Validation Rules**:
- ✅ `id` matches pattern `{PARTY}_{YEAR}`
- ✅ `year` === 2026
- ✅ `party_code` is 2-6 uppercase chars
- ✅ `presidential_candidate` is non-empty string
- ✅ `page_count` > 0
- ✅ `language` === "es"
- ✅ `status` in ["pending", "processing", "completed", "failed"]

---

### Stage 3: Page Extraction Output

**File**: `{PARTY}_2026_pages.jsonl` (JSON Lines format)

```jsonl
{"id":"PLN_2026_p001","document_id":"PLN_2026","page_number":1,"raw_text":"Original text...","cleaned_text":"Cleaned text...","char_count":1250,"word_count":185,"extraction_quality":"high","requires_ocr":false,"extracted_at":"2025-11-18T23:15:42.123Z"}
{"id":"PLN_2026_p002","document_id":"PLN_2026","page_number":2,"raw_text":"...","cleaned_text":"...","char_count":1380,"word_count":201,"extraction_quality":"high","requires_ocr":false,"extracted_at":"2025-11-18T23:15:42.456Z"}
```

**Validation Rules (per line)**:
- ✅ Valid JSON object
- ✅ `id` matches pattern `{PARTY}_{YEAR}_p{PAGE:03d}`
- ✅ `page_number` is 1-indexed and sequential
- ✅ `cleaned_text` is non-empty
- ✅ `char_count` matches `cleaned_text.length`
- ✅ `extraction_quality` in ["high", "medium", "low"]

---

### Stage 4: Chunks Output

**File**: `{PARTY}_2026_chunks.jsonl`

```jsonl
{"id":"PLN_2026_p001_c000","document_id":"PLN_2026","page_id":"PLN_2026_p001","chunk_index":0,"content":"Plan de Gobierno 2026-2030\n\nPartido Liberación Nacional\n\nNuestro compromiso con Costa Rica se fundamenta en cuatro pilares estratégicos: educación de calidad, salud universal, economía sostenible y justicia social. Este plan de gobierno presenta propuestas concretas y medibles para transformar nuestro país y garantizar un futuro próspero para todas las personas costarricenses.","char_count":387,"word_count":52,"party_code":"PLN","party_full_name":"Partido Liberación Nacional","presidential_candidate":"José María Figueres Olsen","year":2026,"page_number":1,"source_url":"https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf","local_filename":"12_PLN.pdf","section":"Introducción","is_heading":true,"contains_numbers":true,"overlap_chars":0,"created_at":"2025-11-18T23:20:15.789Z"}
{"id":"PLN_2026_p001_c001","document_id":"PLN_2026","page_id":"PLN_2026_p001","chunk_index":1,"content":"...medibles para transformar nuestro país y garantizar un futuro próspero para todas las personas costarricenses.\n\nEducación de Calidad\n\nLa educación es la base del desarrollo. Proponemos invertir el 8% del PIB en educación pública, construir 50 nuevas escuelas y liceos en zonas rurales, y equipar 100,000 estudiantes con tecnología moderna. Además, implementaremos un programa de capacitación continua para 10,000 docentes, enfocado en metodologías innovadoras y competencias digitales.","char_count":512,"word_count":72,"party_code":"PLN","party_full_name":"Partido Liberación Nacional","presidential_candidate":"José María Figueres Olsen","year":2026,"page_number":1,"section":"Educación","contains_numbers":true,"overlap_chars":120,"previous_chunk_id":"PLN_2026_p001_c000","created_at":"2025-11-18T23:20:15.890Z"}
```

**Validation Rules (per chunk)**:
- ✅ `id` matches `{PARTY}_{YEAR}_p{PAGE:03d}_c{CHUNK:03d}`
- ✅ `chunk_index` is sequential within page
- ✅ `content` length is 400-2000 chars
- ✅ `char_count` matches `content.length`
- ✅ `word_count` > 0
- ✅ `party_code` exists in metadata
- ✅ `page_number` ≤ document's `page_count`
- ✅ `overlap_chars` is 0-200
- ✅ If `chunk_index` > 0, must have `previous_chunk_id`

---

### Stage 5: Embeddings Output

**File**: `{PARTY}_2026_embeddings.jsonl`

```jsonl
{"chunk_id":"PLN_2026_p001_c000","embedding":[0.0123,-0.0456,0.0789,...],"embedding_model":"text-embedding-3-small","embedding_dimension":1536,"generated_at":"2025-11-18T23:25:30.123Z"}
{"chunk_id":"PLN_2026_p001_c001","embedding":[0.0234,-0.0567,0.0890,...],"embedding_model":"text-embedding-3-small","embedding_dimension":1536,"generated_at":"2025-11-18T23:25:30.456Z"}
```

**Validation Rules**:
- ✅ `chunk_id` exists in chunks file
- ✅ `embedding` is array of floats
- ✅ `embedding.length` === `embedding_dimension`
- ✅ All embedding values are between -1 and 1
- ✅ `embedding_model` is non-empty string

---

### Stage 6: Vector Database Import Format

**For Supabase pgvector**:

```sql
-- Insert chunks with embeddings
INSERT INTO chunks (
  id, document_id, page_id, chunk_index,
  content, char_count, word_count,
  party_code, party_full_name, presidential_candidate,
  year, page_number, source_url,
  section, contains_numbers,
  embedding, embedding_model,
  created_at, indexed_at
) VALUES (
  'PLN_2026_p001_c000',
  'PLN_2026',
  'PLN_2026_p001',
  0,
  'Plan de Gobierno 2026-2030...',
  387,
  52,
  'PLN',
  'Partido Liberación Nacional',
  'José María Figueres Olsen',
  2026,
  1,
  'https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf',
  'Introducción',
  true,
  '[0.0123,-0.0456,0.0789,...]',
  'text-embedding-3-small',
  '2025-11-18T23:20:15.789Z',
  '2025-11-18T23:30:00.000Z'
);
```

---

## Search/Query Output Formats

### Search Results

**Endpoint**: `GET /api/search?q=educación&party=PLN&limit=5`

**Response**:
```json
{
  "query": "educación",
  "filters": {
    "party": "PLN",
    "year": 2026
  },
  "total_results": 42,
  "returned_results": 5,
  "results": [
    {
      "id": "PLN_2026_p012_c003",
      "content": "Educación de Calidad\n\nNuestro plan de gobierno prioriza...",
      "similarity_score": 0.8734,
      "rank": 1,
      "metadata": {
        "party_code": "PLN",
        "party_full_name": "Partido Liberación Nacional",
        "presidential_candidate": "José María Figueres Olsen",
        "year": 2026,
        "page_number": 12,
        "section": "Educación",
        "source_url": "https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf"
      },
      "highlighted_content": "<mark>Educación</mark> de Calidad\n\nNuestro plan..."
    }
  ],
  "execution_time_ms": 142
}
```

---

### RAG Answer Output

**Endpoint**: `POST /api/chat`

**Request**:
```json
{
  "question": "¿Qué propone el PLN para mejorar la educación?",
  "filters": {
    "party": "PLN"
  },
  "max_chunks": 5
}
```

**Response**:
```json
{
  "question": "¿Qué propone el PLN para mejorar la educación?",
  "answer": "El Partido Liberación Nacional (PLN) propone invertir el 8% del PIB en educación pública, construir 50 nuevas escuelas y liceos en zonas rurales, y equipar a 100,000 estudiantes con tecnología moderna. Además, planea implementar un programa de capacitación continua para 10,000 docentes.",
  "sources": [
    {
      "chunk_id": "PLN_2026_p012_c003",
      "party": "PLN",
      "page_number": 12,
      "relevance": 0.8734,
      "excerpt": "...invertir el 8% del PIB en educación pública, construir 50 nuevas escuelas...",
      "url": "https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf#page=12"
    },
    {
      "chunk_id": "PLN_2026_p013_c001",
      "party": "PLN",
      "page_number": 13,
      "relevance": 0.7821,
      "excerpt": "...capacitación continua para 10,000 docentes...",
      "url": "https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf#page=13"
    }
  ],
  "chunks_retrieved": 5,
  "llm_model": "gpt-4o-mini",
  "execution_time_ms": 3421,
  "confidence": "high"
}
```

---

## Validation Scripts

### JSON Schema Validation

**For chunks**:
```typescript
import Ajv from 'ajv';

const chunkSchema = {
  type: 'object',
  required: ['id', 'content', 'char_count', 'party_code', 'year', 'page_number'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[A-Z0-9]+_\\d{4}_p\\d{3}_c\\d{3}$'
    },
    content: {
      type: 'string',
      minLength: 400,
      maxLength: 2000
    },
    char_count: {
      type: 'integer',
      minimum: 400,
      maximum: 2000
    },
    party_code: {
      type: 'string',
      pattern: '^[A-Z]{2,6}$'
    },
    year: {
      type: 'integer',
      const: 2026
    },
    page_number: {
      type: 'integer',
      minimum: 1
    },
    overlap_chars: {
      type: 'integer',
      minimum: 0,
      maximum: 200
    }
  }
};

const ajv = new Ajv();
const validate = ajv.compile(chunkSchema);

function validateChunk(chunk: any): boolean {
  const valid = validate(chunk);
  if (!valid) {
    console.error('Validation errors:', validate.errors);
  }
  return valid;
}
```

---

### Data Quality Checks

```typescript
interface QualityReport {
  total_chunks: number;
  passed: number;
  failed: number;
  warnings: number;
  errors: ValidationError[];
}

interface ValidationError {
  chunk_id: string;
  error_type: string;
  message: string;
  severity: 'error' | 'warning';
}

function validateDataset(chunks: Chunk[]): QualityReport {
  const report: QualityReport = {
    total_chunks: chunks.length,
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
  };

  for (const chunk of chunks) {
    // Size validation
    if (chunk.char_count !== chunk.content.length) {
      report.errors.push({
        chunk_id: chunk.id,
        error_type: 'char_count_mismatch',
        message: `char_count (${chunk.char_count}) != actual length (${chunk.content.length})`,
        severity: 'error'
      });
      report.failed++;
      continue;
    }

    // Content validation
    if (chunk.content.trim().length < 400) {
      report.errors.push({
        chunk_id: chunk.id,
        error_type: 'content_too_short',
        message: `Content is only ${chunk.content.trim().length} chars`,
        severity: 'error'
      });
      report.failed++;
      continue;
    }

    // Quality warnings
    if (!chunk.content.endsWith('.')) {
      report.errors.push({
        chunk_id: chunk.id,
        error_type: 'incomplete_sentence',
        message: 'Content does not end with sentence terminator',
        severity: 'warning'
      });
      report.warnings++;
    }

    report.passed++;
  }

  return report;
}
```

---

## Export Formats

### CSV Export (for analysis)

```csv
id,party,year,page,section,char_count,word_count,contains_numbers,quality_score
PLN_2026_p001_c000,PLN,2026,1,Introducción,387,52,true,0.95
PLN_2026_p001_c001,PLN,2026,1,Educación,512,72,true,0.92
```

### Parquet Export (for ML/analytics)

```python
import pyarrow as pa
import pyarrow.parquet as pq

schema = pa.schema([
    ('id', pa.string()),
    ('content', pa.string()),
    ('party_code', pa.string()),
    ('year', pa.int32()),
    ('page_number', pa.int32()),
    ('char_count', pa.int32()),
    ('embedding', pa.list_(pa.float32()))
])

table = pa.Table.from_arrays([...], schema=schema)
pq.write_table(table, 'chunks.parquet')
```

---

## Testing Data Validation

### Unit Tests

```typescript
describe('Chunk Validation', () => {
  test('should accept valid chunk', () => {
    const chunk = {
      id: 'PLN_2026_p001_c000',
      content: 'Valid content with at least 400 characters...',
      char_count: 450,
      // ... other fields
    };
    expect(validateChunk(chunk)).toBe(true);
  });

  test('should reject chunk with invalid ID format', () => {
    const chunk = {
      id: 'invalid-id',
      // ... other fields
    };
    expect(validateChunk(chunk)).toBe(false);
  });

  test('should reject chunk too short', () => {
    const chunk = {
      id: 'PLN_2026_p001_c000',
      content: 'Too short',
      char_count: 9,
    };
    expect(validateChunk(chunk)).toBe(false);
  });
});
```

---

## Validation Checklist

Before committing data:

- [ ] All JSON files are valid JSON
- [ ] All required fields are present
- [ ] All IDs follow naming conventions
- [ ] Char counts match actual lengths
- [ ] All embeddings have correct dimensions
- [ ] No duplicate chunk IDs
- [ ] All foreign keys are valid (document_id, page_id exist)
- [ ] Quality scores are within 0-1 range
- [ ] Timestamps are valid ISO 8601
- [ ] No missing metadata fields
