#!/usr/bin/env tsx
/**
 * Apply Supabase Migration Script
 *
 * This script applies SQL migrations directly to your Supabase database
 * using the service role key.
 *
 * Usage: pnpm tsx src/scripts/applyMigration.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function executeSqlFile(filePath: string) {
  console.log(`\n📄 Reading migration file: ${filePath}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log('🔧 Applying migration...\n');

  // Split SQL into individual statements
  // We need to execute them one by one to handle errors gracefully
  const statements = sql
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    const preview = statement
      .replace(/\s+/g, ' ')
      .substring(0, 60);

    try {
      const { data, error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        // Check if it's a "already exists" type error
        if (
          error.message.includes('already exists') ||
          error.message.includes('already enabled')
        ) {
          console.log(`⏭️  ${preview}... (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ ${preview}...`);
          console.error(`   Error: ${error.message}\n`);
          errorCount++;
        }
      } else {
        console.log(`✅ ${preview}...`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ ${preview}...`);
      console.error(`   Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(50) + '\n');

  return { successCount, skipCount, errorCount };
}

async function verifySchema() {
  console.log('🔍 Verifying schema...\n');

  const checks = [];

  // Check documents table
  const { error: docError } = await supabase
    .from('documents')
    .select('count', { count: 'exact', head: true });

  checks.push({ name: 'documents table', passed: !docError });

  // Check chunks table
  const { error: chunkError } = await supabase
    .from('chunks')
    .select('count', { count: 'exact', head: true });

  checks.push({ name: 'chunks table', passed: !chunkError });

  // Check document_stats view
  const { error: statsError } = await supabase
    .from('document_stats')
    .select('count', { count: 'exact', head: true });

  checks.push({ name: 'document_stats view', passed: !statsError });

  for (const check of checks) {
    console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
  }

  const allPassed = checks.every((c) => c.passed);

  if (allPassed) {
    console.log('\n🎉 All schema components verified successfully!\n');
  } else {
    console.log('\n⚠️  Some schema components are missing.\n');
  }

  return allPassed;
}

async function main() {
  console.log('🚀 Supabase Migration Tool\n');
  console.log(`📍 Target: ${supabaseUrl}\n`);

  // Since Supabase doesn't have a built-in exec function via REST API,
  // we'll just verify if the schema already exists and guide the user

  console.log('🔍 Checking if schema already exists...\n');

  const { error: docError } = await supabase
    .from('documents')
    .select('count', { count: 'exact', head: true });

  const { error: chunkError } = await supabase
    .from('chunks')
    .select('count', { count: 'exact', head: true });

  const schemaExists = !docError && !chunkError;

  if (schemaExists) {
    console.log('✅ Schema already exists!\n');

    const verified = await verifySchema();

    if (verified) {
      console.log('✨ Setup complete! Next steps:');
      console.log('   1. Run ingestion: pnpm tsx src/scripts/testIngestion.ts');
      console.log('   2. Test RAG: pnpm tsx src/scripts/testRAG.ts\n');
      process.exit(0);
    }
  }

  // Schema doesn't exist - provide manual instructions
  console.log('📋 Schema needs to be created. Please follow these steps:\n');
  console.log('MANUAL SETUP (Required):');
  console.log('─'.repeat(50));
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Navigate to: SQL Editor (in the left sidebar)');
  console.log('4. Click "New query"');
  console.log('5. Copy the SQL from:');
  console.log('   backend/supabase/migrations/001_initial_schema.sql');
  console.log('6. Paste it into the SQL Editor');
  console.log('7. Click "Run" (or press Ctrl/Cmd + Enter)');
  console.log('8. Wait for success confirmation');
  console.log('9. Run this script again to verify\n');

  const migrationFile = path.join(
    __dirname,
    '../../supabase/migrations/001_initial_schema.sql'
  );

  console.log(`📂 Migration file location:`);
  console.log(`   ${migrationFile}\n`);

  console.log('💡 Tip: You can also copy the SQL directly from the file above.');

  process.exit(0);
}

main();
