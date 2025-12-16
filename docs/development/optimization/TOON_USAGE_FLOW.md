# TOON Usage in RAG Pipeline

## 📍 Where TOON is Used

TOON is used in the **Pre-RAG Query Processing** stage, specifically in the `QueryProcessor` component.

## 🔄 Complete RAG Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER QUERY                                   │
│         "¿Qué propone el PLN sobre educación?"                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: PRE-RAG QUERY PROCESSING (QueryProcessor)              │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  🎯 TOON IS USED HERE                                          │
│                                                                 │
│  1.1 Send query to LLM with TOON prompt:                       │
│      ┌─────────────────────────────────────────────┐           │
│      │ System Prompt (TOON format):                │           │
│      │ "Devuelve SOLO TOON con este formato:      │           │
│      │  keywords: palabra1,palabra2               │           │
│      │  entities: entidad1,entidad2               │           │
│      │  intent: question|comparison|lookup        │           │
│      │  enhancedQuery: versión expandida..."     │           │
│      └─────────────────────────────────────────────┘           │
│                                                                 │
│  1.2 LLM responds in TOON format:                              │
│      ┌─────────────────────────────────────────────┐           │
│      │ keywords: propuestas,educación,pln         │           │
│      │ entities: PLN,Partido Liberación Nacional  │           │
│      │ intent: question                           │           │
│      │ enhancedQuery: ¿Cuáles son las propuestas...│           │
│      └─────────────────────────────────────────────┘           │
│                                                                 │
│  1.3 Parse TOON response:                                      │
│      - parseTOON() from utils/toon.ts                          │
│      - validateTOON() to check required fields                 │
│      - Fallback to JSON if TOON parsing fails                 │
│                                                                 │
│  Output: ProcessedQuery {                                      │
│    keywords: ["propuestas", "educación", "pln"],               │
│    entities: ["PLN"],                                          │
│    intent: "question",                                         │
│    enhancedQuery: "¿Cuáles son las propuestas..."              │
│  }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: QUERY EMBEDDING (QueryEmbedder)                       │
│  ────────────────────────────────────────────────────────────  │
│  - Generate embedding vector for enhanced query                │
│  - Uses OpenAI/DeepSeek embedding provider                    │
│  - NO TOON HERE (embeddings use plain text)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: HYBRID SEARCH (SemanticSearcher)                      │
│  ────────────────────────────────────────────────────────────  │
│  - Uses processed keywords from Step 1                         │
│  - Combines vector similarity + keyword matching               │
│  - searchHybrid() uses buildSearchText() which includes       │
│    keywords and entities extracted via TOON                    │
│  - NO TOON HERE (uses extracted data, not TOON format)         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: CONTEXT BUILDING (ContextBuilder)                      │
│  ────────────────────────────────────────────────────────────  │
│  - Formats search results into context for LLM                 │
│  - NO TOON HERE (plain text context)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: RESPONSE GENERATION (ResponseGenerator)               │
│  ────────────────────────────────────────────────────────────  │
│  - Generates final answer using LLM                            │
│  - NO TOON HERE (plain text prompts and responses)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FINAL RESPONSE                               │
│  Answer + Sources + Metadata                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Detailed TOON Usage

### Location: `QueryProcessor.processQuery()`

**File:** `backend/src/rag/components/QueryProcessor.ts`

**When it's called:**
- From `SemanticSearcher.searchHybrid()` (line 212)
- Before vector search to enhance query with keywords

**TOON Usage Flow:**

```typescript
// 1. Build prompt with TOON format instructions
const systemPrompt = `Devuelve SOLO TOON (Token-Oriented Object Notation) con este formato:
keywords: palabra1,palabra2,palabra3
entities: entidad1,entidad2
intent: question|comparison|lookup
enhancedQuery: versión expandida...`;

// 2. Send to LLM
const response = await llmProvider.generateCompletion([
    { role: 'system', content: systemPrompt },  // ← TOON format here
    { role: 'user', content: userPrompt }
]);

// 3. Parse TOON response
let parsed = this.parseTOONResponse(response.content);  // ← Uses parseTOON()
// parseTOON() is in backend/src/rag/utils/toon.ts

// 4. Fallback to JSON if TOON fails
if (!parsed) {
    parsed = this.parseJSONResponse(response.content);
}
```

## 📊 Token Savings

### Before (JSON):
```
Prompt: ~180 tokens
Response: ~45 tokens
Total: ~225 tokens per query
```

### After (TOON):
```
Prompt: ~120 tokens (-33%)
Response: ~30 tokens (-33%)
Total: ~150 tokens per query (-33%)
```

## 🔍 Where TOON is NOT Used

1. **Embedding Generation** - Uses plain text, not structured data
2. **Vector Search** - Uses embeddings and plain text keywords
3. **Context Building** - Plain text formatting
4. **Response Generation** - Plain text prompts and responses
5. **Database Storage** - JSONB format in Supabase

## 🚀 Why Only in QueryProcessor?

TOON is specifically designed for **structured data exchange with LLMs**. In the RAG pipeline:

- **QueryProcessor** sends/receives structured data (keywords, entities, intent) → **Uses TOON** ✅
- **Other components** use plain text or embeddings → **No TOON needed** ❌

## 📝 Summary

**TOON is used in:**
- ✅ `QueryProcessor.processQuery()` - Pre-RAG query enhancement
- ✅ Prompt instructions to LLM (system prompt)
- ✅ Parsing LLM response (parseTOON utility)

**TOON is NOT used in:**
- ❌ Embedding generation
- ❌ Vector search
- ❌ Context building
- ❌ Response generation
- ❌ Database storage

**Impact:** Reduces tokens by ~33% in the query processing step, which happens before every RAG query.


