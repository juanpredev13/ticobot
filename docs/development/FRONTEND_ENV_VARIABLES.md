# Variables de Entorno del Frontend

## Variables Requeridas (Producción)

### `NEXT_PUBLIC_API_URL` ⚠️ **REQUERIDA**

**Descripción**: URL del backend API al que el frontend se conectará.

**Formato**: URL completa sin barra final
```
NEXT_PUBLIC_API_URL=https://ticobotbackend-production.up.railway.app
```

**Valor por defecto**: `http://localhost:3001` (solo desarrollo)

**Importante**:
- ⚠️ Debe ser la **URL pública** del backend (no `localhost`)
- ⚠️ Sin barra final (`/`)
- ⚠️ Las variables `NEXT_PUBLIC_*` se incrustan en el build, así que si cambias esta variable, necesitas **redeployar** el frontend

**Cómo obtenerla**:
1. Ve a Railway Dashboard → Backend Service
2. Settings → Networking
3. Copia la **Public Domain** o **Custom Domain**
4. Ejemplo: `https://ticobotbackend-production.up.railway.app`

## Variables Opcionales

### `NODE_ENV` ✅ **Recomendada**

**Descripción**: Entorno de ejecución.

**Valores posibles**:
- `production` (recomendado para Railway)
- `development` (solo local)

**Ejemplo**:
```
NODE_ENV=production
```

**Nota**: Railway puede configurarla automáticamente, pero es buena práctica establecerla explícitamente.

### `NEXT_PUBLIC_API_TIMEOUT` (Opcional)

**Descripción**: Tiempo máximo de espera para requests al API (en milisegundos).

**Valor por defecto**: `30000` (30 segundos)

**Ejemplo**:
```
NEXT_PUBLIC_API_TIMEOUT=30000
```

**Cuándo ajustar**:
- Si tus requests son muy lentos, aumenta este valor
- Si quieres timeouts más rápidos, disminúyelo

### `NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS` (Opcional)

**Descripción**: Habilita React Query DevTools en producción (solo para debugging).

**Valores posibles**:
- `true` - Habilita DevTools
- `false` - Deshabilita DevTools (recomendado para producción)

**Valor por defecto**: `false` (o `true` si `NODE_ENV=development`)

**Ejemplo**:
```
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
```

**Recomendación**: Mantener en `false` en producción para mejor rendimiento.

## Variables que NO necesita el Frontend

El frontend **NO necesita** estas variables (solo el backend las usa):

- ❌ `SUPABASE_URL`
- ❌ `SUPABASE_ANON_KEY`
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `OPENAI_API_KEY`
- ❌ `JWT_SECRET`
- ❌ `FRONTEND_URL`
- ❌ Cualquier otra variable de API keys o secrets

**Razón**: El frontend se comunica con el backend a través de `NEXT_PUBLIC_API_URL`, y el backend es quien maneja todas las conexiones a servicios externos.

## Configuración en Railway

### Paso 1: Obtener URL del Backend

1. Ve a Railway Dashboard → **Backend Service**
2. Settings → **Networking**
3. Copia la **Public Domain** (ej: `https://ticobotbackend-production.up.railway.app`)

### Paso 2: Configurar Frontend

1. Ve a Railway Dashboard → **Frontend Service**
2. Settings → **Variables**
3. Agrega/actualiza:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://ticobotbackend-production.up.railway.app
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
```

### Paso 3: Redeploy

Después de cambiar `NEXT_PUBLIC_API_URL`, Railway redeployará automáticamente. Si no, hazlo manualmente desde la pestaña **Deployments**.

## Verificación

Después de configurar las variables:

1. ✅ Verifica que el frontend se build correctamente
2. ✅ Abre el frontend en el navegador
3. ✅ Abre la consola del navegador (F12)
4. ✅ Verifica que no haya errores de conexión al API
5. ✅ Prueba hacer una request (ej: cargar la página principal)

## Ejemplo Completo para Railway

```bash
# Frontend Service Variables en Railway
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://ticobotbackend-production.up.railway.app
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
```

## Troubleshooting

### Error 502 Bad Gateway

**Causa**: `NEXT_PUBLIC_API_URL` no está configurada o apunta a una URL incorrecta.

**Solución**:
1. Verifica que `NEXT_PUBLIC_API_URL` esté configurada en Railway
2. Verifica que la URL sea la correcta del backend
3. Verifica que el backend esté corriendo y accesible
4. Redeploy el frontend después de cambiar la variable

### Error: "Missing required environment variable: NEXT_PUBLIC_API_URL"

**Causa**: La variable no está configurada en producción.

**Solución**: Agrega `NEXT_PUBLIC_API_URL` en Railway Frontend Service → Variables

### El frontend no se actualiza después de cambiar variables

**Causa**: Las variables `NEXT_PUBLIC_*` se incrustan en el build.

**Solución**: Después de cambiar cualquier variable `NEXT_PUBLIC_*`, necesitas redeployar el frontend.

