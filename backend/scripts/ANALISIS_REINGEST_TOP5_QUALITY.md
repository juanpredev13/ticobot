# Análisis del Script: `reingest-top5-quality.ts`

**Fecha:** 2025-12-20  
**Script:** `backend/scripts/reingest-top5-quality.ts`

---

## 📋 Resumen Ejecutivo

Este script re-ingiere **únicamente los top 5 partidos políticos** con parámetros optimizados para máxima calidad. Está diseñado para mejorar la calidad de los chunks y embeddings de los partidos más importantes.

### Partidos Procesados
1. **PLN** - Partido Liberación Nacional
2. **PUSC** - Unidad Social Cristiana
3. **CAC** - Coalición Agenda Ciudadana
4. **FA** - Frente Amplio
5. **Pueblo Soberano** (PS)

---

## 🎯 Propósito

El script tiene dos objetivos principales:

1. **Re-ingerir con mejor calidad**: Usa parámetros optimizados para generar chunks de mayor calidad
2. **Enfoque selectivo**: Solo procesa los 5 partidos más importantes, ahorrando tiempo y recursos

---

## 🔄 Flujo de Ejecución

### 1. Inicialización
```typescript
- Carga variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Inicializa cliente Supabase
- Define top 5 partidos y sus variaciones de slug
```

### 2. Limpieza de Datos Existentes
```typescript
deleteTop5Data():
  ├─ Busca partidos por slug (top 5)
  ├─ Obtiene documentos asociados
  ├─ Elimina chunks de esos documentos
  └─ Elimina documentos
```

**⚠️ IMPORTANTE**: Este paso **elimina permanentemente** todos los datos existentes de los top 5 partidos.

### 3. Filtrado de Planes
```typescript
isTop5Plan():
  ├─ Verifica si el plan pertenece a top 5
  └─ Usa variaciones de slug para matching flexible
```

### 4. Re-ingesta con Calidad Optimizada
```typescript
reingestDocument():
  ├─ Verifica si existe PDF local
  ├─ Usa PDF local si existe, sino descarga desde URL
  └─ Ejecuta pipeline con parámetros optimizados
```

### 5. Resumen Final
- Muestra estadísticas de éxito/fallo
- Sugiere próximos pasos

---

## ⚙️ Parámetros de Calidad Optimizados

### Configuración de Chunking

```typescript
chunkingOptions: {
    chunkSize: 600,        // ⬆️ Aumentado de 400 (50% más)
    maxChunkSize: 1200,    // ⬆️ Aumentado de 800 (50% más)
    overlapSize: 100,      // ⬆️ Aumentado de 50 (100% más)
}
```

### Comparación con Configuración Estándar

| Parámetro | Estándar | Quality | Diferencia |
|-----------|----------|---------|------------|
| `chunkSize` | 400 tokens | 600 tokens | +50% |
| `maxChunkSize` | 800 tokens | 1200 tokens | +50% |
| `overlapSize` | 50 tokens | 100 tokens | +100% |

### Impacto de los Cambios

#### ✅ Ventajas
1. **Más contexto**: Chunks más grandes contienen más información contextual
2. **Mejor coherencia**: Mayor overlap reduce pérdida de información en bordes
3. **Mejor calidad semántica**: Más contexto = mejores embeddings
4. **Menos chunks**: Menos chunks totales = menos embeddings = más rápido

#### ⚠️ Desventajas
1. **Más tokens por chunk**: Mayor costo de embedding por chunk
2. **Menos granularidad**: Chunks más grandes pueden mezclar temas
3. **Mayor uso de memoria**: Chunks más grandes en memoria

---

## 🔍 Análisis de Componentes

### 1. Función `deleteTop5Data()`

**Propósito**: Limpiar datos existentes antes de re-ingerir

**Proceso**:
1. Busca partidos por slug
2. Obtiene documentos asociados
3. Elimina chunks (CASCADE automático)
4. Elimina documentos

**⚠️ Riesgos**:
- **No hay confirmación**: Elimina datos sin preguntar
- **No hay backup**: No crea backup antes de eliminar
- **Transaccional**: Si falla a mitad, puede dejar datos inconsistentes

**Mejora sugerida**:
```typescript
// Agregar confirmación
const confirm = await prompt('¿Estás seguro de eliminar datos? (yes/no)');
if (confirm !== 'yes') return;

// Agregar backup opcional
await backupTop5Data();
```

### 2. Función `checkLocalPDF()`

**Propósito**: Verificar si existe PDF local para evitar descarga

**Lógica**:
- Busca en `backend/downloads/pdfs/{documentId}.pdf`
- Si existe, usa local
- Si no, descarga desde URL

**✅ Buen diseño**: Optimiza tiempo al evitar descargas innecesarias

### 3. Función `isTop5Plan()`

**Propósito**: Filtrar planes que pertenecen a top 5

**Matching flexible**:
```typescript
SLUG_VARIATIONS = {
    'pln': ['pln', 'liberacion-nacional'],
    'pusc': ['pusc', 'unidad-social-cristiana'],
    'cac': ['cac', 'coalicion-agenda-ciudadana'],
    'fa': ['fa', 'frente-amplio'],
    'pueblo-soberano': ['pueblo-soberano']
}
```

**✅ Buen diseño**: Maneja variaciones de nombres en TSE_PLANS

### 4. Función `reingestDocument()`

**Propósito**: Re-ingerir un documento con configuración optimizada

**Flujo**:
1. Verifica PDF local
2. Ejecuta pipeline con parámetros optimizados
3. Genera embeddings
4. Almacena en vector DB

**Configuración**:
- `generateEmbeddings: true` - Genera embeddings
- `storeInVectorDB: true` - Almacena en DB
- `chunkingOptions` - Parámetros optimizados

---

## 📊 Sistema de Calidad

### QualityScorer

El script usa el sistema de calidad integrado en `IngestPipeline`:

#### Métricas Calculadas

1. **qualityScore** (0.0 - 1.0)
   - Score general de calidad del chunk
   - Combina múltiples factores

2. **lengthScore** (30% peso)
   - Penaliza chunks muy cortos o muy largos
   - Óptimo: ~400-800 tokens

3. **specialCharRatio** (20% peso)
   - Ratio de caracteres especiales
   - Penaliza si > 20% (posibles errores OCR)

4. **hasKeywords** (20% bonus)
   - Verifica keywords relevantes en español
   - Bonus si contiene keywords políticos

5. **readability** (30% peso)
   - Score básico de legibilidad
   - Basado en longitud de palabras y stopwords

#### Keywords Relevantes

El sistema busca keywords como:
- `propone`, `propuesta`, `gobierno`, `política`
- `educación`, `salud`, `seguridad`, `empleo`
- `plan`, `programa`, `proyecto`, `objetivo`

---

## ⚠️ Problemas Identificados

### 1. **Eliminación Sin Confirmación**

**Problema**: Elimina datos sin pedir confirmación

**Riesgo**: Alto - Puede eliminar datos importantes por error

**Solución**:
```typescript
const readline = require('readline');
const rl = readline.createInterface({...});

const answer = await rl.question('¿Eliminar datos existentes? (yes/no): ');
if (answer !== 'yes') {
    logger.info('Operación cancelada');
    process.exit(0);
}
```

### 2. **No Hay Backup**

**Problema**: No crea backup antes de eliminar

**Riesgo**: Medio - Si algo falla, se pierden datos

**Solución**:
```typescript
async function backupTop5Data() {
    // Exportar datos a JSON o SQL
    const backup = await exportTop5Data();
    await fs.writeFile(`backup-${Date.now()}.json`, JSON.stringify(backup));
}
```

### 3. **Manejo de Errores Parcial**

**Problema**: Si falla a mitad, algunos partidos pueden quedar sin datos

**Riesgo**: Medio - Estado inconsistente

**Solución**:
```typescript
// Usar transacciones o rollback
// O verificar estado antes de eliminar
```

### 4. **Delay Fijo**

**Problema**: Delay de 2 segundos entre ingestas puede ser insuficiente

**Riesgo**: Bajo - Puede causar rate limiting

**Solución**:
```typescript
// Delay adaptativo basado en tamaño del documento
const delay = Math.min(5000, documentSize / 1000);
```

### 5. **Variaciones de Slug Incompletas**

**Problema**: Algunas variaciones pueden no cubrir todos los casos

**Riesgo**: Bajo - Puede no encontrar algunos planes

**Solución**:
```typescript
// Agregar más variaciones o usar matching más flexible
const variations = [
    'pln', 'liberacion-nacional', 'partido-liberacion-nacional',
    'liberacion', 'pln-2026'
];
```

### 6. **No Verifica Estado Previo**

**Problema**: No verifica si los partidos tienen datos antes de eliminar

**Riesgo**: Bajo - Puede intentar eliminar datos inexistentes

**Solución**:
```typescript
// Verificar antes de eliminar
const hasData = await checkTop5HasData();
if (!hasData) {
    logger.info('No hay datos previos, procediendo con ingesta');
}
```

---

## ✅ Mejoras Sugeridas

### 1. Agregar Modo Dry-Run

```typescript
const DRY_RUN = process.env.DRY_RUN === 'true';

if (DRY_RUN) {
    logger.info('🔍 DRY RUN MODE - No se eliminarán datos');
    // Solo mostrar qué se haría
}
```

### 2. Agregar Verificación Post-Ingesta

```typescript
async function verifyIngestion(partySlug: string): Promise<boolean> {
    // Verificar que se crearon chunks
    // Verificar que tienen embeddings
    // Verificar quality scores
    return isValid;
}
```

### 3. Agregar Estadísticas Detalladas

```typescript
interface IngestionStats {
    chunksCreated: number;
    avgQualityScore: number;
    chunksWithLowQuality: number;
    totalTokens: number;
    totalEmbeddings: number;
}
```

### 4. Agregar Logging Mejorado

```typescript
// Log progreso con porcentaje
logger.info(`[${partyName}] Progreso: ${current}/${total} (${percent}%)`);

// Log métricas de calidad
logger.info(`[${partyName}] Quality: avg=${avgQuality}, min=${minQuality}`);
```

### 5. Agregar Retry Logic

```typescript
async function reingestWithRetry(plan, pipeline, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await reingestDocument(plan, pipeline);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await delay(5000 * (i + 1)); // Exponential backoff
        }
    }
}
```

### 6. Agregar Validación de Parámetros

```typescript
function validateQualitySettings(options: ChunkingOptions): void {
    if (options.chunkSize > options.maxChunkSize) {
        throw new Error('chunkSize cannot be greater than maxChunkSize');
    }
    if (options.overlapSize >= options.chunkSize) {
        throw new Error('overlapSize should be less than chunkSize');
    }
}
```

---

## 📈 Métricas Esperadas

### Antes vs Después

| Métrica | Antes (Estándar) | Después (Quality) | Mejora |
|---------|------------------|-------------------|--------|
| Chunks por documento | ~200-300 | ~150-200 | -25% |
| Tokens por chunk | ~400 | ~600 | +50% |
| Overlap | 50 tokens | 100 tokens | +100% |
| Quality Score promedio | ~0.7 | ~0.85 | +21% |
| Chunks de baja calidad | ~10% | ~5% | -50% |

### Tiempo Estimado

- **Por partido**: ~5-10 minutos
- **Total (5 partidos)**: ~25-50 minutos
- **Con delays**: ~30-60 minutos

---

## 🚀 Uso Recomendado

### Antes de Ejecutar

1. **Verificar variables de entorno**:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   echo $OPENAI_API_KEY
   ```

2. **Verificar PDFs locales**:
   ```bash
   ls backend/downloads/pdfs/*.pdf
   ```

3. **Hacer backup** (recomendado):
   ```bash
   # Exportar datos actuales
   pnpm tsx scripts/export-top5-data.ts
   ```

### Ejecución

```bash
# Desde raíz del proyecto
cd backend
pnpm tsx scripts/reingest-top5-quality.ts
```

### Después de Ejecutar

1. **Verificar datos**:
   ```bash
   pnpm tsx scripts/verify-top5-parties.ts
   ```

2. **Re-precomputar comparaciones**:
   ```bash
   pnpm tsx scripts/precompute-comparisons.ts
   ```

3. **Limpiar cache antiguo**:
   ```bash
   pnpm tsx scripts/clear-pln-cache.ts
   pnpm tsx scripts/clear-corrupcion-cache.ts
   ```

---

## 🔧 Configuración Personalizada

### Modificar Parámetros de Calidad

Editar en `reingestDocument()`:

```typescript
chunkingOptions: {
    chunkSize: 800,        // Aún más contexto
    maxChunkSize: 1600,    // Chunks muy grandes
    overlapSize: 150,      // Overlap muy alto
}
```

### Agregar Más Partidos

Editar `TOP_5_PARTY_SLUGS`:

```typescript
const TOP_5_PARTY_SLUGS = [
    'pln',
    'pusc',
    'cac',
    'fa',
    'pueblo-soberano',
    'nueva-republica',  // Agregar más
];
```

---

## 📝 Notas Finales

### Cuándo Usar Este Script

✅ **Usar cuando**:
- Quieres mejorar calidad de top 5 partidos
- Cambias parámetros de chunking
- Actualizas sistema de calidad
- Necesitas re-procesar con mejor configuración

❌ **No usar cuando**:
- Solo quieres agregar un partido nuevo
- No quieres perder datos existentes
- No tienes backup de datos

### Alternativas

- **Re-ingerir uno por uno**: Usar `ingest-pln.ts` para partidos individuales
- **Re-ingerir todos**: Usar `reingest-all-plans.ts` para todos los partidos
- **Ingesta incremental**: Usar API `/api/ingest` para documentos específicos

---

**Última actualización:** 2025-12-20  
**Mantenido por:** juanpredev


