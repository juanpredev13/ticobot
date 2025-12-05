# Phase 2.3 - RESTful API Implementation Guide

**Date:** December 5, 2025
**Author:** Claude Code
**Status:** ✅ Completed
**GitHub Issue:** [#27](https://github.com/juanpredev13/ticobot/issues/27)
**Pull Request:** [#28](https://github.com/juanpredev13/ticobot/pull/28)

## Overview

This guide documents the complete implementation of a RESTful API for TicoBot, exposing the core RAG functionalities through HTTP endpoints with comprehensive Swagger documentation.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Endpoints](#api-endpoints)
3. [Implementation Steps](#implementation-steps)
4. [Swagger Documentation Setup](#swagger-documentation-setup)
5. [Testing](#testing)
6. [Code Examples](#code-examples)
7. [Best Practices](#best-practices)

---

## Architecture Overview

### Technology Stack

- **Framework:** Express.js (v5.2.1)
- **Language:** TypeScript (strict mode)
- **Validation:** Zod schemas
- **Documentation:** Swagger UI Express + Swagger JSDoc
- **Middleware:** CORS, JSON parsing, request logging
- **Error Handling:** Centralized error middleware

### Architecture Pattern

Following **Clean Architecture** with **Ports & Adapters**:

```
┌─────────────────────────────────────────┐
│     Presentation Layer (HTTP)           │
│  - Express Routes                       │
│  - Input Validation (Zod)              │
│  - Error Handling                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Application Layer (Use Cases)       │
│  - RAGPipeline                          │
│  - SemanticSearcher                     │
│  - QueryEmbedder                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Domain Layer (Entities)             │
│  - Document                             │
│  - Chunk                                │
│  - SearchResult                         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Infrastructure Layer (Adapters)     │
│  - SupabaseVectorProvider               │
│  - OpenAIProvider                       │
│  - PgDatabaseProvider                   │
└─────────────────────────────────────────┘
```

### Directory Structure

```
backend/src/api/
├── server.ts              # Main Express app configuration
├── swagger.ts             # Swagger/OpenAPI configuration
└── routes/
    ├── chat.ts           # Chat endpoints
    ├── search.ts         # Search endpoints
    ├── documents.ts      # Documents endpoints
    └── ingest.ts         # Ingestion endpoints (existing)
```

---

## API Endpoints

### Chat Endpoints (`/api/chat`)

#### POST /api/chat
Ask questions about government plans with RAG context.

**Request:**
```json
{
  "question": "¿Qué proponen los partidos sobre educación superior?",
  "party": "pln",           // optional
  "topK": 5,                // optional, default: 5
  "temperature": 0.7,       // optional, default: 0.7
  "maxTokens": 800,         // optional, default: 800
  "minRelevanceScore": 0.35 // optional, default: 0.35
}
```

**Response:**
```json
{
  "answer": "Los partidos proponen...",
  "sources": [
    {
      "id": "chunk_123",
      "content": "...",
      "party": "PLN",
      "document": "pln-2026",
      "page": "15",
      "relevanceScore": 0.89
    }
  ],
  "metadata": {
    "model": "gpt-4",
    "tokensUsed": 450,
    "sourcesCount": 5,
    "processingTime": 1234
  }
}
```

#### POST /api/chat/stream
Stream chat responses using Server-Sent Events.

**Response (SSE Stream):**
```
data: {"type":"start","message":"Processing query..."}

data: {"type":"sources","sources":[...]}

data: {"type":"chunk","content":"Los partidos "}

data: {"type":"chunk","content":"proponen mejorar "}

data: {"type":"done","metadata":{...}}
```

---

### Search Endpoints (`/api/search`)

#### POST /api/search
Perform semantic search with JSON body.

**Request:**
```json
{
  "query": "propuestas sobre salud pública",
  "party": "pln",      // optional
  "limit": 5,          // optional, default: 5, max: 20
  "minScore": 0.35     // optional, default: 0.35
}
```

**Response:**
```json
{
  "query": "propuestas sobre salud pública",
  "results": [
    {
      "id": "chunk_456",
      "content": "...",
      "score": 0.92,
      "metadata": {
        "documentId": "pln-2026",
        "partyName": "PLN",
        "pageNumber": 23
      }
    }
  ],
  "count": 5,
  "stats": {
    "avgScore": 0.85,
    "maxScore": 0.92,
    "minScore": 0.78
  }
}
```

#### GET /api/search
Perform semantic search with query parameters.

**Request:**
```
GET /api/search?q=educación&limit=3&party=pln&minScore=0.4
```

---

### Documents Endpoints (`/api/documents`)

#### GET /api/documents
List all documents with pagination and filtering.

**Request:**
```
GET /api/documents?party=pln&limit=20&offset=0
```

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid-here",
      "document_id": "pln-2026",
      "title": "Plan de Gobierno PLN 2026",
      "party_id": "PLN",
      "party_name": "PLN",
      "url": "https://tse.go.cr/...",
      "page_count": 58,
      "created_at": "2025-12-04T21:25:41Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET /api/documents/:id
Get a specific document by UUID.

**Response:**
```json
{
  "document": {
    "id": "uuid-here",
    "document_id": "pln-2026",
    "title": "Plan de Gobierno PLN 2026",
    ...
  }
}
```

#### GET /api/documents/:id/chunks
Get all chunks for a document.

**Request:**
```
GET /api/documents/uuid-here/chunks?limit=50&offset=0
```

**Response:**
```json
{
  "chunks": [
    {
      "id": "chunk_789",
      "content": "...",
      "chunk_index": 0,
      "metadata": {...}
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm --filter backend add swagger-ui-express swagger-jsdoc
pnpm --filter backend add -D @types/swagger-ui-express @types/swagger-jsdoc
```

### Step 2: Create Swagger Configuration

Create `backend/src/api/swagger.ts`:

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TicoBot API',
      version,
      description: 'RESTful API for TicoBot',
      // ... more config
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        // Define all schemas here
        ChatRequest: { /* ... */ },
        SearchResult: { /* ... */ },
        Document: { /* ... */ },
        Error: { /* ... */ },
      },
    },
  },
  apis: ['./src/api/routes/*.ts'], // Path to route files
};

export const swaggerSpec = swaggerJsdoc(options);
```

### Step 3: Integrate Swagger in Server

Update `backend/src/api/server.ts`:

```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TicoBot API Documentation'
  }));

  // Swagger JSON spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API Routes
  app.use('/api/chat', chatRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/documents', documentsRoutes);

  return app;
}
```

### Step 4: Create Route Files with Validation

Example: `backend/src/api/routes/search.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ticobot/shared';
import { SemanticSearcher } from '../../rag/components/SemanticSearcher.js';
import { QueryEmbedder } from '../../rag/components/QueryEmbedder.js';

const router = Router();
const logger = new Logger('SearchAPI');

// Initialize components
const embedder = new QueryEmbedder();
const searcher = new SemanticSearcher();

// Validation schema
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  party: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).default(5),
  minScore: z.coerce.number().min(0).max(1).default(0.35)
});

/**
 * @swagger
 * /api/search:
 *   post:
 *     summary: Perform semantic search
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: propuestas sobre salud
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const params = searchSchema.parse(req.body);

    // Generate embedding
    const embedding = await embedder.embed(params.query);

    // Search
    const results = await searcher.search(embedding, {
      topK: params.limit,
      minRelevanceScore: params.minScore,
      filters: params.party ? { partyId: params.party } : undefined
    });

    // Return results
    res.json({
      query: params.query,
      results: results.map(r => ({
        id: r.id,
        content: r.content,
        score: r.score,
        metadata: r.metadata
      })),
      count: results.length
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    next(error);
  }
});

export default router;
```

### Step 5: Add JSDoc Annotations

Add comprehensive Swagger annotations to each route:

```typescript
/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with government plan documents using RAG
 *     description: Ask questions and get AI-generated answers grounded in official documents
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: ¿Qué proponen sobre educación?
 *               party:
 *                 type: string
 *                 example: pln
 *     responses:
 *       200:
 *         description: Chat response with sources
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
```

---

## Swagger Documentation Setup

### Accessing Swagger UI

Once the server is running:

```bash
pnpm --filter backend dev:server
```

Access:
- **Swagger UI:** http://localhost:3001/api/docs
- **OpenAPI JSON:** http://localhost:3001/api/docs.json

### Swagger UI Features

1. **Interactive Testing**: Try out endpoints directly from the browser
2. **Request/Response Examples**: See example payloads
3. **Schema Validation**: View data types and validation rules
4. **Authentication**: (To be added in future)

### Customization

In `server.ts`, customize Swagger UI:

```typescript
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TicoBot API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      theme: 'monokai'
    }
  }
}));
```

---

## Testing

### Manual Testing with cURL

#### 1. Health Check
```bash
curl http://localhost:3001/health
```

#### 2. API Info
```bash
curl http://localhost:3001/api
```

#### 3. List Documents
```bash
curl http://localhost:3001/api/documents
```

#### 4. Get Document by ID
```bash
curl http://localhost:3001/api/documents/b1b10f82-58b3-4f4e-ab7b-68a8544b356b
```

#### 5. Search (POST)
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "educación superior",
    "limit": 5
  }'
```

#### 6. Search (GET)
```bash
curl "http://localhost:3001/api/search?q=salud&limit=3&party=pln"
```

#### 7. Chat
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Qué proponen sobre medio ambiente?",
    "topK": 5,
    "temperature": 0.7
  }'
```

### Testing with Swagger UI

1. Navigate to http://localhost:3001/api/docs
2. Click on an endpoint to expand
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"
6. View response

### Automated Testing (Future)

Create test files in `backend/src/api/__tests__/`:

```typescript
import request from 'supertest';
import { createApp } from '../server';

describe('Search API', () => {
  const app = createApp();

  it('should return search results', async () => {
    const response = await request(app)
      .post('/api/search')
      .send({ query: 'educación', limit: 5 })
      .expect(200);

    expect(response.body).toHaveProperty('results');
    expect(response.body.count).toBeLessThanOrEqual(5);
  });

  it('should validate input', async () => {
    const response = await request(app)
      .post('/api/search')
      .send({ query: '', limit: 5 })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});
```

---

## Code Examples

### Adding a New Endpoint

1. **Define the route in a route file:**

```typescript
// backend/src/api/routes/myroute.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

const mySchema = z.object({
  param: z.string()
});

/**
 * @swagger
 * /api/myroute:
 *   post:
 *     summary: My new endpoint
 *     tags: [MyTag]
 */
router.post('/', async (req, res) => {
  try {
    const params = mySchema.parse(req.body);
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    // Error handling
  }
});

export default router;
```

2. **Register the route in server.ts:**

```typescript
import myRoute from './routes/myroute.js';

app.use('/api/myroute', myRoute);
```

3. **Add schema in swagger.ts (if needed):**

```typescript
components: {
  schemas: {
    MyResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  }
}
```

### Error Handling Pattern

```typescript
router.post('/', async (req, res, next) => {
  try {
    // Validate
    const params = schema.parse(req.body);

    // Execute logic
    const result = await someOperation(params);

    // Return success
    res.json(result);

  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    // Pass to centralized error handler
    next(error);
  }
});
```

### Pagination Pattern

```typescript
const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

router.get('/', async (req, res) => {
  const params = paginationSchema.parse(req.query);

  const { data, count } = await fetchData({
    limit: params.limit,
    offset: params.offset
  });

  res.json({
    data,
    pagination: {
      total: count,
      limit: params.limit,
      offset: params.offset,
      hasMore: (params.offset + params.limit) < count
    }
  });
});
```

---

## Best Practices

### 1. Input Validation

✅ **DO:**
- Use Zod schemas for all inputs
- Validate early in the request handler
- Return clear validation error messages
- Set appropriate min/max constraints

❌ **DON'T:**
- Trust user input without validation
- Use loose type checking
- Skip validation for "internal" endpoints

### 2. Error Handling

✅ **DO:**
- Use try-catch in async handlers
- Return appropriate HTTP status codes
- Provide helpful error messages
- Log errors for debugging
- Use centralized error middleware

❌ **DON'T:**
- Expose internal error details to clients
- Use generic 500 errors for everything
- Let errors crash the server

### 3. Response Format

✅ **DO:**
- Use consistent response structures
- Include metadata when relevant
- Provide pagination info
- Return appropriate HTTP status codes

❌ **DON'T:**
- Mix response formats
- Return raw database objects
- Forget to sanitize output

### 4. Documentation

✅ **DO:**
- Document all endpoints with Swagger
- Provide request/response examples
- Include validation rules
- Keep documentation up-to-date

❌ **DON'T:**
- Skip documentation
- Use outdated examples
- Forget to update after changes

### 5. Performance

✅ **DO:**
- Implement pagination for lists
- Set reasonable default limits
- Use indexes on database queries
- Cache frequently accessed data

❌ **DON'T:**
- Return unlimited results
- Make unnecessary database calls
- Forget to optimize queries

### 6. Security

✅ **DO:**
- Validate and sanitize all inputs
- Use CORS appropriately
- Implement rate limiting (future)
- Add authentication (future)
- Log security events

❌ **DON'T:**
- Trust client input
- Expose sensitive data
- Skip authorization checks

---

## Common Issues and Solutions

### Issue: Zod Validation Errors

**Problem:** Getting validation errors even with correct input.

**Solution:** Check that coerce is used for query parameters:
```typescript
// ❌ Wrong
limit: z.number().default(10)

// ✅ Correct
limit: z.coerce.number().default(10)
```

### Issue: CORS Errors

**Problem:** Frontend can't access API.

**Solution:** Ensure CORS is configured:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### Issue: ES Module Errors

**Problem:** `require is not defined` in ES modules.

**Solution:** Use proper ES module syntax:
```typescript
// ❌ Wrong
if (require.main === module) { ... }

// ✅ Correct
if (import.meta.url === `file://${process.argv[1]}`) { ... }
```

### Issue: Swagger Not Updating

**Problem:** Changes to JSDoc don't appear in Swagger UI.

**Solution:**
1. Restart the server
2. Clear browser cache
3. Check that the route file path is correct in `swagger.ts`

---

## Next Steps

After completing this implementation:

1. **Authentication & Authorization**
   - Add JWT authentication
   - Implement role-based access control
   - Secure sensitive endpoints

2. **Rate Limiting**
   - Implement request rate limiting
   - Add per-user quotas
   - Track API usage

3. **Monitoring & Logging**
   - Add request/response logging
   - Implement performance monitoring
   - Set up error tracking (Sentry)

4. **API Versioning**
   - Implement versioning strategy
   - Support multiple API versions
   - Deprecation notices

5. **Testing**
   - Add unit tests for routes
   - Integration tests for API flows
   - Load testing for performance

6. **Documentation**
   - Add more examples
   - Create tutorials
   - API client libraries

---

## References

- **Express.js Documentation**: https://expressjs.com/
- **Swagger/OpenAPI Spec**: https://swagger.io/specification/
- **Zod Validation**: https://zod.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

## Conclusion

This guide provides a complete walkthrough of implementing a RESTful API with Express.js, TypeScript, and Swagger documentation. The implementation follows Clean Architecture principles, uses proper validation, error handling, and provides comprehensive documentation for all endpoints.

The API is production-ready and can be extended with authentication, rate limiting, and monitoring as the project grows.
