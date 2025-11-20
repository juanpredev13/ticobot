/**
 * Test file to verify folder structure and imports
 */

// Test provider imports
import { ProviderFactory } from '../../src/factory/ProviderFactory';
import { OpenAIEmbeddingProvider } from '../../src/providers/embedding/OpenAIEmbeddingProvider';
import { OpenAILLMProvider } from '../../src/providers/llm/OpenAILLMProvider';
import { SupabaseVectorStore } from '../../src/providers/vector/SupabaseVectorStore';

// Test config import
import { env, validateEnv } from '../../src/config/env';

// Test new module imports (should work even if empty)
import * as ingest from '../../src/ingest';
import * as rag from '../../src/rag';
import * as db from '../../src/db';
import * as api from '../../src/api';

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