# TicoBot Development Documentation

**Last Updated:** 2025-02-03

This folder contains comprehensive development documentation for the TicoBot project, organized by phase and topic.

## Project Status

**Current Phase:** Phase 2 - Core Implementation (20% complete)
**Launch Deadline:** December 15, 2025 (23 days remaining)
**Election Date:** February 1, 2026

## Documentation Structure

### Phase Documentation

#### Phase 1 - Requirements & Design (89% Complete)
Located in: `phase-one/`

**Completed Tasks:**
1. [Requirements & Scope Definition](phase-one/01%20-%20Requirements%20&%20Scope%20Definition.md)
2. [Dataset Specification](phase-one/02%20-%20Dataset%20Specification.md)
3. [System Architecture Overview](phase-one/03%20-%20System%20Architecture%20Overview.md)
4. [Provider Abstraction Layer](phase-one/04%20-%20Provider%20Abstraction%20Layer.md) (CRITICAL)
5. [Backend Folder Structure](phase-one/05%20-%20Backend%20Folder%20Structure.md)
6. [RAG Pipeline Design](phase-one/06%20-%20RAG%20Pipeline%20Design.md)
7. [Technology Decisions](phase-one/07%20-%20Technology%20Decisions.md)
8. [Risk Management & Scalability](phase-one/08%20-%20Risk%20Management%20&%20Scalability.md)

**In Progress:**
9. [Frontend Design & UI/UX Planning](phase-one/09%20-%20Frontend%20Design%20&%20UI-UX%20Planning.md) (Issue #9)

**Additional Guides:**
- [Phase 1.4 Summary](phase-one/PHASE_1.4_SUMMARY.md)
- [Phase 1.5 Manual Guide](phase-one/PHASE_1.5_MANUAL_GUIDE.md)
- [Phase 1.5 Summary](phase-one/PHASE_1.5_SUMMARY.md)
- [Technical Implementation Guide](phase-one/TECHNICAL_IMPLEMENTATION_GUIDE.md)
- [Testing Guide](phase-one/TESTING_GUIDE.md)

#### Phase 2 - Core Implementation (20% Complete)
Located in: `phase-two/`

**Active Tasks:**
1. [Frontend Implementation - Core Module](phase-two/01%20-%20Frontend%20Implementation%20-%20Core%20Module.md) (Issue #12)

**Pending:**
- Backend Ingestion Pipeline (Issue #17)
- Backend RAG Pipeline (Issue #18)
- API Implementation
- Database Implementation
- Deployment Configuration

### Requirements Documentation

Located in: `requirements/`

#### Core Requirements
- [Project Goals and Objectives](requirements/01-project-goals-and-objectives.md)
- [Core Features and Capabilities](requirements/02-core-features-and-capabilities.md)
- [Data Sources and Processing](requirements/03-data-sources-and-processing.md)
- [Provider Abstraction Requirements](requirements/04-provider-abstraction-requirements.md)
- [System Boundaries and Constraints](requirements/05-system-boundaries-and-constraints.md)
- [Success Criteria](requirements/06-success-criteria.md)
- [RAG Pipeline Design](requirements/06-rag-pipeline-design.md)
- [Technology Decisions](requirements/07-technology-decisions.md)
- [Risk Management & Scalability](requirements/08-risk-management-scalability.md)

#### Architecture
Located in: `requirements/architecture/`

- [High-Level Architecture](requirements/architecture/01-high-level-architecture.md)
- [Component Descriptions](requirements/architecture/02-component-descriptions.md)
- [Data Flow Diagrams](requirements/architecture/03-data-flow-diagrams.md)
- [Interface Definitions](requirements/architecture/04-interface-definitions.md)
- [Frontend Architecture](requirements/architecture/05-frontend-architecture.md)

#### Dataset Specifications
Located in: `requirements/dataset/`

- [TSE PDF Sources](requirements/dataset/01-tse-pdf-sources.md)
- [Metadata Schema](requirements/dataset/02-metadata-schema.md)
- [Chunking Strategy](requirements/dataset/03-chunking-strategy.md)
- [Output Formats and Validation](requirements/dataset/04-output-formats-and-validation.md)
- [Data Quality Requirements](requirements/dataset/05-data-quality-requirements.md)

#### Setup Guides
- [Environment Setup Guide](requirements/ENVIRONMENT_SETUP_GUIDE.md)
- [How to Add Providers](requirements/HOW_TO_ADD_PROVIDERS.md)

## Quick Links

### For New Developers
1. Start with [Project Goals and Objectives](requirements/01-project-goals-and-objectives.md)
2. Review [High-Level Architecture](requirements/architecture/01-high-level-architecture.md)
3. Read [Provider Abstraction Requirements](requirements/04-provider-abstraction-requirements.md) (CRITICAL)
4. Follow [Environment Setup Guide](requirements/ENVIRONMENT_SETUP_GUIDE.md)
5. Review [How to Add Providers](requirements/HOW_TO_ADD_PROVIDERS.md)

### For Current Sprint (MVP - Dec 15)
1. [Frontend Design & UI/UX](phase-one/09%20-%20Frontend%20Design%20&%20UI-UX%20Planning.md) (Issue #9)
2. [Backend Ingestion Pipeline](https://github.com/juanpredev13/ticobot/issues/17) (Issue #17)
3. [Backend RAG Pipeline](https://github.com/juanpredev13/ticobot/issues/18) (Issue #18)
4. [Frontend Implementation](phase-two/01%20-%20Frontend%20Implementation%20-%20Core%20Module.md) (Issue #12)

### GitHub Issues
- [View Open Issues](https://github.com/juanpredev13/ticobot/issues)
- [View Closed Issues](https://github.com/juanpredev13/ticobot/issues?q=is%3Aissue+is%3Aclosed)

## Technology Stack

**Backend:**
- Runtime: Node.js 20+ with TypeScript
- Framework: Express.js
- Database: Supabase (PostgreSQL + pgvector)
- Package Manager: pnpm (monorepo)
- Deployment: Railway

**Frontend:**
- Framework: Next.js 16 (App Router)
- Styling: TailwindCSS
- Deployment: Vercel

**AI/ML:**
- Embeddings: OpenAI text-embedding-3-small
- LLM (Dev): OpenAI GPT-4o-mini
- LLM (Prod): DeepSeek (primary) + OpenAI GPT-4o (A/B testing)
- Cost: $20-140 per 10K users

**Architecture Pattern:**
- Clean Architecture with Ports & Adapters
- Provider abstraction for swappable components
- Environment-based configuration

## Key Principles

1. **Provider Abstraction is CRITICAL**
   - All providers (LLM, embedding, vector store, database) must be swappable
   - No vendor lock-in
   - Runtime selection via environment variables

2. **Clean Architecture**
   - Separation of concerns
   - Business logic independent of infrastructure
   - Testability through dependency injection

3. **Performance & Cost**
   - Target: < 3 second query latency
   - Cost optimization through provider selection
   - Caching strategy for common queries

4. **Security**
   - API key management
   - Input validation
   - Rate limiting
   - Error handling

## Contributing

When adding new documentation:
1. Follow the existing structure
2. Update this README with new links
3. Include code examples where applicable
4. Add diagrams for complex concepts
5. Keep documentation in sync with implementation

## Related Documentation

- Main Project Documentation: `../../README.md`
- Backend Code: `../../backend/`
- Frontend Code: `../../frontend/`
- Shared Types: `../../shared/`
- Infrastructure: `../../infra/`

## Support

For questions or clarifications, check:
1. This documentation
2. GitHub Issues
3. CLAUDE.md for AI assistant guidance
4. Code comments and JSDoc
