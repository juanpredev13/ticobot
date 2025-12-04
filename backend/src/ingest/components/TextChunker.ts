import { get_encoding } from 'tiktoken';
import { Logger } from '@ticobot/shared';

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
        const decoded = this.encoding.decode(overlapTokenSlice);

        // Convert Uint8Array to string
        const overlapText = new TextDecoder().decode(decoded);

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
