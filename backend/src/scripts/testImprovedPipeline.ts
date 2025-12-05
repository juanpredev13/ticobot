/**
 * Test improved ingestion pipeline with enhanced cleaning and chunking
 *
 * This script tests:
 * - Page marker extraction
 * - Encoding fixes
 * - Optimized chunk sizes (400-600 tokens)
 * - Page metadata in chunks
 */

import { IngestPipeline } from '../ingest/components/IngestPipeline.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPipeline() {
    console.log('🧪 Testing Improved Ingestion Pipeline\n');
    console.log('='.repeat(80));

    const pipeline = new IngestPipeline();

    // Test with PUSC document (one of the smaller ones)
    const testDoc = {
        documentId: 'pusc-2026-test',
        url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PUSC.pdf'
    };

    console.log(`\n📄 Processing: ${testDoc.documentId}`);
    console.log(`🔗 URL: ${testDoc.url}\n`);

    const startTime = Date.now();

    try {
        const result = await pipeline.ingest(
            testDoc.url,
            testDoc.documentId,
            {
                generateEmbeddings: false, // Skip embeddings for faster testing
                storeInVectorDB: false,    // Don't store yet
                chunkingOptions: {
                    chunkSize: 400,
                    maxChunkSize: 600,
                    overlapSize: 50
                }
            }
        );

        const duration = (Date.now() - startTime) / 1000;

        if (result.success && result.chunks) {
            console.log('\n' + '='.repeat(80));
            console.log('✅ PIPELINE TEST SUCCESSFUL');
            console.log('='.repeat(80) + '\n');

            // Analyze chunks
            const tokenCounts = result.chunks.map(c => c.tokens);
            const avgTokens = tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length;
            const chunksWithPages = result.chunks.filter(c => c.pageNumber || c.pageRange);

            console.log('📊 Statistics:');
            console.log(`   Total chunks: ${result.chunks.length}`);
            console.log(`   Avg tokens per chunk: ${avgTokens.toFixed(0)}`);
            console.log(`   Min tokens: ${Math.min(...tokenCounts)}`);
            console.log(`   Max tokens: ${Math.max(...tokenCounts)}`);
            console.log(`   Chunks with page info: ${chunksWithPages.length}/${result.chunks.length}`);

            console.log('\n⏱️  Timing:');
            console.log(`   Download: ${result.stats.downloadTime}ms`);
            console.log(`   Parse: ${result.stats.parseTime}ms`);
            console.log(`   Clean: ${result.stats.cleanTime}ms`);
            console.log(`   Chunk: ${result.stats.chunkTime}ms`);
            console.log(`   Total: ${duration.toFixed(1)}s`);

            // Show sample chunks
            console.log('\n📝 Sample Chunks:\n');

            for (let i = 0; i < Math.min(3, result.chunks.length); i++) {
                const chunk = result.chunks[i];
                console.log(`Chunk #${chunk.chunkIndex}`);
                console.log(`  Tokens: ${chunk.tokens}`);
                console.log(`  Page: ${chunk.pageNumber || (chunk.pageRange ? `${chunk.pageRange.start}-${chunk.pageRange.end}` : 'N/A')}`);
                console.log(`  Preview: ${chunk.content.substring(0, 150).replace(/\n/g, ' ')}...`);
                console.log('');
            }

            // Check for encoding issues
            console.log('\n🔍 Encoding Check:');
            const hasEncodingIssues = result.chunks.some(c =>
                c.content.includes(':ene') ||
                c.content.includes('soRware') ||
                c.content.includes('-- ')
            );

            if (hasEncodingIssues) {
                console.log('   ⚠️  WARNING: Found potential encoding issues in chunks');
            } else {
                console.log('   ✅ No encoding issues detected');
            }

            // Check for page markers
            const hasPageMarkers = result.chunks.some(c =>
                c.content.includes('-- ') && c.content.match(/\d+\s+of\s+\d+/)
            );

            if (hasPageMarkers) {
                console.log('   ⚠️  WARNING: Page markers still present in content');
            } else {
                console.log('   ✅ Page markers successfully removed');
            }

        } else {
            console.log('\n❌ TEST FAILED');
            console.log(`   Error: ${result.error}`);
        }

    } catch (error) {
        console.log('\n❌ EXCEPTION DURING TEST');
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) {
            console.log('\n Stack trace:');
            console.log(error.stack);
        }
    } finally {
        pipeline.dispose();
    }

    console.log('\n' + '='.repeat(80));
    console.log('🏁 Test Complete');
    console.log('='.repeat(80) + '\n');
}

testPipeline().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
