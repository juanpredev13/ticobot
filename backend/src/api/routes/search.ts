import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';
import { SemanticSearcher } from '../../rag/components/SemanticSearcher.js';
import { QueryEmbedder } from '../../rag/components/QueryEmbedder.js';
import { requireAuth, checkRateLimit } from '../middleware/auth.middleware.js';

const router: Router = Router();
const logger = new Logger('SearchAPI');

// Initialize components
const embedder = new QueryEmbedder();
const searcher = new SemanticSearcher();

// Validation schema
const searchSchema = z.object({
    query: z.string().min(1, 'Query cannot be empty').max(500, 'Query too long'),
    party: z.string().optional(),
    limit: z.coerce.number().min(1).max(20).default(5),
    minScore: z.coerce.number().min(0).max(1).default(0.35)
});

/**
 * @swagger
 * /api/search:
 *   post:
 *     summary: Perform semantic search on government plan documents
 *     description: Search through indexed government plans using semantic similarity
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Search query text
 *                 example: propuestas sobre salud pública
 *               party:
 *                 type: string
 *                 description: Filter by political party ID
 *                 example: pln
 *               limit:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 5
 *                 description: Maximum number of results
 *               minScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.35
 *                 description: Minimum similarity score threshold
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchResult'
 *                 count:
 *                   type: number
 *                 stats:
 *                   type: object
 *                   properties:
 *                     avgScore:
 *                       type: number
 *                     maxScore:
 *                       type: number
 *                     minScore:
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
router.post('/', requireAuth, checkRateLimit, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate request body
        const params = searchSchema.parse(req.body);

        logger.info(`Search query: "${params.query}" (party=${params.party || 'all'}, limit=${params.limit}, minScore=${params.minScore})`);

        // Generate embedding for the query
        const embedding = await embedder.embed(params.query);

        if (!embedding || embedding.length === 0) {
            logger.error('Failed to generate embedding for query');
            return res.status(500).json({
                error: 'Failed to process search query',
                message: 'Could not generate embedding'
            });
        }

        logger.info(`Generated embedding: ${embedding.length} dimensions`);

        // Perform semantic search
        const filters = params.party ? { partyId: params.party } : undefined;
        const results = params.minScore > 0
            ? await searcher.searchWithThreshold(embedding, params.limit, params.minScore, filters)
            : await searcher.search(embedding, params.limit, filters);

        logger.info(`Search completed: ${results.length} results found`);

        // Calculate statistics
        const stats = results.length > 0 ? {
            avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
            maxScore: Math.max(...results.map(r => r.score)),
            minScore: Math.min(...results.map(r => r.score))
        } : null;

        res.json({
            query: params.query,
            results: results.map(result => ({
                id: result.document.id,
                content: result.document.content,
                score: result.score,
                metadata: result.document.metadata,
                // Include page information if available
                page: result.document.metadata?.pageNumber ||
                      (result.document.metadata?.pageRange ?
                        `${result.document.metadata.pageRange.start}-${result.document.metadata.pageRange.end}` :
                        null)
            })),
            count: results.length,
            stats,
            filters: {
                party: params.party || null,
                minScore: params.minScore
            }
        });

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

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Perform semantic search using query parameters
 *     description: Alternative GET endpoint for simple search requests
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *         description: Search query text
 *         example: educación superior
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by political party ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Maximum number of results
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.35
 *         description: Minimum similarity score
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchResult'
 *                 count:
 *                   type: number
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, checkRateLimit, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Map query params to search schema
        const params = searchSchema.parse({
            query: req.query.q,
            party: req.query.party,
            limit: req.query.limit,
            minScore: req.query.minScore
        });

        logger.info(`Search query (GET): "${params.query}" (party=${params.party || 'all'}, limit=${params.limit})`);

        // Generate embedding for the query
        const embedding = await embedder.embed(params.query);

        if (!embedding || embedding.length === 0) {
            logger.error('Failed to generate embedding for query');
            return res.status(500).json({
                error: 'Failed to process search query',
                message: 'Could not generate embedding'
            });
        }

        // Perform semantic search
        const filters = params.party ? { partyId: params.party } : undefined;
        const results = params.minScore > 0
            ? await searcher.searchWithThreshold(embedding, params.limit, params.minScore, filters)
            : await searcher.search(embedding, params.limit, filters);

        logger.info(`Search completed: ${results.length} results found`);

        // Calculate statistics
        const stats = results.length > 0 ? {
            avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
            maxScore: Math.max(...results.map(r => r.score)),
            minScore: Math.min(...results.map(r => r.score))
        } : null;

        res.json({
            query: params.query,
            results: results.map(result => ({
                id: result.document.id,
                content: result.document.content,
                score: result.score,
                metadata: result.document.metadata,
                page: result.document.metadata?.pageNumber ||
                      (result.document.metadata?.pageRange ?
                        `${result.document.metadata.pageRange.start}-${result.document.metadata.pageRange.end}` :
                        null)
            })),
            count: results.length,
            stats,
            filters: {
                party: params.party || null,
                minScore: params.minScore
            }
        });

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
