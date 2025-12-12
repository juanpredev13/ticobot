# Environment Setup Guide

## Overview

This guide helps you set up all environment variables and API keys needed for TicoBot development and production.

---

## Prerequisites

Before you start, you'll need:
- [ ] OpenAI API account
- [ ] DeepSeek API account
- [ ] Supabase account
- [ ] GitHub account
- [ ] Vercel account (for frontend deployment)
- [ ] Railway account (for backend deployment)

---

## 1. Get API Keys

### OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Name it: `ticobot-prod`
6. Copy the key: `sk-proj-...`
7. **Save it securely** - you can't see it again!

**Cost**:
- Pay-as-you-go
- Add $5-10 credit to start
- Monitor usage in dashboard

### DeepSeek API Key

1. Go to [platform.deepseek.com](https://platform.deepseek.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create new key
5. Copy the key: `sk-...`
6. **Save it securely**

**Cost**:
- Much cheaper than OpenAI
- Add $5-10 credit to start

### Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Create new project
   - Name: `ticobot-prod`
   - Database Password: Generate strong password
   - Region: `us-east-1` (closest to Costa Rica)
3. Wait for project to be ready (~2 minutes)
4. Go to Project Settings > API
5. Copy these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJh...`
   - **service_role key**: `eyJh...` (for backend only)
6. Go to Project Settings > Database
7. Copy **Connection string** (Postgres connection pooler)

---

## 2. Enable pgvector in Supabase

1. Go to SQL Editor in Supabase dashboard
2. Run this SQL:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

3. You should see `vector` in the results

---

## 3. Create Environment Files

### Backend Development Environment

**File**: `backend/.env.development`

```bash
# Environment
NODE_ENV=development
PORT=3001

# Database (Supabase)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...  # Public key
SUPABASE_SERVICE_KEY=eyJhbG...  # Service role key (for backend)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# OpenAI (for embeddings + dev LLM)
OPENAI_API_KEY=sk-proj-xxx
OPENAI_ORG_ID=org-xxx  # Optional

# DeepSeek (optional for dev, mainly for prod)
DEEPSEEK_API_KEY=sk-xxx

# Provider Selection
LLM_PROVIDER=openai  # or 'deepseek'
LLM_MODEL=gpt-4o-mini  # Cheap for dev
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

# CORS
FRONTEND_URL=http://localhost:3000

# Optional: Monitoring
LOG_LEVEL=debug
ENABLE_METRICS=true
```

### Backend Production Environment

**File**: `backend/.env.production`

```bash
# Environment
NODE_ENV=production
PORT=3001

# Database (Supabase)
SUPABASE_URL=https://prod-xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres:[password]@db.prod-xxx.supabase.co:5432/postgres

# OpenAI (for embeddings + A/B test LLM)
OPENAI_API_KEY=sk-proj-prod-xxx
OPENAI_ORG_ID=org-xxx

# DeepSeek (primary production LLM)
DEEPSEEK_API_KEY=sk-prod-xxx

# Provider Selection
LLM_PROVIDER=deepseek  # Start with budget option
LLM_MODEL=deepseek-chat
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

# CORS
FRONTEND_URL=https://ticobot.vercel.app

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
SENTRY_DSN=https://xxx@sentry.io/xxx  # Optional
```

### Frontend Development Environment

**File**: `frontend/.env.development`

```bash
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=G-xxx  # Google Analytics
```

### Frontend Production Environment

**File**: `frontend/.env.production`

```bash
# Backend API (Railway deployment)
NEXT_PUBLIC_BACKEND_URL=https://ticobot-backend.up.railway.app

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=G-xxx
```

---

## 4. Set Up Vercel (Frontend Deployment)

1. Go to [vercel.com](https://vercel.com/)
2. Sign in with GitHub
3. Click "Add New..." > "Project"
4. Import your `ticobot` repository
5. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend/`
   - **Build Command**: `pnpm build` (auto)
   - **Install Command**: `pnpm install` (auto)
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_BACKEND_URL = https://ticobot-backend.up.railway.app
   NEXT_PUBLIC_ANALYTICS_ID = G-xxx
   ```
7. Click "Deploy"
8. Wait ~2 minutes
9. Your frontend will be live at: `https://ticobot.vercel.app`

**Auto-Deploy**:
- Pushes to `main` → Production deploy
- PRs → Preview deploy

---

## 5. Set Up Railway (Backend Deployment)

1. Go to [railway.app](https://railway.app/)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `ticobot` repository
6. Configure:
   - **Root Directory**: `.` (root of the repository, NOT `backend/`)
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter @ticobot/shared build && pnpm --filter @ticobot/backend build`
   - **Start Command**: `cd backend && pnpm start`
   
   **Important**: The Root Directory must be the repository root (`.`) because the backend depends on `@ticobot/shared` which is part of the pnpm workspace. Railway will automatically detect `backend/railway.json` if present.
7. Add Environment Variables (copy from backend/.env.production):
   ```
   NODE_ENV = production
   PORT = 3001
   SUPABASE_URL = https://xxx.supabase.co
   SUPABASE_SERVICE_KEY = eyJh...
   OPENAI_API_KEY = sk-proj-xxx
   DEEPSEEK_API_KEY = sk-xxx
   LLM_PROVIDER = deepseek
   LLM_MODEL = deepseek-chat
   EMBEDDING_PROVIDER = openai
   EMBEDDING_MODEL = text-embedding-3-small
   FRONTEND_URL = https://ticobot.vercel.app
   ```
8. Click "Deploy"
9. Wait ~3 minutes
10. Your backend will be live at: `https://ticobot-backend.up.railway.app`

**Auto-Deploy**:
- Pushes to `main` → Production deploy

---

## 6. Configure Database Schema

Once Supabase is set up, run these SQL migrations:

**File**: `backend/src/db/migrations/001_initial_schema.sql`

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party TEXT NOT NULL,
  candidate TEXT NOT NULL,
  year INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  total_pages INTEGER,
  total_chunks INTEGER,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY, -- Format: {docId}_p{page}_c{index}
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER,
  section TEXT,
  character_count INTEGER NOT NULL,
  word_count INTEGER,
  quality_score FLOAT,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_party ON documents(party);
CREATE INDEX IF NOT EXISTS idx_documents_year ON documents(year);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_page ON chunks(page_number);

-- Vector similarity search index (HNSW for speed)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  filter_party TEXT DEFAULT NULL,
  filter_year INT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.metadata
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE
    (filter_party IS NULL OR d.party = filter_party) AND
    (filter_year IS NULL OR d.year = filter_year)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**To run**:
1. Go to Supabase SQL Editor
2. Paste the SQL above
3. Click "Run"
4. Verify tables created: Go to Table Editor

---

## 7. Test Your Setup

### Test Backend Locally

```bash
cd backend

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Should see:
# Server running on http://localhost:3001
# Connected to Supabase
```

Test endpoint:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"healthy","version":"1.0.0"}
```

### Test Frontend Locally

```bash
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Should see:
# - Local: http://localhost:3000
```

Open browser: `http://localhost:3000`

### Test API Integration

```bash
# From frontend, make request to backend
curl http://localhost:3000/api/proxy/health
# Should proxy to backend and return health status
```

---

## 8. Verify Environment Variables

### Backend Verification

```bash
cd backend
pnpm tsx scripts/verify-env.ts
```

**File**: `backend/scripts/verify-env.ts`

```typescript
// Create this file to verify all env vars are set
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'LLM_PROVIDER',
  'EMBEDDING_PROVIDER',
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set!');
```

---

## 9. Security Best Practices

### DO ✅
- Store API keys in `.env` files
- Add `.env*` to `.gitignore`
- Use different keys for dev and prod
- Rotate keys regularly
- Use Supabase service_role key only in backend (never in frontend)
- Set CORS properly (only allow your frontend URL)

### DON'T ❌
- Never commit API keys to Git
- Never expose service_role key in frontend
- Never hardcode API keys in code
- Never share keys in public channels
- Never use production keys in development

---

## 10. Troubleshooting

### "API key invalid"
- Check key is copied correctly (no spaces)
- Verify key is active in provider dashboard
- Check you're using correct env file (.development vs .production)

### "Cannot connect to Supabase"
- Verify project URL is correct
- Check API keys are correct
- Ensure project is active (not paused)
- Test connection string separately

### "CORS error in frontend"
- Check FRONTEND_URL in backend .env
- Verify CORS middleware is configured
- Check Vercel deployment uses correct backend URL

### "Vector search not working"
- Verify pgvector extension is enabled
- Check HNSW index was created
- Ensure embeddings are stored correctly (check dimension: 1536)

---

## Quick Reference

### All API Keys Needed

| Service | Key Name | Where to Get | Where to Use |
|---------|----------|--------------|--------------|
| OpenAI | `OPENAI_API_KEY` | platform.openai.com | Backend .env |
| DeepSeek | `DEEPSEEK_API_KEY` | platform.deepseek.com | Backend .env |
| Supabase | `SUPABASE_URL` | supabase.com/dashboard | Backend + Frontend .env |
| Supabase | `SUPABASE_ANON_KEY` | supabase.com/dashboard | Backend + Frontend .env |
| Supabase | `SUPABASE_SERVICE_KEY` | supabase.com/dashboard | Backend .env only |

### Environment Files Checklist

- [ ] `backend/.env.development` created
- [ ] `backend/.env.production` created
- [ ] `frontend/.env.development` created
- [ ] `frontend/.env.production` created
- [ ] All keys added to Vercel
- [ ] All keys added to Railway
- [ ] `.env*` in `.gitignore`
- [ ] Supabase database schema created
- [ ] pgvector extension enabled
- [ ] Health check working

---

**Setup Complete!** ✅

You're ready to start implementing Phase 2! 🚀

---

**Last Updated**: 2025-11-22
