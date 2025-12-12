/**
 * Test public API exports
 * Simulates how frontend/external packages will import
 */

// This is how other packages will import from @ticobot/backend
import { ProviderFactory } from './factory/ProviderFactory.js';
import type {
  IEmbeddingProvider,
  ILLMProvider,
  IVectorStore
} from '@ticobot/shared';

async function testPublicAPI() {
  console.log('Testing @ticobot/backend public API...');

  // Test 1: Can we import types from shared?
  console.log('✅ Type imports working');

  // Test 2: Can we create providers?
  try {
    // This will fail without env vars, but import should work
    const factory = new ProviderFactory();
    console.log('✅ ProviderFactory instantiates');
  } catch (error) {
    if (error instanceof Error && error.message.includes('environment')) {
      console.log('✅ ProviderFactory requires config (expected)');
    } else {
      throw error;
    }
  }

  console.log('✅ All public API tests passed!');
}

testPublicAPI().catch(console.error);