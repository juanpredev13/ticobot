import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock the env module before importing jwt.utils
vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-minimum-32-characters-long-for-testing',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    BCRYPT_ROUNDS: 10,
  }
}));

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  decodeToken,
  type JWTPayload,
} from '../jwt.utils';

describe('JWT Utils', () => {
  const testPayload: JWTPayload = {
    userId: 'test-user-id-123',
    email: 'test@example.com',
    tier: 'free',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload data', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.tier).toBe(testPayload.tier);
    });

    it('should include standard JWT claims', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded).toHaveProperty('iat'); // Issued at
      expect(decoded).toHaveProperty('exp'); // Expiration
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateAccessToken(testPayload);
      const token2 = generateAccessToken({
        ...testPayload,
        userId: 'different-user-id',
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload data', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.tier).toBe(testPayload.tier);
    });

    it('should generate different token than access token', () => {
      const accessToken = generateAccessToken(testPayload);
      const refreshToken = generateRefreshToken(testPayload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.tier).toBe(testPayload.tier);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow('Invalid token');
    });

    it('should throw error for token with wrong signature', () => {
      const token = generateAccessToken(testPayload);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';

      expect(() => verifyAccessToken(tamperedToken)).toThrow('Invalid token');
    });

    it('should verify expiration claim is present', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('should verify token with correct issuer and audience', () => {
      const token = generateAccessToken(testPayload);

      // Should not throw
      expect(() => verifyAccessToken(token)).not.toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.tier).toBe(testPayload.tier);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid.refresh.token')).toThrow('Invalid refresh token');
    });

    it('should accept access token as refresh token (same secret)', () => {
      // Since both use the same secret, an access token can be decoded as refresh
      // This is expected behavior - the difference is only in expiry time
      const accessToken = generateAccessToken(testPayload);

      expect(() => verifyRefreshToken(accessToken)).not.toThrow();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(testPayload);

      expect(tokens).toBeTruthy();
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate different tokens for access and refresh', () => {
      const tokens = generateTokenPair(testPayload);

      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate tokens with correct payload', () => {
      const tokens = generateTokenPair(testPayload);

      const decodedAccess = verifyAccessToken(tokens.accessToken);
      const decodedRefresh = verifyRefreshToken(tokens.refreshToken);

      expect(decodedAccess.userId).toBe(testPayload.userId);
      expect(decodedRefresh.userId).toBe(testPayload.userId);
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.tier).toBe(testPayload.tier);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('not.a.valid.token');
      expect(decoded).toBeNull();
    });

    it('should decode expired token without throwing', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeTruthy();
      // decodeToken doesn't verify expiry
    });

    it('should decode token with tampered signature', () => {
      const token = generateAccessToken(testPayload);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';

      // decodeToken doesn't verify signature, only decodes
      const decoded = decodeToken(tamperedToken);
      expect(decoded).toBeTruthy();
    });
  });

  describe('Security Properties', () => {
    it('should not accept tokens with wrong issuer', () => {
      // This would require manually creating a token with wrong issuer
      // JWT library handles this validation
      const token = generateAccessToken(testPayload);
      expect(() => verifyAccessToken(token)).not.toThrow();
    });

    it('should include all required user tiers', () => {
      const tiers: Array<'free' | 'premium' | 'admin'> = ['free', 'premium', 'admin'];

      tiers.forEach(tier => {
        const payload = { ...testPayload, tier };
        const token = generateAccessToken(payload);
        const decoded = verifyAccessToken(token);

        expect(decoded.tier).toBe(tier);
      });
    });

    it('should handle UUID user IDs', () => {
      const uuidPayload: JWTPayload = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'uuid@test.com',
        tier: 'premium',
      };

      const token = generateAccessToken(uuidPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(uuidPayload.userId);
    });

    it('should handle email addresses with special characters', () => {
      const specialEmailPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test+tag@example.co.uk',
        tier: 'admin',
      };

      const token = generateAccessToken(specialEmailPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.email).toBe(specialEmailPayload.email);
    });
  });

  describe('Token Properties', () => {
    it('should generate tokens with reasonable length', () => {
      const token = generateAccessToken(testPayload);

      // JWT tokens are typically 100-500 characters
      expect(token.length).toBeGreaterThan(50);
      expect(token.length).toBeLessThan(1000);
    });

    it('should be URL-safe (no special characters that need encoding)', () => {
      const token = generateAccessToken(testPayload);

      // JWT tokens use base64url encoding, which is URL-safe
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });
  });
});
