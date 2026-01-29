import { QueryEmbedder } from './QueryEmbedder.js';
import { SemanticSearcher } from './SemanticSearcher.js';
import { ContextBuilder } from './ContextBuilder.js';
import { ResponseGenerator } from './ResponseGenerator.js';
import { Logger, type SearchResult } from '@ticobot/shared';
import { createSupabaseClient } from '../../db/supabase.js';
import { PartiesService } from '../../db/services/parties.service.js';

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

            // Step 2: Search for relevant chunks using hybrid search (vector + keywords)
            this.logger.info('Step 2/4: Searching for relevant chunks (hybrid search)...');
            const topK = options?.topK ?? 5;
            
            // Use hybrid search which combines vector similarity with keyword matching
            // This provides ~95% precision vs ~80% with vector-only search
            const searchResults: SearchResult[] = await this.searcher.searchHybrid(
                question,  // Original query text for keyword extraction
                embedding, // Embedding for vector search
                topK,
                {
                    vectorWeight: 0.7,  // 70% weight for vector similarity
                    keywordWeight: 0.3, // 30% weight for keyword matching
                    minScore: options?.minRelevanceScore,
                    partyId: options?.filters?.partyId,
                    useQueryProcessing: true, // Enable Pre-RAG keyword extraction
                }
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
            const filteredResults = searchResults.filter(result => {
                const documentId = result.document.metadata?.documentId || '';
                // Exclude metadata documents from sources but keep them in context
                return !EXCLUDED_FROM_SOURCES.includes(documentId);
            });

            // Normalize scores: scale so the highest score becomes 1.0 (100%)
            // This makes the UI more intuitive - best match always shows 100%
            const maxScore = filteredResults.length > 0 
                ? Math.max(...filteredResults.map(r => r.score))
                : 1.0;
            
            const minScore = filteredResults.length > 0
                ? Math.min(...filteredResults.map(r => r.score))
                : 0.0;

            // Normalize: map [minScore, maxScore] to [0.5, 1.0] range
            // This ensures even lower scores are visible but best is always 100%
            const normalizedSources = filteredResults.map(result => {
                // If all scores are similar, don't normalize too aggressively
                const scoreRange = maxScore - minScore;
                let normalizedRelevance: number;
                
                if (scoreRange < 0.1) {
                    // Scores are very similar, use original score but boost it
                    normalizedRelevance = Math.min(1.0, result.score * 1.5);
                } else {
                    // Normalize: (score - min) / (max - min) * 0.5 + 0.5
                    // Maps to [0.5, 1.0] range, ensuring best is 1.0
                    normalizedRelevance = ((result.score - minScore) / scoreRange) * 0.5 + 0.5;
                }
                
                return {
                    id: result.document.id,
                    content: result.document.content.substring(0, 200) + '...',
                    party: result.document.metadata?.partyId || result.document.metadata?.party || 'Unknown',
                    document: result.document.metadata?.title || result.document.metadata?.documentId || 'Unknown',
                    relevance: normalizedRelevance,
                    pageNumber: result.document.metadata?.pageNumber,
                    pageRange: result.document.metadata?.pageRange,
                };
            });

            const sources = normalizedSources;

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
            // Steps 1-3: Same as regular query (using hybrid search)
            const embedding = await this.embedder.embed(question);
            const searchResults = await this.searcher.searchHybrid(
                question,
                embedding,
                options?.topK ?? 5,
                {
                    vectorWeight: 0.7,
                    keywordWeight: 0.3,
                    partyId: options?.filters?.partyId,
                    useQueryProcessing: true,
                }
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
     * @param partyIds - Array of party IDs to compare (can be abbreviations or UUIDs)
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

        // Initialize services to resolve party UUIDs from abbreviations
        const supabase = createSupabaseClient();
        const partiesService = new PartiesService(supabase);

        for (const partyId of partyIds) {
            // Try to resolve party UUID and name from slug/abbreviation
            // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partyId);

            let filterPartyId: string | undefined = partyId;
            let partyName: string = partyId; // Store party name for the prompt

            // Always try to look up party info (for name) unless it's a raw UUID
            try {
                const slug = partyId.toLowerCase();
                // First try by slug (e.g., "liberacion-nacional", "pueblo-soberano")
                let party = await partiesService.findBySlug(slug);

                if (party?.id) {
                    filterPartyId = party.id;
                    partyName = party.name || partyId;
                    this.logger.info(`Resolved party slug "${slug}" to "${partyName}" (UUID: ${party.id})`);
                } else {
                    // Try by abbreviation (e.g., "PLN", "CAC")
                    party = await partiesService.findByAbbreviation(partyId.toUpperCase());
                    if (party?.id) {
                        filterPartyId = party.id;
                        partyName = party.name || partyId;
                        this.logger.info(`Resolved party abbreviation "${partyId}" to "${partyName}" (UUID: ${party.id})`);
                    } else if (isUUID) {
                        // It's a UUID, try to get party info by ID
                        party = await partiesService.findById(partyId);
                        if (party?.name) {
                            partyName = party.name;
                            this.logger.info(`Resolved party UUID "${partyId}" to "${partyName}"`);
                        } else {
                            this.logger.warn(`Party not found for UUID "${partyId}", using ID as name`);
                        }
                    } else {
                        // Final fallback
                        this.logger.warn(`Party not found for "${partyId}", using as-is`);
                    }
                }
            } catch (error) {
                // If lookup fails, use partyId as-is
                this.logger.warn(`Error looking up party "${partyId}":`, error);
            }

            // Try with default threshold first
            let searchResults = await this.searcher.searchHybrid(
                question,
                embedding,
                options?.topKPerParty ?? 3,
                {
                    vectorWeight: 0.7,
                    keywordWeight: 0.3,
                    minScore: 0.3, // Default threshold
                    partyId: filterPartyId,
                    useQueryProcessing: true,
                }
            );

            // If no results, try with lower threshold (0.2) for better recall
            if (searchResults.length === 0) {
                this.logger.warn(`No results with threshold 0.3, trying lower threshold 0.2 for party ${partyId}`);
                searchResults = await this.searcher.searchHybrid(
                    question,
                    embedding,
                    options?.topKPerParty ?? 3,
                    {
                        vectorWeight: 0.7,
                        keywordWeight: 0.3,
                        minScore: 0.2, // Lower threshold for better recall
                        partyId: filterPartyId,
                        useQueryProcessing: true,
                    }
                );
            }

            // If still no results, try with even lower threshold (0.1) for very specific queries
            if (searchResults.length === 0) {
                this.logger.warn(`No results with threshold 0.2, trying lower threshold 0.1 for party ${partyId}`);
                searchResults = await this.searcher.searchHybrid(
                    question,
                    embedding,
                    options?.topKPerParty ?? 5, // Get more results
                    {
                        vectorWeight: 0.7,
                        keywordWeight: 0.3,
                        minScore: 0.1, // Very low threshold for maximum recall
                        partyId: filterPartyId,
                        useQueryProcessing: true,
                    }
                );
            }

            if (searchResults.length > 0) {
                const context = this.contextBuilder.build(searchResults, question);

                // Extract topic from question for the party-specific query
                const topicMatch = question.match(/propuestas?\s+(?:sobre|de|en)\s+([^?]+)/i);
                const topic = topicMatch ? topicMatch[1].replace(/de los partidos.*$/i, '').trim() : question;
                const partySpecificQuestion = `¿Cuáles son las propuestas sobre ${topic}?`;
                this.logger.info(`Party-specific question for ${partyName}: "${partySpecificQuestion}"`);

                // Build custom user prompt that only mentions this party
                // This bypasses the default buildUserPrompt which mentions TOP 5 parties
                const singlePartyUserPrompt = this.generator.buildSinglePartyPrompt(
                    context,
                    partySpecificQuestion,
                    partyName
                );

                // System prompt focused on single party analysis
                const singlePartySystemPrompt = `Eres un asistente experto en Planes de Gobierno de Costa Rica 2026.
Tu tarea es analizar ÚNICAMENTE las propuestas del partido ${partyName}.
NO menciones otros partidos políticos bajo ninguna circunstancia.
Responde siempre en español.`;

                const response = await this.generator.generate(context, partySpecificQuestion, {
                    temperature: options?.temperature,
                    systemPrompt: singlePartySystemPrompt,
                    userPrompt: singlePartyUserPrompt,
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
                    answer: `No se encontró información para ${partyId} sobre este tema.`,
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
            answer: 'No pude encontrar información relevante en la base de datos de planes de gobierno para responder tu pregunta. Por favor, intenta reformular la pregunta o pregunta sobre un tema diferente.',
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
