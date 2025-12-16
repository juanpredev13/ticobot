/**
 * Token counting utilities using tiktoken
 * Used to measure token savings with TOON vs JSON
 */

import { get_encoding } from 'tiktoken';

let encoding: ReturnType<typeof get_encoding> | null = null;

/**
 * Get tiktoken encoding (lazy initialization)
 */
function getEncoding() {
    if (!encoding) {
        encoding = get_encoding('cl100k_base'); // Same encoding as GPT-4, GPT-3.5-turbo
    }
    return encoding;
}

/**
 * Count tokens in text
 * @param text - Text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
    const enc = getEncoding();
    const tokens = enc.encode(text);
    return tokens.length;
}

/**
 * Estimate JSON tokens for an object
 * @param obj - Object to estimate tokens for
 * @returns Estimated token count if converted to JSON
 */
export function estimateJSONTokens(obj: any): number {
    const jsonString = JSON.stringify(obj, null, 2);
    return countTokens(jsonString);
}

/**
 * Calculate token savings percentage
 * @param originalTokens - Original token count (JSON)
 * @param newTokens - New token count (TOON)
 * @returns Savings percentage
 */
export function calculateSavings(originalTokens: number, newTokens: number): number {
    if (originalTokens === 0) return 0;
    return ((originalTokens - newTokens) / originalTokens) * 100;
}

/**
 * Format token savings for display
 */
export function formatTokenSavings(originalTokens: number, newTokens: number): string {
    const saved = originalTokens - newTokens;
    const percentage = calculateSavings(originalTokens, newTokens);
    return `${saved} tokens (${percentage.toFixed(1)}% savings)`;
}

/**
 * Clean up encoding (call when done)
 */
export function dispose() {
    if (encoding) {
        encoding.free();
        encoding = null;
    }
}

