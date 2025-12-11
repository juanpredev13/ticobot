-- Migration: Create parties and candidates tables
-- Date: 2025-12-11
-- Description: Add structured data tables for political parties and presidential candidates

-- =============================================================================
-- PARTIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT,
  slug TEXT NOT NULL UNIQUE,
  founded_year INTEGER,
  ideology TEXT[],
  colors JSONB NOT NULL, -- { "primary": "#hex", "secondary": "#hex" }
  logo_url TEXT,
  description TEXT,
  website TEXT,
  social_media JSONB, -- { "twitter": "url", "facebook": "url", "instagram": "url" }
  current_representation JSONB, -- { "deputies": number, "mayors": number }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for parties
CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
CREATE INDEX IF NOT EXISTS idx_parties_abbreviation ON parties(abbreviation);
CREATE INDEX IF NOT EXISTS idx_parties_slug ON parties(slug);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_parties_updated_at ON parties;
CREATE TRIGGER update_parties_updated_at
  BEFORE UPDATE ON parties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CANDIDATES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL, -- "Presidente", "Vicepresidente"
  photo_url TEXT,
  birth_date DATE,
  birth_place TEXT,
  education TEXT[],
  professional_experience TEXT[],
  political_experience TEXT[],
  biography TEXT,
  proposals JSONB, -- [{ "topic": "string", "description": "string" }]
  social_media JSONB, -- { "twitter": "url", "facebook": "url", "instagram": "url" }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_party_id ON candidates(party_id);
CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates(name);
CREATE INDEX IF NOT EXISTS idx_candidates_slug ON candidates(slug);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UPDATE DOCUMENTS TABLE
-- =============================================================================

-- Add party_id foreign key to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id) ON DELETE SET NULL;

-- Index for party_id in documents
CREATE INDEX IF NOT EXISTS idx_documents_party_id ON documents(party_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE parties IS 'Political parties for Costa Rica 2026 elections';
COMMENT ON TABLE candidates IS 'Presidential and vice-presidential candidates for Costa Rica 2026';

COMMENT ON COLUMN parties.slug IS 'URL-friendly identifier (e.g., "pln", "pusc")';
COMMENT ON COLUMN parties.colors IS 'Party official colors in hex format';
COMMENT ON COLUMN parties.ideology IS 'Political ideologies (e.g., ["Socialdemocracia", "Centro-izquierda"])';
COMMENT ON COLUMN parties.current_representation IS 'Current seats in Assembly and municipalities';

COMMENT ON COLUMN candidates.position IS 'Presidential or vice-presidential candidate';
COMMENT ON COLUMN candidates.photo_url IS 'URL to candidate photo in Supabase Storage';
COMMENT ON COLUMN candidates.proposals IS 'Key campaign proposals by topic';
