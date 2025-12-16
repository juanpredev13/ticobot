# Configurar DeepSeek para Embeddings

## 📋 Pasos para usar DeepSeek en lugar de OpenAI

### 1. Actualizar variables de entorno

Edita tu archivo `.env` en `backend/.env`:

```bash
# Cambiar el provider de embeddings a DeepSeek
EMBEDDING_PROVIDER=deepseek

# Configurar DeepSeek API Key
DEEPSEEK_API_KEY=tu_api_key_de_deepseek

# Opcional: URL base (ya tiene default)
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Opcional: Modelo de embeddings (default: text-embedding)
DEEPSEEK_EMBEDDING_MODEL=text-embedding
```

### 2. Variables mínimas requeridas

```bash
EMBEDDING_PROVIDER=deepseek
DEEPSEEK_API_KEY=tu_api_key_aqui
```

### 3. Verificar configuración

Puedes verificar que todo esté configurado correctamente ejecutando:

```bash
cd backend
npx tsx -e "
import { env } from './src/config/env.js';
console.log('Embedding Provider:', env.EMBEDDING_PROVIDER);
console.log('DeepSeek API Key:', env.DEEPSEEK_API_KEY ? '✅ Configurada' : '❌ No configurada');
"
```

### 4. Probar la ingesta

Una vez configurado, puedes ejecutar la reingesta:

```bash
cd backend
npx tsx scripts/reingest-all-plans.ts
```

## ⚠️ Notas Importantes

### Modelo de Embeddings de DeepSeek

- **Modelo por defecto:** `text-embedding`
- **Dimensiones:** 1536 (similar a OpenAI text-embedding-3-small)
- **Compatibilidad:** DeepSeek usa una API compatible con OpenAI, por lo que el código es similar

### Verificar Modelo Correcto

Si el modelo `text-embedding` no funciona, verifica en la documentación de DeepSeek cuál es el nombre correcto del modelo de embeddings y actualiza:

```bash
DEEPSEEK_EMBEDDING_MODEL=nombre_correcto_del_modelo
```

### Dimensiones del Vector

El código detecta automáticamente las dimensiones del embedding en la primera respuesta. Si DeepSeek usa dimensiones diferentes a 1536, se ajustará automáticamente.

### Costos

- DeepSeek generalmente es más económico que OpenAI
- Verifica los precios actuales en la documentación de DeepSeek

## 🔧 Troubleshooting

### Error: "DEEPSEEK_API_KEY is required"

**Solución:** Asegúrate de tener `DEEPSEEK_API_KEY` en tu `.env`

### Error: "Unknown embedding provider: deepseek"

**Solución:** Verifica que `EMBEDDING_PROVIDER=deepseek` esté en tu `.env`

### Error: "DeepSeek embedding generation failed"

**Posibles causas:**
1. API key inválida
2. Modelo incorrecto (verifica `DEEPSEEK_EMBEDDING_MODEL`)
3. Problemas de red

**Solución:** Verifica la API key y el modelo en la documentación de DeepSeek

## 📚 Referencias

- [Documentación de DeepSeek API](https://api-docs.deepseek.com/)
- [Consola de Desarrolladores de DeepSeek](https://platform.deepseek.com/)

---

**Última actualización:** 2025-12-16

