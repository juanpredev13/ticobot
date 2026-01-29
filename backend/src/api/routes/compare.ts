import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';
import { RAGPipeline } from '../../rag/components/RAGPipeline.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { createSupabaseClient } from '../../db/supabase.js';
import { PartiesService } from '../../db/services/parties.service.js';
import { ComparisonsCacheService } from '../../db/services/comparisons-cache.service.js';

const router: Router = Router();
const logger = new Logger('CompareAPI');

// Initialize RAG pipeline
const ragPipeline = new RAGPipeline({
    maxContextLength: 6000 // ~1.5k tokens per party (allows 2 chunks per party)
});

/**
 * Map party abbreviations to document party_ids
 * Some parties have different IDs in the documents table than their abbreviations
 */
const ABBREVIATION_TO_DOCUMENT_ID: Record<string, string> = {
    'PS': 'PPSO',      // Pueblo Soberano
    'AVAN': 'PA',      // Avanza (Partido Avanza)
    'CRM': 'ACRM',     // Aquí Costa Rica Manda
    'CT': 'PDLCT',     // De la Clase Trabajadora
    'EN': 'PEN',       // Esperanza Nacional
    'EL': 'PEL',       // Esperanza y Libertad
    'IN': 'PIN',       // Integración Nacional
    'JSC': 'PJSC',     // Justicia Social Costarricense
    'LP': 'PLP',       // Liberal Progresista
    'NG': 'PNG',       // Nueva Generación
    'NR': 'PNR',       // Nueva República
    'UCD': 'PUCD',     // Unión Costarricense Democrática
    // These already match:
    'CAC': 'CAC',      // Coalición Agenda Ciudadana
    'CDS': 'CDS',      // Centro Democrático y Social
    'CR1': 'CR1',      // Costa Rica Primero
    'FA': 'FA',        // Frente Amplio
    'PLN': 'PLN',      // Partido Liberación Nacional
    'PSD': 'PSD',      // Progreso Social Democrático
    'PUSC': 'PUSC',    // Unidad Social Cristiana
    'UP': 'UP',        // Unidos Podemos
};

// Proposal state enum
export enum ProposalState {
    COMPLETA = 'completa',
    PARCIAL = 'parcial',
    POCO_CLARA = 'poco_clara',
    SIN_INFORMACION = 'sin_informacion'
}

/**
 * Determine proposal state based on answer quality and sources
 */
function determineProposalState(
    answer: string,
    sourcesCount: number,
    confidence: number
): ProposalState {
    // No information
    if (sourcesCount === 0 || confidence < 0.2) {
        return ProposalState.SIN_INFORMACION;
    }

    // Check for uncertainty phrases
    const uncertaintyPhrases = [
        'no tengo suficiente información',
        'no hay información',
        'no puedo determinar',
        'no se especifica',
        'no está claro',
        'I don\'t have enough information',
        'there is no information',
        'I cannot determine',
        'not specified',
        'unclear'
    ];

    const hasUncertainty = uncertaintyPhrases.some(phrase =>
        answer.toLowerCase().includes(phrase)
    );

    if (hasUncertainty || confidence < 0.4) {
        return ProposalState.POCO_CLARA;
    }

    // Check answer length and detail
    const isDetailed = answer.length > 200 && sourcesCount >= 2;
    const isModerate = answer.length > 100 && sourcesCount >= 1;

    if (isDetailed && confidence >= 0.7) {
        return ProposalState.COMPLETA;
    }

    if (isModerate && confidence >= 0.5) {
        return ProposalState.PARCIAL;
    }

    // Default to poco clara if we have some info but it's not clear
    return ProposalState.POCO_CLARA;
}

// Validation schema
const compareSchema = z.object({
    topic: z.string().min(1, 'Topic cannot be empty').max(500, 'Topic too long'),
    partyIds: z.array(z.string()).min(1, 'At least one party required').max(5, 'Maximum 5 parties allowed'),
    topKPerParty: z.coerce.number().min(1).max(10).default(3),
    temperature: z.coerce.number().min(0).max(2).default(0.7),
});

/**
 * @swagger
 * /api/compare:
 *   post:
 *     summary: Compare proposals between multiple parties on a specific topic
 *     description: Get side-by-side comparison of proposals from different political parties using RAG
 *     tags: [Compare]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - partyIds
 *             properties:
 *               topic:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Topic or question to compare
 *                 example: ¿Qué proponen sobre educación superior?
 *               partyIds:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                 description: Array of party IDs to compare (max 5)
 *                 example: ["pln", "pac", "fa"]
 *               topKPerParty:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 3
 *                 description: Number of relevant chunks to retrieve per party
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *                 description: LLM sampling temperature
 *     responses:
 *       200:
 *         description: Comparison results with proposal states
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topic:
 *                   type: string
 *                 comparisons:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       party:
 *                         type: string
 *                       partyName:
 *                         type: string
 *                       answer:
 *                         type: string
 *                       state:
 *                         type: string
 *                         enum: [completa, parcial, poco_clara, sin_informacion]
 *                       confidence:
 *                         type: number
 *                       sources:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             content:
 *                               type: string
 *                             relevance:
 *                               type: number
 *                             pageNumber:
 *                               type: number
 *                             documentId:
 *                               type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const params = compareSchema.parse(req.body);

        logger.info(`Comparing ${params.partyIds.length} parties on topic: "${params.topic}"`);

        // Initialize services
        const supabase = createSupabaseClient();
        const cacheService = new ComparisonsCacheService(supabase);
        const partiesService = new PartiesService(supabase);

        // Check cache FIRST - this avoids ALL embeddings and LLM calls
        logger.info(`🔍 Checking cache for topic: "${params.topic}" with parties: [${params.partyIds.join(', ')}]`);
        const cached = await cacheService.getCached(params.topic, params.partyIds);
        if (cached) {
            logger.info(`✅ Cache HIT - Skipping embeddings & LLM calls for topic: "${params.topic}"`);
            
            const partyDetailsMap = await buildPartyDetailsMap(params.partyIds, partiesService);
            const enrichedComparisons = enrichCachedComparisons(cached.comparisons, partyDetailsMap);
            const processingTime = Date.now() - startTime;
            
            logger.info(`Cache served in ${processingTime}ms (saved ~30-40s of RAG processing)`);

            return res.json({
                topic: params.topic,
                comparisons: enrichedComparisons,
                metadata: {
                    totalParties: enrichedComparisons.length,
                    timestamp: new Date().toISOString(),
                    cached: true,
                    processingTime,
                }
            });
        }

        logger.info(`❌ Cache MISS - Will generate embeddings & use LLM for topic: "${params.topic}"`);

        // Build party mapping for RAG processing
        const { partyDetailsMap } = await buildPartyMappingForRAG(
            params.partyIds,
            partiesService
        );

        // Use RAG pipeline to compare parties with slugs (will be resolved to UUIDs internally)
        // Pass slugs directly so compareParties can resolve them to UUIDs
        const partySlugs = params.partyIds.map(id => id.toLowerCase());
        const result = await ragPipeline.compareParties(
            params.topic,
            partySlugs,
            {
                topKPerParty: params.topKPerParty,
                temperature: params.temperature
            }
        );

        // Enrich with proposal states and additional metadata
        const enrichedComparisons = enrichRAGComparisons(result.comparisons, partyDetailsMap);

        const processingTime = Date.now() - startTime;
        logger.info(`Comparison completed: ${enrichedComparisons.length} parties compared in ${processingTime}ms`);

        // Only cache if ALL parties have information (no "sin_informacion" results)
        const hasNoInfoResults = enrichedComparisons.some(c => c.state === ProposalState.SIN_INFORMACION);

        if (hasNoInfoResults) {
            logger.info(`⚠️ Skipping cache - ${enrichedComparisons.filter(c => c.state === ProposalState.SIN_INFORMACION).length} parties have no information`);
        } else {
            // Store in cache (async, don't wait)
            cacheService.setCached(
                params.topic,
                params.partyIds,
                enrichedComparisons.map(c => ({
                    party: c.party,
                    answer: c.answer,
                    state: c.state,
                    stateLabel: c.stateLabel,
                    confidence: c.confidence,
                    sources: c.sources,
                })),
                {
                    processingTime,
                    // Cache never expires (expiresInHours not set = null = never expires)
                }
            ).catch(err => {
                logger.warn('Failed to cache comparison result:', err);
            });
            logger.info(`✅ Cached comparison result for topic: "${params.topic}"`);
        }

        res.json({
            topic: result.question,
            comparisons: enrichedComparisons,
            metadata: {
                totalParties: enrichedComparisons.length,
                timestamp: new Date().toISOString(),
                cached: false,
                processingTime,
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }

        logger.error('Compare error:', error);
        next(error);
    }
});

/**
 * Get human-readable label for proposal state
 */
function getStateLabel(state: ProposalState): string {
    const labels: Record<ProposalState, string> = {
        [ProposalState.COMPLETA]: 'Completa',
        [ProposalState.PARCIAL]: 'Parcial',
        [ProposalState.POCO_CLARA]: 'Poco clara',
        [ProposalState.SIN_INFORMACION]: 'Sin información'
    };
    return labels[state];
}

/**
 * Build party details map from party IDs
 */
async function buildPartyDetailsMap(
    partyIds: string[],
    partiesService: PartiesService
): Promise<Map<string, { name: string; abbreviation: string; slug: string }>> {
    const partyDetailsMap = new Map<string, { name: string; abbreviation: string; slug: string }>();
    
    for (const partyId of partyIds) {
        try {
            const party = await partiesService.findBySlug(partyId.toLowerCase());
            if (party) {
                partyDetailsMap.set(partyId.toLowerCase(), {
                    name: party.name,
                    abbreviation: party.abbreviation || partyId.toUpperCase(),
                    slug: partyId.toLowerCase()
                });
            } else {
                partyDetailsMap.set(partyId.toLowerCase(), {
                    name: partyId.toUpperCase(),
                    abbreviation: partyId.toUpperCase(),
                    slug: partyId.toLowerCase()
                });
            }
        } catch (error) {
            logger.warn(`Could not fetch party details for ${partyId}:`, error);
            partyDetailsMap.set(partyId.toLowerCase(), {
                name: partyId.toUpperCase(),
                abbreviation: partyId.toUpperCase(),
                slug: partyId.toLowerCase()
            });
        }
    }
    
    return partyDetailsMap;
}

/**
 * Build party details map for RAG processing
 * Returns map keyed by slug for easy lookup
 */
async function buildPartyMappingForRAG(
    partyIds: string[],
    partiesService: PartiesService
): Promise<{
    partyDetailsMap: Map<string, { name: string; abbreviation: string; slug: string }>;
}> {
    const partyDetailsMap = new Map<string, { name: string; abbreviation: string; slug: string }>();

    for (const partyId of partyIds) {
        const slug = partyId.toLowerCase();
        try {
            const party = await partiesService.findBySlug(slug);
            if (party) {
                partyDetailsMap.set(slug, {
                    name: party.name,
                    abbreviation: party.abbreviation || partyId.toUpperCase(),
                    slug: slug
                });
            } else {
                // Fallback if party not found
                partyDetailsMap.set(slug, {
                    name: partyId.toUpperCase(),
                    abbreviation: partyId.toUpperCase(),
                    slug: slug
                });
            }
        } catch (error) {
            logger.warn(`Could not fetch party details for ${partyId}:`, error);
            partyDetailsMap.set(slug, {
                name: partyId.toUpperCase(),
                abbreviation: partyId.toUpperCase(),
                slug: slug
            });
        }
    }

    return { partyDetailsMap };
}

/**
 * Enrich cached comparisons with party names
 */
function enrichCachedComparisons(
    cachedComparisons: any[],
    partyDetailsMap: Map<string, { name: string; abbreviation: string; slug: string }>
) {
    return cachedComparisons.map((comparison: any) => {
        const partyDetails = partyDetailsMap.get(comparison.party.toLowerCase()) || {
            name: comparison.party.toUpperCase(),
            abbreviation: comparison.party.toUpperCase(),
            slug: comparison.party.toLowerCase()
        };

        return {
            ...comparison,
            partyName: partyDetails.name,
            partyAbbreviation: partyDetails.abbreviation,
        };
    });
}

/**
 * Enrich RAG comparisons with states and party details
 */
function enrichRAGComparisons(
    comparisons: Array<{
        party: string;
        answer: string;
        sources: any[];
        confidence: number;
    }>,
    partyDetailsMap: Map<string, { name: string; abbreviation: string; slug: string }>
) {
    return comparisons.map((comparison) => {
        const state = determineProposalState(
            comparison.answer,
            comparison.sources.length,
            comparison.confidence
        );

        // comparison.party is now a slug (e.g., "pln")
        const partySlug = comparison.party.toLowerCase();
        const partyDetails = partyDetailsMap.get(partySlug) || {
            name: comparison.party.toUpperCase(),
            abbreviation: comparison.party.toUpperCase(),
            slug: partySlug
        };

        return {
            party: partyDetails.slug,
            partyName: partyDetails.name,
            partyAbbreviation: partyDetails.abbreviation,
            answer: comparison.answer,
            state,
            stateLabel: getStateLabel(state),
            confidence: comparison.confidence,
            sources: comparison.sources.map(source => ({
                content: source.content,
                relevance: source.relevance,
                pageNumber: 'pageNumber' in source ? source.pageNumber : undefined,
                pageRange: 'pageRange' in source ? source.pageRange : undefined,
                documentId: 'documentId' in source ? source.documentId : undefined,
                chunkId: 'chunkId' in source ? source.chunkId : undefined,
            }))
        };
    });
}

export default router;

