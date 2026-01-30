import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearCache() {
  const { error, count } = await supabase
    .from('chat_cache')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('Error clearing cache:', error);
    return;
  }

  console.log('✅ Chat cache cleared successfully');
}

clearCache().catch(console.error);
