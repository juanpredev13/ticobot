import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderFactory } from './ProviderFactory.js';
import { env } from '../config/env.js';

/**
 * Check if required API keys are available for testing
 */
function hasRequiredApiKeys(): boolean {
  // Check for LLM provider keys
  if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    return false;
  }
  if (env.LLM_PROVIDER === 'deepseek' && !env.DEEPSEEK_API_KEY) {
    return false;
  }

  // Check for embedding provider keys
  if (env.EMBEDDING_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    return false;
  }

  return true;
}

describe('ProviderFactory', () => {
  beforeEach(() => {
    // Reset singleton instances before each test
    ProviderFactory.resetInstances();
  });

  describe('Singleton pattern', () => {
    it.skipIf(!hasRequiredApiKeys())('should return same instance on subsequent calls', async () => {
      const provider1 = await ProviderFactory.getLLMProvider();
      const provider2 = await ProviderFactory.getLLMProvider();

      expect(provider1).toBe(provider2);
    });

    it.skipIf(!hasRequiredApiKeys())('should return new instance after reset', async () => {
      const provider1 = await ProviderFactory.getLLMProvider();
      ProviderFactory.resetInstances();
      const provider2 = await ProviderFactory.getLLMProvider();

      expect(provider1).not.toBe(provider2);
    });
  });

  describe('Provider initialization', () => {
    it.skipIf(!hasRequiredApiKeys())('should initialize LLM provider based on env', async () => {
      const provider = await ProviderFactory.getLLMProvider();

      expect(provider).toBeDefined();
      expect(provider.getModelName).toBeDefined();
      expect(provider.getContextWindow).toBeDefined();
      expect(provider.supportsFunctionCalling).toBeDefined();
    });

    it.skipIf(!hasRequiredApiKeys())('should initialize embedding provider based on env', async () => {
      const provider = await ProviderFactory.getEmbeddingProvider();

      expect(provider).toBeDefined();
      expect(provider.getDimension).toBeDefined();
      expect(provider.getMaxInputLength).toBeDefined();
      expect(provider.getModelName).toBeDefined();
    });

    it.skip('should initialize vector store based on env (requires Supabase credentials)', async () => {
      const provider = await ProviderFactory.getVectorStore();

      expect(provider).toBeDefined();
      expect(provider.upsert).toBeDefined();
      expect(provider.similaritySearch).toBeDefined();
      expect(provider.delete).toBeDefined();
    });
  });

  describe('Provider interface compliance', () => {
    it.skipIf(!hasRequiredApiKeys())('LLM provider should implement ILLMProvider interface', async () => {
      const llm = await ProviderFactory.getLLMProvider();

      // Check all required methods exist
      expect(typeof llm.generateCompletion).toBe('function');
      expect(typeof llm.generateStreamingCompletion).toBe('function');
      expect(typeof llm.getContextWindow).toBe('function');
      expect(typeof llm.getModelName).toBe('function');
      expect(typeof llm.supportsFunctionCalling).toBe('function');

      // Check methods return expected types
      expect(typeof llm.getContextWindow()).toBe('number');
      expect(typeof llm.getModelName()).toBe('string');
      expect(typeof llm.supportsFunctionCalling()).toBe('boolean');
    });

    it.skipIf(!hasRequiredApiKeys())('Embedding provider should implement IEmbeddingProvider interface', async () => {
      const embedding = await ProviderFactory.getEmbeddingProvider();

      // Check all required methods exist
      expect(typeof embedding.generateEmbedding).toBe('function');
      expect(typeof embedding.generateBatch).toBe('function');
      expect(typeof embedding.getDimension).toBe('function');
      expect(typeof embedding.getMaxInputLength).toBe('function');
      expect(typeof embedding.getModelName).toBe('function');

      // Check methods return expected types
      expect(typeof embedding.getDimension()).toBe('number');
      expect(typeof embedding.getMaxInputLength()).toBe('number');
      expect(typeof embedding.getModelName()).toBe('string');
    });
  });
});
