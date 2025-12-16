# TOON vs Embeddings: ¿Puede ayudar a ahorrar tokens?

## 🤔 ¿Qué es TOON?

**TOON (Token-Oriented Object Notation)** es un formato de serialización más compacto que JSON, diseñado para reducir tokens en LLMs.

**Ahorro típico:** 30-60% menos tokens vs JSON

**Ejemplo:**
```json
// JSON: 15,145 tokens
{
  "repositories": [
    {"name": "repo1", "stars": 100},
    {"name": "repo2", "stars": 200}
  ]
}

// TOON: 8,745 tokens (42% menos)
repositories: [
  {name: repo1, stars: 100},
  {name: repo2, stars: 200}
]
```

## ❌ ¿Por qué NO aplica directamente a Embeddings?

### 1. **Embeddings usan texto plano, no JSON**

Cuando generas embeddings, envías el **contenido del chunk como texto plano**:

```typescript
// Lo que se envía a OpenAI:
const embedding = await provider.generateEmbedding(
  chunk.content  // ← Texto plano, no JSON
);

// Ejemplo de chunk.content:
"El plan de gobierno propone mejorar la educación pública 
mediante la inversión en infraestructura escolar y la 
capacitación de docentes..."
```

**TOON solo ayuda si estás enviando datos estructurados (JSON)**, no texto narrativo.

### 2. **Los metadatos ya están optimizados**

Los metadatos se almacenan en la base de datos, no se envían al embedding:

```typescript
// Esto NO se envía al embedding:
metadata: {
  documentId: uuid,
  chunkIndex: 0,
  tokens: 450,
  pageNumber: 12,
  qualityScore: 0.85,
  keywords: ["educación", "infraestructura"],
  entities: ["Ministerio de Educación"]
}
```

Solo se envía `chunk.content` (texto plano).

## ✅ Técnicas que SÍ pueden reducir tokens en embeddings

### 1. **Compresión de texto antes de chunking**

**Eliminar redundancias:**
- Espacios múltiples → espacio simple
- Saltos de línea innecesarios
- Caracteres especiales repetidos

**Ya lo haces en `TextCleaner`**, pero se puede mejorar.

### 2. **Ajustar tamaño de chunks**

**Reducir `chunkSize` y `maxChunkSize`:**
```typescript
// Actual:
chunkSize: 400 tokens
maxChunkSize: 600 tokens

// Más agresivo:
chunkSize: 300 tokens
maxChunkSize: 400 tokens
```

**Pros:** Menos tokens por embedding
**Contras:** Más chunks, más llamadas a la API

### 3. **Eliminar contenido de baja calidad**

**Filtrar chunks con `qualityScore < 0.5`:**
```typescript
// No generar embeddings para chunks de baja calidad
if (qualityMetrics.qualityScore < 0.5) {
  continue; // Skip este chunk
}
```

**Ahorro:** Evitas generar embeddings inútiles

### 4. **Usar batch embeddings**

**OpenAI soporta batch (hasta 2048 textos):**
```typescript
// En lugar de:
for (const chunk of chunks) {
  await provider.generateEmbedding(chunk.content);
}

// Usar:
await provider.generateBatch(
  chunks.map(c => c.content)
);
```

**Ahorro:** Más eficiente, pero mismo número de tokens

### 5. **Pre-procesar texto para reducir tokens**

**Técnicas de compresión de texto:**
- Eliminar palabras vacías (stop words) - **NO recomendado** (pierde semántica)
- Abreviar términos comunes - **NO recomendado** (pierde significado)
- Normalizar formato - **✅ Ya lo haces**

## 🎯 Recomendación para tu caso

### **TOON NO es útil aquí porque:**
1. Embeddings requieren texto natural, no estructurado
2. Los metadatos no se envían al embedding
3. TOON es para JSON/estructuras, no narrativa

### **Mejores estrategias:**

#### **Opción 1: Filtrar chunks de baja calidad** (Más impacto)
```typescript
// En storeChunks(), antes de generar embedding:
if (qualityMetrics.qualityScore < 0.5) {
  this.logger.warn(`Skipping low-quality chunk ${chunk.chunkIndex}`);
  continue; // No generar embedding
}
```

**Ahorro estimado:** 10-20% menos embeddings (chunks filtrados)

#### **Opción 2: Reducir tamaño de chunks** (Moderado)
```typescript
chunkingOptions: {
  chunkSize: 300,      // Reducir de 400
  maxChunkSize: 400,   // Reducir de 600
  overlapSize: 30      // Reducir de 50
}
```

**Ahorro estimado:** 25-30% menos tokens por chunk
**Trade-off:** Más chunks totales

#### **Opción 3: Usar batch embeddings** (Eficiencia)
```typescript
// Generar embeddings en batch
const texts = chunks.map(c => c.content);
const batchResult = await embeddingProvider.generateBatch(texts);
```

**Ahorro:** Mismo tokens, pero más rápido y eficiente

## 📊 Comparación de estrategias

| Estrategia | Ahorro Tokens | Impacto Calidad | Dificultad |
|------------|---------------|----------------|-----------|
| TOON | ❌ 0% | N/A | N/A |
| Filtrar baja calidad | ✅ 10-20% | ⚠️ Bajo | 🟢 Fácil |
| Reducir chunk size | ✅ 25-30% | ⚠️ Medio | 🟢 Fácil |
| Batch embeddings | ✅ 0% (velocidad) | ✅ Sin impacto | 🟡 Medio |
| Compresión texto | ✅ 5-10% | ⚠️ Bajo | 🟡 Medio |

## 💡 Conclusión

**TOON no es útil para embeddings** porque:
- Embeddings usan texto plano, no JSON
- TOON es para estructuras de datos
- No hay JSON que optimizar en el flujo de embeddings

**Mejores opciones:**
1. ✅ **Filtrar chunks de baja calidad** (implementación fácil, buen ahorro)
2. ✅ **Reducir tamaño de chunks** (si calidad lo permite)
3. ✅ **Usar batch embeddings** (mejor eficiencia)

¿Quieres que implemente alguna de estas estrategias?

