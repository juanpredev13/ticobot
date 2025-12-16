import { QueryEmbedder } from './QueryEmbedder.js';
import { SemanticSearcher } from './SemanticSearcher.js';
import { ContextBuilder } from './ContextBuilder.js';
import { ResponseGenerator } from './ResponseGenerator.js';
import { Logger, type SearchResult } from '@ticobot/shared';

// Document IDs to exclude from displayed sources (but keep in context for LLM)
const EXCLUDED_FROM_SOURCES = ['partidos-candidatos-2026'];

/**
 * RAGPipeline - Main orchestrator for Retrieval-Augmented Generation
 * Coordinates the complete query-to-response workflow
 */
export class RAGPipeline {
    private readonly embedder: QueryEmbedder;
    private readonly searcher: SemanticSearcher;
    private readonly contextBuilder: ContextBuilder;
    private readonly generator: ResponseGenerator;
    private readonly logger: Logger;

    constructor(options?: {
        maxContextLength?: number;
    }) {
        this.embedder = new QueryEmbedder();
        this.searcher = new SemanticSearcher();
        this.contextBuilder = new ContextBuilder(options?.maxContextLength);
        this.generator = new ResponseGenerator();
        this.logger = new Logger('RAGPipeline');
    }

    /**
     * Process a user query through the complete RAG pipeline
     * @param question - User's question
     * @param options - Query options
     * @returns Response with answer, sources, and metadata
     */
    async query(
        question: string,
        options?: {
            topK?: number;
            filters?: Record<string, any>;
            temperature?: number;
            maxTokens?: number;
            minRelevanceScore?: number;
        }
    ): Promise<{
        answer: string;
        sources: Array<{
            id?: string;
            content: string;
            party: string;
            document: string;
            relevance: number;
            pageNumber?: number;
            pageRange?: { start: number; end: number };
        }>;
        confidence: number;
        metadata: {
            queryTime: number;
            chunksRetrieved: number;
            chunksUsed: number;
            model?: string;
            tokensUsed?: number;
        };
    }> {
        const startTime = Date.now();
        this.logger.info(`Processing query: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`);

        try {
            // Step 1: Embed the query
            this.logger.info('Step 1/4: Embedding query...');
            const embedding = await this.embedder.embed(question);

            // Step 2: Search for relevant chunks
            this.logger.info('Step 2/4: Searching for relevant chunks...');
            const topK = options?.topK ?? 5;
            const searchResults: SearchResult[] = options?.minRelevanceScore
                ? await this.searcher.searchWithThreshold(
                    embedding,
                    topK,
                    options.minRelevanceScore,
                    options?.filters
                )
                : await this.searcher.search(
                    embedding,
                    topK,
                    options?.filters
                );

            if (searchResults.length === 0) {
                this.logger.warn('No relevant results found');
                return this.buildEmptyResponse(question, Date.now() - startTime);
            }

            // Step 3: Build context
            this.logger.info('Step 3/4: Building context...');
            const context = this.contextBuilder.build(searchResults, question);
            this.logger.info(`Context built: ${context.length} characters`);
            this.logger.info(`Context preview: ${context.substring(0, 300)}...`);

            // Step 4: Generate response
            this.logger.info('Step 4/4: Generating response...');
            const response = await this.generator.generate(context, question, {
                temperature: options?.temperature,
                maxTokens: options?.maxTokens,
            });

            // Build sources (exclude metadata documents from displayed sources)
            const sources = searchResults
                .filter(result => {
                    const documentId = result.document.metadata?.documentId || '';
                    // Exclude metadata documents from sources but keep them in context
                    return !EXCLUDED_FROM_SOURCES.includes(documentId);
                })
                .map(result => ({
                    id: result.document.id,
                    content: result.document.content.substring(0, 200) + '...',
                    party: result.document.metadata?.partyId || result.document.metadata?.party || 'Unknown',
                    document: result.document.metadata?.title || result.document.metadata?.documentId || 'Unknown',
                    relevance: result.score,
                    pageNumber: result.document.metadata?.pageNumber,
                    pageRange: result.document.metadata?.pageRange,
                }));

            const queryTime = Date.now() - startTime;
            this.logger.info(`Query completed in ${queryTime}ms`);

            return {
                answer: response.answer,
                sources,
                confidence: response.confidence,
                metadata: {
                    queryTime,
                    chunksRetrieved: searchResults.length,
                    chunksUsed: searchResults.length,
                    model: response.model,
                    tokensUsed: response.tokensUsed,
                },
            };

        } catch (error) {
            this.logger.error('RAG pipeline failed', error);
            throw new Error(`Query processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Process query with streaming response
     * @param question - User's question
     * @param options - Query options
     * @returns AsyncIterator of response chunks plus final metadata
     */
    async *queryStreaming(
        question: string,
        options?: {
            topK?: number;
            filters?: Record<string, any>;
            temperature?: number;
            maxTokens?: number;
        }
    ): AsyncIterableIterator<{
        type: 'chunk' | 'metadata';
        content?: string;
        metadata?: any;
    }> {
        const startTime = Date.now();
        this.logger.info(`Processing streaming query: "${question.substring(0, 100)}..."`);

        try {
            // Steps 1-3: Same as regular query
            const embedding = await this.embedder.embed(question);
            const searchResults = await this.searcher.search(
                embedding,
                options?.topK ?? 5,
                options?.filters
            );

            if (searchResults.length === 0) {
                yield {
                    type: 'chunk',
                    content: 'No relevant information found for your query.'
                };
                return;
            }

            const context = this.contextBuilder.build(searchResults, question);

            // Step 4: Stream the response
            for await (const chunk of this.generator.generateStreaming(context, question, {
                temperature: options?.temperature,
                maxTokens: options?.maxTokens,
            })) {
                yield {
                    type: 'chunk',
                    content: chunk
                };
            }

            // Yield final metadata (exclude metadata documents from sources)
            const sources = searchResults
                .filter(result => {
                    const documentId = result.document.metadata?.documentId || '';
                    return !EXCLUDED_FROM_SOURCES.includes(documentId);
                })
                .map(result => ({
                    id: result.document.id,
                    party: result.document.metadata?.partyId || 'Unknown',
                    relevance: result.score,
                }));

            yield {
                type: 'metadata',
                metadata: {
                    sources,
                    queryTime: Date.now() - startTime,
                    chunksRetrieved: searchResults.length,
                }
            };

        } catch (error) {
            this.logger.error('Streaming RAG pipeline failed', error);
            throw new Error(`Streaming query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Compare multiple parties on a specific topic
     * @param question - Topic/question to compare
     * @param partyIds - Array of party IDs to compare
     * @param options - Query options
     * @returns Comparison results
     */
    async compareParties(
        question: string,
        partyIds: string[],
        options?: {
            topKPerParty?: number;
            temperature?: number;
        }
    ): Promise<{
        question: string;
        comparisons: Array<{
            party: string;
            answer: string;
            sources: Array<{
                content: string;
                relevance: number;
            }>;
            confidence: number;
        }>;
        summary?: string;
    }> {
        this.logger.info(`Comparing ${partyIds.length} parties on: "${question}"`);

        const embedding = await this.embedder.embed(question);
        const comparisons = [];

        for (const partyId of partyIds) {
            const searchResults = await this.searcher.search(
                embedding,
                options?.topKPerParty ?? 3,
                { partyId }
            );

            if (searchResults.length > 0) {
                const context = this.contextBuilder.build(searchResults, question);
                const response = await this.generator.generate(context, question, {
                    temperature: options?.temperature,
                });

                comparisons.push({
                    party: partyId,
                    answer: response.answer,
                    sources: searchResults
                        .filter(r => {
                            const documentId = r.document.metadata?.documentId || '';
                            return !EXCLUDED_FROM_SOURCES.includes(documentId);
                        })
                        .map(r => ({
                            content: r.document.content.substring(0, 200) + (r.document.content.length > 200 ? '...' : ''),
                            relevance: r.score,
                            pageNumber: r.document.metadata?.pageNumber,
                            pageRange: r.document.metadata?.pageRange,
                            documentId: r.document.metadata?.documentId || r.document.id,
                            chunkId: r.document.id,
                        })),
                    confidence: response.confidence,
                });
            } else {
                comparisons.push({
                    party: partyId,
                    answer: `No information found for ${partyId} on this topic.`,
                    sources: [],
                    confidence: 0,
                });
            }
        }

        return {
            question,
            comparisons,
        };
    }

    /**
     * Build empty response when no results found
     */
    private buildEmptyResponse(question: string, queryTime: number) {
        return {
            answer: 'I could not find relevant information in the government plans database to answer your question. Please try rephrasing or asking about a different topic.',
            sources: [],
            confidence: 0,
            metadata: {
                queryTime,
                chunksRetrieved: 0,
                chunksUsed: 0,
            },
        };
    }
}
