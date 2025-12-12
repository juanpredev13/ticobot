# 🚀 Solución Definitiva para Railway - Paso a Paso

## ⚠️ PROBLEMA ACTUAL
Railway está intentando ejecutar `start.sh` que ya no existe. Esto causa el error:
```
start.sh: line 35: exec: next: not found
```

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Limpiar Configuración en Railway Dashboard

1. **Ve a Railway Dashboard** → Tu proyecto → **Frontend Service**

2. **Settings** → **Deploy** (o **General**)
   - Busca el campo **"Custom Start Command"** o **"Start Command"**
   - **BORRA TODO** lo que esté ahí (déjalo completamente vacío)
   - Si no ves este campo, busca en **Settings** → **Config-as-code**
     - **Railway config file path**: Déjalo vacío o pon `railway.toml`

3. **Settings** → **Source**
   - **Root Directory**: Debe ser `.` (punto) o estar vacío
   - **NO** debe ser `frontend/` o `/frontend`

4. **Guarda los cambios** (si hay botón Save/Update)

### Paso 2: Verificar que el Servicio se Llame "frontend"

1. En Railway Dashboard, verifica que el servicio se llame exactamente **"frontend"** (minúsculas, sin espacios)
2. Si tiene otro nombre, renómbralo a **"frontend"**

### Paso 3: Hacer Redeploy Completo

1. Ve a **Deployments** en el servicio frontend
2. Click en **"Redeploy"** o **"Deploy Latest"**
3. Espera a que termine el build

### Paso 4: Verificar los Logs

Después del deploy, revisa los logs. Deberías ver:
```
Starting Next.js Frontend
Port: 8080 (o el puerto que Railway asigne)
Host: 0.0.0.0
```

**NO deberías ver**:
- `start.sh`
- `bash start.sh`
- `exec: next: not found`

## 🔧 Si Aún No Funciona

### Opción A: Configuración Manual en Dashboard

Si `railway.toml` no funciona, configura manualmente:

1. **Settings** → **Deploy** → **Custom Start Command**
2. Pon exactamente esto:
   ```bash
   cd frontend && pnpm start
   ```
3. **Settings** → **Source** → **Root Directory**: `.` (punto)
4. **Redeploy**

### Opción B: Usar railway.json Individual

Si Config as Code no funciona:

1. **Settings** → **Config-as-code** → **Desactívalo** temporalmente
2. Railway usará `frontend/railway.json` automáticamente
3. **Redeploy**

### Opción C: Verificar Variables de Entorno

1. **Settings** → **Variables**
2. Verifica que tengas:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL=https://tu-backend.railway.app`
   - `PORT` (Railway lo asigna automáticamente, NO lo configures manualmente)

## 📋 Checklist Final

Antes de pedir ayuda, verifica:

- [ ] Root Directory = `.` (punto) o vacío
- [ ] Custom Start Command = vacío O `cd frontend && pnpm start`
- [ ] Nombre del servicio = exactamente "frontend"
- [ ] Railway config file path = vacío o `railway.toml`
- [ ] `NODE_ENV=production` está configurado
- [ ] `NEXT_PUBLIC_API_URL` apunta al backend correcto
- [ ] Hiciste redeploy después de los cambios

## 🆘 Si Nada Funciona

1. **Crea un nuevo servicio** en Railway:
   - Nombre: `frontend-new`
   - Root Directory: `.`
   - Build Command: `pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/frontend build`
   - Start Command: `cd frontend && pnpm start`
   - Conecta el mismo repositorio
   - Configura las mismas variables de entorno
   - Deploy

2. Si el nuevo servicio funciona, **elimina el antiguo** y renombra el nuevo a `frontend`

## 📝 Notas Importantes

- **Next.js detecta PORT automáticamente** de las variables de entorno de Railway
- El flag `-H 0.0.0.0` en `package.json` hace que Next.js escuche en todas las interfaces
- Los warnings de npm/pnpm son inofensivos y no afectan el funcionamiento
- Railway puede tardar 30-60 segundos en detectar que el servicio está listo

