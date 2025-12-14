-- ============================================
-- Hybrid Search Migration
-- Combines vector similarity with full-text search for improved precision
-- Target: 95% accuracy (from ~80% with vector-only)
-- ============================================

-- Step 1: Add tsvector column for full-text search
ALTER TABLE chunks
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Step 2: Create function to build search vector from chunk data
-- Combines content + keywords + entities for comprehensive search
CREATE OR REPLACE FUNCTION chunks_search_vector(chunk chunks)
RETURNS tsvector
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN
    -- Content (weight A - highest priority)
    setweight(to_tsvector('spanish', COALESCE(chunk.content, '')), 'A') ||

    -- Keywords from metadata (weight B)
    setweight(
      to_tsvector('spanish',
        COALESCE(
          array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(chunk.metadata->'keywords')),
            ' '
          ),
          ''
        )
      ),
      'B'
    ) ||

    -- Entities from metadata (weight C)
    setweight(
      to_tsvector('spanish',
        COALESCE(
          array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(chunk.metadata->'entities')),
            ' '
          ),
          ''
        )
      ),
      'C'
    );
END;
$$;

-- Step 3: Populate search_vector for existing chunks
UPDATE chunks
SET search_vector = chunks_search_vector(chunks.*);

-- Step 4: Create trigger to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION chunks_search_vector_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := chunks_search_vector(NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chunks_search_vector_update ON chunks;
CREATE TRIGGER chunks_search_vector_update
  BEFORE INSERT OR UPDATE OF content, metadata
  ON chunks
  FOR EACH ROW
  EXECUTE FUNCTION chunks_search_vector_trigger();

-- Step 5: Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_chunks_search_vector
ON chunks
USING gin(search_vector);

-- Step 6: Create hybrid search function
-- Combines vector similarity (semantic) with keyword matching (lexical)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding extensions.vector(1536),
  query_text text,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.7,
  keyword_weight float DEFAULT 0.3,
  min_score float DEFAULT 0.3,
  filter_party_id text DEFAULT NULL,
  min_quality_score float DEFAULT 0.0
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  metadata jsonb,
  hybrid_score float,
  vector_score float,
  keyword_score float
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

    -- Hybrid score: weighted combination of vector + keyword scores
    (
      -- Vector similarity score (normalized 0-1)
      (1 - (c.embedding <=> query_embedding)) * vector_weight +

      -- Keyword relevance score (normalized 0-1)
      LEAST(
        ts_rank_cd(
          c.search_vector,
          plainto_tsquery('spanish', query_text),
          32  -- normalization flag: divides by document length
        ),
        1.0
      ) * keyword_weight
    ) AS hybrid_score,

    -- Individual scores for debugging
    (1 - (c.embedding <=> query_embedding))::float AS vector_score,
    ts_rank_cd(c.search_vector, plainto_tsquery('spanish', query_text), 32)::float AS keyword_score

  FROM chunks c
  INNER JOIN documents d ON c.document_id = d.id
  WHERE
    -- Must meet minimum hybrid score
    (
      (1 - (c.embedding <=> query_embedding)) * vector_weight +
      LEAST(ts_rank_cd(c.search_vector, plainto_tsquery('spanish', query_text), 32), 1.0) * keyword_weight
    ) >= min_score

    -- Optional party filter
    AND (filter_party_id IS NULL OR d.party_id = filter_party_id)

    -- Optional quality filter
    AND (
      min_quality_score = 0.0 OR
      COALESCE((c.metadata->>'qualityScore')::float, 1.0) >= min_quality_score
    )

  ORDER BY hybrid_score DESC
  LIMIT match_count;
END;
$$;

-- Step 7: Create simplified hybrid search (for backwards compatibility)
CREATE OR REPLACE FUNCTION hybrid_search_simple(
  query_embedding extensions.vector(1536),
  query_text text,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    id,
    document_id,
    chunk_index,
    content,
    metadata,
    hybrid_score AS similarity
  FROM hybrid_search(
    query_embedding,
    query_text,
    match_count,
    0.7,  -- 70% vector weight
    0.3,  -- 30% keyword weight
    0.3,  -- min score
    NULL, -- no party filter
    0.0   -- no quality filter
  );
$$;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION hybrid_search TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION chunks_search_vector TO anon, authenticated;

-- Step 9: Add helpful comments
COMMENT ON COLUMN chunks.search_vector IS 'Full-text search vector combining content, keywords, and entities (Spanish)';
COMMENT ON FUNCTION hybrid_search IS 'Hybrid search combining vector similarity (semantic) with full-text search (lexical) for improved precision';
COMMENT ON INDEX idx_chunks_search_vector IS 'GIN index for fast full-text search on search_vector column';

-- Step 10: Create view for testing hybrid search
CREATE OR REPLACE VIEW hybrid_search_stats AS
SELECT
  COUNT(*) as total_chunks,
  COUNT(DISTINCT document_id) as total_documents,
  COUNT(search_vector) as chunks_with_search_vector,
  ROUND(
    COUNT(search_vector)::numeric / NULLIF(COUNT(*), 0) * 100,
    2
  ) as search_vector_coverage_pct
FROM chunks;

GRANT SELECT ON hybrid_search_stats TO anon, authenticated;
