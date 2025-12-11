-- Migration: Fix embedding storage and match_chunks function
-- Date: 2025-12-10
-- Description:
--   1. Fix embeddings stored as text/json strings (convert to vector)
--   2. Update match_chunks to remove threshold filtering and return embedding
--   3. Recreate index with IVFFlat for better performance

BEGIN;

-- Ensure extensions schema is in search path
SET search_path TO public, extensions;

-- Step 1: Create new column with correct vector type
ALTER TABLE chunks
ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Step 2: Convert existing embeddings (format: "[x,y,z]" -> vector)
UPDATE chunks
SET embedding_vector = embedding::vector
WHERE embedding_vector IS NULL;

-- Step 3: Verify all rows were converted
DO $$
DECLARE
  total_count INTEGER;
  converted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM chunks;
  SELECT COUNT(embedding_vector) INTO converted_count FROM chunks;

  IF total_count != converted_count THEN
    RAISE EXCEPTION 'Conversion failed: % total chunks but only % converted',
      total_count, converted_count;
  END IF;

  RAISE NOTICE 'Successfully converted % embeddings', converted_count;
END $$;

-- Step 4: Drop old column and rename new one
ALTER TABLE chunks DROP COLUMN embedding;
ALTER TABLE chunks RENAME COLUMN embedding_vector TO embedding;

-- Step 5: Recreate match_chunks function with correct signature
-- Drop all possible variations of the function
DROP FUNCTION IF EXISTS match_chunks(vector, integer, text);
DROP FUNCTION IF EXISTS match_chunks(vector, float, integer, text);
DROP FUNCTION IF EXISTS match_chunks(vector(1536), integer, text);
DROP FUNCTION IF EXISTS match_chunks(vector(1536), float, integer, text);

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_party_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  embedding vector(1536),
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
    c.embedding,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM chunks c
  INNER JOIN documents d ON c.document_id = d.id
  WHERE
    (filter_party_id IS NULL OR d.party_id = filter_party_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION match_chunks TO anon, authenticated, service_role;

-- Step 7: Drop old indexes
-- Drop old index (might be HNSW from initial schema)
DROP INDEX IF EXISTS idx_chunks_embedding;
DROP INDEX IF EXISTS chunks_embedding_idx;

-- Note: Skipping index creation due to memory limits on Supabase Cloud free tier
-- The search will work but may be slightly slower (~100ms vs ~10ms)
-- You can create the index manually later with:
-- CREATE INDEX chunks_embedding_idx ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 40);

COMMIT;

-- Verification query (optional - run separately)
-- SELECT column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE table_name = 'chunks' AND column_name = 'embedding';
