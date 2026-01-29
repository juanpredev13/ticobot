import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixPSDocument() {
  const docId = '79df429f-41b2-4832-9bf5-c8dd8be473a2';

  // Update document title
  const { data, error } = await supabase
    .from('documents')
    .update({
      title: 'Plan de Gobierno Pueblo Soberano (PS) 2026'
    })
    .eq('id', docId)
    .select();

  if (error) {
    console.error('Error updating document:', error);
    return;
  }

  console.log('✅ Document updated:');
  console.log(JSON.stringify(data, null, 2));

  // Also clear any cached comparisons for this topic to force re-generation
  const { error: cacheError } = await supabase
    .from('comparisons_cache')
    .delete()
    .ilike('topic', '%educacion%');

  if (cacheError) {
    console.warn('Warning clearing cache:', cacheError);
  } else {
    console.log('✅ Cleared cached comparisons for "educacion"');
  }
}

fixPSDocument().catch(console.error);
