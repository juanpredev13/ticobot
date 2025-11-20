import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderFactory } from './ProviderFactory.js';

describe('ProviderFactory', () => {
  beforeEach(() => {
    // Reset singleton instances before each test
    ProviderFactory.resetInstances();
  });

  describe('Environment-based provider selection', () => {
    it('should select OpenAI LLM when LLM_PROVIDER=openai', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';

      const provider = await ProviderFactory.getLLMProvider();
      expect(provider.getModelName()).toContain('gpt');
    });

    it('should select DeepSeek LLM when LLM_PROVIDER=deepseek', async () => {
      process.env.LLM_PROVIDER = 'deepseek';
      process.env.DEEPSEEK_API_KEY = 'test-key';

      const provider = await ProviderFactory.getLLMProvider();
      expect(provider.getModelName()).toContain('deepseek');
    });

    it('should throw error when provider is not implemented', async () => {
      process.env.LLM_PROVIDER = 'anthropic';

      await expect(ProviderFactory.getLLMProvider()).rejects.toThrow(
        'Anthropic LLM provider not yet implemented'
      );
    });
  });

  describe('Singleton pattern', () => {
    it('should return same instance on subsequent calls', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';

      const provider1 = await ProviderFactory.getLLMProvider();
      const provider2 = await ProviderFactory.getLLMProvider();

      expect(provider1).toBe(provider2);
    });

    it('should return new instance after reset', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';

      const provider1 = await ProviderFactory.getLLMProvider();
      ProviderFactory.resetInstances();
      const provider2 = await ProviderFactory.getLLMProvider();

      expect(provider1).not.toBe(provider2);
    });
  });

  describe('Provider validation', () => {
    it('should throw error when API key is missing', async () => {
      process.env.LLM_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;

      await expect(ProviderFactory.getLLMProvider()).rejects.toThrow(
        'OPENAI_API_KEY is required'
      );
    });
  });
});
