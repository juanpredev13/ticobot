# Análisis de la Ingesta Actual

## 📋 Resumen Ejecutivo

Análisis del flujo de ingesta actual, identificando puntos fuertes y áreas de mejora.

## 🔍 Flujo Actual de Ingesta

### 1. **IngestPipeline.ingest()**

```
1. Download PDF → PDFDownloader
2. Parse PDF → PDFParser (extrae texto y páginas)
3. Clean Text → TextCleaner (normaliza, elimina ruido, detecta páginas)
4. Chunk Text → TextChunker (divide en chunks semánticos)
5. Generate Embeddings → EmbeddingProvider (opcional)
6. Store in Vector DB → VectorStore (opcional)
```

### 2. **Configuración Actual de Chunking**

```typescript
{
  chunkSize: 400,        // Target: 400 tokens por chunk
  maxChunkSize: 600,     // Máximo: 600 tokens por chunk
  overlapSize: 50,        // Overlap: 50 tokens entre chunks
  splitOn: 'paragraph'   // Divide por párrafos (doble salto de línea)
}
```

## ⚠️ Problemas Identificados

### 1. **Chunks que Exceden el Límite de Embeddings**

**Problema:**
- OpenAI embeddings tiene límite de **8192 tokens**
- Si un documento no tiene párrafos separados (`\n\n`), `splitText()` devuelve un solo segmento
- Ese segmento puede ser muy grande (ej: 26,845 tokens)
- El chunker lo agrega completo al chunk final
- Resultado: Error 400 "maximum context length is 8192 tokens"

**Ejemplo del error:**
```
Error: OpenAI embedding generation failed: 400 
This model's maximum context length is 8192 tokens, 
however you requested 26845 tokens
```

**Causa raíz:**
```typescript
// En splitText(), si no hay párrafos:
case 'paragraph':
    return text.split(/\n\n+/).filter(p => p.trim().length > 0);
    // Si no hay \n\n, devuelve [texto_completo] - un solo elemento
```

**Cuándo ocurre:**
- PDFs sin formato de párrafos (texto continuo)
- PDFs con formato especial (tablas, listas sin saltos)
- Texto extraído sin preservar estructura

### 2. **Falta de Validación de Límites**

**Problema:**
- No hay validación que verifique `chunk.tokens <= embeddingMaxTokens`
- El chunker confía en que `maxChunkSize` es suficiente
- Pero `maxChunkSize=600` no previene chunks de 26K tokens si hay un segmento grande

**Código actual:**
```typescript
// Línea 72: Solo verifica maxChunkSize antes de agregar
if (currentTokens + segmentTokens > maxChunkSize && currentChunk.length > 0) {
    // Guarda chunk actual
}

// Línea 90: Agrega segmento sin validar tamaño final
currentChunk += segment;
currentTokens += segmentTokens;

// Línea 113: Agrega chunk final sin validar
chunks.push(this.createChunk(...)); // Puede tener 26K tokens!
```

### 3. **Segmentos Grandes No Se Dividen**

**Problema:**
- Si un segmento individual tiene > 600 tokens, se agrega completo
- No hay lógica para dividir segmentos grandes en sub-segmentos
- El chunk resultante puede exceder cualquier límite

**Ejemplo:**
```
Segmento: 10,000 tokens (un párrafo muy largo)
→ Se agrega completo al chunk
→ Chunk final: 10,000 tokens
→ Error al generar embedding
```

## ✅ Puntos Fuertes

### 1. **Arquitectura Modular**
- Componentes bien separados (Downloader, Parser, Cleaner, Chunker)
- Fácil de testear y mantener

### 2. **Manejo de Páginas**
- Detecta marcadores de página correctamente
- Asocia chunks con números de página

### 3. **Overlap entre Chunks**
- Preserva contexto entre chunks adyacentes
- Mejora la recuperación de información

### 4. **Logging Detallado**
- Información útil para debugging
- Estadísticas de tiempo por etapa

## 🔧 Soluciones Propuestas

### Opción 1: Ajustar maxChunkSize (Simple)

**Cambio mínimo:**
```typescript
// En IngestPipeline.ts, pasar opciones de chunking:
chunkingOptions: {
    chunkSize: 400,
    maxChunkSize: 2000,  // Reducir de 600 a 2000 (más seguro)
    overlapSize: 50
}
```

**Pros:**
- Cambio mínimo
- Reduce probabilidad de exceder límite

**Contras:**
- No resuelve el problema si hay un segmento de 10K tokens
- Chunks más grandes pueden reducir calidad de embeddings

### Opción 2: Dividir Segmentos Grandes (Recomendado)

**Implementar lógica para:**
1. Detectar segmentos > maxChunkSize
2. Dividirlos por oraciones o palabras
3. Validar chunks finales antes de agregar

**Código:**
```typescript
// Si segmento > maxChunkSize, dividir
if (segmentTokens > maxChunkSize) {
    const subSegments = splitBySentences(segment, maxChunkSize);
    // Procesar sub-segmentos
}
```

**Pros:**
- Resuelve el problema de raíz
- Mantiene chunks dentro de límites
- No afecta chunks normales

**Contras:**
- Requiere cambios en TextChunker
- Más complejidad

### Opción 3: Validación Final (Preventivo)

**Agregar validación:**
```typescript
// Después de crear chunks, validar
const oversizedChunks = chunks.filter(c => c.tokens > 8192);
if (oversizedChunks.length > 0) {
    // Dividir o eliminar chunks grandes
}
```

**Pros:**
- Previene errores en embeddings
- Fácil de implementar

**Contras:**
- No previene el problema, solo lo detecta
- Puede perder información si elimina chunks

## 📊 Estadísticas Actuales

### Configuración por Defecto
- **chunkSize**: 400 tokens (target)
- **maxChunkSize**: 600 tokens (máximo teórico)
- **overlapSize**: 50 tokens
- **Embedding limit**: 8192 tokens (OpenAI)

### Gap de Seguridad
```
maxChunkSize (600) << embeddingMaxTokens (8192)
```
Hay un margen grande, pero no protege contra segmentos individuales grandes.

## 🎯 Recomendación

**Combinar Opción 2 + Opción 3:**
1. Dividir segmentos grandes automáticamente
2. Validar chunks finales antes de generar embeddings
3. Ajustar maxChunkSize a 2000 para más margen

Esto asegura que:
- ✅ Chunks nunca excedan 8192 tokens
- ✅ Se mantiene coherencia semántica
- ✅ No se pierde información

## 📝 Próximos Pasos

1. **Probar con documento real** para ver distribución de tokens
2. **Implementar división de segmentos grandes** si es necesario
3. **Agregar validación final** como medida de seguridad
4. **Monitorear logs** durante reingesta completa

