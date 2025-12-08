-- ============================================
-- TicoBot Security Audit Logs
-- Migration: 003_create_audit_logs
-- ============================================

-- Step 1: Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('auth', 'query', 'admin', 'security')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_critical ON audit_logs(severity) WHERE severity = 'critical';

-- Step 3: Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  user_id_param UUID,
  event_type_param TEXT,
  event_category_param TEXT,
  severity_param TEXT,
  ip_address_param TEXT,
  user_agent_param TEXT,
  details_param JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  log_id UUID;
  ip_inet INET;
BEGIN
  -- Convert IP string to INET type (handle invalid IPs gracefully)
  BEGIN
    ip_inet := ip_address_param::INET;
  EXCEPTION
    WHEN OTHERS THEN
      ip_inet := NULL;
  END;

  INSERT INTO audit_logs (
    user_id,
    event_type,
    event_category,
    severity,
    ip_address,
    user_agent,
    details
  )
  VALUES (
    user_id_param,
    event_type_param,
    event_category_param,
    severity_param,
    ip_inet,
    user_agent_param,
    COALESCE(details_param, '{}'::jsonb)
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Step 4: Create function to get recent critical events (admin dashboard)
CREATE OR REPLACE FUNCTION get_recent_critical_events(limit_param INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  event_type TEXT,
  event_category TEXT,
  severity TEXT,
  ip_address INET,
  details JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    u.email as user_email,
    al.event_type,
    al.event_category,
    al.severity,
    al.ip_address,
    al.details,
    al.created_at
  FROM audit_logs al
  LEFT JOIN users u ON al.user_id = u.id
  WHERE al.severity IN ('critical', 'error')
  ORDER BY al.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Step 5: Create function to get user activity log
CREATE OR REPLACE FUNCTION get_user_activity(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  event_category TEXT,
  severity TEXT,
  ip_address INET,
  details JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.event_type,
    al.event_category,
    al.severity,
    al.ip_address,
    al.details,
    al.created_at
  FROM audit_logs al
  WHERE al.user_id = user_id_param
  ORDER BY al.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Step 6: Create function to clean old audit logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION clean_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND severity NOT IN ('critical'); -- Keep critical events longer

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Step 7: Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_critical_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION clean_old_audit_logs TO authenticated;

-- Step 8: Add comment documentation
COMMENT ON TABLE audit_logs IS 'Security audit log for tracking authentication events, security incidents, and admin actions';
COMMENT ON COLUMN audit_logs.event_category IS 'auth: authentication events, query: API queries, admin: admin actions, security: security incidents';
COMMENT ON COLUMN audit_logs.severity IS 'info: normal operations, warning: suspicious activity, error: failures, critical: security breaches';
COMMENT ON FUNCTION log_audit_event IS 'Log a security audit event with user, IP, and details';
COMMENT ON FUNCTION get_recent_critical_events IS 'Get recent critical/error events for admin dashboard';
COMMENT ON FUNCTION get_user_activity IS 'Get activity log for a specific user';
COMMENT ON FUNCTION clean_old_audit_logs IS 'Clean audit logs older than specified days (keeps critical events)';
