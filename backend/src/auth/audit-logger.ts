/**
 * Security Audit Logger
 *
 * Logs security-relevant events to the database for:
 * - Compliance (GDPR, SOC 2, etc.)
 * - Security monitoring and incident response
 * - User activity tracking
 * - Forensic analysis
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { Request } from 'express';

const supabase = createClient(
  env.SUPABASE_URL ?? '',
  env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

export type EventCategory = 'auth' | 'query' | 'admin' | 'security';
export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditEventDetail = string | number | boolean | null | undefined;

export interface AuditLogEvent {
  userId?: string;
  eventType: string;
  category: EventCategory;
  severity: EventSeverity;
  details?: Record<string, AuditEventDetail>;
}

/**
 * Log a security audit event
 * @param event - The audit event to log
 * @param req - Optional Express request object for IP and user agent
 */
export async function logAuditEvent(
  event: AuditLogEvent,
  req?: Request
): Promise<void> {
  const ip = req?.ip || req?.socket.remoteAddress || null;
  const userAgent = req?.headers['user-agent'] || null;

  try {
    await supabase.rpc('log_audit_event', {
      user_id_param: event.userId || null,
      event_type_param: event.eventType,
      event_category_param: event.category,
      severity_param: event.severity,
      ip_address_param: ip,
      user_agent_param: userAgent,
      details_param: event.details || {},
    });
  } catch (error) {
    // Log to console if database logging fails (don't throw to avoid breaking the app)
    console.error('[AUDIT LOG ERROR]', {
      error,
      event,
      ip,
      userAgent,
    });
  }
}

/**
 * Convenience functions for common audit events
 */
export const auditLog = {
  /**
   * Log successful login
   */
  loginSuccess: async (userId: string, email: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: 'login_success',
        category: 'auth',
        severity: 'info',
        details: { email },
      },
      req
    );
  },

  /**
   * Log failed login attempt
   */
  loginFailure: async (email: string, reason: string, req: Request) => {
    await logAuditEvent(
      {
        eventType: 'login_failure',
        category: 'auth',
        severity: 'warning',
        details: { email, reason },
      },
      req
    );
  },

  /**
   * Log user registration
   */
  userRegistered: async (userId: string, email: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: 'user_registered',
        category: 'auth',
        severity: 'info',
        details: { email },
      },
      req
    );
  },

  /**
   * Log token refresh
   */
  tokenRefreshed: async (userId: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: 'token_refreshed',
        category: 'auth',
        severity: 'info',
      },
      req
    );
  },

  /**
   * Log token reuse detection (critical security event)
   */
  tokenReuse: async (userId: string, email: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: 'token_reuse_detected',
        category: 'security',
        severity: 'critical',
        details: {
          email,
          message: 'Potential security breach: revoked token was reused',
          action: 'All user tokens revoked',
        },
      },
      req
    );
  },

  /**
   * Log logout
   */
  logout: async (userId: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: 'logout',
        category: 'auth',
        severity: 'info',
      },
      req
    );
  },

  /**
   * Log rate limit exceeded
   */
  rateLimitExceeded: async (userId: string, endpoint: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: 'rate_limit_exceeded',
        category: 'security',
        severity: 'warning',
        details: { endpoint },
      },
      req
    );
  },

  /**
   * Log brute force attempt detected
   */
  bruteForceAttempt: async (email: string, req: Request) => {
    await logAuditEvent(
      {
        eventType: 'brute_force_detected',
        category: 'security',
        severity: 'critical',
        details: {
          email,
          message: 'Multiple failed login attempts detected',
        },
      },
      req
    );
  },

  /**
   * Log password change
   */
  passwordChanged: async (userId: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: 'password_changed',
        category: 'auth',
        severity: 'info',
      },
      req
    );
  },

  /**
   * Log admin action
   */
  adminAction: async (
    userId: string,
    action: string,
    details: Record<string, AuditEventDetail>,
    req: Request
  ): Promise<void> => {
    await logAuditEvent(
      {
        userId,
        eventType: `admin_${action}`,
        category: 'admin',
        severity: 'info',
        details,
      },
      req
    );
  },

  /**
   * Log query execution
   */
  query: async (userId: string, queryType: string, req: Request) => {
    await logAuditEvent(
      {
        userId,
        eventType: `query_${queryType}`,
        category: 'query',
        severity: 'info',
      },
      req
    );
  },

  /**
   * Log unauthorized access attempt
   */
  unauthorizedAccess: async (endpoint: string, reason: string, req: Request) => {
    await logAuditEvent(
      {
        eventType: 'unauthorized_access',
        category: 'security',
        severity: 'warning',
        details: { endpoint, reason },
      },
      req
    );
  },
};

/**
 * Get recent critical events (for admin dashboard)
 */
export async function getRecentCriticalEvents(limit = 50): Promise<unknown[]> {
  const { data, error } = await supabase.rpc('get_recent_critical_events', {
    limit_param: limit,
  });

  if (error) {
    console.error('[AUDIT LOG] Error fetching critical events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user activity log
 */
export async function getUserActivity(userId: string, limit = 100): Promise<unknown[]> {
  const { data, error } = await supabase.rpc('get_user_activity', {
    user_id_param: userId,
    limit_param: limit,
  });

  if (error) {
    console.error('[AUDIT LOG] Error fetching user activity:', error);
    return [];
  }

  return data || [];
}

/**
 * Simplified log event function for quick logging
 * @param category - Event category
 * @param severity - Event severity
 * @param eventType - Description of the event
 * @param details - Additional event details
 */
export async function logEvent(
  category: EventCategory,
  severity: EventSeverity,
  eventType: string,
  details?: Record<string, AuditEventDetail>
): Promise<void> {
  await logAuditEvent({
    category,
    severity,
    eventType,
    details,
  });
}
