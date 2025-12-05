# TicoBot API Reference

REST API for accessing and analyzing Costa Rica's 2026 Government Plans using Retrieval-Augmented Generation (RAG).

## Base URL

```
Local: http://localhost:3000/api
Production: TBD
```

## Authentication

Currently, the API is open (no authentication required). Authentication will be added in Phase 3.

---

## Endpoints

### Health Check

#### GET /health

Check API health and status.

**Response:**
```json
{
  "status": "healthy",
  "service": "ticobot-backend",
  "timestamp": "2025-12-04T12:00:00.000Z",
  "version": "0.1.0"
}
```

---

### API Info

#### GET /api

Get API information and available endpoints.

**Response:**
```json
{
  "name": "TicoBot API",
  "version": "0.1.0",
  "description": "API for accessing Costa Rica 2026 Government Plans",
  "endpoints": { ... },
  "documentation": "/api/docs"
}
```

---

## Documents

### List Documents

#### GET /api/documents

Retrieve a list of all government plan documents with optional filtering.

**Query Parameters:**
- `party` (optional): Filter by political party ID
- `limit` (optional): Max results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
curl "http://localhost:3000/api/documents?party=PLN&limit=10&offset=0"
```

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "document_id": "PLN_2026",
      "metadata": {
        "partyId": "PLN",
        "partyName": "Partido Liberación Nacional",
        "title": "Plan de Gobierno PLN 2026-2030",
        "year": 2026
      },
      "created_at": "2025-12-04T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### Get Document by ID

#### GET /api/documents/:id

Retrieve a specific document by its UUID.

**Path Parameters:**
- `id`: Document UUID

**Example Request:**
```bash
curl "http://localhost:3000/api/documents/123e4567-e89b-12d3-a456-426614174000"
```

**Response:**
```json
{
  "document": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "document_id": "PLN_2026",
    "metadata": { ... },
    "created_at": "2025-12-04T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid UUID format
- `404`: Document not found
- `500`: Server error

---

### Get Document Chunks

#### GET /api/documents/:id/chunks

Retrieve all text chunks for a specific document.

**Path Parameters:**
- `id`: Document UUID

**Query Parameters:**
- `limit` (optional): Max results per page (default: 50, max: 200)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
curl "http://localhost:3000/api/documents/123e4567-e89b-12d3-a456-426614174000/chunks?limit=20"
```

**Response:**
```json
{
  "chunks": [
    {
      "id": "uuid",
      "document_id": "uuid",
      "chunk_index": 0,
      "content": "El Plan de Gobierno del PLN...",
      "metadata": {
        "tokens": 415,
        "pageNumber": 1,
        "cleanContent": "El Plan de Gobierno del PLN..."
      },
      "created_at": "2025-12-04T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 92,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Search

### Semantic Search (POST)

#### POST /api/search

Perform semantic search on government plan documents using vector similarity.

**Request Body:**
```json
{
  "query": "¿Qué proponen sobre economía?",
  "party": "PLN",         // optional
  "limit": 5,             // optional, default: 5, max: 20
  "minScore": 0.35        // optional, default: 0.35, range: 0-1
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "¿Qué proponen sobre economía?",
    "party": "PLN",
    "limit": 5
  }'
```

**Response:**
```json
{
  "query": "¿Qué proponen sobre economía?",
  "results": [
    {
      "id": "chunk-uuid",
      "content": "Nuestra propuesta económica incluye...",
      "score": 0.452,
      "metadata": {
        "documentId": "doc-uuid",
        "chunkIndex": 45,
        "tokens": 401,
        "pageNumber": 12
      },
      "page": "12"
    }
  ],
  "count": 5,
  "stats": {
    "avgScore": 0.423,
    "maxScore": 0.452,
    "minScore": 0.387
  },
  "filters": {
    "party": "PLN",
    "minScore": 0.35
  }
}
```

---

### Semantic Search (GET)

#### GET /api/search

Simple GET endpoint for semantic search.

**Query Parameters:**
- `q` (required): Search query
- `party` (optional): Filter by political party
- `limit` (optional): Max results (default: 5, max: 20)
- `minScore` (optional): Minimum similarity score (default: 0.35)

**Example Request:**
```bash
curl "http://localhost:3000/api/search?q=economía&party=PLN&limit=5"
```

**Response:** Same as POST /api/search

---

## Chat (RAG)

### Ask Question

#### POST /api/chat

Ask a question about government plans using RAG. Returns a natural language answer with sources.

**Request Body:**
```json
{
  "question": "¿Qué dice el PUSC sobre educación?",
  "party": "PUSC",              // optional
  "topK": 5,                    // optional, default: 5, max: 10
  "temperature": 0.7,           // optional, default: 0.7, range: 0-2
  "maxTokens": 800,             // optional, default: 800, max: 2000
  "minRelevanceScore": 0.35,    // optional, default: 0.35
  "conversationHistory": [      // optional
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "assistant",
      "content": "Previous answer"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Qué dice el PUSC sobre educación?",
    "party": "PUSC",
    "topK": 5
  }'
```

**Response:**
```json
{
  "answer": "Según el plan de gobierno del PUSC, sus propuestas en educación incluyen...",
  "sources": [
    {
      "id": "chunk-uuid",
      "content": "En materia educativa, proponemos...",
      "party": "PUSC",
      "document": "PUSC_2026",
      "page": "15",
      "relevanceScore": 0.487
    }
  ],
  "metadata": {
    "model": "gpt-4",
    "tokensUsed": 542,
    "sourcesCount": 5,
    "processingTime": 1234
  },
  "filters": {
    "party": "PUSC",
    "minRelevanceScore": 0.35
  }
}
```

---

### Stream Chat Response

#### POST /api/chat/stream

Stream chat responses using Server-Sent Events (SSE).

**Request Body:** Same as POST /api/chat

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Qué proponen sobre salud?"}' \
  --no-buffer
```

**Response (SSE Stream):**
```
data: {"type":"start","message":"Processing query..."}

data: {"type":"sources","sources":[...]}

data: {"type":"chunk","content":"Según "}

data: {"type":"chunk","content":"el plan "}

data: {"type":"chunk","content":"de gobierno..."}

data: {"type":"done","metadata":{...}}
```

**Event Types:**
- `start`: Query processing started
- `sources`: Retrieved sources
- `chunk`: Partial response content
- `done`: Complete with metadata
- `error`: Error occurred

---

## Error Responses

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["query"],
      "message": "Required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "error": "Not Found",
  "path": "/api/invalid"
}
```

or

```json
{
  "error": "Document not found",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Server Error (500)
```json
{
  "error": "Internal Server Error",
  "message": "Error details..."
}
```

---

## Rate Limiting

Not yet implemented. Will be added in Phase 3.

---

## Examples

### Complete Workflow

1. **List available documents:**
```bash
curl http://localhost:3000/api/documents
```

2. **Search for specific topic:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "economía", "limit": 5}'
```

3. **Ask question with RAG:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Qué proponen los partidos sobre economía?",
    "topK": 5
  }'
```

---

## Development

### Run Server
```bash
# Development mode (with hot reload)
pnpm --filter backend dev:server

# Production mode
pnpm --filter backend start:server
```

### Environment Variables
```env
PORT=3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-key
OPENAI_API_KEY=your-key
```

---

## Version History

### v0.1.0 (2025-12-04)
- Initial API implementation
- Documents endpoints (list, get, chunks)
- Search endpoint (POST & GET)
- Chat endpoints (standard & streaming)
- Health check
- Error handling and validation

---

## Next Steps

- [ ] Add rate limiting
- [ ] Add authentication (JWT)
- [ ] Add API tests
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add request caching
- [ ] Add monitoring and analytics
