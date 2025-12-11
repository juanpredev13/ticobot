import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkEmbeddingType() {
  console.log('\n🔍 Checking embedding column type in Cloud\n');

  // Get a sample chunk
  const { data: sample } = await supabase
    .from('chunks')
    .select('id, embedding')
    .limit(1)
    .single();

  if (!sample) {
    console.log('❌ No chunks found');
    return;
  }

  console.log('Sample chunk ID:', sample.id);
  console.log('Embedding type in JS:', typeof sample.embedding);
  console.log('Is Array:', Array.isArray(sample.embedding));
  console.log('Sample:', JSON.stringify(sample.embedding).substring(0, 100) + '...');

  // Count total chunks
  const { count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  console.log('\nTotal chunks in Cloud:', count);
}

checkEmbeddingType();
