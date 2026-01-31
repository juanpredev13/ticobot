-- Migration: Create analytics tables for UTM tracking and user activity
-- Used for tracking social media campaigns, conversions, and user behavior

-- Table for UTM visit tracking
CREATE TABLE IF NOT EXISTS utm_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  visit_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for custom analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_data JSONB,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referrer TEXT,
  ip_address INET,
  user_agent TEXT,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for social media conversions tracking
CREATE TABLE IF NOT EXISTS social_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- instagram, x, linkedin, threads
  action TEXT NOT NULL, -- follow, click, share, signup
  user_id UUID REFERENCES users(id),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  conversion_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_utm_visits_source ON utm_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_utm_visits_timestamp ON utm_visits(visit_timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_social_conversions_platform ON social_conversions(platform);
CREATE INDEX IF NOT EXISTS idx_social_conversions_user_id ON social_conversions(user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON utm_visits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON social_conversions TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;