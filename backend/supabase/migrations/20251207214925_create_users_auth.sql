-- ============================================
-- TicoBot User Authentication Schema
-- Migration: 002_create_users_auth
-- ============================================

-- Step 1: Create user tier enum
CREATE TYPE user_tier AS ENUM ('free', 'premium', 'admin');

-- Step 2: Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  tier user_tier DEFAULT 'free' NOT NULL,
  query_count_today INTEGER DEFAULT 0,
  last_query_date DATE,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Step 5: Add trigger for users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create function to reset daily query count
CREATE OR REPLACE FUNCTION reset_query_count_if_needed(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  last_query_date_val DATE;
BEGIN
  SELECT last_query_date INTO last_query_date_val
  FROM users
  WHERE id = user_id_param;

  IF last_query_date_val IS NULL OR last_query_date_val < current_date_val THEN
    UPDATE users
    SET query_count_today = 0,
        last_query_date = current_date_val
    WHERE id = user_id_param;
  END IF;
END;
$$;

-- Step 7: Create function to increment query count
CREATE OR REPLACE FUNCTION increment_query_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Reset count if needed
  PERFORM reset_query_count_if_needed(user_id_param);

  -- Increment and return new count
  UPDATE users
  SET query_count_today = query_count_today + 1
  WHERE id = user_id_param
  RETURNING query_count_today INTO new_count;

  RETURN new_count;
END;
$$;

-- Step 8: Create function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(user_id_param UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  tier user_tier
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_tier_val user_tier;
  user_count INTEGER;
  limit_val INTEGER;
BEGIN
  -- Reset count if needed
  PERFORM reset_query_count_if_needed(user_id_param);

  -- Get user info
  SELECT u.tier, u.query_count_today
  INTO user_tier_val, user_count
  FROM users u
  WHERE u.id = user_id_param;

  -- Determine limit based on tier
  IF user_tier_val = 'free' THEN
    limit_val := 10;
  ELSE
    limit_val := -1; -- unlimited
  END IF;

  -- Return result
  RETURN QUERY SELECT
    (user_tier_val != 'free' OR user_count < limit_val) as allowed,
    user_count as current_count,
    limit_val as limit_count,
    user_tier_val as tier;
END;
$$;

-- Step 9: Create function to revoke refresh token
CREATE OR REPLACE FUNCTION revoke_refresh_token(token_param TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE refresh_tokens
  SET is_revoked = true,
      revoked_at = NOW()
  WHERE token = token_param;
END;
$$;

-- Step 10: Create function to clean expired tokens (for maintenance)
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() OR is_revoked = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Step 11: Grant permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION reset_query_count_if_needed TO authenticated;
GRANT EXECUTE ON FUNCTION increment_query_count TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_refresh_token TO authenticated;
GRANT EXECUTE ON FUNCTION clean_expired_tokens TO authenticated;

-- Step 12: Create admin user (optional, for testing)
-- Password: admin123 (hashed with bcrypt, rounds=10)
-- IMPORTANT: Change this password in production!
INSERT INTO users (email, password_hash, name, tier, email_verified)
VALUES (
  'admin@ticobot.cr',
  '$2b$10$rZ8kZKvGcHqCx9YxJQxZXuQN7vZN7bQvK6nPHxZyO5YxJQxZXuQN7u', -- admin123
  'Admin User',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Step 13: Create indexes for soft deletes and active users
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens(is_revoked, expires_at)
WHERE is_revoked = false AND expires_at > NOW();
