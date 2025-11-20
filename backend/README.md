# TicoBot Backend

Backend API and data processing for TicoBot - an intelligent platform for analyzing Costa Rica's 2026 Government Plans.

## Features

- ✅ **Provider Abstraction Layer** - Switch between LLM, embedding, vector, and database providers via configuration
- ✅ **Modern TypeScript** - ESM modules with strict typing
- ✅ **Environment-based Configuration** - Zod schema validation
- ✅ **Factory Pattern** - Singleton providers with lazy loading
- ✅ **Multiple LLM Support** - OpenAI GPT-4 and DeepSeek
- ✅ **Vector Store Integration** - Supabase pgvector support
- ✅ **Extensible Architecture** - Easy to add new providers

## Quick Start

### 1. Install Dependencies

```bash
# From project root
pnpm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit with your API keys
nano backend/.env
```

### 3. Build

```bash
# Build shared types first
pnpm --filter @ticobot/shared build

# Build backend
pnpm --filter @ticobot/backend build
```

### 4. Run

```bash
# Development mode with auto-reload
pnpm --filter @ticobot/backend dev

# Production mode
pnpm --filter @ticobot/backend start
```

## Provider Configuration

### Switching LLM Providers

**Use OpenAI:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_LLM_MODEL=gpt-4-turbo-preview
```

**Use DeepSeek:**
```bash
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat
```

### Switching Embedding Providers

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Switching Vector Stores

```bash
VECTOR_STORE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment validation with Zod
│   ├── factory/
│   │   ├── ProviderFactory.ts  # Provider factory with singleton pattern
│   │   └── ProviderFactory.test.ts
│   ├── providers/
│   │   ├── embedding/
│   │   │   └── OpenAIEmbeddingProvider.ts
│   │   ├── llm/
│   │   │   ├── OpenAILLMProvider.ts
│   │   │   └── DeepSeekLLMProvider.ts
│   │   ├── vector/
│   │   │   └── SupabaseVectorStore.ts
│   │   └── database/
│   └── index.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Adding New Providers

See [HOW_TO_ADD_PROVIDERS.md](../docs/development/requirements/HOW_TO_ADD_PROVIDERS.md) for detailed instructions.

### Quick Example: Adding a New LLM Provider

1. **Update env.ts**: Add to `LLM_PROVIDER` enum
2. **Create provider**: Implement `ILLMProvider` interface
3. **Register in factory**: Add case to `ProviderFactory.getLLMProvider()`
4. **Add dependencies**: `pnpm --filter backend add your-sdk`
5. **Update .env**: Set `LLM_PROVIDER=your-provider`

## Testing

```bash
# Run tests
pnpm --filter @ticobot/backend test

# Run tests in watch mode
pnpm --filter @ticobot/backend test -- --watch

# Run specific test file
pnpm --filter @ticobot/backend test -- ProviderFactory.test.ts
```

## Architecture

The backend follows **Clean Architecture** principles with the **Ports & Adapters** pattern:

- **Interfaces (Ports)**: Defined in `@ticobot/shared`
  - `ILLMProvider` - Language model contract
  - `IEmbeddingProvider` - Embedding generation contract
  - `IVectorStore` - Vector database contract
  - `IDatabaseProvider` - Data persistence contract

- **Implementations (Adapters)**: Located in `src/providers/`
  - Each provider implements its respective interface
  - Providers are swappable via environment configuration
  - No vendor lock-in

- **Factory**: `ProviderFactory` manages provider instantiation
  - Singleton pattern for resource efficiency
  - Lazy loading for better startup performance
  - Dynamic imports to reduce bundle size

## Current Providers

### LLM Providers
- ✅ OpenAI (GPT-4, GPT-3.5)
- ✅ DeepSeek
- ⏳ Anthropic Claude
- ⏳ Google Gemini
- ⏳ Ollama (local models)

### Embedding Providers
- ✅ OpenAI (text-embedding-3-small/large)
- ⏳ Cohere
- ⏳ HuggingFace

### Vector Stores
- ✅ Supabase (pgvector)
- ⏳ Pinecone
- ⏳ Qdrant
- ⏳ Weaviate

### Databases
- ⏳ Supabase (PostgreSQL)
- ⏳ PostgreSQL (direct)

## Development

### Code Style

- ESM modules (not CommonJS)
- Strict TypeScript
- Async/await (no callbacks)
- Error handling with try/catch
- Interface-driven design

### Best Practices

1. **Always validate environment variables** using Zod schemas
2. **Implement full interface contracts** - no partial implementations
3. **Handle errors gracefully** - wrap provider errors with context
4. **Use dependency injection** - accept `Env` in constructors
5. **Write tests** for new providers

## License

MIT
