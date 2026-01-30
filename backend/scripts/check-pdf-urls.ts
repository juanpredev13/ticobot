import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUrls() {
  const { data, error } = await supabase
    .from('documents')
    .select('title, url, metadata, party_name')
    .order('title');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== DOCUMENT URLs ===\n');
  data?.forEach(doc => {
    console.log(`📄 ${doc.title}`);
    console.log(`   Party: ${doc.party_name || 'N/A'}`);
    console.log(`   URL: ${doc.url || 'N/A'}`);
    console.log(`   Metadata: ${JSON.stringify(doc.metadata)}`);
    console.log('');
  });
}

checkUrls().catch(console.error);
