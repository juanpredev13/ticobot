-- ============================================
-- TicoBot Initial Database Schema
-- Migration: 001_initial_schema
-- ============================================

-- Step 1: Enable pgvector extension
-- Note: In Supabase Cloud, enable this from Dashboard → Database → Extensions first
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure extensions schema is in search path
SET search_path TO public, extensions;

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
  match_threshold float DEFAULT 0.7,
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
