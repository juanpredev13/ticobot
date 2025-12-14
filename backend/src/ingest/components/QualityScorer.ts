import { Logger } from '@ticobot/shared';

/**
 * Quality metrics for a text chunk
 */
export interface QualityMetrics {
    qualityScore: number;      // Overall score 0.0 to 1.0
    lengthScore: number;       // Score based on text length
    specialCharRatio: number;  // Ratio of special characters
    hasKeywords: boolean;      // Contains relevant keywords
    readability: number;       // Basic readability score
}

/**
 * QualityScorer - Calculates quality scores for text chunks
 * Helps identify and filter low-quality content (OCR errors, formatting issues, etc.)
 */
export class QualityScorer {
    private readonly logger: Logger;

    // Spanish keywords relevant to Costa Rica government plans
    private readonly RELEVANT_KEYWORDS = [
        'propone', 'propuesta', 'gobierno', 'política', 'costa rica',
        'nacional', 'desarrollo', 'social', 'económico', 'plan',
        'educación', 'salud', 'seguridad', 'empleo', 'ambiente',
        'infraestructura', 'derechos', 'ciudadanos', 'público',
        'estado', 'ley', 'programa', 'proyecto', 'objetivo',
        'estrategia', 'acción', 'compromiso', 'reforma', 'presupuesto'
    ];

    // Spanish stopwords for readability calculation
    private readonly STOPWORDS = new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se',
        'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar',
        'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o',
        'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'la', 'si',
        'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
        'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno',
        'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer',
        'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni'
    ]);

    constructor() {
        this.logger = new Logger('QualityScorer');
    }

    /**
     * Calculate comprehensive quality score for a text chunk
     * @param text - Text content to score
     * @returns Quality metrics including overall score
     */
    calculateQuality(text: string): QualityMetrics {
        const lengthScore = this.calculateLengthScore(text);
        const specialCharRatio = this.calculateSpecialCharRatio(text);
        const hasKeywords = this.hasRelevantKeywords(text);
        const readability = this.calculateReadability(text);

        // Calculate overall quality score
        let qualityScore = 1.0;

        // Length component (30% weight)
        qualityScore *= (0.7 + 0.3 * lengthScore);

        // Special character penalty (20% weight)
        if (specialCharRatio > 0.2) {
            qualityScore *= (1.0 - (specialCharRatio - 0.2) * 0.5);
        }

        // Keyword bonus (20% weight)
        if (hasKeywords) {
            qualityScore *= 1.2;
        }

        // Readability component (30% weight)
        qualityScore *= (0.7 + 0.3 * readability);

        // Clamp to [0, 1]
        qualityScore = Math.max(0, Math.min(1, qualityScore));

        return {
            qualityScore,
            lengthScore,
            specialCharRatio,
            hasKeywords,
            readability,
        };
    }

    /**
     * Calculate score based on text length
     * Penalizes very short and very long chunks
     * @param text - Text to analyze
     * @returns Score between 0 and 1
     */
    private calculateLengthScore(text: string): number {
        const length = text.length;

        // Optimal range: 200-1000 characters
        if (length < 50) return 0.2;           // Very short, likely incomplete
        if (length < 100) return 0.5;          // Short but usable
        if (length < 200) return 0.8;          // Good
        if (length <= 1000) return 1.0;        // Optimal
        if (length <= 2000) return 0.9;        // Slightly long
        if (length <= 3000) return 0.7;        // Long
        return 0.5;                             // Very long, might be poorly chunked
    }

    /**
     * Calculate ratio of special/non-alphanumeric characters
     * High ratios indicate OCR errors or formatting issues
     * @param text - Text to analyze
     * @returns Ratio between 0 and 1
     */
    private calculateSpecialCharRatio(text: string): number {
        const specialChars = text.match(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ.,;:¿?¡!()[\]{}"'-]/g) || [];
        return specialChars.length / Math.max(text.length, 1);
    }

    /**
     * Check if text contains relevant keywords
     * @param text - Text to analyze
     * @returns True if contains at least one relevant keyword
     */
    private hasRelevantKeywords(text: string): boolean {
        const lowerText = text.toLowerCase();
        return this.RELEVANT_KEYWORDS.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Calculate basic readability score
     * Based on average word length and sentence structure
     * @param text - Text to analyze
     * @returns Score between 0 and 1
     */
    private calculateReadability(text: string): number {
        // Split into words
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);

        if (words.length === 0) return 0;

        // Calculate average word length
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

        // Calculate ratio of meaningful words (non-stopwords)
        const meaningfulWords = words.filter(word => !this.STOPWORDS.has(word));
        const meaningfulRatio = meaningfulWords.length / words.length;

        // Calculate sentence count
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);

        // Readability scoring
        let score = 1.0;

        // Penalize very short or very long words
        if (avgWordLength < 3) score *= 0.7;      // Too simple or broken
        if (avgWordLength > 12) score *= 0.8;     // Possibly OCR errors

        // Reward good meaningful word ratio (40-70% is good for Spanish)
        if (meaningfulRatio >= 0.4 && meaningfulRatio <= 0.7) {
            score *= 1.1;
        } else if (meaningfulRatio < 0.2 || meaningfulRatio > 0.9) {
            score *= 0.7;
        }

        // Penalize very short or very long sentences
        if (avgWordsPerSentence < 5) score *= 0.8;     // Too choppy
        if (avgWordsPerSentence > 40) score *= 0.8;    // Too long

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Determine if a chunk should be filtered out based on quality threshold
     * @param metrics - Quality metrics
     * @param threshold - Minimum acceptable quality score (default: 0.5)
     * @returns True if chunk should be kept
     */
    shouldKeepChunk(metrics: QualityMetrics, threshold: number = 0.5): boolean {
        return metrics.qualityScore >= threshold;
    }

    /**
     * Get human-readable quality assessment
     * @param score - Quality score
     * @returns Quality label
     */
    getQualityLabel(score: number): string {
        if (score >= 0.8) return 'Excellent';
        if (score >= 0.6) return 'Good';
        if (score >= 0.4) return 'Fair';
        if (score >= 0.2) return 'Poor';
        return 'Very Poor';
    }
}
