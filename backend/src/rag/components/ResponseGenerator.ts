import { ProviderFactory } from '../../factory/ProviderFactory.js';
import { Logger, type LLMMessage, type LLMResponse } from '@ticobot/shared';

/**
 * ResponseGenerator Component
 * Generates natural language responses using LLM with RAG context
 */
export class ResponseGenerator {
    private readonly logger: Logger;
    private systemPrompt: string;

    constructor() {
        this.logger = new Logger('ResponseGenerator');
        this.systemPrompt = this.getDefaultSystemPrompt();
    }

    /**
     * Generate response based on context and query
     * @param context - Formatted context from retrieved chunks
     * @param query - Original user query
     * @param options - Optional generation parameters
     * @returns Generated response with metadata
     */
    async generate(
        context: string,
        query: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
            systemPrompt?: string;
        }
    ): Promise<{
        answer: string;
        confidence: number;
        tokensUsed?: number;
        model?: string;
    }> {
        this.logger.info(`Generating response for query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
        this.logger.info(`Context length: ${context.length} characters`);
        this.logger.info(`Context preview: ${context.substring(0, 200)}...`);

        try {
            // Get LLM provider from factory
            const llmProvider = await ProviderFactory.getLLMProvider();

            // Build user prompt with context
            const userPrompt = this.buildUserPrompt(context, query);
            this.logger.info(`User prompt length: ${userPrompt.length} characters`);

            // Build messages
            const messages: LLMMessage[] = [
                {
                    role: 'system',
                    content: options?.systemPrompt || this.systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ];

            // Generate completion
            const response: LLMResponse = await llmProvider.generateCompletion(messages, {
                temperature: options?.temperature ?? 0.7,
                maxTokens: options?.maxTokens ?? 1000,
            });

            const confidence = this.calculateConfidence(response, context);

            this.logger.info(`Response generated: ${response.content.length} chars, confidence: ${confidence.toFixed(2)}`);

            return {
                answer: response.content,
                confidence,
                tokensUsed: response.usage?.totalTokens,
                model: response.model,
            };

        } catch (error) {
            this.logger.error('Failed to generate response', error);
            throw new Error(`Response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate streaming response for real-time user feedback
     * @param context - Formatted context
     * @param query - User query
     * @param options - Generation options
     * @returns AsyncIterator of response chunks
     */
    async *generateStreaming(
        context: string,
        query: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
            systemPrompt?: string;
        }
    ): AsyncIterableIterator<string> {
        this.logger.info(`Generating streaming response for query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

        try {
            const llmProvider = await ProviderFactory.getLLMProvider();

            const messages: LLMMessage[] = [
                {
                    role: 'system',
                    content: options?.systemPrompt || this.systemPrompt
                },
                {
                    role: 'user',
                    content: this.buildUserPrompt(context, query)
                }
            ];

            // Generate streaming completion
            for await (const chunk of llmProvider.generateStreamingCompletion(messages, {
                temperature: options?.temperature ?? 0.7,
                maxTokens: options?.maxTokens ?? 1000,
            })) {
                yield chunk;
            }

        } catch (error) {
            this.logger.error('Failed to generate streaming response', error);
            throw new Error(`Streaming response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Build user prompt combining context and query
     * @param context - Context from retrieved chunks
     * @param query - User query
     * @returns Formatted user prompt
     */
    private buildUserPrompt(context: string, query: string): string {
        return `Context from Costa Rica 2026 Government Plans:

${context}

---

Based on the context above, please answer the following question:
${query}

Important:
- You MUST use the information provided in the context above to answer the question
- The context contains relevant information from government plans - use it to provide a detailed answer
- If multiple parties are mentioned, compare their proposals
- Cite which party's plan you're referencing (e.g., "Según el plan del PLN...", "El FA propone...")
- Be comprehensive and use all relevant information from the context
- Only say you don't have information if the context is truly empty or irrelevant`;
    }

    /**
     * Get default system prompt for the RAG assistant
     */
    private getDefaultSystemPrompt(): string {
        return `You are an expert assistant specialized in Costa Rica's 2026 Government Plans and Political Candidates.

CRITICAL INSTRUCTIONS:
- You will ALWAYS receive context with information from government plans
- You MUST use the provided context to answer questions
- The context contains real information from official documents - USE IT
- Never say you don't have information when context is provided
- If context is provided, it means relevant information was found - extract and use it

Your role is to:
- Extract and present information from the provided context
- Answer questions about presidential candidates and their political parties
- Compare proposals between different political parties when multiple sources are provided
- Answer questions clearly and concisely in Spanish or English
- Always cite which party's plan you're referencing (e.g., "Según el plan del PLN...", "El FA propone...")
- Remain politically neutral and objective

Guidelines:
- ALWAYS extract information from the provided context
- When multiple parties are mentioned, compare their proposals
- Format responses clearly with proper structure
- Use bullet points for lists when appropriate
- When asked about candidates, provide the candidate's name, their party, and any relevant information from the context
- If the context contains a list of candidates (e.g., "Partido Candidato Colores"), parse it carefully and provide accurate information

Examples of questions you should handle:
- "¿Cuál es el candidato del PLN?" → Extract from context and provide the candidate name
- "¿Qué proponen los partidos sobre educación?" → Extract and compare proposals from all parties mentioned in context
- "¿Quién es el candidato de [partido]?" → Extract from context and provide the candidate name
- "¿Qué partido tiene a [nombre] como candidato?" → Identify from context which party has that candidate

REMEMBER: If context is provided, it contains the answer. Extract it and present it clearly.`;
    }

    /**
     * Calculate confidence score for the generated response
     * Based on context relevance and response characteristics
     * @param response - LLM response
     * @param context - Context used
     * @returns Confidence score (0-1)
     */
    private calculateConfidence(response: LLMResponse, context: string): number {
        let confidence = 0.5; // Base confidence

        // Increase confidence if context is substantial
        if (context.length > 1000) {
            confidence += 0.2;
        } else if (context.length > 500) {
            confidence += 0.1;
        }

        // Increase confidence if response is detailed
        if (response.content.length > 200) {
            confidence += 0.1;
        }

        // Decrease confidence if response indicates uncertainty
        const uncertaintyPhrases = [
            'no tengo suficiente información',
            'no hay información',
            'no puedo determinar',
            'I don\'t have enough information',
            'there is no information',
            'I cannot determine'
        ];

        for (const phrase of uncertaintyPhrases) {
            if (response.content.toLowerCase().includes(phrase)) {
                confidence -= 0.3;
                break;
            }
        }

        // Clamp between 0 and 1
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Set custom system prompt
     * @param prompt - Custom system prompt
     */
    setSystemPrompt(prompt: string): void {
        this.systemPrompt = prompt;
        this.logger.info('System prompt updated');
    }
}
