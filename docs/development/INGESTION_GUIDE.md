# Guía de Ingesta de Documentos

## Problema: "I could not find relevant information"

Este mensaje aparece cuando la base de datos está vacía (no hay documentos ni chunks indexados).

## Solución: Ejecutar el proceso de ingesta

### Paso 1: Verificar el estado de la base de datos

```bash
cd backend
pnpm exec tsx src/scripts/checkSupabaseTables.ts
```

Si muestra `Row count: 0`, necesitas ejecutar la ingesta.

### Paso 2: Ejecutar la ingesta de documentos

**Opción A: Ingesta inicial (primera vez)**
```bash
cd backend
pnpm exec tsx src/scripts/ingestAllPlans.ts
```

**Opción B: Re-ingesta (si ya hay datos pero quieres reprocesarlos)**
```bash
cd backend
pnpm exec tsx src/scripts/reIngestAllPlans.ts
```

⚠️ **IMPORTANTE:** `reIngestAllPlans.ts` elimina los chunks existentes antes de reprocesarlos.

### Paso 3: Verificar que los documentos se cargaron

```bash
cd backend
pnpm exec tsx src/scripts/checkSupabaseTables.ts
```

Deberías ver:
- ✅ DOCUMENTS TABLE: Row count > 0
- ✅ CHUNKS TABLE: Row count > 0

### Paso 4: Probar el RAG

Una vez que hay documentos, prueba hacer una pregunta en el chat. Debería funcionar correctamente.

## Requisitos

- Supabase corriendo (local o remoto)
- Variables de entorno configuradas en `backend/.env`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY` (para generar embeddings)

## Notas

- La ingesta puede tardar varios minutos dependiendo de la cantidad de documentos
- Los embeddings se generan usando OpenAI (requiere API key)
- Cada documento se divide en chunks de 400-600 tokens
- Los chunks se almacenan con embeddings vectoriales para búsqueda semántica

## Troubleshooting

### Error: "No relevant results found"
- Verifica que hay documentos en la base de datos
- Verifica que los chunks tienen embeddings (campo `embedding` no nulo)
- Prueba reducir el `minRelevanceScore` (por defecto 0.35)

### Error: "OpenAI API key not found"
- Asegúrate de tener `OPENAI_API_KEY` en `backend/.env`

### Error: "Supabase connection failed"
- Verifica que Supabase está corriendo
- Verifica las credenciales en `backend/.env`


