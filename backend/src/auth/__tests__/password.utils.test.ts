import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password.utils';

describe('Password Utils', () => {
  const testPassword = 'MySecurePassword123!';

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword(testPassword);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      // bcrypt uses salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('should produce bcrypt format hash', async () => {
      const hash = await hashPassword(testPassword);

      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should hash contain cost factor', async () => {
      const hash = await hashPassword(testPassword);

      // bcrypt hash format: $2b$<cost>$<salt+hash>
      const parts = hash.split('$');
      expect(parts.length).toBeGreaterThanOrEqual(4);

      const cost = parseInt(parts[2], 10);
      expect(cost).toBeGreaterThanOrEqual(4);  // At least 4 rounds
      expect(cost).toBeLessThanOrEqual(31);    // Max 31 rounds
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(200);
      const hash = await hashPassword(longPassword);

      expect(hash).toBeTruthy();
    });

    it('should handle special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(specialPassword);

      expect(hash).toBeTruthy();
      expect(await verifyPassword(specialPassword, hash)).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const unicodePassword = 'Contraseña123!';
      const hash = await hashPassword(unicodePassword);

      expect(hash).toBeTruthy();
      expect(await verifyPassword(unicodePassword, hash)).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const hash = await hashPassword('Password123!');

      const valid1 = await verifyPassword('Password123!', hash);
      const valid2 = await verifyPassword('password123!', hash);
      const valid3 = await verifyPassword('PASSWORD123!', hash);

      expect(valid1).toBe(true);
      expect(valid2).toBe(false);
      expect(valid3).toBe(false);
    });

    it('should detect single character difference', async () => {
      const hash = await hashPassword('Password123!');

      const valid1 = await verifyPassword('Password123!', hash);
      const valid2 = await verifyPassword('Password123', hash);  // Missing !
      const valid3 = await verifyPassword('Password1234', hash); // Different digit

      expect(valid1).toBe(true);
      expect(valid2).toBe(false);
      expect(valid3).toBe(false);
    });

    it('should reject empty password against real hash', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });

    it('should handle verification of empty password hash', async () => {
      const hash = await hashPassword('');
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(true);
    });

    it('should reject invalid hash format', async () => {
      const isValid = await verifyPassword(testPassword, 'invalid-hash');

      expect(isValid).toBe(false);
    });

    it('should work with bcrypt hash format', async () => {
      // Create a fresh hash and verify
      const password = 'test';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      // Hash should have bcrypt format
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });
  });

  describe('Hash Security Properties', () => {
    it('should be computationally expensive (slow)', async () => {
      const start = Date.now();
      await hashPassword(testPassword);
      const duration = Date.now() - start;

      // Hashing should take at least a few milliseconds
      // (indicates work factor is being applied)
      expect(duration).toBeGreaterThan(10);
    });

    it('should produce hashes of consistent length', async () => {
      const hash1 = await hashPassword('short');
      const hash2 = await hashPassword('a'.repeat(50));

      // bcrypt hashes are fixed length (60 characters)
      expect(hash1.length).toBe(60);
      expect(hash2.length).toBe(60);
    });

    it('should not leak password length through hash', async () => {
      const shortHash = await hashPassword('abc');
      const longHash = await hashPassword('a'.repeat(100));

      // Hash length should be same regardless of password length
      expect(shortHash.length).toBe(longHash.length);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical user passwords', async () => {
      const typicalPasswords = [
        'MyPassword123!',
        'Summer2024@',
        'Tr0pic@lSun!',
        'C0staRica#2026',
      ];

      for (const password of typicalPasswords) {
        const hash = await hashPassword(password);
        const isValid = await verifyPassword(password, hash);

        expect(isValid).toBe(true);
      }
    });

    it('should handle password change scenario', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';

      // User had old password
      const oldHash = await hashPassword(oldPassword);
      expect(await verifyPassword(oldPassword, oldHash)).toBe(true);

      // User changes to new password
      const newHash = await hashPassword(newPassword);

      // Old password shouldn't work with new hash
      expect(await verifyPassword(oldPassword, newHash)).toBe(false);

      // New password should work with new hash
      expect(await verifyPassword(newPassword, newHash)).toBe(true);
    });

    it('should handle concurrent hashing', async () => {
      const passwords = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5'];

      const hashes = await Promise.all(
        passwords.map(p => hashPassword(p))
      );

      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(passwords.length);

      // All should verify correctly
      for (let i = 0; i < passwords.length; i++) {
        const isValid = await verifyPassword(passwords[i], hashes[i]);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Edge Cases with Special Characters', () => {
    it('should handle passwords with quotes', async () => {
      const passwords = [
        'My"Password123!',
        "My'Password123!",
        'My`Password123!',
      ];

      for (const password of passwords) {
        const hash = await hashPassword(password);
        expect(await verifyPassword(password, hash)).toBe(true);
      }
    });

    it('should handle passwords with backslashes', async () => {
      const password = 'My\\Password\\123!';
      const hash = await hashPassword(password);

      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it('should handle passwords with newlines and tabs', async () => {
      const password = 'My\nPassword\t123!';
      const hash = await hashPassword(password);

      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it('should handle passwords with emoji', async () => {
      const password = 'MyPassword123!🔒';
      const hash = await hashPassword(password);

      expect(await verifyPassword(password, hash)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should hash multiple passwords within reasonable time', async () => {
      const passwords = Array(5).fill(0).map((_, i) => `Password${i}!`);

      const start = Date.now();
      await Promise.all(passwords.map(p => hashPassword(p)));
      const duration = Date.now() - start;

      // 5 hashes should complete within a reasonable time (e.g., 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should verify passwords quickly', async () => {
      const hash = await hashPassword(testPassword);

      const start = Date.now();
      await verifyPassword(testPassword, hash);
      const duration = Date.now() - start;

      // Verification should be faster than hashing
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Determinism', () => {
    it('should always verify same password with same hash', async () => {
      const hash = await hashPassword(testPassword);

      const results = await Promise.all([
        verifyPassword(testPassword, hash),
        verifyPassword(testPassword, hash),
        verifyPassword(testPassword, hash),
        verifyPassword(testPassword, hash),
        verifyPassword(testPassword, hash),
      ]);

      // All verifications should return true
      expect(results.every(r => r === true)).toBe(true);
    });

    it('should always reject wrong password with same hash', async () => {
      const hash = await hashPassword(testPassword);
      const wrongPassword = 'WrongPassword123!';

      const results = await Promise.all([
        verifyPassword(wrongPassword, hash),
        verifyPassword(wrongPassword, hash),
        verifyPassword(wrongPassword, hash),
      ]);

      // All verifications should return false
      expect(results.every(r => r === false)).toBe(true);
    });
  });
});
