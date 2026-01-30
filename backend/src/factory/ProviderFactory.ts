import type {
  IEmbeddingProvider,
  IVectorStore,
  ILLMProvider,
  IDatabaseProvider,
} from '@ticobot/shared';
import { env } from '../config/env.js';

/**
 * Provider Factory using Factory Pattern
 * Instantiates providers based on environment configuration
 */
export class ProviderFactory {
  private static embeddingProviderInstance: IEmbeddingProvider | null = null;
  private static vectorStoreInstance: IVectorStore | null = null;
  private static llmProviderInstance: ILLMProvider | null = null;
  private static databaseProviderInstance: IDatabaseProvider | null = null;

  /**
   * Get embedding provider based on configuration
   * Uses singleton pattern to reuse instances
   */
  static async getEmbeddingProvider(): Promise<IEmbeddingProvider> {
    if (this.embeddingProviderInstance) {
      return this.embeddingProviderInstance;
    }

    switch (env.EMBEDDING_PROVIDER) {
      case 'openai': {
        const { OpenAIEmbeddingProvider } = await import('../providers/embedding/OpenAIEmbeddingProvider.js');
        this.embeddingProviderInstance = new OpenAIEmbeddingProvider(env);
        return this.embeddingProviderInstance;
      }
      case 'cohere':
        throw new Error('Cohere embedding provider not yet implemented');
      case 'huggingface':
        throw new Error('HuggingFace embedding provider not yet implemented');
      default:
        throw new Error(`Unknown embedding provider: ${env.EMBEDDING_PROVIDER}`);
    }
  }

  /**
   * Get vector store based on configuration
   */
  static async getVectorStore(): Promise<IVectorStore> {
    if (this.vectorStoreInstance) {
      return this.vectorStoreInstance;
    }

    switch (env.VECTOR_STORE) {
      case 'supabase': {
        const { SupabaseVectorStore } = await import('../providers/vector/SupabaseVectorStore.js');
        this.vectorStoreInstance = new SupabaseVectorStore(env);
        return this.vectorStoreInstance;
      }
      case 'pinecone':
        throw new Error('Pinecone vector store not yet implemented');
      case 'qdrant':
        throw new Error('Qdrant vector store not yet implemented');
      case 'weaviate':
        throw new Error('Weaviate vector store not yet implemented');
      default:
        throw new Error(`Unknown vector store: ${env.VECTOR_STORE}`);
    }
  }

  /**
   * Get LLM provider based on configuration
   */
  static async getLLMProvider(): Promise<ILLMProvider> {
    if (this.llmProviderInstance) {
      return this.llmProviderInstance;
    }

    switch (env.LLM_PROVIDER) {
      case 'openai': {
        const { OpenAILLMProvider } = await import('../providers/llm/OpenAILLMProvider.js');
        this.llmProviderInstance = new OpenAILLMProvider(env);
        return this.llmProviderInstance;
      }
      case 'deepseek': {
        const { DeepSeekLLMProvider } = await import('../providers/llm/DeepSeekLLMProvider.js');
        this.llmProviderInstance = new DeepSeekLLMProvider(env);
        return this.llmProviderInstance;
      }
      case 'anthropic':
        throw new Error('Anthropic LLM provider not yet implemented');
      case 'google':
        throw new Error('Google LLM provider not yet implemented');
      case 'ollama': {
        const { OllamaLLMProvider } = await import('../providers/llm/OllamaLLMProvider.js');
        this.llmProviderInstance = new OllamaLLMProvider(env);
        return this.llmProviderInstance;
      }
      default:
        throw new Error(`Unknown LLM provider: ${env.LLM_PROVIDER}`);
    }
  }

  /**
   * Get database provider based on configuration
   */
  static getDatabaseProvider(): IDatabaseProvider {
    if (this.databaseProviderInstance) {
      return this.databaseProviderInstance;
    }

    switch (env.DATABASE_PROVIDER) {
      case 'supabase':
        // this.databaseProviderInstance = new SupabaseDatabaseProvider(env);
        throw new Error('Supabase database provider not yet implemented');
      case 'postgresql':
        throw new Error('PostgreSQL database provider not yet implemented');
      default:
        throw new Error(`Unknown database provider: ${env.DATABASE_PROVIDER}`);
    }
  }

  /**
   * Reset all singleton instances (useful for testing)
   */
  static resetInstances(): void {
    this.embeddingProviderInstance = null;
    this.vectorStoreInstance = null;
    this.llmProviderInstance = null;
    this.databaseProviderInstance = null;
  }
}
