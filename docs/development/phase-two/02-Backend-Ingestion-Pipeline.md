# Phase 2.1: Backend Ingestion Pipeline Implementation

**GitHub Issue:** [#17](https://github.com/juanpredev13/ticobot/issues/17)
**Status:** In Progress
**Priority:** Critical (MVP)

## Quick Start

### Current Status
- PDFDownloader: Basic implementation exists, needs fixes
- PDFParser: Not started
- TextCleaner: Not started
- TextChunker: Not started

### Immediate Tasks

1. **Fix PDFDownloader** (1-2 hours)
   ```bash
   # Install axios
   pnpm --filter backend add axios
   ```

   Fix TypeScript error in `backend/src/ingest/components/PDFDownloader.ts`:
   ```typescript
   // Add after line 31
   interface ErrorClassification {
       type: 'network' | 'timeout' | 'validation' | 'filesystem' | 'unknown';
       httpStatus?: number;
   }

   // Update method signature at line 77
   private classifyError(error: unknown): ErrorClassification {

   // Update line 108
   let errorClassification: ErrorClassification = { type: 'unknown' };
   ```

2. **Implement PDFParser** (3-4 hours)
   ```bash
   pnpm --filter backend add pdf-parse
   ```

   Create `backend/src/ingest/components/PDFParser.ts`

3. **Implement TextCleaner** (2-3 hours)
   Create `backend/src/ingest/components/TextCleaner.ts`

4. **Implement TextChunker** (4-5 hours)
   ```bash
   pnpm --filter backend add tiktoken
   ```

   Create `backend/src/ingest/components/TextChunker.ts`

## Pipeline Flow

```
Download PDF → Parse Text → Clean Text → Chunk Text → Store in DB
```

## Component Details

### PDFParser
**File:** `backend/src/ingest/components/PDFParser.ts`

```typescript
import pdf from 'pdf-parse';

export class PDFParser {
    async parse(filePath: string, documentId: string) {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);

        return {
            documentId,
            text: data.text,
            pageCount: data.numpages,
            metadata: data.info
        };
    }
}
```

### TextCleaner
**File:** `backend/src/ingest/components/TextCleaner.ts`

```typescript
export class TextCleaner {
    clean(text: string) {
        return text
            // Fix encoding for Spanish
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            // Remove special chars, keep Spanish letters
            .replace(/[^\w\s\-.,;:!?áéíóúñÁÉÍÓÚÑ]/g, '')
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }
}
```

### TextChunker
**File:** `backend/src/ingest/components/TextChunker.ts`

**Strategy:**
- Chunk size: 500-800 tokens
- Overlap: 75 tokens
- Split on: paragraphs

```typescript
export class TextChunker {
    async chunk(text: string, documentId: string) {
        const paragraphs = text.split(/\n\n+/);
        const chunks = [];

        // Create chunks with overlap
        // Target: ~500-800 tokens per chunk

        return chunks;
    }
}
```

## Testing

```bash
# Run tests
pnpm --filter backend test src/ingest

# Test with sample PDF
pnpm --filter backend dev
```

## References

- Design Doc: `docs/development/phase-one/06 - RAG Pipeline Design.md`
- Chunking Strategy: `docs/development/requirements/dataset/03-chunking-strategy.md`
- Current Code: `backend/src/ingest/components/PDFDownloader.ts`
