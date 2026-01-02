-- ============================================
-- Fix party filter in search functions
-- Date: 2025-12-20
-- Description: Update match_chunks and hybrid_search to filter by party abbreviation
--              instead of party_id UUID, since documents store party_id as UUID
--              but searches filter by abbreviation (e.g., "PLN")
-- ============================================

-- Step 1: Update match_chunks function to filter by party abbreviation
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
  LEFT JOIN parties p ON d.party_id = p.id
  WHERE
    1 - (c.embedding <=> query_embedding) > match_threshold
    AND (
      filter_party_id IS NULL 
      OR d.party_id::text = filter_party_id  -- Try UUID match first
      OR p.abbreviation = filter_party_id    -- Try abbreviation match
      OR d.metadata->>'partyAbbreviation' = filter_party_id  -- Try metadata abbreviation
      OR d.party_id::text = filter_party_id  -- Fallback: if filter is UUID string
    )
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 2: Update hybrid_search function to filter by party abbreviation
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
  LEFT JOIN parties p ON d.party_id = p.id
  WHERE
    -- Must meet minimum hybrid score
    (
      (1 - (c.embedding <=> query_embedding)) * vector_weight +
      LEAST(ts_rank_cd(c.search_vector, plainto_tsquery('spanish', query_text), 32), 1.0) * keyword_weight
    ) >= min_score

    -- Optional party filter (supports both UUID and abbreviation)
    AND (
      filter_party_id IS NULL 
      OR d.party_id::text = filter_party_id  -- Try UUID match first
      OR p.abbreviation = filter_party_id     -- Try abbreviation match
      OR d.metadata->>'partyAbbreviation' = filter_party_id  -- Try metadata abbreviation
    )

    -- Optional quality filter
    AND (
      min_quality_score = 0.0 OR
      COALESCE((c.metadata->>'qualityScore')::float, 1.0) >= min_quality_score
    )

  ORDER BY hybrid_score DESC
  LIMIT match_count;
END;
$$;

-- Step 3: Add comment explaining the fix
COMMENT ON FUNCTION match_chunks IS 'Vector similarity search with party filtering. filter_party_id can be either UUID or party abbreviation (e.g., "PLN")';
COMMENT ON FUNCTION hybrid_search IS 'Hybrid search combining vector similarity with full-text search. filter_party_id can be either UUID or party abbreviation (e.g., "PLN")';


