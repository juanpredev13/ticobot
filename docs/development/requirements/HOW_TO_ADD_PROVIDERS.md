# How to Add New Providers

This guide explains how to add new providers (LLM, embedding, vector store, or database) to TicoBot.

## Overview

TicoBot uses the **Provider Abstraction Layer** pattern to allow easy switching between different AI services, databases, and vector stores without changing application code.

## Adding a New LLM Provider

### Example: Adding Anthropic Claude

#### 1. Update Environment Configuration

Edit `backend/src/config/env.ts`:

```typescript
// Add to the LLM_PROVIDER enum
LLM_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'ollama', 'deepseek']).default('openai'),

// Add configuration variables
ANTHROPIC_API_KEY: z.string().optional(),
ANTHROPIC_MODEL: z.string().default('claude-3-sonnet-20240229'),
```

#### 2. Create the Provider Implementation

Create `backend/src/providers/llm/AnthropicLLMProvider.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type {
  ILLMProvider,
  LLMMessage,
  GenerationOptions,
  LLMResponse,
} from '@ticobot/shared';
import type { Env } from '../../config/env.js';

export class AnthropicLLMProvider implements ILLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(env: Env) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });

    this.model = env.ANTHROPIC_MODEL;
  }

  async generateCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): Promise<LLMResponse> {
    // Implementation using Anthropic SDK
    const response = await this.client.messages.create({
      model: this.model,
      messages: messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content,
      })),
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature,
    });

    return {
      content: response.content[0].text,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
    };
  }

  async *generateStreamingCompletion(
    messages: LLMMessage[],
    options?: GenerationOptions
  ): AsyncIterableIterator<string> {
    // Streaming implementation
    const stream = await this.client.messages.stream({
      model: this.model,
      messages: messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content,
      })),
      max_tokens: options?.maxTokens || 4096,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  getContextWindow(): number {
    return 200000; // Claude 3 context window
  }

  getModelName(): string {
    return this.model;
  }

  supportsFunctionCalling(): boolean {
    return true;
  }
}
```

#### 3. Register in Factory

Edit `backend/src/factory/ProviderFactory.ts`:

```typescript
static async getLLMProvider(): Promise<ILLMProvider> {
  // ... existing code ...

  switch (env.LLM_PROVIDER) {
    case 'anthropic': {
      const { AnthropicLLMProvider } = await import('../providers/llm/AnthropicLLMProvider.js');
      this.llmProviderInstance = new AnthropicLLMProvider(env);
      return this.llmProviderInstance;
    }
    // ... other cases ...
  }
}
```

#### 4. Install Dependencies

```bash
pnpm --filter backend add @anthropic-ai/sdk
```

#### 5. Update .env.example

```bash
# Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

#### 6. Use the New Provider

Update your `.env` file:

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

That's it! The application will now use Anthropic Claude instead of OpenAI.

## Adding Other Provider Types

### Embedding Provider

1. Implement `IEmbeddingProvider` interface
2. Create file in `backend/src/providers/embedding/`
3. Update `ProviderFactory.getEmbeddingProvider()`
4. Update environment configuration

### Vector Store Provider

1. Implement `IVectorStore` interface
2. Create file in `backend/src/providers/vector/`
3. Update `ProviderFactory.getVectorStore()`
4. May require database migrations

### Database Provider

1. Implement `IDatabaseProvider` interface
2. Create file in `backend/src/providers/database/`
3. Update `ProviderFactory.getDatabaseProvider()`
4. May require schema setup

## Testing Your Provider

Create a test file in `backend/src/providers/<type>/<YourProvider>.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { YourProvider } from './YourProvider.js';

describe('YourProvider', () => {
  it('should initialize correctly', () => {
    const provider = new YourProvider(mockEnv);
    expect(provider).toBeDefined();
  });

  // Add more tests
});
```

## Key Principles

1. **Interface Compliance**: Always implement the full interface contract
2. **Error Handling**: Wrap provider-specific errors with clear messages
3. **Configuration**: Use environment variables for API keys and settings
4. **Lazy Loading**: Use dynamic imports in the factory for better performance
5. **Type Safety**: Maintain strict TypeScript types throughout

## Current Providers

### LLM Providers
- ✅ OpenAI (GPT-4, GPT-3.5)
- ✅ DeepSeek
- ⏳ Anthropic Claude
- ⏳ Google Gemini
- ⏳ Ollama (local)

### Embedding Providers
- ✅ OpenAI
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
