# JWT Authentication - Security Best Practices Addendum

## Overview

This document complements the JWT Authentication Implementation Guide with critical security enhancements and production-ready hardening measures.

**Related Guide**: `JWT_AUTHENTICATION_IMPLEMENTATION_GUIDE.md`
**Priority**: HIGH - Implement before production deployment
**Last Updated**: 2025-12-08

---

## Table of Contents

1. [Critical Security Fixes](#critical-security-fixes)
2. [Enhanced Password Security](#enhanced-password-security)
3. [Brute Force Protection](#brute-force-protection)
4. [Token Security Improvements](#token-security-improvements)
5. [Email Verification Flow](#email-verification-flow)
6. [Audit Logging](#audit-logging)
7. [Production Checklist](#production-checklist)

---

## Critical Security Fixes

### 1. Remove Hardcoded Admin Credentials 🔴 CRITICAL

**Current Issue**: Migration has hardcoded admin password publicly visible in code.

**Fix**: Remove from migration and create via secure setup script.

**Update `backend/supabase/migrations/20251207214925_create_users_auth.sql`**:

```sql
-- REMOVE these lines (171-181):
-- INSERT INTO users (email, password_hash, name, tier, email_verified)
-- VALUES (
--   'admin@ticobot.cr',
--   '$2b$10$rZ8kZKvGcHqCx9YxJQxZXuQN7vZN7bQvK6nPHxZyO5YxJQxZXuQN7u',
--   'Admin User',
--   'admin',
--   true
-- )
-- ON CONFLICT (email) DO NOTHING;
```

**Create `backend/scripts/create-admin.ts`**:

```typescript
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../src/auth/password.utils.js';
import { env } from '../src/config/env.js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function createAdminUser() {
  console.log('🔐 TicoBot Admin User Creation\n');

  const email = await question('Admin email: ');
  const password = await question('Admin password (min 12 chars): ', true);
  const confirmPassword = await question('Confirm password: ', true);

  if (password !== confirmPassword) {
    console.error('❌ Passwords do not match');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ Password must be at least 12 characters');
    process.exit(1);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      name: 'Admin User',
      tier: 'admin',
      email_verified: true,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }

  console.log(`✅ Admin user created: ${data.email}`);
  process.exit(0);
}

function question(prompt: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    if (hidden) {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      let password = '';
      process.stdout.write(prompt);

      stdin.on('data', (char: string) => {
        char = char.toString('utf8');

        if (char === '\n' || char === '\r' || char === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          resolve(password);
        } else if (char === '\u0003') {
          process.exit(1);
        } else if (char === '\u007f') {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(prompt + '*'.repeat(password.length));
        } else {
          password += char;
          process.stdout.write('*');
        }
      });
    } else {
      rl.question(prompt, resolve);
    }
  });
}

createAdminUser();
```

**Add to `backend/package.json`**:

```json
{
  "scripts": {
    "admin:create": "tsx scripts/create-admin.ts"
  }
}
```

---

## Enhanced Password Security

### 2. Implement Strong Password Validation

**Create `backend/src/auth/password-validator.ts`**:

```typescript
import zxcvbn from 'zxcvbn';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  score: number; // 0-4 (zxcvbn score)
  suggestions: string[];
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  'qwerty',
  'admin123',
  'letmein',
  'welcome',
  'monkey123',
  'dragon',
  'master',
]);

export function validatePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Length check
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Common password check
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
  }

  // Complexity checks
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let complexityCount = 0;
  if (hasUpperCase) complexityCount++;
  if (hasLowerCase) complexityCount++;
  if (hasNumbers) complexityCount++;
  if (hasSpecialChars) complexityCount++;

  if (complexityCount < 3) {
    errors.push(
      'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters'
    );
    if (!hasUpperCase) suggestions.push('Add uppercase letters');
    if (!hasLowerCase) suggestions.push('Add lowercase letters');
    if (!hasNumbers) suggestions.push('Add numbers');
    if (!hasSpecialChars) suggestions.push('Add special characters');
  }

  // Use zxcvbn for advanced strength testing
  const result = zxcvbn(password, userInputs);

  if (result.score < 3) {
    errors.push('Password is too weak');
    suggestions.push(...result.feedback.suggestions);
    if (result.feedback.warning) {
      suggestions.push(result.feedback.warning);
    }
  }

  // Sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push('Avoid sequential characters (e.g., abc, 123)');
  }

  // Repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Avoid repeated characters (e.g., aaa, 111)');
  }

  return {
    valid: errors.length === 0,
    errors,
    score: result.score,
    suggestions,
  };
}
```

**Install dependency**:

```bash
cd backend
pnpm add zxcvbn
pnpm add -D @types/zxcvbn
```

**Update registration endpoint** (`backend/src/api/routes/auth.ts`):

```typescript
import { validatePasswordStrength } from '../../auth/password-validator.js';

// In register endpoint, before hashing:
const passwordValidation = validatePasswordStrength(body.password, [
  body.email,
  body.name || '',
]);

if (!passwordValidation.valid) {
  return res.status(400).json({
    error: 'Weak Password',
    message: 'Password does not meet security requirements',
    details: passwordValidation.errors,
    suggestions: passwordValidation.suggestions,
  });
}
```

---

## Brute Force Protection

### 3. Implement Login Rate Limiting

**Create `backend/src/auth/login-limiter.ts`**:

```typescript
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

interface LoginAttempt {
  email: string;
  ip: string;
  timestamp: Date;
  success: boolean;
}

// In-memory store (use Redis in production)
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
 * Check if login attempt is allowed
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
    const lockoutUntil = new Date(
      oldestFailedAttempt!.timestamp.getTime() + LOCKOUT_DURATION_MS
    );

    return {
      allowed: false,
      lockoutUntil,
      reason: `Too many failed login attempts. Account locked until ${lockoutUntil.toISOString()}`,
    };
  }

  // Check IP-based rate limit
  const ipAttempts = loginAttempts.get(ipKey) || [];
  const recentIpAttempts = ipAttempts.filter(
    (attempt) => now.getTime() - attempt.timestamp.getTime() < LOCKOUT_DURATION_MS
  );

  const failedIpAttempts = recentIpAttempts.filter((a) => !a.success).length;

  if (failedIpAttempts >= MAX_ATTEMPTS_PER_IP) {
    const oldestFailedAttempt = recentIpAttempts.find((a) => !a.success);
    const lockoutUntil = new Date(
      oldestFailedAttempt!.timestamp.getTime() + LOCKOUT_DURATION_MS
    );

    return {
      allowed: false,
      lockoutUntil,
      reason: `Too many failed login attempts from this IP. Locked until ${lockoutUntil.toISOString()}`,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS_PER_EMAIL - failedEmailAttempts,
  };
}

/**
 * Record login attempt
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
 * Clear successful login attempts (reset counter on success)
 */
export function clearLoginAttempts(email: string): void {
  const emailKey = `email:${email.toLowerCase()}`;
  loginAttempts.delete(emailKey);
}

/**
 * Clean attempts older than lockout duration
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
    } else {
      loginAttempts.set(key, recentAttempts);
    }
  }
}
```

**Update login endpoint** (`backend/src/api/routes/auth.ts`):

```typescript
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  clearLoginAttempts,
} from '../../auth/login-limiter.js';

// In login endpoint, before password verification:
const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

// Check rate limit
const rateLimit = checkLoginRateLimit(body.email, clientIp);
if (!rateLimit.allowed) {
  return res.status(429).json({
    error: 'Too Many Requests',
    message: rateLimit.reason,
    lockoutUntil: rateLimit.lockoutUntil,
  });
}

// ... existing password verification ...

// On failed login:
recordLoginAttempt(body.email, clientIp, false);

// On successful login:
recordLoginAttempt(body.email, clientIp, true);
clearLoginAttempts(body.email);
```

---

## Token Security Improvements

### 4. Implement Token Rotation & Reuse Detection

**Update `backend/src/auth/token.repository.ts`**:

```typescript
/**
 * Find token with user info for reuse detection
 */
async findByTokenWithUser(token: string): Promise<(RefreshToken & { user_id: string }) | null> {
  const { data, error } = await this.supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as RefreshToken & { user_id: string };
}

/**
 * Detect token reuse (security breach indicator)
 */
async detectTokenReuse(token: string): Promise<boolean> {
  const tokenRecord = await this.findByTokenWithUser(token);

  if (!tokenRecord) return false;

  // If token is revoked but someone tries to use it = potential breach
  return tokenRecord.is_revoked === true;
}
```

**Update refresh endpoint** (`backend/src/api/routes/auth.ts`):

```typescript
// In refresh endpoint, after verifying JWT:

// SECURITY: Check for token reuse (indicates compromise)
const isReused = await tokenRepo.detectTokenReuse(body.refreshToken);
if (isReused) {
  // Revoke ALL tokens for this user (potential breach)
  await tokenRepo.revokeAllForUser(payload.userId);

  // Log security event
  console.error('[SECURITY] Token reuse detected:', {
    userId: payload.userId,
    email: payload.email,
    timestamp: new Date().toISOString(),
  });

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Security breach detected. All sessions have been terminated. Please login again.',
  });
}
```

### 5. Add Token Fingerprinting

**Create `backend/src/auth/token-fingerprint.ts`**:

```typescript
import crypto from 'crypto';

export function generateTokenFingerprint(req: Request): string {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.socket.remoteAddress || '';

  // Create fingerprint from user agent + IP (partial)
  const ipPrefix = ip.split('.').slice(0, 3).join('.'); // Keep some privacy
  const fingerprint = `${userAgent}:${ipPrefix}`;

  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

export function validateTokenFingerprint(
  storedFingerprint: string,
  currentFingerprint: string
): boolean {
  return storedFingerprint === currentFingerprint;
}
```

**Add fingerprint to token storage**:

Update refresh_tokens table:

```sql
-- Add migration: backend/supabase/migrations/20251208_add_token_fingerprint.sql
ALTER TABLE refresh_tokens
ADD COLUMN fingerprint TEXT;

CREATE INDEX idx_refresh_tokens_fingerprint ON refresh_tokens(fingerprint);
```

---

## Email Verification Flow

### 6. Implement Email Verification

**Create `backend/src/auth/email-verification.ts`**:

```typescript
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  console.log(`📧 Verification email for ${email}:`);
  console.log(`   URL: ${verificationUrl}`);

  // In production, use actual email service:
  // await emailService.send({
  //   to: email,
  //   subject: 'Verify your TicoBot account',
  //   html: `<a href="${verificationUrl}">Click here to verify</a>`,
  // });
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  // TODO: Implement verification token storage and validation
  // For now, this is a placeholder
  return true;
}
```

---

## Audit Logging

### 7. Implement Security Audit Logs

**Create migration `backend/supabase/migrations/20251208_create_audit_logs.sql`**:

```sql
-- Security audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'auth', 'query', 'admin', 'security'
  severity TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  user_id_param UUID,
  event_type_param TEXT,
  event_category_param TEXT,
  severity_param TEXT,
  ip_address_param INET,
  user_agent_param TEXT,
  details_param JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  log_id UUID;
BEGIN
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
    ip_address_param,
    user_agent_param,
    details_param
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;
```

**Create `backend/src/auth/audit-logger.ts`**:

```typescript
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { Request } from 'express';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export type EventCategory = 'auth' | 'query' | 'admin' | 'security';
export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEvent {
  userId?: string;
  eventType: string;
  category: EventCategory;
  severity: EventSeverity;
  details?: Record<string, any>;
}

export async function logAuditEvent(
  event: AuditLogEvent,
  req?: Request
): Promise<void> {
  const ip = req?.ip || req?.socket.remoteAddress;
  const userAgent = req?.headers['user-agent'];

  try {
    await supabase.rpc('log_audit_event', {
      user_id_param: event.userId || null,
      event_type_param: event.eventType,
      event_category_param: event.category,
      severity_param: event.severity,
      ip_address_param: ip || null,
      user_agent_param: userAgent || null,
      details_param: event.details || {},
    });
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error);
  }
}

// Convenience functions
export const auditLog = {
  loginSuccess: (userId: string, req: Request) =>
    logAuditEvent(
      {
        userId,
        eventType: 'login_success',
        category: 'auth',
        severity: 'info',
      },
      req
    ),

  loginFailure: (email: string, reason: string, req: Request) =>
    logAuditEvent(
      {
        eventType: 'login_failure',
        category: 'auth',
        severity: 'warning',
        details: { email, reason },
      },
      req
    ),

  tokenReuse: (userId: string, req: Request) =>
    logAuditEvent(
      {
        userId,
        eventType: 'token_reuse_detected',
        category: 'security',
        severity: 'critical',
        details: { message: 'Potential security breach' },
      },
      req
    ),

  rateLimitExceeded: (userId: string, req: Request) =>
    logAuditEvent(
      {
        userId,
        eventType: 'rate_limit_exceeded',
        category: 'security',
        severity: 'warning',
      },
      req
    ),

  passwordChange: (userId: string, req: Request) =>
    logAuditEvent(
      {
        userId,
        eventType: 'password_changed',
        category: 'auth',
        severity: 'info',
      },
      req
    ),
};
```

---

## Production Checklist

### Security Checklist Before Deployment

#### Environment & Configuration
- [ ] `JWT_SECRET` is cryptographically secure (min 32 chars)
- [ ] `JWT_SECRET` is different in dev/staging/production
- [ ] All secrets stored in environment variables (never in code)
- [ ] `.env` files are in `.gitignore`
- [ ] `BCRYPT_ROUNDS` set to 12 for production (10 for dev)
- [ ] HTTPS enforced in production
- [ ] CORS configured properly (no `*` wildcard in production)

#### Authentication & Authorization
- [ ] Admin credentials removed from migrations
- [ ] Admin account created via secure script
- [ ] Password strength validation enabled (12+ chars, complexity)
- [ ] Brute force protection active (rate limiting)
- [ ] Login lockout after failed attempts
- [ ] Token expiration times appropriate (15m access, 7d refresh)
- [ ] Token rotation on refresh implemented
- [ ] Token reuse detection active
- [ ] All sensitive endpoints require authentication

#### Database Security
- [ ] Database uses SSL/TLS connections
- [ ] Service role key never exposed to frontend
- [ ] RLS (Row Level Security) enabled on sensitive tables
- [ ] Database backups configured
- [ ] Audit logs table created and active

#### Monitoring & Logging
- [ ] Audit logging for security events enabled
- [ ] Failed login attempts logged
- [ ] Token reuse attempts logged
- [ ] Rate limit violations logged
- [ ] Log retention policy defined
- [ ] Alerting configured for critical security events

#### API Security
- [ ] Rate limiting per user tier active
- [ ] Rate limiting per IP active
- [ ] Input validation on all endpoints (Zod schemas)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize outputs)
- [ ] CSRF protection if using cookies

#### Email & Verification
- [ ] Email verification flow implemented
- [ ] Password reset flow implemented
- [ ] Email templates reviewed for phishing prevention
- [ ] Email service configured with SPF/DKIM

#### Testing
- [ ] Unit tests for auth functions passing
- [ ] Integration tests for auth flows passing
- [ ] Security testing completed (penetration testing)
- [ ] Load testing completed

#### Documentation
- [ ] API authentication documented
- [ ] Security best practices documented
- [ ] Incident response plan documented
- [ ] Admin procedures documented

---

## Additional Security Considerations

### HTTPS Enforcement

Add to `backend/src/api/server.ts`:

```typescript
// Force HTTPS in production
if (env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

### Security Headers

Install and configure helmet:

```bash
cd backend
pnpm add helmet
```

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Request Logging

```typescript
import morgan from 'morgan';

// Custom format that includes user ID
morgan.token('user-id', (req: any) => req.user?.id || 'anonymous');

app.use(morgan(':method :url :status :response-time ms - :user-id'));
```

---

## Migration Path

To implement these improvements:

1. **Phase 1 (Critical - Do First)**:
   - Remove hardcoded admin password
   - Add password strength validation
   - Implement login rate limiting

2. **Phase 2 (High Priority)**:
   - Add audit logging
   - Implement token reuse detection
   - Add security headers

3. **Phase 3 (Medium Priority)**:
   - Email verification flow
   - Token fingerprinting
   - Enhanced monitoring

4. **Phase 4 (Nice to Have)**:
   - 2FA/MFA support
   - Session management UI
   - Security dashboard

---

## Testing Security Improvements

### Test Password Validation

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "name": "Test"
  }'

# Should fail with password requirements
```

### Test Rate Limiting

```bash
# Try 6 failed logins
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done

# 6th attempt should be blocked
```

### Test Token Reuse Detection

```bash
# 1. Get tokens
TOKEN_RESPONSE=$(curl -X POST http://localhost:3001/api/auth/login ...)

# 2. Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -d '{"refreshToken": "REFRESH_TOKEN"}'

# 3. Try to reuse old refresh token (should fail)
curl -X POST http://localhost:3001/api/auth/refresh \
  -d '{"refreshToken": "OLD_REFRESH_TOKEN"}'
```

---

## Summary

This security addendum provides:

✅ Critical security fixes (hardcoded credentials)
✅ Strong password validation with zxcvbn
✅ Brute force protection with rate limiting
✅ Token rotation and reuse detection
✅ Comprehensive audit logging
✅ Production security checklist
✅ Security headers and HTTPS enforcement
✅ Testing procedures

**Status**: Ready for implementation
**Priority**: HIGH - Implement before production

---

## Questions or Issues?

For security concerns, contact the security team or create a private security issue.

**Never disclose security vulnerabilities publicly.**
