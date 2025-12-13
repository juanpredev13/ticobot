# Railway Monorepo Setup - Following Official Tutorial

This guide follows the [official Railway monorepo tutorial](https://docs.railway.com/tutorials/deploying-a-monorepo) adapted for our **shared monorepo** structure.

## Important: Shared vs Isolated Monorepo

The official tutorial covers **isolated monorepos** (services don't share code). Our setup is a **shared monorepo** because:
- Both `backend` and `frontend` depend on `@ticobot/shared`
- We use pnpm workspaces
- Services share common code and configuration

**Key Difference**: 
- **Isolated monorepo** (tutorial): Root Directory = `/frontend`, `/backend`
- **Shared monorepo** (ours): Root Directory = `.` (repository root) for both services

## Step-by-Step Setup

### 1. Create Empty Project

1. Go to Railway Dashboard
2. Click `+ New Project` or `⌘ k`
3. Choose `Empty project`
4. Rename project to something recognizable (e.g., "TicoBot")

### 2. Create Empty Services

1. Click `+ Create` button (top right)
2. Add **two** new **empty** services
3. Name them exactly:
   - `backend` (case-sensitive)
   - `frontend` (case-sensitive)
4. Click `Deploy` or `⇧ Enter` to create services

**Important**: Service names must match exactly what's in `railway.toml`:
- `[[services]] name = "backend"`
- `[[services]] name = "frontend"`

### 3. Root Directory Configuration

**For Shared Monorepos** (our case):

1. **Frontend Service** → Settings → Source:
   - **Root Directory**: `.` (dot) or leave **empty**
   - **NOT** `/frontend` (that's for isolated monorepos)

2. **Backend Service** → Settings → Source:
   - **Root Directory**: `.` (dot) or leave **empty`
   - **NOT** `/backend` (that's for isolated monorepos)

**Why?** Because both services need access to `shared/` package at the repository root.

### 4. Connect GitHub Repository

1. **Frontend Service** → Settings → Source:
   - Click "Connect Repo"
   - Select your repository
   - Branch: `main` (or your default branch)

2. **Backend Service** → Settings → Source:
   - Click "Connect Repo"
   - Select the **same** repository
   - Branch: `main` (or your default branch)

### 5. Config as Code Setup

1. **Both Services** → Settings → Config-as-code:
   - **Railway config file path**: Leave **empty** or set to `railway.toml`
   - This tells Railway to use `railway.toml` from repository root

2. Verify `railway.toml` exists in repository root with:
   ```toml
   [[services]]
   name = "backend"
   # ... configuration

   [[services]]
   name = "frontend"
   # ... configuration
   ```

### 6. Generate Public Domains

1. **Frontend Service** → Settings → Networking:
   - Click `Generate Domain`
   - Railway will automatically detect the port

2. **Backend Service** → Settings → Networking:
   - Click `Generate Domain`
   - Railway will automatically detect the port

**Note**: Railway automatically detects `PORT` environment variable that services bind to.

### 7. Configure Environment Variables

#### Frontend Variables

**Frontend Service** → Variables:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

**Note**: `${{Backend.RAILWAY_PUBLIC_DOMAIN}}` is a reference variable that automatically updates when backend redeploys.

#### Backend Variables

**Backend Service** → Variables:

```bash
NODE_ENV=production
PORT=3001  # Railway will override this, but set for clarity
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
CLIENT_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}  # Alternative name for compatibility

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# OpenAI
OPENAI_API_KEY=sk-proj-xxx
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4-turbo-preview

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=10
```

**Note**: `${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` automatically updates when frontend redeploys.

### 8. Deploy

1. Click `Deploy` or `⇧ Enter` to save all changes
2. Railway will:
   - Build `@ticobot/shared` first
   - Build backend/frontend
   - Deploy both services
3. Check deployment logs to verify successful build

## Verification Checklist

After deployment, verify:

- [ ] Both services show "Deployed" status
- [ ] Frontend service has public domain
- [ ] Backend service has public domain
- [ ] Frontend can access backend API (check browser console)
- [ ] Backend health check works: `https://backend-domain/health`
- [ ] Frontend health check works: `https://frontend-domain/api/health`

## Troubleshooting

### Services Not Building

**Problem**: Build fails with `@ticobot/shared not found`

**Solution**:
- Verify Root Directory = `.` (not `/frontend` or `/backend`)
- Verify build command includes: `pnpm --filter @ticobot/shared build`

### Services Not Starting

**Problem**: 502 Bad Gateway or "Application Not Listening"

**Solution**:
- Verify services bind to `0.0.0.0` (not `localhost`)
- Verify services use `PORT` environment variable
- Check deployment logs for startup errors

### Variables Not Updating

**Problem**: Reference variables (`${{Service.RAILWAY_PUBLIC_DOMAIN}}`) not working

**Solution**:
- Ensure services have public domains generated
- Redeploy services after generating domains
- Check variable syntax (must be exact: `${{Service.RAILWAY_PUBLIC_DOMAIN}}`)

## Differences from Official Tutorial

The official tutorial uses **isolated monorepos** where:
- Root Directory = `/frontend`, `/backend`
- Services don't share code
- Simpler setup

Our setup uses **shared monorepos** where:
- Root Directory = `.` (repository root)
- Services share `@ticobot/shared` package
- Requires building shared package first
- More complex but allows code sharing

## Additional Resources

- [Railway Monorepo Tutorial](https://docs.railway.com/tutorials/deploying-a-monorepo)
- [Railway Monorepo Guide](https://docs.railway.com/guides/monorepo)
- [Railway Config as Code](https://docs.railway.com/reference/config-as-code)
- [Railway Reference Variables](https://docs.railway.com/reference/variables#reference-variables)

