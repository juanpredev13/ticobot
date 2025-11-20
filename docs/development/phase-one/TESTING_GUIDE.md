# Testing Guide - Provider Abstraction Layer

## Quick Start

### 1. Run Unit Tests (No API Keys Required)

```bash
# Run all tests
pnpm --filter @ticobot/backend test

# Run in watch mode
pnpm --filter @ticobot/backend test -- --watch

# Run specific test file
pnpm --filter @ticobot/backend test -- ProviderFactory
```

**What this tests**:
- ✅ Provider selection based on environment variables
- ✅ Singleton pattern behavior
- ✅ Error handling for missing configuration
- ✅ Factory reset functionality

### 2. Run Manual Integration Tests (Requires API Keys)

```bash
# From project root
pnpm --filter @ticobot/backend tsx src/test-providers.ts
```

**What this tests**:
- ✅ Configuration loading with Zod validation
- ✅ LLM provider initialization
- ✅ Actual API calls (if keys configured)
- ✅ Embedding generation
- ✅ Provider switching
- ✅ Vector store connection

## Detailed Testing Steps

### Test 1: Configuration Validation

**Purpose**: Verify Zod schema validates environment variables correctly

**Steps**:
1. Edit `backend/.env` with invalid values:
   ```bash
   LLM_PROVIDER=invalid-provider
   ```

2. Run test script:
   ```bash
   pnpm --filter @ticobot/backend tsx src/test-providers.ts
   ```

3. **Expected Result**: Clear error message:
   ```
   Environment validation failed:
   LLM_PROVIDER: Invalid enum value. Expected 'openai' | 'anthropic' | ...
   ```

4. Fix the `.env` file and run again - should pass ✅

### Test 2: OpenAI LLM Provider

**Purpose**: Verify OpenAI integration works

**Prerequisites**:
- OpenAI API key

**Steps**:
1. Add your OpenAI key to `backend/.env`:
   ```bash
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...  # Your real API key
   OPENAI_LLM_MODEL=gpt-3.5-turbo  # Use cheaper model for testing
   ```

2. Run test script:
   ```bash
   pnpm --filter @ticobot/backend tsx src/test-providers.ts
   ```

3. **Expected Output**:
   ```
   🤖 Testing LLM Provider...
   Provider: gpt-3.5-turbo
   Context Window: 4096 tokens
   Supports Function Calling: true

   Testing completion...
   Response: Hello from TicoBot! I'm ready to help you.
   Tokens used: 25
   Model: gpt-3.5-turbo-0125

   ✅ LLM Provider test passed!
   ```

### Test 3: DeepSeek LLM Provider

**Purpose**: Verify provider switching works

**Prerequisites**:
- DeepSeek API key

**Steps**:
1. Update `backend/.env`:
   ```bash
   LLM_PROVIDER=deepseek  # Changed from openai
   DEEPSEEK_API_KEY=sk-...  # Your DeepSeek key
   ```

2. Run test script again:
   ```bash
   pnpm --filter @ticobot/backend tsx src/test-providers.ts
   ```

3. **Expected Output**:
   ```
   🤖 Testing LLM Provider...
   Provider: deepseek-chat
   Context Window: 64000 tokens
   Supports Function Calling: true

   Testing completion...
   Response: Hello from TicoBot! ...
   Tokens used: 18
   Model: deepseek-chat

   ✅ LLM Provider test passed!
   ```

4. **Key Observation**: Same test code, different provider - that's the abstraction working! 🎉

### Test 4: Embedding Provider

**Purpose**: Verify embedding generation

**Prerequisites**:
- OpenAI API key

**Steps**:
1. Ensure OpenAI is configured in `.env`:
   ```bash
   EMBEDDING_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

2. Run test script:
   ```bash
   pnpm --filter @ticobot/backend tsx src/test-providers.ts
   ```

3. **Expected Output**:
   ```
   📊 Testing Embedding Provider...
   Provider: text-embedding-3-small
   Dimension: 1536
   Max Input Length: 8191 tokens

   Testing single embedding...
   Embedding length: 1536
   First 5 values: [0.123, -0.456, 0.789, ...]
   Tokens used: 2

   Testing batch embedding...
   Batch size: 3
   Tokens used: 4

   ✅ Embedding Provider test passed!
   ```

### Test 5: Singleton Pattern

**Purpose**: Verify factory reuses instances

**Steps**:
1. Run unit tests:
   ```bash
   pnpm --filter @ticobot/backend test -- ProviderFactory
   ```

2. Look for test: "should return same instance on subsequent calls"

3. **Expected**: Test passes ✅

**What this proves**:
- Factory doesn't recreate providers on every call
- Singleton pattern reduces memory usage
- API client connections are reused

### Test 6: Supabase Vector Store (Optional)

**Purpose**: Verify vector store integration

**Prerequisites**:
- Supabase project
- pgvector extension enabled
- Database schema created

**Setup Database First**:
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table
CREATE TABLE vector_documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX ON vector_documents
USING ivfflat (embedding vector_cosine_ops);

-- Create RPC function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count INT,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vector_documents.id,
    vector_documents.content,
    vector_documents.embedding,
    vector_documents.metadata,
    1 - (vector_documents.embedding <=> query_embedding) AS similarity
  FROM vector_documents
  WHERE (filter = '{}'::jsonb OR metadata @> filter)
  ORDER BY vector_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Then Test**:
1. Add Supabase credentials to `.env`:
   ```bash
   VECTOR_STORE=supabase
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. Run test:
   ```bash
   pnpm --filter @ticobot/backend tsx src/test-providers.ts
   ```

3. **Expected Output**:
   ```
   🗄️  Testing Vector Store...
   Vector Store Type: supabase

   Testing initialization...
   ✅ Vector store initialized
   Documents in store: 0

   ✅ Vector Store test passed!
   ```

## Testing Without API Keys

You can still verify the architecture works without API keys:

### Option 1: Run Unit Tests Only

```bash
pnpm --filter @ticobot/backend test
```

**Tests**:
- Provider factory selection logic ✅
- Singleton pattern ✅
- Error handling ✅
- Instance reset ✅

### Option 2: Test Provider Initialization

```bash
# Set dummy values
echo "OPENAI_API_KEY=sk-test" >> backend/.env
echo "LLM_PROVIDER=openai" >> backend/.env

# Run
pnpm --filter @ticobot/backend tsx src/index.ts
```

**Expected Output**:
```
🚀 TicoBot Backend Starting...
Environment: development
LLM Provider: openai
Embedding Provider: openai
Vector Store: supabase
Database Provider: supabase

✅ Provider abstraction layer ready!
```

This confirms:
- Configuration loads ✅
- Environment validation works ✅
- Providers can be instantiated ✅

## Testing Provider Switching

**Goal**: Prove you can switch providers with zero code changes

### Test Scenario

1. **Start with OpenAI**:
   ```bash
   # backend/.env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

2. **Run test**:
   ```bash
   pnpm --filter @ticobot/backend tsx src/test-providers.ts
   ```
   - Note the provider name and response

3. **Switch to DeepSeek**:
   ```bash
   # backend/.env
   LLM_PROVIDER=deepseek  # Only change needed!
   DEEPSEEK_API_KEY=sk-...
   ```

4. **Run same test again**:
   ```bash
   pnpm --filter @ticobot/backend tsx src/test-providers.ts
   ```
   - Note different provider, same test code

5. **Result**: Different provider used, zero code changes! ✅

## Performance Testing

### Test Lazy Loading

**Hypothesis**: Dynamic imports reduce startup time

**Test**:
```bash
# Time startup with all providers configured
time pnpm --filter @ticobot/backend tsx src/index.ts
```

**Expected**: Fast startup because providers load on-demand, not at import time

### Test Singleton Pattern

**Code**:
```typescript
import { ProviderFactory } from './factory/ProviderFactory.js';

console.time('First call');
const llm1 = await ProviderFactory.getLLMProvider();
console.timeEnd('First call');

console.time('Second call');
const llm2 = await ProviderFactory.getLLMProvider();
console.timeEnd('Second call');
```

**Expected Output**:
```
First call: 250ms    (loads provider)
Second call: 0.1ms   (returns cached instance)
```

## Debugging Failed Tests

### Error: "OPENAI_API_KEY is required"

**Cause**: Missing or invalid API key

**Fix**:
```bash
# Check .env file exists
ls backend/.env

# Check key is set
cat backend/.env | grep OPENAI_API_KEY

# Add valid key
echo "OPENAI_API_KEY=sk-your-real-key" >> backend/.env
```

### Error: "Unknown LLM provider: xyz"

**Cause**: Invalid provider name in .env

**Fix**:
```bash
# Must be one of: openai, deepseek, anthropic, google, ollama
LLM_PROVIDER=openai
```

### Error: "Environment validation failed"

**Cause**: Zod schema validation failed

**Fix**: Read the error message carefully - it tells you exactly what's wrong:
```
LLM_PROVIDER: Invalid enum value. Expected 'openai' | 'deepseek'...
```

### Error: "Supabase vector store not initialized"

**Cause**: Database schema not created

**Fix**: Run the SQL setup (see Test 6 above)

## CI/CD Testing

### GitHub Actions Example

```yaml
name: Test Provider Abstraction

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm --filter @ticobot/backend test

      - name: Build packages
        run: pnpm build

      - name: Test with OpenAI (optional)
        if: github.event_name == 'push'
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LLM_PROVIDER: openai
        run: pnpm --filter @ticobot/backend tsx src/test-providers.ts
```

## Summary Checklist

Before considering Phase 1.4 complete, verify:

- [ ] Unit tests pass: `pnpm --filter @ticobot/backend test`
- [ ] Builds successfully: `pnpm build`
- [ ] Configuration validates: Run with invalid .env
- [ ] OpenAI provider works: Test with real API key
- [ ] Provider switching works: Switch between OpenAI and DeepSeek
- [ ] Singleton pattern works: Verify instances are reused
- [ ] Documentation is clear: Read and follow this guide

## Next Steps

After confirming all tests pass:

1. **Commit test script**: Add `test-providers.ts` to git
2. **Document results**: Note which providers you tested
3. **Move to Phase 1.5**: Backend folder structure setup
4. **Plan RAG pipeline**: Use these providers in actual use cases

---

**Questions?** Check:
- `TECHNICAL_IMPLEMENTATION_GUIDE.md` for architecture details
- `HOW_TO_ADD_PROVIDERS.md` for adding new providers
- `backend/README.md` for usage examples
