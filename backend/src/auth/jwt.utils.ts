import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JWTPayload {
  userId: string;
  email: string;
  tier: 'free' | 'premium' | 'admin';
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const secret: string = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
    issuer: 'ticobot-api',
    audience: 'ticobot-client',
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const secret: string = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
    issuer: 'ticobot-api',
    audience: 'ticobot-client',
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const secret: string = env.JWT_SECRET;
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'ticobot-api',
      audience: 'ticobot-client',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const secret: string = env.JWT_SECRET;
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'ticobot-api',
      audience: 'ticobot-client',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(payload: JWTPayload): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Decode token without verification (for debugging/inspection)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as JWTPayload;
  } catch {
    return null;
  }
}
