import { Router, Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';

const router: Router = Router();
const logger = new Logger('DocumentsAPI');

// Official TSE URLs mapping
const TSE_URLS: Record<string, string> = {
  'PLN': 'https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf',
  'PAC': 'https://www.tse.go.cr/2026/docus/planesgobierno/PA.pdf',
  'PUSC': 'https://www.tse.go.cr/2026/docus/planesgobierno/PUSC.pdf',
  'FA': 'https://www.tse.go.cr/2026/docus/planesgobierno/FA.pdf',
  'PPSO': 'https://www.tse.go.cr/2026/docus/planesgobierno/PPSO.pdf',
  'PIN': 'https://www.tse.go.cr/2026/docus/planesgobierno/PIN.pdf',
  'PLP': 'https://www.tse.go.cr/2026/docus/planesgobierno/PLP.pdf',
  'PNR': 'https://www.tse.go.cr/2026/docus/planesgobierno/PNR.pdf',
  'PSD': 'https://www.tse.go.cr/2026/docus/planesgobierno/PSD.pdf',
  'UP': 'https://www.tse.go.cr/2026/docus/planesgobierno/UP.pdf',
  'PUCD': 'https://www.tse.go.cr/2026/docus/planesgobierno/PUCD.pdf',
  'PNG': 'https://www.tse.go.cr/2026/docus/planesgobierno/PNG.pdf',
  'CDS': 'https://www.tse.go.cr/2026/docus/planesgobierno/CDS.pdf',
  'CAC': 'https://www.tse.go.cr/2026/docus/planesgobierno/CAC.pdf',
  'PDLCT': 'https://www.tse.go.cr/2026/docus/planesgobierno/PDLCT.pdf',
  'PEN': 'https://www.tse.go.cr/2026/docus/planesgobierno/PEN.pdf',
  'PEL': 'https://www.tse.go.cr/2026/docus/planesgobierno/PEL.pdf',
  'PJSC': 'https://www.tse.go.cr/2026/docus/planesgobierno/PJSC.pdf',
  'ACRM': 'https://www.tse.go.cr/2026/docus/planesgobierno/ACRM.pdf',
  'CR1': 'https://www.tse.go.cr/2026/docus/planesgobierno/CR1.pdf'
};

// Lazy initialization - only create client when needed
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for documents API');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

// Validation schemas
const getDocumentSchema = z.object({
    id: z.string().uuid('Invalid document ID format')
});

const listDocumentsSchema = z.object({
    party: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0)
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List all government plan documents
 *     description: Retrieve a paginated list of indexed government plan documents with optional party filtering
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by political party ID
 *         example: pln
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 20
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
 *         description: List of documents with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
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
        // Validate query parameters
        const params = listDocumentsSchema.parse(req.query);

        logger.info(`Listing documents: party=${params.party || 'all'}, limit=${params.limit}, offset=${params.offset}`);

        // Build query - first get documents, then enrich with party info
        // Note: We can't use JOIN directly because some documents have party_id as TEXT (abbreviation)
        // instead of UUID, so we'll fetch parties separately and merge
        let query = getSupabase()
            .from('documents')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(params.offset, params.offset + params.limit - 1);

        // Apply party filter if provided
        if (params.party) {
            query = query.eq('metadata->>partyId', params.party);
        }

        const { data, error, count } = await query;

        if (error) {
            logger.error('Failed to fetch documents:', error);
            return res.status(500).json({
                error: 'Failed to fetch documents',
                message: error.message
            });
        }

        logger.info(`Found ${data?.length || 0} documents (total: ${count || 0})`);

        // Fetch all parties to build a lookup map
        const { data: partiesData } = await getSupabase()
            .from('parties')
            .select('id, name, abbreviation, slug');

        const partiesMap = new Map<string, any>();
        partiesData?.forEach((party: any) => {
            partiesMap.set(party.id, party);
        });

// Transform documents to include party abbreviation and official TSE URL
        const documents = (data || []).map((doc: any) => {
            // Check if party_id is a UUID (length 36 with dashes) or a string abbreviation
            const isUUID = typeof doc.party_id === 'string' && 
                          doc.party_id.length === 36 && 
                          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc.party_id);
             
            let party = null;
            let partyAbbreviation: string;
            let partySlug: string | null = null;
            let tseUrl: string | null = null;

            if (isUUID) {
                // party_id is a UUID, look it up in parties table
                party = partiesMap.get(doc.party_id);
                partyAbbreviation = party?.abbreviation || 'N/A';
                partySlug = party?.slug || null;
            } else {
                // party_id is a string abbreviation (like "PPSO", "PLN")
                partyAbbreviation = doc.party_id;
                // Try to find party by abbreviation
                party = Array.from(partiesMap.values()).find((p: any) => 
                    p.abbreviation?.toUpperCase() === doc.party_id.toUpperCase()
                );
                if (party) {
                    partySlug = party.slug;
                }
            }

            // Get official TSE URL using party abbreviation
            const partyKey = partyAbbreviation.toUpperCase();
            tseUrl = TSE_URLS[partyKey] || null;

            return {
                ...doc,
                party_abbreviation: partyAbbreviation,
                party_slug: partySlug,
                url: tseUrl || doc.url, // Use TSE URL if available, fallback to existing URL
            };
        });

        res.json({
            documents,
            pagination: {
                total: count || 0,
                limit: params.limit,
                offset: params.offset,
                hasMore: (params.offset + params.limit) < (count || 0)
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
 * /api/documents/{id}:
 *   get:
 *     summary: Get a specific document by ID
 *     description: Retrieve detailed information about a single government plan document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document UUID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: Invalid document ID format
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate ID parameter
        const { id } = getDocumentSchema.parse(req.params);

        logger.info(`Fetching document: ${id}`);

        const { data, error } = await getSupabase()
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                logger.warn(`Document not found: ${id}`);
                return res.status(404).json({
                    error: 'Document not found',
                    id
                });
            }

            logger.error('Failed to fetch document:', error);
            return res.status(500).json({
                error: 'Failed to fetch document',
                message: error.message
            });
        }

        logger.info(`Document found: ${data.document_id}`);

        res.json({
            document: data
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
 * /api/documents/{id}/chunks:
 *   get:
 *     summary: Get all chunks for a specific document
 *     description: Retrieve paginated text chunks from a government plan document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document UUID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 200
 *           default: 50
 *         description: Maximum number of chunks per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of document chunks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chunks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       chunk_index:
 *                         type: number
 *                       metadata:
 *                         type: object
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
router.get('/:id/chunks', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate ID parameter
        const { id } = getDocumentSchema.parse(req.params);
        const params = z.object({
            limit: z.coerce.number().min(1).max(200).default(50),
            offset: z.coerce.number().min(0).default(0)
        }).parse(req.query);

        logger.info(`Fetching chunks for document: ${id} (limit=${params.limit}, offset=${params.offset})`);

        const { data, error, count } = await getSupabase()
            .from('chunks')
            .select('*', { count: 'exact' })
            .eq('document_id', id)
            .order('chunk_index', { ascending: true })
            .range(params.offset, params.offset + params.limit - 1);

        if (error) {
            logger.error('Failed to fetch chunks:', error);
            return res.status(500).json({
                error: 'Failed to fetch chunks',
                message: error.message
            });
        }

        logger.info(`Found ${data?.length || 0} chunks (total: ${count || 0})`);

        res.json({
            chunks: data || [],
            pagination: {
                total: count || 0,
                limit: params.limit,
                offset: params.offset,
                hasMore: (params.offset + params.limit) < (count || 0)
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
