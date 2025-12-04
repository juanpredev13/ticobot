import { ProviderFactory } from '../../factory/ProviderFactory.js';
import { Logger } from '../../../../shared/src/utils/Logger.js';
import type { SearchResult } from '../../../../shared/src/types/common.js';

/**
 * SemanticSearcher Component
 * Performs semantic similarity search in the vector database
 */
export class SemanticSearcher {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('SemanticSearcher');
    }

    /**
     * Search for relevant document chunks using semantic similarity
     * @param embedding - Query embedding vector
     * @param topK - Number of results to return (default: 5)
     * @param filters - Optional metadata filters (e.g., { partyId: 'PLN' })
     * @returns Array of search results with relevance scores
     */
    async search(
        embedding: number[],
        topK: number = 5,
        filters?: Record<string, any>
    ): Promise<SearchResult[]> {
        this.logger.info(`Searching for top ${topK} results${filters ? ' with filters' : ''}`);

        try {
            // Get vector store from factory
            const vectorStore = await ProviderFactory.getVectorStore();

            // Perform similarity search
            const results = await vectorStore.similaritySearch(
                embedding,
                topK,
                filters
            );

            this.logger.info(`Found ${results.length} results`);

            // Log relevance scores
            if (results.length > 0) {
                const scores = results.map(r => r.score?.toFixed(3) || 'N/A').join(', ');
                this.logger.info(`Relevance scores: [${scores}]`);
            }

            return results;

        } catch (error) {
            this.logger.error('Failed to perform semantic search', error);
            throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Search with automatic relevance filtering
     * Filters out results below a minimum similarity threshold
     * @param embedding - Query embedding vector
     * @param topK - Number of results to return
     * @param minScore - Minimum similarity score (0-1, default: 0.7)
     * @param filters - Optional metadata filters
     * @returns Filtered array of high-relevance results
     */
    async searchWithThreshold(
        embedding: number[],
        topK: number = 5,
        minScore: number = 0.7,
        filters?: Record<string, any>
    ): Promise<SearchResult[]> {
        this.logger.info(`Searching with minimum score threshold: ${minScore}`);

        const results = await this.search(embedding, topK, filters);

        // Filter by minimum score
        const filtered = results.filter(r => (r.score ?? 0) >= minScore);

        if (filtered.length < results.length) {
            this.logger.info(`Filtered ${results.length - filtered.length} low-relevance results`);
        }

        return filtered;
    }

    /**
     * Search across multiple parties and merge results
     * @param embedding - Query embedding vector
     * @param partyIds - Array of party IDs to search
     * @param topKPerParty - Results per party
     * @returns Merged and sorted results
     */
    async searchMultipleParties(
        embedding: number[],
        partyIds: string[],
        topKPerParty: number = 3
    ): Promise<SearchResult[]> {
        this.logger.info(`Searching across ${partyIds.length} parties`);

        const allResults: SearchResult[] = [];

        for (const partyId of partyIds) {
            const results = await this.search(
                embedding,
                topKPerParty,
                { partyId }
            );
            allResults.push(...results);
        }

        // Sort by relevance score descending
        allResults.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

        this.logger.info(`Merged ${allResults.length} results from ${partyIds.length} parties`);

        return allResults;
    }
}
