import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

async function testRealQuery() {
  console.log('\n🧪 Testing REAL query with actual embedding\n');

  const question = '¿Cuáles son las propuestas de salud?';

  // 1. Generate embedding for the question
  console.log(`Generating embedding for: "${question}"`);

  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;
  console.log(`✅ Generated embedding (${queryEmbedding.length} dimensions)\n`);

  // 2. Convert to pgvector format
  const queryEmbeddingVector = `[${queryEmbedding.join(',')}]`;

  // 3. Call match_chunks RPC
  console.log('Calling match_chunks with thresholds: 0.0, 0.1, 0.2, 0.3\n');

  for (const threshold of [0.0, 0.1, 0.2, 0.3]) {
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbeddingVector,
      match_count: 5
    });

    if (error) {
      console.log(`❌ Error at threshold ${threshold}:`, error);
      continue;
    }

    // Filter by threshold manually
    const filtered = data?.filter((r: any) => r.similarity >= threshold) || [];

    console.log(`Threshold ${threshold.toFixed(1)}: ${filtered.length} results`);

    if (filtered.length > 0) {
      console.log('  Top 3 results:');
      filtered.slice(0, 3).forEach((r: any, i: number) => {
        console.log(`    ${i + 1}. Score: ${r.similarity.toFixed(4)} | ${r.content.substring(0, 80)}...`);
      });
    }
    console.log('');
  }

  // 4. Show sample chunks for comparison
  console.log('\n📄 Sample chunks from database (for comparison):\n');

  const { data: sampleChunks } = await supabase
    .from('chunks')
    .select('content')
    .ilike('content', '%salud%')
    .limit(3);

  if (sampleChunks && sampleChunks.length > 0) {
    sampleChunks.forEach((chunk: any, i: number) => {
      console.log(`${i + 1}. ${chunk.content.substring(0, 100)}...`);
    });
  } else {
    console.log('⚠️  No chunks found with word "salud"');
  }
}

testRealQuery();
