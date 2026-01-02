#!/usr/bin/env tsx

/**
 * Re-ingest Top 5 Parties with Maximum Quality
 *
 * This script re-ingests ONLY the top 5 parties with optimized parameters
 * for maximum quality:
 * - PLN, PUSC, CAC, FA, Pueblo Soberano
 * - Larger chunks for better context
 * - Higher overlap for better coherence
 * - Best embedding model
 *
 * Usage:
 *   tsx backend/scripts/reingest-top5-quality.ts
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

const logger = new Logger('ReingestTop5Quality');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Top 5 parties to ingest (by slug)
const TOP_5_PARTY_SLUGS = [
    'liberacion-nacional', // PLN slug
    'pusc', // or 'unidad-social-cristiana'
    'cac', // or 'coalicion-agenda-ciudadana'
    'fa', // or 'frente-amplio'
    'pueblo-soberano'
];

// Map party slugs to possible variations in TSE_PLANS
const SLUG_VARIATIONS: Record<string, string[]> = {
    'liberacion-nacional': ['pln', 'liberacion-nacional'], // PLN: busca por 'pln' en documentId pero slug es 'liberacion-nacional'
    'pusc': ['pusc', 'unidad-social-cristiana'],
    'cac': ['cac', 'coalicion-agenda-ciudadana'],
    'fa': ['fa', 'frente-amplio'],
    'pueblo-soberano': ['pueblo-soberano', 'ppso'] // PPSO es la abreviación en TSE
};

/**
 * Delete chunks and documents for top 5 parties only
 */
async function deleteTop5Data(): Promise<void> {
    logger.info('Deleting existing data for top 5 parties...');

    try {
        // Get party IDs for top 5
        const { data: parties, error: partiesError } = await supabase
            .from('parties')
            .select('id, slug')
            .in('slug', TOP_5_PARTY_SLUGS);

        if (partiesError) throw partiesError;

        if (!parties || parties.length === 0) {
            logger.warn('⚠️  No parties found with top 5 slugs');
            return;
        }

        const partyIds = parties.map(p => p.id);
        logger.info(`Found ${parties.length} parties to clean: ${parties.map(p => p.slug).join(', ')}`);

        // Get documents for these parties
        const { data: documents, error: docsError } = await supabase
            .from('documents')
            .select('id, document_id')
            .in('party_id', partyIds);

        if (docsError) throw docsError;

        if (documents && documents.length > 0) {
            const documentIds = documents.map(d => d.id);
            const documentIdsString = documents.map(d => d.document_id);

            logger.info(`  Found ${documents.length} documents to delete`);

            // Step 1: Delete chunks by document_id (UUID) - more reliable
            const { error: chunksError1 } = await supabase
                .from('chunks')
                .delete()
                .in('document_id', documentIds);

            if (chunksError1) {
                logger.warn(`  Warning deleting chunks by UUID: ${chunksError1.message}`);
            } else {
                logger.info(`  Deleted chunks by document_id (UUID)`);
            }

            // Step 2: Also delete chunks by document_id string (if stored in metadata)
            // This handles any edge cases where chunks might reference document_id as string
            for (const docId of documentIdsString) {
                const { error: chunksError2 } = await supabase
                    .from('chunks')
                    .delete()
                    .eq('metadata->>documentId', docId);

                if (chunksError2) {
                    logger.warn(`  Warning deleting chunks by metadata for ${docId}: ${chunksError2.message}`);
                }
            }

            // Step 3: Verify no chunks remain
            const { count: remainingChunks, error: countError } = await supabase
                .from('chunks')
                .select('*', { count: 'exact', head: true })
                .in('document_id', documentIds);

            if (!countError && remainingChunks && remainingChunks > 0) {
                logger.warn(`  ⚠️  Warning: ${remainingChunks} chunks still remain. Attempting force delete...`);
                
                // Force delete using raw SQL if needed
                const { error: forceDeleteError } = await supabase.rpc('exec_sql', {
                    sql: `DELETE FROM chunks WHERE document_id = ANY(ARRAY[${documentIds.map(id => `'${id}'`).join(',')}]::uuid[])`
                }).catch(() => {
                    // If RPC doesn't exist, try direct delete again
                    return supabase
                        .from('chunks')
                        .delete()
                        .in('document_id', documentIds);
                });

                if (forceDeleteError) {
                    logger.error(`  ❌ Failed to force delete chunks: ${forceDeleteError.message}`);
                }
            }

            // Step 4: Delete the documents
            const { error: deleteDocsError } = await supabase
                .from('documents')
                .delete()
                .in('id', documentIds);

            if (deleteDocsError) throw deleteDocsError;

            logger.info(`  ✅ Deleted ${documents.length} documents`);
        } else {
            logger.info('  No existing documents found for top 5 parties');
        }

        logger.info('✅ Cleanup complete');
    } catch (error) {
        logger.error('Failed to delete top 5 data:', error);
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
        return null;
    }
}

/**
 * Check if plan matches top 5 parties
 */
function isTop5Plan(plan: typeof TSE_PLANS[0]): boolean {
    const documentId = plan.documentId.toLowerCase();

    for (const [slug, variations] of Object.entries(SLUG_VARIATIONS)) {
        for (const variation of variations) {
            if (documentId.includes(variation)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Re-ingest a single document with quality settings
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

        // QUALITY OPTIMIZED SETTINGS
        const result = await pipeline.ingest(source, documentId, {
            downloadPath: path.join(process.cwd(), 'backend', 'downloads', 'pdfs'),
            generateEmbeddings: true,
            storeInVectorDB: true,
            chunkingOptions: {
                // Larger chunks for more context
                chunkSize: 600,        // Increased from 400
                maxChunkSize: 1200,    // Increased from 800
                // Higher overlap for better coherence
                overlapSize: 100,      // Increased from 50
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
        return { success: false, error: errorMessage };
    }
}

/**
 * Main execution
 */
async function main() {
    logger.info('🚀 Starting Top 5 Quality Re-ingestion');
    logger.info('='.repeat(60));
    logger.info('Parties: PLN, PUSC, CAC, FA, Pueblo Soberano');
    logger.info('Quality Settings:');
    logger.info('  - Chunk size: 600 tokens (increased context)');
    logger.info('  - Max chunk: 1200 tokens');
    logger.info('  - Overlap: 100 tokens (better coherence)');
    logger.info('='.repeat(60));

    // 1. Delete existing data for top 5
    await deleteTop5Data();

    // 2. Filter plans to only top 5
    const top5Plans = TSE_PLANS.filter(plan => isTop5Plan(plan));

    logger.info(`\nFound ${top5Plans.length} plans to ingest:`);
    top5Plans.forEach(plan => {
        logger.info(`  - ${plan.partyName} (${plan.documentId})`);
    });

    if (top5Plans.length === 0) {
        logger.error('❌ No plans found for top 5 parties!');
        logger.error('Check that TSE_PLANS contains entries for: pln, pusc, cac, fa, pueblo-soberano');
        process.exit(1);
    }

    // 3. Initialize pipeline
    const pipeline = new IngestPipeline();

    // 4. Ingest each plan
    let successCount = 0;
    let failureCount = 0;

    for (const plan of top5Plans) {
        const result = await reingestDocument(plan, pipeline);

        if (result.success) {
            successCount++;
        } else {
            failureCount++;
        }

        // Small delay between ingestions
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 5. Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 Re-ingestion Summary');
    logger.info('='.repeat(60));
    logger.info(`Total plans processed: ${top5Plans.length}`);
    logger.info(`✅ Successful: ${successCount}`);
    logger.info(`❌ Failed: ${failureCount}`);

    if (failureCount > 0) {
        logger.warn('\n⚠️  Some ingestions failed. Check logs above for details.');
    }

    logger.info('\n💡 Next Steps:');
    logger.info('1. Verify data with: pnpm tsx scripts/audit-database.ts');
    logger.info('2. Re-run pre-compute: pnpm tsx scripts/precompute-comparisons.ts');
    logger.info('');
}

try {
    await main();
} catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
}
