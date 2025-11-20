/**
 * Test file to verify folder structure and imports
 */

// Test provider imports
import { ProviderFactory } from './factory/ProviderFactory';
import { OpenAIEmbeddingProvider } from './providers/embedding/OpenAIEmbeddingProvider';
import { OpenAILLMProvider } from './providers/llm/OpenAILLMProvider';
import { SupabaseVectorStore } from './providers/vector/SupabaseVectorStore';

// Test config import
import { env, validateEnv } from './config/env';

// Test new module imports (should work even if empty)
import * as ingest from './ingest';
import * as rag from './rag';
import * as db from './db';
import * as api from './api';

console.log('✅ All imports successful!');
console.log('✅ Folder structure is correct!');

// Test that modules exist
console.log('Modules loaded:', {
  factory: typeof ProviderFactory,
  embedding: typeof OpenAIEmbeddingProvider,
  llm: typeof OpenAILLMProvider,
  vectorStore: typeof SupabaseVectorStore,
  env: typeof env,
  validateEnv: typeof validateEnv,
  ingest: typeof ingest,
  rag: typeof rag,
  db: typeof db,
  api: typeof api,
});