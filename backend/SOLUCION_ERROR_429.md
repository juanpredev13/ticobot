# Solución: Error 429 - Cuota de OpenAI Excedida

## 🔴 Problema

```
Error: OpenAI embedding generation failed: 429 You exceeded your current quota
```

Esto significa que se excedió la cuota de OpenAI. Tienes dos opciones:

---

## ✅ Solución 1: Cambiar a DeepSeek (Recomendado)

Ya tienes créditos en DeepSeek, así que cambiemos el provider.

### Paso 1: Actualizar `.env`

Edita `backend/.env` y cambia:

```bash
# ANTES
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...

# DESPUÉS
EMBEDDING_PROVIDER=deepseek
DEEPSEEK_API_KEY=tu_api_key_de_deepseek
```

### Paso 2: Verificar configuración

```bash
cd backend
npx tsx scripts/check-embedding-config.ts
```

Deberías ver:
```
✅ Provider creado exitosamente
✅ Embedding generado exitosamente
```

### Paso 3: Continuar reingesta

El script continuará desde donde falló. Los documentos que ya se procesaron exitosamente no se reprocesarán.

```bash
npx tsx scripts/reingest-all-plans.ts
```

---

## ✅ Solución 2: Esperar y usar OpenAI

Si prefieres esperar a que se renueve tu cuota de OpenAI:

1. **Esperar** hasta que se renueve tu cuota (generalmente mensual)
2. **Verificar** tu cuota en: https://platform.openai.com/usage
3. **Continuar** la reingesta cuando tengas créditos

---

## 🔍 Verificar qué documentos ya se procesaron

Puedes verificar qué documentos ya están en la base de datos:

```bash
cd backend
npx tsx scripts/check-chunks-metadata.ts
```

O en Supabase SQL Editor:

```sql
SELECT 
  d.party_id,
  d.document_id,
  COUNT(c.id) as chunks_count
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
GROUP BY d.party_id, d.document_id
ORDER BY d.party_id;
```

---

## 📊 Estado Actual

Según los logs que compartiste:

- ✅ **ACRM**: Falló (probablemente por error de descarga/parsing)
- ✅ **PA**: Falló (error 429 - cuota excedida)
- ✅ **CDS**: Falló (error 429 - cuota excedida)
- ✅ **CAC**: Falló (error 429 - cuota excedida)
- ✅ **PDLCT**: Falló (error 429 - cuota excedida)
- ✅ **PEN**: En proceso cuando falló...

**Nota:** Los PDFs se están procesando correctamente (parsing, cleaning, chunking), pero fallan al generar embeddings por la cuota de OpenAI.

---

## 🚀 Recomendación

**Cambia a DeepSeek ahora** para continuar sin problemas:

1. Actualiza `.env` con DeepSeek
2. Verifica con `check-embedding-config.ts`
3. Continúa la reingesta

El script continuará desde donde quedó y procesará los documentos restantes.

---

## ⚠️ Nota sobre Chunking

Veo en los logs que está creando solo **1 chunk** por documento, lo cual parece incorrecto. Esto podría ser porque:

1. El texto es muy corto después del cleaning
2. Hay un problema con el chunker

Pero primero resolvamos el problema de embeddings, luego podemos revisar el chunking.

---

**Última actualización:** 2025-12-16

