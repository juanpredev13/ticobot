# Phase 2: Core Implementation

**Status:** In Progress (20%)
**Timeline:** Nov 2025 - Dec 15, 2025 (URGENT)
**Goal:** Launch MVP by Dec 15

## Implementation Guides

### Manual Step-by-Step Guides (For Self-Implementation)
1. [Phase 2.1 Manual Guide](./PHASE_2.1_MANUAL_GUIDE.md) - Complete walkthrough for Ingestion Pipeline
   - 12-18 hours over 2-3 days
   - Fix PDFDownloader, implement PDFParser, TextCleaner, TextChunker
   - Integration testing and API endpoints

2. [Phase 2.2 Manual Guide](./PHASE_2.2_MANUAL_GUIDE.md) - Complete walkthrough for RAG Pipeline
   - 13-19 hours over 2-3 days
   - Implement QueryEmbedder, SemanticSearcher, ContextBuilder, ResponseGenerator
   - Performance testing and optimization

### Technical Reference Guides
1. [02 - Ingestion Pipeline](./02-Backend-Ingestion-Pipeline.md) - Issue #17
   - Fix PDFDownloader
   - Implement PDFParser, TextCleaner, TextChunker
   - Create IngestPipeline orchestrator

2. [03 - RAG Pipeline](./03-Backend-RAG-Pipeline.md) - Issue #18
   - QueryEmbedder
   - SemanticSearcher
   - ContextBuilder
   - ResponseGenerator

3. [04 - RESTful API Implementation Guide](./04-RESTful-API-Implementation-Guide.md) - Issue #27 ✅
   - Express.js API setup
   - Chat, Search, and Documents endpoints
   - Swagger/OpenAPI documentation
   - Input validation with Zod
   - Error handling and testing

### Frontend
1. [01 - Frontend Implementation](./01%20-%20Frontend%20Implementation%20-%20Core%20Module.md) - Issue #12
   - Next.js setup
   - UI components
   - Pages: document list, search, chat

## Quick Start

**Option 1: Manual Implementation (Recommended for Learning)**
Follow the detailed step-by-step manual guides:
1. [PHASE_2.1_MANUAL_GUIDE.md](./PHASE_2.1_MANUAL_GUIDE.md) - Ingestion Pipeline (12-18 hours)
2. [PHASE_2.2_MANUAL_GUIDE.md](./PHASE_2.2_MANUAL_GUIDE.md) - RAG Pipeline (13-19 hours)
3. Frontend Implementation

**Option 2: Quick Reference**
Use technical reference guides for quick lookups:
```bash
# Fix immediate blocker
pnpm --filter backend add axios

# Then follow guides in order:
# 1. Complete 02-Backend-Ingestion-Pipeline.md
# 2. Complete 03-Backend-RAG-Pipeline.md
# 3. Complete 01-Frontend-Implementation.md
```

## Critical Path to MVP

1. Week 1: Backend ingestion + RAG pipelines
2. Week 2: Frontend + API integration
3. Week 3: Testing + deployment

**Deadline:** Dec 15, 2025
