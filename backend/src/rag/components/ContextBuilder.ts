import { Logger } from '../../../../shared/src/utils/Logger.js';
import type { SearchResult } from '../../../../shared/src/types/common.js';

/**
 * ContextBuilder Component
 * Builds formatted context from retrieved chunks for LLM consumption
 */
export class ContextBuilder {
    private logger: Logger;
    private maxContextLength: number;

    constructor(maxContextLength: number = 4000) {
        this.logger = new Logger('ContextBuilder');
        this.maxContextLength = maxContextLength;
    }

    /**
     * Build context string from search results
     * @param chunks - Retrieved document chunks from semantic search
     * @param query - Original user query
     * @returns Formatted context string for LLM
     */
    build(chunks: SearchResult[], query: string): string {
        this.logger.info(`Building context from ${chunks.length} chunks`);

        if (chunks.length === 0) {
            this.logger.warn('No chunks provided for context building');
            return this.buildEmptyContext(query);
        }

        // Build context from chunks
        const contextParts: string[] = [];
        let currentLength = 0;

        for (let i = 0; i < chunks.length; i++) {
            const result = chunks[i];
            const content = result.document.content || '';
            const metadata = result.document.metadata || {};

            // Format chunk with metadata
            const formattedChunk = this.formatChunk(i + 1, content, metadata);

            // Check if adding this chunk would exceed max length
            if (currentLength + formattedChunk.length > this.maxContextLength) {
                this.logger.info(`Context truncated at ${i} chunks to fit ${this.maxContextLength} char limit`);
                break;
            }

            contextParts.push(formattedChunk);
            currentLength += formattedChunk.length;
        }

        const context = contextParts.join('\n\n');

        this.logger.info(`Context built: ${currentLength} characters from ${contextParts.length} chunks`);

        return context;
    }

    /**
     * Build context with sources for citation
     * @param chunks - Retrieved document chunks
     * @param query - Original user query
     * @returns Object with context and source references
     */
    buildWithSources(chunks: SearchResult[], query: string): {
        context: string;
        sources: Array<{
            id: string;
            title: string;
            party: string;
            relevance: number;
        }>;
    } {
        const context = this.build(chunks, query);

        const sources = chunks.map((result, index) => ({
            id: result.document.id || `chunk-${index}`,
            title: result.document.metadata?.title || result.document.metadata?.documentId || 'Unknown Document',
            party: result.document.metadata?.partyId || result.document.metadata?.party || 'Unknown Party',
            relevance: result.score || 0,
        }));

        return { context, sources };
    }

    /**
     * Format individual chunk with metadata
     * @param index - Chunk number for reference
     * @param content - Chunk text content
     * @param metadata - Chunk metadata
     * @returns Formatted chunk string
     */
    private formatChunk(
        index: number,
        content: string,
        metadata: Record<string, any>
    ): string {
        const party = metadata.partyId || metadata.party || 'Unknown';
        const document = metadata.title || metadata.documentId || 'Unknown Document';

        return `[Source ${index}] ${party} - ${document}\n${content}`;
    }

    /**
     * Build empty context when no results found
     * @param query - Original user query
     * @returns Message indicating no results
     */
    private buildEmptyContext(query: string): string {
        return `No relevant information found in the government plans database for the query: "${query}"`;
    }

    /**
     * Get summary statistics about the context
     * @param chunks - Retrieved document chunks
     * @returns Statistics object
     */
    getContextStats(chunks: SearchResult[]): {
        totalChunks: number;
        uniqueDocuments: number;
        uniqueParties: number;
        avgRelevance: number;
    } {
        const uniqueDocs = new Set(chunks.map(c => c.document.metadata?.documentId || c.document.id));
        const uniqueParties = new Set(chunks.map(c => c.document.metadata?.partyId || c.document.metadata?.party));
        const avgRelevance = chunks.length > 0
            ? chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length
            : 0;

        return {
            totalChunks: chunks.length,
            uniqueDocuments: uniqueDocs.size,
            uniqueParties: uniqueParties.size,
            avgRelevance: Number(avgRelevance.toFixed(3)),
        };
    }
}
