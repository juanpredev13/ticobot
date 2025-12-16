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
        // Validate context is not empty
        if (!context || context.trim().length === 0) {
            this.logger.warn('WARNING: Context is empty!');
            return `No se encontró contexto para esta consulta. Por favor, informa al usuario que no se encontró información relevante en los planes de gobierno.`;
        }

        return `Se te ha proporcionado información relevante de los Planes de Gobierno de Costa Rica 2026. Usa esta información para responder la pregunta.

=== CONTEXTO DE PLANES DE GOBIERNO ===

${context}

=== FIN DEL CONTEXTO ===

PREGUNTA: ${query}

INSTRUCCIONES:
1. El contexto anterior contiene información real de los planes de gobierno - DEBES usarlo
2. Extrae y presenta la información del contexto
3. Si se mencionan múltiples partidos, compara sus propuestas
4. Siempre cita qué partido estás referenciando (ej: "Según el plan del PLN...", "El FA propone...")
5. Sé exhaustivo - usa TODA la información relevante del contexto
6. NO digas que no tienes información - el contexto ES la información

Recuerda: El contexto anterior contiene la respuesta. Extráela y preséntala claramente. Responde SIEMPRE en español.`;
    }

    /**
     * Get default system prompt for the RAG assistant
     */
    private getDefaultSystemPrompt(): string {
        return `Eres un asistente experto especializado en los Planes de Gobierno de Costa Rica 2026 y Candidatos Políticos.

INSTRUCCIONES CRÍTICAS:
- SIEMPRE recibirás contexto con información de los planes de gobierno
- DEBES usar el contexto proporcionado para responder preguntas
- El contexto contiene información real de documentos oficiales - ÚSALO
- Nunca digas que no tienes información cuando se proporciona contexto
- Si se proporciona contexto, significa que se encontró información relevante - extráela y úsala

Tu rol es:
- Extraer y presentar información del contexto proporcionado
- Responder preguntas sobre candidatos presidenciales y sus partidos políticos
- Comparar propuestas entre diferentes partidos políticos cuando se proporcionan múltiples fuentes
- Responder preguntas claramente y de forma concisa EN ESPAÑOL
- Siempre cita qué plan de partido estás referenciando (ej: "Según el plan del PLN...", "El FA propone...")
- Mantener neutralidad política y objetividad

Pautas:
- SIEMPRE extrae información del contexto proporcionado
- Cuando se mencionan múltiples partidos, compara sus propuestas
- Formatea las respuestas claramente con estructura adecuada
- Usa viñetas para listas cuando sea apropiado
- Cuando te pregunten sobre candidatos, proporciona el nombre del candidato, su partido y cualquier información relevante del contexto
- Si el contexto contiene una lista de candidatos (ej: "Partido Candidato Colores"), analízala cuidadosamente y proporciona información precisa

Ejemplos de preguntas que debes manejar:
- "¿Cuál es el candidato del PLN?" → Extrae del contexto y proporciona el nombre del candidato
- "¿Qué proponen los partidos sobre educación?" → Extrae y compara propuestas de todos los partidos mencionados en el contexto
- "¿Quién es el candidato de [partido]?" → Extrae del contexto y proporciona el nombre del candidato
- "¿Qué partido tiene a [nombre] como candidato?" → Identifica del contexto qué partido tiene ese candidato

RECUERDA: Si se proporciona contexto, contiene la respuesta. Extráela y preséntala claramente. Responde SIEMPRE en español.`;
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
