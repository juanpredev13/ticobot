# API Module

## Purpose
Exposes HTTP API endpoints for TicoBot frontend and external clients.

## Responsibilities
- Define REST API routes
- Handle HTTP requests/responses
- Request validation
- Error handling
- API documentation (OpenAPI/Swagger)
- Rate limiting
- Authentication/Authorization (future)

## Folder Structure

    api/
    ├── routes/               # API route handlers
    │   ├── chat.routes.ts        # Chat/query endpoints
    │   ├── documents.routes.ts   # Document management
    │   ├── search.routes.ts      # Search endpoints
    │   └── health.routes.ts      # Health check endpoints
    ├── middleware/           # Express middleware
    │   ├── errorHandler.ts       # Error handling
    │   ├── validator.ts          # Request validation
    │   └── rateLimiter.ts        # Rate limiting
    ├── types/                # Request/response types
    │   └── api.types.ts          # API type definitions
    ├── README.md             # This file
    └── index.ts              # Export public API & server

## Dependencies
- Express.js or similar framework
- Validation library (Zod)
- RAG module
- Ingest module