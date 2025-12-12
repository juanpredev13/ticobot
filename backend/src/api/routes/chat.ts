import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';
import { RAGPipeline } from '../../rag/components/RAGPipeline.js';
import { optionalAuth, checkRateLimit } from '../middleware/auth.middleware.js';

const router: Router = Router();
const logger = new Logger('ChatAPI');

// Initialize RAG pipeline
const ragPipeline = new RAGPipeline({
    maxContextLength: 3000 // ~3k tokens for context
});

// Validation schema
const chatSchema = z.object({
    question: z.string().min(1, 'Question cannot be empty').max(1000, 'Question too long'),
    party: z.string().optional(),
    topK: z.coerce.number().min(1).max(10).default(5),
    temperature: z.coerce.number().min(0).max(2).default(0.7),
    maxTokens: z.coerce.number().min(100).max(2000).default(800),
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
 *                 maximum: 10
 *                 default: 5
 *                 description: Number of relevant chunks to retrieve
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *                 description: LLM sampling temperature (higher = more creative)
 *               maxTokens:
 *                 type: number
 *                 minimum: 100
 *                 maximum: 2000
 *                 default: 800
 *                 description: Maximum tokens in response
 *               minRelevanceScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.35
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
    try {
        // Validate request body
        const params = chatSchema.parse(req.body);

        logger.info(`Chat question: "${params.question}" (party=${params.party || 'all'}, topK=${params.topK})`);

        // Process query through RAG pipeline
        const result = await ragPipeline.query(params.question, {
            topK: params.topK,
            filters: params.party ? { partyId: params.party } : undefined,
            temperature: params.temperature,
            maxTokens: params.maxTokens,
            minRelevanceScore: params.minRelevanceScore
        });

        logger.info(`Chat completed: ${result.sources.length} sources used, ${result.metadata.tokensUsed || 0} tokens`);

        res.json({
            answer: result.answer,
            sources: result.sources.map(source => ({
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
                processingTime: result.metadata.queryTime
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
    try {
        // Validate request body
        const params = chatSchema.parse(req.body);

        logger.info(`Chat stream question: "${params.question}"`);

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

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

            // Send sources event
            res.write(`data: ${JSON.stringify({
                type: 'sources',
                sources: result.sources.map(source => ({
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

            // Send completion event
            res.write(`data: ${JSON.stringify({
                type: 'done',
                metadata: {
                    model: result.metadata.model,
                    tokensUsed: result.metadata.tokensUsed || 0,
                    sourcesCount: result.sources.length,
                    processingTime: result.metadata.queryTime
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
