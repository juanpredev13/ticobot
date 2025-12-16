import { get_encoding } from 'tiktoken';
import { Logger } from '@ticobot/shared';
import type { PageMarker } from './TextCleaner.js';

export interface ChunkOptions {
    chunkSize?: number;        // Target tokens per chunk (default: 400)
    maxChunkSize?: number;     // Maximum tokens per chunk (default: 600)
    overlapSize?: number;      // Overlap tokens (default: 50)
    splitOn?: 'paragraph' | 'sentence' | 'word';
    pageMarkers?: PageMarker[]; // Optional page markers for metadata
    embeddingMaxTokens?: number; // Maximum tokens allowed by embedding model (default: 8192)
}

export interface TextChunk {
    chunkId: string;
    documentId: string;
    content: string;
    tokens: number;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    pageNumber?: number;        // Page number where chunk starts
    pageRange?: { start: number; end: number }; // If chunk spans pages
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
            chunkSize = 400,
            maxChunkSize = 600,
            overlapSize = 50,
            splitOn = 'paragraph',
            pageMarkers = [],
            embeddingMaxTokens = 8192
        } = options;

        // Effective max chunk size is the minimum of maxChunkSize and embeddingMaxTokens
        const effectiveMaxChunkSize = Math.min(maxChunkSize, embeddingMaxTokens - 100); // 100 token safety margin

        this.logger.info(`Chunking text for ${documentId} (${text.length} chars, target: ${chunkSize} tokens, max: ${effectiveMaxChunkSize} tokens)`);

        // Split text into segments
        const segments = this.splitText(text, splitOn);

        // Combine segments into chunks
        const chunks: TextChunk[] = [];
        let currentChunk = '';
        let currentTokens = 0;
        let chunkIndex = 0;
        let startChar = 0;

        for (let i = 0; i < segments.length; i++) {
            let segment = segments[i];
            let segmentTokens = this.countTokens(segment);

            // If segment is too large, split it further
            if (segmentTokens > effectiveMaxChunkSize) {
                this.logger.warn(
                    `Segment ${i} is too large (${segmentTokens} tokens), splitting by ${splitOn === 'paragraph' ? 'sentence' : 'word'}`
                );
                const subSegments = this.splitLargeSegment(segment, effectiveMaxChunkSize, splitOn);
                
                // Process each sub-segment
                for (const subSegment of subSegments) {
                    const subTokens = this.countTokens(subSegment);
                    
                    // If adding this sub-segment would exceed max size, save current chunk
                    if (currentTokens + subTokens > effectiveMaxChunkSize && currentChunk.length > 0) {
                        chunks.push(this.createChunk(
                            documentId,
                            currentChunk,
                            chunkIndex++,
                            startChar,
                            startChar + currentChunk.length,
                            pageMarkers
                        ));

                        // Start new chunk with overlap
                        const overlapText = this.getOverlapText(currentChunk, overlapSize);
                        startChar = startChar + currentChunk.length - overlapText.length;
                        currentChunk = overlapText;
                        currentTokens = this.countTokens(overlapText);
                    }

                    // Add sub-segment to current chunk
                    currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + subSegment;
                    currentTokens += subTokens;

                    // If we've reached target size, save chunk
                    if (currentTokens >= chunkSize && i < segments.length - 1) {
                        chunks.push(this.createChunk(
                            documentId,
                            currentChunk,
                            chunkIndex++,
                            startChar,
                            startChar + currentChunk.length,
                            pageMarkers
                        ));

                        // Start new chunk with overlap
                        const overlapText = this.getOverlapText(currentChunk, overlapSize);
                        startChar = startChar + currentChunk.length - overlapText.length;
                        currentChunk = overlapText;
                        currentTokens = this.countTokens(overlapText);
                    }
                }
                continue;
            }

            // If adding this segment would exceed max size, save current chunk
            if (currentTokens + segmentTokens > effectiveMaxChunkSize && currentChunk.length > 0) {
                chunks.push(this.createChunk(
                    documentId,
                    currentChunk,
                    chunkIndex++,
                    startChar,
                    startChar + currentChunk.length,
                    pageMarkers
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
                    startChar + currentChunk.length,
                    pageMarkers
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
                startChar + currentChunk.length,
                pageMarkers
            ));
        }

        // Final validation: ensure no chunk exceeds embedding limit
        const validChunks: TextChunk[] = [];
        for (const chunk of chunks) {
            if (chunk.tokens > embeddingMaxTokens) {
                this.logger.warn(
                    `Chunk ${chunk.chunkIndex} exceeds embedding limit (${chunk.tokens} > ${embeddingMaxTokens} tokens), splitting...`
                );
                // Split oversized chunk by sentences
                const splitChunks = this.splitOversizedChunk(chunk, embeddingMaxTokens, pageMarkers);
                validChunks.push(...splitChunks);
            } else {
                validChunks.push(chunk);
            }
        }

        this.logger.info(`Created ${validChunks.length} chunks for ${documentId}`);

        return validChunks;
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
     * Split a large segment into smaller sub-segments
     */
    private splitLargeSegment(
        segment: string,
        maxTokens: number,
        currentStrategy: 'paragraph' | 'sentence' | 'word'
    ): string[] {
        // Try splitting by sentences if currently splitting by paragraphs
        if (currentStrategy === 'paragraph') {
            const sentences = this.splitText(segment, 'sentence');
            const subSegments: string[] = [];
            let currentSubSegment = '';
            let currentSubTokens = 0;

            for (const sentence of sentences) {
                const sentenceTokens = this.countTokens(sentence);
                
                if (currentSubTokens + sentenceTokens > maxTokens && currentSubSegment.length > 0) {
                    subSegments.push(currentSubSegment.trim());
                    currentSubSegment = sentence;
                    currentSubTokens = sentenceTokens;
                } else {
                    currentSubSegment += (currentSubSegment.length > 0 ? ' ' : '') + sentence;
                    currentSubTokens += sentenceTokens;
                }
            }

            if (currentSubSegment.trim().length > 0) {
                subSegments.push(currentSubSegment.trim());
            }

            return subSegments;
        }

        // If already splitting by sentences, split by words
        if (currentStrategy === 'sentence') {
            const words = this.splitText(segment, 'word');
            const subSegments: string[] = [];
            let currentSubSegment = '';
            let currentSubTokens = 0;

            for (const word of words) {
                const wordTokens = this.countTokens(word);
                
                if (currentSubTokens + wordTokens > maxTokens && currentSubSegment.length > 0) {
                    subSegments.push(currentSubSegment.trim());
                    currentSubSegment = word;
                    currentSubTokens = wordTokens;
                } else {
                    currentSubSegment += (currentSubSegment.length > 0 ? ' ' : '') + word;
                    currentSubTokens += wordTokens;
                }
            }

            if (currentSubSegment.trim().length > 0) {
                subSegments.push(currentSubSegment.trim());
            }

            return subSegments;
        }

        // Last resort: split by words even if already splitting by words
        return this.splitText(segment, 'word');
    }

    /**
     * Split an oversized chunk into smaller chunks
     */
    private splitOversizedChunk(
        chunk: TextChunk,
        maxTokens: number,
        pageMarkers: PageMarker[]
    ): TextChunk[] {
        const sentences = this.splitText(chunk.content, 'sentence');
        const newChunks: TextChunk[] = [];
        let currentContent = '';
        let currentTokens = 0;
        let chunkIndex = chunk.chunkIndex;
        let startChar = chunk.startChar;

        for (const sentence of sentences) {
            const sentenceTokens = this.countTokens(sentence);
            
            if (currentTokens + sentenceTokens > maxTokens && currentContent.length > 0) {
                newChunks.push(this.createChunk(
                    chunk.documentId,
                    currentContent,
                    chunkIndex++,
                    startChar,
                    startChar + currentContent.length,
                    pageMarkers
                ));
                startChar += currentContent.length;
                currentContent = sentence;
                currentTokens = sentenceTokens;
            } else {
                currentContent += (currentContent.length > 0 ? ' ' : '') + sentence;
                currentTokens += sentenceTokens;
            }
        }

        if (currentContent.trim().length > 0) {
            newChunks.push(this.createChunk(
                chunk.documentId,
                currentContent,
                chunkIndex,
                startChar,
                startChar + currentContent.length,
                pageMarkers
            ));
        }

        return newChunks;
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
     * Create a chunk object with page information
     */
    private createChunk(
        documentId: string,
        content: string,
        chunkIndex: number,
        startChar: number,
        endChar: number,
        pageMarkers: PageMarker[] = []
    ): TextChunk {
        const tokens = this.countTokens(content);
        const chunkId = `${documentId}-chunk-${chunkIndex}`;

        // Find which page(s) this chunk belongs to
        const pageInfo = this.findPageForChunk(startChar, endChar, pageMarkers);

        return {
            chunkId,
            documentId,
            content: content.trim(),
            tokens,
            chunkIndex,
            startChar,
            endChar,
            ...pageInfo
        };
    }

    /**
     * Determine which page(s) a chunk belongs to based on character positions
     */
    private findPageForChunk(
        startChar: number,
        endChar: number,
        pageMarkers: PageMarker[]
    ): { pageNumber?: number; pageRange?: { start: number; end: number } } {
        if (pageMarkers.length === 0) {
            return {};
        }

        // Find the page markers that fall within or around this chunk
        const startPage = this.findPageAtPosition(startChar, pageMarkers);
        const endPage = this.findPageAtPosition(endChar, pageMarkers);

        if (startPage === endPage) {
            // Chunk is entirely within one page
            return { pageNumber: startPage };
        } else if (startPage && endPage) {
            // Chunk spans multiple pages
            return { pageRange: { start: startPage, end: endPage } };
        } else if (startPage) {
            return { pageNumber: startPage };
        }

        return {};
    }

    /**
     * Find which page a character position belongs to
     */
    private findPageAtPosition(position: number, pageMarkers: PageMarker[]): number | undefined {
        if (pageMarkers.length === 0) return undefined;

        // Find the last marker before this position
        for (let i = pageMarkers.length - 1; i >= 0; i--) {
            if (pageMarkers[i].position <= position) {
                return pageMarkers[i].pageNumber;
            }
        }

        // If position is before all markers, assume page 1
        return 1;
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
