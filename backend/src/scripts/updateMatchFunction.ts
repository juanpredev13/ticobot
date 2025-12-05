/**
 * Update match_chunks function with new similarity threshold
 *
 * This script updates the match_chunks database function to use a lower
 * similarity threshold (0.45 instead of 0.7) based on diagnostic findings.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const UPDATE_FUNCTION_SQL = fs.readFileSync(
  path.join(__dirname, 'update_match_function.sql'),
  'utf-8'
);

async function main() {
  console.log('🔧 Updating match_chunks function...\n');

  // For local Supabase, use the database port (54322) not the API port (54321)
  const connectionString = process.env.SUPABASE_URL?.includes('127.0.0.1:54321')
    ? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    : process.env.DATABASE_URL!;

  console.log(`📍 Connecting to: ${connectionString.replace(/postgres:.*@/, 'postgres:***@')}`);

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🔄 Executing SQL...');
    await client.query(UPDATE_FUNCTION_SQL);

    console.log('✅ match_chunks function updated successfully!\n');
    console.log('Changes:');
    console.log('  - Default threshold: 0.7 → 0.45 (45%)');
    console.log('  - This allows relevant results with similarity > 45%\n');
    console.log('You can now run: pnpm tsx src/scripts/testRAGWithMultipleDocs.ts\n');

  } catch (error) {
    console.error('❌ Error updating function:', error);
    console.log('\n📝 SQL that failed:');
    console.log(UPDATE_FUNCTION_SQL);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
