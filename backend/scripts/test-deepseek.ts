/**
 * Test script to verify DeepSeek configuration
 * Run this before executing the full pre-compute script
 */

import { ProviderFactory } from '../src/factory/ProviderFactory.js';
import { env } from '../src/config/env.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('TestDeepSeek');

async function testDeepSeekConfig() {
  logger.info('🧪 Testing DeepSeek configuration...\n');

  // 1. Check environment variables
  logger.info('1️⃣ Checking environment variables:');
  logger.info(`   LLM_PROVIDER: ${env.LLM_PROVIDER}`);
  logger.info(`   DEEPSEEK_API_KEY: ${env.DEEPSEEK_API_KEY ? '✅ Set (hidden)' : '❌ Not set'}`);
  logger.info(`   DEEPSEEK_BASE_URL: ${env.DEEPSEEK_BASE_URL}`);
  logger.info(`   DEEPSEEK_MODEL: ${env.DEEPSEEK_MODEL}\n`);

  if (env.LLM_PROVIDER !== 'deepseek') {
    logger.warn('⚠️  LLM_PROVIDER is not set to "deepseek"');
    logger.warn('   Current value:', env.LLM_PROVIDER);
    logger.warn('   To use DeepSeek, set LLM_PROVIDER=deepseek in your .env file\n');
  }

  if (!env.DEEPSEEK_API_KEY) {
    logger.error('❌ DEEPSEEK_API_KEY is not configured!');
    logger.error('   Please set it in your .env file:');
    logger.error('   DEEPSEEK_API_KEY=sk-your-api-key-here\n');
    logger.error('   Get your API key at: https://platform.deepseek.com/\n');
    process.exit(1);
  }

  // 2. Test provider initialization
  logger.info('2️⃣ Initializing DeepSeek provider...');
  try {
    const provider = await ProviderFactory.getLLMProvider();

    logger.info(`   ✅ Provider initialized: ${provider.getModelName()}`);
    logger.info(`   Context window: ${provider.getContextWindow()} tokens`);
    logger.info(`   Supports function calling: ${provider.supportsFunctionCalling()}\n`);
  } catch (error) {
    logger.error('❌ Failed to initialize provider:', error);
    process.exit(1);
  }

  // 3. Test API connection with a simple completion
  logger.info('3️⃣ Testing API connection with a simple completion...');
  try {
    const provider = await ProviderFactory.getLLMProvider();

    const startTime = Date.now();
    const response = await provider.generateCompletion(
      [
        {
          role: 'user',
          content: 'Di "Hola" en una sola palabra.',
        },
      ],
      {
        temperature: 0.7,
        maxTokens: 50,
      }
    );

    const elapsed = Date.now() - startTime;

    logger.info(`   ✅ API call successful!`);
    logger.info(`   Response: "${response.content.trim()}"`);
    logger.info(`   Model: ${response.model}`);
    logger.info(`   Tokens: ${response.usage.totalTokens} (prompt: ${response.usage.promptTokens}, completion: ${response.usage.completionTokens})`);
    logger.info(`   Time: ${elapsed}ms`);
    logger.info(`   Finish reason: ${response.finishReason}\n`);
  } catch (error) {
    logger.error('❌ API call failed:', error);
    logger.error('\nPossible issues:');
    logger.error('  - Invalid API key');
    logger.error('  - Network connectivity problems');
    logger.error('  - DeepSeek API is down');
    logger.error('  - Rate limit exceeded\n');
    process.exit(1);
  }

  // 4. Test with a more complex prompt (similar to comparisons)
  logger.info('4️⃣ Testing with a comparison-like prompt...');
  try {
    const provider = await ProviderFactory.getLLMProvider();

    const startTime = Date.now();
    const response = await provider.generateCompletion(
      [
        {
          role: 'system',
          content: 'Eres un asistente que analiza propuestas políticas de Costa Rica.',
        },
        {
          role: 'user',
          content: 'Resume en 2 líneas qué debería incluir un plan de gobierno sobre educación.',
        },
      ],
      {
        temperature: 0.7,
        maxTokens: 200,
      }
    );

    const elapsed = Date.now() - startTime;

    logger.info(`   ✅ Complex prompt successful!`);
    logger.info(`   Response length: ${response.content.length} characters`);
    logger.info(`   Tokens used: ${response.usage.totalTokens}`);
    logger.info(`   Time: ${elapsed}ms`);
    logger.info(`\n   Sample response:\n   ${response.content.trim().split('\n').join('\n   ')}\n`);
  } catch (error) {
    logger.error('❌ Complex prompt failed:', error);
    process.exit(1);
  }

  // 5. Estimate cost for pre-compute
  logger.info('5️⃣ Cost estimation for pre-compute:');
  const avgTokensPerComparison = 1500;
  const totalComparisons = 80;
  const totalTokens = avgTokensPerComparison * totalComparisons;

  // DeepSeek pricing (as of late 2024)
  const inputCostPer1M = 0.27; // $0.27 per 1M input tokens
  const outputCostPer1M = 1.10; // $1.10 per 1M output tokens

  // Assume 70% input, 30% output
  const inputTokens = totalTokens * 0.7;
  const outputTokens = totalTokens * 0.3;

  const estimatedCost =
    (inputTokens / 1_000_000) * inputCostPer1M +
    (outputTokens / 1_000_000) * outputCostPer1M;

  logger.info(`   Total comparisons: ${totalComparisons}`);
  logger.info(`   Estimated tokens: ~${totalTokens.toLocaleString()}`);
  logger.info(`   Estimated cost: ~$${estimatedCost.toFixed(4)} USD`);
  logger.info(`   Estimated time: ~40-60 minutes\n`);

  // Final summary
  logger.info('✅ All tests passed! DeepSeek is configured correctly.');
  logger.info('\nYou can now run the pre-compute script:');
  logger.info('   pnpm --filter backend run precompute:comparisons\n');
}

// Run tests
try {
  await testDeepSeekConfig();
} catch (error) {
  logger.error('Fatal error:', error);
  process.exit(1);
}
