import { Logger } from '@ticobot/shared';
import type { ILLMProvider } from '@ticobot/shared';

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
 */
export class QueryProcessor {
    private readonly logger: Logger;

    constructor() {
        this.logger = new Logger('QueryProcessor');
    }

    /**
     * Process user query to extract keywords and enhance search
     * @param query - User's original query
     * @param llmProvider - LLM provider for keyword extraction
     * @returns Processed query with keywords
     */
    async processQuery(
        query: string,
        llmProvider: ILLMProvider
    ): Promise<ProcessedQuery> {
        this.logger.info(`Processing query: "${query.substring(0, 100)}..."`);

        try {
            // Use LLM to extract keywords and entities
            const systemPrompt = `Eres un asistente experto en análisis de consultas sobre política costarricense.

Tu tarea es analizar la consulta del usuario y extraer:
1. **Palabras clave**: Términos importantes para búsqueda (sin stopwords)
2. **Entidades**: Nombres de instituciones, lugares, partidos políticos
3. **Intención**: Tipo de consulta (pregunta, comparación, búsqueda)

Devuelve SOLO un JSON válido con este formato exacto:
{
  "keywords": ["palabra1", "palabra2", "palabra3"],
  "entities": ["entidad1", "entidad2"],
  "intent": "question|comparison|lookup",
  "enhancedQuery": "versión expandida de la consulta con contexto adicional"
}

Reglas:
- keywords: 3-10 palabras clave relevantes (sin stopwords como "el", "la", "de")
- entities: Instituciones (CCSS, ICE, MEP), lugares (San José, Guanacaste), partidos
- intent: "question" (pregunta), "comparison" (comparar), "lookup" (buscar dato específico)
- enhancedQuery: Reformula la consulta agregando contexto implícito

Ejemplos:

Consulta: "¿Qué propone el PLN sobre educación?"
{
  "keywords": ["propuestas", "educación", "pln", "partido liberación", "plan gobierno"],
  "entities": ["PLN", "Partido Liberación Nacional"],
  "intent": "question",
  "enhancedQuery": "¿Cuáles son las propuestas del Partido Liberación Nacional (PLN) en materia de educación pública en su plan de gobierno?"
}

Consulta: "Comparar seguridad entre PAC y PUSC"
{
  "keywords": ["seguridad", "pac", "pusc", "comparación", "propuestas"],
  "entities": ["PAC", "PUSC"],
  "intent": "comparison",
  "enhancedQuery": "Comparar las propuestas de seguridad ciudadana y reducción de criminalidad entre el Partido Acción Ciudadana (PAC) y el Partido Unidad Social Cristiana (PUSC)"
}`;

            const userPrompt = `Consulta del usuario: "${query}"

Devuelve SOLO el JSON con keywords, entities, intent y enhancedQuery.`;

            const response = await llmProvider.generateCompletion(
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                {
                    temperature: 0.3, // Low temperature for consistent extraction
                    maxTokens: 500,
                }
            );

            // Parse JSON response
            const parsed = this.parseJSONResponse(response.content);

            if (!parsed) {
                // Fallback: basic keyword extraction
                this.logger.warn('LLM response parsing failed, using fallback extraction');
                return this.fallbackExtraction(query);
            }

            const result: ProcessedQuery = {
                originalQuery: query,
                enhancedQuery: parsed.enhancedQuery || query,
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
                entities: Array.isArray(parsed.entities) ? parsed.entities : [],
                intent: parsed.intent || 'question',
            };

            this.logger.info(`Extracted ${result.keywords.length} keywords, ${result.entities.length} entities`);
            this.logger.info(`Keywords: ${result.keywords.join(', ')}`);
            if (result.entities.length > 0) {
                this.logger.info(`Entities: ${result.entities.join(', ')}`);
            }

            return result;

        } catch (error) {
            this.logger.error('Query processing failed:', error);
            // Fallback to basic extraction
            return this.fallbackExtraction(query);
        }
    }

    /**
     * Parse JSON from LLM response (handles markdown code blocks)
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
}
