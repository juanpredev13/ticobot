# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TicoBot** is an intelligent platform for extracting, processing, indexing, and analyzing Costa Rica's 2026 Government Plans officially published by the Supreme Electoral Tribunal (TSE). The platform enables:

- Exploring government plan content
- Comparing proposals between political parties
- Answering questions grounded in official PDFs
- Testing different LLM providers, vector databases, and RAG pipelines

## Tech Stack

**Backend:** Node.js 20+ + TypeScript
- Package manager: pnpm
- Automatic extraction and download of official TSE PDFs
- Text parsing, cleaning, and chunking
- Embedding generation
- Modular RAG pipeline
- Batch processing scripts

**Frontend:** Next.js 16 App Router + TypeScript
- TailwindCSS for styling
- PDF list and document exploration
- Search and exploration interface
- Chat interface with RAG context
- Model selector (switch between LLM providers)
- Provider selector (switch between vector/RAG backends)
- Admin dashboard

**Monorepo:** pnpm workspace
- `backend/` - API and data processing
- `frontend/` - Next.js application
- `shared/` - Shared TypeScript types and utilities
- `infra/` - Infrastructure and deployment configs
- `docs/` - Project documentation organized by phase

**Database & Storage:**
- Supabase (initial option) for PostgreSQL + storage
- Configurable database providers

**Vector Store Options:**
- Supabase pgvector
- Pinecone
- Qdrant
- Weaviate

**LLM Providers:**
- OpenAI (GPT-4.1, o1)
- Anthropic Claude 3.5 Sonnet
- Google Gemini (Flash, Pro)
- Local LLMs via Ollama

## Architecture Principles

The project follows **Clean Architecture** with **Ports & Adapters** pattern and **SOLID principles**, organized into distinct layers:

### Layers

**Presentation Layer**
- HTTP API (REST/GraphQL)
- Next.js UI components

**Application Layer (Use Cases)**
- `IngestPDFUseCase` - Download and process TSE PDFs
- `SearchUseCase` - Search through indexed documents
- `ChatUseCase` - Interactive chat with RAG context
- `EmbedDocumentUseCase` - Generate and store embeddings

**Domain Layer**
- **Entities:**
  - `Document` - Represents a government plan PDF
  - `Chunk` - Text segments with embeddings
  - `SearchResult` - Query results with relevance scores
- **Interfaces (Ports):**
  - `LLMProvider` - Contract for AI language models
  - `VectorProvider` - Contract for vector databases
  - `DatabaseProvider` - Contract for data persistence
  - `StorageProvider` - Contract for file storage

**Infrastructure Layer (Adapters)**
- Concrete implementations:
  - `SupabaseVectorProvider`
  - `PgDatabaseProvider`
  - `PineconeProvider`
  - `QdrantProvider`
  - `WeaviateProvider`
  - `OpenAIProvider`
  - `ClaudeProvider`
  - `GeminiProvider`
  - `OllamaProvider`

All providers implement their respective interfaces, enabling runtime swapping without modifying business logic.

## PDF Ingestion Pipeline

The backend exposes a unified high-level API for:
- **Ask / Search / Chat** - Query government plans with RAG
- **Document lookup** - Retrieve specific documents and metadata
- **Health + diagnostics** - Monitor system status

The ingestion pipeline:
1. Downloads official PDFs from TSE
2. Extracts text content
3. Splits content into semantic chunks
4. Generates embeddings for each chunk
5. Stores metadata + vectors in configured vector provider/database

## Development Commands

Since this is a pnpm monorepo, use pnpm workspace commands:

```bash
# Install dependencies across all packages
pnpm install

# Run backend development server
pnpm --filter backend dev

# Run frontend development server
pnpm --filter frontend dev

# Run both backend and frontend
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint

# Run a single test file
pnpm --filter backend test -- path/to/test.spec.ts
pnpm --filter frontend test -- path/to/test.spec.ts
```

## Key Architectural Patterns

**Dependency Injection:** Use ports (interfaces) and adapters (implementations) to allow swapping providers without modifying business logic.

**Repository Pattern:** Data access is abstracted behind repository interfaces, allowing different storage backends.

**Provider Pattern:** LLM, embedding, and vector database providers are interchangeable through common interfaces defined in `shared/`.

## Working with the Codebase

When implementing new features:

1. Define interfaces in `shared/` if they'll be used across packages
2. Keep business logic independent of external providers
3. Implement new providers as adapters conforming to port interfaces
4. Add configuration options to allow runtime provider selection
5. Ensure new providers can be tested in isolation

When adding a new provider (LLM, database, etc.):
1. Create an interface in `shared/types` or `shared/interfaces`
2. Implement the adapter in the appropriate package
3. Register it in the provider factory/registry
4. Add configuration to allow selection via environment variables

## Documentation

Phase-specific documentation is located in `/docs` folder, organized by development phases in markdown files.
