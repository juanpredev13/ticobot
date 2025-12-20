-- =============================================================================
-- Remove expiration from all comparisons_cache entries
-- =============================================================================
-- This script sets expires_at to NULL for all entries, making them never expire

UPDATE comparisons_cache
SET expires_at = NULL
WHERE expires_at IS NOT NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE expires_at IS NULL) as never_expire,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as still_expire
FROM comparisons_cache;

