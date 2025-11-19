# System Architecture Documentation

## Overview

This folder contains comprehensive system architecture documentation for **TicoBot**, a RAG system for querying Costa Rica's 2026 Government Plans.

The architecture follows **Clean Architecture** principles with **Ports & Adapters** pattern, ensuring:
- **Modularity**: Independent, testable components
- **Flexibility**: Swappable providers for LLM, vector DB, and storage
- **Scalability**: Designed for growth from day one
- **Maintainability**: Clear separation of concerns

---

## Document Structure

### 01. High-Level Architecture
**File**: `01-high-level-architecture.md`

**Contents**:
- Architectural principles (Clean Architecture, Ports & Adapters, SOLID)
- System layers (Presentation, Application, Domain, Infrastructure)
- Layer responsibilities and dependencies
- Technology stack overview
- Monorepo structure
- Key design decisions
- Scalability and security considerations

**Key Diagrams**:
- System layers diagram (Mermaid)
- Component dependency graph

**Use this when**: Understanding the overall system design and architectural patterns

---

### 02. Component Descriptions
**File**: `02-component-descriptions.md`

**Contents**:
Detailed descriptions of all 8 core components:
1. **PDF Ingestion Pipeline** - Download and extract PDFs
2. **Text Cleaner & Normalizer** - Clean extracted text
3. **Chunking Module** - Split text into optimal chunks
4. **Embedding Generator** - Generate vector embeddings
5. **Vector Store Manager** - Store and search vectors
6. **RAG Query Engine** - Execute RAG queries
7. **Provider Abstraction Layer** - Abstract external services
8. **Next.js UI** - User interface

For each component:
- Purpose and responsibilities
- Inputs and outputs
- Technologies used
- Error handling
- Dependencies
- Code examples

**Key Diagrams**:
- Component interaction diagram

**Use this when**: Understanding individual component behavior and interfaces

---

### 03. Data Flow Diagrams
**File**: `03-data-flow-diagrams.md`

**Contents**:
Comprehensive data flow diagrams for all major workflows:
1. **PDF Ingestion Flow** - From PDF to vector storage
2. **Search Query Flow** - Semantic search execution
3. **RAG Chat Flow** - Question to answer pipeline
4. **Provider Switching Flow** - Runtime provider changes
5. **Batch Processing Flow** - Bulk PDF ingestion
6. **Error Handling Flow** - Retry and graceful degradation
7. **Caching Flow** - Query result caching

**Key Diagrams** (Mermaid):
- Sequence diagrams for each workflow
- Data transformation diagrams
- Performance bottleneck analysis

**Use this when**: Understanding how data moves through the system

---

### 04. Interface Definitions
**File**: `04-interface-definitions.md`

**Contents**:
Complete TypeScript interface definitions for:

**Core Entities**:
- `Document` - Government plan PDF metadata
- `Chunk` - Text chunk with embeddings
- `SearchResult` - Search result with score
- `Message` - Chat message

**Provider Interfaces (Ports)**:
- `LLMProvider` - Language model contract
- `EmbeddingProvider` - Embedding generation contract
- `VectorProvider` - Vector database contract
- `DatabaseProvider` - General database contract
- `StorageProvider` - File storage contract

**Use Case Interfaces**:
- `IngestPDFUseCase`
- `SearchUseCase`
- `ChatUseCase`

**Additional Interfaces**:
- `ProviderRegistry` - Manage provider instances
- `AppConfig` - Application configuration
- `ValidationResult` - Validation responses

**Use this when**: Implementing providers, use cases, or entities

---

### 05. Frontend Architecture
**File**: `05-frontend-architecture.md`

**Contents**:
Feature-based modular frontend structure (Level 3) for Next.js:

**Module Structure**:
1. **Core Module** - Shared components, design system, hooks, utilities
2. **Documents Module** - PDF document management and exploration
3. **Search Module** - Semantic search with filtering
4. **Comparison Module** - Side-by-side party comparison (2-4 parties)
5. **Chat Module** - RAG-powered Q&A interface
6. **Admin Module** - System monitoring and management

**Key Sections**:
- Complete file/folder structure
- Module breakdown with responsibilities
- Design system (colors, typography, spacing)
- State management strategy (local, module, global, server)
- Routing structure (Next.js App Router)
- Accessibility guidelines (WCAG 2.1 Level AA)
- Performance considerations

**Advantages**:
- Feature isolation and scalability
- Team collaboration friendly
- Business logic alignment
- Easy maintenance and testing

**Use this when**: Planning or implementing frontend modules and components

---

## Architecture Principles

### 1. Clean Architecture

```
┌─────────────────────────────────────────────┐
│         Presentation Layer (UI/API)         │
├─────────────────────────────────────────────┤
│      Application Layer (Use Cases)          │
├─────────────────────────────────────────────┤
│    Domain Layer (Entities & Interfaces)     │
├─────────────────────────────────────────────┤
│   Infrastructure Layer (Adapters/Impl)      │
└─────────────────────────────────────────────┘

Dependency Rule: Outer layers depend on inner layers, never vice versa
```

**Key Benefits**:
- Business logic is independent of frameworks
- Testable in isolation
- UI and database can be swapped
- Clear boundaries between layers

---

### 2. Ports & Adapters (Hexagonal Architecture)

```
                    ┌─────────────┐
                    │   Domain    │
                    │   (Core)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼───┐   ┌────▼───┐   ┌────▼───┐
         │  Port  │   │  Port  │   │  Port  │
         │  (IF)  │   │  (IF)  │   │  (IF)  │
         └────┬───┘   └────┬───┘   └────┬───┘
              │            │            │
         ┌────▼───┐   ┌────▼───┐   ┌────▼───┐
         │Adapter1│   │Adapter2│   │Adapter3│
         │(OpenAI)│   │(Supabase)│ │(Pinecone)│
         └────────┘   └────────┘   └────────┘
```

**Key Benefits**:
- Swap providers without changing core logic
- Test with mock adapters
- A/B test different providers
- Avoid vendor lock-in

---

### 3. SOLID Principles

- **S**ingle Responsibility: Each component has one reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Implementations can be substituted
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Depend on abstractions, not concretions

---

## Technology Stack Summary

### Backend
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Package Manager**: pnpm (monorepo workspace)
- **API**: Express.js (REST)

### Frontend
- **Framework**: Next.js 16 App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui

### Database & Storage
- **Primary DB**: PostgreSQL (Supabase)
- **Vector Extension**: pgvector
- **File Storage**: Supabase Storage / S3

### External Services
- **LLM**: OpenAI, Anthropic Claude, Google Gemini, Ollama
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector DB**: Supabase, Pinecone, Qdrant, Weaviate

---

## Monorepo Structure

```
ticobot/
├── backend/                    # Node.js + TypeScript backend
│   ├── src/
│   │   ├── domain/            # Entities, interfaces (ports)
│   │   ├── application/       # Use cases (business logic)
│   │   ├── infrastructure/    # Adapters (provider implementations)
│   │   └── presentation/      # API layer (REST/GraphQL)
│   ├── tests/
│   └── package.json
├── frontend/                   # Next.js frontend
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   └── package.json
├── shared/                     # Shared types & utilities
│   ├── types/                 # TypeScript interfaces
│   ├── utils/                 # Common functions
│   └── package.json
├── infra/                      # Infrastructure configs
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── docs/                       # Documentation
│   ├── development/
│   │   ├── phase-one/         # Phase 1 task definitions
│   │   └── requirements/      # Requirements docs
│   │       ├── architecture/  # ← You are here
│   │       └── dataset/       # Dataset specifications
│   └── api/                   # API documentation
└── package.json                # Root workspace config
```

---

## Key Design Decisions

### 1. Monorepo with pnpm Workspaces
**Decision**: Use pnpm workspace for `backend`, `frontend`, `shared`

**Rationale**:
- Simplifies code sharing (types, utilities)
- Single dependency installation
- Better development experience
- Atomic commits across packages

---

### 2. Provider Abstraction Layer (Critical!)
**Decision**: Abstract all external services behind interfaces

**Rationale**:
- **Avoid vendor lock-in**: Switch providers easily
- **A/B testing**: Compare LLM performance
- **Cost optimization**: Use cheap providers for dev, premium for prod
- **Testability**: Mock providers in tests

**Example**:
```typescript
// Business logic depends on interface, not implementation
class ChatUseCase {
  constructor(
    private llm: LLMProvider,        // Interface
    private vector: VectorProvider   // Interface
  ) {}
}

// Runtime provider selection
const llm = registry.getLLM(process.env.LLM_PROVIDER || 'openai');
const vector = registry.getVector(process.env.VECTOR_PROVIDER || 'supabase');
```

---

### 3. Clean Architecture Layers
**Decision**: Strict layer separation with dependency rule

**Rationale**:
- **Testability**: Test business logic without infrastructure
- **Maintainability**: Change UI without touching domain
- **Flexibility**: Swap frameworks and databases
- **Team collaboration**: Clear boundaries for different roles

---

### 4. TypeScript Throughout
**Decision**: Use TypeScript for backend, frontend, and shared code

**Rationale**:
- Type safety reduces runtime errors
- Better IDE autocomplete and refactoring
- Self-documenting code
- Easier to maintain and scale

---

### 5. Vector Database Flexibility
**Decision**: Support multiple vector DB providers

**Rationale**:
- **Development**: Use Supabase free tier
- **Production**: Evaluate Pinecone, Qdrant, Weaviate
- **Cost optimization**: Choose based on scale
- **Feature comparison**: Different providers have different strengths

---

## Data Flow Overview

### Complete Pipeline

```
TSE PDFs
   ↓
Download & Extract
   ↓
Clean & Normalize
   ↓
Chunk Text (800-1500 chars)
   ↓
Generate Embeddings
   ↓
Store in Vector DB
   ↓
[Ready for Queries]
   ↓
User Question
   ↓
Embed Question
   ↓
Vector Search (Top-K)
   ↓
Build Context
   ↓
LLM Generation
   ↓
Answer + Citations
```

---

## Performance Targets

| Component | Target Latency | Optimization |
|-----------|----------------|--------------|
| PDF Download | 1-5s | Parallel downloads |
| Text Extraction | 0.5-2s | Fast parser (pdfjs) |
| Embedding | 0.1-0.5s | Batch processing |
| Vector Search | <100ms | HNSW indexing |
| LLM Generation | 2-10s | Streaming, caching |

**End-to-end Query Time**: <3s (with caching), <12s (cold start)

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API design (can run multiple instances)
- Load balancing across API servers
- Provider pooling for concurrent requests

### Vertical Scaling
- Optimize chunk size for memory efficiency
- Stream large responses to reduce memory
- Batch processing for PDF ingestion

### Data Scaling
- **Current**: 20 PDFs, ~5,000-15,000 chunks, ~50 MB
- **Year 2**: Add 2030 plans, ~30,000 chunks, ~150 MB
- **Year 5**: Historical data, ~75,000 chunks, ~375 MB

**Vector DB Indexing**: Sub-second queries up to 1M vectors

---

## Security Considerations

### API Security
- Environment variables for sensitive keys (never commit)
- Rate limiting on public endpoints
- Input validation and sanitization
- CORS configuration for frontend

### Data Security
- No personal data collected (public PDFs only)
- Secure storage of embeddings
- Audit logging for provider API calls

### Provider Security
- API key rotation support
- Separate keys for dev/staging/prod
- Provider-specific security configs

---

## Testing Strategy

### Unit Tests
- Test domain entities and use cases
- Mock providers (adapters)
- Test business logic in isolation

### Integration Tests
- Test adapter implementations
- Verify provider API contracts
- Test database operations

### End-to-End Tests
- Full pipeline: PDF → Answer
- Test RAG quality and groundedness
- Performance benchmarks

---

## Next Steps

After completing the architecture phase:

1. **Task 1.4**: Provider Abstraction Layer
   - Implement interfaces in `shared/types`
   - Create provider registry
   - Build adapter base classes

2. **Task 1.5**: Backend Folder Structure
   - Set up monorepo with pnpm
   - Create folder structure matching architecture
   - Configure TypeScript and build tools

3. **Task 1.6**: RAG Pipeline Design
   - Implement PDF ingestion pipeline
   - Build chunking and embedding modules
   - Create RAG query engine

---

## Related Documentation

- **Requirements**: `/docs/development/requirements/`
  - `01-project-goals-and-objectives.md`
  - `02-core-features-and-capabilities.md`
  - `04-provider-abstraction-requirements.md`

- **Dataset Specs**: `/docs/development/requirements/dataset/`
  - `02-metadata-schema.md`
  - `03-chunking-strategy.md`

- **Phase 1 Tasks**: `/docs/development/phase-one/`
  - `03 - System Architecture Overview.md`
  - `04 - Provider Abstraction Layer.md`

---

## Glossary

- **RAG**: Retrieval-Augmented Generation (vector search + LLM)
- **Chunk**: Text segment of 800-1500 characters
- **Embedding**: Vector representation of text (1536 dimensions)
- **Vector DB**: Database optimized for similarity search
- **Port**: Interface defining a contract
- **Adapter**: Concrete implementation of a port
- **Use Case**: Application-specific business logic
- **Entity**: Core business object (Document, Chunk, etc.)

---

**Version**: 1.0
**Last Updated**: 2025-11-19
**Status**: Phase 1 - Architecture Design Complete
