# Phase 2.1 Manual Implementation Guide

**Time Required:** 12-18 hours over 2-3 days
**Difficulty:** Intermediate
**Prerequisites:** Node.js 20+, pnpm, TypeScript knowledge

## Overview

This guide walks you through implementing the complete PDF ingestion pipeline step-by-step. You'll build:

1. PDFDownloader (fix existing implementation)
2. PDFParser (extract text from PDFs)
3. TextCleaner (clean Spanish text)
4. TextChunker (split into semantic chunks)
5. IngestPipeline (orchestrate everything)

## Step 1: Fix PDFDownloader (1-2 hours)

### 1.1 Install axios

```bash
cd /home/juanpredev/Desktop/dev/juanpredev/ticobot
pnpm --filter backend add axios
```

**Verify installation:**
```bash
# Check backend/package.json has axios in dependencies
cat backend/package.json | grep axios
```

### 1.2 Fix TypeScript Error

Open `backend/src/ingest/components/PDFDownloader.ts` in your editor.

**Add ErrorClassification interface after line 31:**

```typescript
// After the PDFDownloadResult interface, add:

interface ErrorClassification {
    type: 'network' | 'timeout' | 'validation' | 'filesystem' | 'unknown';
    httpStatus?: number;
}
```

**Update method signature at line 77:**

```typescript
// Change from:
private classifyError(error: unknown): { type: string; httpStatus?: number } {

// To:
private classifyError(error: unknown): ErrorClassification {
```

**Update variable declaration around line 108:**

```typescript
// Change from:
let errorClassification = { type: 'unknown' } as const;

// To:
let errorClassification: ErrorClassification = { type: 'unknown' };
```

### 1.3 Test the Fix

```bash
# Compile TypeScript to check for errors
pnpm --filter backend build
```

**Expected output:** No TypeScript errors

If you see errors, double-check:
- Interface is in the correct location
- Method signature matches exactly
- Variable declaration uses explicit type annotation

## Step 2: Implement PDFParser (3-4 hours)

### 2.1 Install pdf-parse

```bash
pnpm --filter backend add pdf-parse
pnpm --filter backend add -D @types/pdf-parse
```

### 2.2 Create PDFParser.ts

Create file: `backend/src/ingest/components/PDFParser.ts`

```typescript
import pdf from 'pdf-parse';
import fs from 'fs/promises';
import { Logger } from '../../../shared/src/utils/Logger';

export interface PDFParseResult {
    documentId: string;
    text: string;
    pageCount: number;
    metadata: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string;
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
    };
}

export class PDFParser {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('PDFParser');
    }

    /**
     * Parse a PDF file and extract text content
     * @param filePath - Path to the PDF file
     * @param documentId - Unique identifier for the document
     * @returns Parsed document with text and metadata
     */
    async parse(filePath: string, documentId: string): Promise<PDFParseResult> {
        this.logger.info(`Parsing PDF: ${documentId}`);

        try {
            // Read file buffer
            const dataBuffer = await fs.readFile(filePath);

            // Parse PDF
            const data = await pdf(dataBuffer);

            this.logger.info(`Successfully parsed PDF: ${documentId} (${data.numpages} pages)`);

            return {
                documentId,
                text: data.text,
                pageCount: data.numpages,
                metadata: {
                    title: data.info?.Title,
                    author: data.info?.Author,
                    subject: data.info?.Subject,
                    keywords: data.info?.Keywords,
                    creator: data.info?.Creator,
                    producer: data.info?.Producer,
                    creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
                    modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
                }
            };

        } catch (error) {
            this.logger.error(`Failed to parse PDF: ${documentId}`, error);
            throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate that a file is a valid PDF
     * @param filePath - Path to check
     * @returns true if valid PDF
     */
    async isValidPDF(filePath: string): Promise<boolean> {
        try {
            const stats = await fs.stat(filePath);

            // Check file exists and is not empty
            if (!stats.isFile() || stats.size === 0) {
                return false;
            }

            // Check file extension
            if (!filePath.toLowerCase().endsWith('.pdf')) {
                return false;
            }

            // Try to read PDF header (should start with %PDF-)
            const buffer = await fs.readFile(filePath);
            const header = buffer.toString('utf-8', 0, 5);

            return header === '%PDF-';

        } catch (error) {
            this.logger.error(`PDF validation failed: ${filePath}`, error);
            return false;
        }
    }
}
```

### 2.3 Test PDFParser

Create test file: `backend/src/ingest/components/__tests__/PDFParser.test.ts`

```typescript
import { PDFParser } from '../PDFParser';
import path from 'path';

describe('PDFParser', () => {
    let parser: PDFParser;

    beforeEach(() => {
        parser = new PDFParser();
    });

    it('should parse a valid PDF file', async () => {
        // You'll need a sample PDF for testing
        const testPdfPath = path.join(__dirname, 'fixtures', 'sample.pdf');

        const result = await parser.parse(testPdfPath, 'test-doc-001');

        expect(result.documentId).toBe('test-doc-001');
        expect(result.text).toBeTruthy();
        expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should validate PDF files correctly', async () => {
        const testPdfPath = path.join(__dirname, 'fixtures', 'sample.pdf');
        const isValid = await parser.isValidPDF(testPdfPath);

        expect(isValid).toBe(true);
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- PDFParser.test.ts
```

## Step 3: Implement TextCleaner (2-3 hours)

### 3.1 Create TextCleaner.ts

Create file: `backend/src/ingest/components/TextCleaner.ts`

```typescript
import { Logger } from '../../../shared/src/utils/Logger';

export interface TextCleaningOptions {
    normalizeWhitespace?: boolean;
    removeSpecialChars?: boolean;
    fixEncoding?: boolean;
    preservePunctuation?: boolean;
}

export class TextCleaner {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('TextCleaner');
    }

    /**
     * Clean and normalize text content
     * @param text - Raw text to clean
     * @param options - Cleaning options
     * @returns Cleaned text
     */
    clean(text: string, options: TextCleaningOptions = {}): string {
        const {
            normalizeWhitespace = true,
            removeSpecialChars = true,
            fixEncoding = true,
            preservePunctuation = true
        } = options;

        this.logger.info(`Cleaning text (${text.length} characters)`);

        let cleaned = text;

        // 1. Fix encoding issues (common in Spanish PDFs)
        if (fixEncoding) {
            cleaned = this.fixEncodingIssues(cleaned);
        }

        // 2. Remove or normalize special characters
        if (removeSpecialChars) {
            cleaned = this.removeSpecialCharacters(cleaned, preservePunctuation);
        }

        // 3. Normalize whitespace
        if (normalizeWhitespace) {
            cleaned = this.normalizeWhitespace(cleaned);
        }

        // 4. Trim
        cleaned = cleaned.trim();

        this.logger.info(`Text cleaned (${cleaned.length} characters, ${text.length - cleaned.length} removed)`);

        return cleaned;
    }

    /**
     * Fix common encoding issues in Spanish text
     */
    private fixEncodingIssues(text: string): string {
        const encodingMap: Record<string, string> = {
            // Spanish vowels with accents
            'Ã¡': 'á',
            'Ã©': 'é',
            'Ã­': 'í',
            'Ã³': 'ó',
            'Ãº': 'ú',
            'Ã': 'Á',
            'Ã‰': 'É',
            'Ã': 'Í',
            'Ã"': 'Ó',
            'Ãš': 'Ú',
            // Spanish ñ
            'Ã±': 'ñ',
            'Ã'': 'Ñ',
            // Common quotation marks
            'â€œ': '"',
            'â€': '"',
            'â€™': "'",
            'â€˜': "'",
            // Dashes
            'â€"': '-',
            'â€"': '—',
        };

        let fixed = text;
        for (const [wrong, correct] of Object.entries(encodingMap)) {
            fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
        }

        return fixed;
    }

    /**
     * Remove special characters while preserving Spanish letters
     */
    private removeSpecialCharacters(text: string, preservePunctuation: boolean): string {
        if (preservePunctuation) {
            // Keep letters, numbers, spaces, and common punctuation
            // Include Spanish letters: áéíóúñÁÉÍÓÚÑ
            return text.replace(/[^\w\s\-.,;:!?¿¡áéíóúñÁÉÍÓÚÑ]/g, '');
        } else {
            // Keep only letters, numbers, and spaces
            return text.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '');
        }
    }

    /**
     * Normalize whitespace (multiple spaces, tabs, newlines)
     */
    private normalizeWhitespace(text: string): string {
        return text
            // Replace multiple spaces with single space
            .replace(/[ \t]+/g, ' ')
            // Replace multiple newlines with double newline (preserve paragraphs)
            .replace(/\n{3,}/g, '\n\n')
            // Remove spaces around newlines
            .replace(/\s*\n\s*/g, '\n');
    }

    /**
     * Get cleaning statistics
     */
    getCleaningStats(originalText: string, cleanedText: string) {
        return {
            originalLength: originalText.length,
            cleanedLength: cleanedText.length,
            charactersRemoved: originalText.length - cleanedText.length,
            reductionPercentage: ((originalText.length - cleanedText.length) / originalText.length * 100).toFixed(2) + '%'
        };
    }
}
```

### 3.2 Test TextCleaner

Create test file: `backend/src/ingest/components/__tests__/TextCleaner.test.ts`

```typescript
import { TextCleaner } from '../TextCleaner';

describe('TextCleaner', () => {
    let cleaner: TextCleaner;

    beforeEach(() => {
        cleaner = new TextCleaner();
    });

    it('should fix Spanish encoding issues', () => {
        const dirty = 'EducaciÃ³n y salud para todos los costarricenses';
        const clean = cleaner.clean(dirty);

        expect(clean).toBe('Educación y salud para todos los costarricenses');
    });

    it('should normalize whitespace', () => {
        const dirty = 'Multiple    spaces\n\n\nand   newlines';
        const clean = cleaner.clean(dirty);

        expect(clean).not.toContain('    ');
        expect(clean).not.toContain('\n\n\n');
    });

    it('should preserve Spanish characters', () => {
        const text = 'ñáéíóú ÑÁÉÍÓÚ';
        const clean = cleaner.clean(text);

        expect(clean).toBe(text);
    });

    it('should remove special characters but keep punctuation', () => {
        const dirty = 'Hello! ¿Cómo estás? @#$%';
        const clean = cleaner.clean(dirty);

        expect(clean).toContain('¿');
        expect(clean).toContain('!');
        expect(clean).not.toContain('@');
        expect(clean).not.toContain('#');
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- TextCleaner.test.ts
```

## Step 4: Implement TextChunker (4-5 hours)

### 4.1 Install tiktoken

```bash
pnpm --filter backend add tiktoken
```

### 4.2 Create TextChunker.ts

Create file: `backend/src/ingest/components/TextChunker.ts`

```typescript
import { get_encoding } from 'tiktoken';
import { Logger } from '../../../shared/src/utils/Logger';

export interface ChunkOptions {
    chunkSize?: number;        // Target tokens per chunk (default: 500)
    maxChunkSize?: number;     // Maximum tokens per chunk (default: 800)
    overlapSize?: number;      // Overlap tokens (default: 75)
    splitOn?: 'paragraph' | 'sentence' | 'word';
}

export interface TextChunk {
    chunkId: string;
    documentId: string;
    content: string;
    tokens: number;
    chunkIndex: number;
    startChar: number;
    endChar: number;
}

export class TextChunker {
    private logger: Logger;
    private encoding;

    constructor() {
        this.logger = new Logger('TextChunker');
        // Use cl100k_base encoding (same as GPT-4, GPT-3.5-turbo)
        this.encoding = get_encoding('cl100k_base');
    }

    /**
     * Split text into semantic chunks with overlap
     * @param text - Text to chunk
     * @param documentId - Document identifier
     * @param options - Chunking options
     * @returns Array of text chunks
     */
    async chunk(
        text: string,
        documentId: string,
        options: ChunkOptions = {}
    ): Promise<TextChunk[]> {
        const {
            chunkSize = 500,
            maxChunkSize = 800,
            overlapSize = 75,
            splitOn = 'paragraph'
        } = options;

        this.logger.info(`Chunking text for ${documentId} (${text.length} chars, target: ${chunkSize} tokens)`);

        // Split text into segments
        const segments = this.splitText(text, splitOn);

        // Combine segments into chunks
        const chunks: TextChunk[] = [];
        let currentChunk = '';
        let currentTokens = 0;
        let chunkIndex = 0;
        let startChar = 0;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const segmentTokens = this.countTokens(segment);

            // If adding this segment would exceed max size, save current chunk
            if (currentTokens + segmentTokens > maxChunkSize && currentChunk.length > 0) {
                chunks.push(this.createChunk(
                    documentId,
                    currentChunk,
                    chunkIndex++,
                    startChar,
                    startChar + currentChunk.length
                ));

                // Start new chunk with overlap
                const overlapText = this.getOverlapText(currentChunk, overlapSize);
                startChar = startChar + currentChunk.length - overlapText.length;
                currentChunk = overlapText;
                currentTokens = this.countTokens(overlapText);
            }

            // Add segment to current chunk
            currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + segment;
            currentTokens += segmentTokens;

            // If we've reached target size, save chunk
            if (currentTokens >= chunkSize && i < segments.length - 1) {
                chunks.push(this.createChunk(
                    documentId,
                    currentChunk,
                    chunkIndex++,
                    startChar,
                    startChar + currentChunk.length
                ));

                // Start new chunk with overlap
                const overlapText = this.getOverlapText(currentChunk, overlapSize);
                startChar = startChar + currentChunk.length - overlapText.length;
                currentChunk = overlapText;
                currentTokens = this.countTokens(overlapText);
            }
        }

        // Add final chunk if there's remaining content
        if (currentChunk.trim().length > 0) {
            chunks.push(this.createChunk(
                documentId,
                currentChunk,
                chunkIndex,
                startChar,
                startChar + currentChunk.length
            ));
        }

        this.logger.info(`Created ${chunks.length} chunks for ${documentId}`);

        return chunks;
    }

    /**
     * Split text into segments based on strategy
     */
    private splitText(text: string, splitOn: 'paragraph' | 'sentence' | 'word'): string[] {
        switch (splitOn) {
            case 'paragraph':
                // Split on double newlines (paragraph breaks)
                return text.split(/\n\n+/).filter(p => p.trim().length > 0);

            case 'sentence':
                // Split on sentence-ending punctuation
                return text.split(/[.!?]+\s+/).filter(s => s.trim().length > 0);

            case 'word':
                // Split on whitespace
                return text.split(/\s+/).filter(w => w.trim().length > 0);

            default:
                return [text];
        }
    }

    /**
     * Count tokens in text using tiktoken
     */
    private countTokens(text: string): number {
        const tokens = this.encoding.encode(text);
        return tokens.length;
    }

    /**
     * Get overlap text from end of chunk
     */
    private getOverlapText(chunk: string, overlapTokens: number): string {
        const tokens = this.encoding.encode(chunk);

        if (tokens.length <= overlapTokens) {
            return chunk;
        }

        // Get last N tokens
        const overlapTokenSlice = tokens.slice(-overlapTokens);
        const overlapText = this.encoding.decode(overlapTokenSlice);

        return overlapText;
    }

    /**
     * Create a chunk object
     */
    private createChunk(
        documentId: string,
        content: string,
        chunkIndex: number,
        startChar: number,
        endChar: number
    ): TextChunk {
        const tokens = this.countTokens(content);
        const chunkId = `${documentId}-chunk-${chunkIndex}`;

        return {
            chunkId,
            documentId,
            content: content.trim(),
            tokens,
            chunkIndex,
            startChar,
            endChar
        };
    }

    /**
     * Get chunking statistics
     */
    getChunkingStats(chunks: TextChunk[]) {
        const tokenCounts = chunks.map(c => c.tokens);

        return {
            totalChunks: chunks.length,
            avgTokens: (tokenCounts.reduce((a, b) => a + b, 0) / chunks.length).toFixed(2),
            minTokens: Math.min(...tokenCounts),
            maxTokens: Math.max(...tokenCounts),
            totalTokens: tokenCounts.reduce((a, b) => a + b, 0)
        };
    }

    /**
     * Clean up tiktoken encoding
     */
    dispose() {
        this.encoding.free();
    }
}
```

### 4.3 Test TextChunker

Create test file: `backend/src/ingest/components/__tests__/TextChunker.test.ts`

```typescript
import { TextChunker } from '../TextChunker';

describe('TextChunker', () => {
    let chunker: TextChunker;

    beforeEach(() => {
        chunker = new TextChunker();
    });

    afterEach(() => {
        chunker.dispose();
    });

    it('should chunk text into segments', async () => {
        const text = 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.';
        const chunks = await chunker.chunk(text, 'test-doc', {
            chunkSize: 10,
            maxChunkSize: 20
        });

        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0].documentId).toBe('test-doc');
    });

    it('should create overlapping chunks', async () => {
        const text = 'A'.repeat(1000);
        const chunks = await chunker.chunk(text, 'test-doc', {
            chunkSize: 100,
            overlapSize: 10
        });

        // Check that chunks overlap
        if (chunks.length > 1) {
            const lastChunkEnd = chunks[0].content.slice(-10);
            const nextChunkStart = chunks[1].content.slice(0, 10);
            expect(lastChunkEnd).toBe(nextChunkStart);
        }
    });

    it('should calculate correct token counts', async () => {
        const text = 'This is a test sentence.';
        const chunks = await chunker.chunk(text, 'test-doc');

        expect(chunks[0].tokens).toBeGreaterThan(0);
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- TextChunker.test.ts
```

## Step 5: Create IngestPipeline Orchestrator (2-3 hours)

### 5.1 Create IngestPipeline.ts

Create file: `backend/src/ingest/IngestPipeline.ts`

```typescript
import { PDFDownloader } from './components/PDFDownloader';
import { PDFParser } from './components/PDFParser';
import { TextCleaner } from './components/TextCleaner';
import { TextChunker, TextChunk } from './components/TextChunker';
import { ProviderFactory } from '../factory/ProviderFactory';
import { Logger } from '../../shared/src/utils/Logger';
import path from 'path';
import fs from 'fs/promises';

export interface IngestOptions {
    downloadPath?: string;
    cleaningOptions?: any;
    chunkingOptions?: any;
    generateEmbeddings?: boolean;
    storeInVectorDB?: boolean;
}

export interface IngestResult {
    documentId: string;
    success: boolean;
    chunks?: TextChunk[];
    error?: string;
    stats: {
        downloadTime: number;
        parseTime: number;
        cleanTime: number;
        chunkTime: number;
        embeddingTime?: number;
        totalTime: number;
    };
}

export class IngestPipeline {
    private downloader: PDFDownloader;
    private parser: PDFParser;
    private cleaner: TextCleaner;
    private chunker: TextChunker;
    private logger: Logger;

    constructor() {
        this.downloader = new PDFDownloader();
        this.parser = new PDFParser();
        this.cleaner = new TextCleaner();
        this.chunker = new TextChunker();
        this.logger = new Logger('IngestPipeline');
    }

    /**
     * Run the complete ingestion pipeline for a PDF
     * @param url - PDF URL to download
     * @param documentId - Unique document identifier
     * @param options - Pipeline options
     * @returns Ingestion result with chunks
     */
    async ingest(
        url: string,
        documentId: string,
        options: IngestOptions = {}
    ): Promise<IngestResult> {
        const startTime = Date.now();
        const stats = {
            downloadTime: 0,
            parseTime: 0,
            cleanTime: 0,
            chunkTime: 0,
            embeddingTime: 0,
            totalTime: 0
        };

        this.logger.info(`Starting ingestion pipeline for ${documentId}`);

        try {
            // 1. Download PDF
            const downloadStart = Date.now();
            const downloadPath = options.downloadPath || path.join(process.cwd(), 'downloads');
            await fs.mkdir(downloadPath, { recursive: true });

            const downloadResult = await this.downloader.download(url, downloadPath, documentId);
            stats.downloadTime = Date.now() - downloadStart;
            this.logger.info(`Downloaded PDF (${stats.downloadTime}ms)`);

            // 2. Parse PDF
            const parseStart = Date.now();
            const parseResult = await this.parser.parse(downloadResult.filePath, documentId);
            stats.parseTime = Date.now() - parseStart;
            this.logger.info(`Parsed PDF: ${parseResult.pageCount} pages (${stats.parseTime}ms)`);

            // 3. Clean text
            const cleanStart = Date.now();
            const cleanedText = this.cleaner.clean(parseResult.text, options.cleaningOptions);
            stats.cleanTime = Date.now() - cleanStart;
            this.logger.info(`Cleaned text (${stats.cleanTime}ms)`);

            // 4. Chunk text
            const chunkStart = Date.now();
            const chunks = await this.chunker.chunk(cleanedText, documentId, options.chunkingOptions);
            stats.chunkTime = Date.now() - chunkStart;
            this.logger.info(`Created ${chunks.length} chunks (${stats.chunkTime}ms)`);

            // 5. Generate embeddings (optional)
            if (options.generateEmbeddings) {
                const embeddingStart = Date.now();
                await this.generateEmbeddings(chunks);
                stats.embeddingTime = Date.now() - embeddingStart;
                this.logger.info(`Generated embeddings (${stats.embeddingTime}ms)`);
            }

            // 6. Store in vector DB (optional)
            if (options.storeInVectorDB) {
                await this.storeChunks(chunks);
                this.logger.info('Stored chunks in vector database');
            }

            stats.totalTime = Date.now() - startTime;

            this.logger.info(`Ingestion completed for ${documentId} (${stats.totalTime}ms)`);

            return {
                documentId,
                success: true,
                chunks,
                stats
            };

        } catch (error) {
            stats.totalTime = Date.now() - startTime;

            this.logger.error(`Ingestion failed for ${documentId}`, error);

            return {
                documentId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                stats
            };
        }
    }

    /**
     * Generate embeddings for chunks
     */
    private async generateEmbeddings(chunks: TextChunk[]): Promise<void> {
        const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

        for (const chunk of chunks) {
            const result = await embeddingProvider.generateEmbedding(chunk.content);
            // Store embedding in chunk or database
            // Implementation depends on your data model
        }
    }

    /**
     * Store chunks in vector database
     */
    private async storeChunks(chunks: TextChunk[]): Promise<void> {
        const vectorStore = await ProviderFactory.getVectorStore();
        const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

        for (const chunk of chunks) {
            // Generate embedding
            const embeddingResult = await embeddingProvider.generateEmbedding(chunk.content);

            // Store in vector DB
            await vectorStore.upsert({
                id: chunk.chunkId,
                values: embeddingResult.embedding,
                metadata: {
                    documentId: chunk.documentId,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex,
                    tokens: chunk.tokens
                }
            });
        }
    }

    /**
     * Batch ingest multiple documents
     */
    async ingestBatch(
        documents: Array<{ url: string; documentId: string }>,
        options: IngestOptions = {}
    ): Promise<IngestResult[]> {
        this.logger.info(`Starting batch ingestion for ${documents.length} documents`);

        const results: IngestResult[] = [];

        for (const doc of documents) {
            const result = await this.ingest(doc.url, doc.documentId, options);
            results.push(result);

            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const successCount = results.filter(r => r.success).length;
        this.logger.info(`Batch ingestion completed: ${successCount}/${documents.length} successful`);

        return results;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.chunker.dispose();
    }
}
```

### 5.2 Test IngestPipeline

Create test file: `backend/src/ingest/__tests__/IngestPipeline.test.ts`

```typescript
import { IngestPipeline } from '../IngestPipeline';

describe('IngestPipeline', () => {
    let pipeline: IngestPipeline;

    beforeEach(() => {
        pipeline = new IngestPipeline();
    });

    afterEach(() => {
        pipeline.dispose();
    });

    it('should run complete ingestion pipeline', async () => {
        // This test requires a real PDF URL or mock
        const testUrl = 'https://www.tse.go.cr/pdf/gobierno/plan_gobierno_test.pdf';
        const documentId = 'test-plan-001';

        const result = await pipeline.ingest(testUrl, documentId, {
            generateEmbeddings: false,
            storeInVectorDB: false
        });

        expect(result.success).toBe(true);
        expect(result.chunks).toBeDefined();
        expect(result.chunks!.length).toBeGreaterThan(0);
        expect(result.stats.totalTime).toBeGreaterThan(0);
    }, 30000); // 30 second timeout

    it('should handle errors gracefully', async () => {
        const invalidUrl = 'https://invalid-url.com/nonexistent.pdf';
        const documentId = 'invalid-doc';

        const result = await pipeline.ingest(invalidUrl, documentId);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
```

**Run tests:**
```bash
pnpm --filter backend test -- IngestPipeline.test.ts
```

## Step 6: Integration Testing (2-3 hours)

### 6.1 Create Integration Test Script

Create file: `backend/src/scripts/testIngestion.ts`

```typescript
import { IngestPipeline } from '../ingest/IngestPipeline';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const pipeline = new IngestPipeline();

    // Test with a real TSE PDF
    const testDocument = {
        url: 'https://www.tse.go.cr/pdf/gobierno/plan_gobierno_PARTIDO_LIBERACION_NACIONAL.pdf',
        documentId: 'pln-2026'
    };

    console.log('Starting ingestion test...\n');

    const result = await pipeline.ingest(
        testDocument.url,
        testDocument.documentId,
        {
            generateEmbeddings: true,
            storeInVectorDB: true
        }
    );

    console.log('\n=== INGESTION RESULT ===');
    console.log(`Document ID: ${result.documentId}`);
    console.log(`Success: ${result.success}`);

    if (result.success) {
        console.log(`\nChunks created: ${result.chunks?.length}`);
        console.log(`\nTiming breakdown:`);
        console.log(`  Download: ${result.stats.downloadTime}ms`);
        console.log(`  Parse: ${result.stats.parseTime}ms`);
        console.log(`  Clean: ${result.stats.cleanTime}ms`);
        console.log(`  Chunk: ${result.stats.chunkTime}ms`);
        console.log(`  Embeddings: ${result.stats.embeddingTime}ms`);
        console.log(`  Total: ${result.stats.totalTime}ms`);

        console.log(`\nFirst chunk preview:`);
        console.log(result.chunks![0].content.substring(0, 200) + '...');
    } else {
        console.log(`\nError: ${result.error}`);
    }

    pipeline.dispose();
}

main().catch(console.error);
```

**Run integration test:**
```bash
pnpm --filter backend tsx src/scripts/testIngestion.ts
```

### 6.2 Verify Everything Works

Run all tests together:
```bash
# Run all component tests
pnpm --filter backend test src/ingest/

# Run full build
pnpm --filter backend build

# Run integration test
pnpm --filter backend tsx src/scripts/testIngestion.ts
```

## Step 7: Create API Endpoint (1 hour)

### 7.1 Add Ingestion Endpoint

Add to `backend/src/api/routes/ingest.ts` (create if doesn't exist):

```typescript
import { Router } from 'express';
import { IngestPipeline } from '../../ingest/IngestPipeline';

const router = Router();

router.post('/ingest', async (req, res) => {
    const { url, documentId, options } = req.body;

    if (!url || !documentId) {
        return res.status(400).json({
            error: 'Missing required fields: url, documentId'
        });
    }

    const pipeline = new IngestPipeline();

    try {
        const result = await pipeline.ingest(url, documentId, options);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Ingestion failed'
        });
    } finally {
        pipeline.dispose();
    }
});

router.post('/ingest/batch', async (req, res) => {
    const { documents, options } = req.body;

    if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({
            error: 'Missing required field: documents (array)'
        });
    }

    const pipeline = new IngestPipeline();

    try {
        const results = await pipeline.ingestBatch(documents, options);

        res.json({
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Batch ingestion failed'
        });
    } finally {
        pipeline.dispose();
    }
});

export default router;
```

Register routes in `backend/src/api/server.ts`:
```typescript
import ingestRoutes from './routes/ingest';

// ... other imports and setup

app.use('/api/ingest', ingestRoutes);
```

### 7.2 Test API Endpoint

**Start the server:**
```bash
pnpm --filter backend dev
```

**Test with curl:**
```bash
# Single document
curl -X POST http://localhost:3000/api/ingest/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.tse.go.cr/pdf/gobierno/plan_gobierno_PARTIDO_LIBERACION_NACIONAL.pdf",
    "documentId": "pln-2026",
    "options": {
      "generateEmbeddings": true,
      "storeInVectorDB": true
    }
  }'
```

## Troubleshooting

### Common Issues

**1. TypeScript errors persist after fixes**
```bash
# Clear TypeScript cache
rm -rf backend/dist
rm -rf backend/tsconfig.tsbuildinfo
pnpm --filter backend build
```

**2. tiktoken installation fails**
```bash
# Try installing with --legacy-peer-deps
pnpm --filter backend add tiktoken --legacy-peer-deps
```

**3. PDF parsing fails**
```bash
# Check file permissions
ls -la downloads/
# Ensure PDFs are valid
file downloads/*.pdf
```

**4. Embedding provider fails**
```bash
# Check .env configuration
cat backend/.env | grep OPENAI
# Verify API key is set
```

**5. Out of memory errors**
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm --filter backend dev
```

## Next Steps

After completing Phase 2.1, you should:

1. **Update Obsidian vault** with progress
2. **Close GitHub Issue #17**
3. **Move to Phase 2.2** - RAG Pipeline (Issue #18)
4. **Test with all TSE PDFs** (full dataset ingestion)

## Reference

- Design doc: `docs/development/phase-one/06 - RAG Pipeline Design.md`
- Chunking strategy: `docs/development/requirements/dataset/03-chunking-strategy.md`
- Provider interfaces: `shared/src/interfaces/`
- GitHub Issue: https://github.com/juanpredev13/ticobot/issues/17
