import { Logger } from '@ticobot/shared';

export interface TextCleaningOptions {
    normalizeWhitespace?: boolean;
    removeSpecialChars?: boolean;
    fixEncoding?: boolean;
    preservePunctuation?: boolean;
}

export class TextCleaner {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('TextCleaner');
    }

    /**
     * Clean and normalize text content
     * @param text - Raw text to clean
     * @param options - Cleaning options
     * @returns Cleaned text
     */
    clean(text: string, options: TextCleaningOptions = {}): string {
        const {
            normalizeWhitespace = true,
            removeSpecialChars = true,
            fixEncoding = true,
            preservePunctuation = true
        } = options;

        this.logger.info(`Cleaning text (${text.length} characters)`);

        let cleaned = text;

        // 1. Fix encoding issues (common in Spanish PDFs)
        if (fixEncoding) {
            cleaned = this.fixEncodingIssues(cleaned);
        }

        // 2. Remove or normalize special characters
        if (removeSpecialChars) {
            cleaned = this.removeSpecialCharacters(cleaned, preservePunctuation);
        }

        // 3. Normalize whitespace
        if (normalizeWhitespace) {
            cleaned = this.normalizeWhitespace(cleaned);
        }

        // 4. Trim
        cleaned = cleaned.trim();

        this.logger.info(`Text cleaned (${cleaned.length} characters, ${text.length - cleaned.length} removed)`);

        return cleaned;
    }

    /**
     * Fix common encoding issues in Spanish text
     */
    private fixEncodingIssues(text: string): string {
        const encodingMap: Record<string, string> = {
            // Spanish vowels with accents (lowercase)
            'Ã¡': 'á',
            'Ã©': 'é',
            'Ã­': 'í',
            'Ã³': 'ó',
            'Ãº': 'ú',
            // Spanish vowels with accents (uppercase)
            'Ã\x81': 'Á',
            'Ã\x89': 'É',
            'Ã\x8D': 'Í',
            'Ã\x93': 'Ó',
            'Ã\x9A': 'Ú',
            // Spanish ñ
            'Ã±': 'ñ',
            'Ã\x91': 'Ñ',
            // Common quotation marks
            'â\x80\x9C': '"',
            'â\x80\x9D': '"',
            'â\x80\x99': "'",
            'â\x80\x98': "'",
            // Dashes
            'â\x80\x93': '-',  // en dash
            'â\x80\x94': '—',  // em dash
        };

        let fixed = text;
        for (const [wrong, correct] of Object.entries(encodingMap)) {
            fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
        }

        return fixed;
    }

    /**
     * Remove special characters while preserving Spanish letters
     */
    private removeSpecialCharacters(text: string, preservePunctuation: boolean): string {
        if (preservePunctuation) {
            // Keep letters, numbers, spaces, and common punctuation
            // Include Spanish letters: áéíóúñÁÉÍÓÚÑ
            return text.replace(/[^\w\s\-.,;:!?¿¡áéíóúñÁÉÍÓÚÑ]/g, '');
        } else {
            // Keep only letters, numbers, and spaces
            return text.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '');
        }
    }

    /**
     * Normalize whitespace (multiple spaces, tabs, newlines)
     */
    private normalizeWhitespace(text: string): string {
        return text
            // Replace multiple spaces with single space
            .replace(/[ \t]+/g, ' ')
            // Replace multiple newlines with double newline (preserve paragraphs)
            .replace(/\n{3,}/g, '\n\n')
            // Remove spaces around single newlines, but preserve double newlines
            .replace(/ *\n *\n */g, '\n\n')  // Preserve paragraph breaks
            .replace(/ *\n */g, '\n');        // Clean single newlines
    }

    /**
     * Get cleaning statistics
     */
    getCleaningStats(originalText: string, cleanedText: string) {
        return {
            originalLength: originalText.length,
            cleanedLength: cleanedText.length,
            charactersRemoved: originalText.length - cleanedText.length,
            reductionPercentage: ((originalText.length - cleanedText.length) / originalText.length * 100).toFixed(2) + '%'
        };
    }
}
