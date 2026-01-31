import { ProviderFactory } from '../../factory/ProviderFactory.js';
import { Logger, type LLMMessage, type LLMResponse } from '@ticobot/shared';

/**
 * ResponseGenerator Component
 * Generates natural language responses using LLM with RAG context
 */
export class ResponseGenerator {
    private readonly logger: Logger;
    private systemPrompt: string;
    
    // Top 5 partidos políticos prioritarios cuando no se especifican partidos
    // Orden: PLN, CAC, PS, FA, PUSC (mismos que en RAGPipeline)
    private readonly TOP_PARTIES = [
        { abbrev: 'PLN', name: 'Partido Liberación Nacional', documentId: 'PLN' },
        { abbrev: 'CAC', name: 'Coalición Agenda Ciudadana', documentId: 'CAC' },
        { abbrev: 'PS', name: 'Pueblo Soberano', documentId: 'PPSO' },
        { abbrev: 'FA', name: 'Frente Amplio', documentId: 'FA' },
        { abbrev: 'PUSC', name: 'Partido Unidad Social Cristiana', documentId: 'PUSC' },
    ];

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
            userPrompt?: string; // Optional custom user prompt (bypasses buildUserPrompt)
        }
    ): Promise<{
        answer: string;
        confidence: number;
        tokensUsed?: number;
        model?: string;
    }> {
        this.logger.info(`Generating response for query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
        this.logger.info(`Context length: ${context.length} characters`);
        
        // Improved validation: allow short but valid context
        const trimmedContext = context.trim();
        if (!trimmedContext || trimmedContext.length === 0) {
            this.logger.error('ERROR: Context is completely empty! This should not happen if search returned results.');
            return {
                answer: 'No se encontró información relevante en los planes de gobierno para responder esta pregunta. Por favor, intenta reformular tu pregunta o consulta sobre otro tema.',
                confidence: 0,
                tokensUsed: 0,
            };
        }
        
        // Warn if context is very short but continue processing
        if (trimmedContext.length < 100) {
            this.logger.warn(`Context is very short: ${trimmedContext.length} chars - may affect response quality`);
        }
        
        this.logger.info(`Context preview: ${trimmedContext.substring(0, 500)}...`);

        try {
            // Get LLM provider from factory
            const llmProvider = await ProviderFactory.getLLMProvider();

            // Build user prompt with context (use trimmed context)
            // Use custom userPrompt if provided, otherwise build default
            const userPrompt = options?.userPrompt || this.buildUserPrompt(trimmedContext, query);
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
                maxTokens: options?.maxTokens ?? 800,
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
                maxTokens: options?.maxTokens ?? 800,
            })) {
                yield chunk;
            }

        } catch (error) {
            this.logger.error('Failed to generate streaming response', error);
            throw new Error(`Streaming response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Build a simple user prompt for single-party comparison
     * This avoids mentioning other parties in the prompt
     * @param context - Context from retrieved chunks
     * @param query - User query
     * @param partyName - Name of the party being analyzed
     * @returns Formatted user prompt for single party
     */
    buildSinglePartyPrompt(context: string, query: string, partyName: string): string {
        if (!context || context.trim().length === 0) {
            return `No se encontró información sobre ${partyName} para esta consulta.`;
        }

        return `Analiza el siguiente contexto del plan de gobierno de ${partyName} y responde la pregunta.

=== CONTEXTO DEL PLAN DE GOBIERNO DE ${partyName.toUpperCase()} ===

${context}

=== FIN DEL CONTEXTO ===

PREGUNTA: ${query}

INSTRUCCIONES:
- Extrae y presenta las propuestas de ${partyName} del contexto
- Usa títulos (###) para categorías temáticas
- Usa negritas (**texto**) para destacar propuestas clave
- Usa viñetas (-) para listar propuestas específicas
- Sé exhaustivo pero organizado
- Responde en español

IMPORTANTE: Solo presenta información de ${partyName}. No menciones otros partidos.`;
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

        // Detect if query mentions specific parties
        const partyMentions = this.detectPartyMentions(query);
        const hasSpecificParties = partyMentions.length > 0;

        // Build party organization instructions
        let partyOrgInstructions: string;
        if (hasSpecificParties) {
            partyOrgInstructions = `- La pregunta menciona partidos específicos: ${partyMentions.join(', ')}
   - Agrupa por partido con títulos ## Partido Nombre (Abreviatura)
   - Incluye TODOS los partidos mencionados en la pregunta`;
        } else {
            // When no specific party is mentioned, show TOP 5 parties from context
            const topPartiesList = this.TOP_PARTIES.map(p => `${p.name} (${p.abbrev})`).join(', ');
            partyOrgInstructions = `- ⚠️ IMPORTANTE: La pregunta NO menciona partidos específicos
   - El contexto contiene información de los TOP 5 partidos prioritarios: ${topPartiesList}
   - Presenta información de TODOS los partidos que aparezcan en el contexto
   - Agrupa cada partido con títulos ## Partido Nombre (Abreviatura)
   - Mantén el orden de prioridad cuando sea posible: PLN, CAC, PS, FA, PUSC
   - Si algún partido NO aparece en el contexto, simplemente omítelo`;
        }

        // Build content instructions
        let contentInstructions: string;
        if (hasSpecificParties) {
            contentInstructions = '- Si hay múltiples partidos mencionados, compara sus propuestas';
        } else {
            // Instructions for multi-party response
            const topPartiesList = this.TOP_PARTIES.map(p => `${p.name} (${p.abbrev})`).join(', ');
            contentInstructions = `- ⚠️ CRÍTICO: La pregunta NO menciona partidos específicos
   - El contexto incluye información de los TOP 5 partidos: ${topPartiesList}
   - Revisa el contexto y extrae información de TODOS los partidos que aparezcan
   - Muestra las propuestas de cada partido en secciones separadas
   - NO te limites a un solo partido - presenta TODOS los partidos del contexto
   - Al final, incluye un párrafo comparativo entre los partidos mostrados`;
        }

        return `Se te ha proporcionado información relevante de los Planes de Gobierno de Costa Rica 2026. Usa esta información para responder la pregunta.

=== CONTEXTO DE PLANES DE GOBIERNO ===

${context}

=== FIN DEL CONTEXTO ===

PREGUNTA: ${query}

INSTRUCCIONES DE FORMATO (SIGUE ESTE FORMATO EXACTO):

1. **Contenido basado en contexto:**
   - SOLO usa información que aparece en el contexto proporcionado
   - NO inventes información ni menciones partidos que no están en el contexto
   - Si el contexto no tiene información sobre un partido específico, NO lo menciones

2. **Estructura de la respuesta:**
   - Usa títulos de nivel 2 (##) para cada partido: ## Nombre Completo del Partido (Abreviatura)
   - Usa títulos de nivel 3 (###) para categorías temáticas dentro de cada partido
   - Cada partido debe tener su propia sección claramente separada

3. **Formato de propuestas:**
   - Cada propuesta debe comenzar con negritas: **Título de la propuesta:**
   - Seguido de la descripción en texto normal
   - Usa viñetas (-) para listar propuestas específicas
   - Ejemplo exacto:
     **Regulación de universidades privadas:** El FA propone otorgar mayores potestades al Consejo Nacional de Enseñanza Superior Universitaria Privada para fiscalizar la calidad de las carreras, las condiciones laborales del profesorado y las tarifas.

4. **Organización por partido:**
   ${partyOrgInstructions}
   - Lista propuestas con viñetas (-) dentro de cada categoría
   - Mantén consistencia en el formato entre partidos

5. **Notas aclaratorias:**
   - Si hay confusión en nombres o siglas, incluye notas aclaratorias
   - Formato: "Nota: [explicación]"

6. **Contenido:**
   - Extrae TODA la información relevante del contexto
   ${contentInstructions}
   - Sé exhaustivo pero organizado
   - Al final, incluye un párrafo comparativo si hay múltiples partidos en el contexto

7. **Formato markdown:**
   - Usa ## para títulos de partidos (NO uses ### para partidos)
   - Usa ### solo para categorías temáticas dentro de un partido
   - Usa **texto** para negritas (NO uses ****)
   - Usa - para viñetas (NO uses * o números a menos que sea necesario)

IMPORTANTE: El contexto contiene información de múltiples partidos políticos. Extrae y presenta las propuestas de TODOS los partidos que aparezcan en el contexto. Responde SIEMPRE en español.`;
    }

    /**
     * Detect if query mentions specific political parties
     * @param query - User query
     * @returns Array of detected party abbreviations
     */
    private detectPartyMentions(query: string): string[] {
        const partyPatterns: Record<string, string[]> = {
            'PLN': ['pln', 'partido liberación nacional', 'liberación nacional'],
            'PUSC': ['pusc', 'partido unidad social cristiana', 'unidad social cristiana'],
            'PAC': ['pac', 'partido acción ciudadana', 'acción ciudadana'],
            'FA': ['fa', 'frente amplio', 'frenteamplio'],
            'PS': ['ps', 'pueblo soberano', 'pueblosoberano', 'ppso'],
            'CAC': ['cac', 'coalición agenda ciudadana', 'agenda ciudadana'],
            'PSD': ['psd', 'partido progreso social democrático', 'progreso social'],
            'PNR': ['pnr', 'partido nueva república', 'nueva república'],
            'PLP': ['plp', 'partido liberal progresista', 'liberal progresista'],
            'PEN': ['pen', 'partido esperanza nacional', 'esperanza nacional'],
            'CDS': ['cds', 'centro democrático y social'],
            'CR1': ['cr1', 'costa rica primero'],
            'UP': ['up', 'unidos podemos'],
        };

        const detected: string[] = [];
        const queryLower = query.toLowerCase();

        for (const [abbrev, patterns] of Object.entries(partyPatterns)) {
            if (patterns.some(pattern => queryLower.includes(pattern))) {
                detected.push(abbrev);
            }
        }

        return detected;
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
- El contexto incluye información de múltiples partidos políticos (hasta 5 partidos)
- DEBES presentar las propuestas de TODOS los partidos que aparezcan en el contexto
- Nunca digas que no tienes información cuando se proporciona contexto
- Si se proporciona contexto, significa que se encontró información relevante - extráela y úsala
- NO te limites a mostrar solo un partido - muestra TODOS los partidos del contexto

FORMATO DE RESPUESTAS (MUY IMPORTANTE):

1. **Estructura clara y organizada:**
   - Usa títulos (##) para secciones principales
   - Usa subtítulos (###) para subsecciones
   - Separa claramente las propuestas de cada partido

2. **Cuando hay múltiples partidos en el contexto:**
   - Agrupa por partido usando títulos: ## Partido Nombre (Abreviatura)
   - Lista las propuestas con viñetas (-) o numeración (1.)
   - Usa negritas (**texto**) para destacar conceptos clave
   - Compara propuestas cuando sea relevante

3. **Cuando es un solo partido en el contexto:**
   - Usa estructura: ## Propuestas del [Partido]
   - Organiza en categorías con subtítulos si hay múltiples temas
   - Usa viñetas para listar propuestas específicas

4. **Formato de listas:**
   - Usa viñetas (-) para propuestas
   - Usa negritas para conceptos importantes: **Concepto clave:**
   - Mantén consistencia en el formato

5. **Citas y referencias:**
   - Siempre menciona el partido según aparece en el contexto
   - Usa formato: **Partido (Abreviatura):** seguido de la propuesta

6. **Legibilidad:**
   - Párrafos cortos (2-4 líneas máximo)
   - Espacios en blanco entre secciones
   - No uses bloques de texto largos

EJEMPLO DE FORMATO CORRECTO:

## Propuestas sobre Educación Superior

### Frente Amplio (FA)

**Regulación de universidades privadas:**
- Otorgar mayores potestades al Consejo Nacional de Enseñanza Superior Universitaria Privada
- Regular calidad de carreras, condiciones laborales y tarifas
- Presentar proyectos de ley para garantizar tarifas justas

**Financiamiento:**
- Alcanzar gradualmente el 8% del PIB para educación
- Garantizar financiamiento creciente mediante negociación justa del FEES

---

REGLAS IMPORTANTES:
- SIEMPRE usa títulos markdown (## o ###) para secciones principales
- Cuando hay múltiples partidos en el contexto, cada uno debe tener su propio título
- Usa negritas (**texto**) para conceptos clave dentro de las listas
- Mantén párrafos cortos y usa listas en lugar de texto largo
- NUNCA menciones partidos que no aparecen en el contexto proporcionado
---

Tu rol es:
- Extraer y presentar información del contexto proporcionado
- Responder preguntas sobre candidatos presidenciales y sus partidos políticos
- Comparar propuestas entre diferentes partidos políticos cuando se proporcionan múltiples fuentes
- Responder preguntas claramente y de forma concisa EN ESPAÑOL
- Mantener neutralidad política y objetividad

RECUERDA: Si se proporciona contexto, contiene la respuesta. Extráela y preséntala claramente usando el formato especificado arriba. Solo presenta información de partidos que están en el contexto. Responde SIEMPRE en español.`;
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
