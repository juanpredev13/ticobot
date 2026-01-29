import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearAllCache() {
  // First, check how many entries exist
  const { data: existing, error: countError } = await supabase
    .from('comparisons_cache')
    .select('id, topic, created_at');

  if (countError) {
    console.error('Error checking cache:', countError);
    return;
  }

  console.log(`Found ${existing?.length || 0} cache entries:`);
  existing?.forEach(entry => {
    console.log(`  - "${entry.topic}" (created: ${entry.created_at})`);
  });

  if (!existing || existing.length === 0) {
    console.log('Cache is already empty!');
    return;
  }

  // Delete all entries
  const { error } = await supabase
    .from('comparisons_cache')
    .delete()
    .not('id', 'is', null);  // This matches all rows

  if (error) {
    console.error('Error clearing cache:', error);
    return;
  }

  console.log(`\n✅ Cleared ${existing.length} cache entries`);

  // Verify deletion
  const { data: remaining } = await supabase
    .from('comparisons_cache')
    .select('id');

  console.log(`Remaining entries: ${remaining?.length || 0}`);
}

clearAllCache().catch(console.error);
