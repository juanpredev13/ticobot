import { IngestPipeline } from '../ingest/components/IngestPipeline';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const pipeline = new IngestPipeline();

    // Test with a real TSE PDF (corrected URL with /2026/)
    const testDocument = {
        url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf',
        documentId: 'pln-2026'
    };

    console.log('Starting ingestion test...\n');
    console.log(`Document: ${testDocument.documentId}`);
    console.log(`URL: ${testDocument.url}\n`);

    const result = await pipeline.ingest(
        testDocument.url,
        testDocument.documentId,
        {
            generateEmbeddings: true,  // ✅ Embeddings ready (OpenAI)
            storeInVectorDB: true      // ✅ Supabase ready
        }
    );

    console.log('\n=== INGESTION RESULT ===');
    console.log(`Document ID: ${result.documentId}`);
    console.log(`Success: ${result.success}`);

    if (result.success) {
        console.log(`\nChunks created: ${result.chunks?.length}`);
        console.log(`\nTiming breakdown:`);
        console.log(`  Download: ${result.stats.downloadTime}ms`);
        console.log(`  Parse: ${result.stats.parseTime}ms`);
        console.log(`  Clean: ${result.stats.cleanTime}ms`);
        console.log(`  Chunk: ${result.stats.chunkTime}ms`);
        if (result.stats.embeddingTime) {
            console.log(`  Embeddings: ${result.stats.embeddingTime}ms`);
        }
        console.log(`  Total: ${result.stats.totalTime}ms`);

        if (result.chunks && result.chunks.length > 0) {
            console.log(`\nFirst chunk preview:`);
            console.log(result.chunks[0].content.substring(0, 200) + '...');
            console.log(`\nFirst chunk stats:`);
            console.log(`  Chunk ID: ${result.chunks[0].chunkId}`);
            console.log(`  Tokens: ${result.chunks[0].tokens}`);
            console.log(`  Index: ${result.chunks[0].chunkIndex}`);
        }
    } else {
        console.log(`\nError: ${result.error}`);
    }

    pipeline.dispose();
    console.log('\n✅ Test completed!');
}

main().catch((error) => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
});
