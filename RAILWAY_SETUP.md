# Railway Deployment Setup

This guide explains how to configure Railway for deploying the TicoBot backend in a monorepo setup.

## Problem

The backend depends on `@ticobot/shared` which is a workspace package. Railway needs to build from the repository root to resolve workspace dependencies.

## Solution

### Option 1: Configure Root Directory as Repository Root (Recommended)

1. In Railway dashboard, go to your backend service settings
2. Set **Root Directory** to `.` (repository root, leave empty or use `.`)
3. Set **Build Command** to:
   ```bash
   pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/backend build
   ```
4. Set **Start Command** to:
   ```bash
   cd backend && pnpm start
   ```

### Option 2: Use railway.json Configuration

Railway will automatically detect `backend/railway.json` if:
- Root Directory is set to `.` (repository root)
- The file exists at `backend/railway.json`

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

**Cause**: Root Directory is set to `backend/` instead of repository root.

**Fix**: 
1. Go to Railway service settings
2. Change Root Directory from `backend/` to `.` (or leave empty)
3. Redeploy

### Error: Cannot find module '@ticobot/shared'

**Cause**: The `shared` package wasn't built before building the backend.

**Fix**: Ensure the build command includes:
```bash
pnpm --filter @ticobot/shared build
```
before building the backend.

