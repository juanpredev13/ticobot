#!/usr/bin/env tsx
/**
 * Supabase Schema Setup & Verification Script
 *
 * This script helps you set up the Supabase database schema for TicoBot.
 *
 * Usage:
 *   pnpm tsx src/scripts/setupSupabase.ts
 *
 * This will output the SQL that you need to run in your Supabase SQL Editor,
 * and then verify that everything was created correctly.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   - SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SCHEMA_SQL = `
-- ============================================
-- TicoBot Database Schema
-- ============================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  party_id TEXT NOT NULL,
  party_name TEXT NOT NULL,
  url TEXT,
  file_path TEXT,
  page_count INTEGER,
  file_size_bytes BIGINT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  clean_content TEXT,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  token_count INTEGER,
  char_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_party_id ON documents(party_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);

-- Step 5: Create vector similarity search index (HNSW algorithm)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 6: Create vector similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.45,
  match_count int DEFAULT 5,
  filter_party_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM chunks c
  INNER JOIN documents d ON c.document_id = d.id
  WHERE
    1 - (c.embedding <=> query_embedding) > match_threshold
    AND (filter_party_id IS NULL OR d.party_id = filter_party_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 7: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Add trigger for documents table
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Grant permissions
GRANT SELECT ON documents TO anon;
GRANT SELECT ON chunks TO anon;
GRANT EXECUTE ON FUNCTION match_chunks TO anon;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_chunks TO authenticated;

-- Step 10: Create document statistics view
CREATE OR REPLACE VIEW document_stats AS
SELECT
  d.id,
  d.document_id,
  d.party_id,
  d.party_name,
  d.title,
  COUNT(c.id) as chunk_count,
  SUM(c.token_count) as total_tokens,
  MAX(d.updated_at) as last_updated
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
GROUP BY d.id, d.document_id, d.party_id, d.party_name, d.title;

GRANT SELECT ON document_stats TO anon, authenticated;
`;

async function saveSchemaToFile() {
  const sqlFilePath = path.join(__dirname, 'schema.sql');
  fs.writeFileSync(sqlFilePath, SCHEMA_SQL.trim());
  console.log(`📝 Schema SQL saved to: ${sqlFilePath}`);
  return sqlFilePath;
}

async function checkIfSchemaExists(): Promise<boolean> {
  try {
    // Try to query the documents table
    const { error: docError } = await supabase
      .from('documents')
      .select('count', { count: 'exact', head: true });

    // Try to query the chunks table
    const { error: chunkError } = await supabase
      .from('chunks')
      .select('count', { count: 'exact', head: true });

    return !docError && !chunkError;
  } catch {
    return false;
  }
}

async function verifySchema() {
  console.log('\n🔍 Verifying schema setup...\n');

  const checks: Array<{ name: string; passed: boolean; message?: string }> = [];

  // Check 1: documents table
  try {
    const { error } = await supabase
      .from('documents')
      .select('count', { count: 'exact', head: true });

    checks.push({
      name: 'documents table',
      passed: !error,
      message: error?.message,
    });
  } catch (error: any) {
    checks.push({ name: 'documents table', passed: false, message: error.message });
  }

  // Check 2: chunks table
  try {
    const { error } = await supabase
      .from('chunks')
      .select('count', { count: 'exact', head: true });

    checks.push({
      name: 'chunks table',
      passed: !error,
      message: error?.message,
    });
  } catch (error: any) {
    checks.push({ name: 'chunks table', passed: false, message: error.message });
  }

  // Check 3: document_stats view
  try {
    const { error } = await supabase
      .from('document_stats')
      .select('count', { count: 'exact', head: true });

    checks.push({
      name: 'document_stats view',
      passed: !error,
      message: error?.message,
    });
  } catch (error: any) {
    checks.push({ name: 'document_stats view', passed: false, message: error.message });
  }

  // Print results
  for (const check of checks) {
    if (check.passed) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}: ${check.message || 'failed'}`);
    }
  }

  const allPassed = checks.every((c) => c.passed);

  if (allPassed) {
    console.log('\n🎉 All schema components verified successfully!\n');
    console.log('✅ Your Supabase database is ready for the ingestion pipeline.\n');
    return true;
  } else {
    console.log('\n⚠️  Some schema components are missing.\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Schema Setup Tool\n');
  console.log(`📍 Target: ${supabaseUrl}\n`);

  // Check if schema already exists
  const schemaExists = await checkIfSchemaExists();

  if (schemaExists) {
    console.log('ℹ️  Schema already exists! Running verification...\n');
    const verified = await verifySchema();

    if (verified) {
      console.log('✨ Setup complete! Next steps:');
      console.log('   1. Run ingestion: pnpm tsx src/scripts/testIngestion.ts');
      console.log('   2. Test RAG: pnpm tsx src/scripts/testRAG.ts\n');
      process.exit(0);
    }
  }

  // Schema doesn't exist or is incomplete
  console.log('📋 Schema needs to be created. Follow these steps:\n');
  console.log('OPTION 1 - Run SQL in Supabase Dashboard (Recommended):');
  console.log('─────────────────────────────────────────────────────');
  console.log('1. Go to your Supabase project: https://supabase.com/dashboard');
  console.log('2. Navigate to: SQL Editor (in the left sidebar)');
  console.log('3. Click "New query"');
  console.log('4. Copy the SQL from: backend/src/scripts/schema.sql');
  console.log('5. Paste it into the SQL Editor');
  console.log('6. Click "Run" (or press Ctrl/Cmd + Enter)');
  console.log('7. Wait for success confirmation');
  console.log('8. Run this script again to verify\n');

  console.log('OPTION 2 - Use the SQL file directly:');
  console.log('────────────────────────────────────');
  const sqlFilePath = await saveSchemaToFile();
  console.log(`1. Open: ${sqlFilePath}`);
  console.log('2. Copy the entire contents');
  console.log('3. Follow Option 1 steps 1-7 above\n');

  console.log('After running the SQL, execute this script again to verify the setup.');

  process.exit(0);
}

main();
