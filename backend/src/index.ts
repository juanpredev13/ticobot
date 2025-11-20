/**
 * TicoBot Backend Entry Point
 */

import { ProviderFactory } from './factory/ProviderFactory.js';
import { env } from './config/env.js';

async function main() {
  console.log('🚀 TicoBot Backend Starting...');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`LLM Provider: ${env.LLM_PROVIDER}`);
  console.log(`Embedding Provider: ${env.EMBEDDING_PROVIDER}`);
  console.log(`Vector Store: ${env.VECTOR_STORE}`);
  console.log(`Database Provider: ${env.DATABASE_PROVIDER}`);

  try {
    // Test provider initialization
    console.log('\n✅ Provider abstraction layer ready!');
    console.log('   Run your application logic here...');
  } catch (error) {
    console.error('❌ Failed to initialize providers:', error);
    process.exit(1);
  }
}

main();
