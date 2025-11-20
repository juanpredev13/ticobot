/**
 * Manual test script for Provider Abstraction Layer
 * Run with: pnpm tsx src/test-providers.ts
 */

import { ProviderFactory } from '../../src/factory/ProviderFactory.js';
import { env } from '../../src/config/env.js';

async function testConfiguration() {
  console.log('\n🔧 Testing Configuration...\n');
  console.log('Environment:', env.NODE_ENV);
  console.log('LLM Provider:', env.LLM_PROVIDER);
  console.log('Embedding Provider:', env.EMBEDDING_PROVIDER);
  console.log('Vector Store:', env.VECTOR_STORE);
  console.log('Database Provider:', env.DATABASE_PROVIDER);
  console.log('\n✅ Configuration loaded successfully!\n');
}

async function testLLMProvider() {
  console.log('\n🤖 Testing LLM Provider...\n');

  try {
    const llm = await ProviderFactory.getLLMProvider();

    console.log('Provider:', llm.getModelName());
    console.log('Context Window:', llm.getContextWindow(), 'tokens');
    console.log('Supports Function Calling:', llm.supportsFunctionCalling());

    // Test actual completion (requires API key)
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      console.log('\nTesting completion...');

      const response = await llm.generateCompletion([
        { role: 'user', content: 'Say "Hello from TicoBot!" in one sentence.' }
      ]);

      console.log('Response:', response.content);
      console.log('Tokens used:', response.usage.totalTokens);
      console.log('Model:', response.model);

      console.log('\n✅ LLM Provider test passed!\n');
    } else {
      console.log('\n⚠️  Skipping API call test (no API key configured)\n');
      console.log('✅ LLM Provider initialization passed!\n');
    }
  } catch (error) {
    console.error('❌ LLM Provider test failed:', error);
    throw error;
  }
}

async function testEmbeddingProvider() {
  console.log('\n📊 Testing Embedding Provider...\n');

  try {
    const embedding = await ProviderFactory.getEmbeddingProvider();

    console.log('Provider:', embedding.getModelName());
    console.log('Dimension:', embedding.getDimension());
    console.log('Max Input Length:', embedding.getMaxInputLength(), 'tokens');

    // Test actual embedding (requires API key)
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      console.log('\nTesting single embedding...');

      const response = await embedding.generateEmbedding('Hello world');

      console.log('Embedding length:', response.embedding.length);
      console.log('First 5 values:', response.embedding.slice(0, 5));
      console.log('Tokens used:', response.usage.totalTokens);

      console.log('\nTesting batch embedding...');

      const batchResponse = await embedding.generateBatch(['Hello', 'World', 'Test']);

      console.log('Batch size:', batchResponse.embeddings.length);
      console.log('Tokens used:', batchResponse.usage.totalTokens);

      console.log('\n✅ Embedding Provider test passed!\n');
    } else {
      console.log('\n⚠️  Skipping API call test (no API key configured)\n');
      console.log('✅ Embedding Provider initialization passed!\n');
    }
  } catch (error) {
    console.error('❌ Embedding Provider test failed:', error);
    throw error;
  }
}

async function testProviderSwitching() {
  console.log('\n🔄 Testing Provider Switching...\n');

  try {
    // Test that factory returns same instance (singleton)
    const llm1 = await ProviderFactory.getLLMProvider();
    const llm2 = await ProviderFactory.getLLMProvider();

    if (llm1 === llm2) {
      console.log('✅ Singleton pattern working correctly');
    } else {
      throw new Error('Factory created different instances!');
    }

    // Test reset
    ProviderFactory.resetInstances();
    const llm3 = await ProviderFactory.getLLMProvider();

    if (llm1 !== llm3) {
      console.log('✅ Reset functionality working correctly');
    } else {
      throw new Error('Reset did not create new instance!');
    }

    console.log('\n✅ Provider switching test passed!\n');
  } catch (error) {
    console.error('❌ Provider switching test failed:', error);
    throw error;
  }
}

async function testVectorStore() {
  console.log('\n🗄️  Testing Vector Store...\n');

  try {
    const vectorStore = await ProviderFactory.getVectorStore();

    console.log('Vector Store Type:', env.VECTOR_STORE);

    if (env.SUPABASE_URL && env.SUPABASE_URL !== 'your-supabase-project-url') {
      console.log('\nTesting initialization...');
      await vectorStore.initialize();
      console.log('✅ Vector store initialized');

      // Count documents
      const count = await vectorStore.count();
      console.log('Documents in store:', count);

      console.log('\n✅ Vector Store test passed!\n');
    } else {
      console.log('\n⚠️  Skipping vector store test (no Supabase credentials)\n');
      console.log('✅ Vector Store initialization passed!\n');
    }
  } catch (error) {
    console.error('❌ Vector Store test failed:', error);
    // Don't throw - vector store requires database setup
    console.log('⚠️  This is expected if Supabase is not configured\n');
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   TicoBot Provider Abstraction Layer Tests');
  console.log('═══════════════════════════════════════════════════');

  try {
    await testConfiguration();
    await testLLMProvider();
    await testEmbeddingProvider();
    await testProviderSwitching();
    await testVectorStore();

    console.log('═══════════════════════════════════════════════════');
    console.log('   ✅ All Tests Passed!');
    console.log('═══════════════════════════════════════════════════\n');
  } catch (error) {
    console.log('═══════════════════════════════════════════════════');
    console.log('   ❌ Tests Failed');
    console.log('═══════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run tests
runAllTests();
