# TicoBot - Requirements & Scope Definition

This folder contains the complete requirements and scope definition for the TicoBot RAG system.

## Overview

TicoBot is an intelligent platform for extracting, processing, indexing, and analyzing Costa Rica's 2026 Government Plans officially published by the Supreme Electoral Tribunal (TSE). The primary goal is to **enable citizens to compare political proposals** between different political parties.

## Documentation Structure

### [01 - Project Goals and Objectives](./01-project-goals-and-objectives.md)
Defines the strategic vision, target audience, and project constraints.

**Key Points**:
- Primary goal: Enable comparison of political proposals
- Target audience: Voters, journalists, political analysts
- Constraints: Minimal cost, fast development, high accuracy, future scalability

### [02 - Core Features and Capabilities](./02-core-features-and-capabilities.md)
Lists all system features with priority levels.

**Must-Have Features (MVP)**:
1. PDF Ingestion System
2. Document Processing Pipeline
3. Embedding & Vector Storage
4. Comparative Search Interface ⭐ Primary use case
5. Question Answering (RAG)
6. Multi-Provider Support ⭐ Critical for cost optimization
7. Document Explorer
8. Admin Dashboard

### [03 - Data Sources and Processing](./03-data-sources-and-processing.md)
Specifies data pipeline from TSE PDFs to vector storage.

**Key Specifications**:
- Source: https://www.tse.go.cr/2026/planesgobierno.html
- Chunk size: 800-1500 characters with 100-200 char overlap
- Metadata: party, candidate, year, page, section, source_url
- Quality requirements: >95% extraction accuracy

### [04 - Provider Abstraction Requirements](./04-provider-abstraction-requirements.md)
Defines interfaces and architecture for provider flexibility. **CRITICAL DOCUMENT**.

**Key Interfaces**:
- `IEmbeddingProvider` - Generate vector embeddings
- `IVectorStore` - Store and search vectors
- `ILLMProvider` - Generate answers
- `IDatabaseProvider` - Store metadata

**Why Critical**: Prevents vendor lock-in, enables cost optimization, future-proofs the system.

### [05 - System Boundaries and Constraints](./05-system-boundaries-and-constraints.md)
Defines what the system will and won't do, plus technical constraints.

**In Scope**:
- TSE 2026 government plans only
- Semantic search and comparison
- Question answering with citations

**Out of Scope**:
- Social media monitoring
- News aggregation
- Fact-checking external claims
- Historical data (initially)

**Key Constraints**:
- Budget: < $50/month
- Timeline: 2-3 months to MVP
- Team: Solo/small team
- Language: Spanish only (initially)

### [06 - Success Criteria](./06-success-criteria.md)
Defines measurable success metrics for the project.

**Must-Have Criteria**:
- 100% of TSE PDFs successfully ingested
- Search quality: Top-5 relevant 80% of the time
- No hallucinations (answers grounded in sources)
- Operating cost < $50/month
- Can switch providers via environment variables

**User Adoption Goals (6 months)**:
- 1,000+ unique visitors during election season
- 60%+ perform comparisons
- User satisfaction > 4/5

## Quick Reference

### Target Metrics
- **Search latency**: < 2 seconds (p95)
- **Answer latency**: < 5 seconds (p95)
- **Concurrent users**: 100 (target), 500-1000 (peak)
- **Accuracy**: >95% text extraction, 80% relevant top-5 results
- **Cost**: < $50/month operational, < $10 ingestion

### Technology Stack
- **Backend**: Node.js + TypeScript + Express
- **Frontend**: Next.js + Tailwind CSS
- **Database**: Supabase (PostgreSQL + pgvector)
- **Embeddings**: OpenAI text-embedding-3-small (or alternatives)
- **LLMs**: Configurable (OpenAI, Claude, Gemini, Groq)

### Data Specifications
- **Source**: TSE 2026 government plan PDFs
- **Estimated docs**: 20-50 PDFs
- **Estimated chunks**: 5,000-15,000
- **Chunk size**: 800-1500 characters
- **Overlap**: 100-200 characters

## Next Steps

After completing requirements definition:
1. ✅ Requirements & Scope Definition (COMPLETED)
2. ⏭️ Dataset Specification (Use 03-data-sources-and-processing.md)
3. ⏭️ System Architecture Overview
4. ⏭️ Provider Abstraction Layer Implementation (Use 04-provider-abstraction-requirements.md)
5. ⏭️ Backend Folder Structure Setup
6. ⏭️ RAG Pipeline Design & Implementation

## Related Documentation

- `/docs/development/phase-one/` - Phase one planning tasks
- `/CLAUDE.md` - Project overview and architecture principles
- TSE Website: https://www.tse.go.cr/2026/planesgobierno.html

---

**Status**: ✅ Requirements definition complete
**Last Updated**: 2025-11-18
**Next Phase**: Architecture & Design
