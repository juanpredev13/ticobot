# Implement TOON Format for LLM Token Optimization

## 🎯 Objective

Implement TOON (Token-Oriented Object Notation) format throughout the codebase to reduce token usage in LLM interactions by 30-60%, resulting in lower API costs and improved efficiency.

## 📋 Context

Currently, the codebase uses JSON format when sending structured data to LLMs (e.g., in `QueryProcessor`). TOON is a more compact format designed specifically for LLM interactions that can significantly reduce token consumption.

**Current Status:**
- Basic TOON implementation exists in `QueryProcessor.ts` with a custom parser
- Prompt uses TOON format but parser is simplified
- No official TOON library integration

## ✅ Benefits

1. **Token Reduction**: 30-60% fewer tokens in prompts and responses
2. **Cost Savings**: Lower API costs for LLM calls
3. **Better Efficiency**: More data can fit in context windows
4. **Standard Compliance**: Use official TOON specification

## 🔧 Implementation Plan

### Phase 1: Install Official TOON Library

```bash
pnpm add @toon-format/toon
```

### Phase 2: Update QueryProcessor

**File:** `backend/src/rag/components/QueryProcessor.ts`

**Changes:**
- Replace custom TOON parser with official `@toon-format/toon` library
- Ensure proper encoding/decoding of TOON format
- Maintain JSON fallback for compatibility

**Current Implementation:**
```typescript
private parseTOONResponse(text: string): any {
    // Custom parser implementation
}
```

**Proposed:**
```typescript
import { decode } from '@toon-format/toon';

private parseTOONResponse(text: string): any {
    try {
        const cleaned = this.cleanMarkdownBlocks(text);
        return decode(cleaned);
    } catch (error) {
        // Fallback to JSON
        return this.parseJSONResponse(text);
    }
}
```

### Phase 3: Extend to Other Components

**Potential areas:**
- `ResponseGenerator.ts` - If sending structured data to LLM
- `RAGPipeline.ts` - Context formatting
- API responses that include structured metadata sent to LLMs

### Phase 4: Testing & Validation

- [ ] Test TOON encoding/decoding with official library
- [ ] Verify token reduction (measure before/after)
- [ ] Ensure backward compatibility (JSON fallback works)
- [ ] Test with different LLM providers (OpenAI, DeepSeek)

## 📊 Expected Impact

### Token Savings Example

**Before (JSON):**
```json
{
  "keywords": ["propuestas", "educación", "pln"],
  "entities": ["PLN"],
  "intent": "question",
  "enhancedQuery": "¿Cuáles son las propuestas del PLN?"
}
```
**Tokens:** ~45

**After (TOON):**
```
keywords: propuestas,educación,pln
entities: PLN
intent: question
enhancedQuery: ¿Cuáles son las propuestas del PLN?
```
**Tokens:** ~30 (33% reduction)

### Cost Impact

**Per 1,000 queries:**
- Token savings: ~75,000 tokens
- Cost savings: ~$0.0015 (OpenAI) or proportional with DeepSeek

## 🔗 References

- [TOON Official Repository](https://github.com/toon-format/toon)
- [TOON NPM Package](https://www.npmjs.com/package/@toon-format/toon)
- [TOON Specification](https://github.com/toon-format/toon#readme)

## 📝 Acceptance Criteria

- [ ] Official `@toon-format/toon` library installed
- [ ] `QueryProcessor` uses official TOON library
- [ ] JSON fallback maintained for compatibility
- [ ] Token reduction verified (30%+ savings)
- [ ] All existing tests pass
- [ ] Documentation updated

## 🚀 Priority

**Medium** - Optimization that reduces costs but doesn't affect functionality

## 🔄 Related Issues

- Current basic TOON implementation in `QueryProcessor.ts`
- Token optimization efforts

## 📌 Notes

- TOON is specifically designed for LLM interactions
- Maintains compatibility with JSON data model
- Official library ensures spec compliance
- Can be extended to other LLM interaction points in the future


