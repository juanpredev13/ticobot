import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';
import { createSupabaseClient } from '../../db/supabase.js';
import { CandidatesService } from '../../db/services/candidates.service.js';
import { PartiesService } from '../../db/services/parties.service.js';

const router = Router();
const logger = new Logger('CandidatesAPI');

// Initialize services
const supabase = createSupabaseClient();
const candidatesService = new CandidatesService(supabase);
const partiesService = new PartiesService(supabase);

// Validation schemas
const getCandidateByIdSchema = z.object({
    id: z.string().uuid('Invalid candidate ID format')
});

const getCandidateBySlugSchema = z.object({
    slug: z.string().min(1, 'Slug is required')
});

const listCandidatesSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
    party_id: z.string().uuid('Invalid party ID format').optional(),
    position: z.string().optional()
});

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: List all candidates
 *     description: Retrieve a paginated list of candidates with optional filtering by party or position
 *     tags: [Candidates]
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
 *       - in: query
 *         name: party_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by party UUID
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position (e.g., "Presidente", "Vicepresidente")
 *         example: Presidente
 *     responses:
 *       200:
 *         description: List of candidates with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Candidate'
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
        const params = listCandidatesSchema.parse(req.query);

        logger.info(`Listing candidates: limit=${params.limit}, offset=${params.offset}, party_id=${params.party_id || 'all'}, position=${params.position || 'all'}`);

        const candidates = await candidatesService.findAll({
            limit: params.limit,
            offset: params.offset,
            party_id: params.party_id,
            position: params.position
        });

        const total = await candidatesService.count({
            party_id: params.party_id,
            position: params.position
        });

        res.json({
            candidates,
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
 * /api/candidates/slug/{slug}:
 *   get:
 *     summary: Get a specific candidate by slug
 *     description: Retrieve detailed information about a candidate using its URL-friendly slug
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate slug (e.g., "jose-maria-figueres")
 *         example: jose-maria-figueres
 *     responses:
 *       200:
 *         description: Candidate details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidate:
 *                   $ref: '#/components/schemas/Candidate'
 *                 party:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid slug format
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
router.get('/slug/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = getCandidateBySlugSchema.parse(req.params);

        logger.info(`Fetching candidate by slug: ${slug}`);

        const candidate = await candidatesService.findBySlug(slug);

        if (!candidate) {
            logger.warn(`Candidate not found: ${slug}`);
            return res.status(404).json({
                error: 'Candidate not found',
                slug
            });
        }

        // Also fetch party information
        const party = await partiesService.findById(candidate.party_id);

        res.json({
            candidate,
            party: party || null
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
 * /api/candidates/{id}:
 *   get:
 *     summary: Get a specific candidate by ID
 *     description: Retrieve detailed information about a single candidate
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Candidate UUID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Candidate details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidate:
 *                   $ref: '#/components/schemas/Candidate'
 *                 party:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid candidate ID format
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = getCandidateByIdSchema.parse(req.params);

        logger.info(`Fetching candidate: ${id}`);

        const candidate = await candidatesService.findById(id);

        if (!candidate) {
            logger.warn(`Candidate not found: ${id}`);
            return res.status(404).json({
                error: 'Candidate not found',
                id
            });
        }

        // Also fetch party information
        const party = await partiesService.findById(candidate.party_id);

        res.json({
            candidate,
            party: party || null
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

