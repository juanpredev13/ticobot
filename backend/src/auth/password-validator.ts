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
  'ticobot',
  'ticobot123',
]);

/**
 * Validate password strength using multiple criteria
 * @param password - The password to validate
 * @param userInputs - Additional user-specific inputs to check against (email, name, etc.)
 * @returns Validation result with errors and suggestions
 */
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
    if (!hasUpperCase) suggestions.push('Add uppercase letters (A-Z)');
    if (!hasLowerCase) suggestions.push('Add lowercase letters (a-z)');
    if (!hasNumbers) suggestions.push('Add numbers (0-9)');
    if (!hasSpecialChars) suggestions.push('Add special characters (!@#$%^&*...)');
  }

  // Use zxcvbn for advanced strength testing
  const result = zxcvbn(password, userInputs);

  if (result.score < 3) {
    errors.push('Password is too weak. Choose a stronger password.');
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
