import { Logger } from '@ticobot/shared';

export interface TextCleaningOptions {
    normalizeWhitespace?: boolean;
    removeSpecialChars?: boolean;
    fixEncoding?: boolean;
    preservePunctuation?: boolean;
    extractPageMarkers?: boolean;
}

export interface PageMarker {
    pageNumber: number;
    totalPages: number;
    position: number;
}

export interface CleaningResult {
    cleanedText: string;
    pageMarkers: PageMarker[];
}

export class TextCleaner {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('TextCleaner');
    }

    /**
     * Clean and normalize text content with page marker extraction
     * @param text - Raw text to clean
     * @param options - Cleaning options
     * @returns Cleaned text and extracted page markers
     */
    cleanWithMetadata(text: string, options: TextCleaningOptions = {}): CleaningResult {
        const {
            normalizeWhitespace = true,
            removeSpecialChars = true,
            fixEncoding = true,
            preservePunctuation = true,
            extractPageMarkers = true
        } = options;

        this.logger.info(`Cleaning text (${text.length} characters)`);

        let cleaned = text;
        let pageMarkers: PageMarker[] = [];

        // 1. Extract page markers BEFORE cleaning
        if (extractPageMarkers) {
            const result = this.extractPageMarkers(cleaned);
            cleaned = result.text;
            pageMarkers = result.markers;
        }

        // 2. Fix encoding issues (common in Spanish PDFs)
        if (fixEncoding) {
            cleaned = this.fixEncodingIssues(cleaned);
        }

        // 3. Remove color codes (hexadecimal codes like #FFD700, #CC0000)
        cleaned = this.removeColorCodes(cleaned);

        // 4. Remove or normalize special characters
        if (removeSpecialChars) {
            cleaned = this.removeSpecialCharacters(cleaned, preservePunctuation);
        }

        // 5. Normalize whitespace
        if (normalizeWhitespace) {
            cleaned = this.normalizeWhitespace(cleaned);
        }

        // 5. Trim
        cleaned = cleaned.trim();

        this.logger.info(`Text cleaned (${cleaned.length} characters, ${text.length - cleaned.length} removed, ${pageMarkers.length} page markers extracted)`);

        return {
            cleanedText: cleaned,
            pageMarkers
        };
    }

    /**
     * Clean text (backwards compatibility)
     * @param text - Raw text to clean
     * @param options - Cleaning options
     * @returns Cleaned text
     */
    clean(text: string, options: TextCleaningOptions = {}): string {
        const result = this.cleanWithMetadata(text, options);
        return result.cleanedText;
    }

    /**
     * Extract page markers from PDF text
     * Markers follow pattern: -- N of M --
     * @returns Text with markers removed and array of marker positions
     */
    private extractPageMarkers(text: string): { text: string; markers: PageMarker[] } {
        const markers: PageMarker[] = [];
        const pageMarkerRegex = /--\s*(\d+)\s+of\s+(\d+)\s*--/gi;

        let match;
        let position = 0;

        while ((match = pageMarkerRegex.exec(text)) !== null) {
            const pageNumber = parseInt(match[1], 10);
            const totalPages = parseInt(match[2], 10);

            markers.push({
                pageNumber,
                totalPages,
                position: match.index - (position * match[0].length) // Adjust for removed markers
            });

            position++;
        }

        // Remove all page markers from text
        const cleanedText = text.replace(pageMarkerRegex, '');

        return { text: cleanedText, markers };
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

        // Fix character map issues
        for (const [wrong, correct] of Object.entries(encodingMap)) {
            fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
        }

        // Fix common PDF parsing artifacts
        // Pattern: word with colon before vowels (:ene, :po, :empo)
        fixed = fixed.replace(/:([aeiouáéíóú])/g, 'ti$1');

        // Fix software-like patterns (soRware -> software, :po -> tipo)
        fixed = fixed.replace(/so([A-Z])ware/g, 'software');

        // Fix uppercase letters that should be lowercase in middle of words
        fixed = fixed.replace(/([a-z])([A-Z])([a-z])/g, (match, before, upper, after) => {
            // Common patterns: soRware, :po, etc.
            const lowerMap: Record<string, string> = {
                'R': 'ft',
                'Y': 'ft',
                'n': 'ñ'
            };
            return before + (lowerMap[upper] || upper.toLowerCase()) + after;
        });

        return fixed;
    }

    /**
     * Remove hexadecimal color codes (e.g., #FFD700, #CC0000)
     * Also removes comma-separated color lists
     */
    private removeColorCodes(text: string): string {
        // Remove hex color codes (3 or 6 digits after #)
        // Pattern: # followed by 3-6 hexadecimal characters
        let cleaned = text.replace(/#[0-9A-Fa-f]{3,6}/g, '');
        
        // Clean up leftover commas and spaces that were part of color lists
        // Remove patterns like ", " or ", " that might be left after removing colors
        cleaned = cleaned.replace(/,\s*,/g, ','); // Multiple commas
        cleaned = cleaned.replace(/^\s*,\s*/g, ''); // Leading comma
        cleaned = cleaned.replace(/\s*,\s*$/g, ''); // Trailing comma
        cleaned = cleaned.replace(/\s{2,}/g, ' '); // Multiple spaces
        
        return cleaned;
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
