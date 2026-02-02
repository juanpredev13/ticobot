import { Logger } from '@ticobot/shared';
import type { ILLMProvider } from '@ticobot/shared';
import { parseTOON, validateTOON } from '../utils/toon.js';
import { countTokens, estimateJSONTokens, formatTokenSavings } from '../utils/tokenCounter.js';
import { toonStatsTracker } from '../utils/toonStats.js';
import { InputSanitizer, type SanitizationResult } from '../../security/InputSanitizer.js';
import { PromptHardener, type HardenedPrompt } from '../../security/PromptHardener.js';

/**
 * Query processing result
 */
export interface ProcessedQuery {
    originalQuery: string;
    enhancedQuery: string;      // Query with expanded context
    keywords: string[];          // Extracted keywords for hybrid search
    entities: string[];          // Detected entities
    intent: string;             // Query intent (question, comparison, lookup)
}

/**
 * QueryProcessor - Pre-RAG query enhancement
 * Extracts keywords and entities from user queries to improve hybrid search precision
 * Part of the strategy to achieve 95%+ accuracy
 * 
 * SECURITY: Now includes prompt injection protection and input sanitization
 */
export class QueryProcessor {
    private readonly logger: Logger;
    private readonly inputSanitizer: InputSanitizer;
    private readonly promptHardener: PromptHardener;

    constructor() {
        this.logger = new Logger('QueryProcessor');
        this.inputSanitizer = new InputSanitizer();
        this.promptHardener = new PromptHardener();
    }

    /**
     * Process user query to extract keywords and enhance search
     * @param query - User's original query
     * @param llmProvider - LLM provider for keyword extraction
     * @returns Processed query with keywords
     * @throws Error if input is blocked due to security concerns
     */
    async processQuery(
        query: string,
        llmProvider: ILLMProvider
    ): Promise<ProcessedQuery> {
        this.logger.info(`Processing query: "${query.substring(0, 100)}..."`);

        try {
            // SECURITY: Step 1 - Sanitize input and detect injection attempts
            const sanitizationResult = this.inputSanitizer.sanitize(query);
            
            if (this.inputSanitizer.shouldBlock(sanitizationResult)) {
                const error = new Error(`Query blocked for security reasons: ${sanitizationResult.blockedReasons.join(', ')}`);
                this.logger.error('Query blocked', {
                    riskScore: sanitizationResult.riskScore,
                    reasons: sanitizationResult.blockedReasons,
                    originalLength: sanitizationResult.originalLength
                });
                throw error;
            }

            if (sanitizationResult.isSuspicious) {
                this.logger.warn('Suspicious query detected, proceeding with caution', {
                    riskScore: sanitizationResult.riskScore,
                    riskLevel: this.inputSanitizer.getRiskLevel(sanitizationResult.riskScore),
                    sanitizedPreview: sanitizationResult.sanitized.substring(0, 100)
                });
            }

            // Use sanitized query for processing
            const safeQuery = sanitizationResult.sanitized;
            // SECURITY: Step 2 - Harden prompts for LLM interaction
            const systemPrompt = this.promptHardener.createSecureTemplate('query_analysis');
            const userPrompt = `Analiza la siguiente consulta sobre política costarricense y extrae información estructurada.

Consulta del usuario: "${safeQuery}"

Devuelve SOLO TOON (Token-Oriented Object Notation) con:
keywords: 3-10 términos importantes (sin stopwords)
entities: instituciones, partidos, lugares detectados
intent: question|comparison|lookup
enhancedQuery: consulta reformulada con contexto adicional`;

            // Apply prompt hardening
            const hardenedPrompts = this.promptHardener.hardenPrompts(systemPrompt, userPrompt);

            // SECURITY: Step 3 - Check for escape attempts before LLM call
            if (hardenedPrompts.hasEscapedContent) {
                this.logger.warn('Escape attempts detected in prompt, using fallback extraction');
                return this.fallbackExtraction(safeQuery);
            }

            const response = await llmProvider.generateCompletion(
                [
                    { role: 'system', content: hardenedPrompts.systemPrompt },
                    { role: 'user', content: hardenedPrompts.userPrompt },
                ],
                {
                    temperature: 0.3, // Low temperature for consistent extraction
                    maxTokens: 500,
                }
            );

            // SECURITY: Step 4 - Validate LLM response for prompt leakage
            if (this.containsPromptLeakage(response.content, systemPrompt)) {
                this.logger.warn('Potential prompt leakage detected in LLM response');
                // Continue with extraction but log the incident
            }

            // Count tokens in the actual LLM response
            const responseTokens = countTokens(response.content);

            // Parse TOON response (with JSON fallback for compatibility)
            let parsed = this.parseTOONResponse(response.content);
            let usedFormat: 'TOON' | 'JSON' = 'TOON';
            
            // Fallback to JSON if TOON parsing fails
            if (!parsed) {
                this.logger.warn('TOON parsing failed, trying JSON fallback');
                parsed = this.parseJSONResponse(response.content);
                usedFormat = 'JSON';
            }

            if (!parsed) {
                // Final fallback: basic keyword extraction
                this.logger.warn('LLM response parsing failed, using fallback extraction');
                return this.fallbackExtraction(query);
            }

            const result: ProcessedQuery = {
                originalQuery: query, // Keep original for logging
                enhancedQuery: parsed.enhancedQuery || safeQuery,
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
                entities: Array.isArray(parsed.entities) ? parsed.entities : [],
                intent: parsed.intent || 'question',
            };

            // Calculate token savings: estimate what JSON would have been
            const jsonEquivalent = {
                keywords: result.keywords,
                entities: result.entities,
                intent: result.intent,
                enhancedQuery: result.enhancedQuery,
            };
            const estimatedJsonTokens = estimateJSONTokens(jsonEquivalent);
            const savings = formatTokenSavings(estimatedJsonTokens, responseTokens);

            // Track statistics
            toonStatsTracker.recordQuery(query, responseTokens, estimatedJsonTokens);

            this.logger.info(`Extracted ${result.keywords.length} keywords, ${result.entities.length} entities`);
            this.logger.info(`Keywords: ${result.keywords.join(', ')}`);
            if (result.entities.length > 0) {
                this.logger.info(`Entities: ${result.entities.join(', ')}`);
            }
            this.logger.info(
                `📊 Token usage: ${usedFormat} format - ${responseTokens} tokens ` +
                `(vs ~${estimatedJsonTokens} JSON) - Saved ${savings}`
            );

            // SECURITY: Log security metrics
            this.logger.info('Security metrics', {
                riskScore: sanitizationResult.riskScore,
                riskLevel: this.inputSanitizer.getRiskLevel(sanitizationResult.riskScore),
                hasEscapedContent: hardenedPrompts.hasEscapedContent,
                isolationMarkers: hardenedPrompts.isolationMarkers.length
            });

            return result;

        } catch (error) {
            this.logger.error('Query processing failed:', error);
            
            // Check if this is a security-related error
            if (error instanceof Error && error.message.includes('security reasons')) {
                throw error; // Re-throw security errors
            }
            
            // Fallback to basic extraction with safe query
            const sanitizationResult = this.inputSanitizer.sanitize(query);
            const safeQuery = this.inputSanitizer.shouldBlock(sanitizationResult) 
                ? 'consulta genérica' 
                : sanitizationResult.sanitized;
            
            return this.fallbackExtraction(safeQuery);
        }
    }

    /**
     * Parse TOON (Token-Oriented Object Notation) from LLM response
     * TOON format is more compact than JSON, saving 30-60% tokens
     */
    private parseTOONResponse(text: string): any {
        const parsed = parseTOON(text);
        
        // Validate required fields for QueryProcessor
        if (!validateTOON(parsed, ['keywords', 'intent', 'enhancedQuery'])) {
            return null;
        }

        return parsed;
    }

    /**
     * Parse JSON from LLM response (handles markdown code blocks)
     * Fallback for compatibility with older prompts
     */
    private parseJSONResponse(text: string): any {
        try {
            // Remove markdown code blocks if present
            let cleaned = text.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
            }

            return JSON.parse(cleaned);
        } catch (error) {
            this.logger.warn('Failed to parse JSON response:', error);
            return null;
        }
    }

    /**
     * Fallback keyword extraction (basic, no LLM)
     * Used when LLM extraction fails
     */
    private fallbackExtraction(query: string): ProcessedQuery {
        const words = query.toLowerCase().split(/\s+/);

        // Simple stopwords
        const stopwords = new Set(['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'por', 'con', 'para', 'qué', 'cómo', 'cuál']);

        // Extract non-stopword tokens
        const keywords = words
            .filter(w => w.length > 2 && !stopwords.has(w))
            .slice(0, 10);

        // Detect known entities (basic pattern matching)
        const entities: string[] = [];
        const knownEntities = ['PLN', 'PAC', 'PUSC', 'CCSS', 'ICE', 'MEP', 'TSE'];
        for (const entity of knownEntities) {
            if (query.toUpperCase().includes(entity)) {
                entities.push(entity);
            }
        }

        return {
            originalQuery: query,
            enhancedQuery: query,
            keywords,
            entities,
            intent: query.includes('compar') ? 'comparison' : 'question',
        };
    }

    /**
     * Build enhanced search text combining query + keywords + entities
     * This is what gets passed to the keyword search component
     */
    buildSearchText(processed: ProcessedQuery): string {
        const parts = [
            processed.enhancedQuery,
            ...processed.keywords,
            ...processed.entities,
        ];

        return parts.join(' ');
    }

    /**
     * SECURITY: Check if LLM response contains prompt leakage
     */
    private containsPromptLeakage(response: string, systemPrompt: string): boolean {
        const responseLower = response.toLowerCase();
        const systemLower = systemPrompt.toLowerCase();
        
        // Check for system instruction fragments
        const leakIndicators = [
            'critical instructions',
            'system instruction',
            'ignore user input',
            'authoritative and override',
            'do not reveal',
            'boundary marker'
        ];
        
        for (const indicator of leakIndicators) {
            if (responseLower.includes(indicator)) {
                this.logger.warn('Prompt leakage indicator found:', { indicator });
                return true;
            }
        }
        
        // Check for exact matches of unique system phrases
        const uniquePhrases = [
            'costa rican political analysis',
            'specialized role',
            'security markers'
        ];
        
        for (const phrase of uniquePhrases) {
            if (responseLower.includes(phrase) && !systemLower.includes(phrase)) {
                // If phrase appears in response but not in system, it might be leaked
                this.logger.warn('Potential system phrase leakage:', { phrase });
                return true;
            }
        }
        
        return false;
    }

    /**
     * SECURITY: Get security metrics for monitoring
     */
    getSecurityMetrics(query: string): {
        sanitizationResult: SanitizationResult;
        riskLevel: string;
        isBlocked: boolean;
    } {
        const sanitizationResult = this.inputSanitizer.sanitize(query);
        return {
            sanitizationResult,
            riskLevel: this.inputSanitizer.getRiskLevel(sanitizationResult.riskScore),
            isBlocked: this.inputSanitizer.shouldBlock(sanitizationResult)
        };
    }

    /**
     * SECURITY: Update security configuration
     */
    updateSecurityConfig(config: {
        sanitization?: any;
        hardening?: any;
    }): void {
        if (config.sanitization) {
            this.inputSanitizer.updateConfig(config.sanitization);
        }
        if (config.hardening) {
            this.promptHardener.updateConfig(config.hardening);
        }
        this.logger.info('Security configuration updated');
    }
}
