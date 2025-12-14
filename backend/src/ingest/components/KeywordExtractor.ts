import { Logger } from '@ticobot/shared';

/**
 * Keyword extraction result
 */
export interface KeywordExtractionResult {
    keywords: string[];      // Top keywords/phrases
    entities: string[];      // Named entities (places, organizations, etc.)
}

/**
 * KeywordExtractor - Extracts keywords and entities from Spanish text
 * Uses TF-IDF-like approach and pattern matching for Costa Rica-specific terms
 */
export class KeywordExtractor {
    private readonly logger: Logger;

    // Spanish stopwords to filter out
    private readonly STOPWORDS = new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se',
        'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar',
        'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o',
        'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'la', 'si',
        'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
        'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno',
        'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer',
        'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni',
        'antes', 'estos', 'mis', 'contra', 'los', 'sus', 'nos', 'durante',
        'tanto', 'menos', 'solo', 'nivel', 'forma', 'además', 'donde',
        'cual', 'cada', 'todas', 'todos', 'hay', 'fue', 'sido', 'será'
    ]);

    // Domain-specific keywords for Costa Rica government plans
    private readonly DOMAIN_KEYWORDS = new Set([
        'educación', 'salud', 'seguridad', 'empleo', 'ambiente',
        'infraestructura', 'economía', 'desarrollo', 'social', 'política',
        'gobierno', 'nacional', 'pública', 'derechos', 'ciudadanos',
        'programa', 'proyecto', 'plan', 'estrategia', 'objetivo',
        'reforma', 'presupuesto', 'inversión', 'corrupción', 'transparencia',
        'justicia', 'vivienda', 'transporte', 'energía', 'agua',
        'tecnología', 'innovación', 'cultura', 'deporte', 'turismo',
        'agricultura', 'comercio', 'industria', 'emprendimiento'
    ]);

    // Named entity patterns for Costa Rica
    private readonly ENTITY_PATTERNS = [
        // Government institutions
        /\b(TSE|CCSS|ICE|RECOPE|AyA|JASEC|ESPH|BCR|BNCR|INS|CONAVI|MOPT|MEP|MICITT|MEIC)\b/gi,

        // Costa Rican provinces and cantons
        /\b(San José|Alajuela|Cartago|Heredia|Guanacaste|Puntarenas|Limón)\b/gi,
        /\b(Tibás|Moravia|Goicoechea|Desamparados|Escazú|Curridabat|Montes de Oca)\b/gi,

        // Government bodies
        /\b(Asamblea Legislativa|Poder Ejecutivo|Poder Judicial|Contraloría|Defensoría)\b/gi,
        /\b(Ministerio de [A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)\b/gi,

        // Generic organizations
        /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+(de|del|para)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)\b/g,
    ];

    constructor() {
        this.logger = new Logger('KeywordExtractor');
    }

    /**
     * Extract keywords and entities from text
     * @param text - Text to analyze
     * @param maxKeywords - Maximum number of keywords to return (default: 10)
     * @returns Keywords and entities
     */
    extract(text: string, maxKeywords: number = 10): KeywordExtractionResult {
        const keywords = this.extractKeywords(text, maxKeywords);
        const entities = this.extractEntities(text);

        return {
            keywords,
            entities,
        };
    }

    /**
     * Extract top keywords using TF-IDF-like approach
     * @param text - Text to analyze
     * @param maxKeywords - Maximum number of keywords
     * @returns Array of keywords
     */
    private extractKeywords(text: string, maxKeywords: number): string[] {
        // Normalize text
        const normalizedText = this.normalizeText(text);

        // Tokenize into words
        const words = normalizedText.split(/\s+/).filter(w => w.length > 0);

        // Extract n-grams (1-grams, 2-grams, 3-grams)
        const ngrams = [
            ...this.extractNGrams(words, 1),
            ...this.extractNGrams(words, 2),
            ...this.extractNGrams(words, 3),
        ];

        // Calculate term frequency
        const termFrequency = new Map<string, number>();
        for (const ngram of ngrams) {
            termFrequency.set(ngram, (termFrequency.get(ngram) || 0) + 1);
        }

        // Filter and score terms
        const scoredTerms: Array<{ term: string; score: number }> = [];

        for (const [term, freq] of termFrequency.entries()) {
            // Skip if too short or is stopword
            if (term.length < 3) continue;
            if (this.isStopword(term)) continue;

            // Calculate score (TF-based with domain boost)
            let score = freq;

            // Boost domain-specific keywords
            if (this.isDomainKeyword(term)) {
                score *= 2.0;
            }

            // Boost longer n-grams (they tend to be more specific)
            const wordCount = term.split(' ').length;
            if (wordCount === 2) score *= 1.5;
            if (wordCount === 3) score *= 2.0;

            // Boost capitalized terms (likely important)
            if (this.isCapitalized(term)) {
                score *= 1.3;
            }

            scoredTerms.push({ term, score });
        }

        // Sort by score and return top N
        scoredTerms.sort((a, b) => b.score - a.score);

        return scoredTerms
            .slice(0, maxKeywords)
            .map(item => item.term);
    }

    /**
     * Extract named entities from text
     * @param text - Text to analyze
     * @returns Array of entities
     */
    private extractEntities(text: string): string[] {
        const entities = new Set<string>();

        // Apply entity patterns
        for (const pattern of this.ENTITY_PATTERNS) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                entities.add(match[0].trim());
            }
        }

        return Array.from(entities);
    }

    /**
     * Extract n-grams from word array
     * @param words - Array of words
     * @param n - N-gram size
     * @returns Array of n-grams
     */
    private extractNGrams(words: string[], n: number): string[] {
        const ngrams: string[] = [];

        for (let i = 0; i <= words.length - n; i++) {
            const ngram = words.slice(i, i + n).join(' ');
            ngrams.push(ngram);
        }

        return ngrams;
    }

    /**
     * Normalize text for processing
     * @param text - Raw text
     * @returns Normalized text
     */
    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            // Keep Spanish accents
            .replace(/[^\wáéíóúñüÁÉÍÓÚÑÜ\s]/g, ' ')
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Check if term is a stopword
     * @param term - Term to check
     * @returns True if stopword
     */
    private isStopword(term: string): boolean {
        const words = term.split(' ');

        // If all words are stopwords, it's a stopword phrase
        if (words.every(word => this.STOPWORDS.has(word))) {
            return true;
        }

        // If it's a single word stopword
        if (words.length === 1 && this.STOPWORDS.has(term)) {
            return true;
        }

        return false;
    }

    /**
     * Check if term is a domain-specific keyword
     * @param term - Term to check
     * @returns True if domain keyword
     */
    private isDomainKeyword(term: string): boolean {
        const words = term.split(' ');
        return words.some(word => this.DOMAIN_KEYWORDS.has(word));
    }

    /**
     * Check if term starts with capital letter in original text
     * @param term - Term to check
     * @returns True if capitalized
     */
    private isCapitalized(term: string): boolean {
        return /^[A-ZÁÉÍÓÚÑÜ]/.test(term);
    }
}
