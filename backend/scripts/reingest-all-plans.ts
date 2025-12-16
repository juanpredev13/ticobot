#!/usr/bin/env tsx

/**
 * Re-ingest All Government Plans
 * 
 * This script performs a full re-ingestion of all government plan PDFs:
 * 1. Deletes all existing chunks and documents from the database
 * 2. Iterates through all TSE plans
 * 3. Ingests each PDF with quality scoring and keyword extraction
 * 
 * Usage:
 *   tsx backend/scripts/reingest-all-plans.ts
 * 
 * Environment Variables Required:
 *   - EMBEDDING_PROVIDER (default: 'openai')
 *   - OPENAI_API_KEY (if using OpenAI)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { IngestPipeline } from '../src/ingest/components/IngestPipeline.js';
import { TSE_PLANS } from '../scraped-plans.js';
import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import path from 'path';
import fs from 'fs/promises';

const logger = new Logger('ReingestAllPlans');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Delete all existing chunks and documents
 */
async function deleteAllChunksAndDocuments(): Promise<void> {
    logger.info('Deleting all existing chunks and documents...');

    try {
        // Delete all chunks (cascade will handle document deletion if needed)
        const { error: chunksError } = await supabase
            .from('chunks')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (chunksError) {
            throw chunksError;
        }

        // Delete all documents
        const { error: docsError } = await supabase
            .from('documents')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (docsError) {
            throw docsError;
        }

        logger.info('✅ All chunks and documents deleted');
    } catch (error) {
        logger.error('Failed to delete existing data:', error);
        throw error;
    }
}

/**
 * Check if local PDF exists
 */
async function checkLocalPDF(documentId: string): Promise<string | null> {
    const localPdfPath = path.join(
        process.cwd(),
        'backend',
        'downloads',
        'pdfs',
        `${documentId}.pdf`
    );

    try {
        await fs.access(localPdfPath);
        return localPdfPath;
    } catch {
        // Also check for special case: unknown-2026 -> cr1-2026.pdf
        if (documentId === 'unknown-2026') {
            const cr1Path = path.join(
                process.cwd(),
                'backend',
                'downloads',
                'pdfs',
                'cr1-2026.pdf'
            );
            try {
                await fs.access(cr1Path);
                return cr1Path;
            } catch {
                return null;
            }
        }
        return null;
    }
}

/**
 * Re-ingest a single document
 */
async function reingestDocument(
    plan: typeof TSE_PLANS[0],
    pipeline: IngestPipeline
): Promise<{ success: boolean; error?: string }> {
    const { documentId, pdfUrl, partyName } = plan;

    logger.info(`[${partyName}] Processing: ${documentId}`);

    try {
        // Check for local PDF first
        const localPdfPath = await checkLocalPDF(documentId);
        
        if (localPdfPath) {
            logger.info(`[${partyName}] Using local PDF: ${localPdfPath}`);
        }

        // Use local PDF path if available, otherwise use URL
        const source = localPdfPath || pdfUrl;

        const result = await pipeline.ingest(source, documentId, {
            downloadPath: path.join(process.cwd(), 'backend', 'downloads', 'pdfs'),
            generateEmbeddings: true,
            storeInVectorDB: true,
            chunkingOptions: {
                chunkSize: 400,
                maxChunkSize: 800,
                overlapSize: 50,
            },
        });

        if (result.success) {
            logger.info(
                `[${partyName}] ✅ Success - ${result.chunks?.length || 0} chunks created ` +
                `(${result.stats.totalTime}ms)`
            );
            return { success: true };
        } else {
            logger.error(`[${partyName}] ❌ Failed: ${result.error}`);
            return { success: false, error: result.error };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`[${partyName}] ❌ Error: ${errorMessage}`);
        if (error instanceof Error && error.stack) {
            logger.error(`[${partyName}] Stack trace: ${error.stack}`);
        }
        return { success: false, error: errorMessage };
    }
}

/**
 * Main re-ingestion function
 */
async function reingestAllPlans(): Promise<void> {
    const startTime = Date.now();
    logger.info('🚀 Starting full re-ingestion of all government plans');
    logger.info(`📋 Total plans to process: ${TSE_PLANS.length}`);

    // Step 1: Delete existing data
    try {
        await deleteAllChunksAndDocuments();
    } catch (error) {
        logger.error('Failed to delete existing data. Aborting re-ingestion.');
        process.exit(1);
    }

    // Step 2: Initialize ingestion pipeline
    const pipeline = new IngestPipeline();

    // Step 3: Process each plan
    const results: Array<{ plan: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < TSE_PLANS.length; i++) {
        const plan = TSE_PLANS[i];
        logger.info(`[${i + 1}/${TSE_PLANS.length}] Processing: ${plan.partyName} (${plan.documentId})`);

        const result = await reingestDocument(plan, pipeline);
        results.push({
            plan: plan.partyName,
            success: result.success,
            error: result.error,
        });

        // Add delay between documents to avoid rate limiting
        if (i < TSE_PLANS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Step 4: Summary
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('\n' + '='.repeat(60));
    logger.info('📊 RE-INGESTION SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`✅ Successful: ${successCount}/${TSE_PLANS.length}`);
    logger.info(`❌ Failed: ${failureCount}/${TSE_PLANS.length}`);
    logger.info(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);

    if (failureCount > 0) {
        logger.info('\n❌ Failed plans:');
        results
            .filter(r => !r.success)
            .forEach(r => {
                logger.info(`  - ${r.plan}: ${r.error || 'Unknown error'}`);
            });
    }

    logger.info('='.repeat(60));

    // Cleanup
    pipeline.dispose();

    // Exit with error code if any failed
    if (failureCount > 0) {
        process.exit(1);
    }
}

/**
 * Main entry point
 */
async function main() {
    try {
        await reingestAllPlans();
        logger.info('✅ Re-ingestion completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Re-ingestion failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

