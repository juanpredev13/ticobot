import { Request, Response, NextFunction } from 'express';
import { Logger } from '@ticobot/shared';
import { verifyAccessToken, JWTPayload } from '../../auth/jwt.utils.js';
import { UserRepository } from '../../auth/user.repository.js';
import { createSupabaseClient } from '../../db/supabase.js';
import { logEvent } from '../../auth/audit-logger.js';

const logger = new Logger('AuthMiddleware');

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to require authentication
 * Verifies JWT access token from Authorization header
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        error: 'Authorization header is required',
      });
      return;
    }

    // Check Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Invalid authorization format. Use: Bearer <token>',
      });
      return;
    }

    const token = parts[1];

    // Verify token
    try {
      const payload = verifyAccessToken(token);

      // Attach user info to request
      req.user = payload;

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.warn(`Token verification failed: ${errorMessage}`);

      res.status(401).json({
        error: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
    return;
  }
}

/**
 * Middleware to require admin role
 * Must be used AFTER requireAuth
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.tier !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by user ${req.user.userId}`);

    logEvent('security', 'warning', 'Unauthorized admin access attempt', {
      userId: req.user.userId,
      email: req.user.email,
      tier: req.user.tier,
      path: req.path,
      ip: req.ip,
    });

    res.status(403).json({
      error: 'Admin access required',
    });
    return;
  }

  next();
}

/**
 * Middleware to require premium or admin tier
 * Must be used AFTER requireAuth
 */
export function requirePremium(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.tier !== 'premium' && req.user.tier !== 'admin') {
    res.status(403).json({
      error: 'Premium subscription required',
      tier: req.user.tier,
    });
    return;
  }

  next();
}

/**
 * Optional auth middleware - adds user to request if token is valid
 * Does not reject requests without valid tokens
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  try {
    const token = parts[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch (error) {
    // Token invalid, but we don't reject the request
    logger.debug('Optional auth - invalid token ignored');
  }

  next();
}

/**
 * Middleware to check query rate limits
 * Must be used AFTER requireAuth
 */
export async function checkRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
      });
      return;
    }

    const supabase = createSupabaseClient();
    const userRepo = new UserRepository(supabase);

    // Check if user has exceeded daily query limit
    const hasExceeded = await userRepo.hasExceededQueryLimit(req.user.userId);

    if (hasExceeded) {
      const stats = await userRepo.getQueryStats(req.user.userId);

      logger.warn(`User ${req.user.userId} exceeded query limit`);

      await logEvent('query', 'warning', 'Query limit exceeded', {
        userId: req.user.userId,
        email: req.user.email,
        tier: req.user.tier,
        count: stats.count,
        limit: stats.limit,
        ip: req.ip,
      });

      res.status(429).json({
        error: 'Daily query limit exceeded',
        tier: req.user.tier,
        limit: stats.limit,
        used: stats.count,
        resetTime: 'Resets at midnight UTC',
      });
      return;
    }

    // Increment query count
    await userRepo.incrementQueryCount(req.user.userId);

    // Add rate limit headers
    const stats = await userRepo.getQueryStats(req.user.userId);
    res.setHeader('X-RateLimit-Limit', stats.limit.toString());
    res.setHeader('X-RateLimit-Remaining', stats.remaining.toString());
    res.setHeader('X-RateLimit-Reset', 'Resets at midnight UTC');

    next();
  } catch (error) {
    logger.error('Rate limit check error:', error);
    // Don't block request on rate limit check errors
    next();
  }
}

/**
 * Middleware to log all authenticated requests
 * Must be used AFTER requireAuth
 */
export async function logAuthenticatedRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.user) {
    await logEvent('query', 'info', `${req.method} ${req.path}`, {
      userId: req.user.userId,
      email: req.user.email,
      tier: req.user.tier,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
  }

  next();
}
