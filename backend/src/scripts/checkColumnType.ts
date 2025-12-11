/**
 * Check chunks table schema
 */

import { createSupabaseClient } from '../db/supabase.js';

async function main() {
  console.log('🔍 Checking chunks table schema...\n');

  const supabase = createSupabaseClient();

  try {
    // Query information_schema to get column types
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'chunks'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      console.log('⚠️  Cannot use exec_sql, trying alternative...\n');

      // Try a simple select to see what we get
      const { data: sample } = await supabase
        .from('chunks')
        .select('id, embedding')
        .limit(1)
        .single();

      if (sample) {
        console.log('Sample chunk embedding:');
        console.log('  Type:', typeof sample.embedding);
        console.log('  Is Array:', Array.isArray(sample.embedding));
        if (typeof sample.embedding === 'string') {
          console.log('  String length:', sample.embedding.length);
          console.log('  First 200 chars:', sample.embedding.substring(0, 200));

          // Try to parse it
          try {
            const parsed = JSON.parse(sample.embedding);
            console.log('\n  ✅ Can parse as JSON');
            console.log('  Parsed type:', typeof parsed);
            console.log('  Parsed is array:', Array.isArray(parsed));
            if (Array.isArray(parsed)) {
              console.log('  Array length:', parsed.length);
              console.log('  First 5 values:', parsed.slice(0, 5));
            }
          } catch (e) {
            console.log('\n  ❌ Cannot parse as JSON');
          }
        }
      }

      console.log('\n📝 To check column type manually, run this in Supabase SQL Editor:');
      console.log(`
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'chunks'
AND table_schema = 'public'
ORDER BY ordinal_position;
      `);
    } else {
      console.log('✅ Column types:');
      console.table(data);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);
