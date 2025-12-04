import { ProviderFactory } from '../../factory/ProviderFactory.js';
import { Logger } from '../../../../shared/src/utils/Logger.js';

/**
 * QueryEmbedder Component
 * Converts user queries into vector embeddings for semantic search
 */
export class QueryEmbedder {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('QueryEmbedder');
    }

    /**
     * Generate embedding for a search query
     * @param query - User's search query
     * @returns Embedding vector
     */
    async embed(query: string): Promise<number[]> {
        this.logger.info(`Generating embedding for query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

        try {
            // Preprocess query
            const cleanedQuery = this.preprocessQuery(query);

            // Get embedding provider from factory
            const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

            // Generate embedding
            const result = await embeddingProvider.generateEmbedding(cleanedQuery);

            this.logger.info(`Embedding generated (${result.embedding.length} dimensions)`);

            return result.embedding;

        } catch (error) {
            this.logger.error('Failed to generate query embedding', error);
            throw new Error(`Query embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Batch embed multiple queries
     * @param queries - Array of queries
     * @returns Array of embeddings
     */
    async embedBatch(queries: string[]): Promise<number[][]> {
        this.logger.info(`Generating embeddings for ${queries.length} queries`);

        const embeddings: number[][] = [];

        for (const query of queries) {
            const embedding = await this.embed(query);
            embeddings.push(embedding);

            // Add small delay to avoid rate limiting
            if (queries.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return embeddings;
    }

    /**
     * Preprocess query before embedding
     * @param query - Raw query
     * @returns Cleaned query
     */
    private preprocessQuery(query: string): string {
        return query
            // Trim whitespace
            .trim()
            // Normalize multiple spaces
            .replace(/\s+/g, ' ')
            // Remove leading/trailing punctuation that might affect embeddings
            .replace(/^[.,;:!?¿¡\s]+|[.,;:!?¿¡\s]+$/g, '');
    }
}
