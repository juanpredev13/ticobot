import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  clearLoginAttempts,
  getLoginStats,
  forceCleanup,
} from '../login-limiter';

describe('Login Rate Limiter', () => {
  const testEmail = 'test@example.com';
  const testIp = '192.168.1.100';

  // Clean up before each test
  beforeEach(() => {
    forceCleanup();
    clearLoginAttempts(testEmail);
  });

  describe('checkLoginRateLimit', () => {
    it('should allow login attempts when no previous attempts', () => {
      const result = checkLoginRateLimit(testEmail, testIp);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('should allow first few attempts', () => {
      recordLoginAttempt(testEmail, testIp, false);
      recordLoginAttempt(testEmail, testIp, false);

      const result = checkLoginRateLimit(testEmail, testIp);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(3); // 5 - 2 failed
    });

    it('should track remaining attempts correctly', () => {
      for (let i = 0; i < 3; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      const result = checkLoginRateLimit(testEmail, testIp);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2); // 5 - 3 failed
    });
  });

  describe('Email-based Rate Limiting', () => {
    it('should block after 5 failed attempts from same email', () => {
      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      const result = checkLoginRateLimit(testEmail, testIp);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeTruthy();
      expect(result.lockoutUntil).toBeInstanceOf(Date);
    });

    it('should block same email from different IPs', () => {
      // Failed attempts from different IPs
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, `192.168.1.${100 + i}`, false);
      }

      const result = checkLoginRateLimit(testEmail, '192.168.1.200');

      expect(result.allowed).toBe(false);
    });

    it('should not block different email from same IP', () => {
      // 5 failed attempts for one email
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt('blocked@example.com', testIp, false);
      }

      // Different email should not be blocked
      const result = checkLoginRateLimit('different@example.com', testIp);

      expect(result.allowed).toBe(true);
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should block after 10 failed attempts from same IP', () => {
      // Record 10 failed attempts from same IP, different emails
      for (let i = 0; i < 10; i++) {
        recordLoginAttempt(`user${i}@example.com`, testIp, false);
      }

      const result = checkLoginRateLimit('newuser@example.com', testIp);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP');
    });

    it('should allow attempts from different IPs', () => {
      // 9 failed attempts from one IP
      for (let i = 0; i < 9; i++) {
        recordLoginAttempt(`user${i}@example.com`, '192.168.1.1', false);
      }

      // Attempt from different IP should be allowed
      const result = checkLoginRateLimit('test@example.com', '192.168.1.2');

      expect(result.allowed).toBe(true);
    });
  });

  describe('recordLoginAttempt', () => {
    it('should record failed login attempts', () => {
      recordLoginAttempt(testEmail, testIp, false);

      const result = checkLoginRateLimit(testEmail, testIp);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should record successful login attempts', () => {
      recordLoginAttempt(testEmail, testIp, true);

      const stats = getLoginStats();
      expect(stats.totalAttempts).toBeGreaterThan(0);
    });

    it('should track both email and IP attempts', () => {
      recordLoginAttempt(testEmail, testIp, false);

      const stats = getLoginStats();
      expect(stats.emailKeys).toBeGreaterThan(0);
      expect(stats.ipKeys).toBeGreaterThan(0);
    });
  });

  describe('clearLoginAttempts', () => {
    it('should clear attempts for specific email', () => {
      // Record some failed attempts
      for (let i = 0; i < 3; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      clearLoginAttempts(testEmail);

      const result = checkLoginRateLimit(testEmail, testIp);
      expect(result.remainingAttempts).toBe(5); // Reset to full
    });

    it('should not affect other emails', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      recordLoginAttempt(email1, testIp, false);
      recordLoginAttempt(email2, testIp, false);

      clearLoginAttempts(email1);

      const result1 = checkLoginRateLimit(email1, testIp);
      const result2 = checkLoginRateLimit(email2, testIp);

      expect(result1.remainingAttempts).toBe(5);
      expect(result2.remainingAttempts).toBe(4);
    });

    it('should handle case-insensitive emails', () => {
      recordLoginAttempt('Test@Example.com', testIp, false);
      clearLoginAttempts('test@example.com');

      const result = checkLoginRateLimit('TEST@EXAMPLE.COM', testIp);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe('Successful Login Reset', () => {
    it('should allow more attempts after successful login', () => {
      // Failed attempts
      for (let i = 0; i < 3; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      // Successful login
      recordLoginAttempt(testEmail, testIp, true);
      clearLoginAttempts(testEmail);

      const result = checkLoginRateLimit(testEmail, testIp);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe('Lockout Duration', () => {
    it('should include lockout expiry time in response', () => {
      // Block the account
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      const result = checkLoginRateLimit(testEmail, testIp);

      expect(result.lockoutUntil).toBeInstanceOf(Date);

      // Lockout should be in the future
      const now = new Date();
      expect(result.lockoutUntil!.getTime()).toBeGreaterThan(now.getTime());

      // Lockout should be approximately 15 minutes
      const lockoutDuration = result.lockoutUntil!.getTime() - now.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      // Allow some tolerance (14-16 minutes)
      expect(lockoutDuration).toBeGreaterThan(14 * 60 * 1000);
      expect(lockoutDuration).toBeLessThan(16 * 60 * 1000);
    });

    it('should include helpful message in lockout response', () => {
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      const result = checkLoginRateLimit(testEmail, testIp);

      expect(result.reason).toBeTruthy();
      expect(result.reason).toContain('failed login attempts');
    });
  });

  describe('getLoginStats', () => {
    it('should return correct statistics', () => {
      recordLoginAttempt('user1@example.com', '192.168.1.1', false);
      recordLoginAttempt('user2@example.com', '192.168.1.2', true);

      const stats = getLoginStats();

      expect(stats.totalAttempts).toBeGreaterThanOrEqual(2);
      expect(stats.failedAttempts).toBeGreaterThanOrEqual(1);
      expect(stats.emailKeys).toBeGreaterThanOrEqual(2);
      expect(stats.ipKeys).toBeGreaterThanOrEqual(2);
    });

    it('should count keys correctly', () => {
      recordLoginAttempt(testEmail, testIp, false);

      const stats = getLoginStats();

      expect(stats.emailKeys).toBeGreaterThan(0);
      expect(stats.ipKeys).toBeGreaterThan(0);
    });
  });

  describe('forceCleanup', () => {
    it('should clear all attempts in test environment', () => {
      recordLoginAttempt(testEmail, testIp, false);

      // Verify attempt was recorded
      let stats = getLoginStats();
      expect(stats.totalAttempts).toBeGreaterThan(0);

      forceCleanup();

      // In test environment, forceCleanup clears all attempts
      stats = getLoginStats();
      expect(stats.totalAttempts).toBe(0);
    });

    it('should be callable multiple times safely', () => {
      forceCleanup();
      forceCleanup();
      forceCleanup();

      // Should not throw
      const stats = getLoginStats();
      expect(stats).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email', () => {
      const result = checkLoginRateLimit('', testIp);
      expect(result).toBeTruthy();
    });

    it('should handle empty IP', () => {
      const result = checkLoginRateLimit(testEmail, '');
      expect(result).toBeTruthy();
    });

    it('should handle special characters in email', () => {
      const specialEmail = 'test+tag@example.com';
      recordLoginAttempt(specialEmail, testIp, false);

      const result = checkLoginRateLimit(specialEmail, testIp);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should handle IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      recordLoginAttempt(testEmail, ipv6, false);

      const result = checkLoginRateLimit(testEmail, ipv6);
      expect(result).toBeTruthy();
    });

    it('should handle localhost IPs', () => {
      const localhosts = ['127.0.0.1', '::1', 'localhost'];

      localhosts.forEach(ip => {
        const result = checkLoginRateLimit(testEmail, ip);
        expect(result.allowed).toBe(true);
      });
    });
  });

  describe('Concurrent Attempts', () => {
    it('should handle multiple emails correctly', () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      emails.forEach(email => {
        for (let i = 0; i < 3; i++) {
          recordLoginAttempt(email, testIp, false);
        }
      });

      emails.forEach(email => {
        const result = checkLoginRateLimit(email, testIp);
        expect(result.remainingAttempts).toBe(2);
      });
    });

    it('should handle multiple IPs correctly', () => {
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

      ips.forEach(ip => {
        for (let i = 0; i < 3; i++) {
          recordLoginAttempt(testEmail, ip, false);
        }
      });

      ips.forEach(ip => {
        const result = checkLoginRateLimit(testEmail, ip);
        expect(result.allowed).toBe(false); // 3 attempts per IP, but email has 9 total
      });
    });
  });

  describe('Case Sensitivity', () => {
    it('should treat emails as case-insensitive', () => {
      recordLoginAttempt('Test@Example.COM', testIp, false);
      recordLoginAttempt('test@example.com', testIp, false);
      recordLoginAttempt('TEST@EXAMPLE.COM', testIp, false);

      const result = checkLoginRateLimit('test@example.com', testIp);

      // All 3 should count as same email
      expect(result.remainingAttempts).toBe(2);
    });
  });

  describe('Mixed Success and Failure', () => {
    it('should only count failed attempts for blocking', () => {
      recordLoginAttempt(testEmail, testIp, false);
      recordLoginAttempt(testEmail, testIp, true);
      recordLoginAttempt(testEmail, testIp, false);
      recordLoginAttempt(testEmail, testIp, true);

      const result = checkLoginRateLimit(testEmail, testIp);

      // Only 2 failed, so should have 3 remaining
      expect(result.remainingAttempts).toBe(3);
      expect(result.allowed).toBe(true);
    });
  });
});
