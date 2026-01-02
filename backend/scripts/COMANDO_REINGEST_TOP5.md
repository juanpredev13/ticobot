# Comando para Ejecutar `reingest-top5-quality.ts`

## 🚀 Comando Principal

### Desde el directorio raíz del proyecto:

```bash
cd /home/juanpredev/Desktop/dev/juanpredev/ticobot
pnpm tsx backend/scripts/reingest-top5-quality.ts
```

### Desde el directorio backend:

```bash
cd /home/juanpredev/Desktop/dev/juanpredev/ticobot/backend
pnpm tsx scripts/reingest-top5-quality.ts
```

---

## ⚙️ Variables de Entorno Requeridas

Antes de ejecutar, asegúrate de tener estas variables configuradas:

```bash
# Supabase
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# Embeddings (si usas OpenAI)
export EMBEDDING_PROVIDER="openai"
export OPENAI_API_KEY="tu-openai-api-key"
```

O crear un archivo `.env` en `backend/`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=tu-openai-api-key
```

---

## 📋 Pasos Recomendados Antes de Ejecutar

### 1. Verificar Variables de Entorno

```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $OPENAI_API_KEY
```

### 2. Verificar PDFs Locales (Opcional)

```bash
ls backend/downloads/pdfs/*.pdf
```

Si tienes PDFs locales, el script los usará en lugar de descargarlos.

### 3. Hacer Backup (Recomendado)

```bash
# Exportar datos actuales de top 5
cd backend
pnpm tsx scripts/query-comparisons-cache.ts
```

---

## ⚠️ Advertencias Importantes

1. **Este script ELIMINA permanentemente** todos los datos existentes de los top 5 partidos
2. **No hay confirmación** - se ejecuta directamente
3. **No crea backup automático** - hazlo manualmente antes
4. **Tiempo estimado**: 30-60 minutos para completar

---

## 📊 Monitoreo Durante la Ejecución

El script mostrará:
- Progreso de limpieza de datos
- Progreso de ingesta por partido
- Estadísticas de chunks creados
- Tiempo total de procesamiento

---

## ✅ Verificación Después de Ejecutar

### 1. Verificar que los partidos tienen datos:

```bash
cd backend
pnpm tsx scripts/verify-top5-parties.ts
```

### 2. Verificar chunks y embeddings:

```bash
cd backend
pnpm tsx scripts/check-pln-chunks.ts
```

### 3. Re-precomputar comparaciones:

```bash
cd backend
pnpm tsx scripts/precompute-comparisons.ts
```

### 4. Limpiar cache antiguo:

```bash
cd backend
pnpm tsx scripts/clear-pln-cache.ts
pnpm tsx scripts/clear-corrupcion-cache.ts
```

---

## 🔧 Ejecución con Opciones

### Con variables de entorno inline:

```bash
SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." OPENAI_API_KEY="..." \
pnpm tsx backend/scripts/reingest-top5-quality.ts
```

### Con logging detallado:

```bash
DEBUG=* pnpm tsx backend/scripts/reingest-top5-quality.ts
```

---

## 📝 Ejemplo de Salida Esperada

```
[ReingestTop5Quality] 🚀 Starting Top 5 Quality Re-ingestion
============================================================
[ReingestTop5Quality] Parties: PLN, PUSC, CAC, FA, Pueblo Soberano
[ReingestTop5Quality] Quality Settings:
[ReingestTop5Quality]   - Chunk size: 600 tokens (increased context)
[ReingestTop5Quality]   - Max chunk: 1200 tokens
[ReingestTop5Quality]   - Overlap: 100 tokens (better coherence)
============================================================

[ReingestTop5Quality] Deleting existing data for top 5 parties...
[ReingestTop5Quality] Found 5 parties to clean: pln, pusc, cac, frente-amplio, pueblo-soberano
[ReingestTop5Quality]   Deleted chunks for 5 documents
[ReingestTop5Quality]   Deleted 5 documents
[ReingestTop5Quality] ✅ Cleanup complete

[ReingestTop5Quality] Found 5 plans to ingest:
[ReingestTop5Quality]   - Partido Liberación Nacional (pln-2026)
[ReingestTop5Quality]   - Unidad Social Cristiana (pusc-2026)
...

[ReingestTop5Quality] [PLN] Processing: pln-2026
[ReingestTop5Quality] [PLN] ✅ Success - 245 chunks created (45230ms)
...

============================================================
[ReingestTop5Quality] 📊 Re-ingestion Summary
============================================================
[ReingestTop5Quality] Total plans processed: 5
[ReingestTop5Quality] ✅ Successful: 5
[ReingestTop5Quality] ❌ Failed: 0
```

---

## 🆘 Solución de Problemas

### Error: "SUPABASE_SERVICE_ROLE_KEY is required"

```bash
# Verificar que la variable está configurada
echo $SUPABASE_SERVICE_ROLE_KEY

# O configurarla antes de ejecutar
export SUPABASE_SERVICE_ROLE_KEY="tu-key"
```

### Error: "No plans found for top 5 parties"

Verificar que `TSE_PLANS` en `scraped-plans.ts` contiene los partidos:
- `pln-2026` o `liberacion-nacional-2026`
- `pusc-2026` o `unidad-social-cristiana-2026`
- `cac-2026` o `coalicion-agenda-ciudadana-2026`
- `fa-2026` o `frente-amplio-2026`
- `pueblo-soberano-2026`

### Error de conexión a Supabase

Verificar:
- `SUPABASE_URL` es correcta
- `SUPABASE_SERVICE_ROLE_KEY` tiene permisos de service_role
- Conexión a internet activa

---

**Última actualización:** 2025-12-20


