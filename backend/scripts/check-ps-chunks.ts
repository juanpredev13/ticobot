import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Get chunks for PS document
  const docId = '79df429f-41b2-4832-9bf5-c8dd8be473a2';

  const { data: chunks, error } = await supabase
    .from('chunks')
    .select('id, content, metadata')
    .eq('document_id', docId)
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`=== CHUNKS for PS Document (first 5 of many) ===`);
  console.log(`Document ID: ${docId}`);
  console.log(`Found ${chunks?.length} chunks\n`);

  chunks?.forEach((chunk, i) => {
    console.log(`--- Chunk ${i + 1} ---`);
    console.log('Content preview:', chunk.content?.substring(0, 500));
    console.log('Metadata:', JSON.stringify(chunk.metadata, null, 2));
    console.log('\n');
  });

  // Search for "PPSO" or "Progreso Social" in chunks
  const { data: ppsoChunks } = await supabase
    .from('chunks')
    .select('id, content')
    .eq('document_id', docId)
    .or('content.ilike.%PPSO%,content.ilike.%Progreso Social Obrero%')
    .limit(3);

  console.log('=== CHUNKS mentioning PPSO or Progreso Social Obrero ===');
  console.log(`Found ${ppsoChunks?.length || 0} chunks`);
  ppsoChunks?.forEach((chunk, i) => {
    console.log(`\n--- Match ${i + 1} ---`);
    console.log(chunk.content?.substring(0, 300));
  });

  // Search for "Pueblo Soberano" in chunks
  const { data: psChunks } = await supabase
    .from('chunks')
    .select('id, content')
    .eq('document_id', docId)
    .ilike('content', '%Pueblo Soberano%')
    .limit(3);

  console.log('\n=== CHUNKS mentioning Pueblo Soberano ===');
  console.log(`Found ${psChunks?.length || 0} chunks`);
  psChunks?.forEach((chunk, i) => {
    console.log(`\n--- Match ${i + 1} ---`);
    console.log(chunk.content?.substring(0, 300));
  });
}

check().catch(console.error);
