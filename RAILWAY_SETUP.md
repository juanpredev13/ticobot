# Railway Deployment Setup

This guide explains how to configure Railway for deploying both TicoBot backend and frontend in a monorepo setup.

## Problem

Both backend and frontend depend on `@ticobot/shared` which is a workspace package. Railway needs to build from the repository root to resolve workspace dependencies.

## Solution

### Configuration for Both Services

Each service has its own `railway.json` file that Railway will automatically detect:

- **Backend Service**: Uses `backend/railway.json`
- **Frontend Service**: Uses `frontend/railway.json`

**Important**: Make sure the Root Directory is set to `.` (repository root) for both services so Railway can find the workspace packages.

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

```bash
NODE_ENV=production
PORT=3001

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

# CORS
FRONTEND_URL=https://ticobot.vercel.app
```

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

