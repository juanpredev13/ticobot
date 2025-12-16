# Análisis del Partido UNKNOWN (CR1)

## 🔍 Problema Identificado

En el archivo `backend/scraped-plans.ts`, existe un partido con datos inconsistentes:

```typescript
{
  "partyName": "CR1",
  "partyId": "UNKNOWN",  // ❌ Incorrecto
  "pdfUrl": "https://www.tse.go.cr/2026/docus/planesgobierno/CR1.pdf",
  "documentId": "unknown-2026"
}
```

## 📊 Análisis

### 1. **Información del Partido**

- **Nombre del Partido**: CR1 (Costa Rica Primero)
- **partyId Actual**: `UNKNOWN` ❌
- **partyId Correcto**: `CR1` ✅
- **documentId**: `unknown-2026`
- **PDF URL**: `https://www.tse.go.cr/2026/docus/planesgobierno/CR1.pdf`
- **PDF Local**: `backend/downloads/pdfs/cr1-2026.pdf` ✅ (existe)

### 2. **Mapeo en el Código**

En `backend/src/api/routes/compare.ts` existe el mapeo:
```typescript
'CR1': 'CR1',  // Costa Rica Primero
```

Esto confirma que el partido debería tener `partyId: "CR1"` y no `"UNKNOWN"`.

### 3. **Manejo Especial en el Código**

El código tiene manejo especial para este caso:

**En `IngestPipeline.ts`:**
```typescript
// Special case: unknown-2026 -> cr1-2026.pdf
if (documentId === 'unknown-2026') {
    const alternativePdfPath = path.join(downloadPath, 'cr1-2026.pdf');
    // ...
}
```

**En `reingest-all-plans.ts`:**
```typescript
// Also check for special case: unknown-2026 -> cr1-2026.pdf
if (documentId === 'unknown-2026') {
    const cr1Path = path.join(/* ... */, 'cr1-2026.pdf');
    // ...
}
```

### 4. **Problema en IngestPipeline**

En `IngestPipeline.storeChunks()`, el código extrae el partyId así:
```typescript
// Extract party info from documentId (e.g., "pln-2026" -> "PLN")
const partyId = documentId.split('-')[0].toUpperCase();
// Para "unknown-2026" -> "UNKNOWN" ❌
```

Esto causa que se almacene `partyId: "UNKNOWN"` en la base de datos.

## 🔧 Soluciones Propuestas

### Opción 1: Corregir en `scraped-plans.ts` (Recomendado)

**Cambiar:**
```typescript
{
  "partyName": "CR1",
  "partyId": "UNKNOWN",  // ❌
  "documentId": "unknown-2026"
}
```

**Por:**
```typescript
{
  "partyName": "CR1",
  "partyId": "CR1",  // ✅
  "documentId": "cr1-2026"  // ✅ (también cambiar documentId)
}
```

**Ventajas:**
- ✅ Consistencia en toda la aplicación
- ✅ Elimina la necesidad de casos especiales
- ✅ Más claro y mantenible

**Desventajas:**
- ⚠️ Requiere re-ingesta del documento
- ⚠️ Requiere actualizar referencias en el código

### Opción 2: Corregir en `IngestPipeline.storeChunks()`

**Agregar mapeo especial:**
```typescript
// Extract party info from documentId
let partyId = documentId.split('-')[0].toUpperCase();

// Special case: unknown-2026 -> CR1
if (partyId === 'UNKNOWN' && documentId === 'unknown-2026') {
    partyId = 'CR1';
}
```

**Ventajas:**
- ✅ No requiere cambiar `scraped-plans.ts`
- ✅ Soluciona el problema en la ingesta

**Desventajas:**
- ⚠️ Mantiene la inconsistencia en los datos fuente
- ⚠️ Requiere re-ingesta del documento

### Opción 3: Actualizar Base de Datos Directamente

**Script SQL:**
```sql
-- Actualizar documentos
UPDATE documents 
SET 
  party_id = 'CR1',
  party_name = 'CR1',
  document_id = 'cr1-2026'
WHERE document_id = 'unknown-2026' OR party_id = 'UNKNOWN';

-- Actualizar metadata de chunks
UPDATE chunks
SET metadata = jsonb_set(
  metadata,
  '{partyId}',
  '"CR1"'
)
WHERE metadata->>'partyId' = 'UNKNOWN';
```

**Ventajas:**
- ✅ Solución rápida sin re-ingesta
- ✅ No requiere cambios en código

**Desventajas:**
- ⚠️ No corrige el problema de raíz
- ⚠️ Los datos fuente siguen inconsistentes

## 📝 Recomendación Final

**Combinar Opción 1 + Opción 3:**

1. **Corregir `scraped-plans.ts`** para que sea consistente
2. **Actualizar la base de datos** para corregir datos existentes
3. **Eliminar casos especiales** del código una vez corregido
4. **Re-ingerir el documento** con los datos correctos (opcional, pero recomendado)

## 🚀 Pasos para Implementar

1. Actualizar `scraped-plans.ts`:
   ```typescript
   {
     "partyName": "CR1",
     "partyId": "CR1",
     "pdfUrl": "https://www.tse.go.cr/2026/docus/planesgobierno/CR1.pdf",
     "documentId": "cr1-2026"
   }
   ```

2. Crear script de migración para actualizar BD:
   ```typescript
   // backend/scripts/fix-unknown-party.ts
   ```

3. Actualizar `IngestPipeline.storeChunks()` para usar el partyId del plan en lugar de extraerlo del documentId

4. Eliminar casos especiales de `unknown-2026` → `cr1-2026.pdf` (ya no serán necesarios)

5. Re-ingerir el documento con el nuevo documentId (opcional)

## 🔗 Referencias

- `backend/scraped-plans.ts` - Definición del partido
- `backend/src/ingest/components/IngestPipeline.ts` - Lógica de ingesta
- `backend/src/api/routes/compare.ts` - Mapeo de partidos
- `backend/scripts/reingest-all-plans.ts` - Script de re-ingesta

