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
- Task Update & Sync Process

  When completing or adding tasks, follow these steps in order:

  ## 1. Git Repo Documentation
  - Create/update task files in `docs/development/phase-one/`
  - Create detailed docs in `docs/development/requirements/` (if needed)
  - Keep comprehensive technical documentation

  ## 2. GitHub Issues
  - Create issue: `gh issue create --title "[Phase X.Y] Task Name" --body "..." --assignee @me`
  - Close completed: `gh issue close <number> --comment "Task completed..."`
  - Add labels after creation: `gh issue edit <number> --add-label "phase-one,documentation"`

  ## 3. Git Commits & PR
  - Create feature branch: `git checkout -b phase-one/descriptive-name`
  - Make **separate commits** for each completed issue:
    ```bash
    git add <files-for-issue-1>
    git commit -m "[Phase X.Y] Task Title\n\nCloses #N\n\n🤖 Generated with Claude Code\nCo-Authored-By: Claude <noreply@anthropic.com>"
  - Push branch: git push -u origin branch-name
  - Create PR: gh pr create --title "Title" --body "..." --base main

  4. Obsidian Vault Sync

  Update 3 files in /home/juanpredev/Documents/obsidian/Personal/4 - Side Projects/TicoBot/:

  A. Task File (Management/Phase 1/XX - Task Name.md)

  Add GitHub section:
  ## GitHub

  - **Issue**: [#X](https://github.com/juanpredev13/ticobot/issues/X) ✅ Closed
  - **PR**: [#Y](https://github.com/juanpredev13/ticobot/pull/Y) ✅ Merged
  - **Commit**: `abc1234` - [Phase X.Y] Task Title

  For open tasks:
  ## GitHub

  - **Issue**: [#X](https://github.com/juanpredev13/ticobot/issues/X) 🟡 Open

  B. Task List (Management/List Tasks.md)

  Move completed tasks to Archive:
  ## Archive

  - [x] [[Phase 1/01 - Task|01 - Task Name]] #ticobot ✅ 2025-11-19

  Add new tasks to Backlog:
  ## Backlog

  - [ ] [[Phase 1/09 - New Task|09 - New Task]] #ticobot #backlog

  C. Main Index (TicoBot.md)

  1. Update task list (add ✅ to completed, add new tasks)
  2. Update "Current Status" section
  3. Update "Phase 1 Progress" checkboxes
  4. Update "Last Updated" date
  5. Update "Next Milestone"

  5. Key Principles

  - Git repo = detailed technical docs (source of truth)
  - GitHub = issue tracking and PR management
  - Obsidian = quick reference & progress tracking (simplified)
  - Keep format consistent: Obsidian uses #tags and [[wiki links]]
  - Always sync all three: git repo, GitHub issues, Obsidian vault

  6. Commit Message Format

  [Phase X.Y] Brief Title

  Detailed description of what was completed.

  ## Deliverables Completed
  - Item 1
  - Item 2

  ## Documentation Created
  - file1.md
  - file2.md

  Closes #N

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>

  7. PR Description Template

  Include:
  - Summary of what was completed
  - Which issues are closed (Closes #1, Closes #2)
  - Key decisions made
  - Documentation structure
  - Testing checklist
  - Next steps
- create pr before close issues and update obsidian documentation
- use rebase for mergin
- we need to create a branch first to start new step