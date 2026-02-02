import { Logger } from '@ticobot/shared';

/**
 * Sanitization result with risk assessment
 */
export interface SanitizationResult {
    sanitized: string;
    isSuspicious: boolean;
    riskScore: number;
    blockedReasons: string[];
    originalLength: number;
    sanitizedLength: number;
}

/**
 * Configuration for input sanitization
 */
export interface SanitizationConfig {
    maxInputLength: number;
    allowedCharacters: RegExp;
    riskThresholds: {
        low: number;
        medium: number;
        high: number;
    };
}

/**
 * Known prompt injection patterns and their risk levels
 */
const INJECTION_PATTERNS = [
    // High risk - direct instruction override
    {
        pattern: /(ignore|forget|disregard).*(previous|above|system|instructions?)/gi,
        risk: 90,
        reason: 'Attempt to ignore system instructions'
    },
    {
        pattern: /(new|updated|changed).*(instructions?|rules?|prompts?)/gi,
        risk: 85,
        reason: 'Attempt to modify system instructions'
    },
    {
        pattern: /(you are now|act as|pretend to be|roleplay as)/gi,
        risk: 80,
        reason: 'Attempt to change AI persona'
    },
    {
        pattern: /(system:|developer:|admin:|operator:)/gi,
        risk: 75,
        reason: 'Attempt to impersonate system admin'
    },
    
    // Medium risk - jailbreak attempts
    {
        pattern: /(jailbreak|jail.*break|escape|bypass|circumvent)/gi,
        risk: 70,
        reason: 'Explicit jailbreak attempt'
    },
    {
        pattern: /(dan|d\.a\.n\.|do.*anything.*now)/gi,
        risk: 65,
        reason: 'DAN jailbreak pattern'
    },
    {
        pattern: /(hypothetically|theoretically|imagine|what if)/gi,
        risk: 45,
        reason: 'Hypothetical scenario probing'
    },
    {
        pattern: /(character|personality|ai|assistant).*(reveal|show|tell|leak)/gi,
        risk: 60,
        reason: 'Attempt to extract system information'
    },
    
    // Lower risk - suspicious patterns
    {
        pattern: /(code.*execute|run.*code|execute.*script)/gi,
        risk: 40,
        reason: 'Code execution attempt'
    },
    {
        pattern: /(token|limit|count|boundary).*(exceed|bypass|ignore)/gi,
        risk: 35,
        reason: 'Token limit circumvention'
    },
    
    // Special characters and encoding
    {
        pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
        risk: 50,
        reason: 'Control characters detected'
    },
    {
        pattern: /(base64|hex|binary).*(decode|encode|convert)/gi,
        risk: 30,
        reason: 'Encoding manipulation attempt'
    }
];

/**
 * Suspicious keywords collection
 */
const SUSPICIOUS_KEYWORDS = [
    'prompt', 'instruction', 'system', 'admin', 'developer',
    'bypass', 'override', 'ignore', 'forget', 'disregard',
    'jailbreak', 'escape', 'leak', 'reveal', 'expose',
    'token', 'limit', 'boundary', 'circumvent'
];

/**
 * InputSanitizer - protects against prompt injection attacks
 * 
 * Features:
 * - Pattern-based injection detection
 * - Risk scoring system (0-100)
 * - Input validation and sanitization
 * - Detailed logging for security monitoring
 */
export class InputSanitizer {
    private readonly logger: Logger;
    private readonly config: SanitizationConfig;

    constructor(config?: Partial<SanitizationConfig>) {
        this.logger = new Logger('InputSanitizer');
        
        this.config = {
            maxInputLength: config?.maxInputLength ?? 2000,
            allowedCharacters: config?.allowedCharacters ?? /^[a-zA-Z0-9\s.,?!¡¿:;()\-'"áéíóúÁÉÍÓÚñÑüÜ]+$/,
            riskThresholds: config?.riskThresholds ?? {
                low: 30,
                medium: 60,
                high: 75
            }
        };
    }

    /**
     * Sanitize and validate user input
     * @param input - Raw user input
     * @returns SanitizationResult with risk assessment
     */
    sanitize(input: string): SanitizationResult {
        const originalLength = input.length;
        
        // Step 1: Basic validation
        const basicValidation = this.validateBasicConstraints(input);
        if (!basicValidation.isValid) {
            return this.createBlockedResult(input, originalLength, [basicValidation.reason!], 100);
        }

        // Step 2: Pattern detection
        const patternMatches = this.detectInjectionPatterns(input);
        
        // Step 3: Keyword analysis
        const keywordMatches = this.analyzeKeywords(input);
        
        // Step 4: Calculate risk score
        const riskScore = this.calculateRiskScore(patternMatches, keywordMatches);
        
        // Step 5: Sanitize content
        const sanitized = this.sanitizeContent(input, patternMatches);
        
        // Step 6: Determine if suspicious
        const isSuspicious = riskScore >= this.config.riskThresholds.medium;
        const blockedReasons = this.getBlockedReasons(patternMatches, keywordMatches, riskScore);

        // Step 7: Log security events
        this.logSecurityEvent(input, sanitized, riskScore, blockedReasons);

        return {
            sanitized,
            isSuspicious,
            riskScore,
            blockedReasons,
            originalLength,
            sanitizedLength: sanitized.length
        };
    }

    /**
     * Validate basic input constraints
     */
    private validateBasicConstraints(input: string): { isValid: boolean; reason?: string } {
        // Check length
        if (input.length > this.config.maxInputLength) {
            return {
                isValid: false,
                reason: `Input too long: ${input.length} > ${this.config.maxInputLength}`
            };
        }

        // Check for empty input
        if (input.trim().length === 0) {
            return {
                isValid: false,
                reason: 'Empty input'
            };
        }

        return { isValid: true };
    }

    /**
     * Detect known injection patterns
     */
    private detectInjectionPatterns(input: string): Array<{ pattern: RegExp; risk: number; reason: string; matches: string[] }> {
        const matches: Array<{ pattern: RegExp; risk: number; reason: string; matches: string[] }> = [];

        for (const injectionPattern of INJECTION_PATTERNS) {
            const foundMatches = Array.from(input.matchAll(injectionPattern.pattern));
            if (foundMatches.length > 0) {
                matches.push({
                    pattern: injectionPattern.pattern,
                    risk: injectionPattern.risk,
                    reason: injectionPattern.reason,
                    matches: foundMatches.map(match => match[0])
                });
            }
        }

        return matches;
    }

    /**
     * Analyze suspicious keywords
     */
    private analyzeKeywords(input: string): Array<{ keyword: string; count: number; risk: number }> {
        const lowercaseInput = input.toLowerCase();
        const matches: Array<{ keyword: string; count: number; risk: number }> = [];

        for (const keyword of SUSPICIOUS_KEYWORDS) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const foundMatches = Array.from(lowercaseInput.matchAll(regex));
            
            if (foundMatches.length > 0) {
                matches.push({
                    keyword,
                    count: foundMatches.length,
                    risk: Math.min(foundMatches.length * 5, 20) // Max 20 points per keyword
                });
            }
        }

        return matches;
    }

    /**
     * Calculate overall risk score
     */
    private calculateRiskScore(
        patternMatches: Array<{ risk: number }>,
        keywordMatches: Array<{ risk: number }>
    ): number {
        let totalRisk = 0;

        // Add risk from pattern matches (highest risk)
        for (const match of patternMatches) {
            totalRisk += match.risk;
        }

        // Add risk from keyword matches
        for (const match of keywordMatches) {
            totalRisk += match.risk;
        }

        // Cap at 100
        return Math.min(totalRisk, 100);
    }

    /**
     * Sanitize content by removing or modifying suspicious parts
     */
    private sanitizeContent(input: string, patternMatches: Array<{ pattern: RegExp; risk: number }>): string {
        let sanitized = input;

        // Remove control characters
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Normalize whitespace (after removing control chars)
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        // Remove or replace high-risk patterns
        for (const match of patternMatches) {
            if (match.risk >= 70) {
                // Remove high-risk patterns entirely
                sanitized = sanitized.replace(match.pattern, '[REDACTED]');
            }
        }

        return sanitized;
    }

    /**
     * Get blocked reasons based on risk level and matches
     */
    private getBlockedReasons(
        patternMatches: Array<{ reason: string; risk: number }>,
        keywordMatches: Array<{ keyword: string; count: number }>,
        riskScore: number
    ): string[] {
        const reasons: string[] = [];

        // High-risk pattern reasons
        for (const match of patternMatches) {
            if (match.risk >= this.config.riskThresholds.medium) { // Include medium risk patterns too
                reasons.push(match.reason);
            }
        }

        // Multiple suspicious keywords
        if (keywordMatches.length >= 3) {
            reasons.push('Multiple suspicious keywords detected');
        }

        // Very high overall risk
        if (riskScore >= 85) {
            reasons.push('Very high risk score detected');
        }

        return reasons;
    }

    /**
     * Create a blocked result
     */
    private createBlockedResult(
        input: string,
        originalLength: number,
        reasons: string[],
        riskScore: number
    ): SanitizationResult {
        this.logger.warn('Input blocked:', { reasons, riskScore, inputLength: originalLength });

        return {
            sanitized: '[BLOCKED - Invalid input]',
            isSuspicious: true,
            riskScore,
            blockedReasons: reasons,
            originalLength,
            sanitizedLength: 20
        };
    }

    /**
     * Log security events for monitoring
     */
    private logSecurityEvent(
        original: string,
        sanitized: string,
        riskScore: number,
        blockedReasons: string[]
    ): void {
        if (riskScore >= this.config.riskThresholds.medium) {
            this.logger.warn('Suspicious input detected', {
                riskScore,
                blockedReasons,
                originalLength: original.length,
                sanitizedLength: sanitized.length,
                originalPreview: original.substring(0, 100) + (original.length > 100 ? '...' : ''),
                sanitizedPreview: sanitized.substring(0, 100) + (sanitized.length > 100 ? '...' : '')
            });
        } else if (riskScore > 0) {
            this.logger.info('Input sanitization completed', {
                riskScore,
                originalLength: original.length,
                sanitizedLength: sanitized.length
            });
        }
    }

    /**
     * Check if input should be completely blocked
     */
    shouldBlock(result: SanitizationResult): boolean {
        return result.riskScore >= this.config.riskThresholds.high || result.blockedReasons.length > 0;
    }

    /**
     * Get risk level description
     */
    getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
        if (riskScore >= 85) return 'critical';
        if (riskScore >= this.config.riskThresholds.high) return 'high';
        if (riskScore >= this.config.riskThresholds.medium) return 'medium';
        return 'low';
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<SanitizationConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('InputSanitizer configuration updated', { config: this.config });
    }
}