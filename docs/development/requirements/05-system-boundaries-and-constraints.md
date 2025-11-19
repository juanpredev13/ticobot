# System Boundaries and Constraints

## What TicoBot WILL DO

### Core Functionality
- Ingest and process Costa Rica's 2026 government plan PDFs from TSE
- Enable semantic search across all indexed content
- Provide comparative analysis between political parties
- Answer user questions with source-grounded responses
- Allow browsing and exploration of government plan content
- Support multiple LLM and vector database providers

### Data Coverage
- All political parties registered with TSE for 2026 elections
- Official government plan documents only (no unofficial sources)
- Spanish language content (primary)
- Structured proposals, platforms, and policy documents

---

## What TicoBot WILL NOT DO

### Out of Scope

1. **Real-time Social Media Analysis**
   - No Twitter/Facebook/Instagram monitoring
   - No candidate social media content ingestion
   - Rationale: Different data structure, quality concerns, scope creep

2. **Campaign News Aggregation**
   - No news article scraping or aggregation
   - No editorial content analysis
   - Rationale: Copyright issues, bias concerns, complexity

3. **Voter Registration or Polling**
   - No voter registration integration
   - No opinion polls or surveys
   - Rationale: Different technical requirements, legal considerations

4. **Direct Candidate Communication**
   - No messaging system for candidates
   - No user-to-candidate contact features
   - Rationale: Security, moderation requirements

5. **Fact-Checking Political Claims**
   - No verification of campaign promises against external data
   - No automated truthfulness scoring
   - Rationale: Requires extensive external data, complex verification

6. **Predictive Analytics**
   - No election outcome predictions
   - No polling aggregation or forecasting
   - Rationale: Different skillset, potential for misinformation

7. **Historical Election Data (Initially)**
   - MVP focuses on 2026 only
   - Historical data is post-MVP enhancement
   - Rationale: Scope management, time constraints

8. **Multi-language Support (Initially)**
   - Spanish only for MVP
   - English translation is post-MVP
   - Rationale: Resource constraints, primary audience is Spanish-speaking

---

## Technical Constraints

### Development Constraints

1. **Budget: Minimal Cost**
   - Free tiers preferred for development
   - Low-cost options for production
   - Target: < $50/month for initial launch
   - Constraint: Limits choice of providers, database size

2. **Timeline: Fast Development**
   - MVP must launch before election cycle heats up
   - Target: 2-3 months for initial version
   - Constraint: Limits feature set, complexity

3. **Team Size: Solo/Small Team**
   - Primarily solo development
   - Limited availability for maintenance
   - Constraint: Requires simple architecture, good documentation

4. **Infrastructure: Serverless/Managed Services**
   - Prefer managed services over self-hosted
   - Minimize DevOps overhead
   - Constraint: Relies on third-party availability

### Technical Constraints

5. **PDF Quality Variability**
   - No control over PDF format or quality from TSE
   - Some PDFs may be scanned images (OCR required)
   - Inconsistent document structures across parties
   - Constraint: Requires robust text extraction, quality validation

6. **Spanish Language Processing**
   - Embedding models must handle Spanish well
   - LLMs must generate quality Spanish responses
   - Constraint: Limits provider choices, may affect quality

7. **Vector Database Limits**
   - Free tier storage limits (e.g., Supabase 500MB)
   - pgvector dimension limits (2000 default, 16000 in dev)
   - Performance degradation beyond certain scale
   - Constraint: Affects chunking strategy, embedding model choice

8. **API Rate Limits**
   - Provider rate limits vary by tier
   - Free tiers have strict limits
   - Burst traffic during debates may hit limits
   - Constraint: Requires caching, queueing, rate limiting

9. **Context Window Limits**
   - LLM context windows vary (4K to 200K tokens)
   - Affects how much context can be provided
   - Larger contexts increase cost significantly
   - Constraint: Affects chunking size, retrieval strategy

10. **Embedding Dimensions**
    - Different models produce different dimensions
    - Changing dimensions requires re-indexing everything
    - Constraint: Choose carefully upfront

---

## Performance Constraints

### Response Time
- Search results: < 2 seconds (target)
- Question answering: < 5 seconds (target)
- PDF ingestion: Can be slow (background process)
- Constraint: Limits complexity of retrieval, re-ranking

### Concurrent Users
- MVP target: 100 concurrent users
- Peak expected: 500-1000 during debates
- Constraint: Requires caching, efficient queries

### Accuracy vs. Speed
- High accuracy is prioritized over speed
- Willing to accept 3-5 second latency for better answers
- Constraint: May limit real-time features

---

## Data Constraints

### Data Freshness
- PDFs updated manually by TSE (not real-time)
- Check for updates daily
- Re-ingestion required for updates
- Constraint: Not suitable for real-time tracking

### Data Quality
- Dependent on quality of TSE PDFs
- Cannot improve source data
- Some content may be unclear or ambiguous
- Constraint: System must handle imperfect data gracefully

### Data Completeness
- Only what parties submit to TSE
- Missing information cannot be filled
- Some parties may have incomplete plans
- Constraint: System should indicate data gaps clearly

---

## Scalability Constraints

### Storage
- Initial dataset: ~20-50 PDFs (~200-300 pages each)
- Estimated chunks: 5,000-15,000
- Vector storage: ~50-150MB (depending on embedding dimension)
- Constraint: Within free tier limits, but little room for growth

### Compute
- Embedding generation for 10K chunks: ~$0.50-$2
- One-time cost for ingestion
- Query costs ongoing but small
- Constraint: Re-ingestion expensive

### Monitoring
- Limited monitoring on free tiers
- Error tracking essential but basic
- Constraint: May miss some issues in production

---

## Legal and Ethical Constraints

### Data Usage
- Only public domain TSE documents
- Must respect TSE copyright/terms
- Proper attribution required
- Constraint: Cannot scrape/use unauthorized content

### Neutrality
- System must be politically neutral
- No bias toward any party in design
- Equal treatment of all parties
- Constraint: Careful prompt engineering, result presentation

### Privacy
- No user tracking beyond basic analytics
- No selling user data
- Minimal data collection
- Constraint: Limits personalization features

### Accuracy
- Must clearly cite sources
- Must not generate false information
- Must indicate confidence/uncertainty
- Constraint: Requires careful RAG design, citation tracking

---

## Dependency Constraints

### External Services
- Dependent on TSE website availability
- Dependent on provider APIs (OpenAI, Claude, etc.)
- Dependent on Supabase uptime
- Constraint: System availability tied to third parties

### API Changes
- Provider APIs may change
- Free tiers may be discontinued
- Pricing may change
- Constraint: Requires monitoring, flexibility

---

## Future Constraints to Consider

### Post-MVP Expansion
- Historical data would require significantly more storage
- Multi-language support requires different embedding models
- Advanced analytics require additional compute
- Mobile apps require different architecture

### Maintenance
- Ongoing cost for hosting, APIs
- Time required for updates, fixes
- Seasonal usage (high during elections, low after)
- Need for sustainable business model
