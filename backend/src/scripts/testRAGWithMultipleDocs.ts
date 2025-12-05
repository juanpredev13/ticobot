/**
 * Test RAG Pipeline with Multiple Documents
 *
 * This script tests the complete RAG pipeline with multiple government plans
 * to verify that the adjusted similarity threshold works correctly.
 */

import { createClient } from '@supabase/supabase-js';
import { ProviderFactory } from '../factory/ProviderFactory.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🧪 Testing RAG Pipeline with Multiple Documents\n');

  // Verify database state
  console.log('1️⃣ Verifying database state...');
  const { data: docStats } = await supabase
    .from('document_stats')
    .select('*');

  if (!docStats || docStats.length === 0) {
    console.error('❌ No documents found in database!');
    return;
  }

  console.log(`   Documents in database: ${docStats.length}`);
  docStats.forEach((doc: any) => {
    console.log(`   - ${doc.party_name} (${doc.party_id}): ${doc.chunk_count} chunks`);
  });

  const totalChunks = docStats.reduce((sum: number, doc: any) => sum + doc.chunk_count, 0);
  console.log(`   Total chunks: ${totalChunks}\n`);

  // Test queries
  const testQueries = [
    {
      query: '¿Qué propone el PLN sobre educación?',
      expectedParty: 'PLN',
      description: 'PLN education proposals'
    },
    {
      query: '¿Cuáles son las propuestas del PUSC en salud?',
      expectedParty: 'PUSC',
      description: 'PUSC health proposals'
    },
    {
      query: '¿Qué partidos mencionan infraestructura?',
      expectedParty: null, // Should return results from both parties
      description: 'Infrastructure mentions across parties'
    },
    {
      query: '¿Cuál es la propuesta económica de los partidos?',
      expectedParty: null,
      description: 'Economic proposals across parties'
    }
  ];

  const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

  console.log('2️⃣ Running test queries...\n');

  for (let i = 0; i < testQueries.length; i++) {
    const test = testQueries[i];
    console.log(`${'─'.repeat(80)}`);
    console.log(`Query ${i + 1}/${testQueries.length}: ${test.query}`);
    console.log(`Expected: ${test.description}`);
    console.log(`${'─'.repeat(80)}`);

    // Generate query embedding
    const { embedding: queryEmbedding } = await embeddingProvider.generateEmbedding(test.query);

    // Search with new threshold (default 0.45)
    const { data: results, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_count: 5,
      filter_party_id: test.expectedParty
    });

    if (error) {
      console.error(`   ❌ Search error:`, error);
      continue;
    }

    console.log(`   Results found: ${results?.length || 0}`);

    if (results && results.length > 0) {
      console.log('   Top results:');
      results.forEach((r: any, idx: number) => {
        console.log(`   ${idx + 1}. Score: ${(r.similarity * 100).toFixed(1)}% | Preview: ${r.content.substring(0, 80)}...`);
      });

      // Analyze party distribution
      const partyCounts = results.reduce((acc: any, r: any) => {
        const partyId = r.metadata?.partyId || 'unknown';
        acc[partyId] = (acc[partyId] || 0) + 1;
        return acc;
      }, {});

      console.log(`\n   Party distribution:`);
      Object.entries(partyCounts).forEach(([party, count]) => {
        console.log(`   - ${party}: ${count} results`);
      });

      // Check if results meet expectations
      const bestScore = results[0].similarity;
      if (bestScore >= 0.45) {
        console.log(`   ✅ Best score (${(bestScore * 100).toFixed(1)}%) meets threshold (45%)`);
      } else {
        console.log(`   ⚠️  Best score (${(bestScore * 100).toFixed(1)}%) below threshold (45%)`);
      }

      if (test.expectedParty) {
        const hasExpectedParty = results.some((r: any) => r.metadata?.partyId === test.expectedParty);
        if (hasExpectedParty) {
          console.log(`   ✅ Results include expected party: ${test.expectedParty}`);
        } else {
          console.log(`   ⚠️  Results don't include expected party: ${test.expectedParty}`);
        }
      }
    } else {
      console.log('   ⚠️  No results found - query may be too specific or threshold still too high');
    }

    console.log('');
  }

  // Summary
  console.log(`${'='.repeat(80)}`);
  console.log('📊 RAG Pipeline Test Summary');
  console.log(`${'='.repeat(80)}`);
  console.log(`\nConfiguration:`);
  console.log(`  - Similarity threshold: 0.45 (45%)`);
  console.log(`  - Documents: ${docStats.length}`);
  console.log(`  - Total chunks: ${totalChunks}`);
  console.log(`  - Embedding model: ${process.env.EMBEDDING_PROVIDER || 'openai'}`);
  console.log(`  - Test queries: ${testQueries.length}`);

  console.log(`\nNext steps:`);
  console.log(`  1. If results look good: Proceed to frontend integration`);
  console.log(`  2. If no results: Lower threshold further (e.g., 0.35)`);
  console.log(`  3. If too many irrelevant results: Raise threshold (e.g., 0.50)`);
  console.log(`  4. Monitor for new PDFs on TSE website (PAC, PRSC, PFA)`);

  console.log('\n✅ RAG pipeline test complete!\n');
}

main().catch(console.error);
