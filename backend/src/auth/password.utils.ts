import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Hash a plain text password using bcrypt
 * @param plainPassword - The plain text password
 * @returns Promise with hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
}

/**
 * Verify a plain text password against a hash
 * @param plainPassword - The plain text password
 * @param passwordHash - The bcrypt hash to compare against
 * @returns Promise with boolean indicating if password matches
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
