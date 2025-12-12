/**
 * Test file to verify folder structure and imports
 */

// Test provider imports
import { ProviderFactory } from './factory/ProviderFactory.js';
import { OpenAIEmbeddingProvider } from './providers/embedding/OpenAIEmbeddingProvider.js';
import { OpenAILLMProvider } from './providers/llm/OpenAILLMProvider.js';
import { SupabaseVectorStore } from './providers/vector/SupabaseVectorStore.js';

// Test config import
import { env, validateEnv } from './config/env.js';

// Test new module imports (should work even if empty)
import * as ingest from './ingest/index.js';
import * as rag from './rag/index.js';
import * as db from './db/index.js';
import * as api from './api/index.js';

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