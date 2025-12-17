-- Migration: Create chat cache table
-- Date: 2025-01-15
-- Description: Cache chat responses to avoid expensive RAG processing on frequent questions

-- =============================================================================
-- CHAT CACHE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS chat_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  party TEXT, -- Optional party filter
  question_hash TEXT NOT NULL, -- Hash of question for quick lookup
  cache_key_hash TEXT NOT NULL, -- Hash of question + party + params for unique cache key
  answer TEXT NOT NULL, -- Cached answer
  sources JSONB DEFAULT '[]'::jsonb, -- Cached sources
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (processing time, tokens, model, etc.)
  expires_at TIMESTAMPTZ, -- Optional expiration (NULL = never expires)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: same question + same params = same result
  UNIQUE(question_hash, cache_key_hash)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_cache_question_hash ON chat_cache(question_hash);
CREATE INDEX IF NOT EXISTS idx_chat_cache_cache_key_hash ON chat_cache(cache_key_hash);
CREATE INDEX IF NOT EXISTS idx_chat_cache_composite ON chat_cache(question_hash, cache_key_hash);
CREATE INDEX IF NOT EXISTS idx_chat_cache_expires_at ON chat_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_cache_party ON chat_cache(party) WHERE party IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_chat_cache_updated_at ON chat_cache;
CREATE TRIGGER update_chat_cache_updated_at
  BEFORE UPDATE ON chat_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate hash from question
CREATE OR REPLACE FUNCTION hash_question(question_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Normalize: lowercase, trim, remove extra spaces
  RETURN encode(digest(lower(trim(regexp_replace(question_text, '\s+', ' ', 'g'))), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments
COMMENT ON TABLE chat_cache IS 'Cache for chat responses to improve performance on frequent questions';
COMMENT ON COLUMN chat_cache.question_hash IS 'SHA256 hash of normalized question for fast lookup';
COMMENT ON COLUMN chat_cache.cache_key_hash IS 'SHA256 hash of question + party + params for unique cache key';
COMMENT ON COLUMN chat_cache.answer IS 'Cached answer text';
COMMENT ON COLUMN chat_cache.sources IS 'Cached sources JSON matching API response format';
COMMENT ON COLUMN chat_cache.expires_at IS 'Optional expiration time. NULL means cache never expires';

