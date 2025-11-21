# TicoBot

<div align="lef">

<!-- Choose your preferred sponsor badge color by uncommenting one option below -->


<!-- Gold/Yellow Options -->
[![Sponsor](https://img.shields.io/badge/💖_Sponsor_this_project-FFD700?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/juanpredev13) 

**⭐ If you find this project useful, please consider sponsoring its development! ⭐**

</div>

---

An intelligent platform for extracting, processing, indexing, and analyzing Costa Rica's 2026 Government Plans officially published by the Supreme Electoral Tribunal (TSE).

## Overview

TicoBot enables citizens to:

- **Explore** government plan content across all political parties
- **Compare** proposals between different parties side-by-side
- **Ask questions** grounded in official PDF documents using AI
- **Test and evaluate** different LLM providers, vector databases, and RAG pipelines

## Features

- 🤖 **Multi-LLM Support**: Switch between OpenAI, Claude, Gemini, and local Ollama models
- 🔍 **Semantic Search**: Find relevant content across all government plans
- 💬 **RAG-powered Chat**: Interactive Q&A with context from official documents
- 📊 **Comparison Tools**: Compare proposals across political parties
- 🔄 **Modular Architecture**: Swap providers without changing business logic
- 📈 **Admin Dashboard**: Monitor system status and manage data

## Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Package Manager**: pnpm
- **Architecture**: Clean Architecture with Ports & Adapters pattern
- **Features**:
  - Automatic TSE PDF extraction and download
  - Text parsing, cleaning, and chunking
  - Embedding generation
  - Modular RAG pipeline
  - Batch processing scripts

### Frontend
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: TailwindCSS
- **Features**:
  - PDF document exploration
  - Search interface
  - Interactive chat with RAG context
  - Model selector (LLM provider switching)
  - Provider selector (vector/RAG backend switching)
  - Admin dashboard

### Monorepo Structure
```
ticobot/
├── backend/        # API and data processing
├── frontend/       # Next.js application
├── shared/         # Shared TypeScript types and utilities
├── infra/          # Infrastructure and deployment configs
└── docs/           # Project documentation organized by phase
```

### Database & Storage
- **Primary**: Supabase (PostgreSQL + storage)
- **Configurable**: Support for multiple database providers

### Vector Store Options
- Supabase pgvector
- Pinecone
- Qdrant
- Weaviate

### LLM Providers
- OpenAI (GPT-4.1, o1)
- Anthropic Claude 3.5 Sonnet
- Google Gemini (Flash, Pro)
- Local LLMs via Ollama

## Architecture

TicoBot follows **Clean Architecture** principles with a **Ports & Adapters** pattern:

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
- Entities: `Document`, `Chunk`, `SearchResult`
- Ports: `LLMProvider`, `VectorProvider`, `DatabaseProvider`, `StorageProvider`

**Infrastructure Layer (Adapters)**
- Provider implementations for all supported services

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/juanpredev13/ticobot.git
cd ticobot

# Install dependencies
pnpm install
```

### Development

```bash
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

# Run a specific test file
pnpm --filter backend test -- path/to/test.spec.ts
```

## PDF Ingestion Pipeline

The platform automatically:

1. Downloads official PDFs from TSE
2. Extracts text content
3. Splits content into semantic chunks
4. Generates embeddings for each chunk
5. Stores metadata and vectors in configured providers

## API Overview

The backend exposes a unified API for:
- **Ask / Search / Chat** - Query government plans with RAG
- **Document lookup** - Retrieve specific documents and metadata
- **Health + diagnostics** - Monitor system status

## Adding New Providers

When implementing a new provider (LLM, database, vector store):

1. Create an interface in `shared/types` or `shared/interfaces`
2. Implement the adapter in the appropriate package
3. Register it in the provider factory/registry
4. Add configuration to allow selection via environment variables

## Documentation

Phase-specific documentation is located in the `/docs` folder, organized by development phases.

## Contributing

This project follows specific contribution guidelines. See `CLAUDE.md` for detailed instructions on:
- Architecture patterns
- Development workflow
- Task tracking process
- Commit message format

## License

[Add your license here]

## Contact

juanpredev@gmail.com

---

**Status**: 🚧 Under active development - Phase 1 in progress

Last Updated: 2025-11-19
