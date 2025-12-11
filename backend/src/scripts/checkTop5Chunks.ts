import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTop5() {
  const parties = ['PLN', 'PUSC', 'FA', 'PLP', 'PNG'];

  console.log('\n📊 TOP 5 Chunk Status\n');

  let totalChunks = 0;

  for (const party of parties) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, title')
      .eq('party_id', party)
      .single();

    if (docs) {
      const { count } = await supabase
        .from('chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', docs.id);

      const chunkCount = count || 0;
      totalChunks += chunkCount;

      console.log(`${party.padEnd(6)} | ${String(chunkCount).padStart(3)} chunks | ${docs.title}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL  | ${totalChunks} chunks across TOP 5 parties`);
  console.log('='.repeat(70) + '\n');
}

checkTop5();
