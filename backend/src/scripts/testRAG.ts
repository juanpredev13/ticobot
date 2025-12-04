/**
 * Test script for RAG Pipeline
 *
 * Usage: pnpm --filter backend tsx src/scripts/testRAG.ts
 */

import { RAGPipeline } from '../rag/components/RAGPipeline.js';

async function main() {
    console.log('🚀 Testing RAG Pipeline...\n');

    try {
        // Initialize pipeline
        const pipeline = new RAGPipeline();
        console.log('✅ RAG Pipeline initialized\n');

        // Test query
        const question = '¿Qué propone el PLN sobre educación?';
        console.log(`📝 Question: ${question}\n`);

        console.log('⏳ Processing query...\n');
        const startTime = Date.now();

        const result = await pipeline.query(question, {
            topK: 3,
            // filters: { partyId: 'PLN' } // Temporarily remove filter to test
        });

        const duration = Date.now() - startTime;

        // Display results
        console.log('✅ Query completed!\n');
        console.log('=' .repeat(80));
        console.log('📊 RESULTS');
        console.log('='.repeat(80));
        console.log(`\n💬 Answer:\n${result.answer}\n`);
        console.log('-'.repeat(80));
        console.log(`\n📚 Sources (${result.sources.length}):`);
        result.sources.forEach((source, i) => {
            console.log(`\n${i + 1}. ${source.party} - ${source.document}`);
            console.log(`   Relevance: ${(source.relevance * 100).toFixed(1)}%`);
            console.log(`   Preview: ${source.content.substring(0, 100)}...`);
        });
        console.log('\n' + '-'.repeat(80));
        console.log(`\n📈 Metadata:`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   Query Time: ${duration}ms`);
        console.log(`   Chunks Retrieved: ${result.metadata.chunksRetrieved}`);
        console.log(`   Chunks Used: ${result.metadata.chunksUsed}`);
        console.log(`   Model: ${result.metadata.model || 'N/A'}`);
        console.log(`   Tokens Used: ${result.metadata.tokensUsed || 'N/A'}`);
        console.log('\n' + '='.repeat(80));

        console.log('\n✅ Test completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Error during test:', error);
        process.exit(1);
    }
}

main();
