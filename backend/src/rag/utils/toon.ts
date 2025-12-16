/**
 * TOON (Token-Oriented Object Notation) utilities
 * 
 * TOON is a compact format designed for LLM interactions that reduces
 * token usage by 30-60% compared to JSON.
 * 
 * This module provides utilities for encoding/decoding TOON format.
 * 
 * @see https://github.com/toon-format/toon
 */

import { Logger } from '@ticobot/shared';

const logger = new Logger('TOON');

/**
 * Parse TOON (Token-Oriented Object Notation) from text
 * 
 * TOON format example:
 * ```
 * keywords: palabra1,palabra2,palabra3
 * entities: entidad1,entidad2
 * intent: question
 * enhancedQuery: texto con espacios
 * ```
 * 
 * @param text - TOON formatted text
 * @returns Parsed object or null if parsing fails
 */
export function parseTOON(text: string): Record<string, any> | null {
    try {
        // Remove markdown code blocks if present
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```toon?\n?/g, '').replace(/```$/g, '').trim();
        }

        const result: Record<string, any> = {};
        const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (const line of lines) {
            // Skip comments and empty lines
            if (line.startsWith('#') || line.startsWith('//')) continue;

            // Parse key: value format
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();

            // Handle array values (comma-separated)
            if (value.includes(',')) {
                result[key] = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
            } else {
                result[key] = value;
            }
        }

        return result;
    } catch (error) {
        logger.warn('Failed to parse TOON:', error);
        return null;
    }
}

/**
 * Encode object to TOON format
 * 
 * @param obj - Object to encode
 * @returns TOON formatted string
 */
export function encodeTOON(obj: Record<string, any>): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            lines.push(`${key}: ${value.join(',')}`);
        } else if (value !== null && value !== undefined) {
            lines.push(`${key}: ${value}`);
        }
    }

    return lines.join('\n');
}

/**
 * Clean markdown code blocks from TOON text
 * 
 * @param text - Text that may contain markdown code blocks
 * @returns Cleaned text
 */
export function cleanMarkdownBlocks(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```toon?\n?/g, '').replace(/```$/g, '').trim();
    }
    return cleaned;
}

/**
 * Validate TOON object has required fields
 * 
 * @param obj - Parsed TOON object
 * @param requiredFields - Array of required field names
 * @returns true if all required fields are present
 */
export function validateTOON(obj: Record<string, any> | null, requiredFields: string[]): boolean {
    if (!obj) return false;
    
    return requiredFields.every(field => {
        const hasField = field in obj && obj[field] !== null && obj[field] !== undefined;
        if (!hasField) {
            logger.warn(`Missing required TOON field: ${field}`);
        }
        return hasField;
    });
}


