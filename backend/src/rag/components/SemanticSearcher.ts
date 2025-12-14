import { ProviderFactory } from '../../factory/ProviderFactory.js';
import { Logger, type SearchResult } from '@ticobot/shared';
import { QueryProcessor } from './QueryProcessor.js';

/**
 * SemanticSearcher Component
 * Performs semantic similarity search and hybrid search in the vector database
 * Supports both vector-only and vector+keyword hybrid search for improved precision
 */
export class SemanticSearcher {
    private logger: Logger;
    private queryProcessor: QueryProcessor;

    constructor() {
        this.logger = new Logger('SemanticSearcher');
        this.queryProcessor = new QueryProcessor();
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
     * Search with quality filtering (Issue #33)
     * Filters out low-quality chunks based on quality score
     * @param embedding - Query embedding vector
     * @param topK - Number of results to return
     * @param minQualityScore - Minimum quality score (0-1, default: 0.5)
     * @param filters - Optional metadata filters
     * @returns Filtered array of high-quality results
     */
    async searchWithQualityFilter(
        embedding: number[],
        topK: number = 5,
        minQualityScore: number = 0.5,
        filters?: Record<string, any>
    ): Promise<SearchResult[]> {
        this.logger.info(`Searching with minimum quality score: ${minQualityScore}`);

        // Fetch more results to account for filtering
        const results = await this.search(embedding, topK * 2, filters);

        // Filter by quality score
        const filtered = results.filter(r => {
            const qualityScore = r.document.metadata?.qualityScore as number | undefined;
            return (qualityScore ?? 1.0) >= minQualityScore;
        });

        // Limit to topK after filtering
        const limited = filtered.slice(0, topK);

        if (filtered.length < results.length) {
            this.logger.info(
                `Filtered ${results.length - filtered.length} low-quality chunks ` +
                `(below ${minQualityScore} quality score)`
            );
        }

        return limited;
    }

    /**
     * Search with both relevance and quality filtering (Issues #32, #33)
     * Combines similarity score filtering with quality score filtering
     * @param embedding - Query embedding vector
     * @param topK - Number of results to return
     * @param minRelevanceScore - Minimum similarity score (0-1, default: 0.7)
     * @param minQualityScore - Minimum quality score (0-1, default: 0.5)
     * @param filters - Optional metadata filters
     * @returns Filtered array of high-quality, relevant results
     */
    async searchWithCombinedFilters(
        embedding: number[],
        topK: number = 5,
        minRelevanceScore: number = 0.7,
        minQualityScore: number = 0.5,
        filters?: Record<string, any>
    ): Promise<SearchResult[]> {
        this.logger.info(
            `Searching with filters - Relevance: ${minRelevanceScore}, Quality: ${minQualityScore}`
        );

        // Fetch more results to account for filtering
        const results = await this.search(embedding, topK * 3, filters);

        // Apply both filters
        const filtered = results.filter(r => {
            const relevanceScore = r.score ?? 0;
            const qualityScore = r.document.metadata?.qualityScore as number | undefined ?? 1.0;

            return relevanceScore >= minRelevanceScore && qualityScore >= minQualityScore;
        });

        // Limit to topK after filtering
        const limited = filtered.slice(0, topK);

        const removedByRelevance = results.filter(r => (r.score ?? 0) < minRelevanceScore).length;
        const removedByQuality = results.filter(r => {
            const qualityScore = r.document.metadata?.qualityScore as number | undefined ?? 1.0;
            return qualityScore < minQualityScore;
        }).length;

        this.logger.info(
            `Filtered ${results.length - filtered.length} results ` +
            `(${removedByRelevance} low relevance, ${removedByQuality} low quality)`
        );

        return limited;
    }

    /**
     * Hybrid search with automatic query processing (Pre-RAG)
     * Combines vector similarity with keyword matching for ~95% precision
     *
     * This is the recommended search method for best accuracy
     *
     * @param queryText - User's query text
     * @param embedding - Query embedding vector
     * @param topK - Number of results to return
     * @param options - Search options
     * @returns Array of search results with hybrid scores
     */
    async searchHybrid(
        queryText: string,
        embedding: number[],
        topK: number = 5,
        options?: {
            vectorWeight?: number;
            keywordWeight?: number;
            minScore?: number;
            partyId?: string;
            minQualityScore?: number;
            useQueryProcessing?: boolean; // Default: true
        }
    ): Promise<SearchResult[]> {
        const useQueryProcessing = options?.useQueryProcessing ?? true;

        let searchText = queryText;

        // Step 1: Pre-RAG query processing (extract keywords with LLM)
        if (useQueryProcessing) {
            try {
                this.logger.info('Using Pre-RAG query processing for keyword extraction');

                const llmProvider = await ProviderFactory.getLLMProvider();
                const processed = await this.queryProcessor.processQuery(queryText, llmProvider);

                // Build enhanced search text with keywords + entities
                searchText = this.queryProcessor.buildSearchText(processed);

                this.logger.info(`Enhanced query: "${searchText.substring(0, 100)}..."`);
            } catch (error) {
                this.logger.warn('Query processing failed, using original query:', error);
                // Continue with original query text
            }
        }

        // Step 2: Perform hybrid search
        try {
            const vectorStore = await ProviderFactory.getVectorStore();

            // Check if vector store supports hybrid search
            if ('hybridSearch' in vectorStore && typeof vectorStore.hybridSearch === 'function') {
                this.logger.info(`Hybrid search: topK=${topK}, vectorWeight=${options?.vectorWeight ?? 0.7}`);

                const results = await vectorStore.hybridSearch(
                    embedding,
                    searchText,
                    topK,
                    {
                        vectorWeight: options?.vectorWeight,
                        keywordWeight: options?.keywordWeight,
                        minScore: options?.minScore,
                        partyId: options?.partyId,
                        minQualityScore: options?.minQualityScore,
                    }
                );

                this.logger.info(`Hybrid search returned ${results.length} results`);

                // Log score breakdown for first result
                if (results.length > 0 && results[0].document.metadata) {
                    const meta = results[0].document.metadata;
                    this.logger.info(
                        `Top result scores - ` +
                        `Hybrid: ${meta.hybridScore?.toFixed(3)}, ` +
                        `Vector: ${meta.vectorScore?.toFixed(3)}, ` +
                        `Keyword: ${meta.keywordScore?.toFixed(3)}`
                    );
                }

                return results;

            } else {
                // Fallback to regular vector search if hybrid not available
                this.logger.warn('Hybrid search not available, falling back to vector-only search');
                return await this.search(embedding, topK, {
                    partyId: options?.partyId,
                });
            }

        } catch (error) {
            this.logger.error('Hybrid search failed:', error);
            throw new Error(`Hybrid search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
