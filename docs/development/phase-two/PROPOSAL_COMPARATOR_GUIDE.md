# Proposal Comparator Feature Guide

## Overview

The Proposal Comparator feature allows users to compare political party proposals on specific topics using Retrieval-Augmented Generation (RAG). This feature automatically extracts relevant information from party government plans and presents side-by-side comparisons with proposal states (Complete, Partial, Unclear, No Information).

## Feature Description

The Proposal Comparator enables citizens to:
- Select multiple parties (up to 4) for comparison
- Search for specific topics (e.g., "Seguridad", "Educación", "Economía")
- View side-by-side comparisons of party proposals
- See proposal states indicating completeness of information
- Access source documents with page numbers and relevance scores

## Architecture

### Backend Components

#### API Endpoint: `/api/compare`

**Location**: `backend/src/api/routes/compare.ts`

**Method**: `POST`

**Request Schema**:
```typescript
{
  topic: string;              // Required: Topic to compare (e.g., "Seguridad")
  partyIds: string[];         // Required: Array of party slugs (1-4 parties)
  topKPerParty?: number;       // Optional: Top K chunks per party (default: 5)
  temperature?: number;        // Optional: LLM temperature (default: 0.7)
}
```

**Response Schema**:
```typescript
{
  topic: string;
  comparisons: Array<{
    party: {
      id: string;
      name: string;
      slug: string;
      abbreviation?: string;
      colors?: {
        primary: string;
        secondary: string;
      };
    };
    answer: string;            // LLM-generated answer
    state: 'completa' | 'parcial' | 'poco_clara' | 'sin_informacion';
    stateLabel: string;        // Human-readable label
    confidence: number;        // Confidence score (0-1)
    sources: Array<{
      content: string;
      relevance: number;
      pageNumber?: number;
      pageRange?: string;
      documentId: string;
      chunkId: string;
    }>;
  }>;
  metadata: {
    totalParties: number;
    timestamp: string;
    cached: boolean;
    processingTime: number;
  };
}
```

#### RAG Integration

The comparator uses the `RAGPipeline.compareParties()` method which:
1. Generates embeddings for the topic query
2. Performs semantic search across selected party documents
3. Retrieves top K relevant chunks per party
4. Generates LLM responses with context
5. Determines proposal states based on answer quality

**Location**: `backend/src/rag/components/RAGPipeline.ts`

#### Caching Service

**Location**: `backend/src/db/services/comparisons-cache.service.ts`

The caching service stores comparison results to avoid redundant RAG processing:
- **Table**: `comparisons_cache`
- **Key**: Hash of topic + sorted party IDs
- **Expiration**: Configurable (default: 7 days)
- **Benefits**: Reduces API calls and processing time by ~30-40 seconds

**Cache Schema**:
```sql
CREATE TABLE comparisons_cache (
  id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  party_ids TEXT[] NOT NULL,
  topic_hash TEXT NOT NULL,
  party_ids_hash TEXT NOT NULL,
  comparisons JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (topic_hash, party_ids_hash)
);
```

### Frontend Components

#### Comparison Page

**Location**: `frontend/app/compare/page.tsx`

**Features**:
- Dynamic party selector (up to 4 parties)
- Topic search input
- Comparison results display with:
  - Party cards with colors and abbreviations
  - Proposal states with icons and badges
  - Source citations with page numbers
  - Relevance scores
- Loading states
- Error handling

#### React Query Hook

**Location**: `frontend/lib/hooks/use-compare.ts`

**Usage**:
```typescript
const { mutate: compareProposals, isPending, data } = useCompareProposals();

compareProposals({
  topic: "Seguridad",
  partyIds: ["pln", "pusc", "frente-amplio"],
  topKPerParty: 5,
  temperature: 0.7
});
```

#### API Service

**Location**: `frontend/lib/api/services/compare.ts`

Handles HTTP requests to the comparison endpoint with extended timeout (60 seconds).

## Proposal States

The system classifies proposals into four states:

1. **Completa** (Complete)
   - State value: `'completa'`
   - Label: "Completa"
   - Description: Party has a complete and clear proposal on the topic
   - Badge variant: `default` (green)

2. **Parcial** (Partial)
   - State value: `'parcial'`
   - Label: "Parcial"
   - Description: Party has some information but proposal is incomplete
   - Badge variant: `secondary` (gray)

3. **Poco clara** (Unclear)
   - State value: `'poco_clara'`
   - Label: "Poco clara"
   - Description: Proposal exists but is unclear or vague
   - Badge variant: `outline` (yellow)

4. **Sin información** (No Information)
   - State value: `'sin_informacion'`
   - Label: "Sin información"
   - Description: No relevant information found in party documents
   - Badge variant: `destructive` (red)

### State Determination Logic

States are determined by the LLM based on:
- Completeness of retrieved context
- Clarity of the generated answer
- Confidence score
- Presence of specific proposals vs. general statements

**Location**: `backend/src/api/routes/compare.ts` - `determineProposalState()` function

## Usage Examples

### Backend API Call

```bash
curl -X POST http://localhost:3001/api/compare \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Seguridad",
    "partyIds": ["pln", "pusc", "frente-amplio"],
    "topKPerParty": 5,
    "temperature": 0.7
  }'
```

### Frontend Usage

```typescript
import { useCompareProposals } from '@/lib/hooks/use-compare';

function ComparePage() {
  const { mutate: compare, data, isPending } = useCompareProposals();
  
  const handleCompare = () => {
    compare({
      topic: "Seguridad",
      partyIds: ["pln", "pusc"],
    });
  };
  
  return (
    // UI implementation
  );
}
```

## Pre-computation Script

A script is available to pre-compute common comparisons and populate the cache:

**Location**: `backend/scripts/precompute-comparisons.ts`

**Usage**:
```bash
pnpm --filter backend precompute:comparisons
```

**Configuration**:
- Topics are defined in the script
- Party combinations are automatically generated
- Results are cached for faster future access

## Database Migration

To enable the caching feature, run the migration:

```bash
npx supabase db push
```

Or manually apply:
```bash
npx supabase migration up
```

**Migration file**: `backend/supabase/migrations/20251215000000_create_comparisons_cache.sql`

## Performance Considerations

### Caching Benefits

- **First request**: ~30-40 seconds (RAG processing)
- **Cached request**: ~100-500ms (database lookup)
- **Time saved**: ~30-40 seconds per cached comparison

### Optimization Tips

1. **Pre-compute common comparisons** using the pre-computation script
2. **Adjust `topKPerParty`** based on topic complexity (default: 5)
3. **Use appropriate `temperature`** for answer quality vs. creativity balance
4. **Monitor cache hit rates** to identify popular comparisons

## Error Handling

### Common Errors

1. **Validation Error (400)**
   - Missing required fields (`topic`, `partyIds`)
   - Invalid party IDs
   - Too many parties (>4)

2. **Not Found (404)**
   - Party not found in database

3. **Server Error (500)**
   - RAG pipeline failure
   - LLM provider error
   - Database connection issues

### Frontend Error Handling

The `useCompareProposals` hook automatically:
- Displays error toasts
- Logs errors to console
- Handles network timeouts (60s)

## Testing

### Manual Testing

1. **Test party selection**:
   - Select 1-4 parties
   - Verify party names and abbreviations display correctly

2. **Test topic search**:
   - Enter various topics (e.g., "Seguridad", "Educación")
   - Verify results are relevant

3. **Test caching**:
   - Make same comparison twice
   - Verify second request is faster (check logs for cache hit)

4. **Test proposal states**:
   - Compare parties on different topics
   - Verify states are correctly displayed

### Integration Testing

```bash
# Run backend tests
pnpm --filter backend test

# Run frontend tests
pnpm --filter frontend test
```

## Future Enhancements

Potential improvements:
- [ ] Export comparisons to PDF
- [ ] Share comparison links
- [ ] Comparison history
- [ ] Advanced filtering options
- [ ] Comparison analytics
- [ ] Multi-language support

## Related Documentation

- [RAG Pipeline Guide](./03-Backend-RAG-Pipeline.md)
- [API Reference](../api/API-Reference.md)
- [Frontend Implementation Guide](./01%20-%20Frontend%20Implementation%20-%20Core%20Module.md)

## Issue Reference

This feature implements [Issue #44](https://github.com/juanpredev13/ticobot/issues/44)

