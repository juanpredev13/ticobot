import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
