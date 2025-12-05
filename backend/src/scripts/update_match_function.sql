-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS match_chunks(vector, double precision, integer, text);

-- Update match_chunks function with new similarity threshold (0.35 instead of 0.45)
-- Lower threshold allows more results with improved chunks
CREATE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.35,
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
