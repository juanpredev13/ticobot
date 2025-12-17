# Optimización de Tokens en RAG Pipeline

## Análisis de Impacto

### Incremento Actual
- **Contexto antes**: 4000 caracteres ≈ 1000 tokens
- **Contexto después**: 8000 caracteres ≈ 2000 tokens
- **Incremento**: +1000 tokens por query

### Costos (GPT-4)
- **Por query**: +$0.01 adicional
- **Mensual** (100 queries/día): +$30/mes

## Estrategias de Optimización

### 1. Truncamiento Inteligente de Chunks Individuales ⭐

**Problema**: Chunks muy grandes (>3000 chars) ocupan todo el contexto.

**Solución**: Limitar tamaño de chunks individuales para permitir más chunks diversos:

```typescript
// Limitar chunks a 2500 caracteres (~600 tokens)
// Permite incluir 3 chunks en lugar de 1 chunk grande
```

**Ahorro estimado**: 20-30% de tokens, manteniendo diversidad de información.

### 2. Priorización por Relevancia

**Estrategia**: Incluir chunks más relevantes primero, truncar menos relevantes.

**Implementación**: Ordenar por score y truncar chunks con menor relevancia si es necesario.

### 3. Compresión de Metadata

**Estrategia**: Reducir metadata redundante en el formato de chunks.

**Ahorro**: ~50-100 tokens por chunk.

### 4. Contexto Adaptativo

**Estrategia**: Ajustar `maxContextLength` según tipo de query:
- Preguntas simples: 4000 caracteres
- Comparaciones: 6000 caracteres
- Análisis complejos: 8000 caracteres

## Recomendación

Implementar **Solución 1** (truncamiento inteligente) + **Solución 4** (contexto adaptativo) para balance óptimo entre calidad y costo.

