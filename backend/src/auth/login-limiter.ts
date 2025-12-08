/**
 * Login Rate Limiter
 *
 * Protects against brute force attacks by:
 * - Limiting failed login attempts per email (5 attempts)
 * - Limiting failed login attempts per IP (10 attempts)
 * - 15-minute lockout period after exceeding limits
 * - Automatic cleanup of old attempts
 *
 * NOTE: In production, use Redis for distributed rate limiting
 */

interface LoginAttempt {
  email: string;
  ip: string;
  timestamp: Date;
  success: boolean;
}

// In-memory store (use Redis in production for distributed systems)
const loginAttempts = new Map<string, LoginAttempt[]>();

const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  lockoutUntil?: Date;
  reason?: string;
}

/**
 * Check if a login attempt is allowed
 * @param email - User email
 * @param ip - Client IP address
 * @returns Rate limit result with lockout info if blocked
 */
export function checkLoginRateLimit(email: string, ip: string): RateLimitResult {
  const now = new Date();
  const emailKey = `email:${email.toLowerCase()}`;
  const ipKey = `ip:${ip}`;

  // Clean old attempts
  cleanOldAttempts();

  // Check email-based rate limit
  const emailAttempts = loginAttempts.get(emailKey) || [];
  const recentEmailAttempts = emailAttempts.filter(
    (attempt) => now.getTime() - attempt.timestamp.getTime() < LOCKOUT_DURATION_MS
  );

  const failedEmailAttempts = recentEmailAttempts.filter((a) => !a.success).length;

  if (failedEmailAttempts >= MAX_ATTEMPTS_PER_EMAIL) {
    const oldestFailedAttempt = recentEmailAttempts.find((a) => !a.success);
    if (oldestFailedAttempt) {
      const lockoutUntil = new Date(
        oldestFailedAttempt.timestamp.getTime() + LOCKOUT_DURATION_MS
      );

      return {
        allowed: false,
        lockoutUntil,
        reason: `Too many failed login attempts for this account. Please try again after ${lockoutUntil.toLocaleTimeString()}`,
      };
    }
  }

  // Check IP-based rate limit
  const ipAttempts = loginAttempts.get(ipKey) || [];
  const recentIpAttempts = ipAttempts.filter(
    (attempt) => now.getTime() - attempt.timestamp.getTime() < LOCKOUT_DURATION_MS
  );

  const failedIpAttempts = recentIpAttempts.filter((a) => !a.success).length;

  if (failedIpAttempts >= MAX_ATTEMPTS_PER_IP) {
    const oldestFailedAttempt = recentIpAttempts.find((a) => !a.success);
    if (oldestFailedAttempt) {
      const lockoutUntil = new Date(
        oldestFailedAttempt.timestamp.getTime() + LOCKOUT_DURATION_MS
      );

      return {
        allowed: false,
        lockoutUntil,
        reason: `Too many failed login attempts from this IP address. Please try again after ${lockoutUntil.toLocaleTimeString()}`,
      };
    }
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS_PER_EMAIL - failedEmailAttempts,
  };
}

/**
 * Record a login attempt
 * @param email - User email
 * @param ip - Client IP address
 * @param success - Whether the login was successful
 */
export function recordLoginAttempt(email: string, ip: string, success: boolean): void {
  const now = new Date();
  const emailKey = `email:${email.toLowerCase()}`;
  const ipKey = `ip:${ip}`;

  const attempt: LoginAttempt = {
    email,
    ip,
    timestamp: now,
    success,
  };

  // Record for email
  const emailAttempts = loginAttempts.get(emailKey) || [];
  emailAttempts.push(attempt);
  loginAttempts.set(emailKey, emailAttempts);

  // Record for IP
  const ipAttempts = loginAttempts.get(ipKey) || [];
  ipAttempts.push(attempt);
  loginAttempts.set(ipKey, ipAttempts);
}

/**
 * Clear all login attempts for a user (call on successful login)
 * @param email - User email
 */
export function clearLoginAttempts(email: string): void {
  const emailKey = `email:${email.toLowerCase()}`;
  loginAttempts.delete(emailKey);
}

/**
 * Get current stats for monitoring (admin only)
 */
export function getLoginStats() {
  const stats = {
    totalKeys: loginAttempts.size,
    emailKeys: 0,
    ipKeys: 0,
    totalAttempts: 0,
    failedAttempts: 0,
  };

  for (const [key, attempts] of loginAttempts.entries()) {
    if (key.startsWith('email:')) stats.emailKeys++;
    if (key.startsWith('ip:')) stats.ipKeys++;

    stats.totalAttempts += attempts.length;
    stats.failedAttempts += attempts.filter(a => !a.success).length;
  }

  return stats;
}

/**
 * Clean attempts older than lockout duration
 * Runs automatically during rate limit checks
 */
function cleanOldAttempts(): void {
  const now = new Date();
  const cutoff = now.getTime() - LOCKOUT_DURATION_MS;

  for (const [key, attempts] of loginAttempts.entries()) {
    const recentAttempts = attempts.filter(
      (attempt) => attempt.timestamp.getTime() > cutoff
    );

    if (recentAttempts.length === 0) {
      loginAttempts.delete(key);
    } else if (recentAttempts.length < attempts.length) {
      loginAttempts.set(key, recentAttempts);
    }
  }
}

/**
 * Force cleanup (can be called periodically by a cron job)
 */
export function forceCleanup(): void {
  cleanOldAttempts();
}
