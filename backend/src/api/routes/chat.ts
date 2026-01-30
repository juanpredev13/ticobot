import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';
import { RAGPipeline } from '../../rag/components/RAGPipeline.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { createSupabaseClient } from '../../db/supabase.js';
import { ChatCacheService } from '../../db/services/chat-cache.service.js';

const router: Router = Router();
const logger = new Logger('ChatAPI');

// Initialize RAG pipeline with larger context for multi-party responses
const ragPipeline = new RAGPipeline({
    maxContextLength: 16000 // ~4k tokens for context (allows multiple chunks per party)
});

// Validation schema
const chatSchema = z.object({
    question: z.string().min(1, 'Question cannot be empty').max(1000, 'Question too long'),
    party: z.string().optional(),
    topK: z.coerce.number().min(1).max(15).default(10), // Increased for multi-party coverage
    temperature: z.coerce.number().min(0).max(2).default(0.7),
    maxTokens: z.coerce.number().min(100).max(4000).default(2000), // Increased for multi-party responses
    minRelevanceScore: z.coerce.number().min(0).max(1).default(0.1),
    conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).optional()
});

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with government plan documents using RAG
 *     description: Ask questions about Costa Rica's 2026 government plans and get AI-generated answers grounded in official documents
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: User's question about government plans
 *                 example: ¿Qué proponen los partidos sobre educación superior?
 *               party:
 *                 type: string
 *                 description: Filter by political party ID
 *                 example: pln
 *               topK:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 15
 *                 default: 10
 *                 description: Number of relevant chunks to retrieve (higher for multi-party)
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *                 description: LLM sampling temperature (higher = more creative)
 *               maxTokens:
 *                 type: number
 *                 minimum: 100
 *                 maximum: 4000
 *                 default: 2000
 *                 description: Maximum tokens in response (higher for multi-party)
 *               minRelevanceScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.1
 *                 description: Minimum similarity score for retrieved chunks
 *               conversationHistory:
 *                 type: array
 *                 description: Previous conversation messages for context
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chat response with sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: AI-generated answer
 *                 sources:
 *                   type: array
 *                   description: Source chunks used for the answer
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       party:
 *                         type: string
 *                       document:
 *                         type: string
 *                       page:
 *                         type: string
 *                       relevanceScore:
 *                         type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     model:
 *                       type: string
 *                     tokensUsed:
 *                       type: number
 *                     sourcesCount:
 *                       type: number
 *                     processingTime:
 *                       type: number
 *                 filters:
 *                   type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const params = chatSchema.parse(req.body);

        logger.info(`Chat question: "${params.question}" (party=${params.party || 'all'}, topK=${params.topK})`);

        // Initialize cache service
        const supabase = createSupabaseClient();
        const cacheService = new ChatCacheService(supabase);

        // Check cache FIRST - this avoids ALL embeddings and LLM calls
        logger.info(`🔍 Checking cache for question: "${params.question}"`);
        const cached = await cacheService.getCached(
            params.question,
            params.party,
            params.topK,
            params.minRelevanceScore
        );

        if (cached) {
            logger.info(`✅ Cache HIT - Skipping embeddings & LLM calls for question: "${params.question}"`);
            
            const processingTime = Date.now() - startTime;
            logger.info(`Cache served in ${processingTime}ms (saved ~5-10s of RAG processing)`);

            return res.json({
                answer: cached.answer,
                sources: cached.sources.map((source: any) => ({
                    id: source.id,
                    content: source.content,
                    party: source.party,
                    document: source.document,
                    page: source.pageNumber ||
                          (source.pageRange ?
                            `${source.pageRange.start}-${source.pageRange.end}` :
                            null),
                    relevanceScore: source.relevance || 0
                })),
                metadata: {
                    model: cached.metadata.model || 'cached',
                    tokensUsed: cached.metadata.tokensUsed || 0,
                    sourcesCount: cached.sources.length,
                    processingTime,
                    cached: true
                },
                filters: {
                    party: params.party || null,
                    minRelevanceScore: params.minRelevanceScore
                }
            });
        }

        logger.info(`❌ Cache MISS - Will generate embeddings & use LLM for question: "${params.question}"`);

        // Process query through RAG pipeline
        const result = await ragPipeline.query(params.question, {
            topK: params.topK,
            filters: params.party ? { partyId: params.party } : undefined,
            temperature: params.temperature,
            maxTokens: params.maxTokens,
            minRelevanceScore: params.minRelevanceScore
        });

        const processingTime = Date.now() - startTime;
        logger.info(`Chat completed: ${result.sources.length} sources used, ${result.metadata.tokensUsed || 0} tokens in ${processingTime}ms`);

        // Prepare sources for response and cache
        const sources = result.sources.map(source => ({
            id: source.id,
            content: source.content,
            party: source.party,
            document: source.document,
            pageNumber: source.pageNumber,
            pageRange: source.pageRange,
            relevance: source.relevance || 0
        }));

        // Store in cache (async, don't wait)
        cacheService.setCached(
            params.question,
            result.answer,
            sources,
            {
                processingTime,
                tokensUsed: result.metadata.tokensUsed || 0,
                model: result.metadata.model,
                // Cache for 7 days by default (can be made configurable)
                expiresInHours: 24 * 7,
            },
            params.party,
            params.topK,
            params.minRelevanceScore
        ).catch(err => {
            logger.warn('Failed to cache chat result:', err);
        });

        res.json({
            answer: result.answer,
            sources: sources.map(source => ({
                id: source.id,
                content: source.content,
                party: source.party,
                document: source.document,
                page: source.pageNumber ||
                      (source.pageRange ?
                        `${source.pageRange.start}-${source.pageRange.end}` :
                        null),
                relevanceScore: source.relevance || 0
            })),
            metadata: {
                model: result.metadata.model,
                tokensUsed: result.metadata.tokensUsed || 0,
                sourcesCount: result.sources.length,
                processingTime,
                cached: false
            },
            filters: {
                party: params.party || null,
                minRelevanceScore: params.minRelevanceScore
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }

        // Handle RAG pipeline errors
        logger.error('Chat error:', error);
        next(error);
    }
});

/**
 * Handle OPTIONS preflight request for streaming endpoint
 */
router.options('/stream', (req: Request, res: Response) => {
    const origin = req.headers.origin || req.headers.referer;
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const allowedOrigins = isDevelopment
        ? [
            clientUrl,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
          ]
        : [clientUrl];

    // Allow all origins in development for SSE
    if (isDevelopment) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
});

/**
 * @swagger
 * /api/chat/stream:
 *   post:
 *     summary: Stream chat responses using Server-Sent Events
 *     description: Get real-time streaming responses for chat queries
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: User's question
 *                 example: ¿Cuáles son las propuestas ambientales?
 *               party:
 *                 type: string
 *                 description: Filter by political party ID
 *               topK:
 *                 type: number
 *                 default: 5
 *               temperature:
 *                 type: number
 *                 default: 0.7
 *               maxTokens:
 *                 type: number
 *                 default: 800
 *               minRelevanceScore:
 *                 type: number
 *                 default: 0.35
 *     responses:
 *       200:
 *         description: Server-Sent Events stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: SSE stream with events (start, sources, chunk, done, error)
 *       400:
 *         description: Validation error
 */
router.post('/stream', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const params = chatSchema.parse(req.body);

        logger.info(`Chat stream question: "${params.question}"`);

        // Set up CORS headers for SSE (must be set before any data is sent)
        // Note: CORS middleware should handle this, but we set it explicitly for SSE
        const origin = req.headers.origin || req.headers.referer;
        const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const allowedOrigins = isDevelopment
            ? [
                clientUrl,
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
              ]
            : [clientUrl];

        // Set CORS headers - allow all origins in development for SSE
        if (isDevelopment) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        } else if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Type');

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        // Initialize cache service
        const supabase = createSupabaseClient();
        const cacheService = new ChatCacheService(supabase);

        // Check cache FIRST
        logger.info(`🔍 Checking cache for stream question: "${params.question}"`);
        const cached = await cacheService.getCached(
            params.question,
            params.party,
            params.topK,
            params.minRelevanceScore
        );

        if (cached) {
            logger.info(`✅ Cache HIT - Streaming cached response for question: "${params.question}"`);
            
            // Send initial event
            res.write(`data: ${JSON.stringify({ type: 'start', message: 'Loading cached response...' })}\n\n`);

            // Send sources event
            res.write(`data: ${JSON.stringify({
                type: 'sources',
                sources: cached.sources.map((source: any) => ({
                    id: source.id,
                    content: source.content,
                    party: source.party,
                    document: source.document,
                    page: source.pageNumber ||
                          (source.pageRange ?
                            `${source.pageRange.start}-${source.pageRange.end}` :
                            null),
                    relevanceScore: source.relevance || 0
                }))
            })}\n\n`);

            // Stream the cached answer as chunks
            const words = cached.answer.split(' ');
            const chunkSize = 10; // Words per chunk

            for (let i = 0; i < words.length; i += chunkSize) {
                const chunk = words.slice(i, i + chunkSize).join(' ');
                res.write(`data: ${JSON.stringify({
                    type: 'chunk',
                    content: chunk + (i + chunkSize < words.length ? ' ' : '')
                })}\n\n`);

                // Small delay for demonstration
                await new Promise(resolve => setTimeout(resolve, 30));
            }

            const processingTime = Date.now() - startTime;
            // Send completion event
            res.write(`data: ${JSON.stringify({
                type: 'done',
                metadata: {
                    model: cached.metadata.model || 'cached',
                    tokensUsed: cached.metadata.tokensUsed || 0,
                    sourcesCount: cached.sources.length,
                    processingTime,
                    cached: true
                }
            })}\n\n`);

            res.end();
            return;
        }

        logger.info(`❌ Cache MISS - Will generate embeddings & use LLM for stream question: "${params.question}"`);

        // Send initial event
        res.write(`data: ${JSON.stringify({ type: 'start', message: 'Processing query...' })}\n\n`);

        try {
            // Process query through RAG pipeline
            const result = await ragPipeline.query(params.question, {
                topK: params.topK,
                filters: params.party ? { partyId: params.party } : undefined,
                temperature: params.temperature,
                maxTokens: params.maxTokens,
                minRelevanceScore: params.minRelevanceScore
            });

            // Prepare sources for response and cache
            const sources = result.sources.map(source => ({
                id: source.id,
                content: source.content,
                party: source.party,
                document: source.document,
                pageNumber: source.pageNumber,
                pageRange: source.pageRange,
                relevance: source.relevance || 0
            }));

            // Send sources event
            res.write(`data: ${JSON.stringify({
                type: 'sources',
                sources: sources.map(source => ({
                    id: source.id,
                    content: source.content,
                    party: source.party,
                    document: source.document,
                    page: source.pageNumber ||
                          (source.pageRange ?
                            `${source.pageRange.start}-${source.pageRange.end}` :
                            null),
                    relevanceScore: source.relevance || 0
                }))
            })}\n\n`);

            // For streaming, we would ideally stream the LLM response
            // For now, we'll send the complete answer as chunks
            const words = result.answer.split(' ');
            const chunkSize = 10; // Words per chunk

            for (let i = 0; i < words.length; i += chunkSize) {
                const chunk = words.slice(i, i + chunkSize).join(' ');
                res.write(`data: ${JSON.stringify({
                    type: 'chunk',
                    content: chunk + (i + chunkSize < words.length ? ' ' : '')
                })}\n\n`);

                // Small delay for demonstration
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const processingTime = Date.now() - startTime;

            // Store in cache (async, don't wait)
            cacheService.setCached(
                params.question,
                result.answer,
                sources,
                {
                    processingTime,
                    tokensUsed: result.metadata.tokensUsed || 0,
                    model: result.metadata.model,
                    // Cache for 7 days by default
                    expiresInHours: 24 * 7,
                },
                params.party,
                params.topK,
                params.minRelevanceScore
            ).catch(err => {
                logger.warn('Failed to cache stream result:', err);
            });

            // Send completion event
            res.write(`data: ${JSON.stringify({
                type: 'done',
                metadata: {
                    model: result.metadata.model,
                    tokensUsed: result.metadata.tokensUsed || 0,
                    sourcesCount: result.sources.length,
                    processingTime,
                    cached: false
                }
            })}\n\n`);

            res.end();

        } catch (streamError) {
            logger.error('Stream error:', streamError);
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Failed to process query',
                message: streamError instanceof Error ? streamError.message : 'Unknown error'
            })}\n\n`);
            res.end();
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }
        next(error);
    }
});

export default router;
