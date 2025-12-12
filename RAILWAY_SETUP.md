# Railway Deployment Setup

This guide explains how to configure Railway for deploying both TicoBot backend and frontend in a monorepo setup.

## Problem

Both backend and frontend depend on `@ticobot/shared` which is a workspace package. Railway needs to build from the repository root to resolve workspace dependencies.

## Solution

### Important: Config as Code Priority

Railway uses **Config as Code** which means:
- If `railway.toml` exists in the repository root, it has **priority** over individual `railway.json` files
- The `railway.toml` file matches services by **name** - your services in Railway Dashboard must be named exactly `backend` and `frontend`
- If you prefer to use individual `railway.json` files, you should **remove** the `railway.toml` file

### Option 1: Use railway.toml (Config as Code) - Recommended

The repository has a `railway.toml` file that defines both services:

- **Backend Service**: Must be named `backend` in Railway Dashboard
- **Frontend Service**: Must be named `frontend` in Railway Dashboard

**Configuration Steps**:

1. **For each service in Railway Dashboard**:
   - Go to **Settings** → **Config-as-code** section
   - **Railway config file path**: Leave **empty** or set to `railway.toml`
   - This tells Railway to use the `railway.toml` file from the repository root

2. **Root Directory** (in **Source** section):
   - Should be **empty** or `.` (repository root) for both services
   - **Important**: Do NOT set it to `backend/` or `frontend/`

3. **Service Names**:
   - Service names in Railway Dashboard must match exactly: `backend` and `frontend`
   - Railway matches services by name from the `railway.toml` file

**If commands are being mixed up**:
- Verify service names match exactly: `backend` and `frontend` (case-sensitive)
- Check that "Railway config file path" is empty or `railway.toml`
- Ensure Root Directory is empty (.) for both services
- Try disabling Config as Code temporarily to use manual configuration

### Option 2: Use Individual railway.json Files

If you prefer individual configuration files:

- **Backend Service**: Uses `backend/railway.json`
- **Frontend Service**: Uses `frontend/railway.json`

**Important**: 
- You must **remove** the `railway.toml` file from the repository root
- Root Directory should be **empty** or `.` (repository root) for both services

**Steps for each service:**

1. **Backend Service:**
   - In Railway dashboard, go to your **backend** service → Settings
   - Set **Root Directory** to `.` (repository root, or leave empty)
   - Railway will automatically use the build and start commands from `backend/railway.json`:
     - Build: `pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/backend build`
     - Start: `cd backend && pnpm start`

2. **Frontend Service:**
   - In Railway dashboard, go to your **frontend** service → Settings
   - Set **Root Directory** to `.` (repository root, or leave empty)
   - Railway will automatically use the build and start commands from `frontend/railway.json`:
     - Build: `pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/frontend build`
     - Start: `cd frontend && pnpm start`

### Manual Configuration (If Automatic Detection Doesn't Work)

If Railway doesn't automatically detect the configuration files, you can set them manually:

**Backend Service:**
1. In Railway dashboard, go to your **backend** service → **Settings** tab
2. In the **Source** section:
   - Find **Root directory** field
   - Set it to `.` (dot) or leave it **empty** (repository root)
   - **Important**: It should NOT be `backend/`
3. In the **Build** section:
   - Find **Custom Build Command** field
   - Set it to:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/backend build
     ```
4. In the **Deploy** section:
   - Find **Custom Start Command** field
   - Set it to:
     ```bash
     cd backend && pnpm start
     ```
5. Click **Save** or **Update** button
6. Go to **Deployments** tab and click **Redeploy**

**Frontend Service:**
1. In Railway dashboard, go to your **frontend** service → Settings
2. Set **Root Directory** to `.` (repository root, or leave empty)
3. Set **Build Command** (Custom Build Command) to:
   ```bash
   pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/frontend build
   ```
4. Set **Start Command** to:
   ```bash
   cd frontend && pnpm start
   ```

The `backend/railway.json` file contains:
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/backend build"
  },
  "deploy": {
    "startCommand": "cd backend && pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Environment Variables

Make sure to set all required environment variables in Railway:

### Backend Service Variables

```bash
NODE_ENV=production
PORT=3001  # Railway will override this with its own PORT, but set it for clarity

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-proj-xxx
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# DeepSeek (for LLM)
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Provider Selection
LLM_PROVIDER=deepseek
EMBEDDING_PROVIDER=openai
VECTOR_STORE=supabase
DATABASE_PROVIDER=supabase

# JWT Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12

# CORS - Set this to your frontend's public URL
FRONTEND_URL=https://your-frontend-service.railway.app
```

### Frontend Service Variables

**Requeridas**:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

**Opcionales**:
```bash
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
```

**Notas**:
- `PORT` es automáticamente configurado por Railway, no lo sobrescribas
- `NEXT_PUBLIC_API_URL` es **CRÍTICA** - sin ella obtendrás errores 502
- Obtén la URL del backend desde: Backend Service → Settings → Networking → Public Domain
- Las variables `NEXT_PUBLIC_*` se incrustan en el build, así que necesitas redeployar después de cambiarlas

**Ver documentación completa**: Ver `docs/development/FRONTEND_ENV_VARIABLES.md`

### How to Get Backend URL in Railway

1. Go to your **backend** service in Railway Dashboard
2. Click on the **Settings** tab
3. Scroll down to **Networking** section
4. Find the **Public Domain** or **Custom Domain**
5. Copy the URL (e.g., `https://backend-production-xxxx.up.railway.app`)
6. Set this as `NEXT_PUBLIC_API_URL` in your **frontend** service variables

**Important**: 
- The backend URL must be the **public URL** (not internal/localhost)
- If your backend doesn't have a public domain, you need to generate one in Railway
- The frontend will make requests from the browser, so it needs a publicly accessible URL

## Troubleshooting

### Frontend Container Stops After Starting

**Síntomas**:
- Next.js inicia correctamente: `Ready in XXXms`
- Luego aparece: `Stopping Container` y `ELIFECYCLE Command failed`
- El contenedor se detiene

**Causas posibles**:

1. **Next.js no está escuchando en el host correcto**:
   - Next.js debe escuchar en `0.0.0.0`, no solo en `localhost`
   - Next.js 16 lo hace automáticamente cuando detecta `PORT`

2. **Problema con la variable PORT**:
   - Railway asigna `PORT` automáticamente
   - Next.js la detecta automáticamente
   - No necesitas configurarla manualmente

3. **Error en el código que causa que el proceso se detenga**:
   - Revisa los logs completos del frontend en Railway
   - Busca errores de JavaScript o TypeScript
   - Verifica que no haya errores de importación o inicialización

**Solución**:

1. **Verifica los logs completos**:
   - Railway Dashboard → Frontend Service → Logs
   - Busca errores después de "Ready in XXXms"

2. **Verifica que Next.js esté escuchando correctamente**:
   - Los logs deberían mostrar: `- Local: http://localhost:PORT` y `- Network: http://0.0.0.0:PORT`
   - Si solo muestra `localhost`, puede haber un problema

3. **Verifica variables de entorno**:
   - Asegúrate de que `NODE_ENV=production` esté configurado
   - Verifica que `NEXT_PUBLIC_API_URL` esté configurado correctamente

4. **Si el problema persiste**:
   - Intenta hacer un redeploy completo
   - Verifica que el build se complete sin errores
   - Revisa si hay errores en el código que se ejecutan al iniciar

### Error 502 Bad Gateway

**Cause**: The frontend cannot connect to the backend because `NEXT_PUBLIC_API_URL` is not configured correctly.

**Symptoms**:
- Frontend loads but shows 502 errors
- API requests fail with network errors
- Browser console shows CORS or connection errors

**Fix**:

1. **Get Backend Public URL**:
   - Go to Railway Dashboard → Backend Service → Settings
   - Find **Public Domain** or generate one if it doesn't exist
   - Copy the URL (e.g., `https://backend-production-xxxx.up.railway.app`)

2. **Configure Frontend**:
   - Go to Railway Dashboard → Frontend Service → Variables
   - Add or update `NEXT_PUBLIC_API_URL` with the backend URL from step 1
   - Make sure there's no trailing slash: `https://backend-production-xxxx.up.railway.app` (not `https://backend-production-xxxx.up.railway.app/`)

3. **Redeploy Frontend**:
   - After setting the variable, Railway will automatically redeploy
   - Or manually trigger a redeploy from the Deployments tab

4. **Verify**:
   - Check that `NEXT_PUBLIC_API_URL` is set correctly in frontend service variables
   - Verify the backend is running and accessible at the public URL
   - Check browser console for any remaining errors

**Note**: `NEXT_PUBLIC_*` variables are embedded at build time. If you change them, you need to rebuild/redeploy the frontend.

### Frontend and Backend Using Same Port

**Cause**: Both services are trying to use port 3001.

**Fix**: 
- Railway automatically assigns ports via the `PORT` environment variable
- Don't manually set `PORT` in the frontend service
- Let Railway handle port assignment automatically
- Next.js will automatically use the `PORT` variable if available

## Troubleshooting

### Error: "@ticobot/shared@workspace:*" is in the dependencies but no package named "@ticobot/shared" is present

**Cause**: Root Directory is set to `backend/` or `frontend/` instead of repository root.

**Fix**: 
1. Go to Railway service settings (for the affected service)
2. Change Root Directory from `backend/` or `frontend/` to `.` (or leave empty)
3. Redeploy

### Frontend service is using backend build command

**Cause**: Railway is detecting the wrong `railway.json` file or Root Directory is incorrect.

**Fix**:
1. Ensure `frontend/railway.json` exists with the correct build command
2. Set Root Directory to `.` (repository root) for the frontend service
3. Verify the Custom Build Command shows: `pnpm --filter @ticobot/frontend build` (not `@ticobot/backend`)
4. Redeploy

### Error: Cannot find module '@ticobot/shared'

**Cause**: The `shared` package wasn't built before building the backend, OR Railway is not using the build command from `railway.json`.

**Symptoms**:
- Railway logs show: `pnpm --filter @ticobot/backend build` (without building shared first)
- Build path shows `/app/backend` instead of `/app`
- TypeScript errors: `Cannot find module '@ticobot/shared'`

**Fix - Step by Step**:

1. **Verify Root Directory**:
   - Go to Railway Dashboard → Your Backend Service → Settings
   - Check **Root Directory** field
   - It MUST be `.` (dot) or empty (repository root)
   - If it shows `backend/`, change it to `.` (or leave empty)
   - Click **Save**

2. **Set Custom Build Command Manually** (Railway may not auto-detect `railway.json`):
   - In the same Settings page, find **Build Command** or **Custom Build Command**
   - Set it to:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/backend build
     ```
   - Click **Save**

3. **Set Start Command**:
   - Find **Start Command** field
   - Set it to:
     ```bash
     cd backend && pnpm start
     ```
   - Click **Save**

4. **Redeploy**:
   - Go to **Deployments** tab
   - Click **Redeploy** or trigger a new deployment

**Important**: Even if `backend/railway.json` exists, Railway may not automatically use it. Always configure the build command manually in Railway Dashboard to ensure it works correctly.

