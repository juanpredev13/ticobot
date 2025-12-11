import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';
import { createSupabaseClient } from '../../db/supabase.js';
import { PartiesService } from '../../db/services/parties.service.js';
import { CandidatesService } from '../../db/services/candidates.service.js';

const router = Router();
const logger = new Logger('PartiesAPI');

// Initialize services
const supabase = createSupabaseClient();
const partiesService = new PartiesService(supabase);
const candidatesService = new CandidatesService(supabase);

// Validation schemas
const getPartyByIdSchema = z.object({
    id: z.string().uuid('Invalid party ID format')
});

const getPartyBySlugSchema = z.object({
    slug: z.string().min(1, 'Slug is required')
});

const listPartiesSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0)
});

/**
 * @swagger
 * /api/parties:
 *   get:
 *     summary: List all political parties
 *     description: Retrieve a paginated list of all political parties
 *     tags: [Parties]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         description: Pagination offset (number of items to skip)
 *     responses:
 *       200:
 *         description: List of parties with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Party'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     offset:
 *                       type: number
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = listPartiesSchema.parse(req.query);

        logger.info(`Listing parties: limit=${params.limit}, offset=${params.offset}`);

        const parties = await partiesService.findAll({
            limit: params.limit,
            offset: params.offset
        });

        const total = await partiesService.count();

        res.json({
            parties,
            pagination: {
                total,
                limit: params.limit,
                offset: params.offset,
                hasMore: (params.offset + params.limit) < total
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
 * /api/parties/slug/{slug}:
 *   get:
 *     summary: Get a specific party by slug
 *     description: Retrieve detailed information about a political party using its URL-friendly slug
 *     tags: [Parties]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Party slug (e.g., "pln", "pusc")
 *         example: pln
 *     responses:
 *       200:
 *         description: Party details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 party:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid slug format
 *       404:
 *         description: Party not found
 *       500:
 *         description: Server error
 */
router.get('/slug/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = getPartyBySlugSchema.parse(req.params);

        logger.info(`Fetching party by slug: ${slug}`);

        const party = await partiesService.findBySlug(slug);

        if (!party) {
            logger.warn(`Party not found: ${slug}`);
            return res.status(404).json({
                error: 'Party not found',
                slug
            });
        }

        res.json({ party });

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
 * /api/parties/{id}:
 *   get:
 *     summary: Get a specific party by ID
 *     description: Retrieve detailed information about a single political party
 *     tags: [Parties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Party UUID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Party details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 party:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid party ID format
 *       404:
 *         description: Party not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = getPartyByIdSchema.parse(req.params);

        logger.info(`Fetching party: ${id}`);

        const party = await partiesService.findById(id);

        if (!party) {
            logger.warn(`Party not found: ${id}`);
            return res.status(404).json({
                error: 'Party not found',
                id
            });
        }

        res.json({ party });

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
 * /api/parties/{id}/candidates:
 *   get:
 *     summary: Get all candidates for a specific party
 *     description: Retrieve all candidates (presidential and vice-presidential) for a political party
 *     tags: [Parties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Party UUID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: List of candidates for the party
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Candidate'
 *                 party:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid party ID format
 *       404:
 *         description: Party not found
 *       500:
 *         description: Server error
 */
router.get('/:id/candidates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = getPartyByIdSchema.parse(req.params);

        logger.info(`Fetching candidates for party: ${id}`);

        // Verify party exists
        const party = await partiesService.findById(id);
        if (!party) {
            logger.warn(`Party not found: ${id}`);
            return res.status(404).json({
                error: 'Party not found',
                id
            });
        }

        // Get candidates
        const candidates = await candidatesService.findByPartyId(id);

        res.json({
            party,
            candidates
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

