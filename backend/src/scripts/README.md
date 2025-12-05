# Backend Scripts

Scripts de utilidad para configuración, ingestion, pruebas y mantenimiento del sistema TicoBot.

## 📋 Índice

- [Setup & Configuration](#setup--configuration)
- [Ingestion Pipeline](#ingestion-pipeline)
- [Testing & Debugging](#testing--debugging)
- [Database Management](#database-management)

---

## Setup & Configuration

### `setupSupabase.ts`
**Descripción:** Configura el esquema completo de Supabase (tablas, índices, funciones RPC)

**Uso:**
```bash
pnpm tsx src/scripts/setupSupabase.ts
```

**Lo que hace:**
- Crea tablas `documents` y `chunks`
- Habilita extensión `vector` (pgvector)
- Crea índice HNSW para búsqueda vectorial
- Crea función RPC `match_chunks` para similarity search
- Configura triggers y permisos

---

## Ingestion Pipeline

### `ingestAllPlans.ts`
**Descripción:** Ingesta inicial de todos los planes de gobierno TSE 2026

**Uso:**
```bash
pnpm tsx src/scripts/ingestAllPlans.ts
```

**Lo que hace:**
- Descarga PDFs de todos los partidos políticos
- Parsea y limpia el texto
- Genera chunks (pipeline original: 500-800 tokens)
- Genera embeddings con OpenAI
- Almacena en Supabase

**Partidos procesados:**
- PLN (Liberación Nacional)
- PAC (Acción Ciudadana)
- PUSC (Unidad Social Cristiana)
- PRSC (Restauración Social Cristiana)
- PFA (Frente Amplio)

---

### `reIngestAllPlans.ts` ⭐ NEW
**Descripción:** Re-ingesta todos los documentos con pipeline mejorado

**Uso:**
```bash
pnpm tsx src/scripts/reIngestAllPlans.ts
```

**⚠️ IMPORTANTE:** Este script ELIMINA los chunks existentes antes de re-procesarlos

**Mejoras del nuevo pipeline:**
- ✅ Extracción de marcadores de página (`-- N of M --`)
- ✅ Corrección de encoding (`:ene` → `tiene`, `soRware` → `software`)
- ✅ Chunks optimizados (400-600 tokens vs 500-800)
- ✅ Metadata de página en cada chunk
- ✅ Overlap reducido (50 tokens vs 75)

**Ejemplo de output:**
```
📄 [1/5] Partido Liberación Nacional (PLN)
   🗑️  Deleting existing chunks for PLN...
   ✅ Existing chunks deleted
   ✅ SUCCESS - PLN
   Chunks: 234
   Avg tokens: 401
   With page info: 234/234
   Time: 12.3s
```

---

## Testing & Debugging

### `testImprovedPipeline.ts` ⭐ NEW
**Descripción:** Prueba el pipeline mejorado con un documento de ejemplo

**Uso:**
```bash
pnpm tsx src/scripts/testImprovedPipeline.ts
```

**Lo que hace:**
- Descarga y procesa el PDF del PUSC (documento de prueba)
- NO genera embeddings (más rápido)
- NO almacena en DB (solo testing)
- Muestra estadísticas detalladas:
  - Distribución de tokens por chunk
  - Chunks con metadata de página
  - Verificación de encoding
  - Verificación de marcadores removidos

**Ejemplo de output:**
```
✅ PIPELINE TEST SUCCESSFUL
📊 Statistics:
   Total chunks: 234
   Avg tokens per chunk: 401
   Min tokens: 50
   Max tokens: 939
   Chunks with page info: 234/234

🔍 Encoding Check:
   ✅ No encoding issues detected
   ✅ Page markers successfully removed
```

---

### `testIngestion.ts`
**Descripción:** Prueba básica del pipeline de ingestion

**Uso:**
```bash
pnpm tsx src/scripts/testIngestion.ts
```

---

### `debugEmbeddings.ts`
**Descripción:** Debug de generación y almacenamiento de embeddings

**Uso:**
```bash
pnpm tsx src/scripts/debugEmbeddings.ts
```

**Lo que hace:**
- Verifica que los embeddings se generen correctamente
- Prueba almacenamiento en Supabase
- Realiza búsqueda de similitud de prueba

---

### `testRAG.ts`
**Descripción:** Prueba simple del sistema RAG

**Uso:**
```bash
pnpm tsx src/scripts/testRAG.ts
```

---

### `testRAGWithMultipleDocs.ts`
**Descripción:** Prueba RAG con múltiples documentos

**Uso:**
```bash
pnpm tsx src/scripts/testRAGWithMultipleDocs.ts
```

**Lo que hace:**
- Realiza queries de prueba
- Busca en múltiples documentos
- Muestra scores de similitud

---

## Database Management

### `checkSupabaseTables.ts`
**Descripción:** Verifica el estado de las tablas en Supabase

**Uso:**
```bash
pnpm tsx src/scripts/checkSupabaseTables.ts
```

**Lo que hace:**
- Cuenta documentos almacenados
- Cuenta chunks totales
- Muestra chunks por partido político

---

### `updateMatchFunction.ts`
**Descripción:** Actualiza la función RPC `match_chunks` en Supabase

**Uso:**
```bash
pnpm tsx src/scripts/updateMatchFunction.ts
```

**Lo que hace:**
- Lee el SQL de `update_match_function.sql`
- Actualiza la función en Supabase
- Útil cuando se modifican parámetros de búsqueda (threshold, etc.)

---

### `applyMigration.ts`
**Descripción:** Aplica migraciones de base de datos

**Uso:**
```bash
pnpm tsx src/scripts/applyMigration.ts
```

---

## 🔧 Root Script: `test-query.ts`

This script is located in the **backend root** (`/backend/test-query.ts`), not in `src/scripts/`

**Description:** Test vector similarity search directly in Supabase with improved pipeline

**Usage:**
```bash
# Simple search
pnpm tsx test-query.ts "economía"

# Filter by party
pnpm tsx test-query.ts "educación" "PLN"

# More results (important: use 'null' as string or omit for no filter)
pnpm tsx test-query.ts "salud" null 10
```

**Parameters:**
1. Query (required): Search term or question
2. Party filter (optional): Filter by party (PLN, PUSC) or `null` for all
3. Limit (optional): Number of results (default: 5, max: 10 recommended)

**⚠️ Important:** To search without party filter, use `null` (without quotes) or omit the parameter.

**Example improved output:**
```
🔍 QUERY: What does PUSC say about economics?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Results: 5

1. [████████████████████░░░░░░░░░░░░] 44.7%
   Chunk #145
   bank capitalization. - Eliminating salary taxes...

📈 Average score: 44.2%
📈 Best score: 44.7%
📈 Worst score: 43.7%
```

**Phase 2 Improvements:**
- ✅ Optimized chunks (400-600 tokens)
- ✅ Clean text without page markers
- ✅ Fixed encoding issues
- ✅ Threshold adjusted to 0.35
- ✅ Page metadata included

---

## 🚀 Workflow Recomendado

### Primera Configuración
```bash
# 1. Setup inicial de Supabase
pnpm tsx src/scripts/setupSupabase.ts

# 2. Ingestar todos los planes (pipeline original)
pnpm tsx src/scripts/ingestAllPlans.ts

# 3. Verificar que se guardaron
pnpm tsx src/scripts/checkSupabaseTables.ts

# 4. Probar búsqueda
pnpm tsx test-query.ts "economía"
```

### Re-ingestion con Pipeline Mejorado
```bash
# 1. Probar pipeline mejorado primero
pnpm tsx src/scripts/testImprovedPipeline.ts

# 2. Re-ingestar todos los documentos
pnpm tsx src/scripts/reIngestAllPlans.ts

# 3. Verificar mejoras en búsqueda
pnpm tsx test-query.ts "¿Qué dice el PUSC sobre economía?"
```

---

## 📝 Notas

- **Todos los scripts usan variables de entorno** de `.env`
- **Re-ingestion ELIMINA chunks existentes** antes de re-procesar
- **Test scripts NO modifican la DB** (útil para desarrollo)
- **Production scripts generan embeddings** (consumen API de OpenAI)

---

## ⚠️ Scripts que Modifican la Base de Datos

Scripts **DESTRUCTIVOS** (requieren confirmación):
- `reIngestAllPlans.ts` - Elimina y reemplaza chunks
- `setupSupabase.ts` - Recrea esquema (drop tables si existen)
- `applyMigration.ts` - Modifica esquema

Scripts **NO destructivos** (solo lectura o inserts):
- `ingestAllPlans.ts` - Solo inserta nuevos chunks
- `checkSupabaseTables.ts` - Solo lectura
- `testImprovedPipeline.ts` - No toca la DB
- `test-query.ts` - Solo lectura
