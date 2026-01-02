# Pre-Caching de Comparaciones Políticas

Este documento explica cómo ejecutar el script de pre-caching de comparaciones para mejorar la velocidad de respuesta en producción.

## Resumen

- **Script**: `precompute-comparisons.ts`
- **Partidos**: PLN, PUSC, CAC, FA, Pueblo Soberano
- **Temas**: 8 temas principales (Educación, Salud, Empleo, Seguridad, Ambiente, Economía, Infraestructura, Corrupción)
- **Total**: 80 comparaciones (10 combinaciones × 8 temas)
- **Costo**: ~$0.08 con DeepSeek
- **Tiempo**: ~40-60 minutos

## Prerequisitos

### 1. Configurar DeepSeek API Key

Editar el archivo `backend/.env` y agregar/modificar:

```bash
# Cambiar el provider a DeepSeek
LLM_PROVIDER=deepseek

# Agregar la API key de DeepSeek
DEEPSEEK_API_KEY=tu-deepseek-api-key-aqui
```

**Obtener API Key de DeepSeek**:
1. Ir a https://platform.deepseek.com/
2. Registrarse/Login
3. Ir a API Keys
4. Crear nueva API key
5. Copiar y pegar en `.env`

### 2. Verificar Configuración de Supabase

Asegurarse de que las siguientes variables estén configuradas en `.env`:

```bash
SUPABASE_URL=tu-supabase-project-url
SUPABASE_ANON_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-supabase-service-role-key
```

### 3. Probar Configuración de DeepSeek (Recomendado)

Antes de ejecutar el pre-cómputo completo, prueba que DeepSeek funciona:

```bash
pnpm --filter backend run test:deepseek
```

Este script verificará:
- ✅ Variables de entorno configuradas
- ✅ Inicialización del provider
- ✅ Conexión a la API de DeepSeek
- ✅ Prueba con prompt simple
- ✅ Prueba con prompt complejo (similar a comparaciones)
- ✅ Estimación de costo

**Ejemplo de salida exitosa**:
```
🧪 Testing DeepSeek configuration...

1️⃣ Checking environment variables:
   LLM_PROVIDER: deepseek
   DEEPSEEK_API_KEY: ✅ Set (hidden)
   DEEPSEEK_BASE_URL: https://api.deepseek.com
   DEEPSEEK_MODEL: deepseek-chat

2️⃣ Initializing DeepSeek provider...
   ✅ Provider initialized: deepseek-chat
   Context window: 64000 tokens
   Supports function calling: true

3️⃣ Testing API connection with a simple completion...
   ✅ API call successful!
   Response: "Hola"
   Model: deepseek-chat
   Tokens: 25 (prompt: 15, completion: 10)
   Time: 1234ms
   Finish reason: stop

4️⃣ Testing with a comparison-like prompt...
   ✅ Complex prompt successful!
   Response length: 156 characters
   Tokens used: 85
   Time: 2345ms

5️⃣ Cost estimation for pre-compute:
   Total comparisons: 80
   Estimated tokens: ~120,000
   Estimated cost: ~$0.0554 USD
   Estimated time: ~40-60 minutes

✅ All tests passed! DeepSeek is configured correctly.

You can now run the pre-compute script:
   pnpm --filter backend run precompute:comparisons
```

## Ejecutar Pre-Cómputo

### Desde la raíz del proyecto

```bash
pnpm --filter backend run precompute:comparisons
```

### Desde el directorio backend

```bash
cd backend
pnpm run precompute:comparisons
```

### Con variable de entorno inline (override temporal)

```bash
LLM_PROVIDER=deepseek pnpm --filter backend run precompute:comparisons
```

## Monitoreo Durante la Ejecución

### Logs en Consola

El script mostrará progreso en tiempo real:

```
🚀 Starting pre-computation of common comparisons...
Pre-computing: "Educación" for parties: pln
⏭️  SKIPPED: "Educación" for pln - Already cached and not expired
Pre-computing: "Educación" for parties: pusc
✅ Cached: "Educación" (1 parties) in 28920ms
Pre-computing: "Salud" for parties: pln
✅ Cached: "Salud" (1 parties) in 32450ms
...
```

**Nota**: Las comparaciones que ya existen en cache y no han expirado se saltan automáticamente para ahorrar tiempo y tokens.

### Verificar en Supabase (Opcional)

Mientras el script corre, puedes verificar el progreso en Supabase SQL Editor:

```sql
-- Contar entradas cacheadas
SELECT COUNT(*) FROM comparisons_cache;

-- Ver últimas entradas
SELECT topic, party_ids, created_at
FROM comparisons_cache
ORDER BY created_at DESC
LIMIT 10;
```

## Validación Post-Ejecución

### 1. Verificar Total de Entradas

```sql
SELECT COUNT(*) as total_cached
FROM comparisons_cache;
-- Debe mostrar: 80
```

### 2. Ver Distribución por Temas

```sql
SELECT
  topic,
  COUNT(*) as count
FROM comparisons_cache
GROUP BY topic
ORDER BY count DESC;
-- Cada tema debe tener ~10 entradas
```

### 3. Ver Combinaciones de Partidos

```sql
SELECT
  party_ids,
  COUNT(*) as count
FROM comparisons_cache
GROUP BY party_ids
ORDER BY count DESC
LIMIT 10;
```

### 4. Probar Comparación Cacheada

**Desde el frontend** o con **curl**:

```bash
curl -X POST http://localhost:3001/api/compare \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Educación",
    "partyIds": ["pln", "pusc"]
  }'
```

**Verificar en la respuesta**:
- `metadata.cached: true` ✅
- `metadata.processingTime < 500ms` ✅ (vs 30-40s sin cache)

## Estadísticas del Script

Al finalizar, el script mostrará:

```
📊 Pre-computation complete:
   Total: 80
   ✅ Newly cached: 80
   ⏭️  Skipped (already cached): 0
   ❌ Failed: 0

💡 Cache is now warmed up! Users will get instant responses for these comparisons.

📈 Cache Statistics:
   Total entries: 80
   Never expires: 0
   Expired: 0
```

**Interpretación**:
- **Newly cached**: Comparaciones nuevas que se ejecutaron y guardaron
- **Skipped**: Comparaciones que ya existían en cache y no se re-ejecutaron (ahorro de tokens)
- **Failed**: Comparaciones que fallaron por errores

## Combinaciones Pre-Cacheadas

### Partidos Individuales (5)
1. PLN
2. PUSC
3. CAC
4. FA
5. Pueblo Soberano

### Combinaciones de Partidos (5)
1. PLN + PUSC + CAC + FA (top 4)
2. PLN + PUSC (tradicionales)
3. PLN + CAC
4. PUSC + CAC
5. PLN + PUSC + CAC (top 3)

### Temas (8)
1. Educación
2. Salud
3. Empleo
4. Seguridad
5. Ambiente
6. Economía
7. Infraestructura
8. Corrupción

**Total**: 10 combinaciones × 8 temas = **80 comparaciones**

## Solución de Problemas

### Error: "DEEPSEEK_API_KEY is required"

**Solución**: Verificar que `.env` contiene:
```bash
DEEPSEEK_API_KEY=sk-... # tu API key real
```

### Error: "Could not find party {slug}"

**Solución**: Verificar que los partidos existen en la base de datos:
```sql
SELECT slug, name FROM parties
WHERE slug IN ('pln', 'pusc', 'cac', 'fa', 'pueblo-soberano');
```

### Error: Rate Limit de DeepSeek

El script ya incluye un delay de 1 segundo entre requests. Si aún así hay rate limits, puedes:
1. Esperar unos minutos y reiniciar
2. Aumentar el delay en línea 155 del script

### Falla a Mitad de Ejecución

El script guarda cada comparación inmediatamente en la base de datos. Si falla, simplemente reinicia el script:
- **El script verifica automáticamente** si cada comparación ya existe en cache
- Las comparaciones ya cacheadas y no expiradas se **saltan automáticamente** (skip)
- Solo se ejecutan las comparaciones faltantes o expiradas
- Esto ahorra tiempo y tokens en ejecuciones posteriores

## Actualización del Cache

### Manual

Volver a ejecutar el script sobrescribirá las entradas existentes:

```bash
pnpm --filter backend run precompute:comparisons
```

### Automática (Cron Job)

Para producción, considera programar actualizaciones mensuales:

```bash
# Ejemplo: crontab para ejecutar el 1 de cada mes a las 2 AM
0 2 1 * * cd /path/to/ticobot && pnpm --filter backend run precompute:comparisons
```

## Costos y Tiempos

| Provider | Costo por ejecución | Tiempo estimado |
|----------|-------------------|----------------|
| DeepSeek | ~$0.08 | 40-60 min |
| OpenAI GPT-3.5 | ~$0.14 | 40-60 min |
| OpenAI GPT-4 | ~$3.00 | 40-60 min |

**Recomendación**: Usar DeepSeek para pre-caching (casi gratis, buena calidad)

## Limpieza del Cache

### Eliminar todas las entradas

```sql
DELETE FROM comparisons_cache;
```

### Eliminar entradas expiradas

```sql
DELETE FROM comparisons_cache
WHERE expires_at IS NOT NULL AND expires_at < NOW();
```

### Eliminar entradas de un tema específico

```sql
DELETE FROM comparisons_cache
WHERE topic = 'Educación';
```

## Próximos Pasos

Después de ejecutar el pre-caching:

1. **Monitorear cache hit rate** en producción
2. **Ajustar combinaciones** basándose en analytics de usuarios
3. **Programar actualizaciones** mensuales o cuando se actualicen PDFs
4. **Expandir cache** con temas adicionales si es necesario
