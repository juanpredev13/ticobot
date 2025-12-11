import { Router, Request, Response } from 'express';
import { IngestPipeline, IngestOptions } from '../../ingest/components/IngestPipeline.js';
import { Logger } from '@ticobot/shared';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router: Router = Router();
const logger = new Logger('IngestAPI');

/**
 * POST /api/ingest/ingest
 * Ingest a single PDF document
 *
 * Body:
 * {
 *   "url": "https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf",
 *   "documentId": "pln-2026",
 *   "options": {
 *     "generateEmbeddings": true,
 *     "storeInVectorDB": true
 *   }
 * }
 */
router.post('/ingest', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const { url, documentId, options } = req.body;

    if (!url || !documentId) {
        return res.status(400).json({
            error: 'Missing required fields: url, documentId'
        });
    }

    logger.info(`Ingestion request received for ${documentId}`);

    const pipeline = new IngestPipeline();

    try {
        const result = await pipeline.ingest(
            url,
            documentId,
            options as IngestOptions
        );

        logger.info(`Ingestion completed for ${documentId}: ${result.success ? 'success' : 'failed'}`);

        res.json(result);
    } catch (error) {
        logger.error(`Ingestion failed for ${documentId}`, error);

        res.status(500).json({
            error: error instanceof Error ? error.message : 'Ingestion failed'
        });
    } finally {
        pipeline.dispose();
    }
});

/**
 * POST /api/ingest/batch
 * Ingest multiple PDF documents
 *
 * Body:
 * {
 *   "documents": [
 *     {
 *       "url": "https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf",
 *       "documentId": "pln-2026"
 *     },
 *     {
 *       "url": "https://www.tse.go.cr/2026/docus/planesgobierno/PAC.pdf",
 *       "documentId": "pac-2026"
 *     }
 *   ],
 *   "options": {
 *     "generateEmbeddings": true,
 *     "storeInVectorDB": true
 *   }
 * }
 */
router.post('/batch', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const { documents, options } = req.body;

    if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({
            error: 'Missing required field: documents (array)'
        });
    }

    logger.info(`Batch ingestion request received for ${documents.length} documents`);

    const pipeline = new IngestPipeline();

    try {
        const results = await pipeline.ingestBatch(
            documents,
            options as IngestOptions
        );

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        logger.info(`Batch ingestion completed: ${successful} successful, ${failed} failed`);

        res.json({
            total: results.length,
            successful,
            failed,
            results
        });
    } catch (error) {
        logger.error('Batch ingestion failed', error);

        res.status(500).json({
            error: error instanceof Error ? error.message : 'Batch ingestion failed'
        });
    } finally {
        pipeline.dispose();
    }
});

/**
 * GET /api/ingest/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'ingestion-pipeline',
        timestamp: new Date().toISOString()
    });
});

export default router;
