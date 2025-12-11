# pgvector Embedding Fix & RAG Sources Integration

**Date:** December 11, 2025
**Status:** ✅ Completed
**Branch:** `phase-2/frontend-backend-integration`
**Commits:** `96a207d`, `94c5747`

## Overview

Critical fix for pgvector embedding format incompatibility and comprehensive RAG sources integration across frontend and backend. This work resolves vector search failures and enables full source attribution in chat responses.

## Problem Statement

### 1. pgvector Format Incompatibility
The Supabase pgvector extension expects embeddings in string format `'[x,y,z]'` (no spaces), but the codebase was passing JavaScript arrays. This caused:
- Vector search failures
- match_chunks() RPC function errors
- Inconsistent search results

### 2. Incomplete Source Attribution
Chat responses lacked complete source metadata:
- Missing party information
- Missing document titles
- Missing page numbers
- Sources not displaying in frontend streaming mode

## Solution Implemented

### Backend Changes

#### 1. SupabaseVectorStore.ts - Critical Fix

**Problem:** Embedding arrays not converted to pgvector format

**Solution:**
```typescript
/**
 * Convert embedding array to pgvector format string
 * pgvector expects format: '[0.1,0.2,0.3]' (no spaces)
 */
private embeddingToVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
```

**Changes:**
- ✅ Added `embeddingToVector()` method for proper format conversion
- ✅ Convert embeddings during storage operations
- ✅ Convert query embeddings during search operations
- ✅ Enhanced search results with JOIN to documents table
- ✅ Enriched metadata with party_name, title, documentId

**Before:**
```typescript
embedding: doc.embedding  // Plain array
```

**After:**
```typescript
embedding: this.embeddingToVector(doc.embedding)  // '[0.1,0.2,...]'
```

#### 2. RAGPipeline.ts - Source Enrichment

**Added Fields:**
- `pageNumber` - Exact page number of source chunk
- `pageRange` - Page range if chunk spans multiple pages

**Code:**
```typescript
pageNumber: result.document.metadata?.pageNumber,
pageRange: result.document.metadata?.pageRange,
```

#### 3. chat.ts Routes - Relevance & Streaming

**Changes:**
- 🔄 Reduced `minRelevanceScore` from 0.35 to 0.1 (more permissive)
- ✅ Added `content` field to sources in streaming response
- 🔧 Fixed relevance score mapping: `source.relevance || 0`

**Rationale:** Lower threshold retrieves more potentially relevant chunks. LLM can filter irrelevant ones during context building.

#### 4. index.ts - Auto-start Server

**Before:** Manual server start required

**After:**
```typescript
const port = parseInt(env.PORT as string) || 3001;
startServer(port);
```

#### 5. Migrations

**New Migration:** `20251210_fix_embedding_column.sql`
- Ensures embedding column is correct pgvector type
- Validates existing data format
- Updates constraints if needed

### Frontend Changes

#### 1. use-chat-stream.ts Hook - State Management

**Added:**
```typescript
const [sources, setSources] = useState<ChatResponse['sources'] | null>(null);

// In onComplete callback
setSources(response.sources || null);

// In reset function
setSources(null);

// Return value
return { ..., sources };
```

**Purpose:** Track and expose sources received during streaming

#### 2. chat/page.tsx - Full Integration

**Changes:**
- ✅ Extract sources from `useChatStream()` hook
- ✅ Map sources to Message format with proper types
- ✅ useEffect to update sources when stream completes
- ✅ Include metadata: party, page, document

**Source Mapping:**
```typescript
const mappedSources = data.sources?.map(source => ({
  title: source.document || source.documentId || 'Documento',
  content: source.excerpt || '',
  score: source.score || 0,
  metadata: {
    party: source.party || '',
    page: source.page ? (typeof source.page === 'number' ? source.page : parseInt(source.page)) : undefined,
    document: source.document || source.documentId || '',
  }
})) || []
```

#### 3. API Types & Services

**Updated Interface:**
```typescript
export interface Source {
  documentId: string;
  party: string;
  excerpt: string;
  score: number;
  chunkId?: string;
  document?: string;    // ✨ NEW
  page?: string | number;  // ✨ NEW
}
```

**Service Updates:**
- Map `document` and `page` fields from backend
- Proper handling in both regular and streaming responses

#### 4. database-status.tsx - New Component

**Features:**
- 📊 Dashboard showing database ingestion status
- 📈 Summary cards: total documents, chunks, parties
- 📋 Table of chunks by party with ingestion status
- 📄 List of documents with metadata
- 🔄 Refresh button for real-time updates

**Usage:** Admin page for monitoring ingestion progress

### Diagnostic Scripts Added

Created 7 diagnostic scripts for troubleshooting:

1. **checkCloudEmbeddingType.ts** - Verify cloud embedding types
2. **checkColumnSchema.ts** - Check database column schemas
3. **checkColumnType.ts** - Validate column types
4. **checkTop5Chunks.ts** - Inspect top 5 chunks structure
5. **debugVectorSearch.ts** - Debug vector search functionality
6. **testMatchChunks.ts** - Test chunk matching
7. **testRealQuery.ts** - Test real query execution

## Technical Details

### pgvector Format Requirements

Supabase pgvector extension requires:
- String format: `'[val1,val2,val3]'`
- No spaces between values
- Proper escaping in SQL

**Invalid:**
```sql
-- JSON array (doesn't work)
SELECT * FROM match_chunks([0.1, 0.2, 0.3], 5);

-- Array with spaces (doesn't work)
SELECT * FROM match_chunks('[0.1, 0.2, 0.3]', 5);
```

**Valid:**
```sql
-- Compact string format (works!)
SELECT * FROM match_chunks('[0.1,0.2,0.3]', 5);
```

### Database Schema

**Enrichment JOIN:**
```typescript
const { data: documentsData } = await this.client
  .from('documents')
  .select('id, party_id, party_name, title, document_id')
  .in('id', documentIds);
```

This enriches chunks with party metadata not stored in chunks table.

### Performance Considerations

- JOIN only fetches unique document IDs (deduped)
- Results cached in Map for O(1) lookup
- No N+1 query problem (batch fetch)

## Files Changed

### Modified (12 files)
- `backend/package.json` - Dependencies
- `backend/src/api/routes/chat.ts` - Route handlers
- `backend/src/index.ts` - Server startup
- `backend/src/providers/vector/SupabaseVectorStore.ts` - Vector store fix
- `backend/src/rag/components/RAGPipeline.ts` - Source enrichment
- `backend/supabase/migrations/20251204170821_initial_schema.sql` - Schema update
- `frontend/app/admin/page.tsx` - Admin dashboard
- `frontend/app/chat/page.tsx` - Chat integration
- `frontend/lib/api/services/chat.ts` - API service
- `frontend/lib/api/types.ts` - TypeScript types
- `frontend/lib/hooks/use-chat-stream.ts` - Streaming hook
- `pnpm-lock.yaml` - Lockfile

### New Files (9 files)
- 7 diagnostic scripts (see above)
- `backend/supabase/migrations/20251210_fix_embedding_column.sql`
- `frontend/components/database-status.tsx`

**Total Changes:** +1003 lines, -32 lines

## Testing

### Manual Testing Steps

1. **Test Vector Search:**
```bash
pnpm tsx backend/src/scripts/testRealQuery.ts
```

2. **Verify Embedding Format:**
```bash
pnpm tsx backend/src/scripts/checkColumnType.ts
```

3. **Test Chat with Sources:**
   - Navigate to `/chat`
   - Send a query
   - Verify sources display with party, document, page

4. **Check Database Status:**
   - Navigate to `/admin`
   - Verify chunk counts by party
   - Verify ingestion status

### Expected Results

- ✅ Vector search returns relevant results
- ✅ Sources include complete metadata
- ✅ Streaming shows sources after completion
- ✅ Admin dashboard displays accurate stats

## Repository Cleanup

### .gitignore Updates

**Added Rules:**
```gitignore
# Development/temporary scripts and migrations
backend/migrations/
backend/src/scripts/*
!backend/src/scripts/applyMigration.ts
!backend/src/scripts/checkSupabaseTables.ts
!backend/src/scripts/ingestAllPlans.ts
!backend/src/scripts/reIngestAllPlans.ts
!backend/src/scripts/README.md
!backend/src/scripts/checkCloudEmbeddingType.ts
!backend/src/scripts/checkColumnSchema.ts
!backend/src/scripts/checkColumnType.ts
!backend/src/scripts/checkTop5Chunks.ts
!backend/src/scripts/debugVectorSearch.ts
!backend/src/scripts/testMatchChunks.ts
!backend/src/scripts/testRealQuery.ts
```

**Rationale:** Keep repository clean while preserving diagnostic and production scripts.

**Excluded (not committed):**
- Fix scripts (fixEmbedding*, fix_match_function.sql)
- Ingestion utility scripts (ingestOnePLN, ingestTop5)
- Temporary migrations (backend/migrations/)
- Utility runners (runFixMatchFunction, runMigration)

## Impact

### Before This Fix
- ❌ Vector search failing due to format mismatch
- ❌ Inconsistent search results
- ❌ Sources missing metadata
- ❌ Frontend not displaying sources in streaming

### After This Fix
- ✅ Vector search working correctly
- ✅ Consistent, relevant search results
- ✅ Complete source attribution
- ✅ Full streaming integration with sources
- ✅ Admin monitoring dashboard

## Next Steps

1. **Monitor Performance:**
   - Track vector search latency
   - Monitor JOIN query performance
   - Optimize if needed with indexes

2. **User Testing:**
   - Test with real queries
   - Verify source relevance
   - Gather feedback on source display

3. **Documentation:**
   - Update API documentation
   - Document diagnostic script usage
   - Add troubleshooting guide

4. **Deployment:**
   - Test migration on staging
   - Verify embedding format in production
   - Monitor for any format-related errors

## Related Issues

- Fixes vector search failures
- Resolves source attribution gaps
- Enables admin monitoring capabilities

## References

- [Supabase pgvector Documentation](https://supabase.com/docs/guides/database/extensions/pgvector)
- [PostgreSQL pgvector Extension](https://github.com/pgvector/pgvector)
- Backend implementation: backend/src/providers/vector/SupabaseVectorStore.ts:10-209
- Frontend integration: frontend/app/chat/page.tsx:154-220

---

**Status:** Ready for merge
**Reviewed:** ✅
**Tested:** ✅
**Documented:** ✅
