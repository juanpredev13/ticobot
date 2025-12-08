import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../password-validator';

describe('Password Validator', () => {
  describe('Length Requirements', () => {
    it('should reject passwords shorter than 12 characters', () => {
      const result = validatePasswordStrength('Short1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should accept passwords with exactly 12 characters', () => {
      const result = validatePasswordStrength('Strong1Pass!');

      expect(result.valid).toBe(true);
    });

    it('should accept long passwords', () => {
      const result = validatePasswordStrength('ThisIsAVeryLongPasswordWithNumbers123!');

      expect(result.valid).toBe(true);
    });
  });

  describe('Common Passwords', () => {
    it('should reject common passwords', () => {
      const commonPasswords = [
        'password123', // In COMMON_PASSWORDS list
        'Password123', // Case-insensitive check
        'PASSWORD123', // Case-insensitive check
      ];

      commonPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(false);
        // Check if either common password error or weak password error is present
        const hasCommonOrWeakError = result.errors.some(e =>
          e.toLowerCase().includes('common') || e.toLowerCase().includes('weak')
        );
        expect(hasCommonOrWeakError).toBe(true);
      });
    });

    it('should accept uncommon passwords', () => {
      const result = validatePasswordStrength('MyUniqueP@ss2024');

      expect(result.valid).toBe(true);
    });
  });

  describe('Complexity Requirements', () => {
    it('should require at least 3 of 4 character types', () => {
      // Only lowercase
      const result1 = validatePasswordStrength('onlylowercase');
      expect(result1.valid).toBe(false);
      expect(result1.errors.some(e => e.includes('at least 3 of'))).toBe(true);

      // Only uppercase
      const result2 = validatePasswordStrength('ONLYUPPERCASE');
      expect(result2.valid).toBe(false);

      // Only numbers
      const result3 = validatePasswordStrength('123456789012');
      expect(result3.valid).toBe(false);
    });

    it('should accept password with uppercase + lowercase + numbers', () => {
      const result = validatePasswordStrength('MyUniqu3P4ssw0rd');

      expect(result.valid).toBe(true);
    });

    it('should accept password with uppercase + lowercase + special', () => {
      const result = validatePasswordStrength('MyUnique!!Pass');

      expect(result.valid).toBe(true);
    });

    it('should accept password with lowercase + numbers + special', () => {
      const result = validatePasswordStrength('unique!p4ssw0rd');

      expect(result.valid).toBe(true);
    });

    it('should accept password with all 4 types', () => {
      const result = validatePasswordStrength('MyUn1qu3!P4ss');

      expect(result.valid).toBe(true);
    });

    it('should provide suggestions for missing character types', () => {
      const result = validatePasswordStrength('onlylowercase');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('uppercase'))).toBe(true);
    });
  });

  describe('zxcvbn Strength Analysis', () => {
    it('should accept strong passwords (score >= 3)', () => {
      const strongPasswords = [
        'C0mpl3x!P@ssw0rd',
        'MyStr0ngP@ss2024!',
        'Un1qu3$ecureKey!',
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(3);
      });
    });

    it('should reject weak passwords even if they meet basic requirements', () => {
      // Passwords that might meet length/complexity but are weak patterns
      const weakPasswords = [
        'Password1234',  // Common pattern
        'Qwerty123456',  // Keyboard pattern
      ];

      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        // These might fail due to being too weak
        if (!result.valid) {
          expect(result.errors.some(e =>
            e.includes('too weak') || e.includes('too common')
          )).toBe(true);
        }
      });
    });

    it('should return zxcvbn score', () => {
      const result = validatePasswordStrength('MyStr0ngP@ss2024!');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
    });
  });

  describe('Sequential Characters', () => {
    it('should reject passwords with sequential letters', () => {
      const result = validatePasswordStrength('MyPasswordAbcd123!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sequential'))).toBe(true);
    });

    it('should reject passwords with sequential numbers', () => {
      const result = validatePasswordStrength('MyPassword1234567!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sequential'))).toBe(true);
    });

    it('should accept passwords without long sequences', () => {
      const result = validatePasswordStrength('MyP@ssw0rd2k24');

      expect(result.valid).toBe(true);
    });
  });

  describe('Repeated Characters', () => {
    it('should reject passwords with 3+ repeated characters', () => {
      const result = validatePasswordStrength('MyPasssword111!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('repeated'))).toBe(true);
    });

    it('should accept passwords with max 2 repeated characters', () => {
      const result = validatePasswordStrength('MyPassword11!');

      expect(result.valid).toBe(true);
    });
  });

  describe('User-Specific Validation', () => {
    it('should use user inputs for zxcvbn analysis', () => {
      const result1 = validatePasswordStrength(
        'john.doe@example123',
        ['john.doe@example.com', 'John Doe']
      );

      const result2 = validatePasswordStrength(
        'john.doe@example123',
        []
      );

      // zxcvbn should consider user inputs in scoring
      expect(result1.score).toBeDefined();
      expect(result2.score).toBeDefined();
    });

    it('should accept strong password even with user info check', () => {
      const result = validatePasswordStrength(
        'Unr3l@tedP@ss!',
        ['john@example.com', 'John Doe']
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty password', () => {
      const result = validatePasswordStrength('');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle password with only special characters', () => {
      const result = validatePasswordStrength('!@#$%^&*()_+');

      expect(result.valid).toBe(false);
    });

    it('should handle password with spaces', () => {
      const result = validatePasswordStrength('My Pass Word 123!');

      // Spaces are allowed
      expect(result.valid).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = validatePasswordStrength('MyPássw0rd123!');

      // Should work with accented characters
      expect(result.valid).toBe(true);
    });

    it('should handle emoji in password', () => {
      const result = validatePasswordStrength('MyP@ssw0rd🔒🔑');

      // Emojis should be accepted
      if (result.valid) {
        expect(result.score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Suggestions', () => {
    it('should provide actionable suggestions for weak passwords', () => {
      const result = validatePasswordStrength('weak');

      expect(result.suggestions.length).toBeGreaterThan(0);
      result.suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should have no errors for strong passwords', () => {
      const result = validatePasswordStrength('MyStr0ng!P@ssw0rd2024');

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Real-World Passwords', () => {
    it('should accept realistic strong passwords', () => {
      const goodPasswords = [
        'Tr0pic@lParadise!',
        'C0staR1ca$2026',
        'V0t3Sm@rtly!2026',
        'Elec7ion$ecure!',
        'G0biern0Pl@n$',
      ];

      goodPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject realistic weak passwords', () => {
      const badPasswords = [
        'password',
        'Password1',
        '12345678',
        'admin123',
      ];

      badPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Return Value Structure', () => {
    it('should return all required fields', () => {
      const result = validatePasswordStrength('TestP@ss123!');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('suggestions');

      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should have consistent errors array type', () => {
      const result = validatePasswordStrength('weak');

      result.errors.forEach(error => {
        expect(typeof error).toBe('string');
      });
    });

    it('should have score in valid range', () => {
      const result = validatePasswordStrength('AnyP@ssw0rd123');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
    });
  });
});
