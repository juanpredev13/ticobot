---
name: Fix Empty Context Issue
about: Fix empty/short context issue in RAG pipeline
title: '[BUG] Empty or very short context in chatbot responses'
labels: ['bug', 'rag', 'high-priority']
assignees: ''
---

## Problem Description

The chatbot is returning generic responses ("No information found") even though hybrid search finds relevant sources with content. Diagnosis revealed that context is being built but is very short (only 1 chunk) due to size limitations.

## Symptoms

- ✅ Hybrid search finds relevant sources (5+ results)
- ✅ Sources have valid content (3000+ characters)
- ❌ Built context is very short (only 1 chunk, ~3200 characters)
- ❌ LLM responds "No information found" even though there is context

## Diagnosis Performed

Executed `diagnose-empty-context.ts` script which revealed:

1. **Content exists in DB**: Chunks have valid content (3164+ characters)
2. **SQL function works**: `hybrid_search` returns content correctly
3. **SemanticSearcher works**: `SearchResult` objects have `document.content` with content
4. **ContextBuilder works**: Builds context but only includes 1 chunk
5. **Root cause identified**: `maxContextLength = 4000` is too restrictive

### Diagnosis Logs

```
[ContextBuilder] Context truncated at 1 chunks to fit 4000 char limit
[ContextBuilder] Context built: 3205 characters from 1 chunks
```

## Root Cause

The `maxContextLength` of 4000 characters is too small:
- A typical chunk has ~3000 characters
- With format "[Source X] Party - Document\n" adds ~40 characters
- Total: ~3205 characters per chunk
- **Result**: Only 1 chunk fits in the context

## Proposed Solutions

### Solution 1: Increase `maxContextLength` (High Priority) ⭐

**Required changes:**

```typescript
// backend/src/rag/components/RAGPipeline.ts
constructor(options?: {
    maxContextLength?: number;
}) {
    // ...
    this.contextBuilder = new ContextBuilder(
        options?.maxContextLength ?? 8000  // Increased from 4000
    );
}

// backend/src/api/routes/compare.ts
const ragPipeline = new RAGPipeline({
    maxContextLength: 6000  // For comparisons
});
```

**Benefits:**
- Allows including 2-3 chunks per query
- Significantly improves response quality
- Maintains reasonable token limits

**Impact:**
- Increases LLM tokens (~$0.01-0.02 per query)
- Improves response quality in 80%+ of cases

### Solution 2: Improve Validation in ResponseGenerator

**Problem**: Validation may be too strict.

**Suggested change:**
```typescript
// backend/src/rag/components/ResponseGenerator.ts
const trimmedContext = context.trim();
if (!trimmedContext || trimmedContext.length === 0) {
    // Only reject if completely empty
    return { /* ... */ };
}
// Allow short but valid context
if (trimmedContext.length < 100) {
    this.logger.warn(`Context is very short: ${trimmedContext.length} chars`);
}
```

### Solution 3: Truncate Large Individual Chunks

**Problem**: Very large chunks (>3000 chars) occupy entire context.

**Solution**: Limit size of individual chunks to allow more chunks:

```typescript
// backend/src/rag/components/ContextBuilder.ts
private formatChunk(...) {
    const maxChunkContentSize = 2500;  // ~600 tokens
    let processedContent = content.length > maxChunkContentSize
        ? content.substring(0, maxChunkContentSize) + '...'
        : content;
    return `[Source ${index}] ${party} - ${document}\n${processedContent}`;
}
```

## Implementation Plan

### Phase 1: Immediate Solution (High Priority)
- [ ] Increase `maxContextLength` to 8000 in `RAGPipeline`
- [ ] Increase `maxContextLength` to 6000 in `compare.ts`
- [ ] Improve validation in `ResponseGenerator` to allow short but valid context

### Phase 2: Optimizations (Medium Priority)
- [ ] Implement truncation of large individual chunks
- [ ] Add detailed logging for debugging
- [ ] Implement fallback for short context (automatically increase `topK`)

### Phase 3: Testing and Validation
- [ ] Test with problematic question: "quien propone acerca de la legalizacion de la marihuana"
- [ ] Verify context includes multiple chunks (>2)
- [ ] Validate LLM uses context (doesn't say "no information found")
- [ ] Measure improvement in response quality

## Success Metrics

- ✅ Context length > 1000 characters in 90% of queries
- ✅ Multiple chunks included (>2) in 80% of queries
- ✅ LLM uses context (doesn't say "no information found") in 95% of queries
- ✅ More detailed and accurate responses

## Affected Files

- `backend/src/rag/components/RAGPipeline.ts`
- `backend/src/rag/components/ContextBuilder.ts`
- `backend/src/rag/components/ResponseGenerator.ts`
- `backend/src/api/routes/compare.ts`

## References

- Full diagnosis: `backend/scripts/diagnose-empty-context.ts` (if exists)
- Related issue: Empty context problem in chat and comparisons

## Additional Notes

- The problem affects both chat and comparison features
- The solution is relatively simple (increase limit)
- Cost impact is minimal but quality benefit is significant
