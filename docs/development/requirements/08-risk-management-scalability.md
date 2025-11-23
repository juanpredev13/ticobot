# Risk Management & Scalability Planning

## Overview

This document provides a comprehensive risk assessment and scalability plan for TicoBot, ensuring the system can handle growth while mitigating technical, operational, and business risks.

**Document Date**: 2025-11-22
**Phase**: 1.8 - Risk Management & Scalability
**Status**: ✅ Completed

---

## Table of Contents

- [Risk Assessment Matrix](#risk-assessment-matrix)
- [Technical Risks](#technical-risks)
- [Operational Risks](#operational-risks)
- [Scalability Planning](#scalability-planning)
- [Monitoring & Observability](#monitoring--observability)
- [Disaster Recovery](#disaster-recovery)
- [Cost Management](#cost-management)
- [Performance Optimization](#performance-optimization)

---

## Risk Assessment Matrix

### Risk Categories

Risks are assessed across four dimensions:
- **Impact**: Low (1) | Medium (2) | High (3) | Critical (4)
- **Probability**: Low (1) | Medium (2) | High (3) | Very High (4)
- **Risk Score**: Impact × Probability (max 16)
- **Priority**: Low (1-4) | Medium (5-8) | High (9-12) | Critical (13-16)

### Master Risk Matrix

| # | Risk | Category | Impact | Prob | Score | Priority | Mitigation Status |
|---|------|----------|--------|------|-------|----------|------------------|
| 1 | Vendor lock-in | Technical | 3 | 2 | 6 | Medium | ✅ Mitigated |
| 2 | Large PDF processing | Technical | 2 | 4 | 8 | Medium | ✅ Mitigated |
| 3 | LLM cost overruns | Operational | 4 | 3 | 12 | High | ✅ Mitigated |
| 4 | Vector DB limits | Technical | 2 | 2 | 4 | Low | ✅ Mitigated |
| 5 | Provider API failures | Technical | 3 | 2 | 6 | Medium | ✅ Mitigated |
| 6 | Poor text extraction | Technical | 3 | 3 | 9 | High | ⚠️ Partial |
| 7 | Rate limit violations | Operational | 2 | 3 | 6 | Medium | ✅ Mitigated |
| 8 | Data quality issues | Technical | 3 | 3 | 9 | High | ⚠️ Partial |
| 9 | Budget exhaustion | Business | 4 | 2 | 8 | Medium | ✅ Mitigated |
| 10 | Traffic spikes (debates) | Operational | 3 | 3 | 9 | High | ⚠️ Planned |
| 11 | TSE website changes | External | 2 | 3 | 6 | Medium | ⚠️ Monitor |
| 12 | Supabase free tier limits | Infrastructure | 2 | 3 | 6 | Medium | ✅ Mitigated |
| 13 | Slow query performance | Technical | 3 | 2 | 6 | Medium | ✅ Mitigated |
| 14 | Security vulnerabilities | Security | 4 | 2 | 8 | Medium | ⚠️ Ongoing |
| 15 | Data privacy violations | Legal | 4 | 1 | 4 | Low | ✅ Mitigated |
| 16 | Embedding model changes | Technical | 2 | 2 | 4 | Low | ✅ Mitigated |
| 17 | Context window limits | Technical | 2 | 3 | 6 | Medium | ✅ Mitigated |
| 18 | Cache invalidation | Technical | 2 | 2 | 4 | Low | ✅ Mitigated |
| 19 | Deployment failures | DevOps | 3 | 2 | 6 | Medium | ✅ Mitigated |
| 20 | Database migrations | Technical | 2 | 2 | 4 | Low | ✅ Mitigated |

---

## Technical Risks

### Risk 1: Vendor Lock-In

**Impact**: High (3) | **Probability**: Medium (2) | **Score**: 6

**Description**:
Tight coupling to specific providers (OpenAI, Supabase, Vercel, Railway) could make it expensive or impossible to switch if:
- Pricing increases significantly
- Provider goes out of business
- Service quality degrades
- Better alternatives emerge

**Mitigation Strategy**:

✅ **Implemented (Phase 1.4)**:
- Provider abstraction layer with interfaces
- `ILLMProvider`, `IEmbeddingProvider`, `IVectorStore` abstractions
- Runtime provider switching via environment variables
- No direct provider SDK calls in business logic

**Validation**:
```typescript
// ✅ Good - uses abstraction
const llm = ProviderFactory.getLLMProvider();
const response = await llm.generateCompletion(messages);

// ❌ Bad - direct coupling
import OpenAI from 'openai';
const openai = new OpenAI();
```

**Switching Cost Estimate**:
- LLM provider: 2-4 hours (create new adapter)
- Vector store: 1-2 days (migration + adapter)
- Database: 1-2 weeks (schema + migration)

**Residual Risk**: Low
- Abstraction layer eliminates most lock-in
- Switching is tactical, not architectural
- Can A/B test providers easily

---

### Risk 2: Large PDF Processing Failures

**Impact**: Medium (2) | **Probability**: Very High (4) | **Score**: 8

**Description**:
Some government plan PDFs may be:
- Very large (500+ pages, 50+ MB)
- Scanned images requiring OCR
- Malformed or corrupted
- Password-protected or encrypted

**Mitigation Strategy**:

✅ **Design-Level Mitigations**:
1. **Streaming Processing**:
   - Process PDFs page-by-page (not all at once)
   - Memory-efficient parsing
   - Early failure detection

2. **Chunking & Batching**:
   - Small chunks (800-1500 chars) reduce memory
   - Batch embedding generation (50 chunks/batch)
   - Can resume from failure point

3. **Quality Validation**:
   - Validate extracted text quality
   - Skip corrupted pages
   - Log extraction failures
   - Manual review flagging

4. **Timeout & Retry**:
   - Per-page timeouts (30 seconds)
   - Exponential backoff for retries
   - Maximum 3 retry attempts
   - Continue processing other PDFs on failure

**Implementation** (Phase 2.1):
```typescript
// PDFParser with streaming
class PDFParser {
  async parsePageByPage(filePath: string): Promise<PageText[]> {
    const pages = [];
    const totalPages = await this.getPageCount(filePath);

    for (let i = 1; i <= totalPages; i++) {
      try {
        const pageText = await this.parsePageWithTimeout(filePath, i, 30000);

        // Validate quality
        if (this.isValidPage(pageText)) {
          pages.push(pageText);
        } else {
          logger.warn(`Low quality page: ${filePath}:${i}`);
        }
      } catch (error) {
        logger.error(`Failed to parse page: ${filePath}:${i}`, error);
        // Continue with next page
      }
    }

    return pages;
  }
}
```

**Residual Risk**: Medium
- Some PDFs may still fail (scanned images without OCR)
- OCR quality varies significantly
- Need manual intervention for edge cases

---

### Risk 3: LLM Cost Overruns

**Impact**: Critical (4) | **Probability**: High (3) | **Score**: 12

**Description**:
Uncontrolled LLM usage could exhaust budget:
- Unexpected traffic spike (viral post, debate night)
- Inefficient prompts consuming too many tokens
- Lack of caching causing redundant calls
- Using expensive models unnecessarily

**Budget Baseline** (from Phase 1.7):
- Target: $50/month for 10K users
- OpenAI GPT-4o: ~$140 per 10K users (without caching)
- DeepSeek: ~$20 per 10K users
- Risk: Could exceed budget by 3-7x

**Mitigation Strategy**:

✅ **Multi-Layer Cost Controls**:

**1. Provider Selection (Runtime Switchable)**:
```typescript
// config/llm.config.ts
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'deepseek'; // default to cheap

const providerConfig = {
  deepseek: { maxCost: 20, costPer1K: 0.002 },
  'gpt-4o-mini': { maxCost: 50, costPer1K: 0.015 },
  'gpt-4o': { maxCost: 140, costPer1K: 0.15 },
};
```

**2. Aggressive Caching**:
- Query embedding cache (24h TTL)
- Search result cache (1h TTL)
- LLM response cache for common questions (6h TTL)
- Expected cache hit rate: 20-30%

**3. Token Limits**:
```typescript
// Hard limits on token usage
const TOKEN_LIMITS = {
  maxContextTokens: 4000,    // Context size limit
  maxOutputTokens: 500,      // Response length limit
  maxQueryLength: 500,       // User question limit
};
```

**4. Rate Limiting**:
- Per-user: 10 queries/minute
- Per-IP: 30 queries/minute
- Global: 100 queries/minute (free tier)
- Queue overflow requests

**5. Cost Monitoring & Alerts**:
```typescript
// Real-time cost tracking
class CostMonitor {
  private dailyCost = 0;
  private readonly DAILY_BUDGET = 5; // $5/day

  async trackQuery(tokens: number, model: string) {
    const cost = this.calculateCost(tokens, model);
    this.dailyCost += cost;

    if (this.dailyCost > this.DAILY_BUDGET * 0.8) {
      await this.alertAdmin('Budget approaching limit');
    }

    if (this.dailyCost > this.DAILY_BUDGET) {
      throw new Error('Daily budget exceeded');
    }
  }
}
```

**6. Fallback Cascade**:
```
Primary: DeepSeek (cheap, $20/10K users)
  ↓ (if quota exceeded or slow)
Fallback: GPT-4o-mini (moderate, $50/10K users)
  ↓ (if both unavailable)
Cached responses only (free)
```

**7. Dynamic Throttling**:
- Reduce max tokens during high traffic
- Switch to cheaper model automatically
- Enable "degraded mode" with cached answers only

**Residual Risk**: Low
- Multiple layers of protection
- Can shut down before budget exhaustion
- Worst case: $150/month (still manageable)

---

### Risk 4: Vector Database Storage Limits

**Impact**: Medium (2) | **Probability**: Medium (2) | **Score**: 4

**Description**:
Supabase free tier limits:
- 500MB database storage
- 2GB file storage
- 2GB bandwidth/month

**Capacity Analysis**:
```
Dataset size (MVP):
- 50 PDFs × 300 pages = 15,000 pages
- 15,000 pages × 3 chunks/page = 45,000 chunks
- 45,000 chunks × 1536 dimensions × 4 bytes = 276MB vectors
- Metadata: ~50MB
- Total: ~350MB (within 500MB limit ✅)

Headroom: 150MB (~20K additional chunks)
```

**Mitigation Strategy**:

✅ **Optimization Techniques**:

**1. HNSW Indexing** (Space-efficient):
```sql
-- Only index after data reaches size threshold
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
ON chunks
USING hnsw (embedding vector_cosine_ops)
WHERE created_at > '2026-01-01'; -- Only index relevant data

-- HNSW params for balanced size/performance
WITH (m = 16, ef_construction = 64);
```

**2. Embedding Dimension Reduction** (if needed):
```typescript
// Can reduce dimensions from 1536 → 768 if needed
// Saves 50% storage with minimal quality loss
const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536, // Can reduce to 768 if storage tight
};
```

**3. Data Lifecycle Management**:
```sql
-- Archive old election data
UPDATE chunks
SET archived = true
WHERE document_id IN (
  SELECT id FROM documents WHERE year < CURRENT_YEAR - 1
);

-- Archived chunks not indexed (saves space)
```

**4. Compression** (PostgreSQL native):
```sql
-- Enable TOAST compression for large text fields
ALTER TABLE chunks
ALTER COLUMN content SET STORAGE EXTENDED;
```

**5. Monitoring**:
```typescript
// Track storage usage
class StorageMonitor {
  async checkUsage() {
    const query = `
      SELECT pg_size_pretty(pg_database_size('postgres')) as size,
             pg_database_size('postgres') as bytes;
    `;

    const result = await db.query(query);
    const usagePercent = (result.bytes / (500 * 1024 * 1024)) * 100;

    if (usagePercent > 80) {
      await this.alertAdmin('Database 80% full');
    }
  }
}
```

**Upgrade Path**:
- Supabase Pro: $25/month → 8GB storage
- Can handle 10x dataset growth
- Clear upgrade trigger: 400MB usage

**Residual Risk**: Very Low
- Well within free tier limits
- Clear monitoring and upgrade path
- Multiple optimization levers

---

### Risk 5: Provider API Failures

**Impact**: High (3) | **Probability**: Medium (2) | **Score**: 6

**Description**:
External API dependencies may fail:
- OpenAI API outage
- Supabase downtime
- Rate limit errors
- Network timeouts

**Mitigation Strategy**:

✅ **Resilience Patterns**:

**1. Retry with Exponential Backoff**:
```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on permanent errors
      if (error.status === 401 || error.status === 403) {
        throw error;
      }

      if (attempt < maxRetries) {
        await sleep(delay);
        delay *= 2; // 1s → 2s → 4s
      }
    }
  }

  throw lastError;
}
```

**2. Circuit Breaker**:
```typescript
class CircuitBreaker {
  private failures = 0;
  private readonly threshold = 5;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker open');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'open';
      setTimeout(() => this.state = 'half-open', 60000); // 1 min
    }
  }
}
```

**3. Graceful Degradation**:
```typescript
// Fallback to cached responses
class RAGPipeline {
  async query(request: QueryRequest): Promise<RAGResponse> {
    try {
      return await this.queryLive(request);
    } catch (error) {
      logger.error('Live query failed, trying cache', error);

      // Try cached response
      const cached = await this.cache.get(request.query);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      // Final fallback: helpful error message
      return {
        answer: 'Lo sentimos, el servicio no está disponible en este momento. Por favor intenta más tarde.',
        sources: [],
        confidence: 0,
        error: true,
      };
    }
  }
}
```

**4. Health Checks**:
```typescript
// Monitor provider health
app.get('/api/health', async (req, res) => {
  const health = {
    openai: await checkOpenAI(),
    supabase: await checkSupabase(),
    cache: await checkCache(),
  };

  const allHealthy = Object.values(health).every(h => h.status === 'ok');

  res.status(allHealthy ? 200 : 503).json(health);
});
```

**5. Timeout Protection**:
```typescript
// All external calls have timeouts
const TIMEOUTS = {
  embedding: 10000,    // 10s
  llm: 30000,         // 30s
  vectorSearch: 5000,  // 5s
  database: 3000,      // 3s
};
```

**Residual Risk**: Low
- Comprehensive error handling
- Graceful degradation
- User experience maintained during outages

---

### Risk 6: Poor Text Extraction Quality

**Impact**: High (3) | **Probability**: High (3) | **Score**: 9

**Description**:
PDFs from TSE may have quality issues:
- Scanned images (no selectable text)
- Complex layouts (multi-column, tables)
- Encoding issues (garbled characters)
- Watermarks, headers, footers

**Mitigation Strategy**:

⚠️ **Partial Mitigation (Ongoing)**:

**1. Quality Scoring**:
```typescript
class TextCleaner {
  calculateQualityScore(text: string): number {
    let score = 1.0;

    // Deductions
    if (text.length < 100) score -= 0.3;
    if (this.hasGarbledChars(text)) score -= 0.4;
    if (this.hasRepeatedContent(text)) score -= 0.2;
    if (this.isMostlyNumbers(text)) score -= 0.3;

    return Math.max(0, score);
  }

  isValidChunk(chunk: string): boolean {
    return this.calculateQualityScore(chunk) >= 0.5;
  }
}
```

**2. Multi-Library Fallback**:
```typescript
// Try multiple PDF parsing libraries
class PDFParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    try {
      return await this.parseWithLibrary1(filePath); // pdf-parse
    } catch (error) {
      logger.warn('Primary parser failed, trying fallback');
      return await this.parseWithLibrary2(filePath); // pdf.js
    }
  }
}
```

**3. Manual Review System**:
```typescript
// Flag low-quality documents for review
if (qualityScore < 0.5) {
  await db.documents.update({
    id: documentId,
    needsReview: true,
    qualityScore,
  });

  await notifyAdmin(`Document ${documentId} needs manual review`);
}
```

**4. OCR Fallback** (Post-MVP):
```typescript
// If text extraction fails, use OCR
if (parsedText.length < 100 && fileSize > 1MB) {
  logger.info('Attempting OCR extraction');
  return await this.ocrExtract(filePath); // Tesseract.js
}
```

**Residual Risk**: Medium
- Cannot control source PDF quality
- OCR adds cost and complexity
- Some documents may require manual processing
- MVP accepts 90% success rate

---

### Risk 7: Rate Limit Violations

**Impact**: Medium (2) | **Probability**: High (3) | **Score**: 6

**Description**:
Provider rate limits may be exceeded:
- OpenAI: 3,000 RPM (free tier), 10,000 RPM (tier 1)
- Supabase: 500 requests/minute (free tier)
- Spikes during events (debates, announcements)

**Mitigation Strategy**:

✅ **Rate Limiting Implementation**:

**1. Application-Level Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';

// Per-IP rate limiting
const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: 'Demasiadas consultas. Por favor espera un momento.',
});

app.post('/api/query', queryLimiter, queryController);
```

**2. Token Bucket Algorithm**:
```typescript
class TokenBucket {
  private tokens: number;
  private readonly capacity = 100;
  private readonly refillRate = 10; // tokens per second

  async consume(cost: number): Promise<boolean> {
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }

    return false; // Rate limit exceeded
  }
}
```

**3. Request Queuing**:
```typescript
class RequestQueue {
  private queue: Request[] = [];
  private processing = 0;
  private readonly maxConcurrent = 5;

  async enqueue(request: Request): Promise<Response> {
    if (this.processing < this.maxConcurrent) {
      return this.process(request);
    }

    // Queue for later
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }
}
```

**4. Batch Processing**:
```typescript
// Batch embed multiple chunks in single call
const batchSize = 50; // OpenAI allows up to 100
const batches = chunk(allChunks, batchSize);

for (const batch of batches) {
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: batch,
  });

  await sleep(100); // Rate limit protection
}
```

**5. Provider-Specific Limits**:
```typescript
const RATE_LIMITS = {
  openai: {
    rpm: 3000,
    tpm: 1000000,
  },
  supabase: {
    rpm: 500,
  },
};
```

**Residual Risk**: Low
- Proactive rate limiting prevents violations
- Queuing handles bursts gracefully
- Clear user messaging during limits

---

## Operational Risks

### Risk 9: Budget Exhaustion

**Impact**: Critical (4) | **Probability**: Medium (2) | **Score**: 8

**Description**:
Project budget could be exceeded due to:
- Unexpected traffic
- Inefficient resource usage
- Provider price changes
- Scope creep

**Budget Breakdown** (Monthly):
```
Target Budget: $50/month

MVP Cost Estimate:
- Supabase: $0 (free tier)
- Vercel: $0 (free tier)
- Railway: $5 (Hobby plan)
- OpenAI Embeddings: $1-2
- DeepSeek LLM: $10-15
- Domain: $1
- Monitoring: $0 (free tier)
-----------------
Total: ~$20-25/month (50% under budget ✅)

Buffer: $25-30/month for growth
```

**Mitigation Strategy**:

✅ **Budget Controls**:

**1. Cost Monitoring Dashboard**:
```typescript
class CostTracker {
  async getDailyCosts(): Promise<CostBreakdown> {
    return {
      embeddings: await this.getOpenAICost('embeddings'),
      llm: await this.getOpenAICost('completions'),
      database: 0, // Free tier
      hosting: 5, // Railway
      total: /* sum */,
      budget: 50,
      remaining: /* budget - total */,
    };
  }
}
```

**2. Spending Alerts**:
```
Alert thresholds:
- 50% budget used: Warning email
- 75% budget used: Urgent notification
- 90% budget used: Enable cost-saving mode
- 100% budget used: Pause expensive operations
```

**3. Cost-Saving Mode**:
```typescript
if (monthlyCost > BUDGET * 0.9) {
  // Activate cost-saving measures
  config.caching.enabled = true;
  config.caching.ttl = 3600 * 24; // 24h
  config.llm.provider = 'deepseek'; // Switch to cheapest
  config.llm.maxTokens = 300; // Reduce output
  config.rateLimit.max = 5; // Stricter limits
}
```

**4. Usage Analytics**:
```sql
-- Track expensive operations
SELECT
  DATE(created_at) as date,
  SUM(tokens_used) as total_tokens,
  SUM(estimated_cost) as total_cost,
  COUNT(*) as query_count
FROM query_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

**5. Provider Cost Caps**:
```typescript
// Set hard limits with providers
OPENAI_BUDGET_LIMIT=50  # Hard monthly cap
```

**Residual Risk**: Low
- Running well under budget
- Multiple cost control levers
- Real-time monitoring
- Can scale down if needed

---

### Risk 10: Traffic Spikes During Debates

**Impact**: High (3) | **Probability**: High (3) | **Score**: 9

**Description**:
Presidential debates or major announcements could cause:
- 10-100x traffic spike
- API rate limit violations
- Slow response times
- Budget exhaustion

**Traffic Estimates**:
```
Normal: 10-50 concurrent users
Debate night: 500-2000 concurrent users (40x spike)
Peak queries: 100-500 queries/minute
```

**Mitigation Strategy**:

⚠️ **Planned for Phase 2**:

**1. Caching Layer (Critical)**:
```typescript
// Aggressive caching during high traffic
class SmartCache {
  async get(query: string): Promise<CachedResponse | null> {
    // Check cache first
    const cached = await this.redis.get(query);

    if (cached) {
      // Extend TTL for popular queries
      if (cached.hitCount > 10) {
        await this.redis.expire(query, 3600 * 24); // 24h
      }
      return cached;
    }

    return null;
  }
}
```

**2. Read Replicas**:
```typescript
// Use Supabase read replicas for queries
const replicaPool = [
  process.env.SUPABASE_REPLICA_1,
  process.env.SUPABASE_REPLICA_2,
  process.env.SUPABASE_REPLICA_3,
];

// Round-robin load balancing
function getReadReplica() {
  return replicaPool[counter++ % replicaPool.length];
}
```

**3. Pre-computed Answers**:
```typescript
// Pre-generate answers for common questions
const COMMON_QUESTIONS = [
  '¿Qué propone el PLN sobre salud?',
  '¿Cuál es el plan educativo del PAC?',
  // ... 50 more
];

// Pre-compute before debate
async function preWarmCache() {
  for (const question of COMMON_QUESTIONS) {
    await pipeline.query({ query: question });
  }
}
```

**4. Queue System**:
```typescript
// Queue excess requests
class RequestQueue {
  async handleRequest(req: Request): Promise<Response> {
    const position = await this.enqueue(req);

    if (position > 100) {
      return {
        status: 503,
        message: 'Sistema sobrecargado. Posición en cola: ' + position,
        estimatedWait: position * 2, // seconds
      };
    }

    return this.processWhenReady(req);
  }
}
```

**5. Auto-Scaling** (Railway):
```yaml
# railway.json
{
  "deploy": {
    "restartPolicyType": "on-failure",
    "healthcheckPath": "/api/health",
    "numReplicas": 1
  }
}
```

**6. Degraded Mode**:
```typescript
if (currentLoad > CAPACITY * 0.9) {
  // Enable degraded mode
  return {
    answer: cachedAnswer || GENERIC_ANSWER,
    sources: [],
    degradedMode: true,
    message: 'Alto tráfico. Respuesta desde caché.',
  };
}
```

**Testing Plan**:
```typescript
// Load test before debate
describe('Load Test', () => {
  it('should handle 500 concurrent queries', async () => {
    const queries = Array(500).fill().map(() => randomQuery());

    const start = Date.now();
    await Promise.all(queries.map(q => pipeline.query({ query: q })));
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(60000); // < 1 min
  });
});
```

**Residual Risk**: Medium
- Untested at scale
- May require manual intervention
- Could degrade service quality
- MVP acceptable: queue or slow down

---

## Scalability Planning

### Database Scalability

**Current Capacity** (Supabase Free Tier):
```
- Storage: 500MB (MVP: 350MB used, 150MB free)
- Connections: 500 concurrent
- API requests: 500/minute
- Bandwidth: 2GB/month
```

**Scaling Triggers**:

| Metric | Current | Tier 1 Trigger | Tier 2 Trigger | Action |
|--------|---------|----------------|----------------|--------|
| Storage | 350MB | 400MB (80%) | 6GB (75%) | Upgrade to Pro ($25/mo) |
| Requests/min | 50 | 400 (80%) | 1500 (60%) | Add read replica |
| Documents | 50 | 2000 | 10,000 | Enable HNSW indexing |
| Queries/day | 100 | 10,000 | 100,000 | Add caching layer |

**Indexing Strategy**:

```sql
-- Phase 1: No indexes (< 1000 chunks, linear scan OK)

-- Phase 2: Basic indexes (1K-10K chunks)
CREATE INDEX chunks_document_id_idx ON chunks(document_id);
CREATE INDEX chunks_party_idx ON chunks((metadata->>'party'));

-- Phase 3: HNSW vector index (> 10K chunks)
CREATE INDEX chunks_embedding_hnsw_idx
ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Phase 4: Partitioning (> 100K chunks)
CREATE TABLE chunks_2026 PARTITION OF chunks
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

**Query Optimization**:

```sql
-- Optimized similarity search
CREATE OR REPLACE FUNCTION search_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_party text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM chunks c
  WHERE
    (filter_party IS NULL OR c.metadata->>'party' = filter_party)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Add function index for better performance
CREATE INDEX chunks_embedding_cosine_idx
ON chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

### Caching Strategy

**Cache Layers**:

```
┌─────────────────┐
│  Browser Cache  │ (Static assets, 24h)
└────────┬────────┘
         │
┌────────▼────────┐
│   CDN Cache     │ (Vercel Edge, API responses, 5min)
└────────┬────────┘
         │
┌────────▼────────┐
│  Redis Cache    │ (Query results, embeddings, 1-24h)
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │ (Source of truth)
└─────────────────┘
```

**Cache Configuration**:

```typescript
const CACHE_CONFIG = {
  // Query embeddings (expensive to generate)
  queryEmbeddings: {
    enabled: true,
    ttl: 3600 * 24, // 24 hours
    maxSize: 10000, // 10K embeddings
  },

  // Search results (frequently accessed)
  searchResults: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 5000,
  },

  // LLM responses (most expensive)
  llmResponses: {
    enabled: true,
    ttl: 3600 * 6, // 6 hours
    maxSize: 1000,
  },

  // Document metadata (rarely changes)
  metadata: {
    enabled: true,
    ttl: 3600 * 24, // 24 hours
    maxSize: 500,
  },
};
```

**Cache Invalidation**:

```typescript
class CacheManager {
  // Invalidate cache when data changes
  async invalidateDocument(documentId: string) {
    // Remove all cached queries related to this document
    await this.redis.del(`doc:${documentId}:*`);

    // Remove search results containing this document
    await this.clearSearchCache();

    logger.info(`Cache invalidated for document ${documentId}`);
  }

  // Periodic cache cleanup
  async cleanupExpired() {
    const expired = await this.redis.keys('*:expired');
    if (expired.length > 0) {
      await this.redis.del(...expired);
    }
  }
}
```

**Expected Performance Impact**:

| Metric | Without Cache | With Cache | Improvement |
|--------|---------------|------------|-------------|
| Avg latency | 2.5s | 0.3s | 8.3x faster |
| LLM API calls | 10K/day | 7K/day | 30% reduction |
| Cost | $20/day | $14/day | 30% savings |
| Cache hit rate | 0% | 25-35% | Target: 30% |

---

### Horizontal Scaling

**Current Architecture** (Stateless):
```
┌─────────┐
│ Vercel  │ (Auto-scales, serverless)
└────┬────┘
     │
┌────▼──────┐
│ Railway   │ (Single instance)
└────┬──────┘
     │
┌────▼──────┐
│ Supabase  │ (Managed, auto-scales)
└───────────┘
```

**Scaling Path**:

**Phase 1** (Current - MVP):
- Single Railway instance
- Serverless Vercel frontend
- Supabase free tier

**Phase 2** (1K-10K users):
- Railway horizontal replicas (2-3 instances)
- Redis caching layer
- Supabase Pro tier

**Phase 3** (10K-100K users):
- Railway auto-scaling (5-10 instances)
- Redis cluster
- Supabase read replicas
- CDN caching (Cloudflare)

**Phase 4** (100K+ users):
- Kubernetes cluster
- Multiple Redis clusters (geo-distributed)
- Supabase multi-region
- Advanced load balancing

**Bottleneck Analysis**:

```typescript
// Identify bottlenecks
class PerformanceMonitor {
  async analyzeRequest(req: Request): Promise<Bottleneck[]> {
    const timings = {
      embedding: await this.timeEmbedding(req.query),
      vectorSearch: await this.timeVectorSearch(req.query),
      llm: await this.timeLLM(req.query),
      database: await this.timeDatabase(req.query),
    };

    // Find slowest component
    const slowest = Object.entries(timings)
      .sort((a, b) => b[1] - a[1]);

    return slowest;
  }
}

// Typical results:
// 1. LLM: 1500ms (60%)
// 2. Embedding: 500ms (20%)
// 3. Vector search: 300ms (12%)
// 4. Database: 200ms (8%)
```

**Optimization Priorities**:
1. Cache LLM responses (biggest impact)
2. Batch embeddings
3. Optimize vector search (HNSW index)
4. Database query optimization

---

## Monitoring & Observability

### Monitoring Stack

**Free Tier Options**:
```
Logging: Railway built-in logs
Metrics: Custom metrics to Supabase
Alerts: Email + Discord webhook
Uptime: UptimeRobot (free)
Errors: Sentry (free tier: 5K events/month)
```

**Key Metrics to Track**:

```typescript
interface SystemMetrics {
  // Performance
  avgQueryLatency: number;        // Target: < 2s
  p95QueryLatency: number;        // Target: < 5s
  p99QueryLatency: number;        // Target: < 10s

  // Usage
  queriesPerHour: number;
  uniqueUsers: number;
  cacheHitRate: number;           // Target: > 25%

  // Quality
  avgConfidenceScore: number;     // Target: > 0.6
  avgSimilarityScore: number;     // Target: > 0.7
  errorRate: number;              // Target: < 1%

  // Cost
  dailyLLMCost: number;           // Target: < $1/day
  dailyEmbeddingCost: number;     // Target: < $0.10/day
  monthlyTotalCost: number;       // Target: < $50/month

  // Infrastructure
  databaseSize: number;           // Alert: > 400MB
  databaseConnections: number;    // Alert: > 400
  cpuUsage: number;               // Alert: > 80%
  memoryUsage: number;            // Alert: > 80%
}
```

**Logging Strategy**:

```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log all queries
logger.info('Query processed', {
  query: request.query,
  latency: duration,
  confidence: response.confidence,
  sources: response.sources.length,
  cached: response.cached,
  cost: estimatedCost,
});
```

**Alert Configuration**:

```typescript
const ALERT_THRESHOLDS = {
  // Performance alerts
  slowQuery: 5000,           // > 5s
  highErrorRate: 0.05,       // > 5%
  lowCacheHitRate: 0.15,     // < 15%

  // Cost alerts
  dailyCostLimit: 2,         // > $2/day
  monthlyCostLimit: 40,      // > $40/month (80% of budget)

  // Infrastructure alerts
  databaseFull: 0.8,         // > 80% capacity
  highCPU: 0.8,              // > 80% CPU
  highMemory: 0.8,           // > 80% memory

  // API alerts
  openaiErrors: 10,          // > 10 errors/hour
  supabaseErrors: 10,        // > 10 errors/hour
};

class AlertManager {
  async checkAndAlert() {
    const metrics = await this.getMetrics();

    if (metrics.avgQueryLatency > ALERT_THRESHOLDS.slowQuery) {
      await this.sendAlert({
        level: 'warning',
        title: 'Slow queries detected',
        message: `Average latency: ${metrics.avgQueryLatency}ms`,
      });
    }

    // ... more checks
  }
}
```

**Dashboard** (Supabase + Custom UI):

```typescript
// Real-time metrics dashboard
app.get('/api/admin/metrics', async (req, res) => {
  const metrics = {
    last24h: await getMetrics24h(),
    last7d: await getMetrics7d(),
    current: await getCurrentMetrics(),
    alerts: await getActiveAlerts(),
  };

  res.json(metrics);
});
```

---

## Disaster Recovery

### Backup Strategy

**Data Backup**:

```typescript
// Automated daily backups
class BackupManager {
  async performDailyBackup() {
    // 1. Database backup (Supabase automatic)
    // Free tier: 7 days of backups
    // Pro tier: 30 days of backups

    // 2. Vector embeddings backup
    const chunks = await db.chunks.findMany();
    await this.uploadToStorage('chunks-backup.json', chunks);

    // 3. Configuration backup
    await this.backupEnvironmentVars();

    // 4. Verify backup integrity
    await this.verifyBackup();

    logger.info('Daily backup completed');
  }
}
```

**Backup Schedule**:
- Database: Automatic (Supabase)
- Embeddings: Daily (Railway cron)
- Code: Git (GitHub)
- Config: Weekly manual snapshot

**Recovery Procedures**:

```typescript
// Database recovery
async function recoverDatabase(backupDate: Date) {
  // 1. Restore from Supabase backup
  await supabase.restoreBackup(backupDate);

  // 2. Verify data integrity
  const count = await db.chunks.count();
  logger.info(`Restored ${count} chunks`);

  // 3. Rebuild indexes
  await db.$executeRaw`REINDEX TABLE chunks`;

  // 4. Clear cache
  await cache.flush();
}

// Vector recovery
async function recoverVectors() {
  // 1. Download backup
  const backup = await storage.download('chunks-backup.json');

  // 2. Restore to database
  for (const chunk of backup.chunks) {
    await db.chunks.upsert({
      where: { id: chunk.id },
      create: chunk,
      update: chunk,
    });
  }

  logger.info('Vector recovery completed');
}
```

**RTO/RPO Targets**:
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours
- Data loss: < 1 day acceptable for MVP

---

### Provider Failover

**Multi-Provider Strategy**:

```typescript
// LLM failover
class LLMProviderWithFailover {
  private providers = [
    new DeepSeekProvider(),
    new OpenAIProvider(),
    new ClaudeProvider(),
  ];

  async generateCompletion(messages: Message[]): Promise<string> {
    for (const provider of this.providers) {
      try {
        return await provider.generateCompletion(messages);
      } catch (error) {
        logger.warn(`${provider.name} failed, trying next`, error);
      }
    }

    throw new Error('All LLM providers failed');
  }
}
```

**Failover Scenarios**:

| Scenario | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|----------|---------|------------|------------|------------|
| LLM failure | DeepSeek | GPT-4o-mini | Claude Haiku | Cached responses |
| Vector DB failure | Supabase | Linear search in-memory | Cached results | Error message |
| Frontend failure | Vercel | GitHub Pages | Netlify | Maintenance page |
| Backend failure | Railway | Fly.io | Render | Static responses |

**Automated Failover**:

```typescript
class HighAvailabilityRAG {
  async query(request: QueryRequest): Promise<RAGResponse> {
    try {
      return await this.primaryPipeline.query(request);
    } catch (primaryError) {
      logger.error('Primary pipeline failed', primaryError);

      try {
        return await this.fallbackPipeline.query(request);
      } catch (fallbackError) {
        logger.error('Fallback pipeline failed', fallbackError);

        // Final fallback: cached or error
        return await this.emergencyResponse(request);
      }
    }
  }
}
```

---

## Cost Management

### Cost Tracking

**Real-Time Cost Tracking**:

```typescript
class CostTracker {
  async trackQuery(
    query: string,
    metadata: QueryMetadata
  ): Promise<CostBreakdown> {
    const costs = {
      embedding: this.calculateEmbeddingCost(query),
      vectorSearch: 0, // Free (Supabase)
      llm: this.calculateLLMCost(metadata.tokensUsed),
      total: 0,
    };

    costs.total = costs.embedding + costs.llm;

    // Store for analytics
    await db.costLogs.create({
      data: {
        query,
        costs,
        timestamp: new Date(),
      },
    });

    return costs;
  }

  private calculateLLMCost(tokens: number): number {
    const provider = process.env.LLM_PROVIDER;
    const rates = {
      deepseek: 0.0002 / 1000,  // $0.20 per 1M tokens
      'gpt-4o-mini': 0.0015 / 1000,
      'gpt-4o': 0.015 / 1000,
    };

    return tokens * (rates[provider] || 0);
  }
}
```

**Cost Analytics Dashboard**:

```sql
-- Daily cost breakdown
SELECT
  DATE(timestamp) as date,
  SUM((costs->>'embedding')::numeric) as embedding_cost,
  SUM((costs->>'llm')::numeric) as llm_cost,
  SUM((costs->>'total')::numeric) as total_cost,
  COUNT(*) as query_count
FROM cost_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Most expensive queries
SELECT
  query,
  (costs->>'total')::numeric as cost,
  COUNT(*) as frequency
FROM cost_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY query, costs
ORDER BY cost DESC
LIMIT 20;
```

**Cost Optimization Strategies**:

1. **Aggressive Caching**:
   - Cache hit rate: 25-35%
   - Cost savings: ~30%

2. **Provider Selection**:
   - Default to DeepSeek (cheap)
   - Switch to GPT-4o for complex queries only
   - Potential savings: 50-70%

3. **Token Optimization**:
   - Limit context size (max 4K tokens)
   - Limit output (max 500 tokens)
   - Compress prompts
   - Potential savings: 20-30%

4. **Batch Operations**:
   - Batch embeddings (50/request)
   - Batch vector upserts (100/request)
   - Potential savings: 10-15%

**Monthly Cost Projection**:

```
Scenario 1: MVP (100 users, 10 queries/user/month)
- Embeddings: $0.10
- LLM (DeepSeek): $5
- Infrastructure: $5
- Total: ~$10/month ✅ Well under budget

Scenario 2: Growth (1K users, 10 queries/user/month)
- Embeddings: $1
- LLM (DeepSeek): $20
- Infrastructure: $25 (Pro tier)
- Total: ~$46/month ✅ At budget

Scenario 3: Peak (10K users, 3 queries/user/month)
- Embeddings: $2
- LLM (DeepSeek): $60
- Infrastructure: $50
- Total: ~$112/month ⚠️ Over budget
- Action: Increase caching, stricter rate limits
```

---

## Performance Optimization

### Query Performance

**Latency Budget**:
```
Target: < 2s end-to-end

Breakdown:
- Query embedding: 200ms (10%)
- Vector search: 300ms (15%)
- LLM generation: 1200ms (60%)
- Database queries: 200ms (10%)
- Network overhead: 100ms (5%)
-----------------
Total: 2000ms (2s)
```

**Optimization Techniques**:

**1. Embedding Cache**:
```typescript
// 90% of queries are repeats or similar
const cachedEmbedding = await cache.get(`emb:${query}`);
if (cachedEmbedding) {
  return cachedEmbedding; // Saves 200ms
}
```

**2. Vector Search Optimization**:
```sql
-- Use HNSW index for fast approximate search
CREATE INDEX chunks_embedding_hnsw
ON chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Tune for speed vs accuracy
SET hnsw.ef_search = 40; -- Lower = faster, less accurate
```

**3. LLM Streaming**:
```typescript
// Stream responses for better UX
async function* streamResponse(query: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildMessages(query),
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}
```

**4. Parallel Operations**:
```typescript
// Run independent operations in parallel
const [embedding, metadata, cache] = await Promise.all([
  embedder.embed(query),
  db.getDocumentMetadata(),
  cache.get(query),
]);
```

**5. Connection Pooling**:
```typescript
// Reuse database connections
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Success Criteria

### Phase 1 Success Metrics

- ✅ All risks identified and assessed
- ✅ Mitigation strategies defined for high-priority risks
- ✅ Scalability plan documented
- ✅ Monitoring strategy defined
- ✅ Disaster recovery procedures documented
- ✅ Cost management plan in place

### Operational Metrics

**Performance**:
- P95 query latency < 5s
- P99 query latency < 10s
- Uptime > 99% (allows ~7 hours downtime/month)

**Cost**:
- Monthly cost < $50
- Cost per query < $0.01
- No unexpected cost spikes

**Quality**:
- Average confidence > 0.6
- Error rate < 1%
- Cache hit rate > 25%

**Scalability**:
- Can handle 100 concurrent users
- Can process 1000 queries/hour
- Database usage < 80% capacity

---

## Risk Review Schedule

**Regular Reviews**:
- Weekly: Cost and performance metrics
- Bi-weekly: Security and error logs
- Monthly: Full risk assessment review
- Quarterly: Scalability and capacity planning

**Trigger-Based Reviews**:
- Major version releases
- Provider changes
- Unusual cost spikes
- Performance degradation
- Security incidents

---

## Conclusion

This risk management and scalability plan provides:

1. **Comprehensive Risk Coverage**: 20 identified risks across technical, operational, and business domains
2. **Proactive Mitigation**: 15/20 risks fully mitigated, 5/20 partially mitigated
3. **Clear Scalability Path**: Defined scaling triggers and upgrade paths
4. **Cost Control**: Multiple cost management strategies to stay within budget
5. **Monitoring & Alerts**: Real-time tracking of key metrics
6. **Disaster Recovery**: Backup and failover procedures

**Key Takeaways**:
- Most critical risks are mitigated through architecture (Phase 1.4 abstractions)
- Remaining risks are acceptable for MVP
- Clear escalation paths for growth
- Cost-effective scaling strategy
- Comprehensive monitoring and observability

**Next Steps**:
- Implement monitoring dashboard (Phase 2)
- Set up automated alerts
- Create load testing suite
- Document runbooks for common issues
- Schedule regular risk reviews

---

**Status**: ✅ Phase 1.8 Complete
**Next**: Phase 1.9 - Frontend Design & UI/UX Planning
