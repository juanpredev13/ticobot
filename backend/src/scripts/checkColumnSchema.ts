import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumnSchema() {
  console.log('\n🔍 Checking chunks table schema\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'chunks'
      AND column_name = 'embedding';
    `
  });

  if (error) {
    console.log('❌ Error querying schema:', error);

    // Try alternative method
    console.log('\nTrying alternative method...\n');

    const { data: altData, error: altError } = await supabase.rpc('exec_sql', {
      query: `SELECT pg_typeof(embedding) as type FROM chunks LIMIT 1;`
    });

    if (altError) {
      console.log('❌ Alternative method failed:', altError);
    } else {
      console.log('Column type:', altData);
    }
  } else {
    console.log('Schema info:', data);
  }
}

checkColumnSchema();
