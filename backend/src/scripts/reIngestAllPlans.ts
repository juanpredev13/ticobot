/**
 * Re-ingest all TSE 2026 Government Plans with improved pipeline
 *
 * This script re-processes all documents with:
 * - Enhanced text cleaning (page markers, encoding fixes)
 * - Optimized chunk sizes (400-600 tokens)
 * - Page metadata enrichment
 *
 * IMPORTANT: This will replace existing chunks in the database
 */

import { IngestPipeline } from '../ingest/components/IngestPipeline.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const TSE_PLANS = [
  {
    documentId: 'pln-2026',
    partyName: 'Partido Liberación Nacional',
    partyId: 'PLN',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf'
  },
  {
    documentId: 'pac-2026',
    partyName: 'Partido Acción Ciudadana',
    partyId: 'PAC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PAC.pdf'
  },
  {
    documentId: 'pusc-2026',
    partyName: 'Partido Unidad Social Cristiana',
    partyId: 'PUSC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PUSC.pdf'
  },
  {
    documentId: 'prsc-2026',
    partyName: 'Partido Restauración Social Cristiana',
    partyId: 'PRSC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PRSC.pdf'
  },
  {
    documentId: 'pfa-2026',
    partyName: 'Partido Frente Amplio',
    partyId: 'PFA',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PFA.pdf'
  },
];

async function confirmReingest(): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('\n⚠️  This will DELETE and REPLACE all existing chunks. Continue? (yes/no): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

async function clearExistingChunks(documentId: string) {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`   🗑️  Deleting existing chunks for ${documentId}...`);

    // First, get the document UUID
    const { data: docs, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('document_id', documentId)
        .single();

    if (docError || !docs) {
        console.log(`   ℹ️  No existing document found (this is OK for first ingestion)`);
        return;
    }

    const documentUuid = docs.id;

    // Delete chunks for this document UUID
    const { error: deleteError } = await supabase
        .from('chunks')
        .delete()
        .eq('document_id', documentUuid);

    if (deleteError) {
        console.log(`   ⚠️  Warning: Could not delete chunks: ${deleteError.message}`);
    } else {
        console.log(`   ✅ Existing chunks deleted`);
    }
}

async function main() {
    console.log('🔄 Re-ingesting all TSE 2026 Government Plans');
    console.log(`   Total plans: ${TSE_PLANS.length}`);
    console.log('   Using improved pipeline with:');
    console.log('     - Page marker extraction');
    console.log('     - Enhanced encoding fixes');
    console.log('     - Optimized chunk sizes (400-600 tokens)');
    console.log('     - Page metadata enrichment\n');

    const confirmed = await confirmReingest();

    if (!confirmed) {
        console.log('\n❌ Re-ingestion cancelled by user\n');
        return;
    }

    console.log('\n✅ Starting re-ingestion...\n');

    const pipeline = new IngestPipeline();
    const results = [];
    let successCount = 0;
    let failCount = 0;

    const overallStartTime = Date.now();

    for (let i = 0; i < TSE_PLANS.length; i++) {
        const plan = TSE_PLANS[i];
        const planNum = i + 1;

        console.log(`\n${'='.repeat(80)}`);
        console.log(`📄 [${planNum}/${TSE_PLANS.length}] ${plan.partyName} (${plan.partyId})`);
        console.log(`${'='.repeat(80)}\n`);

        const startTime = Date.now();

        try {
            // Clear existing chunks first
            await clearExistingChunks(plan.documentId);

            // Re-ingest with improved pipeline
            const result = await pipeline.ingest(
                plan.url,
                plan.documentId,
                {
                    generateEmbeddings: true,
                    storeInVectorDB: true,
                    chunkingOptions: {
                        chunkSize: 400,
                        maxChunkSize: 600,
                        overlapSize: 50
                    }
                }
            );

            const duration = Date.now() - startTime;

            if (result.success && result.chunks) {
                successCount++;

                // Calculate stats
                const tokenCounts = result.chunks.map(c => c.tokens);
                const avgTokens = tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length;
                const chunksWithPages = result.chunks.filter(c => c.pageNumber || c.pageRange);

                console.log(`\n✅ SUCCESS - ${plan.partyId}`);
                console.log(`   Chunks: ${result.chunks.length}`);
                console.log(`   Avg tokens: ${avgTokens.toFixed(0)}`);
                console.log(`   With page info: ${chunksWithPages.length}/${result.chunks.length}`);
                console.log(`   Time: ${(duration / 1000).toFixed(1)}s`);
            } else {
                failCount++;
                console.log(`\n❌ FAILED - ${plan.partyId}`);
                console.log(`   Error: ${result.error}`);
            }

            results.push({
                ...plan,
                success: result.success,
                chunks: result.chunks?.length || 0,
                duration,
                error: result.error,
            });

        } catch (error) {
            failCount++;
            const duration = Date.now() - startTime;
            console.log(`\n❌ EXCEPTION - ${plan.partyId}`);
            console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);

            results.push({
                ...plan,
                success: false,
                chunks: 0,
                duration,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    pipeline.dispose();

    const totalDuration = Date.now() - overallStartTime;

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RE-INGESTION SUMMARY');
    console.log(`${'='.repeat(80)}\n`);

    console.log(`Total plans processed: ${TSE_PLANS.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏱️  Total time: ${(totalDuration / 1000 / 60).toFixed(1)} minutes\n`);

    console.log('Detailed results:\n');
    results.forEach((r) => {
        const status = r.success ? '✅' : '❌';
        const time = (r.duration / 1000).toFixed(1);
        console.log(`${status} ${r.partyId.padEnd(6)} | ${r.chunks.toString().padStart(3)} chunks | ${time.padStart(5)}s | ${r.partyName}`);
        if (!r.success && r.error) {
            console.log(`   └─ Error: ${r.error.substring(0, 100)}...`);
        }
    });

    const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
    console.log(`\n📦 Total chunks created: ${totalChunks}`);
    console.log(`📈 Average chunks per plan: ${(totalChunks / successCount).toFixed(0)}`);

    if (failCount === 0) {
        console.log(`\n🎉 All plans re-ingested successfully!`);
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Test search quality with: pnpm tsx test-query.ts "¿Qué dice el PUSC sobre economía?"`);
        console.log(`   2. Check improved similarity scores`);
        console.log(`   3. Verify page metadata is present in results`);
    } else {
        console.log(`\n⚠️  ${failCount} plan(s) failed. Check errors above.`);
    }

    console.log('\n✅ Re-ingestion complete!\n');
}

main().catch((error) => {
    console.error('\n❌ Fatal error during re-ingestion:');
    console.error(error);
    process.exit(1);
});
