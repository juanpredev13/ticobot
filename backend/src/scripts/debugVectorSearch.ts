import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugVectorSearch() {
  console.log('\n🔍 Debugging Vector Search\n');

  // 1. Check if chunks exist
  const { count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total chunks in DB: ${count}\n`);

  // 2. Get a sample chunk to verify embedding format
  const { data: sampleChunk } = await supabase
    .from('chunks')
    .select('id, content, embedding')
    .limit(1)
    .single();

  if (sampleChunk) {
    console.log('📄 Sample chunk:');
    console.log(`   ID: ${sampleChunk.id}`);
    console.log(`   Content: ${sampleChunk.content.substring(0, 100)}...`);
    console.log(`   Embedding type: ${typeof sampleChunk.embedding}`);

    if (typeof sampleChunk.embedding === 'string') {
      console.log(`   ❌ PROBLEM: Embedding is a STRING, should be vector`);
      console.log(`   Format: ${sampleChunk.embedding.substring(0, 50)}...`);
    } else if (Array.isArray(sampleChunk.embedding)) {
      console.log(`   ❌ PROBLEM: Embedding is an ARRAY, should be pgvector`);
      console.log(`   Length: ${sampleChunk.embedding.length}`);
    } else {
      console.log(`   ✅ Embedding appears to be in pgvector format`);
    }
  }

  console.log('\n');

  // 3. Try direct RPC call with a test embedding
  const testEmbedding = Array(1536).fill(0.001); // Dummy embedding
  const testEmbeddingVector = `[${testEmbedding.join(',')}]`;

  console.log('🧪 Testing match_chunks RPC with dummy embedding...\n');

  const { data: matchResults, error } = await supabase.rpc('match_chunks', {
    query_embedding: testEmbeddingVector,
    match_threshold: 0.0, // Very low threshold
    match_count: 5
  });

  if (error) {
    console.log('❌ RPC Error:', error);
  } else {
    console.log(`✅ RPC returned ${matchResults?.length || 0} results`);
    if (matchResults && matchResults.length > 0) {
      console.log('\nFirst result:');
      console.log(`   Similarity: ${matchResults[0].similarity}`);
      console.log(`   Content: ${matchResults[0].content.substring(0, 100)}...`);
    }
  }

  console.log('\n');
}

debugVectorSearch();
