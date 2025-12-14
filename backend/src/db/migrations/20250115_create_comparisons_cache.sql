-- Migration: Create comparisons cache table
-- Date: 2025-01-15
-- Description: Cache pre-computed comparisons to avoid expensive RAG processing on every request

-- =============================================================================
-- COMPARISONS CACHE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS comparisons_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  party_ids TEXT[] NOT NULL, -- Array of party slugs/IDs
  topic_hash TEXT NOT NULL, -- Hash of topic for quick lookup
  party_ids_hash TEXT NOT NULL, -- Hash of sorted party IDs for quick lookup
  comparisons JSONB NOT NULL, -- Full comparison result
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (processing time, etc.)
  expires_at TIMESTAMPTZ, -- Optional expiration (NULL = never expires)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: same topic + same parties = same result
  UNIQUE(topic_hash, party_ids_hash)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_comparisons_cache_topic_hash ON comparisons_cache(topic_hash);
CREATE INDEX IF NOT EXISTS idx_comparisons_cache_party_ids_hash ON comparisons_cache(party_ids_hash);
CREATE INDEX IF NOT EXISTS idx_comparisons_cache_composite ON comparisons_cache(topic_hash, party_ids_hash);
CREATE INDEX IF NOT EXISTS idx_comparisons_cache_expires_at ON comparisons_cache(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_comparisons_cache_updated_at ON comparisons_cache;
CREATE TRIGGER update_comparisons_cache_updated_at
  BEFORE UPDATE ON comparisons_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate hash from topic
CREATE OR REPLACE FUNCTION hash_topic(topic_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Normalize: lowercase, trim, remove extra spaces
  RETURN encode(digest(lower(trim(regexp_replace(topic_text, '\s+', ' ', 'g'))), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate hash from party IDs array
CREATE OR REPLACE FUNCTION hash_party_ids(party_ids_array TEXT[])
RETURNS TEXT AS $$
BEGIN
  -- Sort array and hash it for consistent comparison
  RETURN encode(digest(array_to_string(ARRAY(SELECT unnest(party_ids_array) ORDER BY 1), ','), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments
COMMENT ON TABLE comparisons_cache IS 'Cache for pre-computed proposal comparisons to improve performance';
COMMENT ON COLUMN comparisons_cache.topic_hash IS 'SHA256 hash of normalized topic for fast lookup';
COMMENT ON COLUMN comparisons_cache.party_ids_hash IS 'SHA256 hash of sorted party IDs for fast lookup';
COMMENT ON COLUMN comparisons_cache.comparisons IS 'Full comparison result JSON matching API response format';
COMMENT ON COLUMN comparisons_cache.expires_at IS 'Optional expiration time. NULL means cache never expires';

