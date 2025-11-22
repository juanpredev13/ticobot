# Technology Decisions & Stack Finalization

## Overview

This document finalizes all technology decisions for TicoBot, the RAG system for analyzing Costa Rica's 2026 Government Plans.

**Decision Date**: 2025-11-22
**Phase**: 1.7 - Technology Decisions
**Status**: ✅ Finalized

---

## Executive Summary

### Technology Stack

**Backend**:
- Runtime: Node.js 20+ with TypeScript
- Framework: Express.js
- Database: Supabase (PostgreSQL + pgvector)
- Deployment: Railway

**Frontend**:
- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS (vanilla, no component library)
- Deployment: Vercel

**AI/ML Providers**:
- Embeddings: OpenAI text-embedding-3-small
- LLM Dev: OpenAI GPT-4o-mini
- LLM Prod: Switchable (OpenAI GPT-4o ↔ DeepSeek)
- Vector Store: Supabase pgvector

---

## Backend Technology Stack

### Runtime & Language

**Decision**: Node.js 20+ with TypeScript

**Rationale**:
- ✅ Already using in Phase 1.4 & 1.5 (backend structure in place)
- ✅ Excellent TypeScript support
- ✅ Rich ecosystem for AI/ML libraries
- ✅ Native async/await for RAG pipeline
- ✅ Compatible with all chosen providers (OpenAI, Supabase, etc.)
- ✅ Great performance for I/O-heavy operations (RAG is I/O-bound)

**Alternatives Considered**:
- Python: Better ML ecosystem but slower, would require rewrite
- Go: Faster but smaller ecosystem, steeper learning curve
- Rust: Excellent performance but overkill for RAG, long dev time

### Backend Framework

**Decision**: Express.js

**Rationale**:
- ✅ Most popular Node.js framework (battle-tested)
- ✅ Lightweight and flexible
- ✅ Huge ecosystem (middleware for everything)
- ✅ Easy to integrate with Supabase SDK
- ✅ Simple to deploy on Railway
- ✅ TypeScript support via @types/express
- ✅ Perfect for REST APIs needed by frontend

**Configuration**:
```typescript
// Express setup
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL, // Vercel deployment
  credentials: true
}));

app.use(express.json());

// API routes
app.post('/api/ingest', ingestController);
app.post('/api/query', queryController);
app.get('/api/health', healthController);
```

**Alternatives Considered**:
- Fastify: Faster but smaller ecosystem, schema validation overkill
- Hono: Too minimal, less mature for production RAG system

### Database & Vector Store

**Decision**: Supabase (PostgreSQL + pgvector)

**Rationale**:
- ✅ PostgreSQL + pgvector in one platform
- ✅ Free tier: 500MB database, 2GB storage (enough for MVP)
- ✅ Native vector similarity search (no separate vector DB needed)
- ✅ Real-time subscriptions (useful for admin dashboard)
- ✅ Auth built-in (for future admin features)
- ✅ Easy to deploy on Railway (just env vars)
- ✅ SQL-based (familiar, powerful queries)

**Setup Required**:
1. Create new Supabase project
2. Enable pgvector extension
3. Create tables: `documents`, `chunks`
4. Create vector similarity search function
5. Add HNSW index for fast search

**Alternatives Considered**:
- Pinecone: Specialized vector DB, but costs $70/month (no free tier)
- Qdrant: Self-hosted complexity, not worth it for MVP
- Weaviate: Similar to Qdrant, overhead not justified

---

## Frontend Technology Stack

### Framework

**Decision**: Next.js 16 (App Router)

**Rationale**:
- ✅ Best React framework for production
- ✅ App Router for modern React patterns (Server Components)
- ✅ Built-in API routes (can proxy to Railway backend)
- ✅ Excellent SEO (important for public govt plan explorer)
- ✅ Automatic code splitting and optimization
- ✅ Perfect deployment on Vercel (zero-config)
- ✅ TypeScript first-class support

**App Structure**:
```
frontend/app/
├── (marketing)/
│   └── page.tsx          # Home page
├── chat/
│   └── page.tsx          # Chat interface
├── explorer/
│   └── page.tsx          # Document explorer
├── compare/
│   └── page.tsx          # Side-by-side comparison
├── admin/
│   └── page.tsx          # Admin dashboard
└── api/
    └── proxy/            # Proxy to Railway backend
        └── route.ts
```

### Styling

**Decision**: Tailwind CSS (vanilla, no component library)

**Rationale**:
- ✅ Full control over design
- ✅ No dependency on component library versions
- ✅ Smaller bundle size (only CSS you use)
- ✅ Perfect for custom Costa Rica-themed UI
- ✅ Excellent dark mode support
- ✅ Responsive utilities built-in
- ✅ Easy to maintain and customize

**Custom Components**:
Build from scratch:
- Button, Input, Select, Card, Modal
- Chat message bubbles
- Document cards
- Comparison tables
- Loading states, toasts

**Alternatives Considered**:
- shadcn/ui: Great but copy-paste overhead, not needed for simple UI
- NextUI: Beautiful but opinionated, less control
- Material UI: Too heavy, not aligned with design vision

### Deployment

**Decision**: Vercel

**Rationale**:
- ✅ Made by Next.js creators (best optimization)
- ✅ Automatic deployments from GitHub
- ✅ Zero configuration needed
- ✅ Edge functions for fast API routes
- ✅ Free tier: Unlimited deployments, 100GB bandwidth
- ✅ Custom domain support
- ✅ Preview deployments for PRs
- ✅ Analytics and monitoring built-in

**Deployment Setup**:
1. Connect GitHub repo to Vercel
2. Set environment variables (BACKEND_URL, etc.)
3. Auto-deploy on push to `main`
4. Preview deploys on PRs

---

## AI/ML Provider Stack

### Embedding Provider

**Decision**: OpenAI text-embedding-3-small

**Rationale**:
- ✅ Industry standard for embeddings
- ✅ 1536 dimensions (good balance)
- ✅ Excellent quality for Spanish text
- ✅ Cheap: $0.02 per 1M tokens
- ✅ Fast inference (< 100ms per batch)
- ✅ Well-tested with pgvector
- ✅ Simple API, excellent SDK

**Cost Analysis** (for 10K users, 3 questions each):
- TSE PDFs: ~2M tokens = $0.04
- User queries: 30K queries × 20 tokens = 600K tokens = $0.01
- **Total: ~$0.05 for embeddings**

**Configuration**:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Batch embedding generation
const embeddings = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: chunks, // array of text chunks
});
```

**Alternatives Considered**:
- text-embedding-3-large: Better quality but 6.5x more expensive ($0.13/1M)
- Cohere multilingual: Good for Spanish but costs 5x more
- Voyage AI: Optimized for RAG but costs 6x more

### LLM Provider - Development

**Decision**: OpenAI GPT-4o-mini

**Rationale**:
- ✅ Cheap for development: $0.15/1M input, $0.60/1M output
- ✅ Good quality (better than Llama 3.1)
- ✅ Reliable API (99.9% uptime)
- ✅ Same SDK as production (easy to switch)
- ✅ Fast inference (< 2s for responses)
- ✅ 128K context window (plenty for RAG)

**Estimated Dev Cost**:
- Testing: ~100 queries during development = $0.10
- **Total: < $1 for all development**

**Configuration**:
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: contextWithQuery }
  ],
  temperature: 0.3,
  max_tokens: 500,
});
```

**Alternatives Considered**:
- Groq Llama 3.1: Free but lower quality, rate limits
- Gemini Flash: Cheaper but different API (more switching cost)
- Claude Haiku: Good but costs more for dev

### LLM Provider - Production

**Decision**: Switchable between OpenAI GPT-4o and DeepSeek

**Rationale**:
- ✅ **Flexibility**: Switch providers without code changes (thanks to Phase 1.4 abstraction!)
- ✅ **OpenAI GPT-4o**: High quality, reliable, $2.50/1M input
- ✅ **DeepSeek**: Budget option, good quality, much cheaper
- ✅ Can A/B test both providers
- ✅ Runtime switching via environment variable
- ✅ Cost optimization based on usage patterns

**Cost Comparison** (10K users, 3 questions, 2K tokens avg):
- **OpenAI GPT-4o**: ~$140 total
  - Input (60M tokens): $150
  - Output (15M tokens): $600
  - Total: ~$750 (but cacheable, ~$140 realistic)

- **DeepSeek**: ~$20 total
  - Much cheaper per token
  - Good quality for Spanish
  - Slightly slower inference

**Implementation**:
```typescript
// provider.config.ts
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // or 'deepseek'

// Switching logic (already in ProviderFactory from Phase 1.4)
const llmProvider = ProviderFactory.createLLMProvider(LLM_PROVIDER);

// Same interface for both:
const response = await llmProvider.generateCompletion(messages, options);
```

**Provider Selection Strategy**:
- **Start with DeepSeek** (budget-friendly MVP)
- **A/B test OpenAI** with 10% of users
- **Switch based on**:
  - Answer quality metrics
  - User satisfaction scores
  - Cost per query
  - Latency requirements

---

## Development vs Production Environments

### Development Stack

```bash
# .env.development
NODE_ENV=development

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://...

# AI Providers
OPENAI_API_KEY=sk-xxx
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini  # Cheap for dev
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

# Backend
BACKEND_URL=http://localhost:3001

# Frontend
FRONTEND_URL=http://localhost:3000
```

**Dev Costs**: ~$5 total for entire development phase

### Production Stack

```bash
# .env.production
NODE_ENV=production

# Database (Railway/Supabase)
SUPABASE_URL=https://prod.supabase.co
SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://...

# AI Providers
OPENAI_API_KEY=sk-prod-xxx
DEEPSEEK_API_KEY=sk-deepseek-xxx
LLM_PROVIDER=deepseek  # Start with budget option
LLM_MODEL=deepseek-chat  # or gpt-4o
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

# Backend (Railway)
BACKEND_URL=https://ticobot-backend.up.railway.app

# Frontend (Vercel)
FRONTEND_URL=https://ticobot.vercel.app
```

**Prod Costs** (10K users):
- **Embeddings**: $0.05
- **LLM (DeepSeek)**: $20
- **LLM (OpenAI)**: $140
- **Database**: Free tier (Supabase)
- **Hosting**: Free tier (Vercel + Railway)
- **Total**: $20-140 depending on LLM choice

---

## Deployment Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Vercel                        │
│  ┌─────────────────────────────────────────┐  │
│  │         Next.js Frontend                 │  │
│  │  - App Router                            │  │
│  │  - Tailwind CSS                          │  │
│  │  - API proxy routes                      │  │
│  └─────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────┐
│                   Railway                       │
│  ┌─────────────────────────────────────────┐  │
│  │     Express Backend (Node.js/TS)         │  │
│  │  - RAG Pipeline                          │  │
│  │  - Ingestion API                         │  │
│  │  - Query API                             │  │
│  └─────────────────────────────────────────┘  │
└─────┬────────────────────────────┬──────────────┘
      │                            │
      ↓                            ↓
┌──────────────┐          ┌─────────────────────┐
│   Supabase   │          │   OpenAI/DeepSeek   │
│              │          │                     │
│ PostgreSQL + │          │ - Embeddings        │
│   pgvector   │          │ - LLM Generation    │
└──────────────┘          └─────────────────────┘
```

### Deployment Strategy

**Frontend (Vercel)**:
1. Connect GitHub repo
2. Framework: Next.js (auto-detected)
3. Build command: `pnpm build` (auto)
4. Environment variables: `BACKEND_URL`, `NEXT_PUBLIC_*`
5. Auto-deploy on push to `main`

**Backend (Railway)**:
1. Connect GitHub repo
2. Detect: Node.js
3. Start command: `pnpm start`
4. Add PostgreSQL plugin (or use external Supabase)
5. Environment variables: All API keys, DB URL
6. Auto-deploy on push to `main`

**Database (Supabase)**:
1. Create project: `ticobot-prod`
2. Enable pgvector extension
3. Run SQL migrations
4. Create similarity search function
5. Add HNSW index on embeddings
6. Copy connection string to Railway

---

## Cost Analysis

### MVP Phase (First 1K Users)

**Infrastructure**:
- Vercel: $0 (free tier)
- Railway: $0-5 (free tier, $5 if over)
- Supabase: $0 (free tier)

**AI/ML** (1K users, 3 queries each = 3K queries):
- Embeddings: $0.005
- LLM (DeepSeek): $2
- LLM (OpenAI): $14

**Total MVP**: $2-20 depending on LLM choice

### Scale Phase (10K Users)

**Infrastructure**:
- Vercel: $0-20 (likely free)
- Railway: $5-20 (starter plan)
- Supabase: $0-25 (likely free tier)

**AI/ML** (10K users, 3 queries each = 30K queries):
- Embeddings: $0.05
- LLM (DeepSeek): $20
- LLM (OpenAI GPT-4o): $140

**Total 10K users**: $25-185

**Cost per user**: $0.0025 - $0.02 (very affordable!)

---

## Provider Configuration

### OpenAI Setup

```typescript
// backend/src/config/providers/openai.config.ts
import OpenAI from 'openai';

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
  organization: process.env.OPENAI_ORG_ID, // optional
};

export const openaiClient = new OpenAI(openaiConfig);

// Models
export const OPENAI_MODELS = {
  embedding: 'text-embedding-3-small',
  llmDev: 'gpt-4o-mini',
  llmProd: 'gpt-4o',
} as const;
```

### DeepSeek Setup

```typescript
// backend/src/config/providers/deepseek.config.ts
import OpenAI from 'openai'; // DeepSeek uses OpenAI-compatible API

export const deepseekConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: 'https://api.deepseek.com/v1',
};

export const deepseekClient = new OpenAI(deepseekConfig);

export const DEEPSEEK_MODELS = {
  chat: 'deepseek-chat',
} as const;
```

### Supabase Setup

```typescript
// backend/src/config/database/supabase.config.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
};

export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

// Database schema
export const TABLES = {
  documents: 'documents',
  chunks: 'chunks',
} as const;
```

---

## Technology Validation

### Performance Requirements

| Metric | Target | Stack Capability |
|--------|--------|------------------|
| Query Latency (P95) | < 2s | ✅ OpenAI: ~500ms, DeepSeek: ~1s, Total: ~1.5s |
| Concurrent Users | 100+ | ✅ Express + Railway: 1000+ concurrent |
| Vector Search | < 100ms | ✅ pgvector HNSW: 20-50ms for 10K vectors |
| Embedding Generation | < 500ms | ✅ OpenAI batch: 200-300ms for 5 chunks |
| Frontend Load Time | < 1s | ✅ Next.js + Vercel: 300-500ms |
| Database Query | < 50ms | ✅ PostgreSQL: 10-30ms with indexes |

**All requirements met!** ✅

### Scalability Analysis

**Current Scale (10K users)**:
- ✅ Supabase free tier: 500MB (enough for ~50K chunks)
- ✅ Railway free tier: 500 hours/month (enough for MVP)
- ✅ Vercel free tier: Unlimited bandwidth
- ✅ OpenAI rate limits: 3,500 RPM (plenty)

**Future Scale (100K users)**:
- 🔄 Supabase Pro: $25/month (2GB database)
- 🔄 Railway Hobby: $20/month (more resources)
- 🔄 Vercel Pro: $20/month (faster builds, analytics)
- 🔄 Total: ~$65/month infrastructure + $200-1400 AI costs

---

## Migration Path & Flexibility

### Easy Switches (Thanks to Provider Abstraction!)

**LLM Providers**:
- ✅ OpenAI ↔ DeepSeek: Just change env var
- ✅ Add Claude: Implement ILLMProvider, update factory
- ✅ Add Gemini: Same process

**Vector Stores**:
- ✅ Supabase → Pinecone: Implement IVectorStore
- ✅ Supabase → Qdrant: Same interface

**Embedding Providers**:
- ✅ OpenAI → Cohere: Change env, same interface

**No code changes needed for provider switching!**

---

## Final Technology Stack Summary

### Backend Stack ✅
- **Runtime**: Node.js 20+ TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL + pgvector)
- **Deployment**: Railway
- **API Style**: REST
- **Testing**: Vitest + Supertest

### Frontend Stack ✅
- **Framework**: Next.js 16 App Router
- **Styling**: Tailwind CSS (vanilla)
- **State**: React Context + Server Components
- **Deployment**: Vercel
- **Language**: TypeScript
- **Testing**: Vitest + Testing Library

### AI/ML Stack ✅
- **Embeddings**: OpenAI text-embedding-3-small
- **LLM Dev**: OpenAI GPT-4o-mini
- **LLM Prod**: DeepSeek (primary) + OpenAI GPT-4o (A/B test)
- **Vector Search**: Supabase pgvector (HNSW index)

### DevOps Stack ✅
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Frontend Deploy**: Vercel (auto)
- **Backend Deploy**: Railway (auto)
- **Monitoring**: Vercel Analytics + Railway Logs
- **Error Tracking**: (TBD - Sentry recommended)

---

## Next Steps

1. **Create Supabase Project** ✅
   - Project name: `ticobot-prod`
   - Region: Closest to Costa Rica (us-east-1)
   - Enable pgvector extension

2. **Get API Keys** ✅
   - OpenAI API key (for embeddings + LLM)
   - DeepSeek API key (for production LLM)
   - Supabase connection string

3. **Set Up Repositories** ✅
   - Already done (existing repo)

4. **Configure Environments** ⏳
   - Create .env.development
   - Create .env.production
   - Document all required variables

5. **Deploy Infrastructure** ⏳
   - Connect Vercel to GitHub
   - Connect Railway to GitHub
   - Configure environment variables

---

## Approval & Sign-off

**Decision Made By**: Juan (juanpredev)
**Date**: 2025-11-22
**Phase**: 1.7 - Technology Decisions
**Status**: ✅ APPROVED

**Stack is finalized and ready for implementation!** 🚀

---

**Document Version**: 1.0
**Last Updated**: 2025-11-22
**Next Review**: After Phase 2 implementation
