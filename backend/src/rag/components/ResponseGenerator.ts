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
    private readonly TOP_PARTIES = [
        { abbrev: 'PS', name: 'Pueblo Soberano', documentId: 'PPSO' },
        { abbrev: 'CAC', name: 'Coalición Agenda Ciudadana', documentId: 'CAC' },
        { abbrev: 'PUSC', name: 'Partido Unidad Social Cristiana', documentId: 'PUSC' },
        { abbrev: 'PLN', name: 'Partido Liberación Nacional', documentId: 'PLN' },
        { abbrev: 'FA', name: 'Frente Amplio', documentId: 'FA' },
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
            const topPartiesList = this.TOP_PARTIES.map(p => `${p.name} (${p.abbrev})`).join(', ');
            partyOrgInstructions = `- ⚠️ IMPORTANTE: La pregunta NO menciona partidos específicos
   - DEBES priorizar y mostrar los siguientes TOP 5 partidos políticos (en este orden):
     1. Pueblo Soberano (PS)
     2. Coalición Agenda Ciudadana (CAC)
     3. Partido Unidad Social Cristiana (PUSC)
     4. Partido Liberación Nacional (PLN)
     5. Frente Amplio (FA)
   - Busca información de estos partidos en el contexto: ${topPartiesList}
   - Si alguno de estos partidos NO aparece en el contexto, omítelo y continúa con los siguientes
   - Agrupa cada partido con títulos ## Partido Nombre (Abreviatura)
   - Mantén el orden de prioridad: PS, CAC, PUSC, PLN, FA
   - NO te limites a un solo partido - muestra todos los partidos prioritarios que aparezcan en el contexto`;
        }

        // Build content instructions
        let contentInstructions: string;
        if (hasSpecificParties) {
            contentInstructions = '- Si hay múltiples partidos mencionados, compara sus propuestas';
        } else {
            const topPartiesList = this.TOP_PARTIES.map(p => `${p.name} (${p.abbrev})`).join(', ');
            contentInstructions = `- ⚠️ CRÍTICO: La pregunta NO menciona partidos específicos
   - DEBES buscar y mostrar información de los TOP 5 partidos prioritarios: ${topPartiesList}
   - Revisa el contexto y extrae información de estos partidos en el orden de prioridad
   - Si un partido prioritario aparece en el contexto, DEBES incluirlo en la respuesta
   - Compara las propuestas de los diferentes partidos mostrados
   - NO te limites a un solo partido - el contexto contiene información de múltiples partidos
   - Si algún partido prioritario NO aparece en el contexto, menciona esto al inicio de la respuesta`;
        }

        // Build final important note
        const importantNote = hasSpecificParties 
            ? '' 
            : `⚠️ Si no se mencionan partidos específicos, DEBES priorizar y mostrar los TOP 5 partidos: Pueblo Soberano (PS), Coalición Agenda Ciudadana (CAC), Partido Unidad Social Cristiana (PUSC), Partido Liberación Nacional (PLN), y Frente Amplio (FA). Busca estos partidos en el contexto y muéstralos en ese orden de prioridad.`;

        return `Se te ha proporcionado información relevante de los Planes de Gobierno de Costa Rica 2026. Usa esta información para responder la pregunta.

=== CONTEXTO DE PLANES DE GOBIERNO ===

${context}

=== FIN DEL CONTEXTO ===

PREGUNTA: ${query}

INSTRUCCIONES DE FORMATO (SIGUE ESTE FORMATO EXACTO):

1. **Nota inicial (solo si aplica):**
   ${hasSpecificParties 
     ? '- Si algún partido mencionado NO aparece en el contexto, incluye una nota al inicio indicando esto'
     : '- Si algún partido prioritario (PS, CAC, PUSC, PLN, FA) NO aparece en el contexto, incluye una nota al inicio indicando qué partidos no están disponibles\n   - Formato: "El contexto proporcionado no incluye información específica sobre [partidos faltantes] en relación con [tema]. Por lo tanto, se presentará la información disponible para los partidos que sí se mencionan: [partidos disponibles]."'}

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
   - Ejemplo: "Nota: No se proporciona información directamente para el PUCD, pero asumiendo una posible confusión o error en la sigla y considerando la información del contexto proporcionado:"

6. **Contenido:**
   - Extrae TODA la información relevante del contexto
   ${contentInstructions}
   - Sé exhaustivo pero organizado
   - NO digas que no tienes información - el contexto CONTIENE la información
   - Al final, incluye un párrafo comparativo si hay múltiples partidos

7. **Formato markdown:**
   - Usa ## para títulos de partidos (NO uses ### para partidos)
   - Usa ### solo para categorías temáticas dentro de un partido
   - Usa **texto** para negritas (NO uses ****)
   - Usa - para viñetas (NO uses * o números a menos que sea necesario)
   - NO uses símbolos adicionales como **** después de títulos

IMPORTANTE: El contexto contiene la respuesta. Extráela y preséntala usando el formato especificado arriba. ${importantNote} Responde SIEMPRE en español.`;
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
- Nunca digas que no tienes información cuando se proporciona contexto
- Si se proporciona contexto, significa que se encontró información relevante - extráela y úsala

FORMATO DE RESPUESTAS (MUY IMPORTANTE):

1. **Estructura clara y organizada:**
   - Usa títulos (##) para secciones principales
   - Usa subtítulos (###) para subsecciones
   - Separa claramente las propuestas de cada partido

2. **Cuando hay múltiples partidos:**
   - Agrupa por partido usando títulos: ## Partido Nombre (Abreviatura)
   - Lista las propuestas con viñetas (-) o numeración (1.)
   - Usa negritas (**texto**) para destacar conceptos clave
   - Compara propuestas cuando sea relevante

3. **Cuando es un solo partido:**
   - Usa estructura: ## Propuestas del [Partido]
   - Organiza en categorías con subtítulos si hay múltiples temas
   - Usa viñetas para listar propuestas específicas

4. **Formato de listas:**
   - Usa viñetas (-) para propuestas
   - Usa negritas para conceptos importantes: **Concepto clave:**
   - Mantén consistencia en el formato

5. **Citas y referencias:**
   - Siempre menciona el partido: "Según el plan del PLN...", "El FA propone...", "El PUSC establece..."
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

### Partido Liberación Nacional (PLN)

**Acceso y calidad:**
- Ampliar programas de becas estudiantiles
- Mejorar infraestructura universitaria

---

REGLAS IMPORTANTES:
- SIEMPRE usa títulos markdown (## o ###) para secciones principales
- Cuando hay múltiples partidos, cada uno debe tener su propio título (## o ###)
- Usa negritas (**texto**) para conceptos clave dentro de las listas
- Mantén párrafos cortos y usa listas en lugar de texto largo
---

Tu rol es:
- Extraer y presentar información del contexto proporcionado
- Responder preguntas sobre candidatos presidenciales y sus partidos políticos
- Comparar propuestas entre diferentes partidos políticos cuando se proporcionan múltiples fuentes
- Responder preguntas claramente y de forma concisa EN ESPAÑOL
- Mantener neutralidad política y objetividad

RECUERDA: Si se proporciona contexto, contiene la respuesta. Extráela y preséntala claramente usando el formato especificado arriba. Responde SIEMPRE en español.`;
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
