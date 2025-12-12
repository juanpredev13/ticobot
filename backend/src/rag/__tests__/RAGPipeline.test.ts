import { describe, it, expect, beforeAll } from 'vitest';
import { RAGPipeline } from '../components/RAGPipeline.js';

/**
 * RAGPipeline Integration Tests
 *
 * These tests verify the complete RAG pipeline workflow.
 *
 * NOTE: These tests require:
 * - Valid API keys in .env (OPENAI_API_KEY, etc.)
 * - Vector database populated with documents
 * - Network connectivity to LLM/embedding providers
 */

describe('RAGPipeline Integration Tests', () => {
    let pipeline: RAGPipeline;

    beforeAll(() => {
        pipeline = new RAGPipeline();
    });

    it('should initialize RAGPipeline successfully', () => {
        expect(pipeline).toBeDefined();
        expect(pipeline).toBeInstanceOf(RAGPipeline);
    });

    it('should process a simple query end-to-end', async () => {
        const question = '¿Qué propone el PLN sobre educación?';

        const result = await pipeline.query(question, {
            topK: 3,
            filters: { partyId: 'PLN' }
        });

        expect(result).toBeDefined();
        expect(result.answer).toBeDefined();
        expect(typeof result.answer).toBe('string');
        expect(result.answer.length).toBeGreaterThan(0);

        expect(result.sources).toBeDefined();
        expect(Array.isArray(result.sources)).toBe(true);

        expect(result.confidence).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);

        expect(result.metadata).toBeDefined();
        expect(result.metadata.queryTime).toBeGreaterThan(0);
        expect(result.metadata.chunksRetrieved).toBeGreaterThanOrEqual(0);
    }, 30000); // 30s timeout for LLM calls

    it('should handle queries with no results gracefully', async () => {
        const question = 'completely irrelevant query xyz123';

        const result = await pipeline.query(question, {
            topK: 3,
            minRelevanceScore: 0.9 // Very high threshold
        });

        expect(result).toBeDefined();
        expect(result.sources.length).toBe(0);
        expect(result.confidence).toBe(0);
    }, 30000);

    it('should retrieve relevant sources for education query', async () => {
        const question = '¿Cuáles son las propuestas educativas?';

        const result = await pipeline.query(question, { topK: 5 });

        expect(result.sources.length).toBeGreaterThan(0);
        expect(result.sources.length).toBeLessThanOrEqual(5);

        // Check source structure
        const firstSource = result.sources[0];
        expect(firstSource.id).toBeDefined();
        expect(firstSource.content).toBeDefined();
        expect(firstSource.party).toBeDefined();
        expect(firstSource.relevance).toBeGreaterThan(0);
    }, 30000);

    it('should filter by party correctly', async () => {
        const question = '¿Qué proponen sobre salud?';

        const result = await pipeline.query(question, {
            topK: 3,
            filters: { partyId: 'PLN' }
        });

        // All sources should be from PLN
        for (const source of result.sources) {
            expect(source.party).toBe('PLN');
        }
    }, 30000);

    it('should compare multiple parties on same topic', async () => {
        const question = '¿Qué proponen sobre economía?';
        const partyIds = ['PLN', 'PUSC', 'PAC'];

        const result = await pipeline.compareParties(question, partyIds, {
            topKPerParty: 2
        });

        expect(result).toBeDefined();
        expect(result.question).toBe(question);
        expect(result.comparisons).toBeDefined();
        expect(result.comparisons.length).toBe(partyIds.length);

        // Check each comparison
        for (const comparison of result.comparisons) {
            expect(comparison.party).toBeDefined();
            expect(comparison.answer).toBeDefined();
            expect(comparison.confidence).toBeGreaterThanOrEqual(0);
            expect(comparison.confidence).toBeLessThanOrEqual(1);
        }
    }, 60000); // Longer timeout for multiple queries

    it('should handle Spanish characters correctly', async () => {
        const question = '¿Qué propone sobre educación, salud y bienestar?';

        const result = await pipeline.query(question, { topK: 3 });

        expect(result.answer).toBeDefined();
        // Should handle Spanish characters in response
        expect(result.answer.length).toBeGreaterThan(0);
    }, 30000);

    it('should respect maxTokens parameter', async () => {
        const question = '¿Cuáles son todas las propuestas del PLN?';

        const result = await pipeline.query(question, {
            topK: 5,
            maxTokens: 100 // Short response
        });

        expect(result.answer).toBeDefined();
        // Response should be relatively short due to maxTokens limit
        expect(result.answer.split(' ').length).toBeLessThan(200);
    }, 30000);

    it('should include metadata in response', async () => {
        const question = '¿Qué proponen sobre tecnología?';

        const result = await pipeline.query(question);

        expect(result.metadata).toBeDefined();
        expect(result.metadata.queryTime).toBeGreaterThan(0);
        expect(result.metadata.chunksRetrieved).toBeDefined();
        expect(result.metadata.chunksUsed).toBeDefined();
        expect(result.metadata.model).toBeDefined();
    }, 30000);
});

describe('RAGPipeline Streaming Tests', () => {
    let pipeline: RAGPipeline;

    beforeAll(() => {
        pipeline = new RAGPipeline();
    });

    it('should stream response chunks', async () => {
        const question = '¿Qué propone el PLN sobre educación?';
        const chunks: string[] = [];
        let metadata: any = null;

        for await (const item of pipeline.queryStreaming(question, { topK: 3 })) {
            if (item.type === 'chunk') {
                chunks.push(item.content || '');
            } else if (item.type === 'metadata') {
                metadata = item.metadata;
            }
        }

        expect(chunks.length).toBeGreaterThan(0);
        expect(metadata).toBeDefined();
        expect(metadata.sources).toBeDefined();

        // Combine chunks to get full response
        const fullResponse = chunks.join('');
        expect(fullResponse.length).toBeGreaterThan(0);
    }, 30000);
});
